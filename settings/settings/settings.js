const settingsModule = {
    settings: {
        soundEnabled: true,
        musicEnabled: true,
        cardDisplayMode: 'static',
        gameMode: 'classic'
    },
    _musicFirstInit: true,
    _storageKey: 'gwentSettings',

    init() {
        this.loadSettings();
        this.applyAudioSettings();
        this._musicFirstInit = false;
    },

    loadSettings() {
        try {
            const savedSettings = localStorage.getItem(this._storageKey);
            if (savedSettings) {
                this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
            }
        } catch (e) {
            console.warn('Failed to load settings:', e);
        }
    },

    saveSettings() {
        try {
            localStorage.setItem(this._storageKey, JSON.stringify(this.settings));
            this.applyAudioSettings();
            this.notifySettingsChange();
        } catch (e) {
            console.warn('Failed to save settings:', e);
        }
    },

    applyAudioSettings() {
        if (window.audioManager) {
            audioManager.soundEnabled = this.settings.soundEnabled;
            audioManager.musicEnabled = this.settings.musicEnabled;
            
            if (this.settings.musicEnabled) {
                if (this._musicFirstInit) {
                    audioManager.playBackgroundMusic();
                } else if (!audioManager._wasMusicPlaying) {
                    audioManager.resumeBackgroundMusic?.();
                }
            } else {
                audioManager._wasMusicPlaying = audioManager.isMusicPlaying?.() ?? false;
                audioManager.stopBackgroundMusic();
            }
        }
    },

    notifySettingsChange() {
        window.gameModule?.onSettingsChange?.(this.settings);
        window.deckModule?.onSettingsChange?.(this.settings);
    },

    getCardDisplayMode() { return this.settings.cardDisplayMode; },
    setCardDisplayMode(mode) { this.settings.cardDisplayMode = mode; this.saveSettings(); },
    getGameMode() { return this.settings.gameMode; },
    setGameMode(mode) { this.settings.gameMode = mode; this.saveSettings(); }
};

window.settingsModule = settingsModule;

const fullscreenAPI = {
    enter() {
        const el = document.documentElement;
        const methods = ['requestFullscreen', 'mozRequestFullScreen', 'webkitRequestFullscreen', 'msRequestFullscreen'];
        for (const method of methods) {
            if (el[method]) { el[method](); break; }
        }
    },
    exit() {
        const methods = ['exitFullscreen', 'mozCancelFullScreen', 'webkitExitFullscreen', 'msExitFullscreen'];
        for (const method of methods) {
            if (document[method]) { document[method](); break; }
        }
    },
    isActive() {
        return !!(document.fullscreenElement || document.mozFullScreenElement || 
                  document.webkitFullscreenElement || document.msFullscreenElement);
    }
};

