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
    
    // First run setup elements
    const setupModal = document.getElementById('setupModal');
    const setupBirthday = document.getElementById('setupBirthday');
    const setupLifespan = document.getElementById('setupLifespan');
    const setupPresets = document.getElementById('setupPresets');
    const setupComplete = document.getElementById('setupComplete');

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
        birthday: '',
        lifespan: 80,
        passedColor: '#50C878',
        transposed: false,
        settingsVisible: false,
        isConfigured: false
    };

    let lastLifespan = null;
    let lastTransposed = null;
    let cachedDots = [];
    let isTransposed = false;
    let settingsVisible = false;
    let selectedSetupColor = '#50C878';

    // Check if this is first run - do this synchronously before showing anything
    function checkFirstRun() {
        const saved = JSON.parse(localStorage.getItem('lifeMapSettings') || '{}');
        
        if (!saved.isConfigured || !saved.birthday) {
            // First run - show setup modal
            setupModal.classList.remove('hidden');
            initSetupPresets();
            // Now show the page
            document.body.classList.add('ready');
        } else {
            // Already configured - hide modal, show main view
            setupModal.classList.add('hidden');
            loadSettings();
            updateAll();
            // Now show the page
            document.body.classList.add('ready');
        }
    }

    function initSetupPresets() {
        setupPresets.innerHTML = '';
        elegantPresets.forEach((preset, index) => {
            const btn = document.createElement('div');
            btn.className = 'preset-btn';
            if (index === 0) btn.classList.add('active');
            btn.style.backgroundColor = preset.passed;
            btn.title = preset.name;
            btn.onclick = () => {
                selectedSetupColor = preset.passed;
                setupPresets.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            };
            setupPresets.appendChild(btn);
        });
    }

    setupComplete.addEventListener('click', () => {
        const birthday = setupBirthday.value;
        const lifespan = setupLifespan.value;
        
        if (!birthday) {
            alert('Please enter your birthday');
            return;
        }

        // Save settings
        const settings = {
            birthday: birthday,
            lifespan: lifespan || 80,
            passedColor: selectedSetupColor,
            transposed: false,
            settingsVisible: false,
            isConfigured: true
        };
        localStorage.setItem('lifeMapSettings', JSON.stringify(settings));
        
        // Hide modal and load
        setupModal.classList.add('hidden');
        loadSettings();
        updateAll();
    });

    function loadSettings() {
        const saved = JSON.parse(localStorage.getItem('lifeMapSettings') || '{}');
        birthdayInput.value = saved.birthday || defaults.birthday;
        lifespanInput.value = saved.lifespan || defaults.lifespan;
        passedColorInput.value = saved.passedColor || defaults.passedColor;
        isTransposed = saved.transposed !== undefined ? saved.transposed : defaults.transposed;
        settingsVisible = saved.settingsVisible !== undefined ? saved.settingsVisible : defaults.settingsVisible;
        
        if (isTransposed) transposeBtn.classList.add('active');
        updatePassedColor(passedColorInput.value);
        updateSettingsVisibility();
    }

    function saveSettings() {
        const settings = {
            birthday: birthdayInput.value,
            lifespan: lifespanInput.value,
            passedColor: passedColorInput.value,
            transposed: isTransposed,
            settingsVisible: settingsVisible,
            isConfigured: true
        };
        localStorage.setItem('lifeMapSettings', JSON.stringify(settings));
    }

    function updateSettingsVisibility() {
        if (settingsVisible) {
            settingsPanel.classList.remove('hidden');
            settingsToggle.classList.add('active');
        } else {
            settingsPanel.classList.add('hidden');
            settingsToggle.classList.remove('active');
        }
    }

    settingsToggle.addEventListener('click', () => {
        settingsVisible = !settingsVisible;
        updateSettingsVisibility();
        saveSettings();
    });

    function updatePassedColor(color) {
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
            document.querySelectorAll('#presets .preset-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            saveSettings();
            requestUpdate();
        };
        presetsContainer.appendChild(btn);
    });

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
        cachedDots = [];
        const fragment = document.createDocumentFragment();

        if (!isTransposed) {
            gridContainer.style.gridTemplateColumns = `30px repeat(52, 1fr)`;
            
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
                    fragment.appendChild(dot);
                    cachedDots.push(dot);
                }
            }
        } else {
            gridContainer.style.gridTemplateColumns = `30px repeat(${lifespanYears}, 1fr)`;
            
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

    transposeBtn.addEventListener('click', () => {
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
        document.querySelectorAll('#presets .preset-btn').forEach(b => b.classList.remove('active'));
        saveSettings();
    });

    // Check first run on load - this determines what to show
    checkFirstRun();
});
