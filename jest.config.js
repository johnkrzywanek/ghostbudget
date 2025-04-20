module.exports = {
  testEnvironment: 'node',
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  moduleDirectories: ['node_modules', 'src'],
  verbose: true,
  // Add this to see what's happening with the mocks
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
