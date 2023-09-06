import Integration from '../../src/classes/integration';
import {AutomationExecution} from '@tunnelhub/sdk';
import AutomationLog from '@tunnelhub/sdk/src/classes/logs/automationLog';
import {NoDeltaIntegrationFlow} from '@tunnelhub/sdk/src/classes/flows/noDeltaIntegrationFlow';

describe('test src/integration', () => {
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


        const updateExecutionStatisticsFunc = jest.spyOn(NoDeltaIntegrationFlow.prototype as any, 'updateExecutionStatistics');
        updateExecutionStatisticsFunc.mockImplementation(() => {
        });

        const updateMetadata = jest.spyOn(NoDeltaIntegrationFlow.prototype as any, 'updateMetadata');
        updateMetadata.mockImplementation(() => {
        });
    });

    test('successfully test', async () => {
        const integration = new Integration({}, {});
        await expect(integration.doIntegration(undefined)).resolves.not.toThrow();
        expect(integration.hasAnyErrors()).toBeFalsy();
    });
});