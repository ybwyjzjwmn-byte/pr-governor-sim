import { calculateNextTurn } from '../src/logic/simulation.js';
import { INITIAL_STATE, FACTIONS } from '../src/data/initialState.js';
import { POLICIES } from '../src/data/policies.js';

console.log("Starting Logic Scan...");

let state = { ...INITIAL_STATE };
let currentFactions = JSON.parse(JSON.stringify(FACTIONS));

// Fix: Don't deep clone policies with JSON methods as it strips functions.
// Instead, map over them to create a mutable copy but keep the functions.
let currentPolicies = POLICIES.map(p => ({ ...p }));

// Simulate 10 turns
for (let i = 1; i <= 10; i++) {
    console.log(`--- Turn ${i} (${state.year}) ---`);
    console.log(`Start: Debt $${state.debt.toFixed(2)}B, GDP $${state.gdp.toFixed(2)}B, Approval ${state.approval.toFixed(2)}%`);

    const result = calculateNextTurn(state, currentPolicies, currentFactions);
    state = result.newState;
    currentFactions = result.newFactions;

    console.log(`End:   Debt $${state.debt.toFixed(2)}B, GDP $${state.gdp.toFixed(2)}B, Approval ${state.approval.toFixed(2)}%`);

    if (result.eventLog.length > 0) {
        console.log(`Events: ${result.eventLog.map(e => e.title).join(', ')}`);
    }

    if (state.gameOver) {
        console.log("GAME OVER triggered:", state.victory ? "VICTORY" : "DEFEAT");
        break;
    }
}

console.log("Logic Scan Complete.");
