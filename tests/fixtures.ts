import { AccountBalance, GhostfolioAccount, Config } from '../src/types';

export const mockActualAccounts = [
    { id: '1', name: 'Checking' },
    { id: '2', name: 'Savings' },
];

export const mockActualBalances: AccountBalance[] = [
    { name: 'Checking', balance: 100000 },
    { name: 'Savings', balance: 200000 },
];

export const mockGhostfolioAccounts: GhostfolioAccount[] = [
    {
        id: 'ghost-1',
        name: 'Ghost Checking',
        balance: 1000,
        currency: 'USD',
        isExcluded: false,
        platformId: 'platform-1',
    },
    {
        id: 'ghost-2',
        name: 'Ghost Savings',
        balance: 2000,
        currency: 'USD',
        isExcluded: false,
        platformId: 'platform-1',
    },
];

export const mockConfig: Config = {
    accounts: [
        {
            actualBudgetName: 'Checking',
            ghostfolioName: 'Ghost Checking',
        },
        {
            actualBudgetName: 'Savings',
            ghostfolioName: 'Ghost Savings',
        },
    ],
};
