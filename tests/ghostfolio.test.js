const nock = require('nock');
const path = require('path');

describe('ghostfolio', () => {
  let ghostfolio;
  const baseUrl = 'http://localhost:3333';

  beforeEach(() => {
    // Clear all mocks and reset modules
    jest.resetModules();
    nock.cleanAll();

    // Set up environment
    process.env.GHOSTFOLIO_URL = baseUrl;
    process.env.GHOSTFOLIO_TOKEN = 'test-token';

    // Import the module
    ghostfolio = require('../src/ghostfolio');

    // Directly set the configPath on the instance
    ghostfolio.configPath = path.join(__dirname, '..', 'config.json.example');

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    nock.cleanAll();
    jest.clearAllMocks();
  });

  describe('syncAccountBalances', () => {
    const actualBalances = [
      {
        name: 'Test Account AB',
        balance: 100012,
        type: 'checking',
      },
    ];

    it('should sync balances successfully', async () => {
      // Auth request
      nock(baseUrl)
        .post('/api/v1/auth/anonymous', {
          accessToken: 'test-token',
        })
        .reply(200, { authToken: 'test-token' });

      // Get accounts request
      nock(baseUrl)
        .get('/api/v1/account')
        .matchHeader('Authorization', 'Bearer test-token')
        .reply(200, {
          accounts: [
            {
              id: '123',
              name: 'Test Account',
              currency: 'USD',
              comment: null,
              isExcluded: false,
              platformId: 'platform-123',
            },
          ],
        });

      // Update balance request
      nock(baseUrl)
        .put('/api/v1/account/123', (body) => {
          expect(body.balance).toBe(1000.12);
          return true;
        })
        .matchHeader('Authorization', 'Bearer test-token')
        .reply(200, { success: true });

      await ghostfolio.syncAccountBalances(actualBalances);
    });
  });

  describe('authenticate', () => {
    it('should authenticate successfully', async () => {
      nock(baseUrl)
        .post('/api/v1/auth/anonymous', {
          accessToken: 'test-token',
        })
        .reply(200, { authToken: 'received-token' });

      await ghostfolio.authenticate();
      expect(ghostfolio.accessToken).toBe('received-token');
    });

    it('should throw error when token is missing', async () => {
      delete process.env.GHOSTFOLIO_TOKEN;
      await expect(ghostfolio.authenticate()).rejects.toThrow('Missing GHOSTFOLIO_TOKEN');
    });
  });

  describe('getGhostfolioAccounts', () => {
    beforeEach(() => {
      ghostfolio.accessToken = 'test-token';
    });

    it('should fetch accounts successfully', async () => {
      const mockResponse = {
        accounts: [
          {
            id: '123',
            name: 'Test Account',
            balance: 1000,
          },
        ],
      };

      nock(baseUrl)
        .get('/api/v1/account')
        .matchHeader('Authorization', 'Bearer test-token')
        .reply(200, mockResponse);

      const accounts = await ghostfolio.getGhostfolioAccounts();
      expect(accounts).toEqual(mockResponse.accounts);
    });

    it('should throw when not authenticated', async () => {
      ghostfolio.accessToken = null;
      await expect(ghostfolio.getGhostfolioAccounts()).rejects.toThrow('Not authenticated');
    });
  });

  describe('updateAccountBalance', () => {
    const mockAccount = {
      id: '123',
      name: 'Test Account',
      currency: 'USD',
      comment: null,
      isExcluded: false,
      platformId: 'platform-123',
    };

    beforeEach(() => {
      ghostfolio.accessToken = 'test-token';
    });

    it('should update balance with correct conversion', async () => {
      nock(baseUrl)
        .put('/api/v1/account/123', (body) => {
          expect(body.balance).toBe(1000.12);
          return true;
        })
        .matchHeader('Authorization', 'Bearer test-token')
        .reply(200, { success: true });

      await ghostfolio.updateAccountBalance(mockAccount, 100012);
    });
  });
});
