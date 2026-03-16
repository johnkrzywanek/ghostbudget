import { getAccountBalances } from './actualBudget';
import ghostfolio from './ghostfolio';
import logger from './logger';

async function sync(): Promise<void> {
    try {
        logger.info('Starting sync process...');

        logger.info('Fetching balances from Actual Budget...');
        const balances = await getAccountBalances();

        if (!balances || balances.length === 0) {
            logger.error('No balances received from Actual Budget');
            process.exit(1);
        }

        logger.info(`Found ${balances.length} accounts in Actual Budget`);

        logger.info('Syncing balances to Ghostfolio...');
        await ghostfolio.syncAccountBalances(balances);

        logger.info('Sync completed successfully!');
    } catch (error) {
        logger.error('Sync failed:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
        });
        process.exit(1);
    }
}

if (require.main === module) {
    sync();
}

export { sync };
