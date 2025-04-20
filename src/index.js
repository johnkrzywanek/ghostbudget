const {getAccountBalances} = require('./actualBudget');
const ghostfolio = require('./ghostfolio');
const logger = require('./logger');

async function sync() {
    try {
        logger.info('Starting sync process...');

        // Get balances from Actual Budget
        logger.info('Fetching balances from Actual Budget...');
        const balances = await getAccountBalances();

        if (!balances || balances.length === 0) {
            logger.error('No balances received from Actual Budget');
            process.exit(1);
        }

        logger.info(`Found ${balances.length} accounts in Actual Budget`);

        // Sync balances to Ghostfolio
        logger.info('Syncing balances to Ghostfolio...');
        await ghostfolio.syncAccountBalances(balances);

        logger.info('Sync completed successfully!');
    } catch (error) {
        logger.error('Sync failed:', {error: error.message, stack: error.stack});
        process.exit(1);
    }
}

// Run sync if this file is run directly
if (require.main === module) {
    sync();
}

module.exports = {sync};
