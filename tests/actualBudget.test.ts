import api from '@actual-app/api';
import { getAccountBalances } from '../src/actualBudget';
import { mockActualAccounts } from './fixtures';
import logger from '../src/logger';

jest.mock('@actual-app/api');
jest.mock('../src/logger');

const mockedApi = jest.mocked(api);

describe('actualBudget', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Set required environment variables
        process.env.ACTUAL_BUDGET_URL = 'http://localhost:5006';
        process.env.ACTUAL_BUDGET_PASS = 'test-pass';
        process.env.ACTUAL_BUDGET_SYNC_ID = 'test-sync-id';
        process.env.ACTUAL_BUDGET_DATA_DIR = '/test/dir';

        // Mock API responses
        mockedApi.init.mockResolvedValue({} as any);
        mockedApi.downloadBudget.mockResolvedValue(undefined);
        mockedApi.getAccounts.mockResolvedValue(mockActualAccounts);
        mockedApi.getAccountBalance.mockResolvedValue(100012);
        mockedApi.shutdown.mockResolvedValue(undefined);
    });

    describe('getAccountBalances', () => {
        it('should return account balances when successful', async () => {
            const balances = await getAccountBalances();

            expect(balances).toEqual([
                { name: 'Checking', balance: 100012 },
                { name: 'Savings', balance: 100012 },
            ]);

            expect(mockedApi.init).toHaveBeenCalledWith({
                dataDir: '/test/dir',
                serverURL: 'http://localhost:5006',
                password: 'test-pass',
            });
            expect(mockedApi.downloadBudget).toHaveBeenCalledWith('test-sync-id');
            expect(logger.info).toHaveBeenCalledWith('Successfully connected to Actual Budget server');
        });

        it('should return undefined when missing environment variables', async () => {
            delete process.env.ACTUAL_BUDGET_URL;

            const balances = await getAccountBalances();

            expect(balances).toBeUndefined();
            expect(logger.error).toHaveBeenCalledWith('Error fetching account balances:', {
                error: {
                    message: 'Missing required environment variables: ACTUAL_BUDGET_URL',
                    stack: expect.any(String),
                    code: undefined,
                },
            });
        });

        it('should return undefined when API initialization fails', async () => {
            const error = new Error('Connection failed');
            mockedApi.init.mockRejectedValue(error);

            const balances = await getAccountBalances();

            expect(balances).toBeUndefined();
            expect(logger.error).toHaveBeenCalledWith('Error fetching account balances:', {
                error: {
                    message: 'Connection failed',
                    stack: expect.any(String),
                    code: undefined,
                },
            });
        });
    });
});
