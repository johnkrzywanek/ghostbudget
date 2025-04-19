const {getAccountBalances} = require('./actualBudget');
const ghostfolio = require('./ghostfolio');

async function syncBalances() {
    try {
        // 1. Get balances from Actual Budget
        const actualBalances = await getAccountBalances();
        if (!actualBalances) {
            throw new Error('Failed to get balances from Actual Budget');
        }

        // 2-5. Sync balances to Ghostfolio
        await ghostfolio.syncAccountBalances(actualBalances);

        console.log('Successfully completed balance sync');
    } catch (error) {
        console.error('Failed to sync balances:', error.message);
        process.exit(1);
    }
}

syncBalances();
