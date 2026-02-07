const settingsModule = {
    settings: {
        soundEnabled: true,
        musicEnabled: true,
        cardDisplayMode: 'static',
        gameMode: 'classic'
    },

    _musicFirstInit: true,

    init: function() {
        this.loadSettings();
        this.applyAudioSettings();
        this._musicFirstInit = false;
    },

    loadSettings: function() {
        const savedSettings = localStorage.getItem('gwentSettings');
        if (savedSettings) {
            this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
        }
    },

    saveSettings: function() {
        localStorage.setItem('gwentSettings', JSON.stringify(this.settings));
        this.applyAudioSettings();
        this.notifySettingsChange();
    },

    applyAudioSettings: function() {
        if (window.audioManager) {
            audioManager.soundEnabled = this.settings.soundEnabled;
            audioManager.musicEnabled = this.settings.musicEnabled;
            
            if (this.settings.musicEnabled) {
                if (this._musicFirstInit) {
                    audioManager.playBackgroundMusic();
                }
                else if (!audioManager._wasMusicPlaying) {
                    audioManager.resumeBackgroundMusic();
                }
            } 
            else {
                audioManager._wasMusicPlaying = audioManager.isMusicPlaying();
                audioManager.stopBackgroundMusic();
            }
        }
    },

    notifySettingsChange: function() {
        if (window.gameModule && window.gameModule.onSettingsChange) {
            window.gameModule.onSettingsChange(this.settings);
        }
        if (window.deckModule && window.deckModule.onSettingsChange) {
            window.deckModule.onSettingsChange(this.settings);
        }
    },

    getCardDisplayMode: function() {
        return this.settings.cardDisplayMode;
    },

    setCardDisplayMode: function(mode) {
        this.settings.cardDisplayMode = mode;
        this.saveSettings();
    },

    getGameMode: function() {
        return this.settings.gameMode;
    },

    setGameMode: function(mode) {
        this.settings.gameMode = mode;
        this.saveSettings();
    }
};

window.settingsModule = settingsModule;

if (window.audioManager) {
    if (!audioManager._originalPlayBackgroundMusic) {
        audioManager._originalPlayBackgroundMusic = audioManager.playBackgroundMusic;
    }
    
    audioManager.resumeBackgroundMusic = function() {
        if (this.isMusicPlaying && this.isMusicPlaying()) {
            return;
        }
        
        if (this._originalPlayBackgroundMusic) {
            this._originalPlayBackgroundMusic();
        } else if (this.playBackgroundMusic) {
            this.playBackgroundMusic();
        }
    };
    
    audioManager.isMusicPlaying = function() {
        return this.musicEnabled && this._musicPlaying;
    };
    
    audioManager._wasMusicPlaying = false;
    audioManager._musicPlaying = false;
    
    const originalPlay = audioManager.playBackgroundMusic;
    audioManager.playBackgroundMusic = function() {
        this._musicPlaying = true;
        if (originalPlay) {
            originalPlay.call(this);
        }
    };
    
    const originalStop = audioManager.stopBackgroundMusic;
    audioManager.stopBackgroundMusic = function() {
        this._musicPlaying = false;
        if (originalStop) {
            originalStop.call(this);
        }
    };
}

