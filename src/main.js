// CSS is loaded via link tag in index.html
// Chart.js is loaded via CDN in index.html
import { INITIAL_STATE, FACTIONS, WIN_CONDITIONS, LOSE_CONDITIONS } from './data/initialState.js';
import { POLICIES } from './data/policies.js';
import { calculateNextTurn } from './logic/simulation.js';
import { renderMap } from './ui/map.js';

// --- Global State ---
let gameState = JSON.parse(localStorage.getItem('pr_sim_state')) || { ...INITIAL_STATE };
let factions = JSON.parse(localStorage.getItem('pr_sim_factions')) || [...FACTIONS];

// Fix: Re-hydrate policies to preserve function methods
const savedPolicies = JSON.parse(localStorage.getItem('pr_sim_policies'));
let policies = POLICIES.map(p => {
    const saved = savedPolicies ? savedPolicies.find(sp => sp.id === p.id) : null;
    return saved ? { ...p, value: saved.value } : { ...p };
});

// Reset helper
if (gameState.gameOver) {
    gameState = { ...INITIAL_STATE };
    factions = [...FACTIONS];
    policies = POLICIES.map(p => ({ ...p }));
}

// --- UI Elements ---
const ui = {
    year: document.getElementById('year-display'),
    approval: document.getElementById('approval-display'),
    debtRatio: document.getElementById('debt-ratio-display'),
    debt: document.getElementById('debt-display'),
    gdp: document.getElementById('gdp-display'),
    unemployment: document.getElementById('unemployment-display'),
    budget: document.getElementById('budget-display'),
    policyList: document.getElementById('policy-list'),
    factionList: document.getElementById('faction-list'),
    nextTurnBtn: document.getElementById('next-turn-btn'),
    modal: document.getElementById('modal-overlay'),
    modalTitle: document.getElementById('modal-title'),
    modalBody: document.getElementById('modal-body'),
    modalClose: document.getElementById('modal-close'),
    tabs: document.querySelectorAll('.tab-btn'),
    chartCanvas: document.getElementById('mainChart')
};

let mainChart;

// --- Initialization ---
function init() {
    setupChart();
    renderMap('map-container');
    renderUI();
    setupEventListeners();
}

// --- Rendering ---
function renderUI() {
    // Top Bar
    ui.year.textContent = gameState.year;
    ui.approval.textContent = `${gameState.approval.toFixed(1)}%`;
    const debtRatio = (gameState.debt / gameState.gdp * 100).toFixed(1);
    ui.debtRatio.textContent = `${debtRatio}%`;
    ui.debtRatio.style.color = debtRatio > 80 ? 'var(--danger-color)' : 'var(--success-color)';

    // Metrics
    ui.debt.textContent = `$${gameState.debt.toFixed(1)}B`;
    ui.gdp.textContent = `$${gameState.gdp.toFixed(1)}B`;
    ui.unemployment.textContent = `${gameState.unemployment.toFixed(1)}%`;
    ui.budget.textContent = `${gameState.budget >= 0 ? '+' : ''}$${gameState.budget.toFixed(1)}B`;
    ui.budget.style.color = gameState.budget >= 0 ? 'var(--success-color)' : 'var(--danger-color)';

    // Factions
    renderFactions();

    // Chart
    updateChart();
}



function renderPolicies(category) {
    const filtered = policies.filter(p => p.category === category);
    ui.policyList.innerHTML = filtered.map(p => {
        const tooltipHtml = p.tooltip ? `<span class="tooltip-text">${p.tooltip}</span>` : '';
        if (p.type === 'slider') {
            return `
                <div class="policy-item tooltip-container">
                    ${tooltipHtml}
                    <div class="policy-header">
                        <span class="font-semibold">${p.name}</span>
                        <span>${p.value}${p.unit}</span>
                    </div>
                    <p class="policy-desc">${p.description}</p>
                    <input type="range" min="${p.min}" max="${p.max}" value="${p.value}" step="0.5" data-id="${p.id}">
                </div>
            `;
        } else {
            return `
                <div class="policy-item tooltip-container">
                    ${tooltipHtml}
                    <div class="policy-header">
                        <span class="font-semibold">${p.name}</span>
                        <input type="checkbox" ${p.value ? 'checked' : ''} data-id="${p.id}">
                    </div>
                    <p class="policy-desc">${p.description}</p>
                </div>
            `;
        }
    }).join('');


    // Re-attach listeners for new elements
    ui.policyList.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', (e) => {
            const policy = policies.find(p => p.id === e.target.dataset.id);
            if (policy.type === 'slider') {
                policy.value = parseFloat(e.target.value);
                e.target.previousElementSibling.previousElementSibling.lastElementChild.textContent = `${policy.value}${policy.unit}`;
            } else {
                policy.value = e.target.checked;
            }
            saveGame(); // Auto-save on change
        });
    });
}

// --- Chart ---
function setupChart() {
    const ctx = ui.chartCanvas.getContext('2d');
    mainChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: gameState.history.debt.map((_, i) => 2025 + i),
            datasets: [
                {
                    label: 'Debt ($B)',
                    data: gameState.history.debt,
                    borderColor: '#ef4444',
                    tension: 0.4
                },
                {
                    label: 'GDP ($B)',
                    data: gameState.history.gdp,
                    borderColor: '#3b82f6',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#94a3b8' } }
            },
            scales: {
                y: { grid: { color: '#334155' }, ticks: { color: '#94a3b8' } },
                x: { grid: { color: '#334155' }, ticks: { color: '#94a3b8' } }
            }
        }
    });
}

