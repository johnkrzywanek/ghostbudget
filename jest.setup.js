// Mock browser globals for @actual-app/api
global.navigator = {
  userAgent: 'node.js',
};

// Log when mocks are created
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});

beforeEach(() => {
  jest.clearAllMocks();
});

// Set test environment
process.env.NODE_ENV = 'test';
