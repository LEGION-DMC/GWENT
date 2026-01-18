const playerModule = {
    gameState: null,
    
    init: function(gameState) {
        this.gameState = gameState;
    },
    
    handleCardSelection: function(card, cardElement) {
    if (this.gameState.mulligan.phase === 'player') {
        return;
    }
    
    if (this.gameState.gamePhase !== 'playerTurn') {
        return;
    }
    
    if (this.gameState.selectingRow) {
        this.cancelRowSelection();
        return;
    }
    
    if (this.gameState.selectedCardElement && this.gameState.selectedCardElement !== cardElement) {
        this.gameState.selectedCardElement.classList.remove('card-selected');
    }
    
    if (this.gameState.selectedCard === card) {
        this.cancelCardSelection();
        this.cancelRowSelection();
        return;
    }
    
    this.gameState.selectedCard = card;
    this.gameState.selectedCardElement = cardElement;
    
    if (cardElement) {
        cardElement.classList.add('card-selected');
    }
    
    audioManager.playSound('card_selected');

    if (this.isWeatherCard(card)) {
        this.playWeatherCard(card);
    } else {
        switch (card.type) {
            case 'tactic':
                this.startTacticCardPlacement(card);
                break;
            case 'unit':
                this.startUnitCardPlacement(card);
                break;
            case 'special':
				if (card.ability === 'decoy') {
					this.startDecoyCardPlacement(card);
				} else if (card.ability === 'destroy') {
					this.startDestroyCardPlacement(card);
				} else if (card.ability === 'destroy_artf') {
					this.startDestroyArtifactPlacement(card);
				} else if (card.ability && card.ability.startsWith('damage_')) {
					this.startDamageCardPlacement(card); // Новая функция
				} else {
					this.startUnitCardPlacement(card);
				}
				break;
            case 'artifact':
                this.startUnitCardPlacement(card);
                break;
            default:
                this.cancelCardSelection();
        }
    }
},

	startDamageCardPlacement: function(card) {
		const ability = card.ability;
		
		if (ability === 'damage_row_1' || ability === 'damage_row_2' || ability === 'damage_row_3') {
			// Для урона по ряду - выбор ряда
			this.startRowDamagePlacement(card);
		} else {
			// Для урона по единичной карте - выбор карты
			this.startUnitDamagePlacement(card);
		}
	},

	startUnitDamagePlacement: function(card) {
		this.gameState.selectingRow = true;
		this.gameState.placementType = 'unit_damage';
		this.gameState.damageCard = card;
		this.highlightEnemyUnitsForDamage(card);
	},

	highlightEnemyUnitsForDamage: function(damageCard) {
		const rows = ['close', 'ranged', 'siege'];
		const damageValue = this.getDamageValueFromAbility(damageCard.ability);
		
		rows.forEach(row => {
			const rowCards = this.gameState.opponent.rows[row].cards;
			
			rowCards.forEach((unitCard, index) => {
				if (unitCard.type === 'unit' && unitCard.strength > 0) {
					const cardElement = this.getCardElementOnBoard(unitCard, row, 'opponent');
					if (cardElement) {
						cardElement.classList.add('damage-target');
						cardElement.dataset.damageValue = damageValue;
						this.setupDamageSelectionHandler(cardElement, damageCard, unitCard, row);
					}
				}
			});
		});
	},

	startRowDamagePlacement: function(card) {
		this.gameState.selectingRow = true;
		this.gameState.placementType = 'row_damage';
		this.gameState.damageCard = card;
		this.highlightEnemyRowsForDamage(card);
	},

	highlightEnemyRowsForDamage: function(damageCard) {
		const rows = ['close', 'ranged', 'siege'];
		const damageValue = this.getDamageValueFromAbility(damageCard.ability);
		
		rows.forEach(row => {
			const rowElement = document.getElementById(`opponent${this.capitalizeFirst(row)}Row`);
			if (rowElement) {
				const hasUnits = this.gameState.opponent.rows[row].cards.some(card => 
					card.type === 'unit' && card.strength > 0
				);
				
				if (hasUnits) {
					rowElement.classList.add('row-damage-target');
					rowElement.dataset.damageValue = damageValue;
					this.setupRowDamageSelectionHandler(rowElement, damageCard, row);
				}
			}
		});
	},

	getDamageValueFromAbility: function(ability) {
		const damageMatch = ability.match(/damage_(\d+)/);
		if (damageMatch && damageMatch[1]) {
			return parseInt(damageMatch[1]);
		}
		
		const rowDamageMatch = ability.match(/damage_row_(\d+)/);
		if (rowDamageMatch && rowDamageMatch[1]) {
			return parseInt(rowDamageMatch[1]);
		}
		
		return 1; // Значение по умолчанию
	},

	setupDamageSelectionHandler: function(cardElement, damageCard, targetCard, row) {
		const clickHandler = () => {
			if (this.gameState.selectingRow && this.gameState.placementType === 'unit_damage') {
				this.executeUnitDamage(damageCard, targetCard, row);
				cardElement.removeEventListener('click', clickHandler);
			}
		};
		
		cardElement.addEventListener('click', clickHandler);
		
		if (!this.gameState.damageSelectionHandlers) {
			this.gameState.damageSelectionHandlers = [];
		}
		this.gameState.damageSelectionHandlers.push({ 
			element: cardElement, 
			handler: clickHandler,
			card: targetCard
		});
	},

	setupRowDamageSelectionHandler: function(rowElement, damageCard, row) {
		const clickHandler = () => {
			if (this.gameState.selectingRow && this.gameState.placementType === 'row_damage') {
				this.executeRowDamage(damageCard, row);
				rowElement.removeEventListener('click', clickHandler);
			}
		};
		
		rowElement.addEventListener('click', clickHandler);
		
		if (!this.gameState.rowDamageSelectionHandlers) {
			this.gameState.rowDamageSelectionHandlers = [];
		}
		this.gameState.rowDamageSelectionHandlers.push({ 
			element: rowElement, 
			handler: clickHandler,
			row: row
		});
	},

	executeUnitDamage: function(damageCard, targetCard, row) {
		const damageValue = this.getDamageValueFromAbility(damageCard.ability);
		
		// Удаляем карту урона из руки
		this.removeCardFromHand(damageCard);
		
		// Добавляем карту урона в сброс игрока
		const damageCardCopy = { ...damageCard };
		this.gameState.player.discard.push(damageCardCopy);
		
		// Сохраняем оригинальную силу если еще не сохранена
		if (targetCard.originalStrength === undefined) {
			targetCard.originalStrength = targetCard.strength;
		}
		
		// Применяем урон через displayStrength
		const currentDisplayStrength = targetCard._displayStrength !== undefined ? 
			targetCard._displayStrength : targetCard.strength;
		
		targetCard._displayStrength = Math.max(0, currentDisplayStrength - damageValue);
		
		// Визуальный эффект урона
		this.createDamageVisualEffect(targetCard, row, damageValue);
		
		// Обновляем отображение силы
		if (window.gameModule) {
			window.gameModule.updateCardStrengthDisplay(targetCard, row, 'opponent');
		}
		
		// Если карта уничтожена
		if (targetCard._displayStrength === 0) {
			// Удаляем карту из ряда
			const rowState = this.gameState.opponent.rows[row];
			const cardIndex = rowState.cards.findIndex(c => c.id === targetCard.id);
			if (cardIndex !== -1) {
				const destroyedCard = { ...rowState.cards[cardIndex] };
				rowState.cards.splice(cardIndex, 1);
				this.gameState.opponent.discard.push(destroyedCard);
				
				// Обновляем отображение
				setTimeout(() => {
					if (window.gameModule) {
						window.gameModule.removeCardFromBoardVisual(targetCard, row, 'opponent');
					}
				}, 500);
			}
		}
		
		// Обновляем отображение
		if (window.gameModule) {
			window.gameModule.updateRowStrength(row, 'opponent');
			window.gameModule.displayPlayerDiscard();
			window.gameModule.displayOpponentDiscard();
			window.gameModule.completeCardPlay();
		}
		
		// Воспроизводим звук
		if (window.audioManager && window.audioManager.playSound) {
			audioManager.playSound('card_damage');
		}
		
		// Сбрасываем состояние
		this.cancelDamageSelection();
	},

	executeRowDamage: function(damageCard, row) {
		const damageValue = this.getDamageValueFromAbility(damageCard.ability);
		
		// Удаляем карту урона из руки
		this.removeCardFromHand(damageCard);
		
		// Добавляем карту урона в сброс игрока
		const damageCardCopy = { ...damageCard };
		this.gameState.player.discard.push(damageCardCopy);
		
		const rowState = this.gameState.opponent.rows[row];
		let destroyedCards = [];
		
		// Применяем урон ко всем картам в ряду
		rowState.cards.forEach(card => {
			if (card.type === 'unit' && card.strength > 0) {
				// Сохраняем оригинальную силу если еще не сохранена
				if (card.originalStrength === undefined) {
					card.originalStrength = card.strength;
				}
				
				// Применяем урон через displayStrength
				const currentDisplayStrength = card._displayStrength !== undefined ? 
					card._displayStrength : card.strength;
				
				card._displayStrength = Math.max(0, currentDisplayStrength - damageValue);
				
				// Визуальный эффект урона
				this.createDamageVisualEffect(card, row, damageValue);
				
				// Обновляем отображение силы
				if (window.gameModule) {
					window.gameModule.updateCardStrengthDisplay(card, row, 'opponent');
				}
				
				if (card._displayStrength === 0) {
					destroyedCards.push(card);
				}
			}
		});
		
		// Удаляем уничтоженные карты
		destroyedCards.forEach(destroyedCard => {
			const cardIndex = rowState.cards.findIndex(c => c.id === destroyedCard.id);
			if (cardIndex !== -1) {
				const destroyedCardCopy = { ...rowState.cards[cardIndex] };
				rowState.cards.splice(cardIndex, 1);
				this.gameState.opponent.discard.push(destroyedCardCopy);
			}
		});
		
		// Обновляем отображение
		if (window.gameModule) {
			// Обновляем силу ряда
			window.gameModule.updateRowStrength(row, 'opponent');
			
			// Обновляем сбросы
			window.gameModule.displayPlayerDiscard();
			window.gameModule.displayOpponentDiscard();
			
			// Завершаем ход
			window.gameModule.completeCardPlay();
		}
		
		// Воспроизводим звук
		if (window.audioManager && window.audioManager.playSound) {
			audioManager.playSound('card_damage');
		}
		
		// Сбрасываем состояние
		this.cancelDamageSelection();
	},

	createDamageVisualEffect: function(card, row, damageValue) {
		const rowElement = document.getElementById(`opponent${this.capitalizeFirst(row)}Row`);
		if (!rowElement) return;
		
		const cardElement = rowElement.querySelector(`[data-card-id="${card.id}"]`);
		if (!cardElement) return;
		
		// Создаем эффект урона
		const damageOverlay = document.createElement('div');
		damageOverlay.className = 'card-damage-overlay';
		damageOverlay.textContent = `-${damageValue}`;
		damageOverlay.style.cssText = `
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			color: #ff4444;
			font-size: 24px;
			font-weight: bold;
			text-shadow: 0 0 5px black;
			z-index: 100;
			pointer-events: none;
			animation: damageAnimation 0.8s ease-out forwards;
		`;
		
		cardElement.appendChild(damageOverlay);
		
		// Удаляем эффект через 0.8 секунды
		setTimeout(() => {
			if (damageOverlay.parentNode) {
				damageOverlay.remove();
			}
		}, 800);
	},

	cancelDamageSelection: function() {
		// Убираем подсветку целей
		this.removeDamageHighlights();
		
		// Очищаем обработчики
		if (this.gameState.damageSelectionHandlers) {
			this.gameState.damageSelectionHandlers.forEach(({ element, handler }) => {
				element.removeEventListener('click', handler);
			});
			this.gameState.damageSelectionHandlers = [];
		}
		
		if (this.gameState.rowDamageSelectionHandlers) {
			this.gameState.rowDamageSelectionHandlers.forEach(({ element, handler }) => {
				element.removeEventListener('click', handler);
			});
			this.gameState.rowDamageSelectionHandlers = [];
		}
		
		// Сбрасываем состояние
		this.cancelRowSelection();
	},

	removeDamageHighlights: function() {
		// Убираем подсветку карт
		const highlightedCards = document.querySelectorAll('.damage-target');
		highlightedCards.forEach(card => {
			card.classList.remove('damage-target');
			delete card.dataset.damageValue;
		});
		
		// Убираем подсветку рядов
		const highlightedRows = document.querySelectorAll('.row-damage-target');
		highlightedRows.forEach(row => {
			row.classList.remove('row-damage-target');
			delete row.dataset.damageValue;
		});
	},

	startDestroyArtifactPlacement: function(card) {
		this.gameState.selectingRow = true;
		this.gameState.placementType = 'destroy_artifact';
		this.gameState.destroyArtifactCard = card;
		this.highlightEnemyArtifacts();
	},

	highlightEnemyArtifacts: function() {
		const rows = ['close', 'ranged', 'siege'];
		
		// Подсвечиваем тактические карты
		rows.forEach(row => {
			const tacticCard = this.gameState.opponent.rows[row].tactic;
			if (tacticCard) {
				const tacticSlot = document.getElementById(`opponent${this.capitalizeFirst(row)}Tactics`);
				if (tacticSlot) {
					tacticSlot.classList.add('artifact-target');
					this.setupArtifactSelectionHandler(tacticSlot, tacticCard, row, 'tactic');
				}
			}
		});
		
		// Подсвечиваем артефакты в рядах
		rows.forEach(row => {
			const rowCards = this.gameState.opponent.rows[row].cards;
			
			rowCards.forEach((card, index) => {
				if (card.type === 'artifact') {
					const cardElement = this.getCardElementOnBoard(card, row, 'opponent');
					if (cardElement) {
						cardElement.classList.add('artifact-target');
						this.setupArtifactSelectionHandler(cardElement, card, row, 'artifact', index);
					}
				}
			});
		});
		
		// Если нет артефактов для уничтожения
		const hasArtifacts = document.querySelectorAll('.artifact-target').length > 0;
		if (!hasArtifacts) {
			this.showMessage('У противника нет артефактов для уничтожения!');
			this.cancelCardSelection();
		}
	},

	setupArtifactSelectionHandler: function(element, card, row, type, position = null) {
		const clickHandler = () => {
			if (this.gameState.selectingRow && this.gameState.placementType === 'destroy_artifact') {
				this.executeArtifactDestroy(this.gameState.destroyArtifactCard, { card, row, type, position });
				element.removeEventListener('click', clickHandler);
			}
		};
		
		element.addEventListener('click', clickHandler);
		
		if (!this.gameState.artifactSelectionHandlers) {
			this.gameState.artifactSelectionHandlers = [];
		}
		this.gameState.artifactSelectionHandlers.push({ 
			element: element, 
			handler: clickHandler,
			card: card,
			row: row,
			type: type
		});
	},

	executeArtifactDestroy: function(destroyCard, artifactData) {
		const { card: targetCard, row: targetRow, type: targetType, position } = artifactData;
		
		// Удаляем Коратскую жару из руки
		this.removeCardFromHand(destroyCard);
		
		// Добавляем Коратскую жару в сброс игрока
		const destroyCardCopy = { ...destroyCard };
		this.gameState.player.discard.push(destroyCardCopy);
		
		// Удаляем артефакт противника
		if (targetType === 'tactic') {
			// Удаляем тактическую карту
			delete this.gameState.opponent.rows[targetRow].tactic;
			
			// Визуальный эффект
			this.createArtifactDestroyEffect(targetCard, targetRow, targetType);
			
			// Обновляем отображение тактического слота
			if (window.gameModule) {
				const tacticSlot = document.getElementById(`opponent${this.capitalizeFirst(targetRow)}Tactics`);
				if (tacticSlot) {
					tacticSlot.innerHTML = '';
				}
			}
		} else if (targetType === 'artifact') {
			// Удаляем артефакт из ряда
			const rowState = this.gameState.opponent.rows[targetRow];
			const cardIndex = rowState.cards.findIndex(c => c.id === targetCard.id);
			if (cardIndex !== -1) {
				// Создаем копию для сброса
				const destroyedCard = { ...rowState.cards[cardIndex] };
				
				// Удаляем из ряда
				rowState.cards.splice(cardIndex, 1);
				
				// Добавляем в сброс противника
				this.gameState.opponent.discard.push(destroyedCard);
				
				// Визуальный эффект
				this.createArtifactDestroyEffect(targetCard, targetRow, targetType);
				
				// Обновляем отображение
				if (window.gameModule) {
					// Удаляем карту с поля через задержку
					setTimeout(() => {
						window.gameModule.removeCardFromBoardVisual(targetCard, targetRow, 'opponent');
					}, 500);
					
					// Обновляем силу ряда
					window.gameModule.updateRowStrength(targetRow, 'opponent');
				}
			}
		}
		
		// Обновляем сбросы
		if (window.gameModule) {
			window.gameModule.displayPlayerDiscard();
			window.gameModule.displayOpponentDiscard();
			
			// Завершаем ход
			window.gameModule.completeCardPlay();
		}
		
		// Воспроизводим звук
		if (window.audioManager && window.audioManager.playSound) {
			audioManager.playSound('artefact');
			setTimeout(() => {
				audioManager.playSound('card_destroy');
			}, 300);
		}
		
		// Сбрасываем состояние
		this.cancelArtifactSelection();
	},

	createArtifactDestroyEffect: function(card, row, type) {
		let targetElement;
		
		if (type === 'tactic') {
			const tacticSlot = document.getElementById(`opponent${this.capitalizeFirst(row)}Tactics`);
			if (tacticSlot) {
				targetElement = tacticSlot.querySelector(`[data-card-id="${card.id}"]`);
			}
		} else {
			const rowElement = document.getElementById(`opponent${this.capitalizeFirst(row)}Row`);
			if (rowElement) {
				targetElement = rowElement.querySelector(`[data-card-id="${card.id}"]`);
			}
		}
		
		if (!targetElement) return;
		
		// Создаем эффект уничтожения
		const destroyOverlay = document.createElement('div');
		destroyOverlay.className = 'artifact-destroy-overlay';
		destroyOverlay.style.cssText = `
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: url('card/destroy_card.jpg') center/cover no-repeat;
			z-index: 100;
			border-radius: 5px;
			pointer-events: none;
			animation: destroyArtifactAnimation 1s ease-out forwards;
		`;
		
		targetElement.appendChild(destroyOverlay);
	},

	cancelArtifactSelection: function() {
		// Убираем подсветку целей
		this.removeArtifactHighlights();
		
		// Очищаем обработчики
		if (this.gameState.artifactSelectionHandlers) {
			this.gameState.artifactSelectionHandlers.forEach(({ element, handler }) => {
				element.removeEventListener('click', handler);
			});
			this.gameState.artifactSelectionHandlers = [];
		}
		
		// Сбрасываем состояние
		this.cancelRowSelection();
	},

	removeArtifactHighlights: function() {
		const highlightedArtifacts = document.querySelectorAll('.artifact-target');
		highlightedArtifacts.forEach(artifact => {
			artifact.classList.remove('artifact-target');
		});
	},

	startDestroyCardPlacement: function(card) {
		// Находим самую сильную карту противника
		const strongestEnemyCard = this.findStrongestEnemyCard();
		
		if (!strongestEnemyCard) {
			this.showMessage('У противника нет карт для уничтожения!');
			this.cancelCardSelection();
			return;
		}
		
		// Применяем Казнь
		this.executeDestroyCard(card, strongestEnemyCard);
	},

	findStrongestEnemyCard: function() {
		const rows = ['close', 'ranged', 'siege'];
		let strongestCard = null;
		let maxStrength = -1;
		let cardRow = null;
		
		rows.forEach(row => {
			const rowCards = this.gameState.opponent.rows[row].cards;
			rowCards.forEach(card => {
				if (card.type === 'unit') {
					const strength = card.strength || 0;
					if (strength > maxStrength) {
						maxStrength = strength;
						strongestCard = card;
						cardRow = row;
					}
				}
			});
		});
		
		return strongestCard ? { card: strongestCard, row: cardRow } : null;
	},

	executeDestroyCard: function(destroyCard, targetData) {
		const { card: targetCard, row: targetRow } = targetData;
		
		// Удаляем Казнь из руки
		this.removeCardFromHand(destroyCard);
		
		// Добавляем Казнь в сброс игрока
		const destroyCardCopy = { ...destroyCard };
		this.gameState.player.discard.push(destroyCardCopy);
		
		// Создаем визуальный эффект уничтожения
		this.createDestroyVisualEffect(targetCard, targetRow);
		
		// Удаляем карту противника из ряда
		const rowState = this.gameState.opponent.rows[targetRow];
		const cardIndex = rowState.cards.findIndex(c => c.id === targetCard.id);
		
		if (cardIndex !== -1) {
			// Создаем копию для сброса
			const destroyedCard = { ...rowState.cards[cardIndex] };
			
			// Удаляем из ряда
			rowState.cards.splice(cardIndex, 1);
			
			// Добавляем в сброс противника
			this.gameState.opponent.discard.push(destroyedCard);
			
			// Обновляем отображение
			if (window.gameModule) {
				// Удаляем карту с поля
				setTimeout(() => {
					window.gameModule.removeCardFromBoardVisual(targetCard, targetRow, 'opponent');
				}, 500);
				
				// Обновляем силу ряда
				window.gameModule.updateRowStrength(targetRow, 'opponent');
				
				// Обновляем сбросы
				window.gameModule.displayPlayerDiscard();
				window.gameModule.displayOpponentDiscard();
				
				// Завершаем ход
				window.gameModule.completeCardPlay();
			}
			
			// Воспроизводим звук
			if (window.audioManager && window.audioManager.playSound) {
				audioManager.playSound('scorch');
			}
		}
		
		// Сбрасываем состояние
		this.cancelCardSelection();
	},

	createDestroyVisualEffect: function(card, row) {
		const rowElement = document.getElementById(`opponent${this.capitalizeFirst(row)}Row`);
		if (!rowElement) return;
		
		const cardElement = rowElement.querySelector(`[data-card-id="${card.id}"]`);
		if (!cardElement) return;
		
		// Создаем эффект уничтожения
		const destroyOverlay = document.createElement('div');
		destroyOverlay.className = 'card-destroy-overlay';
		destroyOverlay.style.cssText = `
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: url('card/neutral/scorch.jpg') center/cover no-repeat;
			z-index: 100;
			border-radius: 5px;
			pointer-events: none;
			animation: destroyCardAnimation 1s ease-out forwards;
		`;
		
		cardElement.appendChild(destroyOverlay);
		
		// Воспроизводим звук уничтожения
		if (window.audioManager && window.audioManager.playSound) {
			audioManager.playSound('card_destroy');
		}
	},

	startDecoyCardPlacement: function(card) {
		this.gameState.selectingRow = true;
		this.gameState.placementType = 'decoy';
		this.gameState.decoyCard = card;
		this.highlightAvailableUnitsForDecoy();
	},

	highlightAvailableUnitsForDecoy: function() {
		const rows = ['close', 'ranged', 'siege'];
		
		rows.forEach(row => {
			const rowCards = this.gameState.player.rows[row].cards;
			
			rowCards.forEach((unitCard, index) => {
				if (unitCard.type === 'unit') {
					const cardElement = this.getCardElementOnBoard(unitCard, row, 'player');
					if (cardElement) {
						cardElement.classList.add('decoy-target');
						this.setupDecoySelectionHandler(cardElement, unitCard, row);
					}
				}
			});
		});
	},

	getCardElementOnBoard: function(card, row, owner) {
		const rowElement = document.getElementById(`${owner}${this.capitalizeFirst(row)}Row`);
		if (!rowElement) return null;
		
		const cardElements = rowElement.querySelectorAll('.board-card');
		for (let cardElement of cardElements) {
			if (cardElement.dataset.cardId === card.id) {
				return cardElement;
			}
		}
		return null;
	},

	setupDecoySelectionHandler: function(cardElement, card, row) {
		const clickHandler = () => {
			if (this.gameState.selectingRow && this.gameState.placementType === 'decoy') {
				this.placeDecoyCard(this.gameState.decoyCard, card, row);
				cardElement.removeEventListener('click', clickHandler);
			}
		};
		
		cardElement.addEventListener('click', clickHandler);
		
		if (!this.gameState.decoySelectionHandlers) {
			this.gameState.decoySelectionHandlers = [];
		}
		this.gameState.decoySelectionHandlers.push({ 
			element: cardElement, 
			handler: clickHandler,
			card: card
		});
	},

	placeDecoyCard: function(decoyCard, targetCard, row) {
		const rowState = this.gameState.player.rows[row];
		
		// Находим индекс целевой карты в ряду
		const targetIndex = rowState.cards.findIndex(card => card.id === targetCard.id);
		if (targetIndex === -1) {
			this.showMessage('Карта не найдена в ряду!');
			return;
		}
		
		// Создаем копию целевой карты для возврата в руку
		const cardCopy = { ...targetCard };
		cardCopy.playedThisRound = false;
		
		// Восстанавливаем оригинальную силу, если карта была под погодой
		if (cardCopy.originalStrength !== undefined) {
			cardCopy.strength = cardCopy.originalStrength;
			delete cardCopy.originalStrength;
		}
		
		// Удаляем Чучело из руки
		this.removeCardFromHand(decoyCard);
		
		// Добавляем копию карты в руку
		this.gameState.player.hand.push(cardCopy);
		
		// Заменяем карту на поле на Чучело
		const placedDecoy = { ...decoyCard };
		placedDecoy.owner = 'player';
		placedDecoy.row = row;
		placedDecoy.currentStrength = 1;
		
		rowState.cards[targetIndex] = placedDecoy;
		
		// Обновляем отображение
		if (window.gameModule) {
			// Удаляем старую карту с поля
			const oldCardElement = this.getCardElementOnBoard(targetCard, row, 'player');
			if (oldCardElement) {
				oldCardElement.remove();
			}
			
			// Добавляем Чучело на поле
			window.gameModule.displayCardOnRow(row, placedDecoy, 'player', targetIndex);
			
			// Обновляем руку
			window.gameModule.displayPlayerHand();
			
			// Обновляем силу ряда
			window.gameModule.updateRowStrength(row);
			
			// Завершаем ход
			window.gameModule.completeCardPlay();
		}
		
		// Воспроизводим звук
		if (window.audioManager && window.audioManager.playSound) {
			audioManager.playSound('artefact');
		}
		
		// Сбрасываем состояние
		this.cancelCardSelection();
	},

	isCardUnderWeather: function(card, row) {
		if (!this.gameState || !this.gameState.weather) return false;
		
		// Проверяем эффекты погоды на ряду
		const rowWeather = this.gameState.weather.effects[row];
		if (!rowWeather) return false;
		
		// Получаем эффект погоды
		const weatherEffect = this.getWeatherEffectForCard(rowWeather);
		if (weatherEffect && weatherEffect.rows) {
			// Проверяем, влияет ли эта погода на данный ряд
			return weatherEffect.rows.includes(row);
		}
		
		return true;
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

    playWeatherCard: function(card) {
		const isClearWeather = this.isClearWeatherCard(card);
	
		if (isClearWeather) {
			const hasSameClearWeather = this.gameState.weather.cards.some(wc => 
				wc.name === card.name || wc.id === card.id
			);
			if (hasSameClearWeather) {
				this.cancelCardSelection();
				return;
			}
		} 
		else {
			const sameWeatherExists = this.gameState.weather.cards.some(weatherCard => {
				if (this.isClearWeatherCard(weatherCard)) return false;
				return weatherCard.name === card.name;
			});
			if (sameWeatherExists) {
				this.cancelCardSelection();
				return;
			}
			const weatherEffect = this.getWeatherEffectForCard(card);
			if (weatherEffect && weatherEffect.rows) {
				const targetRows = weatherEffect.rows;
				if (targetRows.length > 1) {
					let occupiedRowsCount = 0;
					targetRows.forEach(row => {
						if (this.gameState.weather.effects[row]) {
							occupiedRowsCount++;
						}
					});
					if (occupiedRowsCount === targetRows.length) {
						this.cancelCardSelection();
						return;
					}
				}
				else if (targetRows.length === 1) {
					const targetRow = targetRows[0];
					if (this.gameState.weather.effects[targetRow]) {
						this.cancelCardSelection();
						return;
					}
				}
			}
			const regularWeatherCards = this.gameState.weather.cards.filter(wc => 
				!this.isClearWeatherCard(wc)
			);
			const hasClearWeather = this.gameState.weather.cards.some(wc => 
				this.isClearWeatherCard(wc)
			);
		
			if (!hasClearWeather && regularWeatherCards.length >= this.gameState.weather.maxWeatherCards) {
				this.cancelCardSelection();
				return;
			}
		}
		card.owner = 'player';

		if (isClearWeather) {
			this.handleClearWeather(card);
		} else {
			this.handleRegularWeather(card);
		}

		this.removeCardFromHand(card);
		if (window.gameModule) {
			window.gameModule.displayWeatherCards();
			window.gameModule.completeCardPlay();
		}
	},
    
    isClearWeatherCard: function(card) {
        return card.name === 'Чистое небо' || card.id === 'neutral_special_4';
    },
    
    handleClearWeather: function(card) {
        if (window.gameModule) {
            window.gameModule.handleClearWeather(card);
        }
    },
    
    handleRegularWeather: function(card) {
        if (window.gameModule) {
            window.gameModule.handleRegularWeather(card);
        }
    },
    
    startTacticCardPlacement: function(card) {
        this.gameState.selectingRow = true;
        this.gameState.placementType = 'tactic';
        this.highlightAvailableTacticSlots();
    },
    
    startUnitCardPlacement: function(card) {
        this.gameState.selectingRow = true;
        this.gameState.placementType = 'unit';
        this.highlightAvailableRows(card);
    },
    
    highlightAvailableTacticSlots: function() {
        const rows = ['close', 'ranged', 'siege'];
        
        rows.forEach(row => {
            const tacticSlot = document.getElementById(`player${this.capitalizeFirst(row)}Tactics`);
            
            if (tacticSlot && !this.gameState.player.rows[row].tactic) {
                tacticSlot.classList.add('tactic-slot-available');
                this.setupTacticSlotSelectionHandler(tacticSlot, row);
            }
        });
    },
    
    setupTacticSlotSelectionHandler: function(tacticSlot, row) {
        const clickHandler = () => {
            if (this.gameState.selectingRow && this.gameState.selectedCard) {
                this.placeTacticCard(this.gameState.selectedCard, row);
                tacticSlot.removeEventListener('click', clickHandler);
            }
        };
        
        tacticSlot.addEventListener('click', clickHandler);
        
        if (!this.gameState.tacticSlotSelectionHandlers) {
            this.gameState.tacticSlotSelectionHandlers = [];
        }
        this.gameState.tacticSlotSelectionHandlers.push({ element: tacticSlot, handler: clickHandler });
    },
    
    highlightAvailableRows: function(card) {
        let availableRows = [];
        
        if (card.type === 'special' || card.type === 'artifact') {
            availableRows = ['close', 'ranged', 'siege'];
        } else if (card.type === 'unit' && card.position) {
            if (Array.isArray(card.position)) {
                availableRows = card.position.map(pos => pos.replace('-row', ''));
            } else if (card.position === 'any-row') {
                availableRows = ['close', 'ranged', 'siege'];
            } else {
                availableRows = [card.position.replace('-row', '')];
            }
        }
        
        availableRows = availableRows.filter(row => 
            this.gameState.player.rows[row].cards.length < 9
        );

        if (availableRows.length === 0) {
            this.showMessage('Нет доступных рядов для этой карты!');
            this.cancelCardSelection();
            return;
        }

        availableRows.forEach(row => {
            const rowElement = document.getElementById(`player${this.capitalizeFirst(row)}Row`);
            if (rowElement) {
                rowElement.classList.add('row-available');
                this.setupRowSelectionHandler(rowElement, row);
            }
        });
    },
    
    setupRowSelectionHandler: function(rowElement, row) {
    const clickHandler = (event) => {
        if (this.gameState.selectingRow && this.gameState.selectedCard) {
            // Передаем координату X клика
            this.placeCardOnRow(this.gameState.selectedCard, row, event.clientX);
            rowElement.removeEventListener('click', clickHandler);
        }
    };
    
    rowElement.addEventListener('click', clickHandler);
    
    if (!this.gameState.rowSelectionHandlers) {
        this.gameState.rowSelectionHandlers = [];
    }
    this.gameState.rowSelectionHandlers.push({ element: rowElement, handler: clickHandler });
},

    placeCardOnRow: function(card, row, clickX) {
			if (this.gameState.placementType === 'tactic') {
				this.placeTacticCard(card, row);
			} else {
				this.placeUnitCard(card, row, clickX);
			}
		},

    placeTacticCard: function(card, row) {
        if (this.gameState.player.rows[row].tactic) {
            this.showMessage('В этом ряду уже есть карта тактики!');
            return;
        }

        if (window.audioManager && window.audioManager.playSound) {
            audioManager.playSound('artefact');
        }

        this.gameState.player.rows[row].tactic = card;
        this.removeCardFromHand(card);
        
        if (window.gameModule) {
            window.gameModule.displayTacticCard(row, card);
            window.gameModule.completeCardPlay();
        }
    },
    
    placeUnitCard: function(card, row, clickX) {
		const rowState = this.gameState.player.rows[row];
		
		if (rowState.cards.length >= 9) {
			this.showMessage('В этом ряду уже максимальное количество карт!');
			return;
		}

		const rowElement = document.getElementById(`player${this.capitalizeFirst(row)}Row`);
		if (!rowElement) return;
		
		let insertIndex = rowState.cards.length;
		
		if (clickX !== undefined && rowState.cards.length > 0) {
			const cardsInRow = Array.from(rowElement.querySelectorAll('.board-card'));
			if (cardsInRow.length > 0) {
				let closestCard = null;
				let minDistance = Infinity;
				const clickRect = rowElement.getBoundingClientRect();
				const relativeX = clickX - clickRect.left;
				
				cardsInRow.forEach((cardElement, index) => {
					const cardRect = cardElement.getBoundingClientRect();
					const cardCenterX = (cardRect.left + cardRect.right) / 2 - clickRect.left;
					const distance = Math.abs(relativeX - cardCenterX);
					
					if (distance < minDistance) {
						minDistance = distance;
						closestCard = { element: cardElement, index: index };
					}
				});
				
				if (closestCard) {
					const cardRect = closestCard.element.getBoundingClientRect();
					const cardCenterX = (cardRect.left + cardRect.right) / 2;
					
					if (clickX < cardCenterX) {
						insertIndex = closestCard.index;
					} else {
						insertIndex = closestCard.index + 1;
					}
				}
			}
		}

		const cardCopy = window.gameModule ? 
        window.gameModule.createCardCopy(card) : { ...card };
    
    rowState.cards.splice(insertIndex, 0, cardCopy);
    
    this.removeCardFromHand(card);
		
		if (window.audioManager && window.audioManager.playSound) {
			if (card.type === 'artifact' || card.type === 'special' || card.type === 'tactic') {
				audioManager.playSound('artefact');
			} else {
				switch(row) {
					case 'close':
						audioManager.playSound('card_close');
						break;
					case 'ranged':
						audioManager.playSound('card_range');
						break;
					case 'siege':
						audioManager.playSound('card_siege');
				}
			}
		}
		
		if (window.gameModule) {
			window.gameModule.displayCardOnRow(row, card, 'player', insertIndex);
			window.gameModule.updateRowStrength(row);
			window.gameModule.completeCardPlay();
		}
	},

    removeCardFromHand: function(card) {
        if (window.gameModule && window.gameModule.removeCardFromHand) {
            window.gameModule.removeCardFromHand(card, 'player');
        } else {
            const cardIndex = this.gameState.player.hand.findIndex(c => c.id === card.id);
            if (cardIndex !== -1) {
                this.gameState.player.hand.splice(cardIndex, 1);
                if (window.gameModule) {
                    window.gameModule.displayPlayerHand();
                }
            }
        }
    },
    
    cancelCardSelection: function() {
		if (this.gameState.selectedCardElement) {
			this.gameState.selectedCardElement.classList.remove('card-selected');
		}
		
		this.gameState.selectedCard = null;
		this.gameState.selectedCardElement = null;
		this.cancelRowSelection();
	},

    cancelRowSelection: function() {
		this.gameState.selectingRow = false;
		this.gameState.placementType = null;
		
		this.removeDecoyHighlights();
		this.removeArtifactHighlights();
		this.removeDamageHighlights();
		this.removeAllRowHighlights();
		this.removeAllTacticSlotHighlights();
		
		if (this.gameState.rowSelectionHandlers) {
			this.gameState.rowSelectionHandlers.forEach(({ element, handler }) => {
				element.removeEventListener('click', handler);
			});
			this.gameState.rowSelectionHandlers = [];
		}
		
		if (this.gameState.tacticSlotSelectionHandlers) {
			this.gameState.tacticSlotSelectionHandlers.forEach(({ element, handler }) => {
				element.removeEventListener('click', handler);
			});
			this.gameState.tacticSlotSelectionHandlers = [];
		}
		
		if (this.gameState.selectedCardElement) {
			this.gameState.selectedCardElement.classList.remove('card-selected');
			this.gameState.selectedCard = null;
			this.gameState.selectedCardElement = null;
		}
		
		if (this.gameState.artifactSelectionHandlers) {
			this.gameState.artifactSelectionHandlers.forEach(({ element, handler }) => {
				element.removeEventListener('click', handler);
			});
			this.gameState.artifactSelectionHandlers = [];
		}
	},

	removeDecoyHighlights: function() {
		const highlightedCards = document.querySelectorAll('.decoy-target');
		highlightedCards.forEach(card => {
			card.classList.remove('decoy-target');
		});
		
		if (this.gameState.decoySelectionHandlers) {
			this.gameState.decoySelectionHandlers.forEach(({ element, handler }) => {
				element.removeEventListener('click', handler);
			});
			this.gameState.decoySelectionHandlers = [];
		}
	},

    removeAllTacticSlotHighlights: function() {
        const rows = ['close', 'ranged', 'siege'];
        rows.forEach(row => {
            const tacticSlot = document.getElementById(`player${this.capitalizeFirst(row)}Tactics`);
            if (tacticSlot) tacticSlot.classList.remove('tactic-slot-available');
        });
    },
    
    removeAllRowHighlights: function() {
        const rows = ['close', 'ranged', 'siege'];
        rows.forEach(row => {
            const rowElement = document.getElementById(`player${this.capitalizeFirst(row)}Row`);
            const tacticSlot = document.getElementById(`player${this.capitalizeFirst(row)}Tactics`);
            
            if (rowElement) rowElement.classList.remove('row-available');
            if (tacticSlot) tacticSlot.classList.remove('tactic-slot-available');
        });
    },
    
    handlePass: function() {
        if (this.gameState.gamePhase !== 'playerTurn' || this.gameState.player.passed) {
            return;
        }
        
        if (this.gameState.cardsPlayedThisTurn >= this.gameState.maxCardsPerTurn) {
            this.showMessage('Вы достигли лимита карт! Завершите ход.');
            return;
        }
        
        audioManager.playSound('button');
        
        this.gameState.player.passed = true;
        
        if (window.gameModule && window.gameModule.resetTimeoutCounter) {
            window.gameModule.resetTimeoutCounter();
        }
        
        if (window.gameModule) {
            window.gameModule.updateControlButtons();
            window.gameModule.handleTurnEnd();
        }
    },
	
    handleEndTurn: function() {
        if (this.gameState.gamePhase !== 'playerTurn') {
            return;
        }
        
        if (this.gameState.player.passed) {
            return;
        }
        
        audioManager.playSound('button');
        
        if (window.gameModule && window.gameModule.resetTimeoutCounter) {
            window.gameModule.resetTimeoutCounter();
        }
        
        if (window.gameModule) {
            window.gameModule.handleTurnEnd();
        }
    },

    capitalizeFirst: function(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    },
    
    showMessage: function(text) {
        if (window.gameModule && window.gameModule.showMessage) {
            window.gameModule.showMessage(text);
        } else {
            alert(text);
        }
    }
};

window.playerModule = playerModule;