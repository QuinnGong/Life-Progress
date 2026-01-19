document.addEventListener('DOMContentLoaded', () => {
    const birthdayInput = document.getElementById('birthday');
    const lifespanInput = document.getElementById('lifespan');
    const passedColorInput = document.getElementById('passedColor');
    const transposeBtn = document.getElementById('transposeBtn');
    const gridContainer = document.getElementById('gridContainer');
    const statsContainer = document.getElementById('stats');
    const presetsContainer = document.getElementById('presets');
    const settingsToggle = document.getElementById('settingsToggle');
    const settingsPanel = document.getElementById('settingsPanel');
    const header = document.getElementById('header');
    const themeToggle = document.getElementById('themeToggle');
    const shareBtn = document.getElementById('shareBtn');

    // Haptic Feedback helper
    function vibrate(duration = 10) {
        if ('vibrate' in navigator) {
            try {
                navigator.vibrate(duration);
            } catch (e) {
                // Ignore vibration errors
            }
        }
    }

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
        transposed: false,
        settingsVisible: true,
        theme: 'dark'
    };

    let lastLifespan = null;
    let lastTransposed = null;
    let cachedDots = [];
    let isTransposed = false;
    let settingsVisible = true;
    let currentTheme = 'dark';

    function loadSettings() {
        const saved = JSON.parse(localStorage.getItem('lifeMapSettings') || '{}');
        birthdayInput.value = saved.birthday || defaults.birthday;
        lifespanInput.value = saved.lifespan || defaults.lifespan;
        passedColorInput.value = saved.passedColor || defaults.passedColor;
        isTransposed = saved.transposed !== undefined ? saved.transposed : defaults.transposed;
        settingsVisible = saved.settingsVisible !== undefined ? saved.settingsVisible : defaults.settingsVisible;
        currentTheme = saved.theme || defaults.theme;
        
        if (isTransposed) transposeBtn.classList.add('active');
        updatePassedColor(passedColorInput.value);
        applyTheme(currentTheme);
        
        // Apply settings visibility
        updateSettingsVisibility();
    }

    function saveSettings() {
        const settings = {
            birthday: birthdayInput.value,
            lifespan: lifespanInput.value,
            passedColor: passedColorInput.value,
            transposed: isTransposed,
            settingsVisible: settingsVisible,
            theme: currentTheme
        };
        localStorage.setItem('lifeMapSettings', JSON.stringify(settings));
    }

    function applyTheme(theme) {
        if (theme === 'light') {
            document.body.classList.add('light-theme');
            themeToggle.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
            `;
        } else {
            document.body.classList.remove('light-theme');
            themeToggle.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
            `;
        }
    }

    themeToggle.addEventListener('click', () => {
        vibrate(10);
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(currentTheme);
        saveSettings();
    });

    shareBtn.addEventListener('click', async () => {
        vibrate(15);
        const shareData = {
            title: 'My Life Progress',
            text: `Check out my life progress map! Every dot is a week. I've lived ${statsContainer.innerText.split('·')[1].trim()} of my life.`,
            url: window.location.href
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                // Fallback to clipboard
                await navigator.clipboard.writeText(window.location.href);
                alert('Link copied to clipboard!');
            }
        } catch (err) {
            console.error('Error sharing:', err);
        }
    });

    // Swipe gestures
    let touchStartX = 0;
    let touchEndX = 0;

    document.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, false);

    document.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, false);

    function handleSwipe() {
        const threshold = 100;
        if (touchEndX < touchStartX - threshold || touchEndX > touchStartX + threshold) {
            vibrate(15);
            isTransposed = !isTransposed;
            transposeBtn.classList.toggle('active', isTransposed);
            saveSettings();
            requestUpdate();
        }
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', e => {
        if (e.target.tagName === 'INPUT') return;
        
        if (e.key.toLowerCase() === 't') {
            vibrate(15);
            isTransposed = !isTransposed;
            transposeBtn.classList.toggle('active', isTransposed);
            saveSettings();
            requestUpdate();
        }
        
        if (e.key.toLowerCase() === 's') {
            vibrate(10);
            settingsVisible = !settingsVisible;
            updateSettingsVisibility();
            saveSettings();
        }
    });

    // Service Worker Registration
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js').then(reg => {
                console.log('SW registered:', reg);
            }).catch(err => {
                console.log('SW registration failed:', err);
            });
        });
    }

    function updateSettingsVisibility() {
        if (settingsVisible) {
            settingsPanel.classList.remove('hidden');
            header.classList.remove('minimal');
            document.body.classList.remove('minimal-mode');
            settingsToggle.classList.add('active');
        } else {
            settingsPanel.classList.add('hidden');
            header.classList.add('minimal');
            document.body.classList.add('minimal-mode');
            settingsToggle.classList.remove('active');
        }
    }

    // Settings toggle button
    settingsToggle.addEventListener('click', () => {
        vibrate(10);
        settingsVisible = !settingsVisible;
        updateSettingsVisibility();
        saveSettings();
    });

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
            vibrate(10);
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
        vibrate(20);
        e.preventDefault();
        const confirmSave = confirm("Do you want to save this map as a 4K wallpaper?");
        if (confirmSave) {
            vibrate(30);
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
        vibrate(15);
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

    // Download extension button - generates ZIP file
    const downloadExtBtn = document.getElementById('downloadExtBtn');
    if (downloadExtBtn) {
        downloadExtBtn.addEventListener('click', async () => {
            downloadExtBtn.disabled = true;
            downloadExtBtn.innerHTML = 'Packaging...';
            
            try {
                // Create ZIP using JSZip
                const zip = new JSZip();
                
                // Fetch extension files
                const [manifestRes, htmlRes, cssRes, jsRes] = await Promise.all([
                    fetch('chrome-extension/manifest.json'),
                    fetch('chrome-extension/index.html'),
                    fetch('chrome-extension/style.css'),
                    fetch('chrome-extension/script.js')
                ]);

                const manifest = await manifestRes.text();
                const html = await htmlRes.text();
                const css = await cssRes.text();
                const js = await jsRes.text();

                // Add files to ZIP
                zip.file('manifest.json', manifest);
                zip.file('index.html', html);
                zip.file('style.css', css);
                zip.file('script.js', js);

                // Generate and download
                const blob = await zip.generateAsync({ type: 'blob' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'life-progress-extension.zip';
                link.click();
                URL.revokeObjectURL(link.href);

                // Show instructions
                setTimeout(() => {
                    alert(
                        'Extension downloaded!\n\n' +
                        'To install:\n' +
                        '1. Extract the ZIP file\n' +
                        '2. Open chrome://extensions (or edge://extensions)\n' +
                        '3. Enable "Developer mode" (top right)\n' +
                        '4. Click "Load unpacked"\n' +
                        '5. Select the extracted folder\n\n' +
                        'Open a new tab to see Life Progress!'
                    );
                }, 500);

            } catch (error) {
                console.error('Failed to create extension package:', error);
                alert('Failed to create package. Please try downloading files manually from chrome-extension/ folder.');
            }
            
            downloadExtBtn.disabled = false;
            downloadExtBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Install
            `;
        });
    }

    // Initial load
    loadSettings();
    updateAll();
});
