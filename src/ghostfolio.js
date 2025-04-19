require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

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

            const res = await axios.post(
                `${this.baseURL}/api/v1/auth/anonymous`,
                {
                    accessToken: process.env.GHOSTFOLIO_TOKEN
                }
            );

            this.accessToken = res.data.authToken;
            console.log('Successfully authenticated with Ghostfolio');
        } catch (error) {
            console.error('Failed to authenticate with Ghostfolio:', error.message);
            throw error;
        }
    }

    async getGhostfolioAccounts() {
        if (!this.accessToken) {
            throw new Error('Not authenticated. Call authenticate() first');
        }

        try {
            const response = await axios.get(
                `${this.baseURL}/api/v1/account`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                }
            );
            return response.data.accounts;
        } catch (error) {
            console.error('Failed to fetch Ghostfolio accounts:', error.message);
            throw error;
        }
    }

    async updateAccountBalance(ghostfolioAccount, actualBudgetBalance) {
        if (!this.accessToken) {
            throw new Error('Not authenticated. Call authenticate() first');
        }

        try {
            // Convert Actual Budget balance to decimal format
            const newBalance = actualBudgetBalance / 100;

            // Only include the required properties in the update request
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

            console.log(`Successfully updated balance for account ${ghostfolioAccount.name}`);
            return response.data;
        } catch (error) {
            console.error(`Failed to update balance for account ${ghostfolioAccount.name}:`, error.message);
            throw error;
        }
    }

    async syncAccountBalances(actualBalances) {
        try {
            // 1. Authenticate with Ghostfolio
            await this.authenticate();

            // 2. Get Ghostfolio accounts
            const ghostfolioAccounts = await this.getGhostfolioAccounts();

            // 3. Load account mappings
            const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));

            // 4. Update each mapped account
            for (const mapping of config.accounts) {
                // Find matching accounts from both systems
                const actualAccount = actualBalances.find(acc =>
                    acc.name === mapping.actualBudgetName
                );

                const ghostfolioAccount = ghostfolioAccounts.find(acc =>
                    acc.name === mapping.ghostfolioName
                );

                if (!actualAccount) {
                    console.warn(`No matching Actual Budget account found for ${mapping.actualBudgetName}`);
                    continue;
                }

                if (!ghostfolioAccount) {
                    console.warn(`No matching Ghostfolio account found for ${mapping.ghostfolioName}`);
                    continue;
                }

                // Update Ghostfolio account balance
                await this.updateAccountBalance(ghostfolioAccount, actualAccount.balance);
            }

            console.log('Successfully synced all account balances');
        } catch (error) {
            console.error('Failed to sync account balances:', error.message);
            throw error;
        }
    }
}

module.exports = new GhostfolioAPI();