function updateChart() {
    mainChart.data.labels = gameState.history.debt.map((_, i) => 2025 + i);
    mainChart.data.datasets[0].data = gameState.history.debt;
    mainChart.data.datasets[1].data = gameState.history.gdp;
    mainChart.update();
}

// --- Logic Integration ---
function handleNextTurn() {
    console.log("handleNextTurn started. Current Year:", gameState.year);

    try {
        // Loading State (Synchronous for now to debug)
        ui.nextTurnBtn.textContent = "Processing...";

        const result = calculateNextTurn(gameState, policies, factions);
        console.log("Next turn calculated. New Year:", result.newState.year);

        gameState = result.newState;
        factions = result.newFactions;

        saveGame();
        renderUI();
        console.log("UI Rendered. Year in DOM:", document.getElementById('year-display').textContent);

        ui.nextTurnBtn.textContent = "End Year";

        // Show events
        if (result.eventLog.length > 0) {
            const event = result.eventLog[0];
            showModal(event.title, event.description, event.type === 'positive');
        }

        if (gameState.gameOver) {
            let title = "GAME OVER";
            let body = "Your term has ended.";
            let isVictory = false;

            if (gameState.victory) {
                title = "VICTORY!";
                body = `You have successfully saved Puerto Rico!\n\nFinal Debt: $${gameState.debt.toFixed(1)}B\nFinal GDP: $${gameState.gdp.toFixed(1)}B\nApproval: ${gameState.approval.toFixed(1)}%`;
                isVictory = true;
            } else {
                body += `\n\nReason: ${result.eventLog.find(e => e.type === 'lose')?.description || "Time ran out."}`;
            }
            showModal(title, body, isVictory);
            localStorage.clear();
        }
    } catch (e) {
        console.error("CRITICAL ERROR in handleNextTurn:", e);
        ui.nextTurnBtn.textContent = "Error";
    }
}

window.onerror = function (msg, url, line, col, error) {
    console.error("Global Error:", msg, url, line, col, error);
};

function renderFactions() {
    ui.factionList.innerHTML = factions.map(f => {
        const initials = f.name.substring(0, 2).toUpperCase();
        // Generate a consistent color based on name hash or predefined
        const color = getFactionColor(f.id);

        return `
        <div class="faction-item">
            <div class="faction-avatar" style="background-color: ${color}">${initials}</div>
            <div class="faction-info">
                <span class="faction-name">${f.name}</span>
                <span class="faction-desc">${f.description}</span>
            </div>
            <div class="faction-bar-bg">
                <div class="faction-bar-fill" style="width: ${f.approval}%; background-color: ${getApprovalColor(f.approval)}"></div>
            </div>
        </div>
    `}).join('');
}

function getFactionColor(id) {
    const colors = {
        business: '#3b82f6', // Blue
        investors: '#8b5cf6', // Purple
        unions: '#ef4444', // Red
        oversight: '#64748b', // Slate
        diaspora: '#10b981', // Emerald
        tourists: '#f59e0b', // Amber
        elderly: '#f97316', // Orange
        youth: '#ec4899', // Pink
        locals: '#14b8a6', // Teal
        poor: '#6366f1' // Indigo
    };
    return colors[id] || '#94a3b8';
}

function getApprovalColor(val) {
    if (val < 30) return 'var(--danger-color)';
    if (val < 60) return '#facc15'; // Yellow
    return 'var(--success-color)';
}

function showModal(title, body, isPositive = false) {
    ui.modalTitle.textContent = title;
    ui.modalBody.innerText = body; // Use innerText for newlines
    ui.modalTitle.style.color = isPositive ? 'var(--success-color)' : 'var(--text-primary)';

    // Reset image if any (not fully implemented in HTML yet, but logic is here)
    // const img = ui.modal.querySelector('img');
    // if(img) img.remove();

    ui.modal.classList.remove('hidden');
}

function saveGame() {
    localStorage.setItem('pr_sim_state', JSON.stringify(gameState));
    localStorage.setItem('pr_sim_factions', JSON.stringify(factions));
    localStorage.setItem('pr_sim_policies', JSON.stringify(policies));
}

function setupEventListeners() {
    ui.nextTurnBtn.addEventListener('click', handleNextTurn);

    ui.modalClose.addEventListener('click', () => {
        ui.modal.classList.add('hidden');
        if (gameState.gameOver) {
            location.reload(); // Simple restart
        }
    });

    ui.tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            ui.tabs.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderPolicies(btn.dataset.category);
        });
    });

    // Initial render of first tab
    renderPolicies('Revenue');

    // Map Interactions
    document.querySelectorAll('.map-region').forEach(region => {
        region.addEventListener('click', (e) => {
            const regionName = e.target.id.replace('region-', '').toUpperCase();
            showModal(`Region: ${regionName}`, `Detailed statistics for the ${regionName} region are coming soon.\n\nProjected Growth: ${gameState.gdp > 100 ? 'High' : 'Moderate'}\nInfrastructure Status: ${gameState.budget > 0 ? 'Stable' : 'Critical'}`, true);
        });
    });
}

// --- Service Worker Registration ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

init();
