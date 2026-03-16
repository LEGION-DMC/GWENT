// P2P соединение для Gwent
class P2PManager {
    constructor() {
        this.peer = null;
        this.connection = null;
        this.isHost = false;
        this.connected = false;
        this.roomId = null;
        this.playerData = {
            id: null,
            name: 'Игрок',
            faction: null,
            deck: null,
            ready: false
        };
        this.opponentData = null;
        this.onConnectionCallbacks = [];
        this.onDataCallbacks = [];
        this.onDisconnectCallbacks = [];
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 3;
        this.pendingData = [];
        
        // Используем публичные серверы PeerJS
        this.peerOptions = {
            debug: 2,
            config: {
                'iceServers': [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' },
                    { urls: 'stun:stun3.l.google.com:19302' },
                    { urls: 'stun:stun4.l.google.com:19302' },
                    {
                        urls: 'turn:relay1.expressturn.com:3478',
                        username: 'efGHIJKLMNOPQRSTUVWXYZ',
                        credential: 'your-turn-credential'
                    }
                ]
            }
        };
    }

    // Инициализация P2P
    async initialize() {
        return new Promise((resolve, reject) => {
            try {
                const peerId = 'gwent_' + Math.random().toString(36).substring(2, 10);
                this.peer = new Peer(peerId, this.peerOptions);

                this.peer.on('open', (id) => {
                    console.log('P2P инициализирован с ID:', id);
                    this.playerData.id = id;
                    this.setupPeerListeners();
                    resolve(id);
                });

                this.peer.on('error', (error) => {
                    console.error('Ошибка P2P:', error);
                    this.handleError(error);
                    reject(error);
                });

            } catch (error) {
                console.error('Ошибка инициализации P2P:', error);
                reject(error);
            }
        });
    }

    // Настройка слушателей Peer
    setupPeerListeners() {
        this.peer.on('connection', (conn) => {
            console.log('Входящее соединение от:', conn.peer);
            this.handleIncomingConnection(conn);
        });

        this.peer.on('disconnected', () => {
            console.log('P2P отключен от сервера');
            this.handleDisconnect();
        });

        this.peer.on('close', () => {
            console.log('P2P соединение закрыто');
            this.cleanup();
        });
    }

    // Обработка входящего соединения
    handleIncomingConnection(conn) {
        this.connection = conn;
        this.isHost = true;
        this.setupConnectionListeners(conn);
        
        setTimeout(() => {
            this.sendPlayerData();
        }, 1000);
    }

    // Настройка слушателей соединения
    setupConnectionListeners(conn) {
        conn.on('open', () => {
            console.log('Соединение установлено');
            this.connected = true;
            this.reconnectAttempts = 0;
            this.triggerCallbacks('connection');
        });

        conn.on('data', (data) => {
            console.log('Получены данные:', data.type);
            this.handleData(data);
        });

        conn.on('error', (error) => {
            console.error('Ошибка соединения:', error);
            this.handleError(error);
        });

        conn.on('close', () => {
            console.log('Соединение закрыто');
            this.handleDisconnect();
        });
    }

    // Обработка полученных данных
    handleData(data) {
        switch (data.type) {
            case 'player-data':
                this.opponentData = data.data;
                this.triggerCallbacks('playerData', this.opponentData);
                break;
                
            case 'game-action':
                this.triggerCallbacks('gameAction', data.data);
                break;
                
            case 'chat-message':
                this.triggerCallbacks('chat', data.data);
                break;
                
            case 'ready':
                if (this.opponentData) {
                    this.opponentData.ready = data.ready;
                }
                this.triggerCallbacks('playerReady', data);
                break;
                
            case 'game-start':
                this.triggerCallbacks('gameStart', data.data);
                break;
                
            case 'game-state':
                this.triggerCallbacks('gameState', data.data);
                break;
                
            case 'disconnect':
                this.handleOpponentDisconnect();
                break;
        }
    }

    // Создание комнаты (как хост)
    async createRoom(playerName, faction, deck) {
        try {
            if (!this.peer) {
                await this.initialize();
            }
            
            this.playerData.name = playerName || 'Хост';
            this.playerData.faction = faction;
            this.playerData.deck = deck;
            this.isHost = true;
            this.roomId = this.playerData.id;
            
            return this.roomId;
            
        } catch (error) {
            console.error('Ошибка создания комнаты:', error);
            throw error;
        }
    }

