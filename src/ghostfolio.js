require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class GhostfolioAPI {
  constructor() {
    this.baseURL = process.env.GHOSTFOLIO_URL.replace(/\/$/, '');
    this.accessToken = null;
    this.configPath = path.join(__dirname, '..', 'config.json');
  }

  async authenticate() {
    try {
      if (!process.env.GHOSTFOLIO_TOKEN) {
        throw new Error('Missing GHOSTFOLIO_TOKEN environment variable');
      }

      logger.debug('Authenticating with Ghostfolio...');
      const res = await axios.post(`${this.baseURL}/api/v1/auth/anonymous`, {
        accessToken: process.env.GHOSTFOLIO_TOKEN,
      });

      if (!res?.data?.authToken?.length) {
        logger.debug(`Ghostfolio auth responded with status ${res.status}`, res.data);
        throw new Error('Failed to get access token from Ghostfolio');
      }

      this.accessToken = res.data.authToken;
      logger.info('Successfully authenticated with Ghostfolio');
    } catch (error) {
      logger.error('Failed to authenticate with Ghostfolio:', {
        error: {
          message: error.message,
          stack: error.stack,
        },
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
      const response = await axios.get(`${this.baseURL}/api/v1/account`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });
      logger.info(`Found ${response.data.accounts.length} Ghostfolio accounts`);
      return response.data.accounts;
    } catch (error) {
      logger.error('Failed to fetch Ghostfolio accounts:', {
        error: {
          message: error.message,
          stack: error.stack,
        },
      });
      throw error;
    }
  }

  async updateAccountBalance(ghostfolioAccount, actualBudgetBalance, factor = 1) {
    if (!this.accessToken) {
      throw new Error('Not authenticated. Call authenticate() first');
    }

    try {
      const newBalance = (actualBudgetBalance * factor) / 100;
      logger.debug('Updating account balance:', {
        account: ghostfolioAccount.name,
        oldBalance: ghostfolioAccount.balance,
        newBalance: newBalance,
      });

      const updateData = {
        balance: newBalance,
        comment: ghostfolioAccount.comment,
        currency: ghostfolioAccount.currency,
        id: ghostfolioAccount.id,
        isExcluded: ghostfolioAccount.isExcluded,
        name: ghostfolioAccount.name,
        platformId: ghostfolioAccount.platformId,
      };

      const response = await axios.put(
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
          message: error.message,
          stack: error.stack,
        },
      });
      throw error;
    }
  }

  async syncAccountBalances(actualBalances) {
    await this.authenticate();
    const ghostfolioAccounts = await this.getGhostfolioAccounts();

    logger.debug('Reading account mappings from config...');
    const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
    let errors = false;

    for (const mapping of config.accounts) {
      try {
        const actualAccount = actualBalances.find((acc) => acc.name === mapping.actualBudgetName);

        const ghostfolioAccount = ghostfolioAccounts.find(
          (acc) => acc.name === mapping.ghostfolioName
        );

        if (!actualAccount) {
          throw new Error(
            `No matching Actual Budget account found for ${mapping.actualBudgetName}`
          );
        }

        if (!ghostfolioAccount) {
          throw new Error(`No matching Ghostfolio account found for ${mapping.ghostfolioName}`);
        }

        let factor = mapping.factor;
        if (factor !== undefined && !Number.isFinite(factor)) {
          throw new Error(
            `Failed to sync ${mapping.actualBudgetName}: The specified factor (${factor}) is not a number`
          );
        }

        await this.updateAccountBalance(ghostfolioAccount, actualAccount.balance, mapping.factor);
      } catch (e) {
        console.error(e.message || `${e}`);
        errors = true;
      }
    }

    if (errors) {
      throw new Error('Some accounts could not be synced');
    }

    logger.info('Successfully synced all account balances');
  }
}

module.exports = new GhostfolioAPI();
