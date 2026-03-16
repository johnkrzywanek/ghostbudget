import nock from 'nock';
import path from 'path';
import fs from 'fs';
import { mockActualBalances, mockGhostfolioAccounts, mockConfig } from './fixtures';
import logger from '../src/logger';

jest.mock('../src/logger');
jest.mock('fs');

// Set environment variables before importing
process.env.GHOSTFOLIO_URL = 'http://localhost:3333';
process.env.GHOSTFOLIO_TOKEN = 'test-token';

import ghostfolio from '../src/ghostfolio';

describe('ghostfolio', () => {
    const baseUrl = 'http://localhost:3333';

    beforeEach(() => {
        nock.cleanAll();

        process.env.GHOSTFOLIO_URL = baseUrl;
        process.env.GHOSTFOLIO_TOKEN = 'test-token';

        // Mock fs readFileSync
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockConfig));

        // Set config path
        (ghostfolio as any).configPath = path.join(__dirname, '..', 'config.json.example');

        // Reset the accessToken for each test
        (ghostfolio as any).accessToken = null;
    });

    afterEach(() => {
        nock.cleanAll();
        jest.clearAllMocks();
    });

    describe('syncAccountBalances', () => {
        it('should sync balances successfully', async () => {
            // Setup nock interceptors
            const scope = nock(baseUrl)
                .post('/api/v1/auth/anonymous')
                .reply(200, { authToken: 'test-token' })
                .get('/api/v1/account')
                .reply(200, { accounts: mockGhostfolioAccounts })
                .put(/\/api\/v1\/account\/.*/)
                .times(2)
                .reply(200);

            await ghostfolio.syncAccountBalances(mockActualBalances);

            expect(scope.isDone()).toBeTruthy();
            expect(logger.info).toHaveBeenCalledWith('Successfully synced all account balances');
        });

        it('should handle errors for individual accounts', async () => {
            const configWithMissingAccount = {
                accounts: [
                    {
                        actualBudgetName: 'NonExistent',
                        ghostfolioName: 'Ghost Checking',
                    },
                    {
                        actualBudgetName: 'Savings',
                        ghostfolioName: 'Ghost Savings',
                    },
                ],
            };

            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(configWithMissingAccount));

            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            nock(baseUrl)
                .post('/api/v1/auth/anonymous')
                .reply(200, { authToken: 'test-token' })
                .get('/api/v1/account')
                .reply(200, { accounts: mockGhostfolioAccounts })
                .put(/\/api\/v1\/account\/.*/)
                .reply(200);

            await expect(ghostfolio.syncAccountBalances(mockActualBalances)).rejects.toThrow(
                'Some accounts could not be synced'
            );

            expect(consoleErrorSpy).toHaveBeenCalled();
            consoleErrorSpy.mockRestore();
        });

        it('should validate factor parameter', async () => {
            const configWithInvalidFactor = {
                accounts: [
                    {
                        actualBudgetName: 'Checking',
                        ghostfolioName: 'Ghost Checking',
                        factor: 'invalid' as any,
                    },
                ],
            };

            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(configWithInvalidFactor));

            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            nock(baseUrl)
                .post('/api/v1/auth/anonymous')
                .reply(200, { authToken: 'test-token' })
                .get('/api/v1/account')
                .reply(200, { accounts: mockGhostfolioAccounts });

            await expect(ghostfolio.syncAccountBalances(mockActualBalances)).rejects.toThrow(
                'Some accounts could not be synced'
            );

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                expect.stringContaining('is not a number')
            );
            consoleErrorSpy.mockRestore();
        });
    });

    describe('authenticate', () => {
        it('should authenticate successfully', async () => {
            nock(baseUrl)
                .post('/api/v1/auth/anonymous')
                .reply(200, { authToken: 'received-token' });

            await ghostfolio.authenticate();
            expect((ghostfolio as any).accessToken).toBe('received-token');
            expect(logger.info).toHaveBeenCalledWith('Successfully authenticated with Ghostfolio');
        });

        it('should throw error when token is missing', async () => {
            delete process.env.GHOSTFOLIO_TOKEN;
            await expect(ghostfolio.authenticate()).rejects.toThrow('Missing GHOSTFOLIO_TOKEN');
        });

        it('should throw error when auth response has no token', async () => {
            nock(baseUrl)
                .post('/api/v1/auth/anonymous')
                .reply(200, { authToken: '' });

            await expect(ghostfolio.authenticate()).rejects.toThrow('Failed to get access token');
        });
    });

    describe('getGhostfolioAccounts', () => {
        beforeEach(() => {
            (ghostfolio as any).accessToken = 'test-token';
        });

        it('should fetch accounts successfully', async () => {
            nock(baseUrl)
                .get('/api/v1/account')
                .reply(200, { accounts: mockGhostfolioAccounts });

            const accounts = await ghostfolio.getGhostfolioAccounts();
            expect(accounts).toEqual(mockGhostfolioAccounts);
        });

        it('should throw when not authenticated', async () => {
            (ghostfolio as any).accessToken = null;
            await expect(ghostfolio.getGhostfolioAccounts()).rejects.toThrow('Not authenticated');
        });
    });

    describe('updateAccountBalance', () => {
        beforeEach(() => {
            (ghostfolio as any).accessToken = 'test-token';
        });

        it('should update balance with correct conversion', async () => {
            const account = mockGhostfolioAccounts[0];

            nock(baseUrl)
                .put(`/api/v1/account/${account.id}`)
                .reply(200);

            await ghostfolio.updateAccountBalance(account, 100012);
            expect(logger.info).toHaveBeenCalledWith(
                `Successfully updated balance for account ${account.name}`
            );
        });

        it('should update balance with factor', async () => {
            const account = mockGhostfolioAccounts[0];

            nock(baseUrl)
                .put(`/api/v1/account/${account.id}`)
                .reply(200);

            await ghostfolio.updateAccountBalance(account, 100000, 2);
            expect(logger.info).toHaveBeenCalledWith(
                `Successfully updated balance for account ${account.name}`
            );
        });
    });
});
