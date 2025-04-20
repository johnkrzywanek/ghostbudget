require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class GhostfolioAPI {
    constructor() {
        this.baseURL = process.env.GHOSTFOLIO_URL;
        this.accessToken = null;
        this.configPath = path.join(__dirname, '..', 'config.json');
    }

    async authenticate() {
        try {
            if (!process.env.GHOSTFOLIO_TOKEN) {
                throw new Error('Missing GHOSTFOLIO_TOKEN environment variable');
            }

            logger.debug('Authenticating with Ghostfolio...');
            const res = await axios.post(
                `${this.baseURL}/api/v1/auth/anonymous`,
                {
                    accessToken: process.env.GHOSTFOLIO_TOKEN
                }
            );

            this.accessToken = res.data.authToken;
            logger.info('Successfully authenticated with Ghostfolio');
        } catch (error) {
            logger.error('Failed to authenticate with Ghostfolio:', {
                error: {
                    message: error.message,
                    stack: error.stack
                }
            });
            throw error;
        }
    }

    async getGhostfolioAccounts() {
        if (!this.accessToken) {
            throw new Error('Not authenticated. Call authenticate() first');
        }

        try {
            logger.debug('Fetching Ghostfolio accounts...');
            const response = await axios.get(
                `${this.baseURL}/api/v1/account`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                }
            );
            logger.info(`Found ${response.data.accounts.length} Ghostfolio accounts`);
            return response.data.accounts;
        } catch (error) {
            logger.error('Failed to fetch Ghostfolio accounts:', {
                error: {
                    message: error.message,
                    stack: error.stack
                }
            });
            throw error;
        }
    }

    async updateAccountBalance(ghostfolioAccount, actualBudgetBalance) {
        if (!this.accessToken) {
            throw new Error('Not authenticated. Call authenticate() first');
        }

        try {
            const newBalance = actualBudgetBalance / 100;
            logger.debug('Updating account balance:', {
                account: ghostfolioAccount.name,
                oldBalance: ghostfolioAccount.balance,
                newBalance: newBalance
            });

            const updateData = {
                balance: newBalance,
                comment: ghostfolioAccount.comment,
                currency: ghostfolioAccount.currency,
                id: ghostfolioAccount.id,
                isExcluded: ghostfolioAccount.isExcluded,
                name: ghostfolioAccount.name,
                platformId: ghostfolioAccount.platformId
            };

            const response = await axios.put(
                `${this.baseURL}/api/v1/account/${ghostfolioAccount.id}`,
                updateData,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            logger.info(`Successfully updated balance for account ${ghostfolioAccount.name}`);
            return response.data;
        } catch (error) {
            logger.error(`Failed to update balance for account ${ghostfolioAccount.name}:`, {
                error: {
                    message: error.message,
                    stack: error.stack
                }
            });
            throw error;
        }
    }

    async syncAccountBalances(actualBalances) {
        try {
            await this.authenticate();
            const ghostfolioAccounts = await this.getGhostfolioAccounts();

            logger.debug('Reading account mappings from config...');
            const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));

            for (const mapping of config.accounts) {
                const actualAccount = actualBalances.find(acc =>
                    acc.name === mapping.actualBudgetName
                );

                const ghostfolioAccount = ghostfolioAccounts.find(acc =>
                    acc.name === mapping.ghostfolioName
                );

                if (!actualAccount) {
                    logger.warn(`No matching Actual Budget account found for ${mapping.actualBudgetName}`);
                    continue;
                }

                if (!ghostfolioAccount) {
                    logger.warn(`No matching Ghostfolio account found for ${mapping.ghostfolioName}`);
                    continue;
                }

                await this.updateAccountBalance(ghostfolioAccount, actualAccount.balance);
            }

            logger.info('Successfully synced all account balances');
        } catch (error) {
            logger.error('Failed to sync account balances:', {
                error: {
                    message: error.message,
                    stack: error.stack
                }
            });
            throw error;
        }
    }
}

module.exports = new GhostfolioAPI();
