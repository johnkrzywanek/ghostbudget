import axios from 'axios';
import fs from 'fs';
import path from 'path';
import logger from './logger';
import { AccountBalance, Config, GhostfolioAccount } from './types';

class GhostfolioAPI {
    private baseURL: string;
    private accessToken: string | null;
    private configPath: string;

    constructor() {
        this.baseURL = process.env.GHOSTFOLIO_URL || '';
        this.accessToken = null;
        this.configPath = path.join(__dirname, '..', 'config.json');
    }

    async authenticate(): Promise<void> {
        try {
            if (!process.env.GHOSTFOLIO_TOKEN) {
                throw new Error('Missing GHOSTFOLIO_TOKEN environment variable');
            }

            logger.debug('Authenticating with Ghostfolio...');
            const res = await axios.post(`${this.baseURL}/api/v1/auth/anonymous`, {
                accessToken: process.env.GHOSTFOLIO_TOKEN,
            });

            this.accessToken = res.data.authToken;
            logger.info('Successfully authenticated with Ghostfolio');
        } catch (error) {
            logger.error('Failed to authenticate with Ghostfolio:', {
                error: {
                    message: error instanceof Error ? error.message : 'Unknown error',
                    stack: error instanceof Error ? error.stack : undefined,
                },
            });
            throw error;
        }
    }

    async getGhostfolioAccounts(): Promise<GhostfolioAccount[]> {
        if (!this.accessToken) {
            throw new Error('Not authenticated. Call authenticate() first');
        }

        try {
            logger.debug('Fetching Ghostfolio accounts...');
            const response = await axios.get<{ accounts: GhostfolioAccount[] }>(
                `${this.baseURL}/api/v1/account`,
                {
                    headers: {
                        Authorization: `Bearer ${this.accessToken}`,
                    },
                }
            );
            logger.info(`Found ${response.data.accounts.length} Ghostfolio accounts`);
            return response.data.accounts;
        } catch (error) {
            logger.error('Failed to fetch Ghostfolio accounts:', {
                error: {
                    message: error instanceof Error ? error.message : 'Unknown error',
                    stack: error instanceof Error ? error.stack : undefined,
                },
            });
            throw error;
        }
    }

    async updateAccountBalance(
        ghostfolioAccount: GhostfolioAccount,
        actualBudgetBalance: number
    ): Promise<GhostfolioAccount> {
        if (!this.accessToken) {
            throw new Error('Not authenticated. Call authenticate() first');
        }

        try {
            const newBalance = actualBudgetBalance / 100;
            logger.debug('Updating account balance:', {
                account: ghostfolioAccount.name,
                oldBalance: ghostfolioAccount.balance,
                newBalance,
            });

            const updateData: GhostfolioAccount = {
                ...ghostfolioAccount,
                balance: newBalance,
            };

            const response = await axios.put<GhostfolioAccount>(
                `${this.baseURL}/api/v1/account/${ghostfolioAccount.id}`,
                updateData,
                {
                    headers: {
                        Authorization: `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            logger.info(`Successfully updated balance for account ${ghostfolioAccount.name}`);
            return response.data;
        } catch (error) {
            logger.error(`Failed to update balance for account ${ghostfolioAccount.name}:`, {
                error: {
                    message: error instanceof Error ? error.message : 'Unknown error',
                    stack: error instanceof Error ? error.stack : undefined,
                },
            });
            throw error;
        }
    }

    async syncAccountBalances(actualBalances: AccountBalance[]): Promise<void> {
        try {
            await this.authenticate();
            const ghostfolioAccounts = await this.getGhostfolioAccounts();

            logger.debug('Reading account mappings from config...');
            const config: Config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));

            for (const mapping of config.accounts) {
                const actualAccount = actualBalances.find((acc) => acc.name === mapping.actualBudgetName);
                const ghostfolioAccount = ghostfolioAccounts.find(
                    (acc) => acc.name === mapping.ghostfolioName
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
                    message: error instanceof Error ? error.message : 'Unknown error',
                    stack: error instanceof Error ? error.stack : undefined,
                },
            });
            throw error;
        }
    }
}

export default new GhostfolioAPI();
