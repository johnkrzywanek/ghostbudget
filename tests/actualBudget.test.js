const api = require('@actual-app/api');

// Mock the actual-api module
jest.mock('@actual-app/api');

describe('actualBudget', () => {
  let actualBudget;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Mock console to avoid noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Set required environment variables
    process.env.ACTUAL_BUDGET_URL = 'http://localhost:5006';
    process.env.ACTUAL_BUDGET_PASS = 'test-pass';
    process.env.ACTUAL_BUDGET_SYNC_ID = 'test-sync-id';
    process.env.ACTUAL_BUDGET_DATA_DIR = '/test/dir';

    // Import the module in each test to get a fresh instance
    actualBudget = require('../src/actualBudget');
  });

  describe('getAccountBalances', () => {
    it('should return account balances when successful', async () => {
      // Mock successful API responses
      api.init.mockResolvedValue();
      api.downloadBudget.mockResolvedValue();
      api.getAccounts.mockResolvedValue([{ id: '1', name: 'Checking', type: 'checking' }]);
      api.getAccountBalance.mockResolvedValue(100012);
      api.shutdown.mockResolvedValue();

      const balances = await actualBudget.getAccountBalances();

      expect(balances).toEqual([{ name: 'Checking', balance: 100012, type: 'checking' }]);
    });

    it('should return undefined when missing environment variables', async () => {
      delete process.env.ACTUAL_BUDGET_URL;

      const balances = await actualBudget.getAccountBalances();

      expect(balances).toBeUndefined();
    });

    it('should return undefined when API initialization fails', async () => {
      api.init.mockRejectedValue(new Error('Connection failed'));

      const balances = await actualBudget.getAccountBalances();

      expect(balances).toBeUndefined();
    });
  });
});
