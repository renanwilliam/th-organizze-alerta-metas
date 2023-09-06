import {GenericParameter, IntegrationMessageReturnBatch, Metadata} from '@tunnelhub/sdk';
import {TunnelHubSystem} from '@tunnelhub/sdk/src/types/data';
import {IntegrationModel} from '../data';
import createClient from '@botocrat/telegram'
import {NoDeltaBatchIntegrationFlow} from "@tunnelhub/sdk/src/classes/flows/noDeltaBatchIntegrationFlow";
import Organizze from "./organizze";

export default class Integration extends NoDeltaBatchIntegrationFlow {
    private readonly TELEGRAM_TOKEN: string;
    private readonly TELEGRAM_CHAT_ID: string;
    private readonly parameters: { custom: GenericParameter[] };
    private readonly systems: TunnelHubSystem[];
    private readonly organizze: Organizze;

    constructor(event: any, context: any) {
        super(event, context);
        this.systems = event.systems ?? [];
        this.parameters = event.parameters ?? {};
        this.packageSize = Number.MAX_SAFE_INTEGER;

        this.TELEGRAM_TOKEN = this.getIntegrationRequiredParameter('TELEGRAM_TOKEN');
        this.TELEGRAM_CHAT_ID = this.getIntegrationRequiredParameter('TELEGRAM_CHAT_ID');

        const organizzeSystem = this.systems.find(value => value.internalName === 'ORGANIZZE');
        if (!organizzeSystem || organizzeSystem.type !== 'HTTP' || organizzeSystem.parameters.authType !== 'BASIC') {
            throw new Error(`O sistema ORGANIZZE precisa ser do tipo HTTP com autorização Basic`);
        }
        this.organizze = new Organizze(
            organizzeSystem.parameters.url,
            organizzeSystem.parameters.user,
            organizzeSystem.parameters.password,
        )
    }

    /* istanbul ignore next */
    defineMetadata(): Metadata[] {
        return [
            {
                fieldName: 'nomeMeta',
                fieldLabel: 'Nome da meta',
                fieldType: 'TEXT',
            },
            {
                fieldName: 'planejado',
                fieldLabel: 'Valor planejado',
                fieldType: 'NUMBER',
            },
            {
                fieldName: 'gasto',
                fieldLabel: 'Valor Gasto',
                fieldType: 'NUMBER',
            },
            {
                fieldName: 'porcentagem',
                fieldLabel: 'Porcenatgem',
                fieldType: 'NUMBER',
            },
        ];
    }

    async loadSourceSystemData(payload?: any): Promise<IntegrationModel[]> {
        const categories = await this.organizze.getCategories();
        const budgets = await this.organizze.getBudgets();

        budgets.sort((a, b) => {
            const categoryA = categories.find(value => value.id === a.category_id);
            const categoryB = categories.find(value => value.id === b.category_id);
            if (categoryA!.name > categoryB!.name) return 1;
            if (categoryA!.name < categoryB!.name) return -1;
            return 0;
        })

        return budgets.map(meta => {
            const category = categories.find(value => value.id === meta.category_id);
            return {
                nomeMeta: category.name,
                planejado: meta.amount_in_cents,
                gasto: meta.predicted_total,
                porcentagem: parseFloat(meta.percentage)
            }
        });
    }

    async sendDataInBatch(metas: IntegrationModel[]): Promise<IntegrationMessageReturnBatch[]> {
        const client = createClient({token: this.TELEGRAM_TOKEN})
        let currencyFormatter = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        });
        const percentageFormatter = new Intl.NumberFormat('pt-BR', {
            style: 'percent',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        })

        let message = '';
        for (let i = 0; i < metas.length; i++) {
            const meta = metas[i];
            message +=
                `<b>${meta.nomeMeta}</b> - ${percentageFormatter.format(meta.porcentagem / 100)} \n` +
                ` ├ Meta: ${currencyFormatter.format(meta.planejado / 100)} \n` +
                ` ├ Gasto: ${currencyFormatter.format(meta.gasto / 100)}\n`;
        }

        try {
            await client.sendMessage({
                chat_id: this.TELEGRAM_CHAT_ID,
                text: message,
                // @ts-ignore
                parse_mode: 'HTML'
            });
            return metas.map(() => ({
                status: 'SUCCESS',
                data: {},
                message: 'Meta enviada',
            }));
        } catch (e) {
            return metas.map(() => ({
                status: 'FAIL',
                data: {},
                message: e.message,
            }));
        }
    }

    private getIntegrationRequiredParameter(paramName: string): string {
        const value = this.parameters?.custom?.find(param => param.name === paramName);
        if (value) {
            return value.value;
        }
        throw new Error(`O parâmetro ${paramName} precisa estar cadastrado na automação`);
    }
}