function showSettingsModal() {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'settings-modal-overlay';
    const isFullscreenActive = isFullscreen();
    const currentCardMode = settingsModule.getCardDisplayMode();
    const currentGameMode = settingsModule.getGameMode();
    
    modalOverlay.innerHTML = `
        <div class="settings-modal">
            <div class="settings-modal__title">НАСТРОЙКИ</div>
            <div class="settings-controls">
                <div class="settings-title">ЗВУК</div>
                <div class="settings-control">
                    <div class="settings-control__label">Звуковые эффекты</div>
                    <div class="settings-control__buttons">
                        <button class="settings-control__btn ${audioManager.soundEnabled ? 'active' : ''}" 
                                id="modalSoundOn" title="Включить звуковые эффекты">
                            🕪
                        </button>
                        <button class="settings-control__btn ${!audioManager.soundEnabled ? 'active' : ''}" 
                                id="modalSoundOff" title="Выключить звуковые эффекты">
                            ✖
                        </button>
                    </div>
                </div>
                <div class="settings-control">
                    <div class="settings-control__label">Фоновая музыка</div>
                    <div class="settings-control__buttons">
                        <button class="settings-control__btn ${audioManager.musicEnabled ? 'active' : ''}" 
                                id="modalMusicOn" title="Включить фоновую музыку">
                            ♬
                        </button>
                        <button class="settings-control__btn ${!audioManager.musicEnabled ? 'active' : ''}" 
                                id="modalMusicOff" title="Выключить фоновую музыку">
                            ✖
                        </button>
                    </div>
                </div>
                <div class="settings-title">ГРАФИКА</div>
                <div class="settings-control">
                    <div class="settings-control__label">Режим экрана</div>
                    <div class="settings-control__buttons">
                        <button class="settings-control__btn ${!isFullscreenActive ? 'active' : ''}" 
                                id="modalFullscreenOff" title="Оконный режим">
                            ❐
                        </button>
                        <button class="settings-control__btn ${isFullscreenActive ? 'active' : ''}" 
                                id="modalFullscreenOn" title="Полноэкранный режим">
                            ⛶
                        </button>
                    </div>
                </div>
                <div class="settings-control">
                    <div class="settings-control__label">Вид карт</div>
                    <div class="settings-control__buttons">
                        <select id="cardDisplayMode" class="settings-select">
                            <option value="static" ${currentCardMode === 'static' ? 'selected' : ''}>Статические</option>
                            <option value="animated" ${currentCardMode === 'animated' ? 'selected' : ''}>Анимированные</option>
                        </select>
                    </div>
                </div>
                <div class="settings-title">ИГРА</div>
                <div class="settings-control">
                    <div class="settings-control__label">Режим игры</div>
                    <div class="settings-control__buttons">
                        <select id="gameMode" class="settings-select">
                            <option value="classic" ${currentGameMode === 'classic' ? 'selected' : ''} title="Раздаётся 10 карт на всю игру">Классический</option>
                            <option value="cdpred" ${currentGameMode === 'cdpred' ? 'selected' : ''} title="Каждый раунд карты раздаются до 10 на руку">CD Project Red</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modalOverlay);
    
    setTimeout(() => {
        modalOverlay.classList.add('active');
    }, 10);
    
    setupSettingsModalEventListeners(modalOverlay);
}

function setupSettingsModalEventListeners(modalOverlay) {
    document.getElementById('modalSoundOn').addEventListener('click', () => {
        if (!audioManager.soundEnabled) {
            audioManager.toggleSound();
            settingsModule.settings.soundEnabled = audioManager.soundEnabled;
            settingsModule.saveSettings();
            updateSettingsButtons();
            audioManager.playSound('button');
        }
    });

    document.getElementById('modalSoundOff').addEventListener('click', () => {
        if (audioManager.soundEnabled) {
            audioManager.toggleSound();
            settingsModule.settings.soundEnabled = audioManager.soundEnabled;
            settingsModule.saveSettings();
            updateSettingsButtons();
            audioManager.playSound('button');
        }
    });

    document.getElementById('modalMusicOn').addEventListener('click', () => {
        if (!audioManager.musicEnabled) {
            audioManager.toggleMusic();
            settingsModule.settings.musicEnabled = audioManager.musicEnabled;
            settingsModule.saveSettings();
            updateSettingsButtons();
            audioManager.playSound('button');
        }
    });

    document.getElementById('modalMusicOff').addEventListener('click', () => {
        if (audioManager.musicEnabled) {
            audioManager.toggleMusic();
            settingsModule.settings.musicEnabled = audioManager.musicEnabled;
            settingsModule.saveSettings();
            updateSettingsButtons();
            audioManager.playSound('button');
        }
    });

    document.getElementById('modalFullscreenOn').addEventListener('click', () => {
        if (!isFullscreen()) {
            enterFullscreen();
            audioManager.playSound('button');
        }
    });

    document.getElementById('modalFullscreenOff').addEventListener('click', () => {
        if (isFullscreen()) {
            exitFullscreen();
            audioManager.playSound('button');
        }
    });

    const cardDisplayMode = document.getElementById('cardDisplayMode');
    if (cardDisplayMode) {
        cardDisplayMode.addEventListener('change', (e) => {
            settingsModule.setCardDisplayMode(e.target.value);
            audioManager.playSound('button');
        });
    }

    const gameMode = document.getElementById('gameMode');
    if (gameMode) {
        gameMode.addEventListener('change', (e) => {
            settingsModule.setGameMode(e.target.value);
            audioManager.playSound('button');
        });
    }

    function updateSettingsButtons() {
        const soundOnBtn = document.getElementById('modalSoundOn');
        const soundOffBtn = document.getElementById('modalSoundOff');
        const musicOnBtn = document.getElementById('modalMusicOn');
        const musicOffBtn = document.getElementById('modalMusicOff');
        
        if (soundOnBtn && soundOffBtn) {
            soundOnBtn.classList.toggle('active', audioManager.soundEnabled);
            soundOffBtn.classList.toggle('active', !audioManager.soundEnabled);
        }
        if (musicOnBtn && musicOffBtn) {
            musicOnBtn.classList.toggle('active', audioManager.musicEnabled);
            musicOffBtn.classList.toggle('active', !audioManager.musicEnabled);
        }
        updateFullscreenButtons();
    }

    function closeSettingsModal(modalOverlay) {
        modalOverlay.classList.remove('active');
        setTimeout(() => {
            if (modalOverlay.parentNode) {
                modalOverlay.parentNode.removeChild(modalOverlay);
            }
            if (modalOverlay.escapeHandler) {
                document.removeEventListener('keydown', modalOverlay.escapeHandler);
            }
        }, 300);
        audioManager.playSound('button');
    }

    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeSettingsModal(modalOverlay);
        }
    });
    
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            closeSettingsModal(modalOverlay);
        }
    };
    
    document.addEventListener('keydown', escapeHandler);
    modalOverlay.escapeHandler = escapeHandler;
    updateSettingsButtons();
}

function enterFullscreen() {
    const docElement = document.documentElement;
    if (docElement.requestFullscreen) {
        docElement.requestFullscreen();
    } else if (docElement.mozRequestFullScreen) {
        docElement.mozRequestFullScreen();
    } else if (docElement.webkitRequestFullscreen) {
        docElement.webkitRequestFullscreen();
    } else if (docElement.msRequestFullscreen) {
        docElement.msRequestFullscreen();
    }
}

function exitFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    }
}

function isFullscreen() {
    return !!(document.fullscreenElement ||
             document.mozFullScreenElement ||
             document.webkitFullscreenElement ||
             document.msFullscreenElement);
}

function updateFullscreenButtons() {
    const fullscreenOnBtn = document.getElementById('modalFullscreenOn');
    const fullscreenOffBtn = document.getElementById('modalFullscreenOff');
    
    if (fullscreenOnBtn && fullscreenOffBtn) {
        const fullscreenActive = isFullscreen();
        fullscreenOnBtn.classList.toggle('active', fullscreenActive);
        fullscreenOffBtn.classList.toggle('active', !fullscreenActive);
    }
}

function handleFullscreenChange() {
    updateFullscreenButtons();
}

document.addEventListener('fullscreenchange', handleFullscreenChange);
document.addEventListener('mozfullscreenchange', handleFullscreenChange);
document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
document.addEventListener('msfullscreenchange', handleFullscreenChange);

window.fullscreenManager = {
    enterFullscreen,
    exitFullscreen,
    isFullscreen,
    updateFullscreenButtons
};

window.updateFullscreenButtons = updateFullscreenButtons;

document.addEventListener('DOMContentLoaded', function() {
    if (window.settingsModule) {
        settingsModule.init();
    }
});