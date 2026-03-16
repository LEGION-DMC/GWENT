// P2P модуль для Gwent с прямым WebRTC соединением
const p2pModule = {
    // Состояние P2P соединения
    rtcConnection: null,
    dataChannel: null,
    connectionStatus: 'disconnected',
    isHost: false,
    gameState: null,
    
    // Обработчики событий
    onConnectionEstablished: null,
    onDataReceived: null,
    onConnectionClosed: null,
    onError: null,
    
    // Оптимизированные ICE серверы
    iceServers: {
        iceServers: [
            // STUN серверы (для определения публичного IP)
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            
            // TURN серверы (для ретрансляции)
            {
                urls: 'turn:openrelay.metered.ca:80',
                username: 'openrelayproject',
                credential: 'openrelayproject'
            },
            {
                urls: 'turn:openrelay.metered.ca:443',
                username: 'openrelayproject',
                credential: 'openrelayproject'
            },
            {
                urls: 'turn:openrelay.metered.ca:443?transport=tcp',
                username: 'openrelayproject',
                credential: 'openrelayproject'
            }
        ]
    },

    // Показать главное меню P2P
    showMainMenu: function() {
        this.hideP2PContainer();
        
        const container = this.createP2PContainer();
        
        const modal = document.createElement('div');
        modal.className = 'p2p-modal';
        modal.innerHTML = `
            <div class="p2p-title">СЕТЕВАЯ ИГРА</div>
            
            <div class="p2p-buttons">
                <button class="p2p-btn create-btn" id="p2pCreateRoom">
                    СОЗДАТЬ ИГРУ
                </button>
                <button class="p2p-btn join-btn" id="p2pJoinRoom">
                    ПРИСОЕДИНИТЬСЯ
                </button>
            </div>
            
            <div class="p2p-buttons" style="margin-top: 10px;">
                <button class="p2p-btn" id="p2pLocalGameBtn">
                    ЛОКАЛЬНАЯ ИГРА
                </button>
            </div>
            
            <div class="p2p-info-text">
                Используется прямое P2P соединение через WebRTC
            </div>
        `;
        
        container.appendChild(modal);
        document.body.appendChild(container);
        
        document.getElementById('p2pCreateRoom').addEventListener('click', () => {
            if (window.audioManager) audioManager.playSound('button');
            this.startHost();
        });
        
        document.getElementById('p2pJoinRoom').addEventListener('click', () => {
            if (window.audioManager) audioManager.playSound('button');
            this.showJoinInput();
        });
        
        document.getElementById('p2pLocalGameBtn').addEventListener('click', () => {
            if (window.audioManager) audioManager.playSound('button');
            this.hideP2PContainer();
            if (window.factionModule) {
                window.factionModule.initFactionSelection();
            }
        });
    },

    // Начать как хост
    startHost: function() {
        this.isHost = true;
        this.showConnectionInterface('host');
        this.createRTCConnection(true);
    },

    // Показать интерфейс для подключения
    showJoinInput: function() {
        this.isHost = false;
        this.showConnectionInterface('client');
    },

    // Показать интерфейс соединения
    showConnectionInterface: function(type) {
        this.hideP2PContainer();
        
        const container = this.createP2PContainer();
        
        const modal = document.createElement('div');
        modal.className = 'p2p-modal';
        
        if (type === 'host') {
            modal.innerHTML = `
                <div class="p2p-title">СОЗДАНИЕ ИГРЫ</div>
                
                <div class="p2p-status connecting">
                    <span class="p2p-loading"></span>
                    Создание offer...
                </div>
                
                <div class="p2p-code-display" id="offerDisplay" style="display: none;">
                    <div class="p2p-code-label">КОД ПРИГЛАШЕНИЯ</div>
                    <textarea class="p2p-input" id="offerText" rows="6" readonly style="height: auto; font-size: 11px; letter-spacing: normal;"></textarea>
                    <button class="p2p-btn" id="copyOfferBtn">КОПИРОВАТЬ</button>
                </div>
                
                <div class="p2p-code-display" id="answerDisplay" style="display: none;">
                    <div class="p2p-code-label">ВСТАВЬТЕ ОТВЕТ</div>
                    <textarea class="p2p-input" id="answerText" rows="6" style="height: auto; font-size: 11px; letter-spacing: normal;"></textarea>
                    <button class="p2p-btn" id="submitAnswerBtn">ПОДКЛЮЧИТЬСЯ</button>
                </div>
                
                <div class="p2p-buttons">
                    <button class="p2p-btn" id="p2pBackBtn">НАЗАД</button>
                </div>
                
                <div class="p2p-info-text">
                    Шаг 1: Скопируйте код и отправьте другу<br>
                    Шаг 2: Вставьте ответ и нажмите "ПОДКЛЮЧИТЬСЯ"
                </div>
            `;
        } else {
            modal.innerHTML = `
                <div class="p2p-title">ПОДКЛЮЧЕНИЕ</div>
                
                <div class="p2p-code-display">
                    <div class="p2p-code-label">ВСТАВЬТЕ КОД ПРИГЛАШЕНИЯ</div>
                    <textarea class="p2p-input" id="offerText" rows="6" style="height: auto; font-size: 11px; letter-spacing: normal;"></textarea>
                    <button class="p2p-btn" id="submitOfferBtn">ПОДКЛЮЧИТЬСЯ</button>
                </div>
                
                <div class="p2p-code-display" id="answerDisplay" style="display: none;">
                    <div class="p2p-code-label">КОД ОТВЕТА</div>
                    <textarea class="p2p-input" id="answerText" rows="6" readonly style="height: auto; font-size: 11px; letter-spacing: normal;"></textarea>
                    <button class="p2p-btn" id="copyAnswerBtn">КОПИРОВАТЬ</button>
                </div>
                
                <div class="p2p-buttons">
                    <button class="p2p-btn" id="p2pBackBtn">НАЗАД</button>
                </div>
                
                <div class="p2p-info-text">
                    Шаг 1: Вставьте код и нажмите "ПОДКЛЮЧИТЬСЯ"<br>
                    Шаг 2: Скопируйте ответ и отправьте другу
                </div>
            `;
        }
        
        container.appendChild(modal);
        document.body.appendChild(container);
        
        document.getElementById('p2pBackBtn').addEventListener('click', () => {
            if (window.audioManager) audioManager.playSound('button');
            this.closeConnection();
            this.showMainMenu();
        });
        
        if (type === 'host') {
            // Обработчики уже будут добавлены в createRTCConnection
        } else {
            document.getElementById('submitOfferBtn').addEventListener('click', () => {
                const offerText = document.getElementById('offerText').value;
                if (offerText) {
                    this.handleRemoteOffer(offerText);
                }
            });
        }
    },

    // Создание RTC соединения
    createRTCConnection: function(isInitiator) {
        try {
            this.rtcConnection = new RTCPeerConnection(this.iceServers);
            
            // Обработка ICE кандидатов
            this.rtcConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log('ICE candidate найден:', event.candidate.type);
                }
            };
            
            // Обработка изменений состояния
            this.rtcConnection.onconnectionstatechange = () => {
                console.log('Состояние соединения:', this.rtcConnection.connectionState);
                
                if (this.rtcConnection.connectionState === 'connected') {
                    this.onRTCConnected();
                } else if (this.rtcConnection.connectionState === 'failed') {
                    this.showError('Не удалось установить соединение. Попробуйте снова.');
                }
            };
            
            this.rtcConnection.oniceconnectionstatechange = () => {
                console.log('ICE состояние:', this.rtcConnection.iceConnectionState);
            };

            if (isInitiator) {
                // Создаем канал данных
                this.dataChannel = this.rtcConnection.createDataChannel('gameChannel', {
                    ordered: true
                });
                this.setupDataChannel(this.dataChannel);
                
                // Создаем offer
                this.rtcConnection.createOffer()
                    .then(offer => this.rtcConnection.setLocalDescription(offer))
                    .then(() => {
                        const offerDisplay = document.getElementById('offerDisplay');
                        const offerText = document.getElementById('offerText');
                        if (offerDisplay && offerText) {
                            offerDisplay.style.display = 'block';
                            offerText.value = JSON.stringify({
                                sdp: this.rtcConnection.localDescription.sdp,
                                type: this.rtcConnection.localDescription.type
                            });
                            
                            document.getElementById('copyOfferBtn').addEventListener('click', () => {
                                navigator.clipboard.writeText(offerText.value);
                                this.showTemporaryMessage('Код скопирован!');
                            });
                        }
                        
                        // Ждем answer
                        this.waitForAnswer();
                    })
                    .catch(error => {
                        console.error('Ошибка создания offer:', error);
                        this.showError('Ошибка создания приглашения');
                    });
            }
            
        } catch (error) {
            console.error('Ошибка создания RTC:', error);
            this.showError('WebRTC не поддерживается в этом браузере');
        }
    },

    // Настройка канала данных
    setupDataChannel: function(channel) {
        channel.onopen = () => {
            console.log('Канал данных открыт');
            this.connectionStatus = 'connected';
            
            if (this.isHost && window.selectedFaction) {
                setTimeout(() => {
                    this.sendFactionInfo();
                }, 500);
            }
        };
        
        channel.onclose = () => {
            console.log('Канал данных закрыт');
            this.connectionStatus = 'disconnected';
            this.showError('Соединение потеряно');
        };
        
        channel.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('Получены данные:', data.type);
                this.handleReceivedData(data);
            } catch (e) {
                console.error('Ошибка парсинга данных:', e);
            }
        };
        
        channel.onerror = (error) => {
            console.error('Ошибка канала данных:', error);
        };
    },

    // Ожидание answer
    waitForAnswer: function() {
        const answerDisplay = document.getElementById('answerDisplay');
        const answerText = document.getElementById('answerText');
        const submitBtn = document.getElementById('submitAnswerBtn');
        
        if (answerDisplay && answerText && submitBtn) {
            answerDisplay.style.display = 'block';
            
            submitBtn.addEventListener('click', () => {
                try {
                    const answer = JSON.parse(answerText.value);
                    this.rtcConnection.setRemoteDescription(answer)
                        .then(() => {
                            console.log('Remote description установлен');
                        })
                        .catch(error => {
                            console.error('Ошибка установки remote description:', error);
                            this.showError('Неверный ответ');
                        });
                } catch (e) {
                    this.showError('Неверный формат ответа');
                }
            });
        }
    },

    // Обработка полученного offer
    handleRemoteOffer: function(offerText) {
        try {
            const offer = JSON.parse(offerText);
            
            this.rtcConnection = new RTCPeerConnection(this.iceServers);
            
            this.rtcConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log('ICE candidate найден:', event.candidate.type);
                }
            };
            
            this.rtcConnection.onconnectionstatechange = () => {
                console.log('Состояние соединения:', this.rtcConnection.connectionState);
                if (this.rtcConnection.connectionState === 'connected') {
                    this.onRTCConnected();
                }
            };
            
            this.rtcConnection.ondatachannel = (event) => {
                this.dataChannel = event.channel;
                this.setupDataChannel(this.dataChannel);
            };
            
            this.rtcConnection.setRemoteDescription(offer)
                .then(() => this.rtcConnection.createAnswer())
                .then(answer => this.rtcConnection.setLocalDescription(answer))
                .then(() => {
                    const answerDisplay = document.getElementById('answerDisplay');
                    const answerText = document.getElementById('answerText');
                    if (answerDisplay && answerText) {
                        answerDisplay.style.display = 'block';
                        answerText.value = JSON.stringify({
                            sdp: this.rtcConnection.localDescription.sdp,
                            type: this.rtcConnection.localDescription.type
                        });
                        
                        document.getElementById('copyAnswerBtn').addEventListener('click', () => {
                            navigator.clipboard.writeText(answerText.value);
                            this.showTemporaryMessage('Ответ скопирован!');
                        });
                    }
                })
                .catch(error => {
                    console.error('Ошибка создания answer:', error);
                    this.showError('Ошибка обработки приглашения');
                });
                
        } catch (e) {
            this.showError('Неверный формат приглашения');
        }
    },

    // Соединение установлено
    onRTCConnected: function() {
        console.log('Соединение установлено!');
        
        // Скрываем интерфейс и запускаем игру
        setTimeout(() => {
            this.startMultiplayerGame();
        }, 1000);
    },

    // Отправка информации о фракции
    sendFactionInfo: function() {
        if (!window.selectedFaction) {
            console.error('Фракция не выбрана');
            return;
        }
        
        const factionData = {
            type: 'faction_info',
            faction: window.selectedFaction.id,
            ability: window.deckModule?.currentDeck?.ability,
            deck: window.deckModule?.currentDeck?.cards.map(c => c.id)
        };
        
        this.send(factionData);
    },

    // Обработка полученных данных
    handleReceivedData: function(data) {
        if (!data || !data.type) return;
        
        switch (data.type) {
            case 'faction_info':
                this.handleFactionInfo(data);
                break;
                
            case 'game_action':
                this.handleGameAction(data);
                break;
                
            case 'ping':
                this.send({ type: 'pong' });
                break;
                
            case 'ready':
                this.handlePlayerReady(data);
                break;
        }
        
        if (this.onDataReceived) {
            this.onDataReceived(data);
        }
    },

    // Обработка информации о фракции противника
    handleFactionInfo: function(data) {
        console.log('Фракция противника:', data.faction);
        
        window.opponentFaction = data.faction;
        window.opponentDeck = data.deck;
        window.opponentAbility = data.ability;
        
        const statusDiv = document.querySelector('.p2p-status');
        if (statusDiv) {
            statusDiv.className = 'p2p-status connected';
            statusDiv.innerHTML = `
                Противник: ${window.factionsData[data.faction]?.name || data.faction}<br>
                <span style="font-size: 12px;">Начинаем игру...</span>
            `;
        }
        
        if (!this.isHost && window.selectedFaction) {
            this.sendFactionInfo();
        }
        
        setTimeout(() => {
            this.startMultiplayerGame();
        }, 1500);
    },

    // Обработка игровых действий
    handleGameAction: function(data) {
        if (!window.gameModule || !window.gameModule.gameState) return;
        
        const gameState = window.gameModule.gameState;
        
        switch (data.action) {
            case 'play_card':
                this.executeRemotePlayCard(data.cardId, data.row, data.position);
                break;
                
            case 'pass':
                if (gameState.gamePhase === 'opponentTurn') {
                    gameState.opponent.passed = true;
                    window.gameModule.handleTurnEnd();
                }
                break;
                
            case 'end_turn':
                if (gameState.gamePhase === 'opponentTurn') {
                    window.gameModule.handleTurnEnd();
                }
                break;
        }
    },

    // Выполнение удаленного размещения карты
    executeRemotePlayCard: function(cardId, row, position) {
        if (!window.gameModule || !window.gameModule.gameState) return;
        
        const gameState = window.gameModule.gameState;
        
        const cardIndex = gameState.opponent.hand.findIndex(c => c.id === cardId);
        if (cardIndex === -1) return;
        
        const card = gameState.opponent.hand[cardIndex];
        
        gameState.opponent.hand.splice(cardIndex, 1);
        
        if (card.type === 'tactic') {
            gameState.opponent.rows[row].tactic = card;
            window.gameModule.displayTacticCard(row, card, 'opponent');
        } else {
            gameState.opponent.rows[row].cards.splice(position, 0, card);
            window.gameModule.displayCardOnRow(row, card, 'opponent', position);
        }
        
        window.gameModule.updateRowStrength(row, 'opponent');
        window.gameModule.updateTotalScoreDisplays();
        window.gameModule.displayOpponentHand();
        
        gameState.cardsPlayedThisTurn++;
        
        if (gameState.cardsPlayedThisTurn >= gameState.maxCardsPerTurn) {
            setTimeout(() => {
                window.gameModule.handleTurnEnd();
            }, 500);
        }
    },

    // Обработка готовности игрока
    handlePlayerReady: function(data) {
        // Начинаем игру
    },

    // Запуск многопользовательской игры
    startMultiplayerGame: function() {
        if (!window.selectedFaction || !window.opponentFaction) return;
        
        if (window.gameModule && window.gameModule.init) {
            window.gameModule.isMultiplayer = true;
            window.gameModule.p2pConnection = this;
            
            window.gameModule.init(true, this.isHost ? 'player' : 'opponent');
            
            this.hideP2PContainer();
        }
    },

    // Отправка данных
    send: function(data) {
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
            this.dataChannel.send(JSON.stringify(data));
            return true;
        }
        return false;
    },

    // Отправка игрового действия
    sendGameAction: function(action, params) {
        const data = {
            type: 'game_action',
            action: action,
            ...params,
            timestamp: Date.now()
        };
        
        return this.send(data);
    },

    // Показать ошибку
    showError: function(message) {
        const container = document.querySelector('.p2p-container');
        if (!container) return;
        
        const statusDiv = container.querySelector('.p2p-status');
        if (statusDiv) {
            statusDiv.className = 'p2p-status error';
            statusDiv.innerHTML = `
                ${message}
                <button class="p2p-btn" style="margin-top: 10px; padding: 5px 10px; font-size: 12px;" 
                        onclick="p2pModule.showMainMenu()">
                    НАЗАД
                </button>
            `;
        }
    },

    // Показать временное сообщение
    showTemporaryMessage: function(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.8);
            color: #d4af37;
            padding: 10px 20px;
            border: 1px solid #d4af37;
            border-radius: 5px;
            z-index: 10001;
            animation: fadeOut 2s forwards;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 2000);
    },

    // Создать контейнер P2P
    createP2PContainer: function() {
        let container = document.querySelector('.p2p-container');
        if (container) {
            container.innerHTML = '';
            return container;
        }
        
        container = document.createElement('div');
        container.className = 'p2p-container';
        return container;
    },

    // Скрыть P2P контейнер
    hideP2PContainer: function() {
        const container = document.querySelector('.p2p-container');
        if (container) {
            container.remove();
        }
    },

    // Закрытие соединения
    closeConnection: function() {
        if (this.dataChannel) {
            this.dataChannel.close();
            this.dataChannel = null;
        }
        if (this.rtcConnection) {
            this.rtcConnection.close();
            this.rtcConnection = null;
        }
        this.connectionStatus = 'disconnected';
    }
};

// Добавляем кнопку P2P в главное меню
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        const menuButtons = document.querySelector('.main-menu-buttons');
        if (menuButtons && !document.getElementById('p2pBtn')) {
            const p2pBtn = document.createElement('button');
            p2pBtn.className = 'menu-btn p2p-btn';
            p2pBtn.id = 'p2pBtn';
            p2pBtn.textContent = 'СЕТЕВАЯ ИГРА';
            p2pBtn.style.backgroundColor = '#4a4a4a';
            p2pBtn.style.borderColor = '#9c27b0';
            p2pBtn.style.color = '#e1bee7';
            
            p2pBtn.addEventListener('click', function() {
                if (window.audioManager) audioManager.playSound('button');
                p2pModule.showMainMenu();
            });
            
            p2pBtn.addEventListener('mouseenter', () => {
                if (window.audioManager) audioManager.playSound('touch');
            });
            
            menuButtons.appendChild(p2pBtn);
        }
    }, 500);
});

window.p2pModule = p2pModule;