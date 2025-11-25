export function renderMap(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Simple SVG of Puerto Rico (Approximation)
    // ViewBox 0 0 800 300
    const svg = `
    <svg viewBox="0 0 800 300" class="pr-map" preserveAspectRatio="xMidYMid meet">
        <defs>
            <filter id="glow">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>
        
        <!-- Simplified Geometry for visibility -->
        <!-- West -->
        <path id="region-west" class="map-region" d="M 50,150 L 150,100 L 250,150 L 250,250 L 150,280 L 50,150 Z" fill="#475569" />
        <!-- North -->
        <path id="region-north" class="map-region" d="M 250,150 L 250,100 L 550,100 L 550,150 L 250,150 Z" fill="#475569" />
        <!-- Metro -->
        <path id="region-metro" class="map-region" d="M 550,100 L 700,100 L 700,160 L 550,160 L 550,100 Z" fill="#64748b" />
        <!-- South -->
        <path id="region-south" class="map-region" d="M 250,150 L 550,150 L 550,250 L 250,250 L 250,150 Z" fill="#475569" />
        <!-- East -->
        <path id="region-east" class="map-region" d="M 550,160 L 700,160 L 750,200 L 550,250 L 550,160 Z" fill="#475569" />

        <!-- Vieques & Culebra -->
        <circle cx="760" cy="160" r="15" class="map-region" fill="#475569" />
        <ellipse cx="770" cy="190" rx="20" ry="10" class="map-region" fill="#475569" />
    </svg>
    `;

    container.innerHTML = svg;

    // Add hover effects
    document.querySelectorAll('.map-region').forEach(region => {
        region.addEventListener('mouseover', (e) => {
            // Could show region specific stats here
            e.target.style.fill = 'var(--accent-hover)';
        });
        region.addEventListener('mouseout', (e) => {
            e.target.style.fill = '';
        });
    });
}
