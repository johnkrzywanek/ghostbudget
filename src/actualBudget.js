require('dotenv').config();
const api = require('@actual-app/api');
const logger = require('./logger');

async function getAccountBalances() {
  try {
    // Verify required environment variables
    const requiredEnvVars = ['ACTUAL_BUDGET_URL', 'ACTUAL_BUDGET_PASS', 'ACTUAL_BUDGET_SYNC_ID'];
    const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    logger.debug('Initializing Actual Budget API...', {
      serverURL: process.env.ACTUAL_BUDGET_URL,
      syncId: process.env.ACTUAL_BUDGET_SYNC_ID,
    });

    // Initialize the Actual API client
    await api.init({
      dataDir: process.env.ACTUAL_BUDGET_DATA_DIR,
      serverURL: process.env.ACTUAL_BUDGET_URL,
      password: process.env.ACTUAL_BUDGET_PASS,
    });

    logger.info('Successfully connected to Actual Budget server');

    logger.debug('Downloading budget data...');
    await api.downloadBudget(process.env.ACTUAL_BUDGET_SYNC_ID);
    logger.debug('Budget data downloaded successfully');

    // Get all accounts
    logger.debug('Fetching accounts...');
    const accounts = await api.getAccounts();
    logger.info(`Found ${accounts.length} accounts`);

    // Get balances for all accounts
    logger.debug('Fetching account balances...');
    const balances = await Promise.all(
      accounts.map(async (account) => {
        const balance = await api.getAccountBalance(account.id);
        return {
          name: account.name,
          balance: balance,
          type: account.type,
        };
      })
    );

    // Log the results
    logger.info('Account Balances:', {
      balances: balances.map((account) => ({
        name: account.name,
        type: account.type,
        balance: `$${account.balance.toFixed(2)}`,
      })),
    });

    // Close the connection
    await api.shutdown();
    logger.debug('Connection closed successfully');
    return balances;
  } catch (error) {
    logger.error('Error fetching account balances:', {
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code,
      },
    });

    if (error.message.includes('Could not get remote files')) {
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

module.exports = {
  getAccountBalances,
};