function showSettingsModal() {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'settings-modal-overlay';
    const isFullscreenActive = fullscreenAPI.isActive();
    const { cardDisplayMode, gameMode } = settingsModule.settings;
    const { soundEnabled, musicEnabled } = audioManager;
    
    modalOverlay.innerHTML = `
        <div class="settings-modal">
            <div class="settings-modal__title">НАСТРОЙКИ</div>
            <div class="settings-controls">
                <div class="settings-title">ЗВУК</div>
                <div class="settings-control">
                    <div class="settings-control__label">Звуковые эффекты</div>
                    <div class="settings-control__buttons">
                        <button class="settings-control__btn ${soundEnabled ? 'active' : ''}" id="modalSoundOn">🕪</button>
                        <button class="settings-control__btn ${!soundEnabled ? 'active' : ''}" id="modalSoundOff">✖</button>
                    </div>
                </div>
                <div class="settings-control">
                    <div class="settings-control__label">Фоновая музыка</div>
                    <div class="settings-control__buttons">
                        <button class="settings-control__btn ${musicEnabled ? 'active' : ''}" id="modalMusicOn">♬</button>
                        <button class="settings-control__btn ${!musicEnabled ? 'active' : ''}" id="modalMusicOff">✖</button>
                    </div>
                </div>
                <div class="settings-title">ГРАФИКА</div>
                <div class="settings-control">
                    <div class="settings-control__label">Режим экрана</div>
                    <div class="settings-control__buttons">
                        <button class="settings-control__btn ${!isFullscreenActive ? 'active' : ''}" id="modalFullscreenOff">❐</button>
                        <button class="settings-control__btn ${isFullscreenActive ? 'active' : ''}" id="modalFullscreenOn">⛶</button>
                    </div>
                </div>
                <div class="settings-control">
                    <div class="settings-control__label">Вид карт</div>
                    <div class="settings-control__buttons">
                        <select id="cardDisplayMode" class="settings-select">
                            <option value="static" ${cardDisplayMode === 'static' ? 'selected' : ''}>Статические</option>
                            <option value="animated" ${cardDisplayMode === 'animated' ? 'selected' : ''}>Анимированные</option>
                        </select>
                    </div>
                </div>
                <div class="settings-title">ИГРА</div>
                <div class="settings-control">
                    <div class="settings-control__label">Режим игры</div>
                    <div class="settings-control__buttons">
                        <select id="gameMode" class="settings-select">
                            <option value="classic" ${gameMode === 'classic' ? 'selected' : ''}>Классический</option>
                            <option value="cdpred" ${gameMode === 'cdpred' ? 'selected' : ''}>CD Project Red</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modalOverlay);
    setTimeout(() => modalOverlay.classList.add('active'), 10);
    setupSettingsModalEventListeners(modalOverlay);
}

function setupSettingsModalEventListeners(modalOverlay) {
    const closeModal = () => {
        modalOverlay.classList.remove('active');
        setTimeout(() => {
            modalOverlay.remove();
            if (modalOverlay._escapeHandler) {
                document.removeEventListener('keydown', modalOverlay._escapeHandler);
            }
        }, 300);
        audioManager.playSound('button');
    };
    
    const handlers = {
        modalSoundOn: () => !audioManager.soundEnabled && toggleSound(),
        modalSoundOff: () => audioManager.soundEnabled && toggleSound(),
        modalMusicOn: () => !audioManager.musicEnabled && toggleMusic(),
        modalMusicOff: () => audioManager.musicEnabled && toggleMusic(),
        modalFullscreenOn: () => !fullscreenAPI.isActive() && fullscreenAPI.enter(),
        modalFullscreenOff: () => fullscreenAPI.isActive() && fullscreenAPI.exit()
    };
    
    const toggleSound = () => {
        audioManager.toggleSound();
        settingsModule.settings.soundEnabled = audioManager.soundEnabled;
        settingsModule.saveSettings();
        updateButtons();
        audioManager.playSound('button');
    };
    
    const toggleMusic = () => {
        audioManager.toggleMusic();
        settingsModule.settings.musicEnabled = audioManager.musicEnabled;
        settingsModule.saveSettings();
        updateButtons();
        audioManager.playSound('button');
    };
    
    const updateButtons = () => {
        const soundOn = document.getElementById('modalSoundOn');
        const soundOff = document.getElementById('modalSoundOff');
        const musicOn = document.getElementById('modalMusicOn');
        const musicOff = document.getElementById('modalMusicOff');
        
        if (soundOn) soundOn.classList.toggle('active', audioManager.soundEnabled);
        if (soundOff) soundOff.classList.toggle('active', !audioManager.soundEnabled);
        if (musicOn) musicOn.classList.toggle('active', audioManager.musicEnabled);
        if (musicOff) musicOff.classList.toggle('active', !audioManager.musicEnabled);
        updateFullscreenButtonsUI();
    };
    
    const updateFullscreenButtonsUI = () => {
        const fullscreenOn = document.getElementById('modalFullscreenOn');
        const fullscreenOff = document.getElementById('modalFullscreenOff');
        const isFull = fullscreenAPI.isActive();
        if (fullscreenOn) fullscreenOn.classList.toggle('active', isFull);
        if (fullscreenOff) fullscreenOff.classList.toggle('active', !isFull);
    };
    
    Object.entries(handlers).forEach(([id, handler]) => {
        const btn = document.getElementById(id);
        if (btn) btn.addEventListener('click', handler);
    });
    
    document.getElementById('cardDisplayMode')?.addEventListener('change', (e) => {
        settingsModule.setCardDisplayMode(e.target.value);
        audioManager.playSound('button');
    });
    
    document.getElementById('gameMode')?.addEventListener('change', (e) => {
        settingsModule.setGameMode(e.target.value);
        audioManager.playSound('button');
    });
    
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });
    
    const escapeHandler = (e) => {
        if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', escapeHandler);
    modalOverlay._escapeHandler = escapeHandler;
    
    const fullscreenChangeHandler = () => updateFullscreenButtonsUI();
    document.addEventListener('fullscreenchange', fullscreenChangeHandler);
    modalOverlay._fullscreenHandler = fullscreenChangeHandler;
    
    updateButtons();
}

window.fullscreenManager = fullscreenAPI;

document.addEventListener('DOMContentLoaded', () => settingsModule.init());