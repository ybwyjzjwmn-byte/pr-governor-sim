export const INITIAL_STATE = {
    year: 2025,
    maxTurns: 10,
    debt: 70, // Billions
    gdp: 100, // Billions
    unemployment: 10, // Percentage
    population: 3.2, // Millions
    tourists: 5, // Millions per year
    approval: 50, // Percentage
    budget: 0, // Current surplus/deficit
    gameOver: false,
    victory: false,
    history: {
        debt: [70],
        gdp: [100],
        approval: [50]
    }
};

export const FACTIONS = [
    { id: 'business', name: 'Local Business', weight: 1.2, approval: 50, description: "Concerned with taxes and regulations." },
    { id: 'investors', name: 'Foreign Investors', weight: 1.0, approval: 50, description: "Want debt repayment and stability." },
    { id: 'unions', name: 'Labor Unions', weight: 1.5, approval: 50, description: "Fight for wages and job security." },
    { id: 'oversight', name: 'Oversight Board', weight: 2.0, approval: 40, description: "Demands balanced budgets and austerity." },
    { id: 'diaspora', name: 'Diaspora', weight: 0.8, approval: 60, description: "Sends remittances, cares about social issues." },
    { id: 'tourists', name: 'Tourism Sector', weight: 1.0, approval: 60, description: "Needs safety and infrastructure." },
    { id: 'elderly', name: 'Pensioners', weight: 1.3, approval: 50, description: "Reliant on pensions and healthcare." },
    { id: 'youth', name: 'Youth', weight: 1.1, approval: 40, description: "Wants education and jobs." }
];

export const WIN_CONDITIONS = {
    maxDebtToGDP: 0.50 // 50%
};

export const LOSE_CONDITIONS = {
    minApproval: 20,
    bankruptcyDebtRatio: 2.0 // 200% Debt to GDP is instant game over
};