    // Подключение к комнате
    async connectToRoom(roomId, playerName, faction, deck) {
        try {
            if (!this.peer) {
                await this.initialize();
            }
            
            console.log('Подключение к комнате:', roomId);
            
            this.playerData.name = playerName || 'Игрок';
            this.playerData.faction = faction;
            this.playerData.deck = deck;
            this.isHost = false;
            this.roomId = roomId;
            
            this.connection = this.peer.connect(roomId, {
                reliable: true,
                serialization: 'json'
            });
            
            this.setupConnectionListeners(this.connection);
            
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Таймаут подключения'));
                }, 30000);
                
                this.connection.on('open', () => {
                    clearTimeout(timeout);
                    this.sendPlayerData();
                    resolve();
                });
                
                this.connection.on('error', (error) => {
                    clearTimeout(timeout);
                    reject(error);
                });
            });
            
        } catch (error) {
            console.error('Ошибка подключения к комнате:', error);
            throw error;
        }
    }

    // Отправка данных игрока
    sendPlayerData() {
        if (this.connection && this.connected) {
            this.connection.send({
                type: 'player-data',
                data: this.playerData
            });
        }
    }

    // Отправка игрового действия
    sendGameAction(action) {
        if (this.connection && this.connected) {
            this.connection.send({
                type: 'game-action',
                data: action
            });
        } else {
            this.pendingData.push({
                type: 'game-action',
                data: action
            });
        }
    }

    // Отправка состояния игры
    sendGameState(state) {
        if (this.connection && this.connected) {
            this.connection.send({
                type: 'game-state',
                data: state
            });
        }
    }

    // Отправка готовности
    sendReady(ready) {
        if (this.connection && this.connected) {
            this.connection.send({
                type: 'ready',
                ready: ready
            });
            this.playerData.ready = ready;
        }
    }

    // Отправка сообщения в чат
    sendChatMessage(message) {
        if (this.connection && this.connected) {
            this.connection.send({
                type: 'chat-message',
                data: {
                    player: this.playerData.name,
                    message: message,
                    timestamp: Date.now()
                }
            });
        }
    }

    // Начать игру
    startGame() {
        if (this.connection && this.connected && this.isHost) {
            this.connection.send({
                type: 'game-start',
                data: {
                    startTime: Date.now(),
                    firstPlayer: Math.random() < 0.5 ? 'host' : 'guest'
                }
            });
            
            // Запускаем игру локально
            setTimeout(() => {
                this.startLocalGame('host');
            }, 500);
        }
    }

    // Запуск локальной игры
    startLocalGame(firstPlayer) {
        if (window.gameModule && window.gameModule.startP2PGame) {
            window.gameModule.startP2PGame(
                this.playerData,
                this.opponentData,
                firstPlayer === 'host' ? this.isHost : !this.isHost
            );
        }
    }

    // Обработка отключения оппонента
    handleOpponentDisconnect() {
        this.opponentData = null;
        this.triggerCallbacks('opponentDisconnect');
        
        // Показываем сообщение в игре
        if (window.gameModule && window.gameModule.showMessage) {
            window.gameModule.showMessage('Оппонент отключился', 'error');
        }
    }

    // Обработка отключения
    handleDisconnect() {
        this.connected = false;
        this.triggerCallbacks('disconnect');
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Попытка переподключения ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
            
            setTimeout(() => {
                if (this.roomId && !this.isHost) {
                    this.connectToRoom(this.roomId, this.playerData.name, this.playerData.faction, this.playerData.deck)
                        .then(() => {
                            this.pendingData.forEach(data => {
                                this.connection.send(data);
                            });
                            this.pendingData = [];
                            
                            if (window.gameModule && window.gameModule.showMessage) {
                                window.gameModule.showMessage('Переподключение выполнено', 'success');
                            }
                        })
                        .catch(() => {});
                }
            }, 3000);
        } else {
            this.cleanup();
            if (window.gameModule && window.gameModule.showMessage) {
                window.gameModule.showMessage('Потеряно соединение с оппонентом', 'error');
            }
        }
    }

    // Обработка ошибок
    handleError(error) {
        let errorMessage = 'Неизвестная ошибка';
        
        switch (error.type) {
            case 'peer-unavailable':
                errorMessage = 'Игрок не найден. Проверьте ID комнаты.';
                break;
            case 'network':
                errorMessage = 'Ошибка сети. Проверьте подключение.';
                break;
            case 'server-error':
                errorMessage = 'Ошибка сервера. Попробуйте позже.';
                break;
            case 'disconnected':
                errorMessage = 'Соединение разорвано.';
                break;
            default:
                errorMessage = error.message || 'Ошибка соединения';
        }
        
        this.triggerCallbacks('error', errorMessage);
    }

    // Отключение
    disconnect() {
        if (this.connection) {
            this.connection.send({
                type: 'disconnect'
            });
            this.connection.close();
        }
        
        if (this.peer) {
            this.peer.destroy();
        }
        
        this.cleanup();
    }

    // Очистка
    cleanup() {
        this.connection = null;
        this.connected = false;
        this.isHost = false;
        this.roomId = null;
        this.opponentData = null;
        this.reconnectAttempts = 0;
        this.pendingData = [];
    }

    // Получение статуса соединения
    isConnected() {
        return this.connected && this.connection && this.connection.open;
    }

    // Получение данных оппонента
    getOpponentData() {
        return this.opponentData;
    }

    // Регистрация колбэков
    on(event, callback) {
        if (!this.onConnectionCallbacks[event]) {
            this.onConnectionCallbacks[event] = [];
        }
        this.onConnectionCallbacks[event].push(callback);
    }

    // Вызов колбэков
    triggerCallbacks(event, data) {
        if (this.onConnectionCallbacks[event]) {
            this.onConnectionCallbacks[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Ошибка в колбэке ${event}:`, error);
                }
            });
        }
    }

    // Очистка всех колбэков
    clearCallbacks() {
        this.onConnectionCallbacks = [];
    }
}

// UI для P2P
class P2PUI {
    constructor(p2pManager) {
        this.p2p = p2pManager;
        this.container = null;
        this.onCloseCallback = null;
        this.onGameStartCallback = null;
    }

    // Показать меню P2P
    showP2PMenu(faction, deck, playerName = 'Игрок') {
        this.hideP2PMenu();
        
        this.container = document.createElement('div');
        this.container.className = 'p2p-container';
        
        this.container.innerHTML = `
            <div class="p2p-box">
                <div class="p2p-title">СЕТЕВАЯ ИГРА</div>
                <div class="p2p-subtitle">Выберите режим подключения</div>
                
                <div class="p2p-buttons">
                    <button class="p2p-btn" id="createRoomBtn">СОЗДАТЬ КОМНАТУ</button>
                    <button class="p2p-btn" id="joinRoomBtn">ПОДКЛЮЧИТЬСЯ</button>
                </div>
                
                <div id="p2pRoomInput" style="display: none;">
                    <input type="text" class="p2p-input" id="roomIdInput" placeholder="Введите ID комнаты">
                    <button class="p2p-btn" id="connectBtn">ПОДКЛЮЧИТЬСЯ</button>
                </div>
                
                <div id="p2pRoomInfo" style="display: none;">
                    <div class="p2p-info">
                        <div>ID вашей комнаты:</div>
                        <div class="p2p-link-area">
                            <span class="p2p-link" id="roomIdDisplay"></span>
                            <button class="p2p-copy-btn" id="copyRoomIdBtn">КОПИРОВАТЬ</button>
                        </div>
                        <div class="p2p-loading"></div>
                        <div class="p2p-status">Ожидание подключения игрока...</div>
                    </div>
                </div>
                
                <div id="p2pConnectionStatus" style="display: none;">
                    <div class="p2p-players">
                        <div class="p2p-player connected" id="player1">
                            <div class="p2p-player__name">${playerName}</div>
                            <div class="p2p-player__faction">${faction ? faction.name : 'Не выбрана'}</div>
                            <div class="p2p-player__status connected">Подключен</div>
                        </div>
                        <div class="p2p-player waiting" id="player2">
                            <div class="p2p-player__name">Оппонент</div>
                            <div class="p2p-player__faction" id="opponentFaction"></div>
                            <div class="p2p-player__status waiting" id="opponentStatus">Ожидание...</div>
                        </div>
                    </div>
                    
                    <div class="p2p-buttons">
                        <button class="p2p-btn" id="readyBtn" disabled>ГОТОВ</button>
                        <button class="p2p-btn danger" id="cancelP2PBtn">ОТМЕНА</button>
                    </div>
                </div>
                
                <div id="p2pError" class="p2p-error" style="display: none;"></div>
            </div>
        `;
        
        document.body.appendChild(this.container);
        
        setTimeout(() => {
            this.container.classList.add('visible');
        }, 10);
        
        this.setupEventListeners(faction, deck, playerName);
    }

    // Скрыть меню P2P
    hideP2PMenu() {
        if (this.container && this.container.parentNode) {
            this.container.classList.remove('visible');
            setTimeout(() => {
                if (this.container && this.container.parentNode) {
                    this.container.parentNode.removeChild(this.container);
                }
            }, 500);
        }
    }

    // Настройка обработчиков
    setupEventListeners(faction, deck, playerName) {
        const createBtn = document.getElementById('createRoomBtn');
        const joinBtn = document.getElementById('joinRoomBtn');
        const connectBtn = document.getElementById('connectBtn');
        const copyBtn = document.getElementById('copyRoomIdBtn');
        const readyBtn = document.getElementById('readyBtn');
        const cancelBtn = document.getElementById('cancelP2PBtn');
        
        if (createBtn) {
            createBtn.addEventListener('click', async () => {
                try {
                    audioManager.playSound('button');
                    
                    document.querySelector('.p2p-buttons').style.display = 'none';
                    
                    const roomInfo = document.getElementById('p2pRoomInfo');
                    roomInfo.style.display = 'block';
                    
                    const roomId = await this.p2p.createRoom(playerName, faction, deck);
                    
                    const roomIdDisplay = document.getElementById('roomIdDisplay');
                    if (roomIdDisplay) {
                        roomIdDisplay.textContent = roomId;
                    }
                    
                    this.setupP2PCallbacks();
                    
                } catch (error) {
                    this.showError('Ошибка создания комнаты: ' + error.message);
                }
            });
        }
        
        if (joinBtn) {
            joinBtn.addEventListener('click', () => {
                audioManager.playSound('button');
                
                document.querySelector('.p2p-buttons').style.display = 'none';
                
                const roomInput = document.getElementById('p2pRoomInput');
                roomInput.style.display = 'block';
            });
        }
        
        if (connectBtn) {
            connectBtn.addEventListener('click', async () => {
                const roomIdInput = document.getElementById('roomIdInput');
                const roomId = roomIdInput.value.trim();
                
                if (!roomId) {
                    this.showError('Введите ID комнаты');
                    return;
                }
                
                try {
                    audioManager.playSound('button');
                    
                    document.getElementById('p2pRoomInput').style.display = 'none';
                    
                    const statusDiv = document.getElementById('p2pConnectionStatus');
                    statusDiv.style.display = 'block';
                    
                    await this.p2p.connectToRoom(roomId, playerName, faction, deck);
                    
                    document.getElementById('opponentStatus').textContent = 'Подключение...';
                    
                    this.setupP2PCallbacks();
                    
                } catch (error) {
                    this.showError('Ошибка подключения: ' + error.message);
                    
                    setTimeout(() => {
                        document.querySelector('.p2p-buttons').style.display = 'flex';
                        document.getElementById('p2pConnectionStatus').style.display = 'none';
                    }, 3000);
                }
            });
        }
        
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const roomId = document.getElementById('roomIdDisplay').textContent;
                navigator.clipboard.writeText(roomId).then(() => {
                    audioManager.playSound('button');
                    copyBtn.textContent = 'СКОПИРОВАНО!';
                    setTimeout(() => {
                        copyBtn.textContent = 'КОПИРОВАТЬ';
                    }, 2000);
                });
            });
        }
        
        if (readyBtn) {
            readyBtn.addEventListener('click', () => {
                audioManager.playSound('button');
                
                const isReady = readyBtn.textContent === 'ГОТОВ';
                this.p2p.sendReady(isReady);
                
                readyBtn.textContent = isReady ? 'НЕ ГОТОВ' : 'ГОТОВ';
                readyBtn.style.borderColor = isReady ? '#4caf50' : '#d4af37';
                
                if (this.p2p.isHost && 
                    this.p2p.playerData.ready && 
                    this.p2p.opponentData && 
                    this.p2p.opponentData.ready) {
                    this.p2p.startGame();
                }
            });
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                audioManager.playSound('button');
                this.p2p.disconnect();
                this.hideP2PMenu();
                if (this.onCloseCallback) {
                    this.onCloseCallback();
                }
            });
        }
    }

    // Настройка колбэков P2P
    setupP2PCallbacks() {
        this.p2p.on('connection', () => {
            document.querySelector('.p2p-buttons').style.display = 'none';
            document.getElementById('p2pRoomInfo').style.display = 'none';
            document.getElementById('p2pRoomInput').style.display = 'none';
            
            const statusDiv = document.getElementById('p2pConnectionStatus');
            statusDiv.style.display = 'block';
            
            const readyBtn = document.getElementById('readyBtn');
            readyBtn.disabled = false;
        });
        
        this.p2p.on('playerData', (opponentData) => {
            const opponentFaction = document.getElementById('opponentFaction');
            const opponentStatus = document.getElementById('opponentStatus');
            
            if (opponentData.faction) {
                opponentFaction.textContent = opponentData.faction.name || 'Не выбрана';
            }
            
            if (opponentData.ready) {
                opponentStatus.textContent = 'Готов';
                opponentStatus.classList.add('connected');
            } else {
                opponentStatus.textContent = 'Не готов';
                opponentStatus.classList.remove('connected');
            }
            
            const player2 = document.getElementById('player2');
            player2.classList.remove('waiting');
            player2.classList.add('connected');
        });
        
        this.p2p.on('playerReady', (data) => {
            const opponentStatus = document.getElementById('opponentStatus');
            
            if (data.ready) {
                opponentStatus.textContent = 'Готов';
                opponentStatus.classList.add('connected');
            } else {
                opponentStatus.textContent = 'Не готов';
                opponentStatus.classList.remove('connected');
            }
        });
        
        this.p2p.on('gameStart', (data) => {
            this.hideP2PMenu();
            
            if (this.onGameStartCallback) {
                this.onGameStartCallback(data);
            } else {
                this.p2p.startLocalGame(data.firstPlayer);
            }
        });
        
        this.p2p.on('gameAction', (action) => {
            if (window.gameModule && window.gameModule.handleOpponentAction) {
                window.gameModule.handleOpponentAction(action);
            }
        });
        
        this.p2p.on('gameState', (state) => {
            if (window.gameModule && window.gameModule.syncGameState) {
                window.gameModule.syncGameState(state);
            }
        });
        
        this.p2p.on('opponentDisconnect', () => {
            this.showError('Оппонент отключился');
            
            const player2 = document.getElementById('player2');
            player2.classList.remove('connected');
            player2.classList.add('waiting');
            
            document.getElementById('opponentStatus').textContent = 'Отключен';
            document.getElementById('opponentStatus').classList.remove('connected');
            
            document.getElementById('readyBtn').disabled = true;
        });
        
        this.p2p.on('error', (error) => {
            this.showError(error);
        });
        
        this.p2p.on('disconnect', () => {
            this.showError('Соединение разорвано');
            document.getElementById('readyBtn').disabled = true;
        });
    }

    // Показать ошибку
    showError(message) {
        const errorDiv = document.getElementById('p2pError');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        }
    }

    // Установка колбэка на закрытие
    onClose(callback) {
        this.onCloseCallback = callback;
    }

    // Установка колбэка на начало игры
    onGameStart(callback) {
        this.onGameStartCallback = callback;
    }
}

// Создаем глобальные экземпляры
window.p2pManager = new P2PManager();
window.p2pUI = new P2PUI(window.p2pManager);

// Экспорт модуля
window.p2pModule = {
    P2PManager,
    P2PUI,
    manager: window.p2pManager,
    ui: window.p2pUI
};