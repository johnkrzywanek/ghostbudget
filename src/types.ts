export interface AccountBalance {
    name: string;
    balance: number;
}

export interface GhostfolioAccount {
    id: string;
    name: string;
    balance: number;
    currency: string;
    isExcluded: boolean;
    platformId: string;
    comment?: string;
}

export interface ConfigMapping {
    actualBudgetName: string;
    ghostfolioName: string;
}

export interface Config {
    accounts: ConfigMapping[];
}
