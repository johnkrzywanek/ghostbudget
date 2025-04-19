require('dotenv').config();
const api = require('@actual-app/api');

async function getAccountBalances() {
    try {
        // Verify required environment variables
        const requiredEnvVars = ['ACTUAL_BUDGET_URL', 'ACTUAL_BUDGET_PASS', 'ACTUAL_BUDGET_SYNC_ID'];
        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

        if (missingVars.length > 0) {
            throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
        }

        console.log('Initializing Actual Budget API...');
        console.log('Server URL:', process.env.ACTUAL_BUDGET_URL);
        console.log('Sync ID:', process.env.ACTUAL_BUDGET_SYNC_ID);

        // Initialize the Actual API client
        await api.init({
            // Replace these with your Actual Budget server details
            dataDir: '/Users/dmr/actualbudget/actual-data',
            // This is the URL of your running server
            serverURL: process.env.ACTUAL_BUDGET_URL,
            // This is the password you use to log into the server
            password: process.env.ACTUAL_BUDGET_PASS,
        });

        console.log('Successfully connected to Actual Budget server');

        // Verify sync ID exists
        if (!process.env.ACTUAL_BUDGET_SYNC_ID) {
            throw new Error('ACTUAL_BUDGET_SYNC_ID environment variable is not set');
        }

        console.log('Downloading budget data...');
        await api.downloadBudget(process.env.ACTUAL_BUDGET_SYNC_ID);
        console.log('Budget data downloaded successfully');

        // Get all accounts
        console.log('Fetching accounts...');
        const accounts = await api.getAccounts();
        console.log(`Found ${accounts.length} accounts`);

        // Get balances for all accounts
        console.log('Fetching account balances...');
        const balances = await Promise.all(
            accounts.map(async (account) => {
                const balance = await api.getAccountBalance(account.id);
                return {
                    name: account.name,
                    balance: balance,
                    type: account.type
                };
            })
        );

        // Print the results
        console.log('\nAccount Balances:');
        balances.forEach(account => {
            console.log(`${account.name} (${account.type}): $${account.balance.toFixed(2)}`);
        });

        // Close the connection
        await api.shutdown();
        console.log('Connection closed successfully');
    } catch (error) {
        console.error('Error Details:', {
            message: error.message,
            stack: error.stack,
            code: error.code
        });

        if (error.message.includes('Could not get remote files')) {
            console.error('\nTroubleshooting tips:');
            console.error('1. Verify your Actual Budget server is running at:', process.env.ACTUAL_BUDGET_URL);
            console.error('2. Check if your sync ID is correct');
            console.error('3. Ensure your password is correct');
            console.error('4. Verify your Actual Budget server version is compatible with this API version');
        }
    }
}

// Run the function
getAccountBalances();
