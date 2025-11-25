import { WIN_CONDITIONS, LOSE_CONDITIONS } from '../data/initialState.js';

export function calculateNextTurn(currentState, policies, factions) {
    const newState = { ...currentState };
    newState.year += 1;

    // 1. Calculate Budget (Revenue - Spending)
    let totalRevenue = 0;
    let totalSpending = 0;
    let policyGdpImpact = 0;
    let factionImpacts = {};

    // Initialize faction impacts
    factions.forEach(f => factionImpacts[f.id] = 0);

    policies.forEach(policy => {
        const effects = policy.effects(policy.value);

        if (effects.revenue) totalRevenue += effects.revenue;
        if (effects.cost) totalSpending += effects.cost;
        if (effects.gdpGrowth) policyGdpImpact += effects.gdpGrowth;

        if (effects.approval) {
            for (const [factionId, change] of Object.entries(effects.approval)) {
                if (factionImpacts[factionId] !== undefined) {
                    factionImpacts[factionId] += change;
                }
            }
        }
    });

    // Base Revenue (approx 10% of GDP + tourism)
    const baseRevenue = (newState.gdp * 0.10);
    totalRevenue += baseRevenue;

    // Debt Interest (4% base, higher if approval low?)
    const interestRate = 0.04;
    const interestPayment = newState.debt * interestRate;
    totalSpending += interestPayment;

    // Calculate Surplus/Deficit
    const budgetSurplus = totalRevenue - totalSpending;
    newState.budget = budgetSurplus;
    newState.debt -= budgetSurplus; // Negative surplus adds to debt

    // 2. Calculate GDP
    // Base growth 2% + Policy Impact + Random Variance
    const baseGrowth = 2.0;
    const growthRate = baseGrowth + policyGdpImpact;
    // Debt drag: if debt > 80% GDP, -1% growth per 10% over
    const debtRatio = newState.debt / newState.gdp;
    let debtDrag = 0;
    if (debtRatio > 0.8) {
        debtDrag = (debtRatio - 0.8) * 5; // e.g. 100% debt = 0.2 * 5 = 1% drag
    }

    const finalGrowthPercent = Math.max(-10, growthRate - debtDrag); // Cap loss
    newState.gdp = newState.gdp * (1 + finalGrowthPercent / 100);

    // 3. Random Events
    const eventLog = [];
    const rand = Math.random();

    // Event Pool
    if (rand < 0.05) {
        eventLog.push({
            title: "Hurricane Strike!",
            description: "A major hurricane hit the island. Infrastructure damaged.",
            type: "negative",
            image: "event_hurricane"
        });
        newState.gdp *= 0.95;
        newState.debt += 2;
        factionImpacts['tourists'] -= 10;
        factionImpacts['business'] -= 5;
    } else if (rand < 0.10) {
        eventLog.push({
            title: "FEMA Audit",
            description: "Federal auditors found irregularities. Funds frozen.",
            type: "negative"
        });
        newState.budget -= 1; // Instant loss
        factionImpacts['oversight'] += 10; // They like the scrutiny
        factionImpacts['locals'] -= 5;
    } else if (rand < 0.15) {
        eventLog.push({
            title: "Crypto Boom",
            description: "Influx of crypto investors boosts local spending.",
            type: "positive"
        });
        newState.gdp *= 1.02;
        factionImpacts['business'] += 5;
        factionImpacts['locals'] -= 5; // Gentrification
    } else if (rand < 0.20) {
        eventLog.push({
            title: "Grid Collapse",
            description: "Massive island-wide blackout. Economy halts.",
            type: "negative"
        });
        newState.gdp *= 0.98;
        factionImpacts['business'] -= 10;
        factionImpacts['locals'] -= 10;
    } else if (rand < 0.25) {
        eventLog.push({
            title: "Brain Drain",
            description: "Young professionals are leaving for the mainland.",
            type: "negative"
        });
        newState.gdp *= 0.99;
        factionImpacts['youth'] -= 5;
    }

    // 4. Update Factions
    const newFactions = factions.map(f => {
        let change = factionImpacts[f.id] || 0;

        // General economic sentiment
        if (finalGrowthPercent > 2) change += 2;
        if (finalGrowthPercent < 0) change -= 5;
        if (newState.unemployment > 12) change -= 2;

        // Clamp approval
        const newApproval = Math.max(0, Math.min(100, f.approval + change));
        return { ...f, approval: newApproval };
    });

    // 5. Update Global Stats
    // Unemployment Logic Fix:
    // Base change inverse to growth
    let unemploymentChange = 0;
    if (finalGrowthPercent > 2) unemploymentChange -= 1;
    else if (finalGrowthPercent < 0) unemploymentChange += 1;

    // Policy Specific Impacts on Unemployment
    // Tourism Tax: High tax -> Less tourists -> More unemployment
    const tourismTax = policies.find(p => p.id === 'tourism_tax');
    if (tourismTax && tourismTax.value > 10) unemploymentChange += 0.2;

    // Infrastructure Spending: Creates jobs
    const infraSpend = policies.find(p => p.id === 'infrastructure');
    if (infraSpend) unemploymentChange -= (infraSpend.value * 0.2); // 0.2% drop per $1B

    newState.unemployment += unemploymentChange;
    newState.unemployment = Math.max(2, Math.min(30, newState.unemployment));

    // Calculate Global Approval (Weighted)
    let totalWeight = 0;
    let weightedApproval = 0;
    newFactions.forEach(f => {
        weightedApproval += f.approval * f.weight;
        totalWeight += f.weight;
    });
    newState.approval = weightedApproval / totalWeight;

    // History
    newState.history.debt.push(newState.debt);
    newState.history.gdp.push(newState.gdp);
    newState.history.approval.push(newState.approval);

    // Check Win/Lose
    if (newState.debt / newState.gdp <= WIN_CONDITIONS.maxDebtToGDP) {
        newState.victory = true;
        newState.gameOver = true;
    } else if (newState.approval < LOSE_CONDITIONS.minApproval) {
        newState.gameOver = true;
        eventLog.push({ title: "Impeached!", description: "Approval rating too low.", type: "lose" });
    } else if (newState.debt / newState.gdp > LOSE_CONDITIONS.bankruptcyDebtRatio) {
        newState.gameOver = true;
        eventLog.push({ title: "Total Economic Collapse", description: "Debt is unmanageable.", type: "lose" });
    } else if (newState.year >= 2025 + currentState.maxTurns) {
        newState.gameOver = true;
        eventLog.push({ title: "Term Limit Reached", description: "Did not solve the crisis in time.", type: "lose" });
    }

    return { newState, newFactions, eventLog };
}
