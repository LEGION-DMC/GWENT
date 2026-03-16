// P2P дополнение для game.js
const gameP2PModule = {
    isP2PMode: false,
    p2pPlayerData: null,
    p2pOpponentData: null,
    isMyTurn: false,
    pendingActions: [],

    // Инициализация P2P игры
    initP2PGame: function(playerData, opponentData, isFirstPlayer) {
        this.isP2PMode = true;
        this.p2pPlayerData = playerData;
        this.p2pOpponentData = opponentData;
        this.isMyTurn = isFirstPlayer;
        
        // Инициализируем игровую доску
        window.boardModule.initGameBoard(true);
        
        // Устанавливаем обработчик P2P действий
        window.p2pManager.on('gameAction', (action) => {
            this.handleOpponentAction(action);
        });
        
        // Запускаем игру
        setTimeout(() => {
            this.startP2PGame();
        }, 500);
    },

    // Запуск P2P игры
    startP2PGame: function() {
        if (window.gameModule && window.gameModule.initGame) {
            // Создаем игроков для P2P режима
            const player = {
                name: this.p2pPlayerData.name,
                faction: this.p2pPlayerData.faction,
                deck: this.p2pPlayerData.deck,
                isHuman: true
            };
            
            const opponent = {
                name: this.p2pOpponentData.name,
                faction: this.p2pOpponentData.faction,
                deck: this.p2pOpponentData.deck,
                isHuman: true
            };
            
            // Инициализируем игру
            window.gameModule.initGame(player, opponent);
            
            // Устанавливаем чей ход
            window.gameModule.setCurrentPlayer(this.isMyTurn ? 'player' : 'opponent');
            
            // Обновляем видимость контролов
            window.boardModule.updateControlsVisibility(this.isMyTurn);
            
            // Показываем статус P2P
            if (!this.isMyTurn) {
                window.boardModule.updateP2PStatus('Ход оппонента...');
            }
            
            // Отправляем начальное состояние игры оппоненту
            this.sendGameState();
        }
    },

    // Отправка действия в P2P
    sendGameAction: function(action) {
        if (window.p2pManager && window.p2pManager.isConnected()) {
            window.p2pManager.sendGameAction(action);
        } else {
            this.pendingActions.push(action);
        }
    },

    // Отправка состояния игры
    sendGameState: function() {
        if (window.p2pManager && window.p2pManager.isConnected() && window.gameModule) {
            const gameState = window.gameModule.getGameState();
            window.p2pManager.sendGameState(gameState);
        }
    },

    // Обработка действия оппонента
    handleOpponentAction: function(action) {
        console.log('Действие оппонента:', action);
        
        switch (action.type) {
            case 'playCard':
                this.handleOpponentPlayCard(action.data);
                break;
                
            case 'endTurn':
                this.handleOpponentEndTurn();
                break;
                
            case 'pass':
                this.handleOpponentPass();
                break;
                
            case 'useLeader':
                this.handleOpponentUseLeader(action.data);
                break;
                
            default:
                console.warn('Неизвестный тип действия:', action.type);
        }
    },

    // Обработка розыгрыша карты оппонентом
    handleOpponentPlayCard: function(data) {
        if (window.gameModule && window.gameModule.playCard) {
            // Находим карту в колоде оппонента
            const card = this.findCardInOpponentDeck(data.cardId);
            if (card) {
                window.gameModule.playCard(card, data.row, 'opponent');
            }
        }
    },

    // Обработка завершения хода оппонентом
    handleOpponentEndTurn: function() {
        if (window.gameModule) {
            this.isMyTurn = true;
            window.gameModule.setCurrentPlayer('player');
            window.boardModule.updateControlsVisibility(true);
            window.boardModule.updateP2PStatus('Ваш ход');
        }
    },

    // Обработка паса оппонентом
    handleOpponentPass: function() {
        if (window.gameModule && window.gameModule.handlePass) {
            window.gameModule.handlePass('opponent');
            this.isMyTurn = true;
            window.boardModule.updateControlsVisibility(true);
            window.boardModule.updateP2PStatus('Ваш ход');
        }
    },

    // Обработка использования лидера оппонентом
    handleOpponentUseLeader: function(data) {
        if (window.gameModule && window.gameModule.useLeaderAbility) {
            window.gameModule.useLeaderAbility(data.abilityId, data.target, 'opponent');
        }
    },

    // Поиск карты в колоде оппонента
    findCardInOpponentDeck: function(cardId) {
        if (!this.p2pOpponentData || !this.p2pOpponentData.deck) return null;
        
        const allCards = [
            ...(this.p2pOpponentData.deck.cards || [])
        ];
        
        return allCards.find(card => card.id === cardId);
    },

    // Обработка хода игрока
    handlePlayerPlayCard: function(card, row) {
        if (!this.isMyTurn) {
            console.warn('Сейчас не ваш ход');
            return false;
        }
        
        // Отправляем действие оппоненту
        this.sendGameAction({
            type: 'playCard',
            data: {
                cardId: card.id,
                row: row
            }
        });
        
        return true;
    },

    // Обработка завершения хода игроком
    handlePlayerEndTurn: function() {
        if (!this.isMyTurn) return false;
        
        this.isMyTurn = false;
        
        this.sendGameAction({
            type: 'endTurn',
            data: { timestamp: Date.now() }
        });
        
        window.boardModule.updateP2PStatus('Ход оппонента...');
        
        return true;
    },

    // Обработка паса игроком
    handlePlayerPass: function() {
        if (!this.isMyTurn) return false;
        
        this.isMyTurn = false;
        
        this.sendGameAction({
            type: 'pass',
            data: { timestamp: Date.now() }
        });
        
        window.boardModule.updateP2PStatus('Ожидание оппонента...');
        
        return true;
    },

    // Обработка использования лидера игроком
    handlePlayerUseLeader: function(abilityId, target) {
        if (!this.isMyTurn) return false;
        
        this.sendGameAction({
            type: 'useLeader',
            data: {
                abilityId: abilityId,
                target: target
            }
        });
        
        return true;
    },

    // Синхронизация состояния игры
    syncGameState: function(state) {
        if (window.gameModule) {
            window.gameModule.setState(state);
        }
    },

    // Очистка P2P игры
    cleanup: function() {
        this.isP2PMode = false;
        this.p2pPlayerData = null;
        this.p2pOpponentData = null;
        this.isMyTurn = false;
        this.pendingActions = [];
        
        if (window.p2pManager) {
            window.p2pManager.clearCallbacks();
        }
        
        window.boardModule.hideP2PStatus();
    }
};

// Добавляем в глобальный объект
window.gameP2PModule = gameP2PModule;

// Интеграция с основным game.js
if (!window.gameModule) {
    window.gameModule = {};
}

// Добавляем методы P2P в gameModule
window.gameModule.initP2PGame = function(playerData, opponentData, isFirstPlayer) {
    return window.gameP2PModule.initP2PGame(playerData, opponentData, isFirstPlayer);
};

window.gameModule.handleP2PPlayCard = function(card, row) {
    return window.gameP2PModule.handlePlayerPlayCard(card, row);
};

window.gameModule.handleP2PEndTurn = function() {
    return window.gameP2PModule.handlePlayerEndTurn();
};

window.gameModule.handleP2PPass = function() {
    return window.gameP2PModule.handlePlayerPass();
};

window.gameModule.handleP2PUseLeader = function(abilityId, target) {
    return window.gameP2PModule.handlePlayerUseLeader(abilityId, target);
};

window.gameModule.handleOpponentAction = function(action) {
    return window.gameP2PModule.handleOpponentAction(action);
};

window.gameModule.syncGameState = function(state) {
    return window.gameP2PModule.syncGameState(state);
};

window.gameModule.cleanupP2P = function() {
    return window.gameP2PModule.cleanup();
};