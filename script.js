document.addEventListener('DOMContentLoaded', () => {
    const birthdayInput = document.getElementById('birthday');
    const lifespanInput = document.getElementById('lifespan');
    const passedColorInput = document.getElementById('passedColor');
    const transposeBtn = document.getElementById('transposeBtn');
    const gridContainer = document.getElementById('gridContainer');
    const statsContainer = document.getElementById('stats');
    const presetsContainer = document.getElementById('presets');

    // Sophisticated and Elegant Presets for Dark Mode
    const elegantPresets = [
        { name: 'Emerald', passed: '#50C878' },
        { name: 'Champagne', passed: '#D4AF37' },
        { name: 'Arctic', passed: '#89CFF0' },
        { name: 'Lavender', passed: '#E6E6FA' },
        { name: 'Rose', passed: '#F7CAC9' },
        { name: 'Sage', passed: '#9DC183' }
    ];

    const defaults = {
        birthday: '2000-01-01',
        lifespan: 80,
        passedColor: '#50C878',
        transposed: false
    };

    let lastLifespan = null;
    let lastTransposed = null;
    let cachedDots = [];
    let isTransposed = false;

    function loadSettings() {
        const saved = JSON.parse(localStorage.getItem('lifeMapSettings') || '{}');
        birthdayInput.value = saved.birthday || defaults.birthday;
        lifespanInput.value = saved.lifespan || defaults.lifespan;
        passedColorInput.value = saved.passedColor || defaults.passedColor;
        isTransposed = saved.transposed !== undefined ? saved.transposed : defaults.transposed;
        
        if (isTransposed) transposeBtn.classList.add('active');
        updatePassedColor(passedColorInput.value);
    }

    function saveSettings() {
        const settings = {
            birthday: birthdayInput.value,
            lifespan: lifespanInput.value,
            passedColor: passedColorInput.value,
            transposed: isTransposed
        };
        localStorage.setItem('lifeMapSettings', JSON.stringify(settings));
    }

    function updatePassedColor(color) {
        // Use requestAnimationFrame for smoother color transitions
        requestAnimationFrame(() => {
            document.documentElement.style.setProperty('--passed-color', color);
        });
    }

    // Initialize presets
    elegantPresets.forEach(preset => {
        const btn = document.createElement('div');
        btn.className = 'preset-btn';
        btn.style.backgroundColor = preset.passed;
        btn.title = preset.name;
        btn.onclick = () => {
            passedColorInput.value = preset.passed;
            updatePassedColor(preset.passed);
            document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            saveSettings();
            requestUpdate();
        };
        presetsContainer.appendChild(btn);
    });

    /**
     * Debounced update mechanism
     */
    let updatePending = false;
    function requestUpdate() {
        if (updatePending) return;
        updatePending = true;
        requestAnimationFrame(() => {
            updateAll();
            updatePending = false;
        });
    }

    function updateAll() {
        const lifespanYears = parseInt(lifespanInput.value) || 1;
        const birthday = new Date(birthdayInput.value);
        
        if (isNaN(birthday.getTime())) return;

        if (lastLifespan !== lifespanYears || lastTransposed !== isTransposed) {
            regenerateGridStructure(lifespanYears);
            lastLifespan = lifespanYears;
            lastTransposed = isTransposed;
        }

        updateDotStatus(birthday, lifespanYears);
    }

    function regenerateGridStructure(lifespanYears) {
        gridContainer.innerHTML = '';
        cachedDots = []; // Clear cache
        const fragment = document.createDocumentFragment();

        if (!isTransposed) {
            gridContainer.style.gridTemplateColumns = `35px repeat(52, 1fr)`;
            
            // Corner
            const corner = document.createElement('div');
            corner.className = 'label corner';
            fragment.appendChild(corner);

            // Week labels
            for (let w = 1; w <= 52; w++) {
                const weekLabel = document.createElement('div');
                weekLabel.className = 'label week';
                weekLabel.innerText = w; // Show all week numbers
                fragment.appendChild(weekLabel);
            }

            // Year rows
            for (let y = 0; y < lifespanYears; y++) {
                const yearLabel = document.createElement('div');
                yearLabel.className = 'label year';
                yearLabel.innerText = y; // Show all year numbers
                fragment.appendChild(yearLabel);

                for (let w = 0; w < 52; w++) {
                    const dot = document.createElement('div');
                    dot.className = 'dot';
                    fragment.appendChild(dot);
                    cachedDots.push(dot); // Cache the dot reference
                }
            }
        } else {
            // Transposed: Rows = Weeks, Cols = Years
            gridContainer.style.gridTemplateColumns = `35px repeat(${lifespanYears}, 1fr)`;
            
            // Corner
            const corner = document.createElement('div');
            corner.className = 'label corner';
            fragment.appendChild(corner);

            // Year labels (top axis)
            for (let y = 0; y < lifespanYears; y++) {
                const yearLabel = document.createElement('div');
                yearLabel.className = 'label week'; // Horizontal alignment
                yearLabel.innerText = y; // Show all year numbers
                fragment.appendChild(yearLabel);
            }

            // Week rows (1-52)
            const dotMatrix = Array.from({ length: 52 }, () => []);
            for (let w = 0; w < 52; w++) {
                const weekLabel = document.createElement('div');
                weekLabel.className = 'label year'; // Vertical alignment
                weekLabel.innerText = w + 1; // Show all week numbers
                fragment.appendChild(weekLabel);

                for (let y = 0; y < lifespanYears; y++) {
                    const dot = document.createElement('div');
                    dot.className = 'dot';
                    fragment.appendChild(dot);
                    dotMatrix[w][y] = dot;
                }
            }
            
            // Map flat index correctly for chronological update
            for (let y = 0; y < lifespanYears; y++) {
                for (let w = 0; w < 52; w++) {
                    cachedDots.push(dotMatrix[w][y]);
                }
            }
        }
        gridContainer.appendChild(fragment);
    }

    function updateDotStatus(birthday, lifespanYears) {
        const today = new Date();
        const totalWeeks = lifespanYears * 52;
        const diffInMs = today - birthday;
        const weeksLived = Math.floor(diffInMs / (1000 * 60 * 60 * 24 * 7));

        // Stats text
        const deathDate = new Date(birthday);
        deathDate.setFullYear(birthday.getFullYear() + lifespanYears);
        const diffRemainingMs = deathDate - today;
        const daysLeft = Math.max(0, Math.floor(diffRemainingMs / (1000 * 60 * 60 * 24)));
        const percentage = Math.min(100, Math.max(0, (weeksLived / totalWeeks) * 100)).toFixed(0);
        statsContainer.innerText = `${daysLeft.toLocaleString()}d left · ${percentage}%`;

        // Update classes using cached references
        for (let i = 0; i < cachedDots.length; i++) {
            const dot = cachedDots[i];
            const isPassed = i < weeksLived;
            const isCurrent = i === weeksLived;
            
            // Check if state actually changed before touching DOM
            if (isPassed && !dot.classList.contains('passed')) {
                dot.classList.add('passed');
            } else if (!isPassed && dot.classList.contains('passed')) {
                dot.classList.remove('passed');
            }

            if (isCurrent && !dot.classList.contains('current')) {
                dot.classList.add('current');
            } else if (!isCurrent && dot.classList.contains('current')) {
                dot.classList.remove('current');
            }
        }
    }

    // Right-click to save image
    gridContainer.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const confirmSave = confirm("Do you want to save this map as a 4K wallpaper?");
        if (confirmSave) {
            saveAsImage();
        }
    });

    function saveAsImage() {
        // Create canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 4K Resolution logic:
        // Default layout (Not Transposed): Rows=Years, Cols=Weeks -> Taller -> Portrait (2160 x 3840)
        // Transposed layout: Rows=Weeks, Cols=Years -> Wider -> Landscape (3840 x 2160)
        const isLandscape = isTransposed; 
        canvas.width = isLandscape ? 3840 : 2160;
        canvas.height = isLandscape ? 2160 : 3840;

        // Fill Background
        ctx.fillStyle = '#0d0d0d'; // Match body bg
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Calculate grid dimensions to fit nicely with padding
        const padding = 150;
        const drawingWidth = canvas.width - (padding * 2);
        const drawingHeight = canvas.height - (padding * 2);

        // Get current grid data
        const lifespanYears = parseInt(lifespanInput.value) || 80;
        const cols = isTransposed ? lifespanYears : 52;
        const rows = isTransposed ? 52 : lifespanYears;

        // Calculate dot size and spacing to fit the drawing area
        // We need to fit 'cols' dots and 'cols-1' gaps horizontally
        // and 'rows' dots and 'rows-1' gaps vertically
        
        // Try to maintain aspect ratio of dots (circles)
        const gapRatio = 0.4; // Gap is 40% of dot size
        
        // width = cols * dotSize + (cols - 1) * (dotSize * gapRatio)
        // width = dotSize * (cols + (cols - 1) * gapRatio)
        
        const dotSizeX = drawingWidth / (cols + (cols - 1) * gapRatio);
        const dotSizeY = drawingHeight / (rows + (rows - 1) * gapRatio);
        const dotSize = Math.min(dotSizeX, dotSizeY);
        const gap = dotSize * gapRatio;

        // Center the grid
        const totalGridWidth = cols * dotSize + (cols - 1) * gap;
        const totalGridHeight = rows * dotSize + (rows - 1) * gap;
        const startX = (canvas.width - totalGridWidth) / 2;
        const startY = (canvas.height - totalGridHeight) / 2;

        // Draw dots
        // We can reuse cachedDots logic but we need 2D coordinates
        // Let's re-calculate based on current layout
        
        const birthday = new Date(birthdayInput.value);
        const today = new Date();
        const diffInMs = today - birthday;
        const weeksLived = Math.floor(diffInMs / (1000 * 60 * 60 * 24 * 7));
        
        // Colors
        const passedColor = getComputedStyle(document.documentElement).getPropertyValue('--passed-color').trim();
        const futureColor = '#1a1a1a'; // Match CSS
        const accentColor = '#e67e22';

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                // Calculate chronological index
                let flatIndex;
                if (!isTransposed) {
                    // Standard: Row=Year, Col=Week
                    flatIndex = r * 52 + c;
                } else {
                    // Transposed: Row=Week, Col=Year
                    // r (0-51) is Week-1, c (0-Lifespan-1) is Year
                    flatIndex = c * 52 + r;
                }

                const x = startX + c * (dotSize + gap) + dotSize / 2;
                const y = startY + r * (dotSize + gap) + dotSize / 2;

                ctx.beginPath();
                ctx.arc(x, y, dotSize / 2, 0, Math.PI * 2);
                
                if (flatIndex < weeksLived) {
                    ctx.fillStyle = passedColor;
                } else if (flatIndex === weeksLived) {
                    ctx.fillStyle = accentColor;
                    // Add glow for current dot
                    ctx.shadowColor = accentColor;
                    ctx.shadowBlur = 20;
                } else {
                    ctx.fillStyle = futureColor;
                    ctx.shadowBlur = 0;
                }
                
                ctx.fill();
                ctx.shadowBlur = 0; // Reset shadow
            }
        }

        // Add Stats Text at bottom
        ctx.fillStyle = accentColor;
        ctx.font = '500 60px "Space Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(statsContainer.innerText, canvas.width / 2, canvas.height - 50);

        // Save
        const link = document.createElement('a');
        link.download = `life-map-${isLandscape ? 'landscape' : 'portrait'}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    transposeBtn.addEventListener('click', () => {
        isTransposed = !isTransposed;
        transposeBtn.classList.toggle('active', isTransposed);
        saveSettings();
        requestUpdate();
    });

    // Input listeners with immediate visual feedback but throttled rendering
    birthdayInput.addEventListener('input', () => {
        saveSettings();
        requestUpdate();
    });

    lifespanInput.addEventListener('input', () => {
        saveSettings();
        requestUpdate();
    });

    passedColorInput.addEventListener('input', (e) => {
        updatePassedColor(e.target.value);
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        saveSettings();
    });

    // Initial load
    loadSettings();
    updateAll();
});
