// Log when mocks are created
jest.spyOn(console, 'log').mockImplementation(() => { });
jest.spyOn(console, 'error').mockImplementation(() => { });
jest.spyOn(console, 'warn').mockImplementation(() => { });

beforeEach(() => {
    jest.clearAllMocks();
});
