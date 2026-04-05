const audioManager = {
    soundEnabled: true,
    musicEnabled: true,
    backgroundMusic: null,
    currentMusicTrack: 'seadogs',
    sounds: {},
    isFirstInteractionHandled: false,
    soundCooldowns: {},
    cooldownTime: 150,
    _musicPlaying: false,
    _wasMusicPlaying: false,
    _savedMusicTrack: 'seadogs',

    musicTracks: {
        northern: 'sfx/northern.mp3',
        seadogs: 'sfx/seadogs.mp3',
        glory: 'sfx/glory.mp3'
    },

    init() {
        this.loadSettings();
        this.createAudioElements();
        this.setupEventListeners();
        if (this.musicEnabled) {
            this.playBackgroundMusic();
        }
    },

    loadSettings() {
        try {
            const savedSettings = localStorage.getItem('gwentSettings');
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                this.soundEnabled = settings.soundEnabled ?? true;
                this.musicEnabled = settings.musicEnabled ?? true;
                this.currentMusicTrack = settings.musicTrack ?? 'seadogs';
                this._savedMusicTrack = this.currentMusicTrack;
            } else {
                this.currentMusicTrack = 'seadogs';
                this._savedMusicTrack = 'seadogs';
            }
        } catch (e) {}
    },

    saveAudioSettings() {
        try {
            const currentSettings = JSON.parse(localStorage.getItem('gwentSettings') || '{}');
            currentSettings.soundEnabled = this.soundEnabled;
            currentSettings.musicEnabled = this.musicEnabled;
            currentSettings.musicTrack = this.currentMusicTrack;
            localStorage.setItem('gwentSettings', JSON.stringify(currentSettings));
        } catch (e) {}
    },

    createAudioElements() {
        const trackPath = this.musicTracks[this.currentMusicTrack] || this.musicTracks.seadogs;
        this.backgroundMusic = new Audio(trackPath);
        this.backgroundMusic.loop = true;
        this.backgroundMusic.volume = 0.3;

        const soundFiles = {
            button: 'sfx/button.mp3',
            touch: 'sfx/touch.mp3',
            warning: 'sfx/warning.mp3',
            lock: 'sfx/lock.mp3',
            cardAdd: 'sfx/card_add.mp3',
            cardRemove: 'sfx/card_remove.mp3',
            card_selected: 'sfx/card-selected.mp3',
            weatherFrost: 'sfx/frost.mp3',
            weatherFog: 'sfx/fog.mp3',
            weatherRain: 'sfx/rain.mp3',
            weatherClear: 'sfx/clear.mp3',
            round_start: 'sfx/round_start.mp3',
            win: 'sfx/win.mp3',
            lose: 'sfx/lose.mp3',
            draw: 'sfx/draw.mp3',
            scorch: 'sfx/scorch.mp3',
            card_close: 'sfx/card_close.wav',
            card_range: 'sfx/card_range.wav',
            card_siege: 'sfx/card_siege.wav',
            artefact: 'sfx/artefact.wav',
        };

        for (const [key, src] of Object.entries(soundFiles)) {
            this.sounds[key] = new Audio(src);
            this.sounds[key].volume = 0.5;
        }

        ['weatherFrost', 'weatherFog', 'weatherRain'].forEach(key => {
            if (this.sounds[key]) this.sounds[key].volume = 0.4;
        });
        if (this.sounds.weatherClear) this.sounds.weatherClear.volume = 0.6;
    },

    changeMusicTrack(trackId) {
        if (trackId === this.currentMusicTrack) return;

        const wasPlaying = this._musicPlaying;

        this.currentMusicTrack = trackId;
        this._savedMusicTrack = trackId;
        this.saveAudioSettings();

        const newTrackPath = this.musicTracks[trackId];
        const newTrack = new Audio(newTrackPath);
        newTrack.loop = true;
        newTrack.volume = this.backgroundMusic ? this.backgroundMusic.volume : 0.3;

        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
            this.backgroundMusic = null;
        }

        this.backgroundMusic = newTrack;

        if (this.musicEnabled && wasPlaying) {
            this._musicPlaying = true;
            this.backgroundMusic.play().catch(() => {});
        }
    },

    setBattleMusic() {
        if (!this.musicEnabled) return;

        const wasPlaying = this._musicPlaying;

        this._savedMusicTrack = this.currentMusicTrack;

        const battleTrack = new Audio(this.musicTracks.glory);
        battleTrack.loop = true;
        battleTrack.volume = this.backgroundMusic ? this.backgroundMusic.volume : 0.3;

        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
            this.backgroundMusic = null;
        }

        this.backgroundMusic = battleTrack;
        this.currentMusicTrack = 'glory';

        if (wasPlaying) {
            this._musicPlaying = true;
            this.backgroundMusic.play().catch(() => {});
        }
    },

    restoreSavedMusic() {
        if (!this.musicEnabled) return;

        const wasPlaying = this._musicPlaying;
        const savedTrack = this._savedMusicTrack || 'seadogs';

        const savedTrackPath = this.musicTracks[savedTrack] || this.musicTracks.seadogs;
        const newTrack = new Audio(savedTrackPath);
        newTrack.loop = true;
        newTrack.volume = this.backgroundMusic ? this.backgroundMusic.volume : 0.3;

        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
            this.backgroundMusic = null;
        }

        this.backgroundMusic = newTrack;
        this.currentMusicTrack = savedTrack;

        if (wasPlaying) {
            this._musicPlaying = true;
            this.backgroundMusic.play().catch(() => {});
        }
    },

    setupEventListeners() {
        const handler = () => this.handleFirstInteraction();
        ['click', 'touchstart', 'keydown'].forEach(event => {
            document.addEventListener(event, handler, { once: true });
        });
    },

    handleFirstInteraction() {
        if (this.isFirstInteractionHandled) return;
        this.isFirstInteractionHandled = true;
        if (this.musicEnabled && this.backgroundMusic && this.backgroundMusic.paused) {
            this.playBackgroundMusic();
        }
    },

    playBackgroundMusic() {
        if (this.backgroundMusic && this.musicEnabled) {
            this._musicPlaying = true;
            this.backgroundMusic.currentTime = 0;
            this.backgroundMusic.play().catch(() => {});
        }
    },

    stopBackgroundMusic() {
        if (this.backgroundMusic) {
            this._musicPlaying = false;
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
        }
    },

    resumeBackgroundMusic() {
        if (this.musicEnabled && !this._musicPlaying && this.backgroundMusic) {
            this._musicPlaying = true;
            this.backgroundMusic.play().catch(() => {});
        }
    },

    isMusicPlaying() {
        return this._musicPlaying;
    },

    playSound(soundName) {
        if (!this.soundEnabled || !this.sounds[soundName]) return;

        const now = Date.now();
        if (this.soundCooldowns[soundName] && now - this.soundCooldowns[soundName] < this.cooldownTime) {
            return;
        }
        this.soundCooldowns[soundName] = now;

        const sound = this.sounds[soundName].cloneNode();
        sound.volume = this.sounds[soundName].volume;
        sound.play().catch(() => {});
    },

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        this.saveAudioSettings();
        return this.soundEnabled;
    },

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        this.saveAudioSettings();
        if (this.musicEnabled) {
            this.playBackgroundMusic();
        } else {
            this.stopBackgroundMusic();
        }
        return this.musicEnabled;
    },

    setMusicVolume(volume) {
        if (this.backgroundMusic) {
            this.backgroundMusic.volume = Math.max(0, Math.min(1, volume));
        }
    },

    setSoundVolume(volume) {
        const newVolume = Math.max(0, Math.min(1, volume));
        Object.values(this.sounds).forEach(sound => {
            sound.volume = newVolume;
        });
    },

    playWeatherSound(weatherType) {
        if (!this.soundEnabled) return;

        const weatherSounds = {
            frost: 'weatherFrost',
            fog: 'weatherFog',
            rain: 'weatherRain',
            clear: 'weatherClear'
        };

        const soundKey = weatherSounds[weatherType];
        if (soundKey && this.sounds[soundKey]) {
            const sound = this.sounds[soundKey].cloneNode();
            sound.volume = this.sounds[soundKey].volume;
            sound.play().catch(() => {});
        }
    },

    getCurrentMusicTrack() {
        return this.currentMusicTrack;
    },

    getMusicTrackDisplayName() {
        return this.currentMusicTrack === 'northern' ? 'Northern Realms' :
               this.currentMusicTrack === 'glory' ? 'Battle Theme' : 'Sea Dogs';
    }
};

window.addEventListener('load', () => {
    audioManager.init();
});

window.audioManager = audioManager;