const gameModule = {
    // Состояние игры
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
    },

    // Инициализация игры
    init: function() {
        console.log('🎮 Инициализация игрового движка...');
        
		this.addMessageStyles();
		this.createTotalScoreDisplays();
		
        this.loadPlayerDeck();
        this.loadOpponentDeck();
        this.setupPlayerLeader();
        this.setupOpponentLeader();
        this.dealInitialHands();
        this.setupEventListeners();
        this.updateGameDisplay();
        
        this.displayPlayerDiscard();
        this.displayOpponentDiscard();
        
        // Инициализируем модули
        if (window.playerModule) {
            window.playerModule.init(this.gameState);
        }
        
        if (window.aiModule) {
            window.aiModule.init(this.gameState);
        }
        
        this.startPlayerTurn();
    },

       // === УПРАВЛЕНИЕ ИГРОВЫМ ЦИКЛОМ ===
    
	startPlayerTurn: function() {
		console.log('🎯 Ход игрока');
		this.gameState.gamePhase = 'playerTurn';
		this.gameState.currentPlayer = 'player';
		this.gameState.cardsPlayedThisTurn = 0; // ✅ УБЕДИТЕСЬ что счетчик сброшен
		this.gameState.selectingRow = false; // ✅ СБРАСЫВАЕМ состояние выбора
		this.gameState.selectedCard = null; // ✅ СБРАСЫВАЕМ выбранную карту
		
		this.updateTurnIndicator();
		this.updateControlButtons();
		
		this.showGameMessage('Ваш ход', 'info');
	},

	startOpponentTurn: function() {
		console.log('🤖 Ход противника');
		this.gameState.gamePhase = 'opponentTurn'; 
		this.gameState.currentPlayer = 'opponent';
		this.gameState.cardsPlayedThisTurn = 0; // ✅ УБЕДИТЕСЬ что счетчик сброшен
		
		this.updateTurnIndicator();
		this.updateControlButtons();
		
		this.showGameMessage('Ход противника', 'warning');
		
		// Проверяем, не пасовал ли уже противник
		if (this.gameState.opponent.passed) {
			console.log('⏸️ Противник уже пасовал - пропускаем ход');
			this.showGameMessage('Противник пасовал', 'info');
			setTimeout(() => {
				this.startPlayerTurn(); // Возвращаем ход игроку
			}, 1000);
			return;
		}
		
		// Даем задержку для "мышления" ИИ
		setTimeout(() => {
			if (window.aiModule) {
				window.aiModule.makeMove();
			} else {
				console.error('❌ AI модуль не загружен');
				this.startPlayerTurn(); // Fallback
			}
		}, 1000);
	},

	handleTurnEnd: function() {
		console.log('🔄 Завершение хода текущего игрока');
		
		const currentPlayer = this.gameState.currentPlayer;
		console.log(`Текущий игрок: ${currentPlayer}, Пасс: ${this.gameState[currentPlayer].passed}`);
		
		// ✅ СБРАСЫВАЕМ счетчик карт за ход
		this.gameState.cardsPlayedThisTurn = 0;
		
		// ✅ УБЕДИТЕСЬ что состояние selectingRow сброшено
		this.gameState.selectingRow = false;
		this.gameState.selectedCard = null;
		
		if (this.gameState[currentPlayer].passed) {
			console.log(`⏸️ ${currentPlayer} пасовал - проверяем конец раунда`);
			this.checkRoundEnd();
		} else {
			// Просто передаем ход следующему игроку
			if (currentPlayer === 'player') {
				this.startOpponentTurn();
			} else {
				this.startPlayerTurn();
			}
		}
	},

    // === УПРАВЛЕНИЕ РАУНДАМИ ===

	endRound: function() {
		console.log('⏰ Конец раунда', this.gameState.currentRound);
		
		const playerScore = this.calculateTotalScore('player');
		const opponentScore = this.calculateTotalScore('opponent');
		
		console.log(`Счет: Игрок ${playerScore} - ${opponentScore} Противник`);
		
		let roundWinner = null;
		
		// ✅ ПРАВИЛЬНАЯ логика ничьей
		if (playerScore > opponentScore) {
			roundWinner = 'player';
			this.gameState.roundsWon.player++;
			console.log('🎯 Победитель раунда: Игрок');
		} else if (opponentScore > playerScore) {
			roundWinner = 'opponent';
			this.gameState.roundsWon.opponent++;
			console.log('🎯 Победитель раунда: Противник');
		} else {
			// ✅ НИЧЬЯ - оба получают по баллу
			roundWinner = null;
			this.gameState.roundsWon.player++;
			this.gameState.roundsWon.opponent++;
			console.log('🤝 Ничья в раунде - оба получают по баллу');
		}
		
		// ✅ ИСПОЛЬЗУЕМ новый визуал
		this.showRoundResult(roundWinner, playerScore, opponentScore);
		
		// Проверяем конец игры (теперь нужно 2 очка для победы)
		if (this.gameState.roundsWon.player >= 2 || this.gameState.roundsWon.opponent >= 2) {
			setTimeout(() => this.endGame(), 3000);
		} else {
			setTimeout(() => this.startNewRound(), 3000);
		}
	},

	calculateTotalScore: function(player) {
		const rows = this.gameState[player].rows;
		let totalScore = 0;
		
		// ✅ ОПТИМИЗИРОВАННЫЙ расчет с кешированием
		if (this.gameState[player].cachedTotalScore !== undefined) {
			// Используем кешированное значение если ряды не менялись
			const rowsChanged = Object.values(rows).some(row => 
				row.cards.length !== (this.gameState[player].cachedRowLengths?.[row] || 0)
			);
			
			if (!rowsChanged) {
				return this.gameState[player].cachedTotalScore;
			}
		}
		
		// Пересчитываем счет
		totalScore = Object.values(rows).reduce((total, row) => total + row.strength, 0);
		
		// Кешируем значения
		this.gameState[player].cachedTotalScore = totalScore;
		this.gameState[player].cachedRowLengths = {};
		Object.keys(rows).forEach(rowKey => {
			this.gameState[player].cachedRowLengths[rowKey] = rows[rowKey].cards.length;
		});
		
		return totalScore;
	},

    resolveTie: function() {
        // Способность Нильфгаарда - победа при ничье
        if (this.gameState.player.faction === 'nilfgaard') {
            return 'player';
        } else if (this.gameState.opponent.faction === 'nilfgaard') {
            return 'opponent';
        }
        // По умолчанию ничья не приносит победы
        return null;
    },

    startNewRound: function() {
        this.gameState.currentRound++;
        this.resetRoundState();
        this.dealAdditionalCards();
        this.updateRoundCounter();
        this.startPlayerTurn();
    },

	resetRoundState: function() {
		console.log('🔄 Сброс состояния раунда');
		
		this.gameState.player.passed = false;
		this.gameState.opponent.passed = false;
		this.gameState.cardsPlayedThisTurn = 0;
		
		// ✅ СБРАСЫВАЕМ кеш счетов
		this.invalidateScoreCache('player');
		this.invalidateScoreCache('opponent');
		
		// Обрабатываем карты погоды
		this.gameState.weather.cards.forEach(weatherCard => {
			const cardOwner = this.getWeatherCardOwner(weatherCard);
			console.log(`🗑️ Погода: ${weatherCard.name} -> сброс ${cardOwner}`);
			this.addCardToDiscard(weatherCard, cardOwner);
		});
		
		this.gameState.weather.cards = [];
		this.clearAllWeatherEffects();
		
		// Остальная логика сброса рядов...
		const rows = ['close', 'ranged', 'siege'];
		
		rows.forEach(row => {
			// Карты юнитов идут в сброс
			this.gameState.player.rows[row].cards.forEach(card => {
				console.log(`🗑️ Игрок: ${card.name} -> сброс`);
				this.addCardToDiscard(card, 'player');
			});
			
			this.gameState.opponent.rows[row].cards.forEach(card => {
				console.log(`🗑️ Противник: ${card.name} -> сброс`);
				this.addCardToDiscard(card, 'opponent');
			});
			
			// Карты тактики
			if (this.gameState.player.rows[row].tactic) {
				console.log(`🗑️ Игрок (тактика): ${this.gameState.player.rows[row].tactic.name} -> сброс`);
				this.addCardToDiscard(this.gameState.player.rows[row].tactic, 'player');
			}
			
			if (this.gameState.opponent.rows[row].tactic) {
				console.log(`🗑️ Противник (тактика): ${this.gameState.opponent.rows[row].tactic.name} -> сброс`);
				this.addCardToDiscard(this.gameState.opponent.rows[row].tactic, 'opponent');
			}
			
			// Очищаем ряды
			this.gameState.player.rows[row] = { cards: [], strength: 0, tactic: null };
			this.gameState.opponent.rows[row] = { cards: [], strength: 0, tactic: null };
		});
		
		// Очищаем визуальное отображение
		this.clearAllBoardRows();
		this.displayWeatherCards();
		
		// ✅ ОБНОВЛЯЕМ общие счетчики (должны показать 0)
		this.updateTotalScoreDisplays();
		
		console.log('✅ Состояние раунда сброшено');
	},

	invalidateScoreCache: function(player) {
		if (this.gameState[player]) {
			this.gameState[player].cachedTotalScore = undefined;
			this.gameState[player].cachedRowLengths = undefined;
		}
	},

	endGame: function() {
		console.log('🏆 Конец игры!');
		const playerWins = this.gameState.roundsWon.player;
		const opponentWins = this.gameState.roundsWon.opponent;
		
		// ✅ ОПРЕДЕЛЯЕМ победителя с учетом ничьих
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
		console.log('🎨 Очистка визуального отображения рядов');
		
		const rows = ['close', 'ranged', 'siege'];
		
		rows.forEach(row => {
			// Очищаем ряды игрока
			const playerRow = document.getElementById(`player${this.capitalizeFirst(row)}Row`);
			const playerTactic = document.getElementById(`player${this.capitalizeFirst(row)}Tactics`);
			
			if (playerRow) playerRow.innerHTML = '';
			if (playerTactic) playerTactic.innerHTML = '';
			
			// Очищаем ряды противника
			const opponentRow = document.getElementById(`opponent${this.capitalizeFirst(row)}Row`);
			const opponentTactic = document.getElementById(`opponent${this.capitalizeFirst(row)}Tactics`);
			
			if (opponentRow) opponentRow.innerHTML = '';
			if (opponentTactic) opponentTactic.innerHTML = '';
			
			// Сбрасываем отображение силы
			const playerStrength = document.getElementById(`player${this.capitalizeFirst(row)}Strength`);
			const opponentStrength = document.getElementById(`opponent${this.capitalizeFirst(row)}Strength`);
			
			if (playerStrength) playerStrength.textContent = '0';
			if (opponentStrength) opponentStrength.textContent = '0';
		});
	},

    // === СИСТЕМА ПОГОДЫ ===

	handleClearWeather: function(card) {
		console.log('☀️ Активировано Чистое небо');
		this.playWeatherSound('clear');
		
		// ✅ ПРАВИЛЬНО очищаем слот погоды перед добавлением новой карты
		// Сначала отправляем все существующие карты погоды в сброс
		this.gameState.weather.cards.forEach(weatherCard => {
			const cardOwner = this.getWeatherCardOwner(weatherCard);
			this.addCardToDiscard(weatherCard, cardOwner);
		});
		
		// ✅ ПОЛНОСТЬЮ очищаем массив погоды
		this.gameState.weather.cards = [];
		
		// ✅ ТОЛЬКО ПОСЛЕ этого добавляем "Чистое небо"
		this.gameState.weather.cards.push(card);
		
		// Убираем все погодные эффекты
		this.clearAllWeatherEffects();
		this.restoreAllRowStrengths();
		
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

    handleRegularWeather: function(card) {
        // Проверяем "Чистое небо"
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
        }
        
        // Добавляем новую карту погоды
        this.gameState.weather.cards.push(card);
        this.applyWeatherEffect(card);
        this.displayWeatherCards();
    },

	applyWeatherEffect: function(card) {
		const weatherEffect = this.getWeatherEffectForCard(card);
		if (!weatherEffect) return;
		
		const { row, image, sound } = weatherEffect;
		
		// Устанавливаем эффект
		this.gameState.weather.effects[row] = {
			card: card,
			image: image
		};
		
		// Применяем визуально и механически
		this.applyVisualWeatherEffect(row, image);
		this.reduceRowStrengthTo1(row, 'player');
		this.reduceRowStrengthTo1(row, 'opponent');
		this.playWeatherSound(sound);
		
		// ✅ ОБНОВЛЯЕМ общий счет после применения погоды
		this.updateTotalScoreDisplays();
		
		console.log(`🌧️ Применен эффект погоды на ряд ${row}: ${card.name}`);
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
					if (card.originalStrength !== undefined) {
						card.strength = card.originalStrength;
						this.updateCardStrengthDisplay(card, row, player);
						delete card.originalStrength;
					}
				});
				this.updateRowStrength(row, player);
			});
		});
		
		// ✅ ОБНОВЛЯЕМ общий счет после восстановления силы
		this.updateTotalScoreDisplays();
	},
	
	reduceRowStrengthTo1: function(row, player) {
		this.gameState[player].rows[row].cards.forEach(card => {
			if (card.strength > 1) {
				card.originalStrength = card.strength;
				card.strength = 1;
				this.updateCardStrengthDisplay(card, row, player);
			}
		});
		this.updateRowStrength(row, player);
	},

    // === ОБНОВЛЕНИЕ ИНТЕРФЕЙСА ===

	updateControlButtons: function() {
		const passBtn = document.getElementById('passBtn');
		const endTurnBtn = document.getElementById('endTurnBtn');
		
		if (!passBtn || !endTurnBtn) return;
		
		const isPlayerTurn = this.gameState.gamePhase === 'playerTurn';
		const playerPassed = this.gameState.player.passed;
		const canPlayMoreCards = this.gameState.cardsPlayedThisTurn < this.gameState.maxCardsPerTurn;
		
		// ✅ Кнопка "Пас" активна только в ход игрока, если он еще не пасовал И может играть карты
		passBtn.disabled = !isPlayerTurn || playerPassed || !canPlayMoreCards;
		
		// ✅ Кнопка "Завершить ход" активна только в ход игрока и если он может завершить ход
		endTurnBtn.disabled = !isPlayerTurn || (canPlayMoreCards && !playerPassed);
		
		// Визуальная обратная связь
		passBtn.style.opacity = (!isPlayerTurn || playerPassed || !canPlayMoreCards) ? '0.5' : '1';
		passBtn.style.cursor = (!isPlayerTurn || playerPassed || !canPlayMoreCards) ? 'not-allowed' : 'pointer';
		
		endTurnBtn.style.opacity = (!isPlayerTurn || (canPlayMoreCards && !playerPassed)) ? '0.5' : '1';
		endTurnBtn.style.cursor = (!isPlayerTurn || (canPlayMoreCards && !playerPassed)) ? 'not-allowed' : 'pointer';
		
		// Визуальная индикация лимита карт
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
		
		// ✅ Если игрок пасовал, показываем специальный текст на кнопке паса
		if (playerPassed) {
			passBtn.textContent = 'Пас ✓';
			passBtn.style.background = '#ff9800';
		} else {
			passBtn.textContent = 'Пас';
			passBtn.style.background = '';
		}
		
		console.log(`🎮 Управление: ход игрока: ${isPlayerTurn}, пас: ${playerPassed}, карт размещено: ${this.gameState.cardsPlayedThisTurn}/${this.gameState.maxCardsPerTurn}`);
	},

    updateTurnIndicator: function() {
        console.log('Сейчас ходит:', this.gameState.currentPlayer);
        // Можно добавить визуальный индикатор на поле
    },

    updateAllDisplays: function() {
        this.displayPlayerHand();
        this.displayPlayerDeck();
        this.displayOpponentDeck();
        this.displayPlayerDiscard();
        this.displayOpponentDiscard();
        this.displayWeatherCards();
        
        // Обновляем силу всех рядов
        const rows = ['close', 'ranged', 'siege'];
        rows.forEach(row => {
            this.updateRowStrength(row, 'player');
            this.updateRowStrength(row, 'opponent');
        });
    },

	createTotalScoreDisplays: function() {
		console.log('🎯 Создание общих счетчиков очков');
		
		const gameBoard = document.querySelector('.game-board');
		const playerLeader = document.getElementById('playerLeader');
		const opponentLeader = document.getElementById('opponentLeader');
		
		if (!gameBoard || !playerLeader || !opponentLeader) return;
		
		// Получаем позиции лидеров
		const playerLeaderRect = playerLeader.getBoundingClientRect();
		const opponentLeaderRect = opponentLeader.getBoundingClientRect();
		const gameBoardRect = gameBoard.getBoundingClientRect();
		
		// ✅ СЧЕТЧИК ПРОТИВНИКА - справа от лидера противника
		const opponentScoreDisplay = document.createElement('div');
		opponentScoreDisplay.id = 'opponentTotalScore';
		opponentScoreDisplay.className = 'total-score-display opponent-total-score';
		opponentScoreDisplay.style.cssText = `
			position: absolute;
			top: ${opponentLeaderRect.top - gameBoardRect.top + (opponentLeaderRect.height / 2) - 30}px;
			left: ${opponentLeaderRect.right - gameBoardRect.left + 20}px;
			z-index: 100;
			text-align: center;
		`;
		
		opponentScoreDisplay.innerHTML = `
			<div class="score-background" style="
				background: url('gwent/score.png') center/contain no-repeat;
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
		
		// ✅ СЧЕТЧИК ИГРОКА - справа от лидера игрока
		const playerScoreDisplay = document.createElement('div');
		playerScoreDisplay.id = 'playerTotalScore';
		playerScoreDisplay.className = 'total-score-display player-total-score';
		playerScoreDisplay.style.cssText = `
			position: absolute;
			top: ${playerLeaderRect.top - gameBoardRect.top + (playerLeaderRect.height / 2) - 30}px;
			left: ${playerLeaderRect.right - gameBoardRect.left + 20}px;
			z-index: 100;
			text-align: center;
		`;
		
		playerScoreDisplay.innerHTML = `
			<div class="score-background" style="
				background: url('gwent/score.png') center/contain no-repeat;
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
		
		// ✅ ДОБАВЛЯЕМ счетчики к игровому полю
		gameBoard.appendChild(opponentScoreDisplay);
		gameBoard.appendChild(playerScoreDisplay);
		
		console.log('✅ Общие счетчики очков созданы (рядом с лидерами)');
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
				
				// Анимация при изменении счета
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
				
				// Анимация при изменении счета
				scoreValue.classList.add('score-update');
				setTimeout(() => {
					scoreValue.classList.remove('score-update');
				}, 500);
			}
		}
		
		console.log(`📊 Общий счет: Игрок ${playerTotalScore} - ${opponentTotalScore} Противник`);
	},

    // === ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ===

	completeCardPlay: function() {
		console.log('✅ Карта успешно размещена');
		this.gameState.selectedCard = null;
		this.gameState.selectingRow = false;
		this.gameState.cardsPlayedThisTurn++;
		
		console.log(`🎯 Карт размещено за ход: ${this.gameState.cardsPlayedThisTurn}/${this.gameState.maxCardsPerTurn}`);
		
		// ✅ ОБНОВЛЯЕМ общий счет
		this.updateTotalScoreDisplays();
		
		// ✅ ПРОВЕРЯЕМ лимит карт и автоматически завершаем ход если достигнут
		if (this.gameState.cardsPlayedThisTurn >= this.gameState.maxCardsPerTurn) {
			console.log(`🔄 Достигнут лимит карт (${this.gameState.cardsPlayedThisTurn}/${this.gameState.maxCardsPerTurn}) - завершение хода`);
			this.showGameMessage('Лимит карт за ход достигнут', 'info');
			
			// Небольшая задержка для визуальной обратной связи
			setTimeout(() => {
				this.handleTurnEnd();
			}, 800);
		} else {
			this.updateControlButtons();
		}
		
		// Уведомляем модуль игрока о завершении размещения
		if (window.playerModule && window.playerModule.cancelRowSelection) {
			window.playerModule.cancelRowSelection();
		}
	},

	endTurn: function() {
		console.log('🔄 Явное завершение хода');
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
            'Трескучий мороз': { row: 'siege', image: 'gwent/frost.png', sound: 'frost' },
            'Белый Хлад': { row: 'siege', image: 'gwent/frost.png', sound: 'frost' },
            'Густой туман': { row: 'ranged', image: 'gwent/fog.png', sound: 'fog' },
            'Проливной дождь': { row: 'close', image: 'gwent/rain.png', sound: 'rain' },
            'Шторм Скеллиге': { row: 'close', image: 'gwent/rain.png', sound: 'rain' }
        };
        return weatherEffects[card.name];
    },

    playWeatherSound: function(soundType) {
        if (window.audioManager && window.audioManager.playWeatherSound) {
            window.audioManager.playWeatherSound(soundType);
        }
    },

	endPlayerTurn: function() {
		console.log('🔄 Завершение хода игрока');
		this.startOpponentTurn();
	},

	checkRoundEnd: function() {
		console.log('🔍 Проверка условий конца раунда');
		console.log('Статус паса - Игрок:', this.gameState.player.passed, 'Противник:', this.gameState.opponent.passed);
		
		if (this.gameState.player.passed && this.gameState.opponent.passed) {
			console.log('⏰ Оба игрока пасовали - конец раунда');
			this.showGameMessage('Оба игрока пасовали! Конец раунда', 'warning');
			setTimeout(() => this.endRound(), 1500);
		} else {
			console.log('🔄 Продолжаем игру - не все пасовали');
			
			let nextPlayer;
			if (this.gameState.player.passed && !this.gameState.opponent.passed) {
				nextPlayer = 'opponent';
			} else if (!this.gameState.player.passed && this.gameState.opponent.passed) {
				nextPlayer = 'player';
			} else {
				nextPlayer = this.gameState.currentPlayer === 'player' ? 'opponent' : 'player';
			}
			
			console.log(`🎯 Следующий ход: ${nextPlayer}`);
			
			if (nextPlayer === 'player') {
				this.startPlayerTurn();
			} else {
				this.startOpponentTurn();
			}
		}
	},

	addCardToDiscard: function(card, player) {
		// ✅ УБЕДИТЕСЬ что карта не добавляется в сброс при обычном размещении
		// Этот метод должен вызываться ТОЛЬКО когда карта действительно уходит в сброс
		console.log(`🗑️ Карта ${card.name} добавлена в сброс ${player}`);
		this.gameState[player].discard.push(card);
		this.updateDiscardDisplay(player);
	},

	dealAdditionalCards: function() {
		console.log('🃏 Раздача карт для нового раунда');
		
		const targetHandSize = 10;
		
		// ✅ РАЗДАЧА ДЛЯ ИГРОКА
		const playerCurrentHandSize = this.gameState.player.hand.length;
		const playerCardsNeeded = targetHandSize - playerCurrentHandSize;
		
		console.log(`🎯 Игрок: на руках ${playerCurrentHandSize}, нужно добавить ${playerCardsNeeded}`);
		
		if (playerCardsNeeded > 0 && this.gameState.player.deck.length > 0) {
			const cardsToDeal = Math.min(playerCardsNeeded, this.gameState.player.deck.length);
			const newCards = this.gameState.player.deck.splice(0, cardsToDeal);
			this.gameState.player.hand.push(...newCards);
			
			console.log(`🎯 Игрок получил ${cardsToDeal} карт:`, newCards.map(c => c.name));
		} else if (playerCardsNeeded > 0) {
			console.log('❌ У игрока закончились карты в колоде');
		}
		
		// ✅ РАЗДАЧА ДЛЯ ПРОТИВНИКА
		const opponentCurrentHandSize = this.gameState.opponent.hand.length;
		const opponentCardsNeeded = targetHandSize - opponentCurrentHandSize;
		
		console.log(`🤖 Противник: на руках ${opponentCurrentHandSize}, нужно добавить ${opponentCardsNeeded}`);
		
		if (opponentCardsNeeded > 0 && this.gameState.opponent.deck.length > 0) {
			const cardsToDeal = Math.min(opponentCardsNeeded, this.gameState.opponent.deck.length);
			const newCards = this.gameState.opponent.deck.splice(0, cardsToDeal);
			this.gameState.opponent.hand.push(...newCards);
			
			console.log(`🤖 Противник получил ${cardsToDeal} карт:`, newCards.map(c => c.name));
		} else if (opponentCardsNeeded > 0) {
			console.log('❌ У противника закончились карты в колоде');
		}
		
		// Обновляем отображение
		this.displayPlayerHand();
		this.displayPlayerDeck();
		this.displayOpponentDeck();
		
		console.log(`✅ Итог: Игрок ${this.gameState.player.hand.length}/10, Противник ${this.gameState.opponent.hand.length}/10`);
	},

    // === МЕТОДЫ ОТОБРАЖЕНИЯ ===

    displayPlayerHand: function() {
        const handContainer = document.getElementById('playerHand');
        if (!handContainer) return;

        handContainer.innerHTML = '';
        this.gameState.player.hand.forEach((card, index) => {
            const cardElement = this.createHandCardElement(card, index);
            handContainer.appendChild(cardElement);
        });
    },

    displayCardOnRow: function(row, card, player = 'player') {
        const rowElement = document.getElementById(`${player}${this.capitalizeFirst(row)}Row`);
        if (!rowElement) return;

        const cardElement = player === 'player' ? 
            this.createBoardCardElement(card, 'unit') : 
            this.createOpponentBoardCardElement(card);
            
        rowElement.appendChild(cardElement);
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
		const totalStrength = rowState.cards.reduce((sum, card) => sum + (card.strength || 0), 0);
		rowState.strength = totalStrength;
		
		const strengthElement = document.getElementById(`${player}${this.capitalizeFirst(row)}Strength`);
		if (strengthElement) {
			strengthElement.textContent = totalStrength;
			strengthElement.classList.add('strength-update');
			setTimeout(() => strengthElement.classList.remove('strength-update'), 500);
		}
		
		// ✅ ОБНОВЛЯЕМ общий счет после обновления ряда
		this.updateTotalScoreDisplays();
	},

    createHandCardElement: function(card, index) {
		const cardElement = document.createElement('div');
		cardElement.className = `hand-card ${card.type} ${card.rarity}`;
		cardElement.dataset.cardId = card.id;
		cardElement.dataset.handIndex = index;
		
		const mediaPath = `card/${card.faction}/${card.image}`;
		const isVideo = card.image && card.image.endsWith('.mp4');

		let mediaElement = isVideo ? 
			`<video class="hand-card-media" muted playsinline preload="metadata"><source src="${mediaPath}" type="video/mp4"></video>` :
			`<img src="${mediaPath}" alt="${card.name}" class="hand-card-media" onerror="this.src='card/placeholder.jpg'">`;

		let topRightElement = card.type === 'unit' ? 
			`<div class="hand-card-strength">${card.strength || 0}</div>` :
			`<div class="hand-card-type-icon"><img src="${this.getTypeIconPath(card.type)}" alt="${card.type}"></div>`;

		let positionElement = '';
		if (card.type === 'unit' && card.position) {
			// Обрабатываем как массив позиций, так и одиночную позицию
			let positions = [];
			if (Array.isArray(card.position)) {
				positions = card.position;
			} else {
				positions = [card.position];
			}
			
			// Для карт с несколькими позициями показываем иконку "любой ряд"
			// или первую доступную позицию
			const displayPosition = positions.length > 1 ? 'any' : positions[0];
			const positionIconPath = this.getPositionIconPath(displayPosition);
			
			positionElement = `
				<div class="hand-card-position">
					<img src="${card.positionBanner || 'deck/position_banner.png'}" alt="Позиция" class="hand-card-position-banner">
					<img src="${positionIconPath}" alt="${displayPosition}" class="hand-card-position-icon">
				</div>
			`;
			
			// Добавляем tooltip для карт с несколькими позициями
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
		
		const mediaPath = `card/${card.faction}/${card.image}`;
		const isVideo = card.image && card.image.endsWith('.mp4');

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
			// Обрабатываем как массив позиций, так и одиночную позицию
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

		// Обработчики для карты на поле
		cardElement.addEventListener('contextmenu', (event) => {
			event.preventDefault();
			this.showCardModal(card);
		});

		cardElement.addEventListener('mouseenter', () => {
			audioManager.playSound('touch');
			
			// Воспроизведение видео при наведении
			const video = cardElement.querySelector('video');
			if (video) {
				video.currentTime = 0;
				video.play().catch(e => console.log('Воспроизведение видео на поле:', e));
				video.loop = true;
			}
		});

		cardElement.addEventListener('mouseleave', () => {
			// Остановка видео при уходе курсора
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
		
		const mediaPath = `card/${card.faction}/${card.image}`;
		const isVideo = card.image && card.image.endsWith('.mp4');

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
			
			// Воспроизведение видео при наведении для карт погоды
			const video = cardElement.querySelector('video');
			if (video) {
				video.currentTime = 0;
				video.play().catch(e => console.log('Воспроизведение видео погоды:', e));
				video.loop = true;
			}
		});

		cardElement.addEventListener('mouseleave', () => {
			// Остановка видео при уходе курсора
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

		// ✅ СОХРАНЯЕМ существующие счетчики перед очисткой
		const opponentScoreDisplay = document.getElementById('opponentTotalScore');
		const playerScoreDisplay = document.getElementById('playerTotalScore');
		
		// ✅ ОЧИЩАЕМ только контейнер карт погоды, не весь слот
		const weatherContainer = weatherSlot.querySelector('.weather-cards-container');
		if (weatherContainer) {
			weatherContainer.remove();
		}
		
		// ✅ СОЗДАЕМ новый контейнер для карт погоды если есть карты
		if (this.gameState.weather.cards.length > 0) {
			console.log(`🌧️ Отображение ${this.gameState.weather.cards.length} карт погоды`);
			
			const newWeatherContainer = document.createElement('div');
			newWeatherContainer.className = 'weather-cards-container';
			
			// ✅ УБЕДИТЕСЬ что отображаем только уникальные карты
			const uniqueCards = [];
			const seenCardIds = new Set();
			
			this.gameState.weather.cards.forEach((card, index) => {
				if (!seenCardIds.has(card.id)) {
					seenCardIds.add(card.id);
					uniqueCards.push(card);
					
					const cardElement = this.createWeatherCardElement(card, index);
					newWeatherContainer.appendChild(cardElement);
				} else {
					console.log(`⚠️ Пропущена дублирующая карта погоды: ${card.name}`);
				}
			});

			weatherSlot.appendChild(newWeatherContainer);
		} else {
			console.log('🌤️ Нет карт погоды для отображения');
		}
		
		// ✅ ВОССТАНАВЛИВАЕМ счетчики если они были удалены
		if (!opponentScoreDisplay || !document.getElementById('opponentTotalScore')) {
			this.restoreScoreDisplays();
		}
		
		// Обновляем счетчик карт погоды
		this.updateWeatherCounter();
	},

	restoreScoreDisplays: function() {
		console.log('🔄 Восстановление счетчиков очков');
		
		const weatherSlot = document.getElementById('weatherSlot');
		if (!weatherSlot) return;
		
		// Проверяем и восстанавливаем счетчик противника
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
					background: url('gwent/score.png') center/contain no-repeat;
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
		
		// Проверяем и восстанавливаем счетчик игрока
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
					background: url('gwent/score.png') center/contain no-repeat;
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
		
		// ✅ ОБНОВЛЯЕМ значения счетчиков после восстановления
		this.updateTotalScoreDisplays();
		
		console.log('✅ Счетчики очков восстановлены');
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
		
		// ✅ ОБНОВЛЯЕМ индикатор раундов и побед
		this.updateRoundCounter();
		this.updateWinsIndicator();
	},

	updateRoundCounter: function() {
		const roundImage = document.getElementById('roundImage');
		if (!roundImage) return;
		
		// Обновляем изображение раунда
		const roundImages = {
			1: 'gwent/round1.png',
			2: 'gwent/round2.png', 
			3: 'gwent/round3.png'
		};
		
		roundImage.src = roundImages[this.gameState.currentRound] || 'gwent/round1.png';
		roundImage.alt = `Раунд ${this.gameState.currentRound}`;
		
		// Добавляем анимацию при смене раунда
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

  // === ИНИЦИАЛИЗАЦИЯ ДАННЫХ ===

    loadPlayerDeck: function() {
        if (window.deckModule && window.deckModule.currentDeck) {
            const playerDeck = window.deckModule.currentDeck;
            
            this.gameState.player.deck = [...playerDeck.cards];
            this.gameState.player.faction = playerDeck.faction;
            this.gameState.player.ability = playerDeck.ability;
            
            console.log('Колода игрока загружена:', {
                faction: this.gameState.player.faction,
                totalCards: this.gameState.player.deck.length,
                ability: this.gameState.player.ability
            });
            
        } else {
            console.error('Колода игрока не найдена!');
            this.loadDemoDeck('player');
        }
        
        this.displayPlayerDeck();
    },

    loadOpponentDeck: function() {
        console.log('Загрузка колоды противника...');
        
        const availableFactions = this.getAvailableFactions();
        if (availableFactions.length === 0) {
            availableFactions.push(...Object.values(window.factionModule?.factionsData || {}));
        }
        
        const randomFaction = availableFactions[Math.floor(Math.random() * availableFactions.length)];
        console.log('Противник выбрал фракцию:', randomFaction.name);
        
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
            description: factionData.description,
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
            description: factionData.description,
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
        const handSize = 10;
        
        this.gameState.player.hand = this.gameState.player.deck.splice(0, 
            Math.min(handSize, this.gameState.player.deck.length));
        this.gameState.opponent.hand = this.gameState.opponent.deck.splice(0, 
            Math.min(handSize, this.gameState.opponent.deck.length));

        this.displayPlayerHand();
        this.displayPlayerDeck();
        this.displayOpponentDeck();
    },
	
    // === ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ДАННЫХ ===
	
    getAvailableFactions: function() {
        const allFactions = Object.values(window.factionModule?.factionsData || {});
        const playerFaction = this.gameState.player.faction;
        return playerFaction ? allFactions.filter(faction => faction.id !== playerFaction) : allFactions;
    },

    createBalancedDeck: function(factionCards, factionId) {
        const deck = [];
        const unitCards = [...(factionCards.units || [])];
        const specialCards = [...(factionCards.specials || [])];
        const artifactCards = [...(factionCards.artifacts || [])];
        const tacticCards = [...(factionCards.tactics || [])];
        
        const neutralCards = window.cardsModule?.getFactionCards('neutral');
        if (neutralCards) {
            unitCards.push(...(neutralCards.units || []).slice(0, 3));
            specialCards.push(...(neutralCards.specials || []).slice(0, 2));
        }
        
        this.shuffleArray(unitCards);
        this.shuffleArray(specialCards);
        this.shuffleArray(artifactCards);
        this.shuffleArray(tacticCards);
        
        const targetDeckSize = 25 + Math.floor(Math.random() * 6);
        const unitCount = Math.floor(targetDeckSize * 0.7);
        const specialCount = Math.floor(targetDeckSize * 0.2);
        
        deck.push(...unitCards.slice(0, Math.min(unitCount, unitCards.length)));
        deck.push(...specialCards.slice(0, Math.min(specialCount, specialCards.length)));
        
        const remainingCount = targetDeckSize - deck.length;
        if (remainingCount > 0) {
            const availableArtifactsTactics = [...artifactCards, ...tacticCards];
            this.shuffleArray(availableArtifactsTactics);
            deck.push(...availableArtifactsTactics.slice(0, Math.min(remainingCount, availableArtifactsTactics.length)));
        }
        
        this.shuffleArray(deck);
        return deck;
    },

    getRandomFactionAbility: function(factionId) {
        const abilities = window.deckModule?.factionAbilities?.[factionId];
        return abilities && abilities.length > 0 ? 
            abilities[Math.floor(Math.random() * abilities.length)].id : 'default_ability';
    },

    shuffleArray: function(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    },

	startNewRound: function() {
		this.gameState.currentRound++;
		
		console.log(`🔄 Начало раунда ${this.gameState.currentRound}`);
		
		// Анимируем смену раунда
		this.updateRoundCounter();
		
		// Сбрасываем состояние раунда
		this.resetRoundState();
		
		// ✅ РАЗДАЕМ карты до 10
		this.dealAdditionalCards();
		
		// Начинаем ход игрока
		this.startPlayerTurn();
		
		// Показываем сообщение о начале нового раунда
		this.showGameMessage(`Начало раунда ${this.gameState.currentRound}`, 'info');
		
		console.log(`✅ Раунд ${this.gameState.currentRound} начат`);
	},

    // === ОТОБРАЖЕНИЕ ЭЛЕМЕНТОВ ИНТЕРФЕЙСА ===

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
		const cardBackPath = `faction/${faction}/card.png`;
		
		discardElement.innerHTML = `
			<div class="discard-stack">
				<img src="${cardBackPath}" alt="Сброс игрока" class="discard-card-back"
					 onerror="this.src='faction/neutral/card_neutral.png'">
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
		const cardBackPath = `faction/${faction}/card.png`;
		
		discardElement.innerHTML = `
			<div class="discard-stack">
				<img src="${cardBackPath}" alt="Сброс противника" class="discard-card-back opponent-discard-back"
					 onerror="this.src='faction/neutral/card.png'">
				<div class="discard-count opponent-discard-count">${this.gameState.opponent.discard.length}</div>
			</div>
		`;

		discardSlot.appendChild(discardElement);
	},

    createLeaderCardElement: function(leaderData, owner) {
        const leaderElement = document.createElement('div');
        leaderElement.className = `leader-card-on-board ${owner === 'opponent' ? 'opponent-leader' : ''}`;
        leaderElement.dataset.cardId = leaderData.id;
        
        leaderElement.innerHTML = `
            <div class="leader-card-container ${owner === 'opponent' ? 'opponent-leader-container' : ''}">
                <video class="leader-card-media ${owner === 'opponent' ? 'opponent-leader-media' : ''}" 
                       autoplay loop muted playsinline>
                    <source src="faction/${leaderData.faction}/leader.mp4" type="video/mp4">
                </video>
                <img src="${leaderData.border}" alt="Рамка" class="leader-card-border">
                <img src="${leaderData.banner}" alt="Баннер" class="leader-card-banner">
                <div class="leader-card-name ${owner === 'opponent' ? 'opponent-leader-name' : ''}">${leaderData.name}</div>
            </div>
        `;

        this.setupLeaderCardEventListeners(leaderElement, leaderData);
        return leaderElement;
    },
	
// === МЕТОДЫ ОТОБРАЖЕНИЯ ДЛЯ ПРОТИВНИКА ===

	createOpponentBoardCardElement: function(card) {
		console.log('🃏 Создание карты противника:', card.name);
		
		const cardElement = document.createElement('div');
		cardElement.className = `board-card opponent-card ${card.type} ${card.rarity}`;
		cardElement.dataset.cardId = card.id;
		
		const mediaPath = `card/${card.faction}/${card.image}`;
		const isVideo = card.image && card.image.endsWith('.mp4');

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

		// Обработчики для карты противника
		cardElement.addEventListener('contextmenu', (event) => {
			event.preventDefault();
			this.showCardModal(card);
		});

		cardElement.addEventListener('mouseenter', () => {
			audioManager.playSound('touch');
			
			const video = cardElement.querySelector('video');
			if (video) {
				video.currentTime = 0;
				video.play().catch(e => console.log('Воспроизведение видео противника:', e));
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

		// Анимация появления
		cardElement.style.animation = 'cardAppear 0.5s ease-out';

		return cardElement;
	},

	displayOpponentCardOnRow: function(row, card) {
		console.log('🎯 Отображение карты противника в ряду:', row, card.name);
		
		const rowElement = document.getElementById(`opponent${this.capitalizeFirst(row)}Row`);
		if (!rowElement) {
			console.error('❌ Не найден элемент ряда:', `opponent${this.capitalizeFirst(row)}Row`);
			return;
		}

		const cardElement = this.createOpponentBoardCardElement(card);
		rowElement.appendChild(cardElement);
	},

	displayOpponentTacticCard: function(row, card) {
		console.log('🎯 Отображение тактики противника в ряду:', row, card.name);
		
		const tacticSlot = document.getElementById(`opponent${this.capitalizeFirst(row)}Tactics`);
		if (!tacticSlot) {
			console.error('❌ Не найден слот тактики:', `opponent${this.capitalizeFirst(row)}Tactics`);
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
	
    // === ОБРАБОТЧИКИ СОБЫТИЙ ИНТЕРФЕЙСА ===

	setupEventListeners: function() {
		console.log('🎮 Настройка обработчиков событий игры...');
		
		// Обработчики для кнопок управления
		const passBtn = document.getElementById('passBtn');
		const endTurnBtn = document.getElementById('endTurnBtn');

		if (passBtn) {
			passBtn.addEventListener('click', () => {
				// ВЫЗЫВАЕМ МЕТОД ИЗ playerModule
				if (window.playerModule && window.playerModule.handlePass) {
					window.playerModule.handlePass();
				}
			});
			passBtn.addEventListener('mouseenter', () => audioManager.playSound('touch'));
		}

		if (endTurnBtn) {
			endTurnBtn.addEventListener('click', () => {
				// ВЫЗЫВАЕМ МЕТОД ИЗ playerModule
				if (window.playerModule && window.playerModule.handleEndTurn) {
					window.playerModule.handleEndTurn();
				}
			});
			endTurnBtn.addEventListener('mouseenter', () => audioManager.playSound('touch'));
		}

		// Обработчики для колод и сбросов
		this.setupDeckViewEventListeners();
	},

	setupDeckViewEventListeners: function() {
		// Колода игрока
		const playerDeck = document.getElementById('playerDeck');
		if (playerDeck) {
			playerDeck.addEventListener('click', () => {
				if (this.gameState.player.deck.length > 0) {
					this.showDeckModal('player', 'deck', 'Колода');
				}
			});
			playerDeck.addEventListener('mouseenter', () => audioManager.playSound('touch'));
		}

		// Сброс игрока
		const playerDiscard = document.getElementById('playerDiscard');
		if (playerDiscard) {
			playerDiscard.addEventListener('click', () => {
				if (this.gameState.player.discard.length > 0) {
					this.showDeckModal('player', 'discard', 'Сброс');
				}
			});
			playerDiscard.addEventListener('mouseenter', () => audioManager.playSound('touch'));
		}

		// Сброс противника - ТОЛЬКО ЕСЛИ ЕСТЬ КАРТЫ
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
				// ВЫЗЫВАЕМ МЕТОД ИЗ playerModule вместо this.handleCardSelection
				if (window.playerModule && window.playerModule.handleCardSelection) {
					window.playerModule.handleCardSelection(card, cardElement);
				} else {
					console.error('❌ playerModule не доступен');
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
				video.play().catch(e => console.log('Воспроизведение видео:', e));
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

    generateDeckCardsHTML: function(cards) {
		return cards.map(card => {
			const mediaPath = `card/${card.faction}/${card.image}`;
			const isVideo = card.image && card.image.endsWith('.mp4');
			
			let mediaElement = isVideo ? 
				`<video class="deck-card__media" muted playsinline preload="metadata"><source src="${mediaPath}" type="video/mp4"></video>` :
				`<img src="${mediaPath}" alt="${card.name}" class="deck-card__media">`;

			let strengthElement = card.strength ? 
				`<div class="deck-card__strength">${card.strength}</div>` : '';

			let typeIconElement = !card.strength ? 
				`<div class="deck-card__type-icon"><img src="${this.getTypeIconPath(card.type)}" alt="${card.type}"></div>` : '';

			// ДОБАВЛЯЕМ ПОЗИЦИЮ ДЛЯ ЮНИТОВ
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
        // Проверяем по тегам или названию
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
    const rowElement = document.getElementById(`player${this.capitalizeFirst(row)}Row`);
    const opponentRowElement = document.getElementById(`opponent${this.capitalizeFirst(row)}Row`);
    
    this.removeVisualWeatherEffect(row);
    
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
        weatherOverlay.dataset.weatherSide = 'player';
        rowElement.style.position = 'relative';
        rowElement.appendChild(weatherOverlay);
    }
    
    if (opponentRowElement) {
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
        weatherOverlay.dataset.weatherSide = 'opponent';
        opponentRowElement.style.position = 'relative';
        opponentRowElement.appendChild(weatherOverlay);
    }
},

	removeVisualWeatherEffect: function(row) {
		// Убираем эффекты у игрока
		const playerEffects = document.querySelectorAll(`[data-weather-row="${row}"][data-weather-side="player"]`);
		playerEffects.forEach(effect => effect.remove());
		
		// Убираем эффекты у противника
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
            strengthElement.textContent = card.strength;
            
            // Добавляем визуальную индикацию уменьшенной силы
            if (card.strength === 1 && card.originalStrength > 1) {
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
		
		// Можно добавить визуальный счетчик если нужно
		console.log(`Карт погоды: ${weatherCount}/${maxWeather}`);
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
	
    // === МОДАЛЬНЫЕ ОКНА ===

    showDeckModal: function(player, deckType, title) {
		const cards = this.gameState[player][deckType];
		
		if (cards.length === 0) {
			return;
		}

		// Получаем фракцию для фона
		const faction = this.gameState[player].faction;
		const factionBackground = `faction/${faction}/border_faction.png`;
		
		// Сортируем карты по силе
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
					${this.generateDeckCardsHTML(sortedCards)}
				</div>
			</div>
		`;

		document.body.appendChild(modalOverlay);
		
		// Обработчики для модального окна
		this.setupDeckModalEventListeners(modalOverlay, sortedCards);
		
		// Активируем модальное окно
		setTimeout(() => {
			modalOverlay.classList.add('active');
		}, 10);
		
		audioManager.playSound('button');
	},

    setupDeckModalEventListeners: function(modalOverlay, cards) {
        // Закрытие по кнопке
        const closeBtn = modalOverlay.querySelector('.deck-modal__close');
        closeBtn.addEventListener('click', () => {
            this.closeDeckModal(modalOverlay);
        });

        // Закрытие по клику вне модального окна
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                this.closeDeckModal(modalOverlay);
            }
        });

        // Закрытие по Escape
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeDeckModal(modalOverlay);
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);

        // Обработчики для карт в модальном окне
        const cardElements = modalOverlay.querySelectorAll('.deck-card');
        cardElements.forEach(cardElement => {
            const cardId = cardElement.dataset.cardId;
            const card = cards.find(c => c.id === cardId);
            
            if (card) {
                // Левый клик - просмотр карты
                cardElement.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showCardModal(card);
                });

                // Правый клик - тоже просмотр карты
                cardElement.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.showCardModal(card);
                });

                // Воспроизведение видео при наведении
                const video = cardElement.querySelector('video');
                if (video) {
                    cardElement.addEventListener('mouseenter', () => {
                        video.currentTime = 0;
                        video.play().catch(e => console.log('Воспроизведение видео в модальном окне:', e));
                        video.loop = true;
                    });

                    cardElement.addEventListener('mouseleave', () => {
                        video.pause();
                        video.currentTime = 0;
                        video.loop = false;
                    });
                }

                cardElement.addEventListener('mouseenter', () => {
                    audioManager.playSound('touch');
                });
            }
        });

        // Сохраняем обработчик для последующего удаления
        modalOverlay.escapeHandler = escapeHandler;
    },

    closeDeckModal: function(modalOverlay) {
        modalOverlay.classList.remove('active');
        
        // Удаляем обработчик Escape
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
            window.showCardModal(card);
        } else {
            this.showBasicCardModal(card);
        }
        audioManager.playSound('button');
    },

    // === ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ИНТЕРФЕЙСА ===

    showMessage: function(text) {
        console.log('💬 Сообщение:', text);
        // Временная реализация - можно заменить на красивый попап
        alert(text);
    },
	
	showRoundResult: function(winner, playerScore, opponentScore) {
		console.log(`🏆 Результат раунда: ${winner}, Счет: ${playerScore}-${opponentScore}`);
		
		// Создаем оверлей для результата раунда в стиле игры
		const resultOverlay = document.createElement('div');
		resultOverlay.className = 'round-result-overlay';
		resultOverlay.style.cssText = `
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: rgba(0, 0, 0, 0.85);
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			z-index: 10000;
			font-family: 'Gwent', sans-serif;
		`;

		let resultImage, resultText, resultColor, borderColor;
		
		if (winner === 'player') {
			resultImage = 'gwent/win.png';
			resultText = 'ПОБЕДА В РАУНДЕ';
			resultColor = '#4CAF50';
			borderColor = '#4CAF50';
		} else if (winner === 'opponent') {
			resultImage = 'gwent/lose.png';
			resultText = 'ПОРАЖЕНИЕ В РАУНДЕ';
			resultColor = '#f44336';
			borderColor = '#f44336';
		} else {
			resultImage = 'gwent/draw.png';
			resultText = 'НИЧЬЯ В РАУНДЕ';
			resultColor = '#FFD700';
			borderColor = '#FFD700';
		}

		resultOverlay.innerHTML = `
			<div class="round-result-container" style="
				background: linear-gradient(145deg, #0a0a0a, #1a1a1a);
				border: 4px solid ${borderColor};
				border-radius: 15px;
				padding: 30px 40px;
				text-align: center;
				max-width: 500px;
				width: 90%;
				box-shadow: 0 10px 30px rgba(0,0,0,0.5);
				position: relative;
				overflow: hidden;
			">
				<!-- Декоративные элементы в стиле Gwent -->
				<div style="
					position: absolute;
					top: 0;
					left: 0;
					width: 100%;
					height: 4px;
					background: linear-gradient(90deg, transparent, ${borderColor}, transparent);
				"></div>
				
				<div style="
					position: absolute;
					bottom: 0;
					left: 0;
					width: 100%;
					height: 4px;
					background: linear-gradient(90deg, transparent, ${borderColor}, transparent);
				"></div>
				
				<img src="${resultImage}" alt="${resultText}" style="
					width: 120px;
					height: 120px;
					margin-bottom: 20px;
					filter: drop-shadow(0 0 10px ${resultColor}80);
				" onerror="this.style.display='none'">
				
				<h2 style="
					color: ${resultColor};
					margin: 0 0 15px 0;
					font-size: 24px;
					text-transform: uppercase;
					letter-spacing: 2px;
					text-shadow: 0 2px 4px rgba(0,0,0,0.5);
					font-weight: bold;
				">${resultText}</h2>
				
				<!-- Счет в стиле Gwent -->
				<div class="score-display" style="
					display: flex;
					justify-content: center;
					align-items: center;
					gap: 40px;
					margin: 25px 0;
					font-size: 22px;
					font-weight: bold;
					background: rgba(0,0,0,0.3);
					padding: 15px 25px;
					border-radius: 10px;
					border: 2px solid #333;
				">
					<div class="player-score" style="color: #4CAF50; text-align: center;">
						<div style="font-size: 14px; color: #888; margin-bottom: 5px; text-transform: uppercase;">Игрок</div>
						<div style="font-size: 28px;">${playerScore}</div>
					</div>
					
					<div style="color: #d4af37; font-size: 16px; font-weight: normal;">ПРОТИВ</div>
					
					<div class="opponent-score" style="color: #f44336; text-align: center;">
						<div style="font-size: 14px; color: #888; margin-bottom: 5px; text-transform: uppercase;">Противник</div>
						<div style="font-size: 28px;">${opponentScore}</div>
					</div>
				</div>
				
				<!-- Прогресс раундов -->
				<div class="rounds-progress" style="
					display: flex;
					justify-content: center;
					gap: 8px;
					margin: 20px 0;
				">
					${this.generateRoundsProgress()}
				</div>
				
				<!-- Информация о раунде -->
				<div class="round-info" style="
					color: #888;
					font-size: 14px;
					margin: 10px 0;
					text-transform: uppercase;
					letter-spacing: 1px;
				">
					Раунд ${this.gameState.currentRound} завершен
				</div>
				
				<button class="continue-btn" style="
					background: linear-gradient(145deg, ${resultColor}, ${this.darkenColor(resultColor, 20)});
					color: white;
					border: none;
					padding: 12px 35px;
					border-radius: 8px;
					font-size: 16px;
					font-weight: bold;
					cursor: pointer;
					margin-top: 15px;
					text-transform: uppercase;
					letter-spacing: 1px;
					transition: all 0.3s ease;
					border: 2px solid ${this.darkenColor(resultColor, 30)};
					box-shadow: 0 4px 8px rgba(0,0,0,0.3);
				">ПРОДОЛЖИТЬ</button>
			</div>
		`;

		document.body.appendChild(resultOverlay);
		
		// Добавляем анимацию появления
		this.animateResultAppear(resultOverlay);
		
		// Обработчик кнопки продолжения
		const continueBtn = resultOverlay.querySelector('.continue-btn');
		continueBtn.addEventListener('click', () => {
			audioManager.playSound('button');
			this.animateResultDisappear(resultOverlay);
		});
		
		continueBtn.addEventListener('mouseenter', () => {
			audioManager.playSound('touch');
			continueBtn.style.transform = 'scale(1.05)';
			continueBtn.style.boxShadow = '0 6px 12px rgba(0,0,0,0.4)';
		});
		
		continueBtn.addEventListener('mouseleave', () => {
			continueBtn.style.transform = 'scale(1)';
			continueBtn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
		});
		
		// Автоматическое закрытие через 5 секунд
		setTimeout(() => {
			if (document.body.contains(resultOverlay)) {
				this.animateResultDisappear(resultOverlay);
			}
		}, 5000);
	},

	generateRoundsProgress: function() {
		let progressHTML = '';
		const totalRounds = this.gameState.totalRounds;
		const playerWins = this.gameState.roundsWon.player;
		const opponentWins = this.gameState.roundsWon.opponent;
		
		// ✅ УЧИТЫВАЕМ что оба могут иметь очки из-за ничьих
		const maxWins = Math.max(playerWins, opponentWins);
		
		for (let i = 1; i <= totalRounds; i++) {
			let roundClass, roundSymbol, roundColor, tooltip;
			
			if (i <= playerWins && i <= opponentWins) {
				// ✅ НИЧЬЯ - оба имеют очко за этот раунд
				roundClass = 'draw';
				roundSymbol = '＝';
				roundColor = '#FFD700';
				tooltip = 'Ничья';
			} else if (i <= playerWins) {
				roundClass = 'player-win';
				roundSymbol = '✓';
				roundColor = '#4CAF50';
				tooltip = 'Победа игрока';
			} else if (i <= opponentWins) {
				roundClass = 'opponent-win';
				roundSymbol = '✗';
				roundColor = '#f44336';
				tooltip = 'Победа противника';
			} else {
				roundClass = 'empty';
				roundSymbol = i;
				roundColor = '#666';
				tooltip = 'Раунд не сыгран';
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
					border: 2px solid ${roundColor};
					position: relative;
					cursor: help;
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
		const resultOverlay = document.createElement('div');
		resultOverlay.className = 'game-result-overlay';
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

		let resultImage, resultText, resultColor;
		const finalScore = `${this.gameState.roundsWon.player}-${this.gameState.roundsWon.opponent}`;
		
		if (winner === 'player') {
			resultImage = 'gwent/win.png';
			resultText = 'ПОБЕДА В МАТЧЕ!';
			resultColor = '#4CAF50';
		} else if (winner === 'opponent') {
			resultImage = 'gwent/lose.png';
			resultText = 'ПОРАЖЕНИЕ В МАТЧЕ';
			resultColor = '#f44336';
		} else {
			resultImage = 'gwent/draw.png';
			resultText = 'НИЧЬЯ В МАТЧЕ!';
			resultColor = '#FFD700';
		}

		resultOverlay.innerHTML = `
			<div class="game-result-container" style="
				background: linear-gradient(145deg, #1a1a1a, #2a2a2a);
				border: 4px solid ${resultColor};
				border-radius: 20px;
				padding: 40px;
				text-align: center;
				max-width: 600px;
				animation: resultAppear 0.5s ease-out;
			">
				<img src="${resultImage}" alt="${resultText}" style="
					width: 250px;
					height: 250px;
					margin-bottom: 30px;
				" onerror="this.style.display='none'">
				
				<h1 style="
					color: ${resultColor};
					margin: 0 0 20px 0;
					font-size: 36px;
					text-transform: uppercase;
					letter-spacing: 3px;
					text-shadow: 0 2px 10px rgba(0,0,0,0.5);
				">${resultText}</h1>
				
				<div class="final-score" style="
					font-size: 28px;
					font-weight: bold;
					margin: 20px 0;
					color: #fff;
				">
					ФИНАЛЬНЫЙ СЧЕТ: ${finalScore}
				</div>
				
				<div class="match-stats" style="
					display: flex;
					justify-content: space-around;
					margin: 30px 0;
					color: #ccc;
					font-size: 16px;
					width: 100%;
				">
					<div style="text-align: center;">
						<div style="color: #4CAF50; margin-bottom: 5px;">ПОБЕДЫ ИГРОКА</div>
						<div style="font-size: 24px; color: #4CAF50;">${this.gameState.roundsWon.player}</div>
					</div>
					<div style="text-align: center;">
						<div style="color: #FFD700; margin-bottom: 5px;">НИЧЬИ</div>
						<div style="font-size: 24px; color: #FFD700;">${Math.min(this.gameState.roundsWon.player, this.gameState.roundsWon.opponent)}</div>
					</div>
					<div style="text-align: center;">
						<div style="color: #f44336; margin-bottom: 5px;">ПОБЕДЫ ПРОТИВНИКА</div>
						<div style="font-size: 24px; color: #f44336;">${this.gameState.roundsWon.opponent}</div>
					</div>
				</div>
				
				<div class="action-buttons" style="
					display: flex;
					gap: 20px;
					justify-content: center;
					margin-top: 30px;
				">
					<button class="restart-btn" style="
						background: #2196F3;
						color: white;
						border: none;
						padding: 15px 30px;
						border-radius: 8px;
						font-size: 18px;
						font-weight: bold;
						cursor: pointer;
						text-transform: uppercase;
						letter-spacing: 1px;
						transition: all 0.3s ease;
					">ИГРАТЬ СНОВА</button>
					
					<button class="menu-btn" style="
						background: #666;
						color: white;
						border: none;
						padding: 15px 30px;
						border-radius: 8px;
						font-size: 18px;
						font-weight: bold;
						cursor: pointer;
						text-transform: uppercase;
						letter-spacing: 1px;
						transition: all 0.3s ease;
					">ГЛАВНОЕ МЕНЮ</button>
				</div>
			</div>
		`;

		document.body.appendChild(resultOverlay);
		
		// Обработчики кнопок
		const restartBtn = resultOverlay.querySelector('.restart-btn');
		const menuBtn = resultOverlay.querySelector('.menu-btn');
		
		restartBtn.addEventListener('click', () => {
			audioManager.playSound('button');
			document.body.removeChild(resultOverlay);
			this.restartGame();
		});
		
		menuBtn.addEventListener('click', () => {
			audioManager.playSound('button');
			document.body.removeChild(resultOverlay);
			this.returnToMainMenu();
		});
	},

	restartGame: function() {
		console.log('🔄 Перезапуск игры');
		// Перезагружаем страницу для простоты
		window.location.reload();
	},

	returnToMainMenu: function() {
		console.log('🏠 Возврат в главное меню');
		// Скрываем игровое поле и показываем главное меню
		const gameBoard = document.querySelector('.game-board');
		const startPage = document.querySelector('.start-page');
		
		if (gameBoard) gameBoard.style.display = 'none';
		if (startPage) startPage.style.display = 'block';
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

	// === ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ДЛЯ АНИМАЦИЙ ===

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
		// Упрощенная функция затемнения цвета
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

	startNewRound: function() {
		this.gameState.currentRound++;
		
		// Анимируем смену раунда
		this.updateRoundCounter();
		
		this.resetRoundState();
		this.dealAdditionalCards();
		this.startPlayerTurn();
		
		// Показываем сообщение о начале нового раунда
		this.showGameMessage(`Начало раунда ${this.gameState.currentRound}`, 'info');
	},

	// === СИСТЕМА СООБЩЕНИЙ ===

	showGameMessage: function(text, type = 'info') {
		console.log(`💬 ${type.toUpperCase()}: ${text}`);
		
		// Создаем или находим контейнер для сообщений
		let messageContainer = document.getElementById('gameMessages');
		if (!messageContainer) {
			messageContainer = document.createElement('div');
			messageContainer.id = 'gameMessages';
			messageContainer.style.cssText = `
				position: fixed;
				top: 20px;
				left: 50%;
				transform: translateX(-50%);
				z-index: 10000;
				display: flex;
				flex-direction: column;
				gap: 10px;
				max-width: 400px;
			`;
			document.body.appendChild(messageContainer);
		}
		
		// Создаем сообщение
		const messageElement = document.createElement('div');
		messageElement.className = `game-message game-message-${type}`;
		messageElement.style.cssText = `
			background: ${type === 'info' ? 'rgba(212, 175, 55, 0.9)' : 
						 type === 'warning' ? 'rgba(255, 165, 0, 0.9)' : 
						 'rgba(40, 167, 69, 0.9)'};
			color: white;
			padding: 15px 20px;
			border-radius: 10px;
			border: 2px solid #d4af37;
			text-align: center;
			font-family: 'Gwent', sans-serif;
			font-size: 16px;
			text-transform: uppercase;
			letter-spacing: 1px;
			box-shadow: 0 5px 15px rgba(0,0,0,0.3);
			animation: messageAppear 0.3s ease-out;
		`;
		
		messageElement.textContent = text;
		messageContainer.appendChild(messageElement);
		
		// Автоматическое удаление через 3 секунды
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

	addMessageStyles: function() {
		const style = document.createElement('style');
		style.textContent = `
			@keyframes messageAppear {
				from { 
					opacity: 0; 
					transform: translateY(-20px) translateX(-50%); 
				}
				to { 
					opacity: 1; 
					transform: translateY(0) translateX(-50%); 
				}
			}
			
			@keyframes messageDisappear {
				from { 
					opacity: 1; 
					transform: translateY(0) translateX(-50%); 
				}
				to { 
					opacity: 0; 
					transform: translateY(-20px) translateX(-50%); 
				}
			}
		`;
		document.head.appendChild(style);
	},

};

window.gameModule = gameModule;
