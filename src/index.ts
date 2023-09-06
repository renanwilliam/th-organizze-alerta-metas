import {AutomationExecution} from '@tunnelhub/sdk';
import {ProxyResult} from 'aws-lambda';
import Integration from './classes/integration';


/**
 * This is our entry point for start automation executing.
 * You can personalize the success and error messages according your needs
 * It is mandatory execute the AutomationExecution.executeAutomation method
 *
 * @param event
 * @param context
 */
export const handler = async (event: any, context: any): Promise<ProxyResult> => {
    const execution = new Integration(event, context);
    await AutomationExecution.executeAutomation(execution);

    if (execution.hasAnyErrors()) {
        throw Error('Error!');
    }
    return {
        statusCode: 200,
        body: 'Automation executed with no errors!',
    };
};