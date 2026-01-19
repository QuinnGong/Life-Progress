document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
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
    const saveImageBtn = document.getElementById('saveImageBtn');
    const dotTooltip = document.getElementById('dotTooltip');

    // Presets
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

    // State
    let lastLifespan = null;
    let lastTransposed = null;
    let cachedDots = [];
    let isTransposed = false;
    let settingsVisible = true;
    let currentTheme = 'dark';
    let currentDotSize = 10;

    // ============ Haptic Feedback ============
    function vibrate(duration = 50) {
        if ('vibrate' in navigator) {
            navigator.vibrate(duration);
        }
    }

    // ============ Theme Management ============
    function setTheme(theme) {
        currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        // Update meta theme-color for mobile browsers
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
            metaTheme.content = theme === 'dark' ? '#0d0d0d' : '#f5f5f0';
        }
        saveSettings();
    }

    function toggleTheme() {
        vibrate(30);
        setTheme(currentTheme === 'dark' ? 'light' : 'dark');
    }

    // ============ Settings Management ============
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
        setTheme(currentTheme);
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

    function updatePassedColor(color) {
        requestAnimationFrame(() => {
            document.documentElement.style.setProperty('--passed-color', color);
        });
    }

    // ============ Adaptive Dot Size ============
    function calculateDotSize() {
        const lifespan = parseInt(lifespanInput.value) || 80;
        const containerWidth = gridContainer.parentElement?.offsetWidth || window.innerWidth - 40;
        
        // Calculate based on available width and number of columns
        const cols = isTransposed ? lifespan : 52;
        const labelWidth = 35;
        const availableWidth = containerWidth - labelWidth;
        const gap = 4;
        
        // Calculate optimal dot size
        let dotSize = Math.floor((availableWidth - (cols - 1) * gap) / cols);
        
        // Clamp between 6px and 16px
        dotSize = Math.max(6, Math.min(16, dotSize));
        
        // Apply to CSS
        if (dotSize !== currentDotSize) {
            currentDotSize = dotSize;
            document.documentElement.style.setProperty('--dot-size', `${dotSize}px`);
        }
        
        return dotSize;
    }

    // ============ Presets ============
    elegantPresets.forEach(preset => {
        const btn = document.createElement('div');
        btn.className = 'preset-btn';
        btn.style.backgroundColor = preset.passed;
        btn.title = preset.name;
        btn.onclick = () => {
            vibrate(30);
            passedColorInput.value = preset.passed;
            updatePassedColor(preset.passed);
            document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            saveSettings();
            requestUpdate();
        };
        presetsContainer.appendChild(btn);
    });

    // ============ Debounced Update ============
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

        calculateDotSize();

        if (lastLifespan !== lifespanYears || lastTransposed !== isTransposed) {
            regenerateGridStructure(lifespanYears);
            lastLifespan = lifespanYears;
            lastTransposed = isTransposed;
        }

        updateDotStatus(birthday, lifespanYears);
    }

    function regenerateGridStructure(lifespanYears) {
        gridContainer.innerHTML = '';
        cachedDots = [];
        const fragment = document.createDocumentFragment();
        const dotSize = calculateDotSize();

        if (!isTransposed) {
            gridContainer.style.gridTemplateColumns = `35px repeat(52, ${dotSize}px)`;
            
            const corner = document.createElement('div');
            corner.className = 'label corner';
            fragment.appendChild(corner);

            for (let w = 1; w <= 52; w++) {
                const weekLabel = document.createElement('div');
                weekLabel.className = 'label week';
                weekLabel.innerText = w;
                fragment.appendChild(weekLabel);
            }

            for (let y = 0; y < lifespanYears; y++) {
                const yearLabel = document.createElement('div');
                yearLabel.className = 'label year';
                yearLabel.innerText = y;
                fragment.appendChild(yearLabel);

                for (let w = 0; w < 52; w++) {
                    const dot = document.createElement('div');
                    dot.className = 'dot';
                    dot.dataset.year = y;
                    dot.dataset.week = w + 1;
                    dot.dataset.index = y * 52 + w;
                    fragment.appendChild(dot);
                    cachedDots.push(dot);
                }
            }
        } else {
            gridContainer.style.gridTemplateColumns = `35px repeat(${lifespanYears}, ${dotSize}px)`;
            
            const corner = document.createElement('div');
            corner.className = 'label corner';
            fragment.appendChild(corner);

            for (let y = 0; y < lifespanYears; y++) {
                const yearLabel = document.createElement('div');
                yearLabel.className = 'label week';
                yearLabel.innerText = y;
                fragment.appendChild(yearLabel);
            }

            const dotMatrix = Array.from({ length: 52 }, () => []);
            for (let w = 0; w < 52; w++) {
                const weekLabel = document.createElement('div');
                weekLabel.className = 'label year';
                weekLabel.innerText = w + 1;
                fragment.appendChild(weekLabel);

                for (let y = 0; y < lifespanYears; y++) {
                    const dot = document.createElement('div');
                    dot.className = 'dot';
                    dot.dataset.year = y;
                    dot.dataset.week = w + 1;
                    dot.dataset.index = y * 52 + w;
                    fragment.appendChild(dot);
                    dotMatrix[w][y] = dot;
                }
            }
            
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

        const deathDate = new Date(birthday);
        deathDate.setFullYear(birthday.getFullYear() + lifespanYears);
        const diffRemainingMs = deathDate - today;
        const daysLeft = Math.max(0, Math.floor(diffRemainingMs / (1000 * 60 * 60 * 24)));
        const percentage = Math.min(100, Math.max(0, (weeksLived / totalWeeks) * 100)).toFixed(0);
        statsContainer.innerText = `${daysLeft.toLocaleString()}d left · ${percentage}%`;

        for (let i = 0; i < cachedDots.length; i++) {
            const dot = cachedDots[i];
            const isPassed = i < weeksLived;
            const isCurrent = i === weeksLived;
            
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

    // ============ Save Image ============
    function saveAsImage() {
        vibrate(50);
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const isLandscape = isTransposed;
        canvas.width = isLandscape ? 3840 : 2160;
        canvas.height = isLandscape ? 2160 : 3840;

        // Use current theme background
        const bgColor = currentTheme === 'dark' ? '#0d0d0d' : '#f5f5f0';
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const padding = 150;
        const drawingWidth = canvas.width - (padding * 2);
        const drawingHeight = canvas.height - (padding * 2);

        const lifespanYears = parseInt(lifespanInput.value) || 80;
        const cols = isTransposed ? lifespanYears : 52;
        const rows = isTransposed ? 52 : lifespanYears;

        const gapRatio = 0.4;
        const dotSizeX = drawingWidth / (cols + (cols - 1) * gapRatio);
        const dotSizeY = drawingHeight / (rows + (rows - 1) * gapRatio);
        const dotSize = Math.min(dotSizeX, dotSizeY);
        const gap = dotSize * gapRatio;

        const totalGridWidth = cols * dotSize + (cols - 1) * gap;
        const totalGridHeight = rows * dotSize + (rows - 1) * gap;
        const startX = (canvas.width - totalGridWidth) / 2;
        const startY = (canvas.height - totalGridHeight) / 2;

        const birthday = new Date(birthdayInput.value);
        const today = new Date();
        const diffInMs = today - birthday;
        const weeksLived = Math.floor(diffInMs / (1000 * 60 * 60 * 24 * 7));
        
        const passedColor = getComputedStyle(document.documentElement).getPropertyValue('--passed-color').trim();
        const futureColor = currentTheme === 'dark' ? '#1a1a1a' : '#d8d8d8';
        const accentColor = '#e67e22';

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                let flatIndex;
                if (!isTransposed) {
                    flatIndex = r * 52 + c;
                } else {
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
                    ctx.shadowColor = accentColor;
                    ctx.shadowBlur = 20;
                } else {
                    ctx.fillStyle = futureColor;
                    ctx.shadowBlur = 0;
                }
                
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }

        ctx.fillStyle = accentColor;
        ctx.font = '500 60px "Space Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(statsContainer.innerText, canvas.width / 2, canvas.height - 50);

        const link = document.createElement('a');
        link.download = `life-map-${isLandscape ? 'landscape' : 'portrait'}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    // ============ Swipe Gesture ============
    let touchStartX = 0;
    let touchStartY = 0;
    const swipeThreshold = 50;

    gridContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    gridContainer.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        
        // Only trigger if horizontal swipe is dominant
        if (Math.abs(deltaX) > swipeThreshold && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
            vibrate(50);
            isTransposed = !isTransposed;
            transposeBtn.classList.toggle('active', isTransposed);
            saveSettings();
            requestUpdate();
        }
    }, { passive: true });

    // ============ Dot Hover Tooltip (Desktop) ============
    gridContainer.addEventListener('mousemove', (e) => {
        if (e.target.classList.contains('dot')) {
            const year = e.target.dataset.year;
            const week = e.target.dataset.week;
            const index = parseInt(e.target.dataset.index);
            
            const birthday = new Date(birthdayInput.value);
            const dotDate = new Date(birthday);
            dotDate.setDate(dotDate.getDate() + index * 7);
            
            const dateStr = dotDate.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
            
            dotTooltip.textContent = `Year ${year}, Week ${week} · ${dateStr}`;
            dotTooltip.style.left = `${e.clientX + 10}px`;
            dotTooltip.style.top = `${e.clientY + 10}px`;
            dotTooltip.classList.add('visible');
        }
    });

    gridContainer.addEventListener('mouseleave', () => {
        dotTooltip.classList.remove('visible');
    });

    // ============ Keyboard Shortcuts ============
    document.addEventListener('keydown', (e) => {
        // Don't trigger if typing in input
        if (e.target.tagName === 'INPUT') return;
        
        switch (e.key.toLowerCase()) {
            case 't':
                vibrate(30);
                isTransposed = !isTransposed;
                transposeBtn.classList.toggle('active', isTransposed);
                saveSettings();
                requestUpdate();
                break;
            case 's':
                saveAsImage();
                break;
            case 'd':
                toggleTheme();
                break;
        }
    });

    // ============ Event Listeners ============
    settingsToggle.addEventListener('click', () => {
        vibrate(30);
        settingsVisible = !settingsVisible;
        updateSettingsVisibility();
        saveSettings();
    });

    themeToggle.addEventListener('click', toggleTheme);
    saveImageBtn.addEventListener('click', saveAsImage);

    transposeBtn.addEventListener('click', () => {
        vibrate(30);
        isTransposed = !isTransposed;
        transposeBtn.classList.toggle('active', isTransposed);
        saveSettings();
        requestUpdate();
    });

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

    // Context menu save
    gridContainer.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (confirm('Save as 4K wallpaper?')) {
            saveAsImage();
        }
    });

    // Window resize - recalculate dot size
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            lastLifespan = null; // Force regeneration
            requestUpdate();
        }, 200);
    });

    // ============ Download Extension Button ============
    const downloadExtBtn = document.getElementById('downloadExtBtn');
    if (downloadExtBtn) {
        downloadExtBtn.addEventListener('click', async () => {
            vibrate(50);
            downloadExtBtn.disabled = true;
            downloadExtBtn.innerHTML = 'Packaging...';
            
            try {
                const zip = new JSZip();
                
                const [manifestRes, htmlRes, cssRes, jsRes, icon64Res, icon128Res] = await Promise.all([
                    fetch('chrome-extension/manifest.json'),
                    fetch('chrome-extension/index.html'),
                    fetch('chrome-extension/style.css'),
                    fetch('chrome-extension/script.js'),
                    fetch('chrome-extension/icon64.png'),
                    fetch('chrome-extension/icon128.png')
                ]);

                const manifest = await manifestRes.text();
                const html = await htmlRes.text();
                const css = await cssRes.text();
                const js = await jsRes.text();
                const icon64 = await icon64Res.blob();
                const icon128 = await icon128Res.blob();

                zip.file('manifest.json', manifest);
                zip.file('index.html', html);
                zip.file('style.css', css);
                zip.file('script.js', js);
                zip.file('icon64.png', icon64);
                zip.file('icon128.png', icon128);

                const blob = await zip.generateAsync({ type: 'blob' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'life-progress-extension.zip';
                link.click();
                URL.revokeObjectURL(link.href);

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
                alert('Failed to create package. Please try downloading files manually.');
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

    // ============ PWA Service Worker Registration ============
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js')
                .then((registration) => {
                    console.log('SW registered:', registration.scope);
                })
                .catch((error) => {
                    console.log('SW registration failed:', error);
                });
        });
    }

    // ============ Initialize ============
    loadSettings();
    updateAll();
});
