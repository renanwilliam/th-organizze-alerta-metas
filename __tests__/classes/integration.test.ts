import Integration from '../../src/classes/integration';
import {AutomationExecution} from '@tunnelhub/sdk';
import AutomationLog from '@tunnelhub/sdk/src/classes/logs/automationLog';
import {NoDeltaIntegrationFlow} from '@tunnelhub/sdk/src/classes/flows/noDeltaIntegrationFlow';
import * as dotenv from 'dotenv';
import type {BatchWriteCommandOutput} from '@aws-sdk/lib-dynamodb';


describe('test src/integration', () => {
    dotenv.config();
    jest.setTimeout(99999999);

    beforeAll(() => {
        /**
         * The code below is mandatory to avoid TunnelHub SDK making external calls trying to persist logs
         * You can make this mock using the same code with any IntegrationFlow at @tunnelhub/sdk/classes/flows
         */
        const persistLambdaContextFunc = jest.spyOn(AutomationExecution as any, 'persistLambdaContext');
        persistLambdaContextFunc.mockImplementation(() => {
        });

        const persistLogsFunc = jest.spyOn(AutomationLog.prototype as any, 'save');
        persistLogsFunc.mockImplementation(() => {
        });

        const persistLogsFuncBatch = jest.spyOn(AutomationLog, 'saveInDynamoDB');
        persistLogsFuncBatch.mockResolvedValue({} as BatchWriteCommandOutput);

        const updateExecutionStatisticsFunc = jest.spyOn(NoDeltaIntegrationFlow.prototype as any, 'updateExecutionStatistics');
        updateExecutionStatisticsFunc.mockImplementation(() => {
        });

        const updateMetadata = jest.spyOn(NoDeltaIntegrationFlow.prototype as any, 'updateMetadata');
        updateMetadata.mockImplementation(() => {
        });
    });

    test('successfully test', async () => {
        const integration = new Integration({
            parameters: {
                "custom": [
                    {
                        "name": "TELEGRAM_TOKEN",
                        "value": process.env.TELEGRAM_TOKEN
                    },
                    {
                        "name": "TELEGRAM_CHAT_ID",
                        "value": process.env.TELEGRAM_CHAT_ID
                    },
                    {
                        "name": "API_KEY_OPENAI",
                        "value": process.env.API_KEY_OPENAI
                    }
                ]
            },
            systems: [
                {
                    "internalName": "ORGANIZZE",
                    "parameters": {
                        "password": process.env.ORGANIZZE_PASSWORD,
                        "authType": "BASIC",
                        "user": process.env.ORGANIZZE_USER,
                        "url": "https://api.organizze.com.br/rest/v2"
                    },
                    "type": "HTTP"
                }
            ]
        }, {});
        await expect(integration.doIntegration(undefined)).resolves.not.toThrow();
        expect(integration.hasAnyErrors()).toBeFalsy();
    });
});