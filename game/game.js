const gameModule = {
    gameState: {
        player: {
            deck: [],
            hand: [],
            discard: [],
            leader: null,
            faction: null,
            ability: null,
            rows: {
                'close': { cards: [], strength: 0, tactic: null },
                'ranged': { cards: [], strength: 0, tactic: null },
                'siege': { cards: [], strength: 0, tactic: null }
            },
            passed: false,
            score: 0
        },
        opponent: {
            deck: [],
            hand: [],
            discard: [],
            leader: null,
            faction: null,
            ability: null,
            rows: {
                'close': { cards: [], strength: 0, tactic: null },
                'ranged': { cards: [], strength: 0, tactic: null },
                'siege': { cards: [], strength: 0, tactic: null }
            },
            passed: false,
            score: 0
        },
        weather: {
            cards: [],
            maxWeatherCards: 3,
            effects: {
                'close': null,
                'ranged': null, 
                'siege': null
            }
        },
        currentRound: 1,
        totalRounds: 3,
        roundsWon: {
            player: 0,
            opponent: 0
        },
        currentPlayer: 'player',
        gamePhase: 'setup',
        selectedCard: null,
        selectingRow: false,
        cardsPlayedThisTurn: 0, 
        maxCardsPerTurn: 1, 
        gameSettings: {
            mode: 'cdpred',
            initialHandSize: 10,
            cardsPerRound: 1,
            totalRounds: 3
        },
        mulligan: {
            enabled: true,
            phase: 'waiting',
            player: {
                available: 2,
                used: 0,    
                cards: []    
            },
            opponent: {
                available: 2, 
                used: 0,    
                cards: []    
            }
        },
        turnTimer: {
            active: false,
            timeLeft: 60,
            maxTime: 60,
            intervalId: null,
            timeouts: 0,
            maxTimeouts: 2, 
            penaltyApplied: false 
        },
        roundLossDueToTimeout: null,
		roundResults: [],
		roundsWon: {
			player: 0,
			opponent: 0
		},
    },
	
    currentSettings: {
        cardDisplayMode: 'animated'
    },

    init: function() {
        this.loadSettings();
        this.updateGameSettings();
        this.createTotalScoreDisplays();
        this.createTimerDisplay();
		this.createCrownIndicators();
        this.loadPlayerDeck();
        this.loadOpponentDeck();
        this.setupPlayerLeader();
        this.setupOpponentLeader();
        this.dealInitialHands();
        this.setupEventListeners();
        this.updateGameDisplay();
        this.displayPlayerDiscard();
        this.displayOpponentDiscard();
        
        if (window.factionAbilitiesModule) {
            window.factionAbilitiesModule.init(this.gameState);
        }
        if (window.playerModule) {
            window.playerModule.init(this.gameState);
        }
        if (window.aiModule) {
            window.aiModule.init(this.gameState);
        }
        this.startGameSequence();
    },

    startGameSequence: function() {
        this.startCoinToss();
    },

    createTimerDisplay: function() {
		if (document.getElementById('turnTimerDisplay')) return;
		
		const timerDisplay = document.createElement('div');
		timerDisplay.id = 'turnTimerDisplay';
		timerDisplay.className = 'turn-timer-display';
		timerDisplay.style.display = 'none';
		
		timerDisplay.innerHTML = `
			<img src="board/timer.png" alt="Песочные часы" class="timer-icon">
			<div class="timer-time" id="timerTime">60</div>
			<div class="timer-label">сек.</div>
		`;
		document.body.appendChild(timerDisplay);
	},

    updateTimerDisplay: function() {
        const timerTime = document.getElementById('timerTime');
        const timerDisplay = document.getElementById('turnTimerDisplay');
        
        if (!timerTime || !timerDisplay) {
            return;
        }
        
        const timeLeft = this.gameState.turnTimer.timeLeft;
        timerTime.textContent = timeLeft;
        
        if (timeLeft <= 10) {
            timerTime.style.color = '#ff4444';
            timerDisplay.style.borderColor = '#ff4444';
            if (timeLeft <= 5) {
                timerDisplay.style.animation = 'timerPulse 0.5s infinite';
            } else {
                timerDisplay.style.animation = 'none';
            }
        } else if (timeLeft <= 30) {
            timerTime.style.color = '#ff9800';
            timerDisplay.style.borderColor = '#ff9800';
            timerDisplay.style.animation = 'none';
        } else {
            timerTime.style.color = '#4CAF50';
            timerDisplay.style.borderColor = '#d4af37';
            timerDisplay.style.animation = 'none';
        }
        
        if (this.gameState.turnTimer.active && this.gameState.gamePhase === 'playerTurn') {
            timerDisplay.style.display = 'flex';
        } else {
            timerDisplay.style.display = 'none';
        }
    },

    hideTimerDisplay: function() {
        const timerDisplay = document.getElementById('turnTimerDisplay');
        if (timerDisplay) {
            timerDisplay.style.setProperty('display', 'none', 'important');
            timerDisplay.style.animation = 'none';
        }
    },

    playTimerWarningSound: function() {
        if (window.audioManager && window.audioManager.playSound) {
            if (window.audioManager.sounds && window.audioManager.sounds.timer) {
                window.audioManager.playSound('warning');
            }else {
                window.audioManager.playSound('warning');
            }
        }
    },

    startTurnTimer: function() {
        this.createTimerDisplay();
        this.gameState.turnTimer.timeLeft = 60;
        this.gameState.turnTimer.active = true;
        this.updateTimerDisplay();
        
        if (this.gameState.turnTimer.intervalId) {
            clearInterval(this.gameState.turnTimer.intervalId);
        }
        
        this.gameState.turnTimer.intervalId = setInterval(() => {
            this.updateTimer();
        }, 1000);
    },

    stopTurnTimer: function() {
        if (this.gameState.turnTimer.intervalId) {
            clearInterval(this.gameState.turnTimer.intervalId);
            this.gameState.turnTimer.intervalId = null;
        }
        this.gameState.turnTimer.active = false;
        this.hideTimerDisplay();
    },

    updateTimer: function() {
        if (!this.gameState.turnTimer.active) return;
        
        this.gameState.turnTimer.timeLeft--;
        this.updateTimerDisplay();
        
        if (this.gameState.turnTimer.timeLeft === 30) {
            this.playTimerWarningSound();
        } else if (this.gameState.turnTimer.timeLeft === 10) {
            this.playTimerWarningSound();
        }else if (this.gameState.turnTimer.timeLeft === 5) {
            this.playTimerWarningSound();
        }
        
        if (this.gameState.turnTimer.timeLeft <= 0) {
            this.handleTimeExpired();
        }
    },

    handleTimeExpired: function() {
        this.stopTurnTimer();
        this.gameState.turnTimer.timeouts++;
        const currentPlayer = this.gameState.currentPlayer;
        
        if (this.gameState.turnTimer.timeouts === 1 && !this.gameState.turnTimer.penaltyApplied) {
            this.applyCardPenalty(currentPlayer);
            this.gameState.turnTimer.penaltyApplied = true;
            
            setTimeout(() => {
                if (currentPlayer === 'player') {
                    this.startTurnTimer();
                }
            }, 1000);
        }
        else if (this.gameState.turnTimer.timeouts >= 2) {
            this.forceAutoPassWithRoundLoss(currentPlayer);
        }
    },

    applyCardPenalty: function(player) {
        const playerState = this.gameState[player];
        
        if (playerState.hand.length === 0) {
            return;
        }
        
        const randomIndex = Math.floor(Math.random() * playerState.hand.length);
        const penaltyCard = playerState.hand[randomIndex];
        
        playerState.hand.splice(randomIndex, 1);
        this.addCardToDiscard(penaltyCard, player);
        
        if (player === 'player') {
            this.displayPlayerHand();
            this.displayPlayerDiscard();
        } else {
            this.displayOpponentDiscard();
        }
        
        const message = player === 'player' 
            ? 'Бездействие! Случайная карта отправлена в сброс' 
            : 'Противник бездействует! Карта отправлена в сброс';
        this.showGameMessage(message, 'warning');
        
        if (audioManager && audioManager.playSound) {
            audioManager.playSound('warning');
        }
    },

    forceEndTurn: function() {
        const currentPlayer = this.gameState.currentPlayer;
        
        if (currentPlayer === 'player') {
            this.gameState.cardsPlayedThisTurn = 0;
            this.gameState.selectingRow = false;
            this.gameState.selectedCard = null;
            
            if (window.playerModule && window.playerModule.cancelRowSelection) {
                window.playerModule.cancelRowSelection();
            }
            
            this.startOpponentTurn();
        } else {
            this.startPlayerTurn();
        }
    },

    forceAutoPassWithRoundLoss: function(player) {
        this.gameState[player].passed = true;
        this.gameState.roundLossDueToTimeout = player;
        
        if (player === 'player') {
            this.showGameMessage('Вы проиграли раунд из-за бездействия!', 'error');
        } else {
            this.showGameMessage('Противник проиграл раунд из-за бездействия!', 'info');
        }
        
        setTimeout(() => {
            this.endRound();
        }, 2000);
    },

    resetTimeoutCounter: function() {
        this.gameState.turnTimer.timeouts = 0;
        this.gameState.turnTimer.penaltyApplied = false;
    },

    startMulliganPhase: function() {
		this.hideTimerDisplay();
		
		this.gameState.mulligan.phase = 'waiting';
		this.gameState.mulligan.player.used = 0;
		this.gameState.mulligan.player.cards = [];
		this.gameState.mulligan.opponent.used = 0;
		this.gameState.mulligan.opponent.cards = [];
		this.startPlayerMulligan();
	},

    resetMulliganState: function() {
		this.gameState.mulligan.phase = 'waiting';
		this.gameState.mulligan.player.used = 0;
		this.gameState.mulligan.player.cards = [];
		this.gameState.mulligan.opponent.used = 0;
		this.gameState.mulligan.opponent.cards = [];
	},

    showMulliganIntro: function() {
        this.startPlayerMulligan();
    },

    startPlayerMulligan: function() {
        this.gameState.mulligan.phase = 'player';
        this.showMulliganInterface();
    },

    showMulliganInterface: function() {
        this.hideGameBoardDuringMulligan();
        this.createMulliganControls();
        this.displayPlayerHandForMulligan();
    },

    hideGameBoardDuringMulligan: function() {
        const elementsToHide = [
            'gameBoard', 'weatherSlot', 'playerLeader', 'opponentLeader',
            'playerDeck', 'opponentDeck', 'playerDiscard', 'opponentDiscard',
            'roundImage', 'winsIndicator', 'gameModeIndicator',
            'playerCloseRow', 'playerRangedRow', 'playerSiegeRow',
            'opponentCloseRow', 'opponentRangedRow', 'opponentSiegeRow',
            'passBtn', 'endTurnBtn', 'turnTimerDisplay'
        ];
        
        const overlay = document.createElement('div');
        overlay.id = 'mulliganOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.85);
            z-index: 999;
            pointer-events: none;
        `;
        document.body.appendChild(overlay);
        
        this.mulliganHiddenElements = {};
        elementsToHide.forEach(elementId => {
            const element = document.getElementById(elementId);
            if (element) {
                this.mulliganHiddenElements[elementId] = {
                    display: element.style.display || '',
                    opacity: element.style.opacity || '',
                    visibility: element.style.visibility || ''
                };
                
                element.style.opacity = '0.01';
                element.style.pointerEvents = 'none';
            }
        });
        
        document.querySelectorAll('.row-strength').forEach(el => {
            el.style.opacity = '0.05';
        });
        
        document.querySelectorAll('.total-score-display').forEach(el => {
            el.style.opacity = '0.05';
        });
    },

    restoreGameBoardAfterMulligan: function() {
        const overlay = document.getElementById('mulliganOverlay');
        if (overlay) {
            overlay.remove();
        }
        
        if (this.mulliganHiddenElements) {
            Object.keys(this.mulliganHiddenElements).forEach(elementId => {
                const element = document.getElementById(elementId);
                if (element) {
                    const original = this.mulliganHiddenElements[elementId];
                    element.style.display = original.display;
                    element.style.opacity = original.opacity;
                    element.style.visibility = original.visibility;
                    element.style.pointerEvents = '';
                }
            });
        }
        
        document.querySelectorAll('.row-strength').forEach(el => {
            el.style.opacity = '';
        });
        
        document.querySelectorAll('.total-score-display').forEach(el => {
            el.style.opacity = '';
        });
        
        this.mulliganHiddenElements = null;
    },

    createMulliganControls: function() {
        const playerHand = document.getElementById('playerHand');
        if (!playerHand) return;
        
        const existingControls = document.getElementById('mulliganControls');
        if (existingControls) {
            existingControls.remove();
        }
        
        const controlsContainer = document.createElement('div');
        controlsContainer.id = 'mulliganControls';
        controlsContainer.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 54%;
            transform: translateX(-50%);
            display: flex;
            gap: 10px;
            z-index: 1000;
            bottom: 2.3%;
        `;
        
        const resetButton = document.createElement('button');
        resetButton.id = 'mulliganResetBtn';
        resetButton.textContent = 'ОТМЕНИТЬ ВЫБОР';
        resetButton.style.cssText = `
            background: linear-gradient(145deg, rgb(42, 42, 42), rgb(26, 26, 26));
            color: rgb(212, 175, 55);
            border: 1px solid rgb(212, 175, 55);
            padding: 8px;
            font-size: 14px;
            font-family: "Gwent", sans-serif;
            text-transform: uppercase;
            letter-spacing: 2px;
            cursor: url("./ui/cursor_hover.png"), pointer;
            transition: 0.3s;
            border-radius: 4px;
            box-shadow: rgba(0, 0, 0, 0.3) 0px 4px 8px;
            margin: 0px auto;
            display: block;
            overflow: hidden;
            transform: scale(1);
            width: 170px;
        `;
        
        const infoPanel = document.createElement('div');
        infoPanel.id = 'mulliganInfo';
        infoPanel.style.cssText = `
            background: rgba(0, 0, 0, 0.8);
            color: rgb(212, 175, 55);
            border-radius: 4px;
            border: 1px solid rgb(212, 175, 55);
            font-family: "Gwent", sans-serif;
            font-size: 18px;
            text-align: center;
            min-width: 200px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 10px 20px;
            font-weight: bold;
        `;
        
        const infoText = document.createElement('div');
        infoText.id = 'mulliganInfoText';
        infoText.textContent = 'Выбрано: 0/2 карт';
        
        infoPanel.appendChild(infoText);
        
        const doneButton = document.createElement('button');
        doneButton.id = 'mulliganDoneBtn';
        doneButton.textContent = 'ЗАВЕРШИТЬ ЗАМЕНУ';
        doneButton.style.cssText = `
            background: linear-gradient(145deg, rgb(42, 42, 42), rgb(26, 26, 26));
            color: rgb(212, 175, 55);
            border: 1px solid rgb(212, 175, 55);
            padding: 8px;
            font-size: 14px;
            font-family: "Gwent", sans-serif;
            text-transform: uppercase;
            letter-spacing: 2px;
            cursor: url("./ui/cursor_hover.png"), pointer;
            transition: 0.3s;
            border-radius: 4px;
            box-shadow: rgba(0, 0, 0, 0.3) 0px 4px 8px;
            margin: 0px auto;
            display: block;
            overflow: hidden;
            transform: scale(1);
            width: 170px;
        `;
        
        controlsContainer.appendChild(resetButton);
        controlsContainer.appendChild(infoPanel);
        controlsContainer.appendChild(doneButton);
        
        document.body.appendChild(controlsContainer);
        
        this.setupMulliganControlsEventListeners();
        this.updateMulliganInfo();
    },

    setupMulliganControlsEventListeners: function() {
        const doneBtn = document.getElementById('mulliganDoneBtn');
        const resetBtn = document.getElementById('mulliganResetBtn');
        
        if (doneBtn) {
            const newDoneBtn = doneBtn.cloneNode(true);
            doneBtn.parentNode.replaceChild(newDoneBtn, doneBtn);
            
            newDoneBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                this.completePlayerMulligan();
                audioManager.playSound('button');
            });
            
            newDoneBtn.addEventListener('mouseenter', () => {
                newDoneBtn.style.transform = 'scale(1.05)';
                newDoneBtn.style.boxShadow = '0 6px 12px rgba(0,0,0,0.4)';
                audioManager.playSound('touch');
            });
            
            newDoneBtn.addEventListener('mouseleave', () => {
                newDoneBtn.style.transform = 'scale(1)';
                newDoneBtn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
            });
        }
        
        if (resetBtn) {
            const newResetBtn = resetBtn.cloneNode(true);
            resetBtn.parentNode.replaceChild(newResetBtn, resetBtn);
            
            newResetBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                this.resetPlayerMulliganSelection();
                audioManager.playSound('button');
            });
            
            newResetBtn.addEventListener('mouseenter', () => {
                newResetBtn.style.transform = 'scale(1.05)';
                newResetBtn.style.boxShadow = '0 6px 12px rgba(0,0,0,0.4)';
                audioManager.playSound('touch');
            });
            
            newResetBtn.addEventListener('mouseleave', () => {
                newResetBtn.style.transform = 'scale(1)';
                newResetBtn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
            });
        }
    },

    displayPlayerHandForMulligan: function() {
		const handContainer = document.getElementById('playerHand');
		if (!handContainer) return;

		const originalStyles = handContainer.style.cssText;
		handContainer.innerHTML = '';
		handContainer.classList.add('mulligan-active');
		
		const playerMulliganCanceled = this.gameState.mulligan.player.available === 0;
		
		if (playerMulliganCanceled) {
			audioManager.playSound('lock');
			
			const overlay = document.createElement('div');
			overlay.id = 'mulligan-overlay';
			overlay.style.cssText = `
				position: fixed;
				top: 0;
				left: 0;
				width: 100vw;
				height: 100vh;
				background: rgba(0, 0, 0, 0.9);
				backdrop-filter: blur(3px);
				z-index: 9998;
				display: flex;
				justify-content: center;
				align-items: center;
			`;
			
			const messageContainer = document.createElement('div');
			messageContainer.style.cssText = `
				text-align: center;
				margin-top: -100px;
			`;
			
			const lockImage = document.createElement('img');
			lockImage.src = 'board/lock.png';
			lockImage.alt = 'Заблокировано';
			lockImage.style.cssText = `
				width: 150px;
				height: 150px;
				margin: 20px auto;
				display: block;
				filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5));
			`;
			
			const title = document.createElement('div');
			title.textContent = 'МУЛЛИГАН ЗАБЛОКИРОВАН';
			title.style.cssText = `
				color: #f44336;
				font-family: 'Gwent', sans-serif;
				font-size: 28px;
				-webkit-text-stroke: 0.2px black;
				text-transform: uppercase;
				letter-spacing: 3px;
				margin-bottom: 20px;
				text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
			`;
			
			const description = document.createElement('div');
			description.textContent = 'Способность фракции Синдикат';
			description.style.cssText = `
				color: #aaa;
				font-family: 'Gwent', sans-serif;
				font-size: 18px;
				margin-bottom: 30px;
			`;
			
			messageContainer.appendChild(lockImage);
			messageContainer.appendChild(title);
			messageContainer.appendChild(description);
			overlay.appendChild(messageContainer);
        
			document.body.appendChild(overlay);
			setTimeout(() => {
				audioManager.playSound('button');
				const existingOverlay = document.getElementById('mulligan-overlay');
				if (existingOverlay) {
					existingOverlay.remove();
				}
				this.completePlayerMulligan();
			}, 2500);
			
			return;
		}
	
        const frameWrapper = document.createElement('div');
        frameWrapper.id = 'mulligan-frame-wrapper';
        frameWrapper.style.cssText = `
            position: relative;
            display: inline-block;
        `;
        
        const titleLabel = document.createElement('div');
        titleLabel.id = 'mulligan-title';
        titleLabel.textContent = 'Муллигана';
        titleLabel.style.cssText = `
            position: absolute;
            top: -25px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(145deg, rgb(42, 42, 42), rgb(26, 26, 26));
            color: #d4af37;
            padding: 3px 15px;
            border: 1px solid #d4af37;
            border-radius: 4px;
            font-family: "Gwent", sans-serif;
            font-size: 16px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            z-index: 1000;
            white-space: nowrap;
        `;
        
        const cardsContainer = document.createElement('div');
        cardsContainer.id = 'mulligan-cards-container';
        cardsContainer.style.cssText = `
            border: 1px solid #d4af37;
            border-radius: 5px;
            padding: 10px;
            background: rgba(0, 0, 0, 0.3);
            display: inline-block;
        `;
        
        const innerCardsContainer = document.createElement('div');
        innerCardsContainer.style.cssText = `
            display: flex;
            gap: 10px;
        `;
        
        this.gameState.player.hand.forEach((card, index) => {
            const cardElement = this.createMulliganCardElement(card, index);
            innerCardsContainer.appendChild(cardElement);
        });
        
        cardsContainer.appendChild(innerCardsContainer);
        frameWrapper.appendChild(titleLabel);
        frameWrapper.appendChild(cardsContainer);
        handContainer.appendChild(frameWrapper);
        
        handContainer.style.cssText = originalStyles;
        handContainer.style.display = 'flex';
        handContainer.style.justifyContent = 'center';
        handContainer.style.alignItems = 'center';
    },

    createMulliganCardElement: function(card, index) {
        const cardElement = document.createElement('div');
        cardElement.className = `hand-card ${card.type} ${card.rarity} mulligan-card`;
        cardElement.dataset.cardId = card.id;
        cardElement.dataset.handIndex = index;
        
        const { mediaPath, isVideo } = this.getCardMediaPath(card);

        let mediaElement = isVideo ? 
            `<video class="hand-card-media" muted playsinline preload="metadata"><source src="${mediaPath}" type="video/mp4"></video>` :
            `<img src="${mediaPath}" alt="${card.name}" class="hand-card-media" onerror="this.src='card/placeholder.jpg'">`;

        let topRightElement = card.type === 'unit' ? 
            `<div class="hand-card-strength">${card.strength || 0}</div>` :
            `<div class="hand-card-type-icon"><img src="${this.getTypeIconPath(card.type)}" alt="${card.type}"></div>`;

        let positionElement = '';
        if (card.type === 'unit' && card.position) {
            let positions = [];
            if (Array.isArray(card.position)) {
                positions = card.position;
            } else {
                positions = [card.position];
            }
            
            const displayPosition = positions.length > 1 ? 'any' : positions[0];
            const positionIconPath = this.getPositionIconPath(displayPosition);
            
            positionElement = `
                <div class="hand-card-position">
                    <img src="${card.positionBanner || 'deck/position_banner.png'}" alt="Позиция" class="hand-card-position-banner">
                    <img src="${positionIconPath}" alt="${displayPosition}" class="hand-card-position-icon">
                </div>
            `;
        }

        cardElement.innerHTML = `
            <div class="hand-card-container">
                ${mediaElement}
                <img src="${card.border || 'deck/bord_bronze.png'}" alt="Рамка" class="hand-card-border">
                <img src="${card.banner || `faction/${card.faction}/banner_bronze.png`}" alt="Баннер" class="hand-card-banner">
                <div class="hand-card-name">${card.name || 'Неизвестная карта'}</div>
                ${topRightElement}
                ${positionElement}
            </div>
        `;
    
        cardElement.addEventListener('click', (event) => {
            if (this.gameState.mulligan.phase === 'player') {
                this.handleMulliganCardSelection(card, cardElement);
                event.stopPropagation();
            }
        });
        
        cardElement.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            this.showCardModal(card);
            audioManager.playSound('button');
        });
        
        cardElement.addEventListener('mouseenter', () => {
            audioManager.playSound('touch');
        });
        
        return cardElement;
    },

    handleMulliganCardSelection: function(card, cardElement) {
        const mulliganState = this.gameState.mulligan.player;
        
        if (mulliganState.cards.length >= mulliganState.available && 
            !mulliganState.cards.includes(card)) {
            return;
        }
        
        const cardIndex = mulliganState.cards.indexOf(card);
        if (cardIndex === -1) {
            mulliganState.cards.push(card);
            cardElement.classList.add('mulligan-selected');
            audioManager.playSound('cardAdd');
        } else {
            mulliganState.cards.splice(cardIndex, 1);
            cardElement.classList.remove('mulligan-selected');
            audioManager.playSound('cardRemove');
        }
        
        this.updateMulliganInfo();
    },

	removeCardFromBoardVisual: function(card, row, player) {
		const rowElement = document.getElementById(`${player}${this.capitalizeFirst(row)}Row`);
		if (!rowElement) return;
		
		const cardElement = rowElement.querySelector(`[data-card-id="${card.id}"]`);
		if (cardElement) {
			// Добавляем анимацию исчезновения
			cardElement.style.animation = 'cardDestroy 0.5s ease-out forwards';
			
			// Удаляем через 0.5 секунды
			setTimeout(() => {
				if (cardElement.parentNode === rowElement) {
					rowElement.removeChild(cardElement);
				}
			}, 500);
		}
	},

    updateMulliganInfo: function() {
        const infoText = document.getElementById('mulliganInfoText');
        const infoPanel = document.getElementById('mulliganInfo');
        
        if (!infoText || !infoPanel) {
            return;
        }
        
        const mulliganState = this.gameState.mulligan.player;
        const selectedCount = mulliganState.cards.length;
        const availableCount = mulliganState.available;
        
        infoText.textContent = `Выбрано: ${selectedCount}/${availableCount} карт`;
        
        if (selectedCount > 0) {
            infoPanel.style.borderColor = '#4CAF50';
            infoPanel.style.color = '#4CAF50';
            infoPanel.style.boxShadow = '0 0 10px rgba(76, 175, 80, 0.3)';
        } else {
            infoPanel.style.borderColor = '#d4af37';
            infoPanel.style.color = '#d4af37';
            infoPanel.style.boxShadow = 'none';
        }
    },

    resetPlayerMulliganSelection: function() {
        const mulliganState = this.gameState.mulligan.player;
        
        const selectedCards = document.querySelectorAll('.mulligan-selected');
        selectedCards.forEach(cardElement => {
            cardElement.classList.remove('mulligan-selected');
        });
        
        mulliganState.cards = [];
        this.updateMulliganInfo();
    },

    completePlayerMulligan: function() {
		const mulliganState = this.gameState.mulligan.player;
		
		if (mulliganState.available > 0 && mulliganState.cards.length !== 0) {
			this.replaceMulliganCards('player');
		}
		
		this.removeMulliganInterface();
		
		setTimeout(() => {
			this.startOpponentMulligan();
		}, 1000);
	},

    replaceMulliganCards: function(player) {
        const mulliganState = this.gameState.mulligan[player];
        const gameState = this.gameState[player];
        
        const cardsToReplace = [...mulliganState.cards];
        const currentHand = [...gameState.hand];
        const currentDeck = [...gameState.deck];
        
        const removedCards = [];
        cardsToReplace.forEach(card => {
            const handIndex = currentHand.findIndex(c => c.id === card.id);
            if (handIndex !== -1) {
                const removedCard = currentHand.splice(handIndex, 1)[0];
                removedCards.push(removedCard);
            }
        });
        
        this.shuffleArray(currentDeck);
        
        const newCards = [];
        for (let i = 0; i < cardsToReplace.length; i++) {
            if (currentDeck.length > 0) {
                const newCard = currentDeck.shift();
                newCards.push(newCard);
            }
        }
        
        newCards.forEach(newCard => {
            currentHand.push(newCard);
        });
        
        removedCards.forEach(oldCard => {
            const randomPosition = Math.floor(Math.random() * (currentDeck.length + 1));
            currentDeck.splice(randomPosition, 0, oldCard);
        });

        this.shuffleArray(currentDeck);
        
        gameState.hand = currentHand;
        gameState.deck = currentDeck;
        mulliganState.used = cardsToReplace.length;
        
        if (player === 'player') {
            this.displayPlayerHand();
            this.displayPlayerDeck();
        }
        
        return true;
    },

    startOpponentMulligan: function() {
		this.gameState.mulligan.phase = 'opponent';
		this.removeMulliganInterface();
		
		const opponentHasMulligan = this.gameState.mulligan.opponent.available > 0;
		
		if (!opponentHasMulligan) {
			setTimeout(() => {
				this.completeMulliganPhase();
			}, 1500);
			return;
		}
		
		setTimeout(() => {
			this.performOpponentMulligan();
		}, 1500);
	},

    performOpponentMulligan: function() {
		const mulliganState = this.gameState.mulligan.opponent;
		
		if (mulliganState.available === 0) {
			this.completeMulliganPhase();
			return;
		}
		
		const hand = this.gameState.opponent.hand;
		
		const weakCards = hand
			.filter(card => card.type === 'unit')
			.sort((a, b) => (a.strength || 0) - (b.strength || 0))
			.slice(0, Math.min(2, hand.length));
		
		if (weakCards.length === 0) {
			weakCards.push(...hand.slice(0, Math.min(2, hand.length)));
		}
		
		mulliganState.cards = weakCards.slice(0, mulliganState.available);
		
		if (mulliganState.cards.length > 0) {
			this.replaceMulliganCards('opponent');
		}
		
		this.completeMulliganPhase();
	},

    removeMulliganInterface: function() {
        this.restoreGameBoardAfterMulligan();
        
        const controls = document.getElementById('mulliganControls');
        if (controls) {
            controls.remove();
        }
        
        const frameWrapper = document.getElementById('mulligan-frame-wrapper');
        if (frameWrapper) {
            frameWrapper.remove();
        }
        
        const handContainer = document.getElementById('playerHand');
        if (handContainer) {
            handContainer.classList.remove('mulligan-active');
            handContainer.innerHTML = '';
            this.displayPlayerHand();
        }
    },

    completeMulliganPhase: function() {
        this.gameState.mulligan.phase = 'completed';
        
        const playerUsed = this.gameState.mulligan.player.used;
        const opponentUsed = this.gameState.mulligan.opponent.used;
        
        this.displayPlayerHand();
        if (window.audioManager && window.audioManager.playSound) {
            audioManager.playSound('round_start');
        }
        setTimeout(() => {
            if (this.gameState.currentPlayer === 'player') {
                this.startPlayerTurn();
            } else {
                this.startOpponentTurn();
            }
        }, 1000);
    },

    startCoinToss: function() {
        const playerIsScoiatael = this.gameState.player.faction === 'scoiatael';
        const opponentIsScoiatael = this.gameState.opponent.faction === 'scoiatael';
        
        if (playerIsScoiatael || opponentIsScoiatael) {
            this.startScoiataelTurnChoice();
        } else {
            this.startCoinTossAnimation();
        }
    },

    startScoiataelTurnChoice: async function() {
        if (window.factionAbilitiesModule) {
            const firstTurn = await window.factionAbilitiesModule.determineFirstTurn(this.gameState);
            this.startGameAfterCoinToss(firstTurn);
        } else {
            this.startCoinTossAnimation();
        }
    },

    startCoinTossAnimation: function() {
        const coinOverlay = document.createElement('div');
        coinOverlay.id = 'coinTossOverlay';
        coinOverlay.className = 'coin-toss-overlay';
        coinOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: url('ui/fon.jpg') center/cover no-repeat;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            font-family: 'Gwent', sans-serif;
        `;

        coinOverlay.innerHTML = `
            <div class="coin-toss-container">
                <div class="coin-toss-title">ОПРЕДЕЛЕНИЕ ОЧЕРЁДНОСТИ ХОДА</div>
                
                <div class="coin-wrapper">
                    <div class="coin" id="coinElement">
                        <img src="board/coin_player.png" alt="Игрок ходит первым" class="coin-front">
                        <img src="board/coin_opponent.png" alt="Противник ходит первым" class="coin-back">
                    </div>
                </div>
                
                <div class="coin-result" id="coinResult"></div>
            </div>
        `;

        document.body.appendChild(coinOverlay);
        
        setTimeout(() => {
            this.animateCoinToss();
        }, 1500);
    },

    animateCoinToss: function() {
		const coinElement = document.getElementById('coinElement');
		const coinResult = document.getElementById('coinResult');
		if (!coinElement || !coinResult) {
			return;
		}
		
		const randomValue = Math.random();
		const goesFirst = randomValue < 0.5 ? 'player' : 'opponent';
		
		const finalSide = goesFirst === 'player' ? 0 : 180;
		const totalRotations = 5;
		const targetRotation = (totalRotations * 360) + finalSide;
		const animationDuration = 2500;
		
		coinElement.style.setProperty('--final-rotation', `${targetRotation}deg`);
		coinElement.style.setProperty('--animation-duration', `${animationDuration}ms`);
		
		setTimeout(() => {
			const animations = coinElement.getAnimations();
			animations.forEach(anim => anim.cancel());
			coinElement.style.transform = 'translateY(0) rotateX(0deg)';
			coinElement.classList.remove('coin-tossing', 'smooth-coin-toss');
			
			void coinElement.offsetWidth;
			
			coinElement.classList.add('smooth-coin-toss');
			
			if (audioManager && audioManager.playSound) {
				audioManager.playSound('coinToss');
			}
		}, 500);
		
		const resultDelay = 500 + animationDuration;
		
		setTimeout(() => {
			coinElement.style.transform = `rotateX(${finalSide}deg)`;
			coinElement.classList.remove('smooth-coin-toss');
			
			if (goesFirst === 'player') {
				coinResult.textContent = 'ИГРОК ХОДИТ ПЕРВЫМ';
				coinResult.style.color = '#4CAF50';
			} else {
				coinResult.textContent = 'ПРОТИВНИК ХОДИТ ПЕРВЫМ';
				coinResult.style.color = '#f44336';
			}
			coinResult.classList.add('show');
			this.gameState.currentPlayer = goesFirst;
			
			const gameStartDelay = 2000; 
			
			setTimeout(() => {
				this.startGameAfterCoinToss(goesFirst);
			}, gameStartDelay);
		}, resultDelay);
	},

    startGameAfterCoinToss: function(firstPlayer) {
        const coinOverlay = document.getElementById('coinTossOverlay');
        if (coinOverlay) {
            coinOverlay.style.opacity = '0';
            setTimeout(() => {
                if (coinOverlay.parentNode) {
                    coinOverlay.parentNode.removeChild(coinOverlay);
                }
            }, 500);
        }
        
        this.stopTurnTimer();
        this.gameState.currentPlayer = firstPlayer;
        this.startMulliganPhase();
    },

    loadSettings: function() {
        if (window.settingsModule) {
            const gameMode = settingsModule.getGameMode();
            this.gameState.gameSettings.mode = gameMode;
        }
    },

    updateGameSettings: function() {
        const mode = this.gameState.gameSettings.mode;
        
        if (mode === 'classic') {
            this.gameState.gameSettings.initialHandSize = 10;
            this.gameState.gameSettings.cardsPerRound = 0;
        } else {
            this.gameState.gameSettings.initialHandSize = 10;
            this.gameState.gameSettings.cardsPerRound = 3;
        }
    },

    onSettingsChange: function(settings) {
        this.currentSettings.cardDisplayMode = settings.cardDisplayMode;
        
        if (settings.gameMode !== this.gameState.gameSettings.mode) {
            this.gameState.gameSettings.mode = settings.gameMode;
            this.updateGameSettings();
        }
        
        this.updateAllCardDisplays();
    },

    updateAllCardDisplays: function() {
        this.displayPlayerHand();
        this.displayWeatherCards();
        this.redrawLeaders();
        
        const rows = ['close', 'ranged', 'siege'];
        rows.forEach(row => {
            this.gameState.player.rows[row].cards.forEach(card => {
                this.redrawCardOnBoard(card, row, 'player');
            });
            this.gameState.opponent.rows[row].cards.forEach(card => {
                this.redrawCardOnBoard(card, row, 'opponent');
            });
            if (this.gameState.player.rows[row].tactic) {
                this.redrawTacticCard(this.gameState.player.rows[row].tactic, row, 'player');
            }
            if (this.gameState.opponent.rows[row].tactic) {
                this.redrawTacticCard(this.gameState.opponent.rows[row].tactic, row, 'opponent');
            }
        });
    },

    redrawCardOnBoard: function(card, row, player) {
        const rowElement = document.getElementById(`${player}${this.capitalizeFirst(row)}Row`);
        if (!rowElement) return;
        
        const existingCard = rowElement.querySelector(`[data-card-id="${card.id}"]`);
        if (existingCard) {
            existingCard.remove();
        }
        
        const newCardElement = player === 'player' ? 
            this.createBoardCardElement(card, 'unit') : 
            this.createOpponentBoardCardElement(card);
            
        rowElement.appendChild(newCardElement);
        this.updateRowStrength(row, player);
    },

    redrawTacticCard: function(card, row, player) {
        const tacticSlot = document.getElementById(`${player}${this.capitalizeFirst(row)}Tactics`);
        if (!tacticSlot) return;
        
        tacticSlot.innerHTML = '';
        const cardElement = player === 'player' ? 
            this.createBoardCardElement(card, 'tactic') : 
            this.createOpponentBoardCardElement(card);
            
        tacticSlot.appendChild(cardElement);
    },

    redrawLeaders: function() {
        const playerLeaderSlot = document.getElementById('playerLeader');
        if (playerLeaderSlot && this.gameState.player.leader) {
            playerLeaderSlot.innerHTML = '';
            playerLeaderSlot.appendChild(this.createLeaderCardElement(this.gameState.player.leader, 'player'));
        }
        
        const opponentLeaderSlot = document.getElementById('opponentLeader');
        if (opponentLeaderSlot && this.gameState.opponent.leader) {
            opponentLeaderSlot.innerHTML = '';
            opponentLeaderSlot.appendChild(this.createLeaderCardElement(this.gameState.opponent.leader, 'opponent'));
        }
    },

    getCardMediaPath: function(card) {
        const cardDisplayMode = this.currentSettings.cardDisplayMode;
        
        let mediaPath = `card/${card.faction}/${card.image}`;
        let isVideo = card.image && card.image.endsWith('.mp4');
        
        if (cardDisplayMode === 'static' && isVideo) {
            mediaPath = mediaPath.replace('.mp4', '.jpg');
            isVideo = false;
        }
        
        return { mediaPath, isVideo };
    },

    startPlayerTurn: function() {
		if (this.gameState.mulligan.phase !== 'completed') {
            return;
        }
        this.gameState.gamePhase = 'playerTurn';
        this.gameState.currentPlayer = 'player';
        this.gameState.cardsPlayedThisTurn = 0;
        this.gameState.selectingRow = false;
        this.gameState.selectedCard = null;
        
        if (!this.gameState.player.passed) {
            this.startTurnTimer();
        } else {
            this.hideTimerDisplay();
        }
        
        this.updateGameModeIndicator();
        this.updateTurnIndicator();
        this.updateControlButtons();
        this.showGameMessage('Ваш ход', 'info');
		audioManager.playSound('warning');
    },

    startOpponentTurn: function() {
        this.gameState.gamePhase = 'opponentTurn'; 
        this.gameState.currentPlayer = 'opponent';
        this.gameState.cardsPlayedThisTurn = 0;
        this.stopTurnTimer();
        this.updateTurnIndicator();
        this.updateControlButtons();
        this.showGameMessage('Ход противника', 'warning');
		audioManager.playSound('warning');
        
        if (this.gameState.opponent.passed) {
            this.showGameMessage('Противник пасовал', 'info');
            setTimeout(() => {
                this.startPlayerTurn();
            }, 1000);
            return;
        }
        
        setTimeout(() => {
            if (window.aiModule) {
                window.aiModule.makeMove();
            } else {
                this.startPlayerTurn();
            }
        }, 1000);
    },

    handleTurnEnd: function() {
        this.stopTurnTimer();
        
        const currentPlayer = this.gameState.currentPlayer;
        this.gameState.cardsPlayedThisTurn = 0;
        this.gameState.selectingRow = false;
        this.gameState.selectedCard = null;
        
        if (this.gameState[currentPlayer].passed) {
            this.checkRoundEnd();
        } else {
            if (currentPlayer === 'player') {
                this.startOpponentTurn();
            } else {
                this.startPlayerTurn();
            }
        }
    },

	createCrownIndicators: function() {
        const playerLeaderArea = document.querySelector('.player-leader-area');
        if (playerLeaderArea) {
            const crown1Player = document.createElement('img');
            crown1Player.id = 'crown1Player';
            crown1Player.className = 'crown-indicator crown1-player crown-hidden';
            crown1Player.src = 'board/crown1.png';
            crown1Player.alt = 'Первая победа';
            
            const crown2Player = document.createElement('img');
            crown2Player.id = 'crown2Player';
            crown2Player.className = 'crown-indicator crown2-player crown-hidden';
            crown2Player.src = 'board/crown2.png';
            crown2Player.alt = 'Вторая победа';
            
            playerLeaderArea.appendChild(crown1Player);
            playerLeaderArea.appendChild(crown2Player);
        }
        
        const opponentLeaderArea = document.querySelector('.opponent-leader-area');
        if (opponentLeaderArea) {
            const crown1Opponent = document.createElement('img');
            crown1Opponent.id = 'crown1Opponent';
            crown1Opponent.className = 'crown-indicator crown1-opponent crown-hidden';
            crown1Opponent.src = 'board/crown1.png';
            crown1Opponent.alt = 'Первая победа противника';
            
            const crown2Opponent = document.createElement('img');
            crown2Opponent.id = 'crown2Opponent';
            crown2Opponent.className = 'crown-indicator crown2-opponent crown-hidden';
            crown2Opponent.src = 'board/crown2.png';
            crown2Opponent.alt = 'Вторая победа противника';
            
            opponentLeaderArea.appendChild(crown1Opponent);
            opponentLeaderArea.appendChild(crown2Opponent);
        }
    },

    updateCrownIndicators: function() {
        const playerWins = this.gameState.roundsWon.player;
        const opponentWins = this.gameState.roundsWon.opponent;
        
        const crown1Player = document.getElementById('crown1Player');
        const crown2Player = document.getElementById('crown2Player');
        
        if (crown1Player) {
            if (playerWins >= 1) {
                crown1Player.classList.remove('crown-hidden');
                crown1Player.classList.add('crown-visible');
            } else {
                crown1Player.classList.add('crown-hidden');
                crown1Player.classList.remove('crown-visible');
            }
        }
        
        if (crown2Player) {
            if (playerWins >= 2) {
                crown2Player.classList.remove('crown-hidden');
                crown2Player.classList.add('crown-visible');
            } else {
                crown2Player.classList.add('crown-hidden');
                crown2Player.classList.remove('crown-visible');
            }
        }
        
        const crown1Opponent = document.getElementById('crown1Opponent');
        const crown2Opponent = document.getElementById('crown2Opponent');
        
        if (crown1Opponent) {
            if (opponentWins >= 1) {
                crown1Opponent.classList.remove('crown-hidden');
                crown1Opponent.classList.add('crown-visible');
            } else {
                crown1Opponent.classList.add('crown-hidden');
                crown1Opponent.classList.remove('crown-visible');
            }
        }
        
        if (crown2Opponent) {
            if (opponentWins >= 2) {
                crown2Opponent.classList.remove('crown-hidden');
                crown2Opponent.classList.add('crown-visible');
            } else {
                crown2Opponent.classList.add('crown-hidden');
                crown2Opponent.classList.remove('crown-visible');
            }
        }
    },

    resetCrownIndicators: function() {
        const crowns = [
            'crown1Player', 'crown2Player',
            'crown1Opponent', 'crown2Opponent'
        ];
        
        crowns.forEach(crownId => {
            const crown = document.getElementById(crownId);
            if (crown) {
                crown.classList.add('crown-hidden');
                crown.classList.remove('crown-visible');
            }
        });
    },
	
    endRound: function() {
        this.hideTimerDisplay();
		const playerScore = this.calculateTotalScore('player');
        const opponentScore = this.calculateTotalScore('opponent');
        
        if (this.gameState.roundLossDueToTimeout) {
            const losingPlayer = this.gameState.roundLossDueToTimeout;
            
            if (losingPlayer === 'player') {
                this.gameState.roundsWon.opponent++;
                this.showRoundResult('opponent', playerScore, opponentScore);
            } else {
                this.gameState.roundsWon.player++;
                this.showRoundResult('player', playerScore, opponentScore);
            }
            
            this.gameState.roundLossDueToTimeout = null;
        } else {
            let roundWinner = null;
            
            if (window.factionAbilitiesModule) {
                roundWinner = window.factionAbilitiesModule.checkRoundWinner(
                    this.gameState, 
                    playerScore, 
                    opponentScore
                );
            } else {
                if (playerScore > opponentScore) {
                    roundWinner = 'player';
                } else if (opponentScore > playerScore) {
                    roundWinner = 'opponent';
                }
            }
            
            if (roundWinner === 'player') {
                this.gameState.roundsWon.player++;
            } else if (roundWinner === 'opponent') {
                this.gameState.roundsWon.opponent++;
            } else {
                this.gameState.roundsWon.player++;
                this.gameState.roundsWon.opponent++;
            }
            
            this.showRoundResult(roundWinner, playerScore, opponentScore);
        }
        
        if (window.factionAbilitiesModule) {
            window.factionAbilitiesModule.handleRoundEndForMonsters(this.gameState);
        }
        
        if (this.gameState.roundsWon.player >= 2 || this.gameState.roundsWon.opponent >= 2) {
            setTimeout(() => this.endGame(), 3000);
        } else {
            setTimeout(() => this.startNewRound(), 3000);
        }
    },

    calculateTotalScore: function(player) {
        const rows = this.gameState[player].rows;
        
        if (this.gameState[player].cachedTotalScore !== undefined) {
            const rowsChanged = Object.values(rows).some(row => 
                row.cards.length !== (this.gameState[player].cachedRowLengths?.[row] || 0)
            );
            
            if (!rowsChanged) {
                return this.gameState[player].cachedTotalScore;
            }
        }
        
        const totalScore = Object.values(rows).reduce((total, row) => total + row.strength, 0);
        this.gameState[player].cachedTotalScore = totalScore;
        this.gameState[player].cachedRowLengths = {};
        Object.keys(rows).forEach(rowKey => {
            this.gameState[player].cachedRowLengths[rowKey] = rows[rowKey].cards.length;
        });
        
        return totalScore;
    },

    resolveTie: function() {
        if (this.gameState.player.faction === 'nilfgaard') {
            return 'player';
        } else if (this.gameState.opponent.faction === 'nilfgaard') {
            return 'opponent';
        }
        return null;
    },

    startNewRound: function() {
		this.hideTimerDisplay();
		
		if (window.audioManager && window.audioManager.playSound) {
			audioManager.playSound('round_start');
		}
		
		if (window.factionAbilitiesModule) {
			window.factionAbilitiesModule.handleRound3ForSkellige(this.gameState);
		}
		
		const mode = this.gameState.gameSettings.mode;
		this.showGameMessage(`Раунд ${this.gameState.currentRound}`, 'info');
		this.updateRoundCounter();
		this.updateCrownIndicators();
		this.resetRoundState();
		this.dealAdditionalCards();
		this.startPlayerTurn();
	},

    updateGameModeIndicator: function() {
        const mode = this.gameState.gameSettings.mode;
        const modeName = mode === 'classic' ? 'Классический' : 'CD Project Red';
        const modeColor = mode === 'classic' ? '#d4af37' : '#d4af37';
        
        let modeIndicator = document.getElementById('gameModeIndicator');
        if (!modeIndicator) {
            modeIndicator = document.createElement('div');
            modeIndicator.id = 'gameModeIndicator';
            modeIndicator.style.cssText = `
                position: absolute;
                top: 0.5%;
                right: 0.5%;
                color: ${modeColor};
                padding: 2px 3px;
                border-radius: 5px;
                border: 1px solid ${modeColor};
                font-family: 'Gwent', sans-serif;
                font-size: 10px;
                text-transform: uppercase;
                letter-spacing: 1px;
                z-index: 50;
            `;
            document.querySelector('.game-board').appendChild(modeIndicator);
        }
        
        modeIndicator.textContent = modeName;
        modeIndicator.title = `Режим игры: ${modeName}\n${mode === 'classic' ? '10 карт на всю игру' : 'Карты добираются каждый раунд'}`;
    },

    resetRoundState: function() {
        this.gameState.player.passed = false;
        this.gameState.opponent.passed = false;
        this.gameState.cardsPlayedThisTurn = 0;
        this.resetTimeoutCounter();
        this.gameState.roundLossDueToTimeout = null;
        this.invalidateScoreCache('player');
        this.invalidateScoreCache('opponent');
        this.restoreAllCardStrengths();
        
        this.gameState.weather.cards.forEach(weatherCard => {
            const cardOwner = this.getWeatherCardOwner(weatherCard);
            this.addCardToDiscard(weatherCard, cardOwner);
        });
        
        this.gameState.weather.cards = [];
        this.clearAllWeatherEffects();
        
        const rows = ['close', 'ranged', 'siege'];
        
        rows.forEach(row => {
            this.gameState.player.rows[row].cards.forEach(card => {
                this.addCardToDiscard(card, 'player');
            });
            
            this.gameState.opponent.rows[row].cards.forEach(card => {
                this.addCardToDiscard(card, 'opponent');
            });
            
            if (this.gameState.player.rows[row].tactic) {
                this.addCardToDiscard(this.gameState.player.rows[row].tactic, 'player');
            }
            
            if (this.gameState.opponent.rows[row].tactic) {
                this.addCardToDiscard(this.gameState.opponent.rows[row].tactic, 'opponent');
            }
            
            this.gameState.player.rows[row] = { cards: [], strength: 0, tactic: null };
            this.gameState.opponent.rows[row] = { cards: [], strength: 0, tactic: null };
        });
        
        this.clearAllBoardRows();
        this.displayWeatherCards();
        this.updateTotalScoreDisplays();
    },

    restoreAllCardStrengths: function() {
		const rows = ['close', 'ranged', 'siege'];
		const players = ['player', 'opponent'];
		
		rows.forEach(row => {
			players.forEach(player => {
				this.gameState[player].rows[row].cards.forEach(card => {
					// Восстанавливаем от урона
					if (card._displayStrength !== undefined) {
						// Если была сохранена оригинальная сила, восстанавливаем ее
						if (card.originalStrength !== undefined) {
							delete card._displayStrength;
						} else {
							// Иначе оставляем текущую силу
							card.strength = card._displayStrength;
							delete card._displayStrength;
						}
					}
					
					// Восстанавливаем от погоды
					if (card.originalStrength !== undefined) {
						card.strength = card.originalStrength;
						delete card.originalStrength;
					}
				});
			});
		});
	},

    invalidateScoreCache: function(player) {
        if (this.gameState[player]) {
            this.gameState[player].cachedTotalScore = undefined;
            this.gameState[player].cachedRowLengths = undefined;
        }
    },

    endGame: function() {
        const playerWins = this.gameState.roundsWon.player;
        const opponentWins = this.gameState.roundsWon.opponent;
        
        let gameWinner = null;
        if (playerWins > opponentWins) {
            gameWinner = 'player';
        } else if (opponentWins > playerWins) {
            gameWinner = 'opponent';
        } else {
            gameWinner = 'draw';
        }
        
        this.showGameResult(gameWinner);
    },

    clearAllBoardRows: function() {
        const rows = ['close', 'ranged', 'siege'];
        
        rows.forEach(row => {
            const playerRow = document.getElementById(`player${this.capitalizeFirst(row)}Row`);
            const playerTactic = document.getElementById(`player${this.capitalizeFirst(row)}Tactics`);
            
            if (playerRow) playerRow.innerHTML = '';
            if (playerTactic) playerTactic.innerHTML = '';
            
            const opponentRow = document.getElementById(`opponent${this.capitalizeFirst(row)}Row`);
            const opponentTactic = document.getElementById(`opponent${this.capitalizeFirst(row)}Tactics`);
            
            if (opponentRow) opponentRow.innerHTML = '';
            if (opponentTactic) opponentTactic.innerHTML = '';
            
            const playerStrength = document.getElementById(`player${this.capitalizeFirst(row)}Strength`);
            const opponentStrength = document.getElementById(`opponent${this.capitalizeFirst(row)}Strength`);
            
            if (playerStrength) playerStrength.textContent = '0';
            if (opponentStrength) opponentStrength.textContent = '0';
        });
    },

    handleRegularWeather: function(card) {
		const isClearWeather = this.isClearWeatherCard(card);
		
		if (isClearWeather) {
			// Если это "Чистое небо", обрабатываем отдельно
			this.handleClearWeather(card);
			return;
		}
		
		const clearWeatherIndex = this.gameState.weather.cards.findIndex(
			weatherCard => this.isClearWeatherCard(weatherCard)
		);
		if (clearWeatherIndex !== -1) {
			const clearWeatherCard = this.gameState.weather.cards[clearWeatherIndex];
			const clearWeatherOwner = this.getWeatherCardOwner(clearWeatherCard);
			this.addCardToDiscard(clearWeatherCard, clearWeatherOwner);
			this.gameState.weather.cards.splice(clearWeatherIndex, 1);
			this.clearAllWeatherEffects();
			this.restoreAllRowStrengths();
		} else {
			const regularWeatherCards = this.gameState.weather.cards.filter(wc => 
				!this.isClearWeatherCard(wc)
			);
			if (regularWeatherCards.length >= this.gameState.weather.maxWeatherCards) {
				return;
			}
		}
		if (!card.owner) {
			card.owner = this.gameState.currentPlayer === 'player' ? 'player' : 'opponent';
		}
		this.gameState.weather.cards.push(card);
		this.applyWeatherEffect(card);
		this.displayWeatherCards();
	},

    removeCardFromHand: function(card, player) {
        const cardIndex = this.gameState[player].hand.findIndex(c => c.id === card.id);
        if (cardIndex !== -1) {
            this.gameState[player].hand.splice(cardIndex, 1);
            if (player === 'player') {
                this.displayPlayerHand();
            }
        }
    },

    handleClearWeather: function(card) {
		this.playWeatherSound('clear');
		
		// Сначала сохраняем карты, которые будут сброшены
		const weatherCardsToDiscard = [...this.gameState.weather.cards];
		
		// Очищаем погодные эффекты
		this.gameState.weather.cards = [];
		this.gameState.weather.cards.push(card);
		
		// Восстанавливаем силу карт на всех рядах
		const rows = ['close', 'ranged', 'siege'];
		const players = ['player', 'opponent'];
		
		rows.forEach(row => {
			players.forEach(player => {
				this.gameState[player].rows[row].cards.forEach(card => {
					if (card.originalStrength !== undefined) {
						// Восстанавливаем оригинальную силу
						card.strength = card.originalStrength;
						// Удаляем временные свойства погоды
						delete card.originalStrength;
						delete card._displayStrength; // Важно: удаляем displayStrength
						this.updateCardStrengthDisplay(card, row, player);
					} else if (card._displayStrength !== undefined) {
						// Если есть только displayStrength (от урона)
						card.strength = card._displayStrength;
						delete card._displayStrength;
						this.updateCardStrengthDisplay(card, row, player);
					}
				});
				this.updateRowStrength(row, player);
			});
		});
		
		// Сбрасываем погодные карты
		weatherCardsToDiscard.forEach(weatherCard => {
			const cardOwner = this.getWeatherCardOwner(weatherCard);
			const isAlreadyInDiscard = this.gameState[cardOwner].discard.some(
				discardedCard => discardedCard.id === weatherCard.id
			);
			if (!isAlreadyInDiscard) {
				this.addCardToDiscard(weatherCard, cardOwner);
			}
		});
		
		// Очищаем визуальные эффекты
		this.clearAllWeatherEffects();
		
		// Обновляем отображение
		this.displayWeatherCards();
		this.updateTotalScoreDisplays();
	},

    applyWeatherEffect: function(card) {
		const weatherEffect = this.getWeatherEffectForCard(card);
		if (!weatherEffect) return;
		
		const { rows, images, sounds } = weatherEffect;
		
		rows.forEach(row => {
			this.gameState.weather.effects[row] = {
				card: card,
				image: images[row],
				sound: sounds[row]
			};
			
			this.applyVisualWeatherEffect(row, images[row]);
			
			// Важно: применяем эффект только если это не "Чистое небо"
			if (card.name !== 'Чистое небо') {
				this.reduceRowStrengthTo1(row, 'player');
				this.reduceRowStrengthTo1(row, 'opponent');
			}
			
			if (sounds[row]) {
				this.playWeatherSound(sounds[row]);
			}
		});
		
		this.updateTotalScoreDisplays();
	},

    clearAllWeatherEffects: function() {
        const rows = ['close', 'ranged', 'siege'];
        
        rows.forEach(row => {
            this.gameState.weather.effects[row] = null;
            this.removeVisualWeatherEffect(row);
        });
    },

    restoreAllRowStrengths: function() {
		const rows = ['close', 'ranged', 'siege'];
		const players = ['player', 'opponent'];
		
		rows.forEach(row => {
			players.forEach(player => {
				this.gameState[player].rows[row].cards.forEach(card => {
					// Восстанавливаем оригинальную силу и убираем временные свойства
					if (card.originalStrength !== undefined) {
						card.strength = card.originalStrength;
						delete card._displayStrength; // Удаляем displayStrength
						delete card.originalStrength;
						this.updateCardStrengthDisplay(card, row, player);
					}
					// Также проверяем наличие displayStrength без originalStrength (урон)
					else if (card._displayStrength !== undefined) {
						card.strength = card._displayStrength;
						delete card._displayStrength;
						this.updateCardStrengthDisplay(card, row, player);
					}
				});
				this.updateRowStrength(row, player);
			});
		});
		
		this.updateTotalScoreDisplays();
	},

    reduceRowStrengthTo1: function(row, player) {
		this.gameState[player].rows[row].cards.forEach(card => {
			if (card.strength > 1) {
				// Используем локальную копию силы, не затрагивая оригинальный объект
				if (card.originalStrength === undefined) {
					// Сохраняем оригинальную силу как локальное свойство
					card.originalStrength = card.strength;
				}
				// Меняем только отображаемую силу
				card._displayStrength = 1;
				this.updateCardStrengthDisplay(card, row, player);
			}
		});
		this.updateRowStrength(row, player);
	},

    updateControlButtons: function() {
        const passBtn = document.getElementById('passBtn');
        const endTurnBtn = document.getElementById('endTurnBtn');
        
        if (!passBtn || !endTurnBtn) return;
        
        const isPlayerTurn = this.gameState.gamePhase === 'playerTurn';
        const playerPassed = this.gameState.player.passed;
        const canPlayMoreCards = this.gameState.cardsPlayedThisTurn < this.gameState.maxCardsPerTurn;
        
        passBtn.disabled = !isPlayerTurn || playerPassed || !canPlayMoreCards;
        endTurnBtn.disabled = !isPlayerTurn || (canPlayMoreCards && !playerPassed);
        
        passBtn.style.opacity = (!isPlayerTurn || playerPassed || !canPlayMoreCards) ? '0.5' : '1';
        passBtn.style.cursor = (!isPlayerTurn || playerPassed || !canPlayMoreCards) ? 'not-allowed' : 'pointer';
        
        endTurnBtn.style.opacity = (!isPlayerTurn || (canPlayMoreCards && !playerPassed)) ? '0.5' : '1';
        endTurnBtn.style.cursor = (!isPlayerTurn || (canPlayMoreCards && !playerPassed)) ? 'not-allowed' : 'pointer';
        
        if (isPlayerTurn && !canPlayMoreCards) {
            endTurnBtn.style.background = '#4CAF50';
            endTurnBtn.textContent = 'Завершить ход ✓';
        } else if (isPlayerTurn && playerPassed) {
            endTurnBtn.style.background = '#ff9800';
            endTurnBtn.textContent = 'Ожидание противника';
        } else {
            endTurnBtn.style.background = '';
            endTurnBtn.textContent = 'Завершить ход';
        }
        
        if (playerPassed) {
            passBtn.textContent = 'Пас ✓';
            passBtn.style.background = '#ff9800';
        } else {
            passBtn.textContent = 'Пас';
            passBtn.style.background = '';
        }
    },

    updateAllDisplays: function() {
        this.displayPlayerHand();
        this.displayPlayerDeck();
        this.displayOpponentDeck();
        this.displayPlayerDiscard();
        this.displayOpponentDiscard();
        this.displayWeatherCards();
        
        const rows = ['close', 'ranged', 'siege'];
        rows.forEach(row => {
            this.updateRowStrength(row, 'player');
            this.updateRowStrength(row, 'opponent');
        });
    },

    createTotalScoreDisplays: function() {
        const gameBoard = document.querySelector('.game-board');
        const playerLeader = document.getElementById('playerLeader');
        const opponentLeader = document.getElementById('opponentLeader');
        
        if (!gameBoard || !playerLeader || !opponentLeader) return;
        
        const opponentScoreDisplay = document.createElement('div');
        opponentScoreDisplay.id = 'opponentTotalScore';
        opponentScoreDisplay.className = 'total-score-display opponent-total-score';
        opponentScoreDisplay.style.cssText = `
            position: absolute;
            z-index: 100;
            text-align: center;
        `;
        
        opponentScoreDisplay.innerHTML = `
            <div class="score-background" style="
                background: url('board/score.png') center/contain no-repeat;
                width: 120px;
                height: 60px;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                left: 150px;
                top: 80px;
            ">
                <div class="score-value" style="
                    color: #f44336;
                    font-size: 24px;
                    font-weight: bold;
                    font-family: 'Gwent', sans-serif;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
                    margin-bottom: 5px;
                ">0</div>
            </div>
        `;
        
        const playerScoreDisplay = document.createElement('div');
        playerScoreDisplay.id = 'playerTotalScore';
        playerScoreDisplay.className = 'total-score-display player-total-score';
        playerScoreDisplay.style.cssText = `
            position: absolute;
            z-index: 100;
            text-align: center;
        `;
        
        playerScoreDisplay.innerHTML = `
            <div class="score-background" style="
                background: url('board/score.png') center/contain no-repeat;
                width: 120px;
                height: 60px;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                left: 150px;
                bottom: 85px;
            ">
                <div class="score-value" style="
                    color: #4CAF50;
                    font-size: 24px;
                    font-weight: bold;
                    font-family: 'Gwent', sans-serif;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
                    margin-bottom: 5px;
                ">0</div>
            </div>
        `;
        
        gameBoard.appendChild(opponentScoreDisplay);
        gameBoard.appendChild(playerScoreDisplay);
    },

    updateTotalScoreDisplays: function() {
        const playerTotalScore = this.calculateTotalScore('player');
        const opponentTotalScore = this.calculateTotalScore('opponent');
        
        const playerScoreElement = document.getElementById('playerTotalScore');
        const opponentScoreElement = document.getElementById('opponentTotalScore');
        
        if (playerScoreElement) {
            const scoreValue = playerScoreElement.querySelector('.score-value');
            if (scoreValue) {
                scoreValue.textContent = playerTotalScore;
                scoreValue.classList.add('score-update');
                setTimeout(() => {
                    scoreValue.classList.remove('score-update');
                }, 500);
            }
        }
        
        if (opponentScoreElement) {
            const scoreValue = opponentScoreElement.querySelector('.score-value');
            if (scoreValue) {
                scoreValue.textContent = opponentTotalScore;
                scoreValue.classList.add('score-update');
                setTimeout(() => {
                    scoreValue.classList.remove('score-update');
                }, 500);
            }
        }
    },

    completeCardPlay: function() {
        this.gameState.selectedCard = null;
        this.gameState.selectingRow = false;
        this.gameState.cardsPlayedThisTurn++;
        this.updateTotalScoreDisplays();
        this.resetTimeoutCounter();
        
        if (this.gameState.cardsPlayedThisTurn >= this.gameState.maxCardsPerTurn) {
            setTimeout(() => {
                this.handleTurnEnd();
            }, 800);
        } else {
            this.updateControlButtons();
        }
        
        if (window.playerModule && window.playerModule.cancelRowSelection) {
            window.playerModule.cancelRowSelection();
        }
    },

    endTurn: function() {
        this.gameState.cardsPlayedThisTurn = 0;
        this.handleTurnCompletion();
    },

    addCardToDiscard: function(card, player) {
        this.gameState[player].discard.push(card);
        this.updateDiscardDisplay(player);
    },

    getWeatherCardOwner: function(weatherCard) {
        if (weatherCard.owner) return weatherCard.owner;
        if (weatherCard.id && weatherCard.id.includes('opponent')) return 'opponent';
        return 'player';
    },

    isClearWeatherCard: function(card) {
        return card.name === 'Чистое небо' || card.id === 'neutral_special_4';
    },

    getWeatherEffectForCard: function(card) {
        const weatherEffects = {
            'Трескучий мороз': { 
                rows: ['close'], 
                images: {'close': 'board/frost.png'}, 
                sounds: {'close': 'frost'} 
            },
            'Белый Хлад': { 
                rows: ['close', 'ranged'], 
                images: {'close': 'board/frost.png', 'ranged': 'board/fog.png'},
                sounds: {'close': 'frost', 'ranged': 'fog'}
            },
            'Густой туман': { 
                rows: ['ranged'], 
                images: {'ranged': 'board/fog.png'},
                sounds: {'ranged': 'fog'}
            },
            'Проливной дождь': { 
                rows: ['siege'], 
                images: {'siege': 'board/rain.png'},
                sounds: {'siege': 'rain'}
            },
            'Шторм Скеллиге': { 
                rows: ['ranged', 'siege'], 
                images: {'ranged': 'board/fog.png', 'siege': 'board/rain.png'},
                sounds: {'ranged': 'fog', 'siege': 'rain'}
            },
            'Чистое небо': { 
                rows: [], 
                images: {},
                sounds: {'clear': 'clear'}
            }
        };
        return weatherEffects[card.name];
    },

    playWeatherSound: function(soundType) {
        if (window.audioManager && window.audioManager.playWeatherSound) {
            window.audioManager.playWeatherSound(soundType);
        }
    },

    endPlayerTurn: function() {
        this.startOpponentTurn();
    },

    checkRoundEnd: function() {
        if (this.gameState.player.passed && this.gameState.opponent.passed) {
            setTimeout(() => this.endRound(), 1000);
        } else {
            let nextPlayer;
            if (this.gameState.player.passed && !this.gameState.opponent.passed) {
                nextPlayer = 'opponent';
            } else if (!this.gameState.player.passed && this.gameState.opponent.passed) {
                nextPlayer = 'player';
            } else {
                nextPlayer = this.gameState.currentPlayer === 'player' ? 'opponent' : 'player';
            }
            
            if (nextPlayer === 'player') {
                this.startPlayerTurn();
            } else {
                this.startOpponentTurn();
            }
        }
    },

    addCardToDiscard: function(card, player) {
        this.gameState[player].discard.push(card);
        this.updateDiscardDisplay(player);
    },

    dealAdditionalCards: function() {
		const mode = this.gameState.gameSettings.mode;
		
		if (mode === 'classic') {
			return;
		}
		const cardsPerRound = this.gameState.gameSettings.cardsPerRound; 
		const maxHandSize = 10;
		const playerCurrentHandSize = this.gameState.player.hand.length;
		const playerCardsCanDraw = Math.min(
			cardsPerRound,
			this.gameState.player.deck.length, 
			maxHandSize - playerCurrentHandSize 
		);
		if (playerCardsCanDraw > 0) {
			const newCards = this.gameState.player.deck.splice(0, playerCardsCanDraw);
			this.gameState.player.hand.push(...newCards);
		}

		const opponentCurrentHandSize = this.gameState.opponent.hand.length;
		const opponentCardsCanDraw = Math.min(
			cardsPerRound,
			this.gameState.opponent.deck.length, 
			maxHandSize - opponentCurrentHandSize 
		);
		if (opponentCardsCanDraw > 0) {
			const newCards = this.gameState.opponent.deck.splice(0, opponentCardsCanDraw);
			this.gameState.opponent.hand.push(...newCards);
		}
		this.displayPlayerHand();
		this.displayPlayerDeck();
		this.displayOpponentDeck();
	},

    displayPlayerHand: function() {
        const handContainer = document.getElementById('playerHand');
        if (!handContainer) return;

        handContainer.innerHTML = '';
        this.gameState.player.hand.forEach((card, index) => {
            const cardElement = this.createHandCardElement(card, index);
            handContainer.appendChild(cardElement);
        });
    },

    redrawRow: function(row, player) {
		const rowElement = document.getElementById(`${player}${this.capitalizeFirst(row)}Row`);
		if (!rowElement) return;
		
		rowElement.innerHTML = '';
		
		const cards = this.gameState[player].rows[row].cards;
		cards.forEach(card => {
			const cardElement = player === 'player' ? 
				this.createBoardCardElement(card, 'unit') : 
				this.createOpponentBoardCardElement(card);
			rowElement.appendChild(cardElement);
		});
		
		this.updateRowStrength(row, player);
	},

	displayCardOnRow: function(row, card, player = 'player', insertIndex = -1) {
		const rowElement = document.getElementById(`${player}${this.capitalizeFirst(row)}Row`);
		if (!rowElement) return;

		const cardElement = player === 'player' ? 
			this.createBoardCardElement(card, 'unit') : 
			this.createOpponentBoardCardElement(card);
		
		if (insertIndex >= 0 && insertIndex < rowElement.children.length) {
			const referenceElement = rowElement.children[insertIndex];
			rowElement.insertBefore(cardElement, referenceElement);
		} else {
			rowElement.appendChild(cardElement);
		}
	},

    displayTacticCard: function(row, card, player = 'player') {
        const tacticSlot = document.getElementById(`${player}${this.capitalizeFirst(row)}Tactics`);
        if (!tacticSlot) return;

        tacticSlot.innerHTML = '';
        const cardElement = player === 'player' ? 
            this.createBoardCardElement(card, 'tactic') : 
            this.createOpponentBoardCardElement(card);
            
        tacticSlot.appendChild(cardElement);
    },

    updateRowStrength: function(row, player = 'player') {
		const rowState = this.gameState[player].rows[row];
		
		// Используем displayStrength если есть, иначе оригинальную силу
		const totalStrength = rowState.cards.reduce((sum, card) => {
			let cardStrength;
			
			// Если есть displayStrength (для поврежденных карт)
			if (card._displayStrength !== undefined) {
				cardStrength = card._displayStrength;
			}
			// Если карта под погодой
			else if (this.isCardUnderWeather(card, row) && card.originalStrength !== undefined) {
				cardStrength = 1;
			}
			// Иначе оригинальную силу
			else {
				cardStrength = card.strength || 0;
			}
			
			return sum + cardStrength;
		}, 0);
		
		rowState.strength = totalStrength;
		
		const strengthElement = document.getElementById(`${player}${this.capitalizeFirst(row)}Strength`);
		if (strengthElement) {
			strengthElement.textContent = totalStrength;
			strengthElement.classList.add('strength-update');
			setTimeout(() => strengthElement.classList.remove('strength-update'), 500);
		}
		
		this.updateTotalScoreDisplays();
	},

	isCardDamaged: function(card) {
		return card._displayStrength !== undefined && 
			   card.originalStrength !== undefined && 
			   card._displayStrength < card.originalStrength;
	},

	createCardCopy: function(card) {
		// Создаем глубокую копию карты
		const copy = JSON.parse(JSON.stringify(card));
		
		// Добавляем уникальный ID для отслеживания
		copy.uniqueId = `${card.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		
		// Сохраняем оригинальную силу в локальном свойстве
		copy.originalStrength = card.strength;
		copy._displayStrength = card.strength;
		
		return copy;
	},

    getCardMediaPath: function(card) {
        const cardDisplayMode = window.settingsModule ? window.settingsModule.getCardDisplayMode() : 'animated';
        
        let mediaPath = `card/${card.faction}/${card.image}`;
        let isVideo = card.image && card.image.endsWith('.mp4');
        
        if (cardDisplayMode === 'static' && isVideo) {
            mediaPath = mediaPath.replace('.mp4', '.jpg');
            isVideo = false;
        }
        
        return { mediaPath, isVideo };
    },

	isCardUnderWeather: function(card, row) {
		if (!this.gameState || !this.gameState.weather) return false;
		
		// Проверяем эффекты погоды на ряду
		const rowWeather = this.gameState.weather.effects[row];
		if (!rowWeather) return false;
		
		// Проверяем, что погода влияет на этот ряд
		const weatherEffect = this.getWeatherEffectForCard(rowWeather.card);
		if (!weatherEffect || !weatherEffect.rows) return false;
		
		return weatherEffect.rows.includes(row);
	},

    createHandCardElement: function(card, index) {
        const cardElement = document.createElement('div');
        cardElement.className = `hand-card ${card.type} ${card.rarity}`;
        cardElement.dataset.cardId = card.id;
        cardElement.dataset.handIndex = index;
        
        const { mediaPath, isVideo } = this.getCardMediaPath(card);

        let mediaElement = isVideo ? 
            `<video class="hand-card-media" muted playsinline preload="metadata"><source src="${mediaPath}" type="video/mp4"></video>` :
            `<img src="${mediaPath}" alt="${card.name}" class="hand-card-media" onerror="this.src='card/placeholder.jpg'">`;

        let topRightElement = card.type === 'unit' ? 
            `<div class="hand-card-strength">${card.strength || 0}</div>` :
            `<div class="hand-card-type-icon"><img src="${this.getTypeIconPath(card.type)}" alt="${card.type}"></div>`;

        let positionElement = '';
        if (card.type === 'unit' && card.position) {
            let positions = [];
            if (Array.isArray(card.position)) {
                positions = card.position;
            } else {
                positions = [card.position];
            }
            
            const displayPosition = positions.length > 1 ? 'any' : positions[0];
            const positionIconPath = this.getPositionIconPath(displayPosition);
            
            positionElement = `
                <div class="hand-card-position">
                    <img src="${card.positionBanner || 'deck/position_banner.png'}" alt="Позиция" class="hand-card-position-banner">
                    <img src="${positionIconPath}" alt="${displayPosition}" class="hand-card-position-icon">
                </div>
            `;
            
            if (positions.length > 1) {
                cardElement.title = `Доступные ряды: ${positions.join(', ').replace(/-row/g, '')}`;
            }
        }

        cardElement.innerHTML = `
            <div class="hand-card-container">
                ${mediaElement}
                <img src="${card.border || 'deck/bord_bronze.png'}" alt="Рамка" class="hand-card-border">
                <img src="${card.banner || `faction/${card.faction}/banner_bronze.png`}" alt="Баннер" class="hand-card-banner">
                <div class="hand-card-name">${card.name || 'Неизвестная карта'}</div>
                ${topRightElement}
                ${positionElement}
            </div>
        `;

        this.setupHandCardEventListeners(cardElement, card);
        return cardElement;
    },

    createBoardCardElement: function(card, cardType) {
        const cardElement = document.createElement('div');
        cardElement.className = `board-card ${cardType} ${card.rarity}`;
        cardElement.dataset.cardId = card.id;
        
		cardElement.style.animation = 'cardAppear 0.5s ease-out';
		cardElement.addEventListener('animationend', function() {
			this.style.animation = '';
		});
	
        const { mediaPath, isVideo } = this.getCardMediaPath(card);

        let mediaElement = '';
        if (isVideo) {
            mediaElement = `
                <video class="board-card-media" muted playsinline preload="metadata">
                    <source src="${mediaPath}" type="video/mp4">
                </video>
            `;
        } else {
            mediaElement = `<img src="${mediaPath}" alt="${card.name}" class="board-card-media" onerror="this.src='card/placeholder.jpg'">`;
        }

        let topRightElement = '';
        if (card.strength) {
            topRightElement = `<div class="board-card-strength">${card.strength}</div>`;
        } else {
            const typeIconPath = this.getTypeIconPath(card.type);
            topRightElement = `
                <div class="board-card-type-icon">
                    <img src="${typeIconPath}" alt="${card.type}">
                </div>
            `;
        }

        let positionElement = '';
        if (card.type === 'unit' && card.position) {
            let positions = [];
            if (Array.isArray(card.position)) {
                positions = card.position;
            } else {
                positions = [card.position];
            }
            
            const displayPosition = positions.length > 1 ? 'any' : positions[0];
            const positionIconPath = this.getPositionIconPath(displayPosition);
            
            positionElement = `
                <div class="board-card-position">
                    <img src="${card.positionBanner || 'deck/position_banner.png'}" alt="Позиция" class="board-card-position-banner">
                    <img src="${positionIconPath}" alt="${displayPosition}" class="board-card-position-icon">
                </div>
            `;
        }

        cardElement.innerHTML = `
            <div class="board-card-container">
                ${mediaElement}
                <img src="${card.border || 'deck/bord_bronze.png'}" alt="Рамка" class="board-card-border">
                <img src="${card.banner || `faction/${card.faction}/banner_bronze.png`}" alt="Баннер" class="board-card-banner">
                <div class="board-card-name">${card.name || 'Неизвестная карта'}</div>
                ${topRightElement}
                ${positionElement}
            </div>
        `;

        cardElement.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            this.showCardModal(card);
        });

        cardElement.addEventListener('mouseenter', () => {
            audioManager.playSound('touch');
            
            const video = cardElement.querySelector('video');
            if (video) {
                video.currentTime = 0;
                video.play().catch(e => {});
                video.loop = true;
            }
        });

        cardElement.addEventListener('mouseleave', () => {
            const video = cardElement.querySelector('video');
            if (video) {
                video.pause();
                video.currentTime = 0;
                video.loop = false;
            }
        });

        return cardElement;
    },

    createWeatherCardElement: function(card, index) {
        const cardElement = document.createElement('div');
        cardElement.className = 'weather-card';
        cardElement.dataset.cardId = card.id;
        cardElement.dataset.weatherIndex = index;
        
        const { mediaPath, isVideo } = this.getCardMediaPath(card);

        let mediaElement = '';
        if (isVideo) {
            mediaElement = `
                <video class="weather-card-media" muted playsinline preload="metadata">
                    <source src="${mediaPath}" type="video/mp4">
                </video>
            `;
        } else {
            mediaElement = `<img src="${mediaPath}" alt="${card.name}" class="weather-card-media" onerror="this.src='card/placeholder.jpg'">`;
        }

        let topRightElement = '';
        if (card.strength) {
            topRightElement = `<div class="weather-card-strength">${card.strength}</div>`;
        } else {
            const typeIconPath = this.getTypeIconPath(card.type);
            topRightElement = `
                <div class="weather-card-type-icon">
                    <img src="${typeIconPath}" alt="${card.type}">
                </div>
            `;
        }

        cardElement.innerHTML = `
            <div class="weather-card-container">
                ${mediaElement}
                <img src="${card.border || 'deck/bord_bronze.png'}" alt="Рамка" class="weather-card-border">
                <img src="${card.banner || `faction/${card.faction}/banner_bronze.png`}" alt="Баннер" class="weather-card-banner">
                <div class="weather-card-name">${card.name || 'Неизвестная карта'}</div>
                ${topRightElement}
            </div>
        `;

        cardElement.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            this.showCardModal(card);
        });

        cardElement.addEventListener('click', () => {
            audioManager.playSound('touch');
        });

        cardElement.addEventListener('mouseenter', () => {
            audioManager.playSound('touch');
            
            const video = cardElement.querySelector('video');
            if (video) {
                video.currentTime = 0;
                video.play().catch(e => {});
                video.loop = true;
            }
        });

        cardElement.addEventListener('mouseleave', () => {
            const video = cardElement.querySelector('video');
            if (video) {
                video.pause();
                video.currentTime = 0;
                video.loop = false;
            }
        });

        return cardElement;
    },

    displayWeatherCards: function() {
        const weatherSlot = document.getElementById('weatherSlot');
        if (!weatherSlot) return;

        const opponentScoreDisplay = document.getElementById('opponentTotalScore');
        const playerScoreDisplay = document.getElementById('playerTotalScore');
        
        const weatherContainer = weatherSlot.querySelector('.weather-cards-container');
        if (weatherContainer) {
            weatherContainer.remove();
        }
        
        if (this.gameState.weather.cards.length > 0) {
            const newWeatherContainer = document.createElement('div');
            newWeatherContainer.className = 'weather-cards-container';
            
            const uniqueCards = [];
            const seenCardIds = new Set();
            
            this.gameState.weather.cards.forEach((card, index) => {
                if (!seenCardIds.has(card.id)) {
                    seenCardIds.add(card.id);
                    uniqueCards.push(card);
                    
                    const cardElement = this.createWeatherCardElement(card, index);
                    newWeatherContainer.appendChild(cardElement);
                }
            });

            weatherSlot.appendChild(newWeatherContainer);
        }
        
        if (!opponentScoreDisplay || !document.getElementById('opponentTotalScore')) {
            this.restoreScoreDisplays();
        }
        
        this.updateWeatherCounter();
    },

    restoreScoreDisplays: function() {
        const weatherSlot = document.getElementById('weatherSlot');
        if (!weatherSlot) return;
        
        if (!document.getElementById('opponentTotalScore')) {
            const opponentScoreDisplay = document.createElement('div');
            opponentScoreDisplay.id = 'opponentTotalScore';
            opponentScoreDisplay.className = 'total-score-display opponent-total-score';
            opponentScoreDisplay.style.cssText = `
                position: absolute;
                top: -80px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 100;
                text-align: center;
            `;
            
            opponentScoreDisplay.innerHTML = `
                <div class="score-background" style="
                    background: url('board/score.png') center/contain no-repeat;
                    width: 120px;
                    height: 60px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                ">
                    <div class="score-value" style="
                        color: #f44336;
                        font-size: 24px;
                        font-weight: bold;
                        font-family: 'Gwent', sans-serif;
                        text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
                        margin-top: 5px;
                    ">0</div>
                </div>
            `;
            
            weatherSlot.appendChild(opponentScoreDisplay);
        }
        
        if (!document.getElementById('playerTotalScore')) {
            const playerScoreDisplay = document.createElement('div');
            playerScoreDisplay.id = 'playerTotalScore';
            playerScoreDisplay.className = 'total-score-display player-total-score';
            playerScoreDisplay.style.cssText = `
                position: absolute;
                bottom: -80px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 100;
                text-align: center;
            `;
            
            playerScoreDisplay.innerHTML = `
                <div class="score-background" style="
                    background: url('board/score.png') center/contain no-repeat;
                    width: 120px;
                    height: 60px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                ">
                    <div class="score-value" style="
                        color: #4CAF50;
                        font-size: 24px;
                        font-weight: bold;
                        font-family: 'Gwent', sans-serif;
                        text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
                        margin-top: 5px;
                    ">0</div>
                </div>
            `;
            
            weatherSlot.appendChild(playerScoreDisplay);
        }
        
        this.updateTotalScoreDisplays();
    },

    updateTurnIndicator: function() {
        const turnElement = document.getElementById('currentTurn');
        const cardsCountElement = document.getElementById('cardsPlayedCount');
        const maxCardsElement = document.getElementById('maxCardsPerTurn');
        
        if (turnElement) {
            turnElement.textContent = this.gameState.currentPlayer === 'player' ? 'Ваш ход' : 'Ход противника';
        }
        
        if (cardsCountElement && maxCardsElement) {
            cardsCountElement.textContent = this.gameState.cardsPlayedThisTurn;
            maxCardsElement.textContent = this.gameState.maxCardsPerTurn;
        }
        
        this.updateRoundCounter();
        this.updateWinsIndicator();
    },

    updateRoundCounter: function() {
        const roundImage = document.getElementById('roundImage');
        if (!roundImage) return;
        
        const roundImages = {
            1: 'board/round1.png',
            2: 'board/round2.png', 
            3: 'board/round3.png'
        };
        
        roundImage.src = roundImages[this.gameState.currentRound] || 'board/round1.png';
        roundImage.alt = `Раунд ${this.gameState.currentRound}`;
        
        roundImage.style.animation = 'roundChange 0.5s ease-out';
        setTimeout(() => {
            roundImage.style.animation = '';
        }, 500);
    },

    updateWinsIndicator: function() {
        let winsIndicator = document.getElementById('winsIndicator');
        if (!winsIndicator) {
            winsIndicator = document.createElement('div');
            winsIndicator.id = 'winsIndicator';
            winsIndicator.className = 'wins-indicator';
            document.querySelector('.game-board').appendChild(winsIndicator);
        }
        
        const playerWins = this.gameState.roundsWon.player;
        const opponentWins = this.gameState.roundsWon.opponent;
        
        winsIndicator.innerHTML = '';
        
        for (let i = 0; i < 2; i++) {
            const winCircle = document.createElement('div');
            winCircle.className = 'win-circle';
            
            if (i < playerWins) {
                winCircle.classList.add('player');
            } else if (i < opponentWins) {
                winCircle.classList.add('opponent');
            } else {
                winCircle.classList.add('empty');
            }
            
            winsIndicator.appendChild(winCircle);
        }
    },

    loadPlayerDeck: function() {
        if (window.deckModule && window.deckModule.currentDeck) {
            const playerDeck = window.deckModule.currentDeck;
            this.gameState.player.deck = this.shuffleArray([...playerDeck.cards]);
            this.gameState.player.faction = playerDeck.faction;
            this.gameState.player.ability = playerDeck.ability;
        } else {
            this.loadDemoDeck('player');
        }
        
        this.displayPlayerDeck();
    },

    loadOpponentDeck: function() {
        const availableFactions = this.getAvailableFactions();
        if (availableFactions.length === 0) {
            availableFactions.push(...Object.values(window.factionModule?.factionsData || {}));
        }
        
        const randomFaction = availableFactions[Math.floor(Math.random() * availableFactions.length)];
        const factionCards = window.cardsModule?.getFactionCards(randomFaction.id);
        
        if (factionCards) {
            this.gameState.opponent.deck = this.createBalancedDeck(factionCards, randomFaction.id);
            this.gameState.opponent.faction = randomFaction.id;
            this.gameState.opponent.ability = this.getRandomFactionAbility(randomFaction.id);
        } else {
            this.loadDemoDeck('opponent');
        }
        
        this.displayOpponentDeck();
    },

    setupPlayerLeader: function() {
        const leaderSlot = document.getElementById('playerLeader');
        if (!leaderSlot) return;

        const faction = this.gameState.player.faction;
        const factionData = window.factionModule?.factionsData[faction];
        if (!factionData) return;

        const leaderCardData = {
            id: `${faction}_leader`,
            name: factionData.leaderName.split(' ')[0],
            namefull: factionData.leaderName,
            type: 'leader',
            faction: faction,
            image: `leader.mp4`, 
            imageStatic: `leader.jpg`,
            description: factionData.description,
            descriptionfull: factionData.descriptionfull,
            ability: `${faction}_ability`,
            rarity: 'gold',
            tags: ['leader'],
            border: 'deck/bord_gold.png',
            banner: `faction/${faction}/banner_gold.png`
        };

        this.gameState.player.leader = leaderCardData;
        leaderSlot.appendChild(this.createLeaderCardElement(leaderCardData, 'player'));
    },
    
    setupOpponentLeader: function() {
        const leaderSlot = document.getElementById('opponentLeader');
        if (!leaderSlot) return;

        const faction = this.gameState.opponent.faction;
        const factionData = window.factionModule?.factionsData[faction];
        if (!factionData) return;

        const leaderCardData = {
            id: `${faction}_leader_opponent`,
            name: factionData.leaderName.split(' ')[0],
            namefull: factionData.leaderName,
            type: 'leader',
            faction: faction,
            image: `leader.mp4`,
            imageStatic: `leader.jpg`,
            description: factionData.description,
            descriptionfull: factionData.descriptionfull,
            ability: `${faction}_ability`,
            rarity: 'gold',
            tags: ['leader'],
            border: 'deck/bord_gold.png',
            banner: `faction/${faction}/banner_gold.png`
        };

        this.gameState.opponent.leader = leaderCardData;
        leaderSlot.appendChild(this.createLeaderCardElement(leaderCardData, 'opponent'));
    },
    
    dealInitialHands: function() {
        const handSize = this.gameState.gameSettings.initialHandSize;
        
        this.shuffleDeck('player');
        this.shuffleDeck('opponent');
        
        this.gameState.player.hand = this.gameState.player.deck.splice(0, 
            Math.min(handSize, this.gameState.player.deck.length));
        this.gameState.opponent.hand = this.gameState.opponent.deck.splice(0, 
            Math.min(handSize, this.gameState.opponent.deck.length));

        this.displayPlayerHand();
        this.displayPlayerDeck();
        this.displayOpponentDeck();
    },
    
    shuffleDeck: function(player) {
        const deck = this.gameState[player].deck;
        
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        
        return deck;
    },

    getAvailableFactions: function() {
        const allFactions = Object.values(window.factionModule?.factionsData || {});
        const playerFaction = this.gameState.player.faction;
        return playerFaction ? allFactions.filter(faction => faction.id !== playerFaction) : allFactions;
    },

    createBalancedDeck: function(factionCards, factionId) {
    const deck = [];
    
    // Получаем все карты фракции
    const unitCards = [...(factionCards.units || [])];
    const specialCards = [...(factionCards.specials || [])];
    const artifactCards = [...(factionCards.artifacts || [])];
    const tacticCards = [...(factionCards.tactics || [])];
    
    // Получаем нейтральные карты
    const neutralCards = window.cardsModule?.getFactionCards('neutral') || {};
    const neutralUnits = [...(neutralCards.units || [])];
    const neutralSpecials = [...(neutralCards.specials || [])];
    const neutralArtifacts = [...(neutralCards.artifacts || [])];
    const neutralTactics = [...(neutralCards.tactics || [])];
    
    // Объединяем карты по типам
    const allUnits = [...unitCards, ...neutralUnits];
    const allSpecials = [...specialCards, ...neutralSpecials];
    const allArtifacts = [...artifactCards, ...neutralArtifacts];
    const allTactics = [...tacticCards, ...neutralTactics];
    
    // Все специальные карты (спешлы, артефакты, тактики)
    const allSpecialCards = [...allSpecials, ...allArtifacts, ...allTactics];
    
    // Определяем параметры колоды (как в validateDeckAndStartGame)
    const minDeckSize = 15;
    const maxDeckSize = 25;
    const minUnits = 10;
    const minSpecials = 3;
    const maxSpecials = 5;
    
    // 1. Выбираем специальные карты (от 3 до 5)
    const specialCount = minSpecials + Math.floor(Math.random() * (maxSpecials - minSpecials + 1));
    const selectedSpecials = [];
    
    // Сначала пытаемся выбрать карты из фракции
    const factionSpecials = [...specialCards, ...artifactCards, ...tacticCards];
    const availableSpecials = [...factionSpecials, ...allSpecialCards];
    
    // Удаляем дубликаты по ID
    const uniqueSpecials = [];
    const seenIds = new Set();
    
    availableSpecials.forEach(card => {
        if (!seenIds.has(card.id)) {
            seenIds.add(card.id);
            uniqueSpecials.push(card);
        }
    });
    
    // Перемешиваем и выбираем специальные карты
    this.shuffleArray(uniqueSpecials);
    for (let i = 0; i < Math.min(specialCount, uniqueSpecials.length); i++) {
        selectedSpecials.push(uniqueSpecials[i]);
        deck.push(uniqueSpecials[i]);
    }
    
    // 2. Выбираем юнитов (минимум 10)
    const selectedUnits = [];
    const availableUnits = [...allUnits];
    
    // Удаляем дубликаты по ID
    const uniqueUnits = [];
    seenIds.clear();
    
    availableUnits.forEach(card => {
        if (!seenIds.has(card.id)) {
            seenIds.add(card.id);
            uniqueUnits.push(card);
        }
    });
    
    // Перемешиваем и выбираем юнитов
    this.shuffleArray(uniqueUnits);
    
    // Минимум 10 юнитов, максимум до заполнения колоды до 25 карт
    const maxUnits = maxDeckSize - selectedSpecials.length;
    const unitsNeeded = Math.max(minUnits, Math.min(uniqueUnits.length, maxUnits));
    
    // Если не хватает уникальных юнитов, допускаем дубли
    if (uniqueUnits.length < unitsNeeded) {
        // Собираем все доступные юниты (включая дубли)
        const allAvailableUnits = [...allUnits];
        this.shuffleArray(allAvailableUnits);
        
        for (let i = 0; i < unitsNeeded; i++) {
            const card = allAvailableUnits[i % allAvailableUnits.length];
            selectedUnits.push(card);
            deck.push(card);
        }
    } else {
        for (let i = 0; i < unitsNeeded; i++) {
            selectedUnits.push(uniqueUnits[i]);
            deck.push(uniqueUnits[i]);
        }
    }
    
    // 3. Проверяем размер колоды
    const currentDeckSize = deck.length;
    
    // Если колода меньше минимального размера, добавляем еще карт
    if (currentDeckSize < minDeckSize) {
        const cardsNeeded = minDeckSize - currentDeckSize;
        const allCards = [...allUnits, ...allSpecialCards];
        this.shuffleArray(allCards);
        
        const addedCardIds = new Set(deck.map(card => card.id));
        let added = 0;
        
        for (const card of allCards) {
            if (added >= cardsNeeded) break;
            if (!addedCardIds.has(card.id)) {
                deck.push(card);
                addedCardIds.add(card.id);
                added++;
            }
        }
        
        // Если все еще не хватает карт, добавляем любые
        if (added < cardsNeeded) {
            for (let i = 0; i < cardsNeeded - added; i++) {
                const randomCard = allCards[i % allCards.length];
                deck.push({...randomCard, id: `${randomCard.id}_copy_${i}`});
            }
        }
    }
    
    // 4. Если колода больше максимального размера, обрезаем до 25
    if (deck.length > maxDeckSize) {
        // Сначала оставляем все специальные карты (они важнее)
        const specialsInDeck = deck.filter(card => 
            card.type === 'special' || card.type === 'artifact' || card.type === 'tactic'
        );
        const unitsInDeck = deck.filter(card => card.type === 'unit');
        
        deck.length = 0;
        
        // Добавляем специальные карты
        specialsInDeck.forEach(card => deck.push(card));
        
        // Добавляем юнитов до максимального размера
        const remainingSlots = maxDeckSize - deck.length;
        for (let i = 0; i < Math.min(remainingSlots, unitsInDeck.length); i++) {
            deck.push(unitsInDeck[i]);
        }
    }
    
    // 5. Проверяем соблюдение всех ограничений
    const finalUnitCount = deck.filter(card => card.type === 'unit').length;
    const finalSpecialCount = deck.filter(card => 
        card.type === 'special' || card.type === 'artifact' || card.type === 'tactic'
    ).length;
    
    // Если не хватает юнитов, пытаемся исправить
    if (finalUnitCount < minUnits) {
        const neededUnits = minUnits - finalUnitCount;
        const allAvailableUnits = [...allUnits];
        this.shuffleArray(allAvailableUnits);
        
        const deckCardIds = new Set(deck.map(card => card.id));
        let added = 0;
        
        // Удаляем лишние специальные карты (если они превышают минимум)
        const excessSpecials = finalSpecialCount - minSpecials;
        if (excessSpecials > 0) {
            for (let i = 0; i < excessSpecials; i++) {
                const specialIndex = deck.findIndex(card => 
                    card.type === 'special' || card.type === 'artifact' || card.type === 'tactic'
                );
                if (specialIndex !== -1) {
                    deck.splice(specialIndex, 1);
                }
            }
        }
        
        // Добавляем недостающих юнитов
        for (const unit of allAvailableUnits) {
            if (added >= neededUnits) break;
            if (!deckCardIds.has(unit.id)) {
                deck.push(unit);
                added++;
            }
        }
    }
    
    // 6. Финальная проверка и фикс если нужно
    const finalCheck = () => {
        const total = deck.length;
        const units = deck.filter(card => card.type === 'unit').length;
        const specials = deck.filter(card => 
            card.type === 'special' || card.type === 'artifact' || card.type === 'tactic'
        ).length;
        
        return {
            valid: total >= minDeckSize && total <= maxDeckSize && 
                   units >= minUnits && 
                   specials >= minSpecials && specials <= maxSpecials,
            total,
            units,
            specials
        };
    };
    
    let check = finalCheck();
    let attempts = 0;
    const maxAttempts = 10;
    
    // Попытки исправить колоду
    while (!check.valid && attempts < maxAttempts) {
        attempts++;
        
        if (check.total < minDeckSize) {
            // Добавляем случайные карты
            const allCards = [...allUnits, ...allSpecialCards];
            this.shuffleArray(allCards);
            
            const deckCardIds = new Set(deck.map(card => card.id));
            const needed = minDeckSize - check.total;
            let added = 0;
            
            for (const card of allCards) {
                if (added >= needed) break;
                if (!deckCardIds.has(card.id)) {
                    deck.push(card);
                    added++;
                }
            }
        } else if (check.total > maxDeckSize) {
            // Удаляем лишние карты, начиная с дубликатов
            const cardCounts = {};
            deck.forEach(card => {
                cardCounts[card.id] = (cardCounts[card.id] || 0) + 1;
            });
            
            // Сортируем карты по количеству дубликатов
            deck.sort((a, b) => {
                const countA = cardCounts[a.id];
                const countB = cardCounts[b.id];
                if (countA > countB) return -1;
                if (countA < countB) return 1;
                return 0;
            });
            
            // Удаляем дубликаты пока не достигнем нужного размера
            while (deck.length > maxDeckSize) {
                deck.pop();
            }
        }
        
        // Проверяем количество юнитов и специальных карт
        check = finalCheck();
    }
    
    // 7. Перемешиваем финальную колоду
    this.shuffleArray(deck);
    
    console.log(`Колода AI создана: ${deck.length} карт, ${check.units} юнитов, ${check.specials} специальных`);
    
    return deck;
},

    getRandomFactionAbility: function(factionId) {
        const abilities = window.deckModule?.factionAbilities?.[factionId];
        return abilities && abilities.length > 0 ? 
            abilities[Math.floor(Math.random() * abilities.length)].id : 'default_ability';
    },

    shuffleArray: function(array) {
        if (!array || array.length === 0) return array;
        
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        return shuffled;
    },

    displayPlayerDeck: function() {
        const deckSlot = document.getElementById('playerDeck');
        if (!deckSlot) return;

        deckSlot.innerHTML = '';

        const deckElement = document.createElement('div');
        deckElement.className = 'deck-visual';
        
        const faction = this.gameState.player.faction;
        const cardBackPath = `faction/${faction}/card.png`;
        
        deckElement.innerHTML = `
            <div class="deck-stack">
                <img src="${cardBackPath}" alt="Колода игрока" class="deck-card-back"
                     onerror="this.src='faction/neutral/cardpng'">
                <div class="deck-count">${this.gameState.player.deck.length}</div>
            </div>
        `;

        deckSlot.appendChild(deckElement);
    },

    displayOpponentDeck: function() {
        const deckSlot = document.getElementById('opponentDeck');
        if (!deckSlot) return;

        deckSlot.innerHTML = `
            <div class="deck-visual opponent-deck">
                <div class="deck-stack">
                    <img src="faction/${this.gameState.opponent.faction}/card.png" 
                         alt="Колода противника" class="deck-card-back opponent-card-back"
                     onerror="this.src='faction/neutral/card.png'">
                    <div class="deck-count opponent-deck-count">${this.gameState.opponent.deck.length}</div>
                </div>
            </div>
        `;
    },

    displayPlayerDiscard: function() {
        const discardSlot = document.getElementById('playerDiscard');
        if (!discardSlot) return;

        discardSlot.innerHTML = '';

        const discardElement = document.createElement('div');
        discardElement.className = 'discard-visual';
        
        const faction = this.gameState.player.faction;
        const cardBackPath = `board/discard.jpg`;
        
        discardElement.innerHTML = `
            <div class="discard-stack">
                <img src="${cardBackPath}" alt="Сброс игрока" class="discard-card-back"
                     onerror="this.src='board/discard.jpg'">
                <div class="discard-count">${this.gameState.player.discard.length}</div>
            </div>
        `;

        discardSlot.appendChild(discardElement);
    },

    displayOpponentDiscard: function() {
        const discardSlot = document.getElementById('opponentDiscard');
        if (!discardSlot) return;

        discardSlot.innerHTML = '';

        const discardElement = document.createElement('div');
        discardElement.className = 'discard-visual opponent-discard';
        
        const faction = this.gameState.opponent.faction;
        const cardBackPath = `board/discard.jpg`;
        
        discardElement.innerHTML = `
            <div class="discard-stack">
                <img src="${cardBackPath}" alt="Сброс противника" class="discard-card-back opponent-discard-back"
                     onerror="this.src='board/discard.jpg'">
                <div class="discard-count opponent-discard-count">${this.gameState.opponent.discard.length}</div>
            </div>
        `;

        discardSlot.appendChild(discardElement);
    },

    createLeaderCardElement: function(leaderData, owner) {
        const leaderElement = document.createElement('div');
        leaderElement.className = `leader-card-on-board ${owner === 'opponent' ? 'opponent-leader' : ''}`;
        leaderElement.dataset.cardId = leaderData.id;
        
        const cardDisplayMode = this.currentSettings.cardDisplayMode;
        
        let mediaPath;
        let isVideo;
        
        if (cardDisplayMode === 'static' && leaderData.imageStatic) {
            mediaPath = `faction/${leaderData.faction}/${leaderData.imageStatic}`;
            isVideo = false;
        } else {
            mediaPath = `faction/${leaderData.faction}/${leaderData.image}`;
            isVideo = leaderData.image.endsWith('.mp4');
        }
        
        let mediaElement = '';
        if (isVideo) {
            mediaElement = `
                <video class="leader-card-media ${owner === 'opponent' ? 'opponent-leader-media' : ''}" 
                       autoplay loop muted playsinline>
                    <source src="${mediaPath}" type="video/mp4">
                </video>
            `;
        } else {
            mediaElement = `<img src="${mediaPath}" alt="${leaderData.name}" class="leader-card-media ${owner === 'opponent' ? 'opponent-leader-media' : ''}" onerror="this.onerror=null; this.src='faction/${leaderData.faction}/leader.jpg'">`;
        }

        leaderElement.innerHTML = `
            <div class="leader-card-container ${owner === 'opponent' ? 'opponent-leader-container' : ''}">
                ${mediaElement}
                <img src="${leaderData.border}" alt="Рамка" class="leader-card-border">
                <img src="${leaderData.banner}" alt="Баннер" class="leader-card-banner">
                <div class="leader-card-name ${owner === 'opponent' ? 'opponent-leader-name' : ''}">${leaderData.name}</div>
            </div>
        `;

        this.setupLeaderCardEventListeners(leaderElement, leaderData);
        return leaderElement;
    },

    updateCardDisplay: function(card, row, player) {
        const rowElement = document.getElementById(`${player}${this.capitalizeFirst(row)}Row`);
        if (!rowElement) return;
        
        const existingCard = rowElement.querySelector(`[data-card-id="${card.id}"]`);
        if (existingCard) {
            existingCard.remove();
        }
        
        const newCardElement = player === 'player' ? 
            this.createBoardCardElement(card, 'unit') : 
            this.createOpponentBoardCardElement(card);
            
        rowElement.appendChild(newCardElement);
    },

    createOpponentBoardCardElement: function(card) {
        const cardElement = document.createElement('div');
        cardElement.className = `board-card opponent-card ${card.type} ${card.rarity}`;
        cardElement.dataset.cardId = card.id;
        
        const { mediaPath, isVideo } = this.getCardMediaPath(card);

        let mediaElement = isVideo ? 
            `<video class="board-card-media" muted playsinline preload="metadata"><source src="${mediaPath}" type="video/mp4"></video>` :
            `<img src="${mediaPath}" alt="${card.name}" class="board-card-media" onerror="this.src='card/placeholder.jpg'">`;

        let topRightElement = card.strength ? 
            `<div class="board-card-strength">${card.strength}</div>` :
            `<div class="board-card-type-icon"><img src="${this.getTypeIconPath(card.type)}" alt="${card.type}"></div>`;

        let positionElement = '';
        if (card.type === 'unit' && card.position) {
            let positions = [];
            if (Array.isArray(card.position)) {
                positions = card.position;
            } else {
                positions = [card.position];
            }
            
            const displayPosition = positions.length > 1 ? 'any' : positions[0];
            const positionIconPath = this.getPositionIconPath(displayPosition);
            
            positionElement = `
                <div class="board-card-position">
                    <img src="${card.positionBanner || 'deck/position_banner.png'}" alt="Позиция" class="board-card-position-banner">
                    <img src="${positionIconPath}" alt="${displayPosition}" class="board-card-position-icon">
                </div>
            `;
        }

        cardElement.innerHTML = `
            <div class="board-card-container">
                ${mediaElement}
                <img src="${card.border || 'deck/bord_bronze.png'}" alt="Рамка" class="board-card-border">
                <img src="${card.banner || `faction/${card.faction}/banner_bronze.png`}" alt="Баннер" class="board-card-banner">
                <div class="board-card-name">${card.name || 'Неизвестная карта'}</div>
                ${topRightElement}
                ${positionElement}
            </div>
        `;

        cardElement.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            this.showCardModal(card);
        });

        cardElement.addEventListener('mouseenter', () => {
            audioManager.playSound('touch');
            
            const video = cardElement.querySelector('video');
            if (video) {
                video.currentTime = 0;
                video.play().catch(e => {});
                video.loop = true;
            }
        });

        cardElement.addEventListener('mouseleave', () => {
            const video = cardElement.querySelector('video');
            if (video) {
                video.pause();
                video.currentTime = 0;
                video.loop = false;
            }
        });

        cardElement.style.animation = 'cardAppear 0.5s ease-out';

        return cardElement;
    },

    displayOpponentCardOnRow: function(row, card) {
        const rowElement = document.getElementById(`opponent${this.capitalizeFirst(row)}Row`);
        if (!rowElement) {
            return;
        }

        const cardElement = this.createOpponentBoardCardElement(card);
        rowElement.appendChild(cardElement);
    },

    displayOpponentTacticCard: function(row, card) {
        const tacticSlot = document.getElementById(`opponent${this.capitalizeFirst(row)}Tactics`);
        if (!tacticSlot) {
            return;
        }

        tacticSlot.innerHTML = '';
        const cardElement = this.createOpponentBoardCardElement(card);
        tacticSlot.appendChild(cardElement);
    },

    updateOpponentRowStrength: function(row) {
        const rowState = this.gameState.opponent.rows[row];
        const totalStrength = rowState.cards.reduce((sum, card) => sum + (card.strength || 0), 0);
        rowState.strength = totalStrength;
        
        const strengthElement = document.getElementById(`opponent${this.capitalizeFirst(row)}Strength`);
        if (strengthElement) {
            strengthElement.textContent = totalStrength;
            strengthElement.classList.add('strength-update');
            setTimeout(() => strengthElement.classList.remove('strength-update'), 500);
        }
    },

    setupEventListeners: function() {
        const passBtn = document.getElementById('passBtn');
        const endTurnBtn = document.getElementById('endTurnBtn');

        if (passBtn) {
            passBtn.addEventListener('click', () => {
                if (window.playerModule && window.playerModule.handlePass) {
                    window.playerModule.handlePass();
                }
            });
            passBtn.addEventListener('mouseenter', () => audioManager.playSound('touch'));
        }

        if (endTurnBtn) {
            endTurnBtn.addEventListener('click', () => {
                if (window.playerModule && window.playerModule.handleEndTurn) {
                    window.playerModule.handleEndTurn();
                }
            });
            endTurnBtn.addEventListener('mouseenter', () => audioManager.playSound('touch'));
        }

        this.setupDeckViewEventListeners();
    },

    setupDeckViewEventListeners: function() {
        const playerDeck = document.getElementById('playerDeck');
        if (playerDeck) {
            playerDeck.addEventListener('click', () => {
                if (this.gameState.player.deck.length > 0) {
                    this.showDeckModal('player', 'deck', 'Колода');
                }
            });
            playerDeck.addEventListener('mouseenter', () => audioManager.playSound('touch'));
        }

        const playerDiscard = document.getElementById('playerDiscard');
        if (playerDiscard) {
            playerDiscard.addEventListener('click', () => {
                if (this.gameState.player.discard.length > 0) {
                    this.showDeckModal('player', 'discard', 'Сброс');
                }
            });
            playerDiscard.addEventListener('mouseenter', () => audioManager.playSound('touch'));
        }

        const opponentDiscard = document.getElementById('opponentDiscard');
        if (opponentDiscard) {
            opponentDiscard.addEventListener('click', () => {
                if (this.gameState.opponent.discard.length > 0) {
                    this.showDeckModal('opponent', 'discard', 'Сброс противника');
                }
            });
            opponentDiscard.addEventListener('mouseenter', () => audioManager.playSound('touch'));
        }
    },

    setupHandCardEventListeners: function(cardElement, card) {
        cardElement.addEventListener('click', (event) => {
            if (event.button === 0 && this.gameState.gamePhase === 'playerTurn') {
                if (window.playerModule && window.playerModule.handleCardSelection) {
                    window.playerModule.handleCardSelection(card, cardElement);
                }
            }
        });

        cardElement.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            this.showCardModal(card);
        });

        const video = cardElement.querySelector('video');
        if (video) {
            cardElement.addEventListener('mouseenter', () => {
                video.currentTime = 0;
                video.play().catch(e => {});
                video.loop = true;
            });

            cardElement.addEventListener('mouseleave', () => {
                video.pause();
                video.currentTime = 0;
            });
        }

        cardElement.addEventListener('mouseenter', () => {
            audioManager.playSound('touch');
        });
    },

    setupLeaderCardEventListeners: function(leaderElement, leaderData) {
        leaderElement.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            this.showCardModal(leaderData);
        });

        leaderElement.addEventListener('mouseenter', () => {
            audioManager.playSound('touch');
        });
    },

    sortDeckCards: function(cards) {
        return cards.slice().sort((a, b) => {
            if (a.strength && b.strength) {
                return a.strength - b.strength;
            }
            if (a.strength && !b.strength) {
                return -1;
            }
            if (!a.strength && b.strength) {
                return 1;
            }
            return 0;
        });
    },

    generateDeckCardsHTML: function(cards, isModal = false) {
        return cards.map(card => {
            let mediaPath;
            let isVideo;
            
            if (isModal) {
                const isClassicMode = this.gameState.gameSettings.mode === 'classic';
                const isStaticInModal = isClassicMode ? true : this.currentSettings.cardDisplayMode === 'static';
                const hasStaticImage = card.image && card.image.includes('.mp4') && card.imageStatic;
                
                if (isStaticInModal && hasStaticImage) {
                    mediaPath = `card/${card.faction}/${card.imageStatic || card.image.replace('.mp4', '.jpg')}`;
                    isVideo = false;
                } else {
                    const { mediaPath: normalPath, isVideo: normalIsVideo } = this.getCardMediaPath(card);
                    mediaPath = normalPath;
                    isVideo = normalIsVideo;
                }
            } else {
                const { mediaPath: normalPath, isVideo: normalIsVideo } = this.getCardMediaPath(card);
                mediaPath = normalPath;
                isVideo = normalIsVideo;
            }
            
            let mediaElement = isVideo ? 
                `<video class="deck-card__media" muted playsinline preload="metadata"><source src="${mediaPath}" type="video/mp4"></video>` :
                `<img src="${mediaPath}" alt="${card.name}" class="deck-card__media" onerror="this.onerror=null; this.src='card/placeholder.jpg'">`;

            let strengthElement = card.strength ? 
                `<div class="deck-card__strength">${card.strength}</div>` : '';

            let typeIconElement = !card.strength ? 
                `<div class="deck-card__type-icon"><img src="${this.getTypeIconPath(card.type)}" alt="${card.type}"></div>` : '';

            let positionElement = '';
            if (card.type === 'unit' && card.position) {
                let positions = [];
                if (Array.isArray(card.position)) {
                    positions = card.position;
                } else {
                    positions = [card.position];
                }
                
                const displayPosition = positions.length > 1 ? 'any' : positions[0];
                const positionIconPath = this.getPositionIconPath(displayPosition);
                
                positionElement = `
                    <div class="deck-card__position">
                        <img src="${card.positionBanner || 'deck/position_banner.png'}" alt="Позиция" class="deck-card__position-banner">
                        <img src="${positionIconPath}" alt="${displayPosition}" class="deck-card__position-icon">
                    </div>
                `;
            }

            return `
                <div class="deck-card" data-card-id="${card.id}">
                    <div class="deck-card__container">
                        ${mediaElement}
                        <img src="${card.border || 'deck/bord_bronze.png'}" alt="Рамка" class="deck-card__border">
                        <img src="${card.banner || `faction/${card.faction}/banner_bronze.png`}" alt="Баннер" class="deck-card__banner">
                        <div class="deck-card__name">${card.name}</div>
                        ${strengthElement}
                        ${typeIconElement}
                        ${positionElement} 
                    </div>
                </div>
            `;
        }).join('');
    },

    updateDiscardDisplay: function(player) {
        if (player === 'player') {
            this.displayPlayerDiscard();
        } else {
            this.displayOpponentDiscard();
        }
    },

    isWeatherCard: function(card) {
        return (card.tags && card.tags.includes('weather')) || 
               (card.type === 'special' && this.isWeatherCardByName(card.name));
    },

    isWeatherCardByName: function(cardName) {
        const weatherCardNames = [
            'Проливной дождь', 'Трескучий мороз', 'Густой туман', 'Чистое небо',
            'Белый Хлад', 'Шторм Скеллиге'
        ];
        return weatherCardNames.includes(cardName);
    },

    applyVisualWeatherEffect: function(row, image) {
        this.removeVisualWeatherEffect(row);
        
        const playerRowElement = document.getElementById(`player${this.capitalizeFirst(row)}Row`);
        const opponentRowElement = document.getElementById(`opponent${this.capitalizeFirst(row)}Row`);
        
        [playerRowElement, opponentRowElement].forEach(rowElement => {
            if (rowElement) {
                const weatherOverlay = document.createElement('div');
                weatherOverlay.className = 'weather-effect-overlay';
                weatherOverlay.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: url('${image}') center/cover;
                    pointer-events: none;
                    z-index: 5;
                `;
                weatherOverlay.dataset.weatherRow = row;
                weatherOverlay.dataset.weatherSide = rowElement.id.startsWith('player') ? 'player' : 'opponent';
                rowElement.style.position = 'relative';
                rowElement.appendChild(weatherOverlay);
            }
        });
    },

    removeVisualWeatherEffect: function(row) {
        const playerEffects = document.querySelectorAll(`[data-weather-row="${row}"][data-weather-side="player"]`);
        playerEffects.forEach(effect => effect.remove());
        
        const opponentEffects = document.querySelectorAll(`[data-weather-row="${row}"][data-weather-side="opponent"]`);
        opponentEffects.forEach(effect => effect.remove());
    },

    updateCardStrengthDisplay: function(card, row, player) {
		const rowElement = document.getElementById(`${player}${this.capitalizeFirst(row)}Row`);
		if (!rowElement) return;
		
		const cardElement = rowElement.querySelector(`[data-card-id="${card.id}"]`);
		if (cardElement) {
			const strengthElement = cardElement.querySelector('.board-card-strength');
			if (strengthElement) {
				// Определяем какое значение силы показывать
				let displayValue;
				let isDamaged = false;
				
				// Если есть displayStrength (урон)
				if (card._displayStrength !== undefined) {
					displayValue = card._displayStrength;
					// Проверяем, была ли карта повреждена
					if (card.originalStrength !== undefined && card._displayStrength < card.originalStrength) {
						isDamaged = true;
					}
				}
				// Иначе оригинальную силу
				else {
					displayValue = card.strength || 0;
				}
				
				strengthElement.textContent = displayValue;
				
				// Визуальное выделение для поврежденных карт
				if (isDamaged) {
					cardElement.dataset.strengthReduced = 'true';
					strengthElement.style.color = '#ff4444';
					strengthElement.style.animation = 'strengthReduced 2s infinite';
				} else {
					cardElement.dataset.strengthReduced = 'false';
					strengthElement.style.color = 'white';
					strengthElement.style.animation = 'none';
				}
			}
		}
	},

    updateWeatherCounter: function() {
        const weatherCount = this.gameState.weather.cards.length;
        const maxWeather = this.gameState.weather.maxWeatherCards;
    },

    showBasicCardModal: function(card) {
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'card-modal-overlay';
        modalOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        modalOverlay.innerHTML = `
            <div style="
                background: linear-gradient(145deg, #1a1a1a, #2a2a2a);
                border: 3px solid #d4af37;
                border-radius: 15px;
                padding: 20px;
                color: white;
                max-width: 400px;
                text-align: center;
            ">
                <h3 style="color: #d4af37; margin-bottom: 10px;">${card.name}</h3>
                <p>${card.description || 'Описание отсутствует'}</p>
                ${card.strength ? `<p><strong>Сила:</strong> ${card.strength}</p>` : ''}
                <button onclick="this.closest('.card-modal-overlay').remove(); audioManager.playSound('button');" 
                        style="
                            background: #d4af37;
                            color: black;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 5px;
                            cursor: pointer;
                            margin-top: 10px;
                        ">ЗАКРЫТЬ</button>
            </div>
        `;

        document.body.appendChild(modalOverlay);
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                document.body.removeChild(modalOverlay);
                audioManager.playSound('button');
            }
        });
    },

    showDeckModal: function(player, deckType, title) {
        const cards = this.gameState[player][deckType];
        
        if (cards.length === 0) {
            return;
        }

        const faction = this.gameState[player].faction;
        const factionBackground = `faction/${faction}/border_faction.png`;
        const sortedCards = this.sortDeckCards(cards);

        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'deck-modal-overlay';
        modalOverlay.innerHTML = `
            <div class="deck-modal">
                <div class="deck-modal__header" style="background: url('${factionBackground}') center/cover;">
                    <div class="deck-modal__title">${title}</div>
                    <div class="deck-modal__count">Карт: ${sortedCards.length}</div>
                    <button class="deck-modal__close">&times;</button>
                </div>
                <div class="deck-modal__content" id="deckModalContent">
                    ${this.generateDeckCardsHTML(sortedCards, true)}
                </div>
            </div>
        `;

        document.body.appendChild(modalOverlay);
        this.setupDeckModalEventListeners(modalOverlay, sortedCards);
        
        setTimeout(() => {
            modalOverlay.classList.add('active');
        }, 10);
        
        audioManager.playSound('button');
    },

    setupDeckModalEventListeners: function(modalOverlay, cards) {
        const closeBtn = modalOverlay.querySelector('.deck-modal__close');
        closeBtn.addEventListener('click', () => {
            this.closeDeckModal(modalOverlay);
        });

        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                this.closeDeckModal(modalOverlay);
            }
        });

        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeDeckModal(modalOverlay);
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);

        const cardElements = modalOverlay.querySelectorAll('.deck-card');
        cardElements.forEach(cardElement => {
            const cardId = cardElement.dataset.cardId;
            const card = cards.find(c => c.id === cardId);
            
            if (card) {
                const isCDPRedMode = this.gameState.gameSettings.mode === 'cdpred';
                const video = cardElement.querySelector('video');
                
                if (video && isCDPRedMode) {
                    cardElement.addEventListener('mouseenter', () => {
                        video.currentTime = 0;
                        video.play().catch(e => {});
                        video.loop = true;
                    });

                    cardElement.addEventListener('mouseleave', () => {
                        video.pause();
                        video.currentTime = 0;
                        video.loop = false;
                    });
                } else if (video) {
                    video.controls = false;
                    video.muted = true;
                    video.loop = false;
                }
                
                cardElement.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showCardModal(card);
                });

                cardElement.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.showCardModal(card);
                });

                cardElement.addEventListener('mouseenter', () => {
                    audioManager.playSound('touch');
                });
            }
        });

        modalOverlay.escapeHandler = escapeHandler;
    },

    closeDeckModal: function(modalOverlay) {
        modalOverlay.classList.remove('active');
        
        if (modalOverlay.escapeHandler) {
            document.removeEventListener('keydown', modalOverlay.escapeHandler);
        }
        
        setTimeout(() => {
            if (modalOverlay.parentNode) {
                modalOverlay.parentNode.removeChild(modalOverlay);
            }
        }, 300);
        
        audioManager.playSound('button');
    },

    showCardModal: function(card) {
		if (window.deckModule && typeof window.showCardModal === 'function') {
			const cardForModal = { ...card };
			
			// Показываем оригинальную силу для всех карт
			if (card.originalStrength !== undefined) {
				cardForModal.strength = card.originalStrength;
				cardForModal.showOriginalStrength = true;
			} else if (card._displayStrength !== undefined) {
				cardForModal.strength = card._displayStrength;
			}
			
			window.showCardModal(cardForModal);
		} else {
			this.showBasicCardModal(card);
		}
		audioManager.playSound('button');
	},

    showRoundResult: function(winner, playerScore, opponentScore) {
		if (window.audioManager && window.audioManager.playSound) {
			if (winner === 'player') {
				audioManager.playSound('win');
			} else if (winner === 'opponent') {
				audioManager.playSound('lose');
			} else {
				audioManager.playSound('draw');
			}
		}
		
		if (!this.gameState.roundResults) {
			this.gameState.roundResults = [];
		}
		this.gameState.roundResults.push(winner);
		
		const resultOverlay = document.createElement('div');
		resultOverlay.className = 'round-result-overlay';
		resultOverlay.style.cssText = `
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: rgba(0, 0, 0, 0.9);
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			z-index: 10000;
			font-family: 'Gwent', sans-serif;
		`;

		let resultImage, resultText, resultColor, borderColor;
		
		if (winner === 'player') {
			resultImage = 'board/win.png';
			resultText = 'ПОБЕДА В РАУНДЕ';
			resultColor = '#4CAF50';
			borderColor = '#4CAF50';
		} else if (winner === 'opponent') {
			resultImage = 'board/lose.png';
			resultText = 'ПОРАЖЕНИЕ В РАУНДЕ';
			resultColor = '#f44336';
			borderColor = '#f44336';
		} else {
			resultImage = 'board/draw.png';
			resultText = 'НИЧЬЯ В РАУНДЕ';
			resultColor = '#FFD700';
			borderColor = '#FFD700';
		}

		resultOverlay.innerHTML = `
			<div class="round-result-container" style="
				text-align: center;
				overflow: hidden;
				margin-top: -100px;
			">
				
				<img src="${resultImage}" alt="${resultText}" style="
					width: 400px;
					height: 300px;
					margin-bottom: 20px;
					filter: drop-shadow(0 0 10px ${resultColor}80);
				" onerror="this.style.display='none'">
				
				<h2 style="
					color: ${resultColor};
					margin: 0 0 20px 0;
					font-size: 35px;
					text-transform: uppercase;
					letter-spacing: 3px;
					text-shadow: 0 2px 10px rgba(0,0,0,0.5);
					-webkit-text-stroke: 0.2px black;
				">${resultText}</h2>
				
				<div class="rounds-progress" style="
					display: flex;
					justify-content: center;
					gap: 8px;
					margin: 20px 0;
				">
					${this.generateRoundsProgress()}
				</div>
				
				<div class="round-info" style="
					color: #888;
					font-size: 14px;
					margin: 10px 0;
					text-transform: uppercase;
					letter-spacing: 1px;
				">
					Раунд ${this.gameState.currentRound} завершен
				</div>
				
				<div class="auto-close-notice" style="
					color: #aaa;
					font-size: 12px;
					margin-top: 20px;
					text-transform: uppercase;
					letter-spacing: 1px;
				">
				</div>
			</div>
		`;
		
		this.updateCrownIndicators();

		document.body.appendChild(resultOverlay);
		this.animateResultAppear(resultOverlay);
		
		setTimeout(() => {
			if (document.body.contains(resultOverlay)) {
				this.animateResultDisappear(resultOverlay);
			}
		}, 2000);
	},

	generateRoundsProgress: function() {
    let progressHTML = '';
    const totalRounds = this.gameState.totalRounds;
    
    // Получаем историю результатов раундов (должен быть массив в gameState)
    // Если нет истории, создаем на основе текущих данных
    let roundResults = this.gameState.roundResults || [];
    
    // Если история пуста, заполняем на основе roundsWon
    if (roundResults.length === 0) {
        const playerWins = this.gameState.roundsWon.player || 0;
        const opponentWins = this.gameState.roundsWon.opponent || 0;
        
        // Создаем временную историю (для обратной совместимости)
        for (let i = 0; i < playerWins; i++) {
            roundResults.push('player');
        }
        for (let i = 0; i < opponentWins; i++) {
            roundResults.push('opponent');
        }
    }
    
    for (let i = 1; i <= totalRounds; i++) {
        let roundClass, roundSymbol, roundColor, tooltip;
        
        // Получаем результат для текущего раунда (индекс i-1 в массиве)
        const roundResult = roundResults[i - 1];
        
        if (!roundResult || i > roundResults.length) {
            // Раунд еще не сыгран
            roundClass = 'empty';
            roundSymbol = i;
            roundColor = '#666';
            tooltip = 'Раунд не сыгран';
        } else if (roundResult === 'draw') {
            roundClass = 'draw';
            roundSymbol = '＝';
            roundColor = '#FFD700';
            tooltip = 'Ничья';
        } else if (roundResult === 'player') {
            roundClass = 'player-win';
            roundSymbol = '✓';
            roundColor = '#4CAF50';
            tooltip = 'Победа игрока';
        } else if (roundResult === 'opponent') {
            roundClass = 'opponent-win';
            roundSymbol = '✗';
            roundColor = '#f44336';
            tooltip = 'Победа противника';
        }
        
        progressHTML += `
            <div class="round-indicator ${roundClass}" style="
                width: 35px;
                height: 35px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 14px;
                background: ${roundClass === 'empty' ? 'transparent' : roundColor};
                color: ${roundClass === 'empty' ? '#888' : 'white'};
                border: 1px solid ${roundColor};
                position: relative;
            " title="${tooltip}">${roundSymbol}</div>
        `;
    }
    
    return progressHTML;
},

    addResultStyles: function() {
        if (document.getElementById('round-result-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'round-result-styles';
        style.textContent = `
            @keyframes resultAppear {
                0% {
                    opacity: 0;
                    transform: scale(0.5) translateY(-100px) rotateX(60deg);
                }
                70% {
                    opacity: 1;
                    transform: scale(1.05) translateY(10px) rotateX(0deg);
                }
                100% {
                    opacity: 1;
                    transform: scale(1) translateY(0) rotateX(0deg);
                }
            }
            
            @keyframes resultDisappear {
                0% {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }
                100% {
                    opacity: 0;
                    transform: scale(0.8) translateY(50px);
                }
            }
            
            @keyframes roundChange {
                0% { transform: scale(1); }
                50% { transform: scale(1.2); }
                100% { transform: scale(1); }
            }
            
            .round-result-overlay {
                animation: overlayAppear 0.3s ease-out;
            }
            
            @keyframes overlayAppear {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            .continue-btn:hover {
                filter: brightness(1.1);
            }
            
            .continue-btn:active {
                transform: scale(0.95) !important;
            }
        `;
        document.head.appendChild(style);
    },

    showGameResult: function(winner) {
        if (window.audioManager && window.audioManager.playSound) {
            if (winner === 'player') {
                audioManager.playSound('win');
            } else if (winner === 'opponent') {
                audioManager.playSound('lose');
            } else {
                audioManager.playSound('draw');
            }
        }
		
        const resultOverlay = document.createElement('div');
        resultOverlay.className = 'game-result-overlay';
        resultOverlay.style.cssText = `
            position: fixed;
            width: 100%;
            height: 100%;
            background: url("ui/fon.jpg") center center / cover no-repeat;
            z-index: 10000;
        `;

        let resultImage, resultText, resultColor;
        const finalScore = `${this.gameState.roundsWon.player}-${this.gameState.roundsWon.opponent}`;
        
        if (winner === 'player') {
            resultImage = 'board/win.png';
            resultText = 'ПОБЕДА';
            resultColor = '#4CAF50';
        } else if (winner === 'opponent') {
            resultImage = 'board/lose.png';
            resultText = 'ПОРАЖЕНИЕ';
            resultColor = '#f44336';
        } else {
            resultImage = 'board/draw.png';
            resultText = 'НИЧЬЯ';
            resultColor = '#FFD700';
        }

        resultOverlay.innerHTML = `
            <div class="game-result-container" style="
                text-align: center;
                animation: resultAppear 0.5s ease-out;
            ">
                <img src="${resultImage}" alt="${resultText}" style="
                    width: 400px;
                    height: 300px;
                    margin-bottom: 30px;
					margin-top: 120px;
                " onerror="this.style.display='none'">
                
                <h1 style="
                    color: ${resultColor};
                    margin: 0 0 20px 0;
                    font-size: 35px;
                    text-transform: uppercase;
                    letter-spacing: 3px;
                    text-shadow: 0 2px 10px rgba(0,0,0,0.5);
					-webkit-text-stroke: 0.2px black;
                ">${resultText}</h1>
                
                <div class="final-score" style="
                    font-size: 25px;
                    color: #fff;
					-webkit-text-stroke: 0.2px black;
                ">
                    ${finalScore}
                </div>
                
                <div class="action-buttons" style="
                    display: flex;
                    gap: 20px;
                    justify-content: center;
                    margin-top: 20px;
                ">
                    <button class="restart-btn" style="
						background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
						color: #d4af37;
						border: 1px solid #d4af37; 
						padding: 10px;
						font-size: 21px;
						font-family: 'Gwent', sans-serif;
						text-transform: uppercase;
						letter-spacing: 3px; 
						cursor: url('ui/cursor_hover.png'), pointer;
						transition: all 0.3s ease; 
						border-radius: 5px; 
						box-shadow: 0 0 10px rgba(212, 175, 55, 0.5);
						position: relative;
						overflow: hidden;
						width: 200px;
                    ">В ГЛАВНОЕ МЕНЮ</button>
                    
                    <button class="redeck-btn" style="
						background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
						color: #d4af37;
						border: 1px solid #d4af37; 
						padding: 10px;
						font-size: 21px;
						font-family: 'Gwent', sans-serif;
						text-transform: uppercase;
						letter-spacing: 3px; 
						cursor: url('ui/cursor_hover.png'), pointer;
						transition: all 0.3s ease; 
						border-radius: 5px; 
						box-shadow: 0 0 10px rgba(212, 175, 55, 0.5);
						position: relative;
						overflow: hidden;
						width: 200px;
                    ">К СБОРУ КОЛОДЫ</button>
                </div>
            </div>
        `;

        document.body.appendChild(resultOverlay);
        
        const restartBtn = resultOverlay.querySelector('.restart-btn');
        const redeckBtn = resultOverlay.querySelector('.redeck-btn');
        
        restartBtn.addEventListener('click', () => {
            audioManager.playSound('button');
            document.body.removeChild(resultOverlay);
            this.returnToMainMenu();
        });
        
        redeckBtn.addEventListener('click', () => {
            audioManager.playSound('button');
            document.body.removeChild(resultOverlay);
            this.redeckGame();
        });
    },

    returnToMainMenu: function() {
        window.location.reload();
    },

    redeckGame: function() {
    const currentPlayerFaction = this.gameState.player.faction;
    
    this.stopTurnTimer();
    
    this.resetGameState();
    
    const gameBoard = document.querySelector('.game-board');
    if (gameBoard) {
        gameBoard.remove();
    }
    
    const gameResultOverlay = document.querySelector('.game-result-overlay');
    if (gameResultOverlay) {
        gameResultOverlay.remove();
    }
    
    const modals = document.querySelectorAll('.card-modal-overlay, .deck-modal-overlay, .round-result-overlay');
    modals.forEach(modal => modal.remove());
    
    const deckBuilding = document.querySelector('.deck-building');
    if (deckBuilding) {
        deckBuilding.remove();
    }
    
    if (window.factionModule && currentPlayerFaction) {
        const factionData = window.factionModule.factionsData[currentPlayerFaction];
        if (factionData) {
            // Инициализируем сбор колоды для этой фракции
            if (window.deckModule && window.deckModule.initDeckBuilding) {
                window.deckModule.initDeckBuilding(factionData);
            }
        } else {
            // Если не нашли данные фракции, перезагружаем страницу
            window.location.reload();
        }
    } else {
        window.location.reload();
    }
	this.resetCrownIndicators();
},

	resetGameState: function() {
		const playerFaction = this.gameState.player.faction;
		const playerAbility = this.gameState.player.ability;
		
		this.gameState = {
			player: {
				deck: [],
				hand: [],
				discard: [],
				leader: null,
				faction: playerFaction, 
				ability: playerAbility,
				rows: {
					'close': { cards: [], strength: 0, tactic: null },
					'ranged': { cards: [], strength: 0, tactic: null },
					'siege': { cards: [], strength: 0, tactic: null }
				},
				passed: false,
				score: 0
			},
			opponent: {
				deck: [],
				hand: [],
				discard: [],
				leader: null,
				faction: null,
				ability: null,
				rows: {
					'close': { cards: [], strength: 0, tactic: null },
					'ranged': { cards: [], strength: 0, tactic: null },
					'siege': { cards: [], strength: 0, tactic: null }
				},
				passed: false,
				score: 0
			},
			weather: {
				cards: [],
				maxWeatherCards: 3,
				effects: {
					'close': null,
					'ranged': null, 
					'siege': null
				}
			},
			currentRound: 1,
			totalRounds: 3,
			roundsWon: {
				player: 0,
				opponent: 0
			},
			currentPlayer: 'player',
			gamePhase: 'setup',
			selectedCard: null,
			selectingRow: false,
			cardsPlayedThisTurn: 0, 
			maxCardsPerTurn: 1, 
			gameSettings: {
				mode: 'cdpred',
				initialHandSize: 10,
				cardsPerRound: 1,
				totalRounds: 3
			},
			mulligan: {
				enabled: true,
				phase: 'waiting',
				player: {
					available: 2,
					used: 0,    
					cards: []    
				},
				opponent: {
					available: 2, 
					used: 0,    
					cards: []    
				}
			},
			turnTimer: {
				active: false,
				timeLeft: 60,
				maxTime: 60,
				intervalId: null,
				timeouts: 0,
				maxTimeouts: 2, 
				penaltyApplied: false 
			},
			roundLossDueToTimeout: null,
			roundResults: [],
			roundsWon: {
				player: 0,
				opponent: 0
			},
		};
		
		if (window.aiModule && window.aiModule.reset) {
			window.aiModule.reset();
		}
		
		if (window.playerModule) {
			window.playerModule.gameState = this.gameState;
		}
		
		if (window.aiModule) {
			window.aiModule.gameState = this.gameState;
		}
		
		this.resetCrownIndicators();
	},

    getTypeIconPath: function(cardType) {
        const typeIcons = {
            'special': 'deck/type_special.png',
            'artifact': 'deck/type_artifact.png',
            'tactic': 'deck/type_tactic.png',
            'leader': 'deck/type_leader.png'
        };
        return typeIcons[cardType] || 'deck/type_unknown.png';
    },

    getPositionIconPath: function(position) {
        const positionIcons = {
            'close-row': 'deck/close-row.png',
            'ranged-row': 'deck/ranged-row.png',
            'siege-row': 'deck/siege-row.png'
        };
        return positionIcons[position] || 'deck/any-row.png';
    },

    capitalizeFirst: function(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    },

    updateGameDisplay: function() {
        const playerDeckCount = document.querySelector('.deck-count');
        const opponentDeckCount = document.querySelector('.opponent-deck-count');
        
        if (playerDeckCount) playerDeckCount.textContent = this.gameState.player.deck.length;
        if (opponentDeckCount) opponentDeckCount.textContent = this.gameState.opponent.deck.length;
    },

    animateResultAppear: function(overlay) {
        const container = overlay.querySelector('.round-result-container');
        container.style.animation = 'resultAppear 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    },

    animateResultDisappear: function(overlay) {
        const container = overlay.querySelector('.round-result-container');
        container.style.animation = 'resultDisappear 0.4s ease-in forwards';
        
        setTimeout(() => {
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
        }, 400);
    },

    darkenColor: function(color, percent) {
        if (color.startsWith('#')) {
            let num = parseInt(color.slice(1), 16);
            let amt = Math.round(2.55 * percent);
            let R = (num >> 16) - amt;
            let G = (num >> 8 & 0x00FF) - amt;
            let B = (num & 0x0000FF) - amt;
            return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
                (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
                (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
        }
        return color;
    },

    showGameMessage: function(text, type = 'info') {
        let messageContainer = document.getElementById('gameMessages');
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.id = 'gameMessages';
            messageContainer.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
				color: white;
                transform: translateX(-50%);
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 400px;
            `;
            document.body.appendChild(messageContainer);
        }
        
        const messageElement = document.createElement('div');
        messageElement.className = `game-message game-message-${type}`;
        messageElement.style.cssText = `
            text-align: center;
            font-family: 'Gwent', sans-serif;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            animation: messageAppear 0.3s ease-out;
        `;
        
        messageElement.textContent = text;
        messageContainer.appendChild(messageElement);
        
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.style.animation = 'messageDisappear 0.3s ease-out';
                setTimeout(() => {
                    if (messageElement.parentNode) {
                        messageElement.parentNode.removeChild(messageElement);
                    }
                }, 300);
            }
        }, 3000);
    },

};

window.gameModule = gameModule;