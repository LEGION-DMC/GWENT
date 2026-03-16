// P2P модуль для Gwent - упрощенная версия для локальной сети
const p2pModule = {
    // Состояние соединения
    rtcConnection: null,
    dataChannel: null,
    isHost: false,
    
    // Только один STUN сервер (минимально)
    iceServers: {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }
        ]
    },

    // Показать главное меню
    showMainMenu: function() {
        this.hideContainer();
        
        const container = this.createContainer();
        
        const modal = document.createElement('div');
        modal.className = 'p2p-modal';
        modal.innerHTML = `
            <div class="p2p-title">СЕТЕВАЯ ИГРА</div>
            
            <div class="p2p-info-text" style="color: #ffc107; margin: 20px;">
                ⚠️ Игроки должны быть в одной сети (WiFi)
            </div>
            
            <div class="p2p-buttons">
                <button class="p2p-btn create-btn" id="createBtn" style="width: 200px; margin: 10px auto;">
                    СОЗДАТЬ ИГРУ
                </button>
                <button class="p2p-btn join-btn" id="joinBtn" style="width: 200px; margin: 10px auto;">
                    ПРИСОЕДИНИТЬСЯ
                </button>
            </div>
            
            <div class="p2p-buttons">
                <button class="p2p-btn" id="localBtn" style="width: 200px; margin: 10px auto;">
                    ЛОКАЛЬНАЯ ИГРА
                </button>
            </div>
        `;
        
        container.appendChild(modal);
        document.body.appendChild(container);
        
        document.getElementById('createBtn').onclick = () => {
            if (window.audioManager) audioManager.playSound('button');
            this.startHost();
        };
        
        document.getElementById('joinBtn').onclick = () => {
            if (window.audioManager) audioManager.playSound('button');
            this.showJoinScreen();
        };
        
        document.getElementById('localBtn').onclick = () => {
            if (window.audioManager) audioManager.playSound('button');
            this.hideContainer();
            if (window.factionModule) window.factionModule.initFactionSelection();
        };
    },

    // Начать как хост
    startHost: function() {
        this.isHost = true;
        this.showScreen('host');
        this.createConnection(true);
    },

    // Показать экран подключения
    showJoinScreen: function() {
        this.isHost = false;
        this.showScreen('join');
    },

    // Показать соответствующий экран
    showScreen: function(type) {
        this.hideContainer();
        
        const container = this.createContainer();
        const modal = document.createElement('div');
        modal.className = 'p2p-modal';
        
        if (type === 'host') {
            modal.innerHTML = `
                <div class="p2p-title">СОЗДАНИЕ ИГРЫ</div>
                <div class="p2p-status connecting" id="status">
                    <span class="p2p-loading"></span>
                    Создание приглашения...
                </div>
                <div id="offerSection" style="display: none;">
                    <div class="p2p-code-display">
                        <div class="p2p-code-label">КОД ПРИГЛАШЕНИЯ</div>
                        <textarea id="offerCode" rows="4" readonly style="width: 100%; height: 80px; background: #333; color: #fff; border: 1px solid #d4af37; padding: 5px;"></textarea>
                        <button class="p2p-btn" id="copyBtn" style="margin: 10px;">КОПИРОВАТЬ</button>
                    </div>
                    <div class="p2p-code-display">
                        <div class="p2p-code-label">ВСТАВЬТЕ ОТВЕТ</div>
                        <textarea id="answerInput" rows="4" style="width: 100%; height: 80px; background: #333; color: #fff; border: 1px solid #d4af37; padding: 5px;"></textarea>
                        <button class="p2p-btn" id="submitBtn" style="margin: 10px;">ПОДКЛЮЧИТЬСЯ</button>
                    </div>
                </div>
                <button class="p2p-btn" id="backBtn" style="margin-top: 20px;">НАЗАД</button>
            `;
        } else {
            modal.innerHTML = `
                <div class="p2p-title">ПОДКЛЮЧЕНИЕ</div>
                <div class="p2p-code-display">
                    <div class="p2p-code-label">ВСТАВЬТЕ КОД ПРИГЛАШЕНИЯ</div>
                    <textarea id="offerInput" rows="4" style="width: 100%; height: 80px; background: #333; color: #fff; border: 1px solid #d4af37; padding: 5px;"></textarea>
                    <button class="p2p-btn" id="connectBtn" style="margin: 10px;">ПОДКЛЮЧИТЬСЯ</button>
                </div>
                <div id="answerSection" style="display: none;">
                    <div class="p2p-code-label">КОД ОТВЕТА</div>
                    <textarea id="answerCode" rows="4" readonly style="width: 100%; height: 80px; background: #333; color: #fff; border: 1px solid #d4af37; padding: 5px;"></textarea>
                    <button class="p2p-btn" id="copyAnswerBtn" style="margin: 10px;">КОПИРОВАТЬ</button>
                </div>
                <button class="p2p-btn" id="backBtn" style="margin-top: 20px;">НАЗАД</button>
            `;
        }
        
        container.appendChild(modal);
        document.body.appendChild(container);
        
        document.getElementById('backBtn').onclick = () => {
            this.closeConnection();
            this.showMainMenu();
        };
        
        if (type === 'host') {
            // Обработчики будут добавлены после создания offer
        } else {
            document.getElementById('connectBtn').onclick = () => {
                const offer = document.getElementById('offerInput').value;
                if (offer) this.handleOffer(offer);
            };
        }
    },

    // Создание соединения
    createConnection: function(isInitiator) {
        try {
            this.rtcConnection = new RTCPeerConnection(this.iceServers);
            
            // Минимальные обработчики
            this.rtcConnection.onicecandidate = (event) => {
                // Игнорируем ICE кандидаты
            };
            
            this.rtcConnection.onconnectionstatechange = () => {
                if (this.rtcConnection.connectionState === 'connected') {
                    this.onConnected();
                } else if (this.rtcConnection.connectionState === 'failed') {
                    document.getElementById('status').innerHTML = 'Ошибка подключения. Попробуйте снова.';
                }
            };

            if (isInitiator) {
                // Создаем канал данных
                this.dataChannel = this.rtcConnection.createDataChannel('game');
                this.setupDataChannel();
                
                // Создаем offer
                this.rtcConnection.createOffer()
                    .then(offer => this.rtcConnection.setLocalDescription(offer))
                    .then(() => {
                        document.getElementById('status').style.display = 'none';
                        document.getElementById('offerSection').style.display = 'block';
                        document.getElementById('offerCode').value = JSON.stringify(this.rtcConnection.localDescription);
                        
                        document.getElementById('copyBtn').onclick = () => {
                            navigator.clipboard.writeText(document.getElementById('offerCode').value);
                            alert('Код скопирован!');
                        };
                        
                        document.getElementById('submitBtn').onclick = () => {
                            const answer = document.getElementById('answerInput').value;
                            if (answer) {
                                try {
                                    this.rtcConnection.setRemoteDescription(JSON.parse(answer));
                                } catch (e) {
                                    alert('Неверный формат ответа');
                                }
                            }
                        };
                    });
            }
            
        } catch (error) {
            alert('Ошибка: ' + error.message);
        }
    },

    // Обработка offer от хоста
    handleOffer: function(offerText) {
        try {
            const offer = JSON.parse(offerText);
            
            this.rtcConnection = new RTCPeerConnection(this.iceServers);
            
            this.rtcConnection.onicecandidate = (event) => {
                // Игнорируем
            };
            
            this.rtcConnection.onconnectionstatechange = () => {
                if (this.rtcConnection.connectionState === 'connected') {
                    this.onConnected();
                }
            };
            
            this.rtcConnection.ondatachannel = (event) => {
                this.dataChannel = event.channel;
                this.setupDataChannel();
            };
            
            this.rtcConnection.setRemoteDescription(offer)
                .then(() => this.rtcConnection.createAnswer())
                .then(answer => this.rtcConnection.setLocalDescription(answer))
                .then(() => {
                    document.getElementById('answerSection').style.display = 'block';
                    document.getElementById('answerCode').value = JSON.stringify(this.rtcConnection.localDescription);
                    
                    document.getElementById('copyAnswerBtn').onclick = () => {
                        navigator.clipboard.writeText(document.getElementById('answerCode').value);
                        alert('Код ответа скопирован! Отправьте его создателю игры.');
                    };
                });
                
        } catch (e) {
            alert('Неверный формат приглашения');
        }
    },

    // Настройка канала данных
    setupDataChannel: function() {
        this.dataChannel.onopen = () => {
            console.log('Соединение установлено');
            if (this.isHost && window.selectedFaction) {
                this.send({
                    type: 'faction',
                    faction: window.selectedFaction.id,
                    deck: window.deckModule?.currentDeck?.cards.map(c => c.id)
                });
            }
        };
        
        this.dataChannel.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                if (data.type === 'faction') {
                    window.opponentFaction = data.faction;
                    window.opponentDeck = data.deck;
                    
                    if (!this.isHost && window.selectedFaction) {
                        this.send({
                            type: 'faction',
                            faction: window.selectedFaction.id,
                            deck: window.deckModule?.currentDeck?.cards.map(c => c.id)
                        });
                    }
                    
                    setTimeout(() => this.startGame(), 1000);
                    
                } else if (data.type === 'action' && window.gameModule?.gameState) {
                    const gameState = window.gameModule.gameState;
                    
                    if (data.action === 'play_card') {
                        const cardIndex = gameState.opponent.hand.findIndex(c => c.id === data.cardId);
                        if (cardIndex !== -1) {
                            const card = gameState.opponent.hand[cardIndex];
                            gameState.opponent.hand.splice(cardIndex, 1);
                            
                            if (card.type === 'tactic') {
                                gameState.opponent.rows[data.row].tactic = card;
                                window.gameModule.displayTacticCard(data.row, card, 'opponent');
                            } else {
                                gameState.opponent.rows[data.row].cards.splice(data.position, 0, card);
                                window.gameModule.displayCardOnRow(data.row, card, 'opponent', data.position);
                            }
                            
                            window.gameModule.updateRowStrength(data.row, 'opponent');
                            window.gameModule.displayOpponentHand();
                        }
                    } else if (data.action === 'pass') {
                        if (gameState.gamePhase === 'opponentTurn') {
                            gameState.opponent.passed = true;
                            window.gameModule.handleTurnEnd();
                        }
                    } else if (data.action === 'end_turn') {
                        if (gameState.gamePhase === 'opponentTurn') {
                            window.gameModule.handleTurnEnd();
                        }
                    }
                }
            } catch (e) {}
        };
    },

    // Соединение установлено
    onConnected: function() {
        this.hideContainer();
        
        if (this.isHost && window.selectedFaction) {
            this.send({
                type: 'faction',
                faction: window.selectedFaction.id,
                deck: window.deckModule?.currentDeck?.cards.map(c => c.id)
            });
        }
    },

    // Отправка данных
    send: function(data) {
        if (this.dataChannel?.readyState === 'open') {
            this.dataChannel.send(JSON.stringify(data));
        }
    },

    // Отправка игрового действия
    sendGameAction: function(action, params) {
        this.send({
            type: 'action',
            action: action,
            ...params
        });
    },

    // Запуск игры
    startGame: function() {
        if (!window.selectedFaction || !window.opponentFaction) return;
        
        if (window.gameModule?.init) {
            window.gameModule.isMultiplayer = true;
            window.gameModule.p2pConnection = this;
            window.gameModule.init(true, this.isHost ? 'player' : 'opponent');
        }
    },

    // Создать контейнер
    createContainer: function() {
        let container = document.querySelector('.p2p-container');
        if (container) {
            container.innerHTML = '';
            return container;
        }
        container = document.createElement('div');
        container.className = 'p2p-container';
        return container;
    },

    // Скрыть контейнер
    hideContainer: function() {
        const container = document.querySelector('.p2p-container');
        if (container) container.remove();
    },

    // Закрыть соединение
    closeConnection: function() {
        if (this.dataChannel) this.dataChannel.close();
        if (this.rtcConnection) this.rtcConnection.close();
        this.dataChannel = null;
        this.rtcConnection = null;
    }
};

// Добавляем кнопку в меню
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        const menu = document.querySelector('.main-menu-buttons');
        if (menu && !document.getElementById('p2pBtn')) {
            const btn = document.createElement('button');
            btn.className = 'menu-btn';
            btn.id = 'p2pBtn';
            btn.textContent = 'СЕТЕВАЯ ИГРА';
            btn.style.backgroundColor = '#4a4a4a';
            btn.style.borderColor = '#9c27b0';
            
            btn.onclick = () => {
                if (window.audioManager) audioManager.playSound('button');
                p2pModule.showMainMenu();
            };
            
            menu.appendChild(btn);
        }
    }, 500);
});

window.p2pModule = p2pModule;