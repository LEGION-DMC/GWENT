function showSettingsModal() {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'settings-modal-overlay';
    
    // Получаем текущее состояние полноэкранного режима
    const isFullscreenActive = window.fullscreenManager && window.fullscreenManager.isFullscreen();
    
    modalOverlay.innerHTML = `
        <div class="settings-modal">
            <div class="settings-modal__title">НАСТРОЙКИ</div>
            <div class="settings-controls">
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
    // Обработчики для звука
    document.getElementById('modalSoundOn').addEventListener('click', () => {
        if (!audioManager.soundEnabled) {
            audioManager.toggleSound();
            updateSettingsButtons();
            audioManager.playSound('button'); 
        }
    });
    
    document.getElementById('modalSoundOff').addEventListener('click', () => {
        if (audioManager.soundEnabled) {
            audioManager.toggleSound();
            updateSettingsButtons();
            audioManager.playSound('button');
        }
    });
    
    // Обработчики для музыки
    document.getElementById('modalMusicOn').addEventListener('click', () => {
        if (!audioManager.musicEnabled) {
            audioManager.toggleMusic();
            updateSettingsButtons();
            audioManager.playSound('button');
        }
    });
    
    document.getElementById('modalMusicOff').addEventListener('click', () => {
        if (audioManager.musicEnabled) {
            audioManager.toggleMusic();
            updateSettingsButtons();
            audioManager.playSound('button');
        }
    });
    
    // Обработчики для полноэкранного режима
    document.getElementById('modalFullscreenOn').addEventListener('click', () => {
        if (window.fullscreenManager && !window.fullscreenManager.isFullscreen()) {
            window.fullscreenManager.enterFullscreen();
            updateSettingsButtons();
            audioManager.playSound('button');
        }
    });
    
    document.getElementById('modalFullscreenOff').addEventListener('click', () => {
        if (window.fullscreenManager && window.fullscreenManager.isFullscreen()) {
            window.fullscreenManager.exitFullscreen();
            updateSettingsButtons();
            audioManager.playSound('button');
        }
    });

    function updateSettingsButtons() {
        const soundOnBtn = document.getElementById('modalSoundOn');
        const soundOffBtn = document.getElementById('modalSoundOff');
        const musicOnBtn = document.getElementById('modalMusicOn');
        const musicOffBtn = document.getElementById('modalMusicOff');
        const fullscreenOnBtn = document.getElementById('modalFullscreenOn');
        const fullscreenOffBtn = document.getElementById('modalFullscreenOff');
        
        // Обновляем кнопки звука
        if (soundOnBtn && soundOffBtn) {
            soundOnBtn.classList.toggle('active', audioManager.soundEnabled);
            soundOffBtn.classList.toggle('active', !audioManager.soundEnabled);
        }
        
        // Обновляем кнопки музыки
        if (musicOnBtn && musicOffBtn) {
            musicOnBtn.classList.toggle('active', audioManager.musicEnabled);
            musicOffBtn.classList.toggle('active', !audioManager.musicEnabled);
        }
        
        // Обновляем кнопки полноэкранного режима
        if (fullscreenOnBtn && fullscreenOffBtn) {
            const isFullscreen = window.fullscreenManager && window.fullscreenManager.isFullscreen();
            fullscreenOnBtn.classList.toggle('active', isFullscreen);
            fullscreenOffBtn.classList.toggle('active', !isFullscreen);
        }
    }
    
    // Закрытие модального окна по клику вне
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeSettingsModal();
        }
    });
    
    // Закрытие по Escape
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            closeSettingsModal();
        }
    };
    document.addEventListener('keydown', escapeHandler);
    
    function closeSettingsModal() {
        modalOverlay.classList.remove('active');
        
        setTimeout(() => {
            if (modalOverlay.parentNode) {
                modalOverlay.parentNode.removeChild(modalOverlay);
            }
            document.removeEventListener('keydown', escapeHandler);
        }, 300);
        
        audioManager.playSound('button');
    }
    
    modalOverlay.escapeHandler = escapeHandler;
    
    // Инициализируем состояние кнопок при открытии
    updateSettingsButtons();
}