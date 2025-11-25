export const POLICIES = [
    // REVENUE
    {
        id: 'corp_tax',
        name: 'Corporate Tax Rate',
        category: 'Revenue',
        type: 'slider',
        min: 0, max: 35, value: 20, unit: '%',
        description: "Tax on corporate profits. High taxes hurt business but raise revenue.",
        tooltip: "Raise for cash, lower for growth.",
        effects: (val) => ({
            revenue: val * 0.8, // Billions
            gdpGrowth: -0.05 * (val - 15), // Drag if > 15%
            approval: {
                business: -1.5 * (val - 15),
                investors: -0.5 * (val - 15),
                unions: 0.2 * val
            }
        })
    },
    {
        id: 'sales_tax',
        name: 'Sales Tax (IVU)',
        category: 'Revenue',
        type: 'slider',
        min: 5, max: 15, value: 11.5, unit: '%',
        description: "Consumption tax. High rates hurt the poor and consumption.",
        tooltip: "Very effective revenue, but hurts everyone.",
        effects: (val) => ({
            revenue: val * 1.2,
            gdpGrowth: -0.02 * val,
            approval: {
                business: -0.5 * val,
                unions: -1.0 * val,
                youth: -0.8 * val,
                elderly: -1.0 * val
            }
        })
    },
    {
        id: 'tourism_tax',
        name: 'Tourism Tax',
        category: 'Revenue',
        type: 'slider',
        min: 0, max: 20, value: 7, unit: '%',
        description: "Tax on hotel stays and airport fees.",
        tooltip: "Free money from tourists, until they stop coming.",
        effects: (val) => ({
            revenue: val * 0.15,
            gdpGrowth: 0, // Negligible direct GDP impact, mostly sector specific
            approval: {
                tourists: -2.0 * val,
                business: -0.5 * val
            }
        })
    },

    // SPENDING
    {
        id: 'education',
        name: 'Education Spending',
        category: 'Spending',
        type: 'slider',
        min: 1, max: 10, value: 3, unit: '$B',
        description: "Investment in schools and universities.",
        tooltip: "Long-term growth and youth approval.",
        effects: (val) => ({
            cost: val,
            gdpGrowth: 0.1 * val, // Long term growth
            approval: {
                youth: 3.0 * val,
                unions: 1.0 * val,
                diaspora: 0.5 * val
            }
        })
    },
    {
        id: 'healthcare',
        name: 'Healthcare Spending',
        category: 'Spending',
        type: 'slider',
        min: 1, max: 10, value: 4, unit: '$B',
        description: "Hospitals and public health.",
        tooltip: "Critical for the elderly.",
        effects: (val) => ({
            cost: val,
            gdpGrowth: 0.05 * val,
            approval: {
                elderly: 3.0 * val,
                unions: 1.0 * val,
                poor: 2.0 * val // Assuming 'poor' is covered by general populace or specific faction logic
            }
        })
    },
    {
        id: 'infrastructure',
        name: 'Infrastructure & Power',
        category: 'Spending',
        type: 'slider',
        min: 0, max: 8, value: 1, unit: '$B',
        description: "Grid repairs (PREPA) and roads.",
        tooltip: "Boosts business and tourism significantly.",
        effects: (val) => ({
            cost: val,
            gdpGrowth: 0.2 * val, // High impact due to current crisis
            approval: {
                business: 2.0 * val,
                tourists: 1.5 * val,
                oversight: -0.5 * val // They dislike high spending unless efficient
            }
        })
    },

    // POLICIES
    {
        id: 'pension_cuts',
        name: 'Pension Cuts',
        category: 'Policies',
        type: 'toggle',
        value: false,
        description: "Reduce public pensions to save money. Highly unpopular.",
        tooltip: "Saves $2B/year but angers the elderly and unions.",
        effects: (active) => active ? {
            cost: -2.0, // Saves 2B (Negative cost = Revenue/Savings)
            gdpGrowth: -0.1,
            approval: {
                elderly: -40,
                unions: -20,
                poor: -25, // Added poor impact
                oversight: 30
            }
        } : {}
    },
    {
        id: 'diaspora_incentives',
        name: 'Diaspora Incentives',
        category: 'Policies',
        type: 'toggle',
        value: false,
        description: "Tax breaks for returning professionals (Act 60 mod).",
        tooltip: "Attracts talent but may cause gentrification.",
        effects: (active) => active ? {
            cost: 0.5,
            gdpGrowth: 0.3,
            approval: {
                diaspora: 20,
                business: 10,
                locals: -5 // Gentrification concerns
            }
        } : {}
    }
];
