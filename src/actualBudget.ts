import api from '@actual-app/api';
import logger from './logger';
import { AccountBalance } from './types';

export async function getAccountBalances(): Promise<AccountBalance[] | undefined> {
    try {
        const requiredEnvVars = ['ACTUAL_BUDGET_URL', 'ACTUAL_BUDGET_PASS', 'ACTUAL_BUDGET_SYNC_ID'];
        const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

        if (missingVars.length > 0) {
            throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
        }

        logger.debug('Initializing Actual Budget API...', {
            serverURL: process.env.ACTUAL_BUDGET_URL!.replace(/\/$/, ''),
            syncId: process.env.ACTUAL_BUDGET_SYNC_ID,
        });

        await api.init({
            dataDir: process.env.ACTUAL_BUDGET_DATA_DIR,
            serverURL: process.env.ACTUAL_BUDGET_URL!.replace(/\/$/, ''),
            password: process.env.ACTUAL_BUDGET_PASS!,
        });

        logger.info('Successfully connected to Actual Budget server');

        logger.debug('Downloading budget data...');
        await api.downloadBudget(process.env.ACTUAL_BUDGET_SYNC_ID!);
        logger.debug('Budget data downloaded successfully');

        logger.debug('Fetching accounts...');
        const accounts = await api.getAccounts();
        logger.info(`Found ${accounts.length} accounts`);

        logger.debug('Fetching account balances...');
        const balances = await Promise.all(
            accounts.map(async (account) => {
                const balance = await api.getAccountBalance(account.id);
                return {
                    name: account.name,
                    balance,
                };
            })
        );

        logger.info('Account Balances:', {
            balances: balances.map((account) => ({
                name: account.name,
                balance: `$${account.balance.toFixed(2)}`,
            })),
        });

        await api.shutdown();
        logger.debug('Connection closed successfully');
        return balances;
    } catch (error) {
        logger.error('Error fetching account balances:', {
            error: {
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                code: (error as any).code,
            },
        });

        if (error instanceof Error && error.message.includes('Could not get remote files')) {
            logger.error('Troubleshooting tips:', {
                tips: [
                    `Verify your Actual Budget server is running at: ${process.env.ACTUAL_BUDGET_URL}`,
                    'Check if your sync ID is correct',
                    'Ensure your password is correct',
                    'Verify your Actual Budget server version is compatible with this API version',
                ],
            });
        }
    }
}
