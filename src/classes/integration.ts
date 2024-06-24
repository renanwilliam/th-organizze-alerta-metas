import {GenericParameter, IntegrationMessageReturnBatch, Metadata} from '@tunnelhub/sdk';
import {TunnelHubSystem} from '@tunnelhub/sdk/src/types/data';
import {IntegrationModel} from '../data';
import createClient from '@botocrat/telegram'
import {NoDeltaBatchIntegrationFlow} from "@tunnelhub/sdk/src/classes/flows/noDeltaBatchIntegrationFlow";
import Organizze from "./organizze";
import {DateTime} from "luxon";
import {OpenAI} from 'openai';

export default class Integration extends NoDeltaBatchIntegrationFlow<IntegrationModel> {
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

    async loadSourceSystemData(): Promise<IntegrationModel[]> {
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
        const openai = new OpenAI({
            apiKey: this.getRequiredParameter(this.parameters, 'API_KEY_OPENAI')
        });

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

        const daysUntilEndOfMonth = DateTime.now().startOf('day').endOf('month').diff(DateTime.now(), 'days');
        const weeksUntilEndOfMonth = DateTime.now().startOf('day').endOf('month').diff(DateTime.now(), 'weeks');

        let message = '';
        for (let i = 0; i < metas.length; i++) {
            const meta = metas[i];
            message +=
                `<b>${meta.nomeMeta}</b> - ${percentageFormatter.format(meta.porcentagem / 100)} \n` +
                ` ├ Meta: ${currencyFormatter.format(meta.planejado / 100)} \n` +
                ` ├ Gasto: ${currencyFormatter.format(meta.gasto / 100)}\n` +
                ` ├ Disponível: \n` +
                ` ├─ Total: ${currencyFormatter.format((meta.planejado - meta.gasto) / 100)} \n` +
                ` ├─ Por semana: ${currencyFormatter.format((meta.planejado - meta.gasto) / (Math.round(weeksUntilEndOfMonth.weeks)) / 100)} \n` +
                ` ├─ Por dia: ${currencyFormatter.format((meta.planejado - meta.gasto) / (Math.round(daysUntilEndOfMonth.days)) / 100)} \n\n`
            ;
        }

        const contexto = `
    Você é um conselheiro financeiro. Dados meus dados abaixo de metas financeiras e realizações dentro desse mês, quero que você me forneça uma mensagem diária resumida dado meu progresso, com pontos de atenção e sugestões com contexto dentro da categoria. Por exemplo: se estiver muito gastos em restaurantes e saldo sobrando em mercado, faça a sugestão de comer mais em casa. Seja objetivo.
    `;

        const prompt = `
    Contexto: ${contexto}
    Gastos: 
    ${message}
    `;

        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{role: "user", content: prompt}],
            });

            const chatGptResponse = response.choices[0].message.content;

            await client.sendMessage({
                chat_id: this.TELEGRAM_CHAT_ID,
                text: chatGptResponse,
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

    private getRequiredParameter(parameters: { custom: GenericParameter[] }, parameterName: string): string {
        const param = this.getParameter(parameters, parameterName);
        if (!param) {
            throw new Error(`O parâmetro ${parameterName} é obrigatório`);
        }
        return param;
    }

    private getParameter(parameters: { custom: GenericParameter[] }, parameterName: string): string | null {
        return parameters?.custom?.find(param => param.name === parameterName)?.value;
    }

    private getIntegrationRequiredParameter(paramName: string): string {
        const value = this.parameters?.custom?.find(param => param.name === paramName);
        if (value) {
            return value.value;
        }
        throw new Error(`O parâmetro ${paramName} precisa estar cadastrado na automação`);
    }
}
