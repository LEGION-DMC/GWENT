const playerModule = {
    gameState: null,
    
    init: function(gameState) {
        this.gameState = gameState;
    },

	isHeroCard: function(card) {
		return card.tags && (card.tags.includes('hero') || card.tags.includes('герой'));
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
					if (card.ability && card.ability.startsWith('boost_')) {
						this.startBoostCardPlacement(card);
					} else {
						this.startTacticCardPlacement(card);
					}
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
						this.startDamageCardPlacement(card);
					} else {
						this.startUnitCardPlacement(card);
					}
					break;
				case 'artifact':
					if (card.ability && card.ability.startsWith('boost_')) {
						this.startArtifactBoostPlacement(card);
					} else {
						this.startUnitCardPlacement(card);
					}
					break;
				default:
					this.cancelCardSelection();
			}
		}
	},

	startBoostCardPlacement: function(card) {
		const ability = card.ability;
		
		if (ability.startsWith('boost_row_')) {
			this.startRowBoostPlacement(card);
		} else if (ability.startsWith('boost_tag_')) {
			this.startTagBoostPlacement(card); // ТЕПЕРЬ ТАКЖЕ ТРЕБУЕТ ВЫБОРА РЯДА
		}
	},

	startRowBoostPlacement: function(card) {
		this.gameState.selectingRow = true;
		this.gameState.placementType = 'row_boost';
		this.gameState.boostCard = card;
		this.highlightAvailableTacticSlotsForBoost();
	},

	startTagBoostPlacement: function(card) {
		this.gameState.selectingRow = true;
		this.gameState.placementType = 'tag_boost';
		this.gameState.boostCard = card;
		
		// Определяем тег из ability
		let tag = '';
		if (card.ability === 'boost_tag_witcher') {
			tag = 'witcher';
		} else if (card.ability === 'boost_tag_criminal') {
			tag = 'criminal';
		} 
		
		if (!tag) {
			this.showMessage('Неизвестный тег для усиления!');
			this.cancelCardSelection();
			return;
		}
		
		this.gameState.boostTag = tag;
		this.highlightPlayerRowsForTagBoost(tag);
	},

	highlightPlayerRowsForTagBoost: function(tag) {
		const rows = ['close', 'ranged', 'siege'];
		let hasAvailableSlots = false;
		
		rows.forEach(row => {
			// Проверяем, есть ли в ряду карты с нужным тегом
			const hasTagUnits = this.gameState.player.rows[row].cards.some(card => 
				card.type === 'unit' && 
				!(card.tags && (card.tags.includes('hero') || card.tags.includes('герой'))) &&
				card.tags && 
				card.tags.includes(tag)
			);
			
			// Проверяем, есть ли свободный тактический слот
			const tacticSlot = document.getElementById(`player${this.capitalizeFirst(row)}Tactics`);
			const hasTacticSlot = tacticSlot && !this.gameState.player.rows[row].tactic;
			
			if (hasTagUnits && hasTacticSlot) {
				tacticSlot.classList.add('tactic-slot-available');
				this.setupTacticSlotSelectionHandler(tacticSlot, row);
				hasAvailableSlots = true;
			}
		});
		
		// Если нет подходящих слотов, показываем сообщение
		if (!hasAvailableSlots) {
			this.showMessage(`У вас нет карт с тегом "${tag}" или нет свободных тактических слотов!`);
			this.cancelCardSelection();
		}
	},

	highlightPlayerRowsForBoost: function() {
		const rows = ['close', 'ranged', 'siege'];
		
		rows.forEach(row => {
			const rowElement = document.getElementById(`player${this.capitalizeFirst(row)}Row`);
			if (rowElement) {
				// Проверяем, есть ли в ряду карты, которые можно усилить
				const hasBoostableUnits = this.gameState.player.rows[row].cards.some(card => 
					card.type === 'unit' && 
					!(card.tags && (card.tags.includes('hero') || card.tags.includes('герой')))
				);
				
				if (hasBoostableUnits) {
					rowElement.classList.add('row-boost-target');
					this.setupRowBoostSelectionHandler(rowElement, row);
				}
			}
		});
	},

	highlightAvailableTacticSlotsForBoost: function() {
		const rows = ['close', 'ranged', 'siege'];
		let hasAvailableSlots = false;
		
		rows.forEach(row => {
			const tacticSlot = document.getElementById(`player${this.capitalizeFirst(row)}Tactics`);
			
			// Проверяем, есть ли в ряду карты для усиления и свободен ли слот
			const hasBoostableUnits = this.gameState.player.rows[row].cards.some(card => 
				card.type === 'unit' && 
				!(card.tags && (card.tags.includes('hero') || card.tags.includes('герой')))
			);
			
			if (tacticSlot && !this.gameState.player.rows[row].tactic && hasBoostableUnits) {
				tacticSlot.classList.add('tactic-slot-available');
				this.setupTacticSlotSelectionHandler(tacticSlot, row);
				hasAvailableSlots = true;
			}
		});
		
		if (!hasAvailableSlots) {
			this.showMessage('Нет подходящих тактических слотов для усиления!');
			this.cancelCardSelection();
		}
	},

	setupRowBoostSelectionHandler: function(rowElement, row) {
		const clickHandler = () => {
			if (this.gameState.selectingRow) {
				if (this.gameState.placementType === 'row_boost') {
					this.applyRowBoostCard(this.gameState.boostCard, row);
				} else if (this.gameState.placementType === 'tag_boost') {
					this.applyTagBoostCard(this.gameState.boostCard, row);
				}
				rowElement.removeEventListener('click', clickHandler);
			}
		};
		
		rowElement.addEventListener('click', clickHandler);
		
		if (!this.gameState.boostSelectionHandlers) {
			this.gameState.boostSelectionHandlers = [];
		}
		this.gameState.boostSelectionHandlers.push({ 
			element: rowElement, 
			handler: clickHandler,
			row: row,
			placementType: this.gameState.placementType
		});
	},

	applyRowBoostCard: function(boostCard, row) {
		const ability = boostCard.ability;
		const boostMatch = ability.match(/boost_row_(\d+)/);
		const boostValue = boostMatch ? parseInt(boostMatch[1]) : 1;
		
		// Карты тактики остаются на поле, не уходят в сброс
		// Просто размещаем в тактическом слоте
		if (this.gameState.player.rows[row].tactic) {
			this.showMessage('В этом ряду уже есть карта тактики!');
			return;
		}
		
		// Размещаем карту тактики
		this.gameState.player.rows[row].tactic = boostCard;
		this.removeCardFromHand(boostCard);
		
		// Применяем эффект усиления
		const rowState = this.gameState.player.rows[row];
		let boostedCards = 0;
		
		rowState.cards.forEach(card => {
			if (card.type === 'unit' && !this.isHeroCard(card)) {
				if (card.originalStrength === undefined) {
					card.originalStrength = card.strength;
				}
				
				const currentStrength = card._displayStrength !== undefined ? 
					card._displayStrength : card.strength;
				
				card.strength = currentStrength + boostValue;
				card._displayStrength = card.strength;
				
				boostedCards++;
				
				// Создаем визуальный эффект усиления
				this.createBoostVisualEffect(card, row, boostValue);
				
				if (window.gameModule) {
					window.gameModule.updateCardStrengthDisplay(card, row, 'player');
				}
			}
		});
		
		// Обновляем силу ряда
		if (window.gameModule) {
			window.gameModule.updateRowStrength(row, 'player');
			
			// Отображаем карту тактики
			window.gameModule.displayTacticCard(row, boostCard, 'player');
			
			// Завершаем ход
			window.gameModule.completeCardPlay();
		}
		
		// Воспроизводим звук
		if (window.audioManager && window.audioManager.playSound) {
			audioManager.playSound('artefact');
			audioManager.playSound('card_boost');
		}
		
		// Сбрасываем состояние выбора
		this.cancelBoostSelection();
	},

	applyTagBoostCard: function(boostCard, row) {
		const ability = boostCard.ability;
		let boostValue = 1;
		let tag = '';
		
		// Определяем тег и значение усиления
		if (ability === 'boost_tag_witcher') {
			tag = 'witcher';
			boostValue = 3;
		} else if (ability === 'boost_tag_criminal') {
			tag = 'criminal';
			boostValue = 2;
		}
		
		if (!tag) {
			this.showMessage('Неизвестный тег для усиления!');
			return;
		}
		
		// Проверяем, есть ли в выбранном ряду карты с нужным тегом
		const rowState = this.gameState.player.rows[row];
		const hasTagUnits = rowState.cards.some(card => 
			card.type === 'unit' && 
			!this.isHeroCard(card) &&
			card.tags && 
			card.tags.includes(tag)
		);
		
		if (!hasTagUnits) {
			this.showMessage(`В этом ряду нет карт с тегом "${tag}"!`);
			return;
		}
		
		// Проверяем, свободен ли тактический слот
		if (this.gameState.player.rows[row].tactic) {
			this.showMessage('В этом ряду уже есть карта тактики!');
			return;
		}
		
		// Размещаем карту тактики
		this.gameState.player.rows[row].tactic = boostCard;
		this.removeCardFromHand(boostCard);
		
		// Применяем эффект усиления
		let boostedCards = 0;
		
		rowState.cards.forEach(card => {
			if (card.type === 'unit' && 
				!this.isHeroCard(card) && 
				card.tags && 
				card.tags.includes(tag)) {
				
				if (card.originalStrength === undefined) {
					card.originalStrength = card.strength;
				}
				
				const currentStrength = card._displayStrength !== undefined ? 
					card._displayStrength : card.strength;
				
				card.strength = currentStrength + boostValue;
				card._displayStrength = card.strength;
				
				boostedCards++;
				
				// Создаем визуальный эффект усиления
				this.createBoostVisualEffect(card, row, boostValue);
				
				if (window.gameModule) {
					window.gameModule.updateCardStrengthDisplay(card, row, 'player');
				}
			}
		});
		
		// Обновляем силу ряда
		if (window.gameModule) {
			window.gameModule.updateRowStrength(row, 'player');
			
			// Отображаем карту тактики
			window.gameModule.displayTacticCard(row, boostCard, 'player');
			
			// Завершаем ход
			window.gameModule.completeCardPlay();
		}
		
		// Воспроизводим звук
		if (window.audioManager && window.audioManager.playSound) {
			audioManager.playSound('artefact');
			audioManager.playSound('card_boost');
		}
		
		// Сбрасываем состояние выбора
		this.cancelBoostSelection();
	},

	createBoostVisualEffect: function(card, row, boostValue) {
		const rowElement = document.getElementById(`player${this.capitalizeFirst(row)}Row`);
		if (!rowElement) return;
		
		const cardElement = rowElement.querySelector(`[data-card-id="${card.id}"]`);
		if (!cardElement) return;
		
		// Создаем эффект усиления
		const boostOverlay = document.createElement('div');
		boostOverlay.className = 'card-boost-overlay';
		boostOverlay.textContent = `+${boostValue}`;
		boostOverlay.style.cssText = `
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			color: green;
			font-size: 24px;
			font-weight: bold;
			text-shadow: 0 0 5px black;
			z-index: 100;
			pointer-events: none;
			animation: boostAnimation 0.8s ease-out forwards;
		`;
		
		cardElement.appendChild(boostOverlay);
		
		// Удаляем эффект через 0.8 секунды
		setTimeout(() => {
			if (boostOverlay.parentNode) {
				boostOverlay.remove();
			}
		}, 800);
	},

	cancelBoostSelection: function() {
		this.gameState.boostTag = null;
	},

	removeBoostHighlights: function() {
		// Убираем подсветку рядов
		const highlightedRows = document.querySelectorAll('.row-boost-target, .tag-boost-target');
		highlightedRows.forEach(row => {
			row.classList.remove('row-boost-target');
			row.classList.remove('tag-boost-target');
			delete row.dataset.boostTag;
		});
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
				if (unitCard.tags && (unitCard.tags.includes('hero') || unitCard.tags.includes('герой'))) {
					return;
				}
				
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
				const hasNonHeroUnits = this.gameState.opponent.rows[row].cards.some(card => 
					card.type === 'unit' && 
					card.strength > 0 && 
					!(card.tags && (card.tags.includes('hero') || card.tags.includes('герой')))
				);
				
				if (hasNonHeroUnits) {
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
		
		this.removeCardFromHand(damageCard);
		
		const damageCardCopy = { ...damageCard };
		this.gameState.player.discard.push(damageCardCopy);
		
		if (targetCard.originalStrength === undefined) {
			targetCard.originalStrength = targetCard.strength;
		}
		
		if (targetCard._damageDisplayStrength === undefined) {
			const currentDisplayStrength = targetCard._displayStrength !== undefined ? 
				targetCard._displayStrength : targetCard.strength;
			targetCard._damageDisplayStrength = currentDisplayStrength;
		}
		
		const currentDisplayStrength = targetCard._displayStrength !== undefined ? 
			targetCard._displayStrength : targetCard.strength;
		
		const newStrength = Math.max(0, currentDisplayStrength - damageValue);
		
		targetCard._damageDisplayStrength = newStrength;
		targetCard._displayStrength = newStrength;
		
		this.createDamageVisualEffect(targetCard, row, damageValue);
		
		if (window.gameModule) {
			window.gameModule.updateCardStrengthDisplay(targetCard, row, 'opponent');
		}
		
		if (targetCard._displayStrength === 0) {
			const rowState = this.gameState.opponent.rows[row];
			const cardIndex = rowState.cards.findIndex(c => c.id === targetCard.id);
			if (cardIndex !== -1) {
				const destroyedCard = { ...rowState.cards[cardIndex] };
				rowState.cards.splice(cardIndex, 1);
				this.gameState.opponent.discard.push(destroyedCard);
				
				setTimeout(() => {
					if (window.gameModule) {
						window.gameModule.removeCardFromBoardVisual(targetCard, row, 'opponent');
					}
				}, 500);
				
				delete targetCard.originalStrength;
				delete targetCard._displayStrength;
				delete targetCard._damageDisplayStrength;
			}
		}
		
		if (window.gameModule) {
			window.gameModule.updateRowStrength(row, 'opponent');
			window.gameModule.displayPlayerDiscard();
			window.gameModule.displayOpponentDiscard();
			window.gameModule.completeCardPlay();
		}
		
		if (window.audioManager && window.audioManager.playSound) {
			audioManager.playSound('card_damage');
		}
		
		this.cancelDamageSelection();
	},

	startArtifactBoostPlacement: function(card) {
		this.gameState.selectingRow = true;
		this.gameState.placementType = 'artifact_boost';
		this.gameState.boostCard = card;
		
		const ability = card.ability;
		
		if (ability === 'boost_near_1' || ability === 'boost_near_2' || ability === 'boost_near_3' ||
			ability === 'boost_near_4' || ability === 'boost_near_5') {
			// Для усиления соседей - выбираем позицию в ряду
			this.highlightAvailableSlotsForNearBoost(card);
		} else if (ability === 'boost_1' || ability === 'boost_2' || ability === 'boost_3' ||
				   ability === 'boost_4' || ability === 'boost_5') {
			// Для усиления карты - выбираем карту для усиления
			this.highlightAvailableCardsForBoost(card);
		} else {
			this.cancelCardSelection();
		}
	},

	highlightAvailableCardsForBoost: function(card) {
		const rows = ['close', 'ranged', 'siege'];
		let hasAvailableCards = false;
		
		rows.forEach(row => {
			const rowState = this.gameState.player.rows[row];
			const rowElement = document.getElementById(`player${this.capitalizeFirst(row)}Row`);
			
			if (!rowElement) return;
			
			rowState.cards.forEach((unitCard, index) => {
				if (unitCard.type === 'unit' && !this.isHeroCard(unitCard)) {
					const cardElement = this.getCardElementOnBoard(unitCard, row, 'player');
					if (cardElement) {
						cardElement.classList.add('boost-target');
						this.setupCardBoostSelectionHandler(cardElement, unitCard, row, index);
						hasAvailableCards = true;
					}
				}
			});
		});
		
		if (!hasAvailableCards) {
			this.showMessage('Нет карт для усиления!');
			this.cancelCardSelection();
		}
	},

	highlightAvailableSlotsForNearBoost: function(card) {
		const rows = ['close', 'ranged', 'siege'];
		let hasAvailableSlots = false;
		
		rows.forEach(row => {
			const rowState = this.gameState.player.rows[row];
			const rowElement = document.getElementById(`player${this.capitalizeFirst(row)}Row`);
			
			if (!rowElement || rowState.cards.length >= 9) return;
			
			// Подсвечиваем все пустые позиции в ряду
			for (let i = 0; i <= rowState.cards.length; i++) {
				// Проверяем, есть ли соседи для усиления
				const hasLeftNeighbor = i > 0 && 
					rowState.cards[i - 1].type === 'unit' && 
					!this.isHeroCard(rowState.cards[i - 1]);
				
				const hasRightNeighbor = i < rowState.cards.length && 
					rowState.cards[i].type === 'unit' && 
					!this.isHeroCard(rowState.cards[i]);
				
				if (hasLeftNeighbor || hasRightNeighbor) {
					// Создаем виртуальный элемент для позиции
					const positionMarker = this.createPositionMarker(row, i);
					positionMarker.classList.add('boost-position-target');
					this.setupPositionBoostSelectionHandler(positionMarker, row, i);
					hasAvailableSlots = true;
				}
			}
		});
		
		if (!hasAvailableSlots) {
			this.showMessage('Нет подходящих позиций для усиления соседей!');
			this.cancelCardSelection();
		}
	},

	createPositionMarker: function(row, position) {
		const rowElement = document.getElementById(`player${this.capitalizeFirst(row)}Row`);
		if (!rowElement) return null;
		
		// Получаем все карты в ряду
		const cardsInRow = Array.from(rowElement.querySelectorAll('.board-card'));
		
		// Если в ряду нет карт - маркер не нужен
		if (cardsInRow.length === 0) {
			return null;
		}
		
		// Проверяем, есть ли соседи для этой позиции
		const rowState = this.gameState.player.rows[row];
		const hasLeftNeighbor = position > 0 && 
			rowState.cards[position - 1]?.type === 'unit' && 
			!this.isHeroCard(rowState.cards[position - 1]);
		
		const hasRightNeighbor = position < rowState.cards.length && 
			rowState.cards[position]?.type === 'unit' && 
			!this.isHeroCard(rowState.cards[position]);
		
		// Если нет соседей - маркер не нужен
		if (!hasLeftNeighbor && !hasRightNeighbor) {
			return null;
		}
		
		const marker = document.createElement('div');
		marker.className = 'position-marker boost-position-marker';
		marker.dataset.row = row;
		marker.dataset.position = position;
		
		// Убедимся, что ряд имеет относительное позиционирование
		rowElement.style.position = 'relative';
		
		// Определяем позицию маркера
		let leftPosition = 0;
		
		if (position === 0) {
			// Маркер перед первой картой
			const firstCard = cardsInRow[0];
			if (firstCard) {
				const cardRect = firstCard.getBoundingClientRect();
				const rowRect = rowElement.getBoundingClientRect();
				leftPosition = (cardRect.left - rowRect.left) - 20; // Слева от карты
			}
		} else if (position >= cardsInRow.length) {
			// Маркер после последней карты
			const lastCard = cardsInRow[cardsInRow.length - 1];
			if (lastCard) {
				const cardRect = lastCard.getBoundingClientRect();
				const rowRect = rowElement.getBoundingClientRect();
				leftPosition = (cardRect.right - rowRect.left) - 15; // Справа от карты
			}
		} else {
			// Маркер между картами
			const leftCard = cardsInRow[position - 1];
			const rightCard = cardsInRow[position];
			
			if (leftCard && rightCard) {
				const leftCardRect = leftCard.getBoundingClientRect();
				const rightCardRect = rightCard.getBoundingClientRect();
				const rowRect = rowElement.getBoundingClientRect();
				
				// Средняя точка между картами
				const middle = ((leftCardRect.right + rightCardRect.left) / 2) - rowRect.left;
				leftPosition = middle - 15; // Центрируем маркер
			}
		}
		
		// Ограничиваем позицию в пределах ряда
		const rowWidth = rowElement.offsetWidth;
		leftPosition = Math.max(10, Math.min(leftPosition, rowWidth - 40));
		
		// Устанавливаем стили
		marker.style.position = 'absolute';
		marker.style.left = `${leftPosition}px`;
		marker.style.top = '50%';
		marker.style.transform = 'translateY(-50%)';
		marker.style.width = '30px';
		marker.style.height = '60px';
		marker.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
		marker.style.border = '2px dashed #00ff00';
		marker.style.borderRadius = '5px';
		marker.style.zIndex = '100'; // Выше карт
		marker.style.cursor = 'pointer';
		marker.style.transition = 'all 0.3s ease';
		marker.style.pointerEvents = 'auto';
		marker.style.boxSizing = 'border-box';
		
		rowElement.appendChild(marker);
		
		// Эффекты при наведении
		marker.addEventListener('mouseenter', () => {
			marker.style.backgroundColor = 'rgba(0, 255, 0, 0.4)';
			marker.style.border = '1px solid green';
			marker.style.boxShadow = '0 0 15px 5px rgba(0, 255, 0, 0.5)';
			marker.style.transform = 'translateY(-50%) scale(1.01)';
			marker.style.zIndex = '101'; // Еще выше при наведении
			
			// Подсветка соседних карт
			if (hasLeftNeighbor && position > 0) {
				const leftCard = cardsInRow[position - 1];
				if (leftCard) {
					leftCard.classList.add('neighbor-highlight');
					leftCard.style.zIndex = '99'; // Чуть ниже маркера
				}
			}
			
			if (hasRightNeighbor && position < cardsInRow.length) {
				const rightCard = cardsInRow[position];
				if (rightCard) {
					rightCard.classList.add('neighbor-highlight');
					rightCard.style.zIndex = '99'; // Чуть ниже маркера
				}
			}
		});
		
		marker.addEventListener('mouseleave', () => {
			marker.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
			marker.style.border = '1px dashed green';
			marker.style.boxShadow = 'none';
			marker.style.transform = 'translateY(-50%) scale(1)';
			marker.style.zIndex = '100';
			
			// Убираем подсветку соседних карт
			if (hasLeftNeighbor && position > 0) {
				const leftCard = cardsInRow[position - 1];
				if (leftCard) {
					leftCard.classList.remove('neighbor-highlight');
					leftCard.style.zIndex = '';
				}
			}
			
			if (hasRightNeighbor && position < cardsInRow.length) {
				const rightCard = cardsInRow[position];
				if (rightCard) {
					rightCard.classList.remove('neighbor-highlight');
					rightCard.style.zIndex = '';
				}
			}
		});
		
		return marker;
	},

	removeAllPositionMarkers: function() {
		const markers = document.querySelectorAll('.boost-position-marker');
		markers.forEach(marker => {
			marker.remove();
		});
		
		// Убираем подсветку с карт
		const highlightedCards = document.querySelectorAll('.neighbor-highlight');
		highlightedCards.forEach(card => {
			card.classList.remove('neighbor-highlight');
			card.style.zIndex = '';
		});
		
		// Восстанавливаем стандартные стили рядов
		const rows = ['close', 'ranged', 'siege'];
		rows.forEach(row => {
			const rowElement = document.getElementById(`player${this.capitalizeFirst(row)}Row`);
			if (rowElement) {
				// Убираем position: relative, если оно было добавлено
				rowElement.style.position = '';
			}
		});
	},

	setupCardBoostSelectionHandler: function(cardElement, targetCard, row, position) {
		const clickHandler = () => {
			if (this.gameState.selectingRow && this.gameState.placementType === 'artifact_boost') {
				this.applyArtifactCardBoost(this.gameState.boostCard, targetCard, row, position);
				cardElement.removeEventListener('click', clickHandler);
			}
		};
		
		cardElement.addEventListener('click', clickHandler);
		
		if (!this.gameState.boostSelectionHandlers) {
			this.gameState.boostSelectionHandlers = [];
		}
		this.gameState.boostSelectionHandlers.push({ 
			element: cardElement, 
			handler: clickHandler,
			card: targetCard,
			row: row,
			position: position
		});
	},

	setupPositionBoostSelectionHandler: function(positionMarker, row, position) {
		const clickHandler = () => {
			if (this.gameState.selectingRow && this.gameState.placementType === 'artifact_boost') {
				this.applyArtifactNearBoost(this.gameState.boostCard, row, position);
				positionMarker.remove();
			}
		};
		
		positionMarker.addEventListener('click', clickHandler);
		
		if (!this.gameState.positionSelectionHandlers) {
			this.gameState.positionSelectionHandlers = [];
		}
		this.gameState.positionSelectionHandlers.push({ 
			element: positionMarker, 
			handler: clickHandler,
			row: row,
			position: position
		});
	},

	applyArtifactCardBoost: function(artifactCard, targetCard, row, position) {
		const ability = artifactCard.ability;
		const boostMatch = ability.match(/boost_(\d+)/);
		const boostValue = boostMatch ? parseInt(boostMatch[1]) : 1;
		
		// Размещаем артефакт в ряду на указанной позиции (после усиленной карты)
		const rowState = this.gameState.player.rows[row];
		let insertPosition = position + 1;
		
		// Проверяем, есть ли место в ряду
		if (rowState.cards.length >= 9) {
			this.showMessage('В ряду максимальное количество карт!');
			return;
		}
		
		// Усиливаем выбранную карту
		if (targetCard.originalStrength === undefined) {
			targetCard.originalStrength = targetCard.strength;
		}
		
		const currentStrength = targetCard._displayStrength !== undefined ? 
			targetCard._displayStrength : targetCard.strength;
		
		targetCard.strength = currentStrength + boostValue;
		targetCard._displayStrength = targetCard.strength;
		
		// Создаем визуальный эффект усиления
		this.createBoostVisualEffect(targetCard, row, boostValue);
		
		// Размещаем артефакт в ряд
		const artifactCopy = { ...artifactCard };
		artifactCopy.owner = 'player';
		artifactCopy.row = row;
		
		// Вставляем артефакт после усиленной карты
		rowState.cards.splice(insertPosition, 0, artifactCopy);
		
		// Удаляем карту из руки
		this.removeCardFromHand(artifactCard);
		
		// Обновляем отображение
		if (window.gameModule) {
			// Обновляем усиленную карту
			window.gameModule.updateCardStrengthDisplay(targetCard, row, 'player');
			
			// Отображаем артефакт на поле
			window.gameModule.displayCardOnRow(row, artifactCopy, 'player', insertPosition);
			
			// Обновляем силу ряда
			window.gameModule.updateRowStrength(row, 'player');
			
			// Завершаем ход
			window.gameModule.completeCardPlay();
		}
		
		// Воспроизводим звук
		if (window.audioManager && window.audioManager.playSound) {
			audioManager.playSound('artefact');
			audioManager.playSound('card_boost');
		}
		
		// Сбрасываем состояние
		this.cancelArtifactBoostSelection();
	},

	applyArtifactNearBoost: function(artifactCard, row, position) {
		const ability = artifactCard.ability;
		const boostMatch = ability.match(/boost_near_(\d+)/);
		const boostValue = boostMatch ? parseInt(boostMatch[1]) : 1;
		
		const rowState = this.gameState.player.rows[row];
		
		// Проверяем, есть ли место в ряду
		if (rowState.cards.length >= 9) {
			this.showMessage('В ряду максимальное количество карт!');
			return;
		}
		
		let boostedCards = 0;
		
		// Усиливаем карту слева
		if (position > 0) {
			const leftCard = rowState.cards[position - 1];
			if (leftCard.type === 'unit' && !this.isHeroCard(leftCard)) {
				if (leftCard.originalStrength === undefined) {
					leftCard.originalStrength = leftCard.strength;
				}
				
				const currentStrength = leftCard._displayStrength !== undefined ? 
					leftCard._displayStrength : leftCard.strength;
				
				leftCard.strength = currentStrength + boostValue;
				leftCard._displayStrength = leftCard.strength;
				boostedCards++;
				
				this.createBoostVisualEffect(leftCard, row, boostValue);
			}
		}
		
		// Усиливаем карту справа
		if (position < rowState.cards.length) {
			const rightCard = rowState.cards[position];
			if (rightCard.type === 'unit' && !this.isHeroCard(rightCard)) {
				if (rightCard.originalStrength === undefined) {
					rightCard.originalStrength = rightCard.strength;
				}
				
				const currentStrength = rightCard._displayStrength !== undefined ? 
					rightCard._displayStrength : rightCard.strength;
				
				rightCard.strength = currentStrength + boostValue;
				rightCard._displayStrength = rightCard.strength;
				boostedCards++;
				
				this.createBoostVisualEffect(rightCard, row, boostValue);
			}
		}
		
		if (boostedCards === 0) {
			this.showMessage('Рядом с этой позицией нет карт для усиления!');
			return;
		}
		
		// Размещаем артефакт в ряд на выбранной позиции
		const artifactCopy = { ...artifactCard };
		artifactCopy.owner = 'player';
		artifactCopy.row = row;
		
		rowState.cards.splice(position, 0, artifactCopy);
		
		// Удаляем карту из руки
		this.removeCardFromHand(artifactCard);
		
		// Обновляем отображение
		if (window.gameModule) {
			// Обновляем все карты в ряду
			rowState.cards.forEach((card, index) => {
				if (card.type === 'unit') {
					window.gameModule.updateCardStrengthDisplay(card, row, 'player');
				}
			});
			
			// Отображаем артефакт на поле
			window.gameModule.displayCardOnRow(row, artifactCopy, 'player', position);
			
			// Обновляем силу ряда
			window.gameModule.updateRowStrength(row, 'player');
			
			// Завершаем ход
			window.gameModule.completeCardPlay();
		}
		
		// Воспроизводим звук
		if (window.audioManager && window.audioManager.playSound) {
			audioManager.playSound('artefact');
			audioManager.playSound('card_boost');
		}
		
		// Сбрасываем состояние
		this.cancelArtifactBoostSelection();
	},

	cancelArtifactBoostSelection: function() {
		// Убираем подсветку карт
		const highlightedCards = document.querySelectorAll('.boost-target, .neighbor-highlight');
		highlightedCards.forEach(card => {
			card.classList.remove('boost-target');
			card.classList.remove('neighbor-highlight');
		});
		
		// Убираем все маркеры позиций
		this.removeAllPositionMarkers();
		
		// Очищаем обработчики
		if (this.gameState.boostSelectionHandlers) {
			this.gameState.boostSelectionHandlers.forEach(({ element, handler }) => {
				element.removeEventListener('click', handler);
			});
			this.gameState.boostSelectionHandlers = [];
		}
		
		if (this.gameState.positionSelectionHandlers) {
			this.gameState.positionSelectionHandlers.forEach(({ element, handler }) => {
				element.removeEventListener('click', handler);
			});
			this.gameState.positionSelectionHandlers = [];
		}
		
		// Сбрасываем состояние
		this.cancelRowSelection();
	},

	removeAllPositionMarkers: function() {
		const markers = document.querySelectorAll('.boost-position-marker');
		markers.forEach(marker => {
			marker.remove();
		});
	},

	executeRowDamage: function(damageCard, row) {
		const damageValue = this.getDamageValueFromAbility(damageCard.ability);
		
		this.removeCardFromHand(damageCard);
		
		const damageCardCopy = { ...damageCard };
		this.gameState.player.discard.push(damageCardCopy);
		
		const rowState = this.gameState.opponent.rows[row];
		let destroyedCards = [];
		
		rowState.cards.forEach(card => {
			if (this.isHeroCard(card)) {
				return;
			}
			
			if (card.type === 'unit') {
				const currentDisplayStrength = card._displayStrength !== undefined ? 
					card._displayStrength : card.strength;
				
				if (currentDisplayStrength > 0) {
					if (card.originalStrength === undefined) {
						card.originalStrength = card.strength;
					}
					
					if (card._damageDisplayStrength === undefined) {
						card._damageDisplayStrength = currentDisplayStrength;
					}
					
					const newStrength = Math.max(0, currentDisplayStrength - damageValue);
					
					card._damageDisplayStrength = newStrength;
					card._displayStrength = newStrength;
					
					this.createDamageVisualEffect(card, row, damageValue);
					
					if (window.gameModule) {
						window.gameModule.updateCardStrengthDisplay(card, row, 'opponent');
					}
					
					if (card._displayStrength === 0) {
						destroyedCards.push(card);
					}
				}
			}
		});
		
		for (let i = destroyedCards.length - 1; i >= 0; i--) {
			const destroyedCard = destroyedCards[i];
			const cardIndex = rowState.cards.findIndex(c => c.id === destroyedCard.id);
			
			if (cardIndex !== -1) {
				const destroyedCardCopy = { ...rowState.cards[cardIndex] };
				rowState.cards.splice(cardIndex, 1);
				this.gameState.opponent.discard.push(destroyedCardCopy);
				
				setTimeout(() => {
					if (window.gameModule) {
						window.gameModule.removeCardFromBoardVisual(destroyedCard, row, 'opponent');
					}
				}, 500);
				
				delete destroyedCard.originalStrength;
				delete destroyedCard._displayStrength;
				delete destroyedCard._damageDisplayStrength;
			}
		}
		
		if (window.gameModule) {
			window.gameModule.updateRowStrength(row, 'opponent');
			
			window.gameModule.displayPlayerDiscard();
			window.gameModule.displayOpponentDiscard();
			
			window.gameModule.completeCardPlay();
		}
		
		if (window.audioManager && window.audioManager.playSound) {
			audioManager.playSound('card_damage');
		}
		
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
			color: red;
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
		
		const hasArtifacts = document.querySelectorAll('.artifact-target').length > 0;
		if (!hasArtifacts) {
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
				if (this.isHeroCard(card)) {
					return;
				}
				
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
				if (unitCard.tags && (unitCard.tags.includes('hero') || unitCard.tags.includes('герой'))) {
					return;
				}
				
				if (unitCard.type === 'unit') {
					const cardKey = unitCard.uniqueId || `${unitCard.id}_${row}_${index}`;
					const cardElement = this.getCardElementOnBoard(unitCard, row, 'player', cardKey);
					if (cardElement) {
						cardElement.classList.add('decoy-target');
						cardElement.dataset.cardKey = cardKey;
						this.setupDecoySelectionHandler(cardElement, unitCard, row, cardKey);
					}
				}
			});
		});
	},

	getCardElementOnBoard: function(card, row, owner, cardKey = null) {
		const rowElement = document.getElementById(`${owner}${this.capitalizeFirst(row)}Row`);
		if (!rowElement) return null;
		
		if (cardKey) {
			const cardElement = rowElement.querySelector(`[data-card-key="${cardKey}"]`);
			if (cardElement) return cardElement;
		}
		
		const cardElements = rowElement.querySelectorAll('.board-card');
		for (let cardElement of cardElements) {
			if (cardElement.dataset.cardId === card.id) {
				const existingKey = cardElement.dataset.cardKey;
				if (!existingKey || existingKey === cardKey) {
					return cardElement;
				}
			}
		}
		return null;
	},

	setupDecoySelectionHandler: function(cardElement, card, row, cardKey) {
		const clickHandler = () => {
			if (this.gameState.selectingRow && this.gameState.placementType === 'decoy') {
				this.placeDecoyCard(this.gameState.decoyCard, card, row, cardKey);
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
			card: card,
			row: row,
			cardKey: cardKey
		});
	},

	placeDecoyCard: function(decoyCard, targetCard, row, cardKey) {
		const rowState = this.gameState.player.rows[row];
		const targetIndex = rowState.cards.findIndex(card => {
			const cardUniqueKey = card.uniqueId || `${card.id}_${row}_${rowState.cards.indexOf(card)}`;
			return cardKey === cardUniqueKey || card.id === targetCard.id;
		});
		
		if (targetIndex === -1) {
			this.showMessage('Карта не найдена в ряду!');
			return;
		}
		
		const cardCopy = { ...targetCard };
		cardCopy.playedThisRound = false;
		
		if (cardCopy.originalStrength !== undefined) {
			cardCopy.strength = cardCopy.originalStrength;
			delete cardCopy.originalStrength;
		}
		
		this.removeCardFromHand(decoyCard);
		this.gameState.player.hand.push(cardCopy);
		
		const placedDecoy = { ...decoyCard };
		placedDecoy.owner = 'player';
		placedDecoy.row = row;
		placedDecoy.currentStrength = 1;
		placedDecoy.uniqueId = `decoy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		rowState.cards[targetIndex] = placedDecoy;
		
		if (window.gameModule) {
			const rowElement = document.getElementById(`player${this.capitalizeFirst(row)}Row`);
			const oldCardElement = this.getCardElementOnBoard(targetCard, row, 'player', cardKey);
			if (oldCardElement) {
				const cardRect = oldCardElement.getBoundingClientRect();
				const rowRect = rowElement.getBoundingClientRect();
				const relativePosition = cardRect.left - rowRect.left;
				
				oldCardElement.remove();
				
				const decoyElement = window.gameModule.createBoardCardElement(placedDecoy, 'special');
				const cardsInRow = Array.from(rowElement.children);
				let insertIndex = 0;
				
				for (let i = 0; i < cardsInRow.length; i++) {
					const cardEl = cardsInRow[i];
					const elRect = cardEl.getBoundingClientRect();
					const elRelativePosition = elRect.left - rowRect.left;
					
					if (elRelativePosition > relativePosition) {
						break;
					}
					insertIndex++;
				}
				
				if (insertIndex < cardsInRow.length) {
					rowElement.insertBefore(decoyElement, cardsInRow[insertIndex]);
				} else {
					rowElement.appendChild(decoyElement);
				}
			} else {
				window.gameModule.displayCardOnRow(row, placedDecoy, 'player', targetIndex);
			}
			
			window.gameModule.displayPlayerHand();
			window.gameModule.updateRowStrength(row);
			window.gameModule.completeCardPlay();
		}
		
		if (window.audioManager && window.audioManager.playSound) {
			audioManager.playSound('artefact');
		}
		
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
				// Определяем тип карты
				const card = this.gameState.selectedCard;
				
				if (card.type === 'tactic') {
					if (card.ability && card.ability.startsWith('boost_')) {
						// Это карта усиления
						if (card.ability.startsWith('boost_row_')) {
							this.applyRowBoostCard(card, row);
						} else if (card.ability.startsWith('boost_tag_')) {
							this.applyTagBoostCard(card, row);
						}
					} else {
						// Обычная тактическая карта
						this.placeTacticCard(card, row);
					}
				}
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
		this.gameState.boostCard = null;
		this.gameState.boostTag = null;
	
		this.removeDecoyHighlights();
		this.removeArtifactHighlights();
		this.removeDamageHighlights();
		this.removeAllRowHighlights();
		this.removeAllTacticSlotHighlights();
		this.removeBoostHighlights();
		
		const positionMarkers = document.querySelectorAll('.boost-position-marker');
		positionMarkers.forEach(marker => {
			marker.remove();
		});
		
		const boostTargets = document.querySelectorAll('.boost-target');
		boostTargets.forEach(card => {
			card.classList.remove('boost-target');
		});
	
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