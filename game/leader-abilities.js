const leaderAbilities = {
	'scoiatael_ability_1': {
		name: 'Махакамская кузня',
		description: 'Усильте всех Краснолюдов на поле 3 еденицы',
		execute: function(gameState, gameModule) {
			const boostedCards = [];
			const rows = ['close', 'ranged', 'siege'];
			
			rows.forEach(row => {
				gameState.player.rows[row].cards.forEach(card => {
					if (card.tags && (card.tags.includes('dwarf') || card.tags.includes('краснолюд'))) {
						if (card.tags && (card.tags.includes('hero') || card.tags.includes('герой'))) return;
						this.boostCard(card, 3);
						boostedCards.push({ card: card, player: 'player', row: row });
						gameModule.updateRowStrength(row, 'player');
					}
				});
			});
			
			if (boostedCards.length === 0) {
				gameModule.showGameMessage('Нет краснолюдов на поле для усиления', 'warning');
				return false;
			}
			
			gameState.player.abilityUsedThisRound = true;
			gameModule.updateTotalScoreDisplays();
			gameModule.showGameMessage(`Способность "${this.name}" активирована! Усилено ${boostedCards.length} краснолюдов.`, 'info');
			audioManager.playSound('card_boost');
			
			return true;
		},
		
		boostCard: function(card, amount) {
			if (card.baseStrength === undefined) card.baseStrength = card.strength;
			if (card.originalStrength === undefined) card.originalStrength = card.strength;
			card.strength = (card.strength || 0) + amount;
			card.currentStrength = card.strength;
			card.modifiedStrength = card.strength;
			card._displayStrength = card.strength;
		}
	},
    'scoiatael_ability_2': {
        name: 'Засада ловчих',
        description: 'Призывите из колоды в руку карту Эльфа',
        execute: function(gameState, gameModule) {
            if (gameState.player.hand.length >= 10) {
                gameModule.showGameMessage('Нет места в руке для призыва', 'warning');
                return false;
            }
            
            // Ищем в колоде карту с тегом 'elf' или 'эльф'
            let elfIndex = -1;
            let elfCard = null;
            
            for (let i = 0; i < gameState.player.deck.length; i++) {
                const card = gameState.player.deck[i];
                if (card.tags && (card.tags.includes('elf') || card.tags.includes('эльф'))) {
                    elfIndex = i;
                    elfCard = card;
                    break;
                }
            }
            
            if (!elfCard) {
                gameModule.showGameMessage('В колоде нет карт с тегом "Эльф"', 'warning');
                return false;
            }
            
            // Удаляем из колоды и добавляем в руку
            gameState.player.deck.splice(elfIndex, 1);
            gameState.player.hand.push(elfCard);
            
            gameState.player.abilityUsedThisRound = true;
            gameModule.displayPlayerHand();
            gameModule.displayPlayerDeck();
            gameModule.showGameMessage(`Способность "${this.name}" активирована! ${elfCard.name} добавлен в руку.`, 'info');
            audioManager.playSound('cardAdd');
            
            return true;
        }
    },
	'scoiatael_ability_3': {
		name: 'Точный удар',
		description: 'Нанесите 5 едениц урона отряду противника',
		execute: function(gameState, gameModule) {
			this.showTargetSelection(gameState, gameModule);
			return true;
		},
		
		showTargetSelection: function(gameState, gameModule) {
			const enemyUnits = [];
			const rows = ['close', 'ranged', 'siege'];
			
			rows.forEach(row => {
				gameState.opponent.rows[row].cards.forEach(card => {
					if (card.type === 'unit') {
						if (card.tags && (card.tags.includes('hero') || card.tags.includes('герой'))) return;
						enemyUnits.push({ card: card, row: row });
					}
				});
			});
			
			if (enemyUnits.length === 0) {
				gameModule.showGameMessage('Нет вражеских отрядов для атаки', 'warning');
				return;
			}
			
			this.highlightEnemyUnits(enemyUnits, gameState, gameModule);
		},
		
		highlightEnemyUnits: function(enemyUnits, gameState, gameModule) {
			const rows = ['close', 'ranged', 'siege'];
			
			const clickHandler = (target) => {
				return () => {
					this.dealDamage(target.card, 5);
					gameState.player.abilityUsedThisRound = true;
					
					gameModule.updateRowStrength(target.row, 'opponent');
					gameModule.updateTotalScoreDisplays();
					
					if (target.card.strength <= 0) {
						this.destroyCard(gameState, target.card, target.row, gameModule);
					}
					
					gameModule.showGameMessage(`Способность "${this.name}" активирована! Нанесён 5 урон ${target.card.name}.`, 'info');
					audioManager.playSound('card_damage');
					
					this.removeHighlights();
				};
			};
			
			for (const row of rows) {
				const rowElement = document.getElementById(`opponent${gameModule.capitalizeFirst(row)}Row`);
				if (!rowElement) continue;
				const cards = rowElement.querySelectorAll('.board-card');
				cards.forEach(card => {
					const cardId = card.dataset.cardId;
					const uniqueId = card.dataset.uniqueId;
					const target = enemyUnits.find(u => 
						(u.card.id === cardId || u.card.uniqueId === uniqueId)
					);
					if (target) {
						card.style.cursor = 'pointer';
						card.classList.add('damage-target');
						card.addEventListener('click', clickHandler(target));
						card.addEventListener('mouseenter', () => {
							card.style.transform = 'scale(1.05)';
						});
						card.addEventListener('mouseleave', () => {
							card.style.transform = 'scale(1)';
						});
					}
				});
			}
			
			this.showCancelButton();
		},
		
		removeHighlights: function() {
			const rows = ['close', 'ranged', 'siege'];
			for (const row of rows) {
				const rowElement = document.getElementById(`opponent${gameModule.capitalizeFirst(row)}Row`);
				if (!rowElement) continue;
				const cards = rowElement.querySelectorAll('.board-card');
				cards.forEach(card => {
					card.style.cursor = '';
					card.classList.remove('damage-target');
					card.style.transform = '';
					const newCard = card.cloneNode(true);
					card.parentNode.replaceChild(newCard, card);
				});
			}
			this.removeCancelButton();
		},
		
		showCancelButton: function() {
			if (document.getElementById('abilityCancelBtn')) return;
			const cancelBtn = document.createElement('button');
			cancelBtn.id = 'abilityCancelBtn';
			cancelBtn.textContent = 'ОТМЕНА';
			cancelBtn.className = 'ability-cancel-btn';
			cancelBtn.addEventListener('click', () => {
				this.removeHighlights();
				audioManager.playSound('button');
			});
			document.body.appendChild(cancelBtn);
		},
		
		removeCancelButton: function() {
			const btn = document.getElementById('abilityCancelBtn');
			if (btn) btn.remove();
		},
		
		dealDamage: function(card, amount) {
			if (card.baseStrength === undefined) card.baseStrength = card.strength;
			if (card.originalStrength === undefined) card.originalStrength = card.strength;
			const newStrength = (card.strength || 0) - amount;
			card.strength = Math.max(0, newStrength);
			card.currentStrength = card.strength;
			card._displayStrength = card.strength;
		},
		
		destroyCard: function(gameState, card, row, gameModule) {
			const rowCards = gameState.opponent.rows[row].cards;
			const cardIndex = rowCards.findIndex(c => c.uniqueId === card.uniqueId);
			if (cardIndex !== -1) {
				const destroyedCard = rowCards.splice(cardIndex, 1)[0];
				gameModule.addCardToDiscard(destroyedCard, 'opponent');
				gameModule.redrawRow(row, 'opponent');
				gameModule.updateRowStrength(row, 'opponent');
				audioManager.playSound('card_destroy');
			}
		}
	},
	'scoiatael_ability_4': {
		name: 'Дар природы',
		description: 'Усильте 3 отряда на поле на 2 еденицы',
		execute: function(gameState, gameModule) {
			this.showMultiTargetSelection(gameState, gameModule);
			return true;
		},
		
		showMultiTargetSelection: function(gameState, gameModule) {
			let selectedCards = [];
			const maxSelections = 3;
			const boostAmount = 2;
			const allUnits = [];
			const rows = ['close', 'ranged', 'siege'];
			
			rows.forEach(row => {
				gameState.player.rows[row].cards.forEach(card => {
					if (card.type === 'unit') {
						if (card.tags && (card.tags.includes('hero') || card.tags.includes('герой'))) return;
						allUnits.push({ card: card, row: row, player: 'player' });
					}
				});
				gameState.opponent.rows[row].cards.forEach(card => {
					if (card.type === 'unit') {
						if (card.tags && (card.tags.includes('hero') || card.tags.includes('герой'))) return;
						allUnits.push({ card: card, row: row, player: 'opponent' });
					}
				});
			});
			
			if (allUnits.length === 0) {
				gameModule.showGameMessage('Нет отрядов на поле для усиления', 'warning');
				return;
			}
			
			this.highlightUnitsForBoost(allUnits, selectedCards, maxSelections, boostAmount, gameState, gameModule);
		},
		
		highlightUnitsForBoost: function(allUnits, selectedCards, maxSelections, boostAmount, gameState, gameModule) {
			const rows = ['close', 'ranged', 'siege'];
			
			const clickHandler = (target) => {
				return () => {
					const alreadySelected = selectedCards.some(s => s.card.uniqueId === target.card.uniqueId);
					if (!alreadySelected && selectedCards.length < maxSelections) {
						selectedCards.push(target);
						this.highlightCard(target.card, true);
						audioManager.playSound('cardAdd');
					} else if (alreadySelected) {
						const index = selectedCards.findIndex(s => s.card.uniqueId === target.card.uniqueId);
						selectedCards.splice(index, 1);
						this.highlightCard(target.card, false);
						audioManager.playSound('cardRemove');
					}
					
					this.updateSelectionCounter(maxSelections, selectedCards.length);
				};
			};
			
			for (const row of rows) {
				const rowElementPlayer = document.getElementById(`player${gameModule.capitalizeFirst(row)}Row`);
				const rowElementOpponent = document.getElementById(`opponent${gameModule.capitalizeFirst(row)}Row`);
				
				[rowElementPlayer, rowElementOpponent].forEach(rowElement => {
					if (!rowElement) return;
					const cards = rowElement.querySelectorAll('.board-card');
					cards.forEach(card => {
						const cardId = card.dataset.cardId;
						const uniqueId = card.dataset.uniqueId;
						const target = allUnits.find(u => 
							(u.card.id === cardId || u.card.uniqueId === uniqueId)
						);
						if (target) {
							card.style.cursor = 'pointer';
							card.classList.add('boost-target');
							card.addEventListener('click', clickHandler(target));
							card.addEventListener('mouseenter', () => {
								card.style.transform = 'scale(1.05)';
							});
							card.addEventListener('mouseleave', () => {
								if (!card.classList.contains('boost-selected')) {
									card.style.transform = 'scale(1)';
								}
							});
						}
					});
				});
			}
			
			this.createSelectionCounter(maxSelections);
			this.showConfirmButton(() => {
				if (selectedCards.length === 0) {
					gameModule.showGameMessage('Выберите хотя бы один отряд', 'warning');
					return;
				}
				
				selectedCards.forEach(item => {
					this.boostCard(item.card, boostAmount);
					gameModule.updateRowStrength(item.row, item.player);
				});
				
				gameState.player.abilityUsedThisRound = true;
				gameModule.updateTotalScoreDisplays();
				gameModule.showGameMessage(`Способность "${this.name}" активирована! Усилено ${selectedCards.length} отрядов.`, 'info');
				audioManager.playSound('card_boost');
				
				this.removeHighlights();
				this.removeSelectionCounter();
			});
		},
		
		highlightCard: function(card, isSelected) {
			const rows = ['close', 'ranged', 'siege'];
			for (const row of rows) {
				const rowElementPlayer = document.getElementById(`player${gameModule.capitalizeFirst(row)}Row`);
				const rowElementOpponent = document.getElementById(`opponent${gameModule.capitalizeFirst(row)}Row`);
				[rowElementPlayer, rowElementOpponent].forEach(rowElement => {
					if (!rowElement) return;
					const cardElement = rowElement.querySelector(`[data-unique-id="${card.uniqueId}"]`);
					if (cardElement) {
						if (isSelected) {
							cardElement.classList.add('boost-selected');
							cardElement.style.filter = 'brightness(1.2) drop-shadow(0 0 8px #4CAF50)';
						} else {
							cardElement.classList.remove('boost-selected');
							cardElement.style.filter = '';
						}
					}
				});
			}
		},
		
		createSelectionCounter: function(max) {
			// Удаляем существующий счетчик
			const existingCounter = document.getElementById('abilityCounter');
			if (existingCounter) existingCounter.remove();
			
			const counter = document.createElement('div');
			counter.id = 'abilityCounter';
			counter.className = 'ability-counter';
			counter.textContent = `Выбрано: 0/${max}`;
			counter.style.cssText = `
				position: fixed;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
				background: rgba(0, 0, 0, 0.85);
				color: #d4af37;
				padding: 12px 24px;
				border-radius: 8px;
				font-family: 'Gwent', sans-serif;
				font-size: 18px;
				font-weight: bold;
				z-index: 10050;
				border: 2px solid #d4af37;
				text-align: center;
				pointer-events: none;
				box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
			`;
			document.body.appendChild(counter);
		},
		
		updateSelectionCounter: function(max, current) {
			const counter = document.getElementById('abilityCounter');
			if (counter) counter.textContent = `Выбрано: ${current}/${max}`;
		},
		
		removeSelectionCounter: function() {
			const counter = document.getElementById('abilityCounter');
			if (counter) counter.remove();
		},
		
		showConfirmButton: function(onConfirm) {
			// Удаляем существующую кнопку
			const existingBtn = document.getElementById('abilityConfirmBtn');
			if (existingBtn) existingBtn.remove();
			
			const confirmBtn = document.createElement('button');
			confirmBtn.id = 'abilityConfirmBtn';
			confirmBtn.textContent = 'ПОДТВЕРДИТЬ';
			confirmBtn.className = 'ability-confirm-btn';
			confirmBtn.style.cssText = `
				position: fixed;
				bottom: 30px;
				right: 30px;
				background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
				color: #4CAF50;
				border: 2px solid #4CAF50;
				padding: 12px 35px;
				border-radius: 8px;
				cursor: pointer;
				font-weight: bold;
				font-family: 'Gwent', sans-serif;
				font-size: 16px;
				text-transform: uppercase;
				letter-spacing: 2px;
				z-index: 10050;
				transition: all 0.3s ease;
				box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
			`;
			confirmBtn.addEventListener('click', () => {
				onConfirm();
				audioManager.playSound('button');
			});
			confirmBtn.addEventListener('mouseenter', () => {
				confirmBtn.style.transform = 'scale(1.05)';
				confirmBtn.style.boxShadow = '0 0 20px rgba(76, 175, 80, 0.5)';
				audioManager.playSound('touch');
			});
			confirmBtn.addEventListener('mouseleave', () => {
				confirmBtn.style.transform = 'scale(1)';
				confirmBtn.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
			});
			document.body.appendChild(confirmBtn);
		},
		
		showCancelButton: function() {
			// Удаляем существующую кнопку
			const existingBtn = document.getElementById('abilityCancelBtn');
			if (existingBtn) existingBtn.remove();
			
			const cancelBtn = document.createElement('button');
			cancelBtn.id = 'abilityCancelBtn';
			cancelBtn.textContent = 'ОТМЕНА';
			cancelBtn.className = 'ability-cancel-btn';
			cancelBtn.style.cssText = `
				position: fixed;
				bottom: 30px;
				left: 30px;
				background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
				color: #d4af37;
				border: 2px solid #d4af37;
				padding: 12px 35px;
				border-radius: 8px;
				cursor: pointer;
				font-weight: bold;
				font-family: 'Gwent', sans-serif;
				font-size: 16px;
				text-transform: uppercase;
				letter-spacing: 2px;
				z-index: 10050;
				transition: all 0.3s ease;
				box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
			`;
			cancelBtn.addEventListener('click', () => {
				this.removeHighlights();
				this.removeSelectionCounter();
				audioManager.playSound('button');
			});
			cancelBtn.addEventListener('mouseenter', () => {
				cancelBtn.style.transform = 'scale(1.05)';
				cancelBtn.style.boxShadow = '0 0 20px rgba(212, 175, 55, 0.5)';
				audioManager.playSound('touch');
			});
			cancelBtn.addEventListener('mouseleave', () => {
				cancelBtn.style.transform = 'scale(1)';
				cancelBtn.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
			});
			document.body.appendChild(cancelBtn);
		},
		
		removeHighlights: function() {
			const rows = ['close', 'ranged', 'siege'];
			for (const row of rows) {
				const rowElementPlayer = document.getElementById(`player${gameModule.capitalizeFirst(row)}Row`);
				const rowElementOpponent = document.getElementById(`opponent${gameModule.capitalizeFirst(row)}Row`);
				[rowElementPlayer, rowElementOpponent].forEach(rowElement => {
					if (!rowElement) return;
					const cards = rowElement.querySelectorAll('.board-card');
					cards.forEach(card => {
						card.style.cursor = '';
						card.classList.remove('boost-target', 'boost-selected');
						card.style.filter = '';
						card.style.transform = '';
						// Не клонируем, чтобы не ломать события
					});
				});
			}
			this.removeCancelButton();
			const confirmBtn = document.getElementById('abilityConfirmBtn');
			if (confirmBtn) confirmBtn.remove();
		},
		
		removeCancelButton: function() {
			const btn = document.getElementById('abilityCancelBtn');
			if (btn) btn.remove();
		},
		
		boostCard: function(card, amount) {
			if (card.baseStrength === undefined) card.baseStrength = card.strength;
			if (card.originalStrength === undefined) card.originalStrength = card.strength;
			card.strength = (card.strength || 0) + amount;
			card.currentStrength = card.strength;
			card.modifiedStrength = card.strength;
			card._displayStrength = card.strength;
		}
	},
	'scoiatael_ability_5': {
		name: 'Партизанская тактика',
		description: 'Нанесите 3 еденицы урона всем картам в ряду противника',
		execute: function(gameState, gameModule) {
			this.showRowSelection(gameState, gameModule);
			return true;
		},
		
		showRowSelection: function(gameState, gameModule) {
			// Сначала определяем, в каких рядах есть карты противника
			const rowsWithCards = [];
			const rows = [
				{ id: 'close', name: 'Ближний бой', elementId: 'opponentCloseRow' },
				{ id: 'ranged', name: 'Дальний бой', elementId: 'opponentRangedRow' },
				{ id: 'siege', name: 'Осадный', elementId: 'opponentSiegeRow' }
			];
			
			rows.forEach(row => {
				// Проверяем, есть ли в этом ряду карты
				const hasCards = gameState.opponent.rows[row.id].cards.length > 0;
				if (hasCards) {
					rowsWithCards.push(row);
				}
			});
			
			if (rowsWithCards.length === 0) {
				gameModule.showGameMessage('Нет отрядов противника на поле для атаки', 'warning');
				return;
			}
			
			const clickHandler = (rowId, rowName) => {
				return () => {
					let damagedCount = 0;
					const unitsToDestroy = [];
					
					gameState.opponent.rows[rowId].cards.forEach(card => {
						if (card.type === 'unit') {
							// Пропускаем героев
							if (card.tags && (card.tags.includes('hero') || card.tags.includes('герой'))) return;
							
							this.dealDamage(card, 3);
							damagedCount++;
							
							if (card.strength <= 0) {
								unitsToDestroy.push({ card: card, row: rowId });
							}
						}
					});
					
					// Уничтожаем уничтоженные карты
					unitsToDestroy.forEach(unit => {
						this.destroyCard(gameState, unit.card, unit.row, gameModule);
					});
					
					if (damagedCount === 0) {
						gameModule.showGameMessage('В выбранном ряду нет уязвимых отрядов', 'warning');
						this.removeHighlights();
						return;
					}
					
					gameState.player.abilityUsedThisRound = true;
					gameModule.updateRowStrength(rowId, 'opponent');
					gameModule.updateTotalScoreDisplays();
					gameModule.showGameMessage(`Способность "${this.name}" активирована! Нанесён урон ${damagedCount} отрядам.`, 'info');
					audioManager.playSound('card_damage');
					
					this.removeHighlights();
				};
			};
			
			// Подсвечиваем ТОЛЬКО ряды, в которых есть карты
			rowsWithCards.forEach(row => {
				const rowElement = document.getElementById(row.elementId);
				if (rowElement) {
					rowElement.classList.add('row-damage-target');
					rowElement.style.cursor = 'pointer';
					rowElement.addEventListener('click', clickHandler(row.id, row.name));
					
					// Добавляем эффекты наведения
					rowElement.addEventListener('mouseenter', () => {
						rowElement.style.transform = 'scale(1.02)';
						rowElement.style.transition = 'all 0.2s ease';
					});
					rowElement.addEventListener('mouseleave', () => {
						rowElement.style.transform = 'scale(1)';
					});
				}
			});
			
			this.showCancelButton();
		},
		
		removeHighlights: function() {
			const rows = ['close', 'ranged', 'siege'];
			rows.forEach(row => {
				const rowElement = document.getElementById(`opponent${gameModule.capitalizeFirst(row)}Row`);
				if (rowElement) {
					rowElement.classList.remove('row-damage-target');
					rowElement.style.cursor = '';
					rowElement.style.transform = '';
					// Клонируем для удаления обработчиков
					const newRow = rowElement.cloneNode(true);
					rowElement.parentNode.replaceChild(newRow, rowElement);
				}
			});
			this.removeCancelButton();
		},
		
		showCancelButton: function() {
			// Удаляем существующую кнопку
			const existingBtn = document.getElementById('abilityCancelBtn');
			if (existingBtn) existingBtn.remove();
			
			const cancelBtn = document.createElement('button');
			cancelBtn.id = 'abilityCancelBtn';
			cancelBtn.textContent = 'ОТМЕНА';
			cancelBtn.className = 'ability-cancel-btn';
			cancelBtn.style.cssText = `
				position: fixed;
				bottom: 30px;
				left: 30px;
				background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
				color: #d4af37;
				border: 2px solid #d4af37;
				padding: 12px 35px;
				border-radius: 8px;
				cursor: pointer;
				font-weight: bold;
				font-family: 'Gwent', sans-serif;
				font-size: 16px;
				text-transform: uppercase;
				letter-spacing: 2px;
				z-index: 10050;
				transition: all 0.3s ease;
				box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
			`;
			cancelBtn.addEventListener('click', () => {
				this.removeHighlights();
				audioManager.playSound('button');
			});
			cancelBtn.addEventListener('mouseenter', () => {
				cancelBtn.style.transform = 'scale(1.05)';
				cancelBtn.style.boxShadow = '0 0 20px rgba(212, 175, 55, 0.5)';
				audioManager.playSound('touch');
			});
			cancelBtn.addEventListener('mouseleave', () => {
				cancelBtn.style.transform = 'scale(1)';
				cancelBtn.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
			});
			document.body.appendChild(cancelBtn);
		},
		
		removeCancelButton: function() {
			const btn = document.getElementById('abilityCancelBtn');
			if (btn) btn.remove();
		},
		
		dealDamage: function(card, amount) {
			if (card.baseStrength === undefined) card.baseStrength = card.strength;
			if (card.originalStrength === undefined) card.originalStrength = card.strength;
			const newStrength = (card.strength || 0) - amount;
			card.strength = Math.max(0, newStrength);
			card.currentStrength = card.strength;
			card._displayStrength = card.strength;
		},
		
		destroyCard: function(gameState, card, row, gameModule) {
			const rowCards = gameState.opponent.rows[row].cards;
			const cardIndex = rowCards.findIndex(c => c.uniqueId === card.uniqueId);
			if (cardIndex !== -1) {
				const destroyedCard = rowCards.splice(cardIndex, 1)[0];
				gameModule.addCardToDiscard(destroyedCard, 'opponent');
				gameModule.redrawRow(row, 'opponent');
				gameModule.updateRowStrength(row, 'opponent');
				audioManager.playSound('card_destroy');
			}
		}
	},
	
	'realms_ability_1': {
		name: 'Королевское вдохновение',
		description: 'Усильте дружественный отряд на 5 едениц',
		execute: function(gameState, gameModule) {
			// Собираем все дружественные отряды на поле
			const friendlyUnits = [];
			const rows = ['close', 'ranged', 'siege'];
			
			rows.forEach(row => {
				gameState.player.rows[row].cards.forEach((card, index) => {
					if (card.type === 'unit') {
						friendlyUnits.push({
							card: card,
							row: row,
							index: index
						});
					}
				});
			});
			
			if (friendlyUnits.length === 0) {
				gameModule.showGameMessage('Нет дружественных отрядов на поле для усиления', 'warning');
				return false;
			}
			
			// Показываем выбор цели
			this.showTargetSelection(friendlyUnits, gameState, gameModule);
			return true;
		},
		
		showTargetSelection: function(friendlyUnits, gameState, gameModule) {
			const modalOverlay = document.createElement('div');
			modalOverlay.className = 'ability-target-overlay';
			modalOverlay.style.cssText = `
				position: fixed;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				background: rgba(0,0,0,0.85);
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				z-index: 10001;
				font-family: 'Gwent', sans-serif;
			`;
			
			modalOverlay.innerHTML = `
				<div class="ability-target-modal">
					<div class="ability-target-title">ВЫБЕРИТЕ ОТРЯД ДЛЯ УСИЛЕНИЯ НА 5 ЕД.</div>
					<div class="ability-target-cards">
						${friendlyUnits.map((unit, idx) => `
							<div class="ability-target-card" data-target-index="${idx}">
								<div class="ability-target-card-name">${unit.card.name}</div>
								<div class="ability-target-card-strength">Сила: ${unit.card.strength} → ${unit.card.strength + 5}</div>
								<div class="ability-target-card-row">Ряд: ${this.getRowName(unit.row)}</div>
							</div>
						`).join('')}
					</div>
					<button class="ability-cancel-btn">ОТМЕНА</button>
				</div>
			`;
			
			document.body.appendChild(modalOverlay);
			
			const targetCards = modalOverlay.querySelectorAll('.ability-target-card');
			targetCards.forEach(card => {
				card.addEventListener('click', (e) => {
					const index = parseInt(card.dataset.targetIndex);
					const target = friendlyUnits[index];
					
					this.boostCard(target.card, 5);
					gameState.player.abilityUsedThisRound = true;
					
					gameModule.updateRowStrength(target.row, 'player');
					gameModule.updateTotalScoreDisplays();
					gameModule.updateCardStrengthDisplay(target.card, target.row, 'player');
					gameModule.showGameMessage(`Способность "${this.name}" активирована! ${target.card.name} усилен на 5 ед.`, 'info');
					audioManager.playSound('card_boost');
					
					document.body.removeChild(modalOverlay);
				});
				
				card.addEventListener('mouseenter', () => {
					audioManager.playSound('touch');
					card.style.transform = 'scale(1.02)';
				});
				
				card.addEventListener('mouseleave', () => {
					card.style.transform = 'scale(1)';
				});
			});
			
			const cancelBtn = modalOverlay.querySelector('.ability-cancel-btn');
			cancelBtn.addEventListener('click', () => {
				document.body.removeChild(modalOverlay);
				audioManager.playSound('button');
			});
		},
		
		boostCard: function(card, amount) {
			if (card.baseStrength === undefined) {
				card.baseStrength = card.strength;
			}
			if (card.originalStrength === undefined) {
				card.originalStrength = card.strength;
			}
			
			card.strength = (card.strength || 0) + amount;
			card.currentStrength = card.strength;
			card.modifiedStrength = card.strength;
			card._displayStrength = card.strength;
		},
		
		getRowName: function(row) {
			const names = {
				'close': 'Ближний бой',
				'ranged': 'Дальний бой',
				'siege': 'Осадный'
			};
			return names[row] || row;
		}
	},
	'realms_ability_2': {
		name: 'Ополчение',
		description: 'Нанесите 3 еденицы урона 2-м отрядам противника',
		execute: function(gameState, gameModule) {
			let selectedCards = [];
			const maxSelections = 2;
			const damageAmount = 3;
			const enemyUnits = [];
			const rows = ['close', 'ranged', 'siege'];
			
			rows.forEach(row => {
				gameState.opponent.rows[row].cards.forEach(card => {
					if (card.type === 'unit') {
						if (card.tags && (card.tags.includes('hero') || card.tags.includes('герой'))) return;
						enemyUnits.push({ card: card, row: row });
					}
				});
			});
			
			if (enemyUnits.length === 0) {
				gameModule.showGameMessage('Нет вражеских отрядов для атаки', 'warning');
				return false;
			}
			
			this.highlightEnemyUnitsForDamage(enemyUnits, selectedCards, maxSelections, damageAmount, gameState, gameModule);
			return true;
		},
		
		highlightEnemyUnitsForDamage: function(enemyUnits, selectedCards, maxSelections, damageAmount, gameState, gameModule) {
			const rows = ['close', 'ranged', 'siege'];
			
			const clickHandler = (target) => {
				return () => {
					const alreadySelected = selectedCards.some(s => s.card.uniqueId === target.card.uniqueId);
					if (!alreadySelected && selectedCards.length < maxSelections) {
						selectedCards.push(target);
						this.highlightDamageCard(target.card, true);
						audioManager.playSound('cardAdd');
					} else if (alreadySelected) {
						const index = selectedCards.findIndex(s => s.card.uniqueId === target.card.uniqueId);
						selectedCards.splice(index, 1);
						this.highlightDamageCard(target.card, false);
						audioManager.playSound('cardRemove');
					}
					
					this.updateDamageCounter(maxSelections, selectedCards.length);
				};
			};
			
			for (const row of rows) {
				const rowElement = document.getElementById(`opponent${gameModule.capitalizeFirst(row)}Row`);
				if (!rowElement) continue;
				const cards = rowElement.querySelectorAll('.board-card');
				cards.forEach(card => {
					const cardId = card.dataset.cardId;
					const uniqueId = card.dataset.uniqueId;
					const target = enemyUnits.find(u => 
						(u.card.id === cardId || u.card.uniqueId === uniqueId)
					);
					if (target) {
						card.style.cursor = 'pointer';
						card.classList.add('damage-target');
						card.addEventListener('click', clickHandler(target));
						card.addEventListener('mouseenter', () => {
							card.style.transform = 'scale(1.05)';
						});
						card.addEventListener('mouseleave', () => {
							if (!card.classList.contains('damage-selected')) {
								card.style.transform = 'scale(1)';
							}
						});
					}
				});
			}
			
			this.createDamageCounter(maxSelections);
			this.showDamageConfirmButton(() => {
				if (selectedCards.length === 0) {
					gameModule.showGameMessage('Выберите хотя бы одну цель', 'warning');
					return;
				}
				
				selectedCards.forEach(item => {
					this.dealDamage(item.card, damageAmount);
					if (item.card.strength <= 0) {
						this.destroyCard(gameState, item.card, item.row, gameModule);
					}
					gameModule.updateRowStrength(item.row, 'opponent');
				});
				
				gameState.player.abilityUsedThisRound = true;
				gameModule.updateTotalScoreDisplays();
				gameModule.showGameMessage(`Способность "${this.name}" активирована! Нанесён урон ${selectedCards.length} отрядам.`, 'info');
				audioManager.playSound('card_damage');
				
				this.removeDamageHighlights();
				this.removeDamageCounter();
			});
		},
		
		highlightDamageCard: function(card, isSelected) {
			const rows = ['close', 'ranged', 'siege'];
			for (const row of rows) {
				const rowElement = document.getElementById(`opponent${gameModule.capitalizeFirst(row)}Row`);
				if (!rowElement) return;
				const cardElement = rowElement.querySelector(`[data-unique-id="${card.uniqueId}"]`);
				if (cardElement) {
					if (isSelected) {
						cardElement.classList.add('damage-selected');
						cardElement.style.filter = 'brightness(1.2) drop-shadow(0 0 8px #ff4444)';
					} else {
						cardElement.classList.remove('damage-selected');
						cardElement.style.filter = '';
					}
				}
			}
		},
		
		createDamageCounter: function(max) {
			if (document.getElementById('abilityCounter')) return;
			const counter = document.createElement('div');
			counter.id = 'abilityCounter';
			counter.className = 'ability-counter';
			counter.textContent = `Выбрано: 0/${max}`;
			counter.style.cssText = `
				position: fixed;
				top: 80px;
				left: 50%;
				transform: translateX(-50%);
				background: rgba(0, 0, 0, 0.85);
				color: #d4af37;
				padding: 12px 24px;
				border-radius: 8px;
				font-family: 'Gwent', sans-serif;
				font-size: 18px;
				font-weight: bold;
				z-index: 10005;
				border: 2px solid #d4af37;
				box-shadow: 0 0 20px rgba(212, 175, 55, 0.3);
				pointer-events: none;
			`;
			document.body.appendChild(counter);
		},
		
		updateDamageCounter: function(max, current) {
			const counter = document.getElementById('abilityCounter');
			if (counter) counter.textContent = `Выбрано: ${current}/${max}`;
		},
		
		removeDamageCounter: function() {
			const counter = document.getElementById('abilityCounter');
			if (counter) counter.remove();
		},
		
		showDamageConfirmButton: function(onConfirm) {
			if (document.getElementById('abilityConfirmBtn')) return;
			const confirmBtn = document.createElement('button');
			confirmBtn.id = 'abilityConfirmBtn';
			confirmBtn.textContent = 'ПОДТВЕРДИТЬ';
			confirmBtn.style.cssText = `
				position: fixed;
				bottom: 30px;
				right: 30px;
				background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
				color: #4CAF50;
				border: 2px solid #4CAF50;
				padding: 12px 32px;
				border-radius: 8px;
				cursor: pointer;
				font-weight: bold;
				font-family: 'Gwent', sans-serif;
				font-size: 16px;
				text-transform: uppercase;
				letter-spacing: 2px;
				z-index: 10005;
				transition: all 0.3s ease;
				box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
			`;
			confirmBtn.addEventListener('mouseenter', () => {
				confirmBtn.style.transform = 'scale(1.05)';
				confirmBtn.style.boxShadow = '0 0 20px rgba(76, 175, 80, 0.5)';
				audioManager.playSound('touch');
			});
			confirmBtn.addEventListener('mouseleave', () => {
				confirmBtn.style.transform = 'scale(1)';
				confirmBtn.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
			});
			confirmBtn.addEventListener('click', () => {
				onConfirm();
				audioManager.playSound('button');
			});
			document.body.appendChild(confirmBtn);
		},
		
		removeDamageHighlights: function() {
			const rows = ['close', 'ranged', 'siege'];
			for (const row of rows) {
				const rowElement = document.getElementById(`opponent${gameModule.capitalizeFirst(row)}Row`);
				if (!rowElement) continue;
				const cards = rowElement.querySelectorAll('.board-card');
				cards.forEach(card => {
					card.style.cursor = '';
					card.classList.remove('damage-target', 'damage-selected');
					card.style.filter = '';
					card.style.transform = '';
					const newCard = card.cloneNode(true);
					card.parentNode.replaceChild(newCard, card);
				});
			}
			this.removeCancelButton();
			const confirmBtn = document.getElementById('abilityConfirmBtn');
			if (confirmBtn) confirmBtn.remove();
		},
		
		showCancelButton: function() {
			if (document.getElementById('abilityCancelBtn')) return;
			const cancelBtn = document.createElement('button');
			cancelBtn.id = 'abilityCancelBtn';
			cancelBtn.textContent = 'ОТМЕНА';
			cancelBtn.style.cssText = `
				position: fixed;
				bottom: 30px;
				left: 50%;
				transform: translateX(-50%);
				background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
				color: #d4af37;
				border: 2px solid #d4af37;
				padding: 12px 32px;
				border-radius: 8px;
				cursor: pointer;
				font-weight: bold;
				font-family: 'Gwent', sans-serif;
				font-size: 16px;
				text-transform: uppercase;
				letter-spacing: 2px;
				z-index: 10005;
				transition: all 0.3s ease;
				box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
			`;
			cancelBtn.addEventListener('mouseenter', () => {
				cancelBtn.style.transform = 'translateX(-50%) scale(1.05)';
				cancelBtn.style.boxShadow = '0 0 20px rgba(212, 175, 55, 0.5)';
				audioManager.playSound('touch');
			});
			cancelBtn.addEventListener('mouseleave', () => {
				cancelBtn.style.transform = 'translateX(-50%) scale(1)';
				cancelBtn.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
			});
			cancelBtn.addEventListener('click', () => {
				this.removeDamageHighlights();
				this.removeDamageCounter();
				audioManager.playSound('button');
			});
			document.body.appendChild(cancelBtn);
		},
		
		removeCancelButton: function() {
			const btn = document.getElementById('abilityCancelBtn');
			if (btn) btn.remove();
		},
		
		dealDamage: function(card, amount) {
			if (card.baseStrength === undefined) card.baseStrength = card.strength;
			if (card.originalStrength === undefined) card.originalStrength = card.strength;
			const newStrength = (card.strength || 0) - amount;
			card.strength = Math.max(0, newStrength);
			card.currentStrength = card.strength;
			card._displayStrength = card.strength;
		},
		
		destroyCard: function(gameState, card, row, gameModule) {
			const rowCards = gameState.opponent.rows[row].cards;
			const cardIndex = rowCards.findIndex(c => c.uniqueId === card.uniqueId);
			if (cardIndex !== -1) {
				const destroyedCard = rowCards.splice(cardIndex, 1)[0];
				gameModule.addCardToDiscard(destroyedCard, 'opponent');
				gameModule.redrawRow(row, 'opponent');
				gameModule.updateRowStrength(row, 'opponent');
				audioManager.playSound('card_destroy');
			}
		}
	},
    'realms_ability_3': {
        name: 'Стена щитов',
        description: 'Усильте дружественный отряд на 2 еденицы и призвать в руку артефакт',
        execute: function(gameState, gameModule) {
            const friendlyUnits = [];
            const rows = ['close', 'ranged', 'siege'];
            
            rows.forEach(row => {
                gameState.player.rows[row].cards.forEach((card, index) => {
                    if (card.type === 'unit') {
                        friendlyUnits.push({ card: card, row: row, index: index });
                    }
                });
            });
            
            if (friendlyUnits.length === 0) {
                gameModule.showGameMessage('Нет дружественных отрядов на поле для усиления', 'warning');
                return false;
            }
            
            this.showTargetSelection(friendlyUnits, gameState, gameModule);
            return true;
        },
        
        showTargetSelection: function(friendlyUnits, gameState, gameModule) {
            const rows = ['close', 'ranged', 'siege'];
            const clickHandler = (event) => {
                const cardElement = event.currentTarget;
                const cardId = cardElement.dataset.cardId;
                const uniqueId = cardElement.dataset.uniqueId;
                const row = cardElement.dataset.row;
                
                let targetCard = null;
                for (const r of rows) {
                    const card = gameState.player.rows[r].cards.find(c => 
                        (c.id === cardId || c.uniqueId === uniqueId)
                    );
                    if (card) {
                        targetCard = card;
                        break;
                    }
                }
                
                if (targetCard) {
                    if (targetCard.tags && (targetCard.tags.includes('hero') || targetCard.tags.includes('герой'))) {
                        gameModule.showGameMessage('Нельзя усилить Героя!', 'warning');
                        this.removeHighlights();
                        document.removeEventListener('click', clickHandler);
                        return;
                    }
                    
                    this.boostCard(targetCard, 2);
                    
                    // Ищем артефакт в колоде
                    let artifactIndex = -1;
                    let artifactCard = null;
                    for (let i = 0; i < gameState.player.deck.length; i++) {
                        if (gameState.player.deck[i].type === 'artifact') {
                            artifactIndex = i;
                            artifactCard = gameState.player.deck[i];
                            break;
                        }
                    }
                    
                    if (artifactCard && gameState.player.hand.length < 10) {
                        gameState.player.deck.splice(artifactIndex, 1);
                        gameState.player.hand.push(artifactCard);
                        gameModule.displayPlayerHand();
                        gameModule.displayPlayerDeck();
                        gameModule.showGameMessage(`Артефакт "${artifactCard.name}" добавлен в руку из колоды!`, 'info');
                        audioManager.playSound('cardAdd');
                    } else if (gameState.player.hand.length >= 10) {
                        gameModule.showGameMessage('Нет места в руке для артефакта', 'warning');
                    } else {
                        gameModule.showGameMessage('В колоде нет артефактов', 'warning');
                    }
                    
                    gameState.player.abilityUsedThisRound = true;
                    gameModule.updateRowStrength(row, 'player');
                    gameModule.updateTotalScoreDisplays();
                    gameModule.updateCardStrengthDisplay(targetCard, row, 'player');
                    gameModule.showGameMessage(`Способность "${this.name}" активирована! ${targetCard.name} усилен на 2 ед.`, 'info');
                    audioManager.playSound('card_boost');
                }
                
                this.removeHighlights();
                document.removeEventListener('click', clickHandler);
            };
            
            this.highlightPlayerUnits(gameState, rows, clickHandler);
        },
        
        highlightPlayerUnits: function(gameState, rows, clickHandler) {
            for (const row of rows) {
                const rowElement = document.getElementById(`player${gameModule.capitalizeFirst(row)}Row`);
                if (!rowElement) continue;
                const cards = rowElement.querySelectorAll('.board-card');
                cards.forEach(card => {
                    card.style.cursor = 'pointer';
                    card.style.filter = 'brightness(1.2) drop-shadow(0 0 8px #4CAF50)';
                    card.style.transition = 'all 0.2s ease';
                    card.dataset.row = row;
                    card.addEventListener('click', clickHandler);
                    card.addEventListener('mouseenter', () => {
                        card.style.transform = 'scale(1.05)';
                    });
                    card.addEventListener('mouseleave', () => {
                        card.style.transform = 'scale(1)';
                    });
                });
            }
            this.showCancelButton();
        },
        
        removeHighlights: function() {
            const rows = ['close', 'ranged', 'siege'];
            for (const row of rows) {
                const rowElement = document.getElementById(`player${gameModule.capitalizeFirst(row)}Row`);
                if (!rowElement) continue;
                const cards = rowElement.querySelectorAll('.board-card');
                cards.forEach(card => {
                    card.style.cursor = '';
                    card.style.filter = '';
                    card.style.transform = '';
                    const newCard = card.cloneNode(true);
                    card.parentNode.replaceChild(newCard, card);
                });
            }
            this.removeCancelButton();
        },
        
        showCancelButton: function() {
            if (document.getElementById('abilityCancelBtn')) return;
            const cancelBtn = document.createElement('button');
            cancelBtn.id = 'abilityCancelBtn';
            cancelBtn.textContent = 'ОТМЕНА';
            cancelBtn.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #d4af37;
                color: #1a1a1a;
                border: none;
                padding: 10px 30px;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
                z-index: 10002;
                font-family: 'Gwent', sans-serif;
            `;
            cancelBtn.addEventListener('click', () => {
                this.removeHighlights();
                audioManager.playSound('button');
            });
            document.body.appendChild(cancelBtn);
        },
        
        removeCancelButton: function() {
            const btn = document.getElementById('abilityCancelBtn');
            if (btn) btn.remove();
        },
        
        boostCard: function(card, amount) {
            if (card.baseStrength === undefined) card.baseStrength = card.strength;
            if (card.originalStrength === undefined) card.originalStrength = card.strength;
            card.strength = (card.strength || 0) + amount;
            card.currentStrength = card.strength;
            card.modifiedStrength = card.strength;
            card._displayStrength = card.strength;
        }
    },
	'realms_ability_4': {
		name: 'Побуждение к действию',
		description: 'Усильте дружественный отряд на поле на 3 еденицы',
		execute: function(gameState, gameModule) {
			const friendlyUnits = [];
			const rows = ['close', 'ranged', 'siege'];
			
			rows.forEach(row => {
				gameState.player.rows[row].cards.forEach(card => {
					if (card.type === 'unit') {
						if (card.tags && (card.tags.includes('hero') || card.tags.includes('герой'))) return;
						friendlyUnits.push({ card: card, row: row });
					}
				});
			});
			
			if (friendlyUnits.length === 0) {
				gameModule.showGameMessage('Нет дружественных отрядов на поле для усиления', 'warning');
				return false;
			}
			
			this.showTargetSelection(friendlyUnits, gameState, gameModule);
			return true;
		},
		
		showTargetSelection: function(friendlyUnits, gameState, gameModule) {
			const rows = ['close', 'ranged', 'siege'];
			
			const clickHandler = (target) => {
				return () => {
					this.boostCard(target.card, 3);
					gameState.player.abilityUsedThisRound = true;
					
					gameModule.updateRowStrength(target.row, 'player');
					gameModule.updateTotalScoreDisplays();
					gameModule.showGameMessage(`Способность "${this.name}" активирована! ${target.card.name} усилен на 3 ед.`, 'info');
					audioManager.playSound('card_boost');
					
					this.removeTargetHighlights();
				};
			};
			
			for (const row of rows) {
				const rowElement = document.getElementById(`player${gameModule.capitalizeFirst(row)}Row`);
				if (!rowElement) continue;
				const cards = rowElement.querySelectorAll('.board-card');
				cards.forEach(card => {
					const cardId = card.dataset.cardId;
					const uniqueId = card.dataset.uniqueId;
					const target = friendlyUnits.find(u => 
						(u.card.id === cardId || u.card.uniqueId === uniqueId)
					);
					if (target) {
						card.style.cursor = 'pointer';
						card.classList.add('boost-target');
						card.addEventListener('click', clickHandler(target));
						card.addEventListener('mouseenter', () => {
							card.style.transform = 'scale(1.05)';
						});
						card.addEventListener('mouseleave', () => {
							card.style.transform = 'scale(1)';
						});
					}
				});
			}
			
			this.showTargetCancelButton();
		},
		
		removeTargetHighlights: function() {
			const rows = ['close', 'ranged', 'siege'];
			for (const row of rows) {
				const rowElement = document.getElementById(`player${gameModule.capitalizeFirst(row)}Row`);
				if (!rowElement) continue;
				const cards = rowElement.querySelectorAll('.board-card');
				cards.forEach(card => {
					card.style.cursor = '';
					card.classList.remove('boost-target');
					card.style.transform = '';
					const newCard = card.cloneNode(true);
					card.parentNode.replaceChild(newCard, card);
				});
			}
			this.removeTargetCancelButton();
		},
		
		showTargetCancelButton: function() {
			if (document.getElementById('abilityCancelBtn')) return;
			const cancelBtn = document.createElement('button');
			cancelBtn.id = 'abilityCancelBtn';
			cancelBtn.textContent = 'ОТМЕНА';
			cancelBtn.className = 'ability-cancel-btn';
			cancelBtn.addEventListener('click', () => {
				this.removeTargetHighlights();
				audioManager.playSound('button');
			});
			document.body.appendChild(cancelBtn);
		},
		
		removeTargetCancelButton: function() {
			const btn = document.getElementById('abilityCancelBtn');
			if (btn) btn.remove();
		},
		
		boostCard: function(card, amount) {
			if (card.baseStrength === undefined) card.baseStrength = card.strength;
			if (card.originalStrength === undefined) card.originalStrength = card.strength;
			card.strength = (card.strength || 0) + amount;
			card.currentStrength = card.strength;
			card.modifiedStrength = card.strength;
			card._displayStrength = card.strength;
		}
	},
	'realms_ability_5': {
		name: 'Мобилизация',
		description: 'Призовите бронзовый отряд на поле и усильте его и смежные с ним отряды на 3 еденицы',
		isExecuting: false,  
		pendingCard: null,   
		pendingCardIndex: null, 
		
		execute: async function(gameState, gameModule) {
			// Запрещаем повторную активацию, если уже выполняется
			if (this.isExecuting) {
				gameModule.showGameMessage('Способность уже активирована! Разместите выбранную карту.', 'warning');
				return false;
			}
			
			// Очищаем предыдущие выделения
			this.cleanupPreviousSelection();
			
			// 1. Показываем модальное окно с картами из колоды
			const bronzeUnits = [];
			gameState.player.deck.forEach((card, index) => {
				if (card.type === 'unit' && card.rarity === 'bronze') {
					bronzeUnits.push({ card: card, index: index });
				}
			});
			
			if (bronzeUnits.length === 0) {
				gameModule.showGameMessage('Нет бронзовых отрядов в колоде', 'warning');
				return false;
			}
			
			this.isExecuting = true;
			
			const selectedCard = await this.showDeckSelectionModal(bronzeUnits, gameModule);
			
			if (!selectedCard) {
				// Отмена выбора
				this.isExecuting = false;
				return false;
			}
			
			// 2. Проверяем, что карта всё ещё в колоде
			const stillInDeck = gameState.player.deck.some((card, idx) => 
				idx === selectedCard.index && card.id === selectedCard.card.id
			);
			
			if (!stillInDeck) {
				gameModule.showGameMessage('Эта карта больше не доступна', 'warning');
				this.isExecuting = false;
				return false;
			}
			
			// 3. Сохраняем выбранную карту и удаляем из колоды
			this.pendingCard = selectedCard.card;
			this.pendingCardIndex = selectedCard.index;
			gameState.player.deck.splice(selectedCard.index, 1);
			
			// 4. Показываем выбор ряда
			const availableRows = this.getAvailableRowsForCard(this.pendingCard, gameState);
			if (availableRows.length === 0) {
				gameModule.showGameMessage('Нет свободных рядов для размещения', 'warning');
				// Возвращаем карту в колоду
				gameState.player.deck.splice(this.pendingCardIndex, 0, this.pendingCard);
				this.pendingCard = null;
				this.pendingCardIndex = null;
				this.isExecuting = false;
				return false;
			}
			
			const selectedRow = await this.showRowSelectionForSummon(availableRows, gameState, gameModule);
			
			if (!selectedRow) {
				// Отмена размещения - возвращаем карту в колоду
				gameState.player.deck.splice(this.pendingCardIndex, 0, this.pendingCard);
				this.pendingCard = null;
				this.pendingCardIndex = null;
				this.isExecuting = false;
				return false;
			}
			
			// Размещаем карту
			await this.placeSummonedCard(this.pendingCard, selectedRow, gameState, gameModule);
			
			// Сбрасываем состояние
			this.pendingCard = null;
			this.pendingCardIndex = null;
			this.isExecuting = false;
			
			return true;
		},
		
		cleanupPreviousSelection: function() {
			// Удаляем все подсветки рядов
			const rows = ['close', 'ranged', 'siege'];
			for (const row of rows) {
				const rowElement = document.getElementById(`player${this.capitalizeFirst(row)}Row`);
				if (rowElement) {
					rowElement.classList.remove('row-available');
					rowElement.style.cursor = '';
					rowElement.style.transform = '';
					const newRow = rowElement.cloneNode(true);
					rowElement.parentNode?.replaceChild(newRow, rowElement);
				}
			}
			
			// Удаляем кнопку отмены
			const cancelBtn = document.querySelector('.ability-cancel-btn');
			if (cancelBtn) cancelBtn.remove();
			
			// Закрываем все модальные окна
			const modals = document.querySelectorAll('.deck-modal-overlay');
			modals.forEach(modal => modal.remove());
		},
		
		capitalizeFirst: function(string) {
			return string.charAt(0).toUpperCase() + string.slice(1);
		},
		
		showDeckSelectionModal: function(cards, gameModule) {
			return new Promise((resolve) => {
				// Закрываем предыдущие модальные окна
				const existingModals = document.querySelectorAll('.deck-modal-overlay');
				existingModals.forEach(modal => modal.remove());
				
				const modalOverlay = document.createElement('div');
				modalOverlay.className = 'deck-modal-overlay';
				modalOverlay.innerHTML = `
					<div class="deck-modal">
						<div class="deck-modal__header">
							<div class="deck-modal__title">ВЫБЕРИТЕ БРОНЗОВЫЙ ОТРЯД</div>
							<div class="deck-modal__count">${cards.length}</div>
						</div>
						<div class="deck-modal__content">
							${cards.map((item, idx) => `
								<div class="deck-card" data-card-index="${idx}" data-card-id="${item.card.id}">
									<div class="deck-card__container">
										<img src="card/${item.card.faction}/${item.card.imageStatic || (item.card.image ? item.card.image.replace('.mp4', '.jpg') : 'placeholder.jpg')}" 
											 class="deck-card__media" onerror="this.src='card/placeholder.jpg'">
										<img src="${item.card.border || 'deck/bord_silver.png'}" class="deck-card__border">
										<img src="${item.card.banner || 'faction/' + item.card.faction + '/banner_silver.png'}" class="deck-card__banner">
										<div class="deck-card__name">${item.card.name}</div>
										<div class="deck-card__strength">${item.card.strength || ''}</div>
										${item.card.position ? `
										<div class="deck-card__position">
											<img src="${item.card.positionBanner || 'faction/' + item.card.faction + '/banner_position.png'}" class="deck-card__position-banner">
											<img src="${this.getPositionIconPath(item.card.position)}" class="deck-card__position-icon">
										</div>
										` : ''}
									</div>
								</div>
							`).join('')}
						</div>
					</div>
				`;
				
				document.body.appendChild(modalOverlay);
				setTimeout(() => modalOverlay.classList.add('active'), 10);
				
				let isResolved = false;
				
				const resolveOnce = (value) => {
					if (!isResolved) {
						isResolved = true;
						resolve(value);
					}
				};
				
				// Добавляем обработчики для карт
				const cardElements = modalOverlay.querySelectorAll('.deck-card');
				cardElements.forEach(card => {
					const cardData = cards[parseInt(card.dataset.cardIndex)];
					
					card.addEventListener('click', (e) => {
						if (e.button === 0 && !isResolved) {
							const index = parseInt(card.dataset.cardIndex);
							this.closeModal(modalOverlay);
							audioManager.playSound('button');
							resolveOnce(cards[index]);
						}
					});
					
					card.addEventListener('contextmenu', (e) => {
						e.preventDefault();
						e.stopPropagation();
						if (cardData && window.showCardModal) {
							window.showCardModal(cardData.card);
						}
						audioManager.playSound('button');
					});
					
					card.addEventListener('mouseenter', () => {
						card.style.transform = 'scale(1.05)';
						audioManager.playSound('touch');
					});
					card.addEventListener('mouseleave', () => {
						card.style.transform = 'scale(1)';
					});
				});
				
				// Закрытие по клику вне окна или Escape
				const closeHandler = (e) => {
					if (e.type === 'keydown') {
						if (e.key === 'Escape') {
							this.closeModal(modalOverlay);
							document.removeEventListener('keydown', closeHandler);
							resolveOnce(null);
						}
					} else if (e.target === modalOverlay) {
						this.closeModal(modalOverlay);
						document.removeEventListener('keydown', closeHandler);
						resolveOnce(null);
					}
				};
				
				modalOverlay.addEventListener('click', closeHandler);
				document.addEventListener('keydown', closeHandler);
				modalOverlay._closeHandler = closeHandler;
			});
		},
		
		getPositionIconPath: function(position) {
			const positionIcons = {
				'close-row': 'deck/close-row.png',
				'ranged-row': 'deck/ranged-row.png',  
				'siege-row': 'deck/siege-row.png',
				'any-row': 'deck/any-row.png',
				'hidden-close-row': 'deck/hidden-close-row.png',
				'hidden-ranged-row': 'deck/hidden-ranged-row.png',
				'hidden-siege-row': 'deck/hidden-siege-row.png',
				'hidden-any-row': 'deck/hidden-any-row.png'
			};
			return positionIcons[position] || 'deck/any-row.png';
		},
		
		getAvailableRowsForCard: function(card, gameState) {
			const positions = Array.isArray(card.position) ? card.position : [card.position];
			const availableRows = [];
			const rows = ['close', 'ranged', 'siege'];
			
			rows.forEach(row => {
				const rowName = `${row}-row`;
				if (positions.includes(rowName) || positions.includes('any-row')) {
					if (gameState.player.rows[row].cards.length < 9) {
						availableRows.push(row);
					}
				}
			});
			
			return availableRows;
		},
		
		showRowSelectionForSummon: function(availableRows, gameState, gameModule) {
			return new Promise((resolve) => {
				// Удаляем предыдущие подсветки
				this.removeRowHighlightsForSummon();
				
				const rowsMap = {
					'close': `player${this.capitalizeFirst('close')}Row`,
					'ranged': `player${this.capitalizeFirst('ranged')}Row`,
					'siege': `player${this.capitalizeFirst('siege')}Row`
				};
				
				let isResolved = false;
				
				const resolveOnce = (value) => {
					if (!isResolved) {
						isResolved = true;
						this.removeRowHighlightsForSummon();
						resolve(value);
					}
				};
				
				const rowClickHandler = (row) => {
					return () => {
						resolveOnce(row);
					};
				};
				
				for (const row of availableRows) {
					const rowElement = document.getElementById(rowsMap[row]);
					if (rowElement) {
						rowElement.classList.add('row-available');
						rowElement.style.cursor = 'pointer';
						rowElement.addEventListener('click', rowClickHandler(row));
						
						rowElement.addEventListener('mouseenter', () => {
							rowElement.style.transform = 'scale(1.02)';
						});
						rowElement.addEventListener('mouseleave', () => {
							rowElement.style.transform = 'scale(1)';
						});
					}
				}
				
				// Кнопка отмены
				const cancelBtn = document.createElement('button');
				cancelBtn.textContent = 'ОТМЕНА';
				cancelBtn.className = 'ability-cancel-btn';
				cancelBtn.style.cssText = `
					position: fixed;
					bottom: 30px;
					left: 50%;
					transform: translateX(-50%);
					background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
					color: #d4af37;
					border: 2px solid #d4af37;
					padding: 12px 35px;
					border-radius: 8px;
					cursor: pointer;
					font-weight: bold;
					font-family: 'Gwent', sans-serif;
					font-size: 16px;
					text-transform: uppercase;
					letter-spacing: 2px;
					z-index: 10050;
					transition: all 0.3s ease;
					box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
				`;
				
				cancelBtn.addEventListener('click', () => {
					resolveOnce(null);
					audioManager.playSound('button');
				});
				
				cancelBtn.addEventListener('mouseenter', () => {
					cancelBtn.style.transform = 'translateX(-50%) scale(1.05)';
					cancelBtn.style.boxShadow = '0 0 20px rgba(212, 175, 55, 0.5)';
					audioManager.playSound('touch');
				});
				
				cancelBtn.addEventListener('mouseleave', () => {
					cancelBtn.style.transform = 'translateX(-50%) scale(1)';
					cancelBtn.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
				});
				
				document.body.appendChild(cancelBtn);
				this._currentCancelBtn = cancelBtn;
			});
		},
		
		removeRowHighlightsForSummon: function() {
			const rows = ['close', 'ranged', 'siege'];
			for (const row of rows) {
				const rowElement = document.getElementById(`player${this.capitalizeFirst(row)}Row`);
				if (rowElement) {
					rowElement.classList.remove('row-available');
					rowElement.style.cursor = '';
					rowElement.style.transform = '';
					const newRow = rowElement.cloneNode(true);
					rowElement.parentNode?.replaceChild(newRow, rowElement);
				}
			}
			if (this._currentCancelBtn && this._currentCancelBtn.parentNode) {
				this._currentCancelBtn.remove();
				this._currentCancelBtn = null;
			}
		},
		
		placeSummonedCard: function(card, row, gameState, gameModule) {
			const rowState = gameState.player.rows[row];
			
			if (rowState.cards.length >= 9) {
				gameModule.showGameMessage('В этом ряду максимальное количество карт!', 'warning');
				return false;
			}
			
			// Создаём копию карты для размещения
			const newCard = gameModule.createCardCopy(card);
			newCard.summonedByAbility = true;
			
			// Добавляем карту в ряд
			rowState.cards.push(newCard);
			
			// Отображаем карту на поле
			gameModule.displayCardOnRow(row, newCard, 'player');
			
			// Применяем эффекты
			this.boostCard(newCard, 3);
			
			// Усиливаем соседей
			const cardIndex = rowState.cards.length - 1;
			if (cardIndex > 0) {
				this.boostCard(rowState.cards[cardIndex - 1], 3);
			}
			if (cardIndex < rowState.cards.length - 1) {
				this.boostCard(rowState.cards[cardIndex + 1], 3);
			}
			
			// Обновляем отображение
			gameModule.updateRowStrength(row, 'player');
			gameModule.updateTotalScoreDisplays();
			gameModule.displayPlayerDeck();
			
			gameState.player.abilityUsedThisRound = true;
			
			gameModule.showGameMessage(`Способность "${this.name}" активирована! Призван ${newCard.name}.`, 'info');
			audioManager.playSound('card_boost');
			
			return true;
		},
		
		boostCard: function(card, amount) {
			if (card.baseStrength === undefined) card.baseStrength = card.strength;
			card.strength = (card.strength || 0) + amount;
			card.currentStrength = card.strength;
			card.modifiedStrength = card.strength;
		},
		
		closeModal: function(modal) {
			if (modal._closeHandler) {
				document.removeEventListener('keydown', modal._closeHandler);
			}
			modal.classList.remove('active');
			setTimeout(() => {
				if (modal.parentNode) {
					modal.parentNode.removeChild(modal);
				}
			}, 300);
		}
	},

    'nilfgaard_ability_1': {
        name: 'Имперское построение',
        description: 'Усильте 2 дружественных отряда на 1 еденицу и поменяйте их местами (только в пределах одного ряда)',
        execute: function(gameState, gameModule) {
            this.showDoubleTargetSelection(gameState, gameModule);
            return true;
        },
        
        showDoubleTargetSelection: function(gameState, gameModule) {
            let selectedCards = [];
            const rows = ['close', 'ranged', 'siege'];
            
            const clickHandler = (event) => {
                const cardElement = event.currentTarget;
                const cardId = cardElement.dataset.cardId;
                const uniqueId = cardElement.dataset.uniqueId;
                const row = cardElement.dataset.row;
                
                let targetCard = null;
                for (const r of rows) {
                    const card = gameState.player.rows[r].cards.find(c => 
                        (c.id === cardId || c.uniqueId === uniqueId)
                    );
                    if (card) {
                        targetCard = card;
                        break;
                    }
                }
                
                if (targetCard) {
                    if (targetCard.tags && (targetCard.tags.includes('hero') || targetCard.tags.includes('герой'))) {
                        gameModule.showGameMessage('Нельзя усилить Героя!', 'warning');
                        return;
                    }
                    
                    const alreadySelected = selectedCards.some(s => s.card.uniqueId === targetCard.uniqueId);
                    if (!alreadySelected && selectedCards.length < 2) {
                        selectedCards.push({ card: targetCard, row: row, element: cardElement });
                        cardElement.style.filter = 'brightness(1.2) drop-shadow(0 0 8px #4CAF50)';
                        audioManager.playSound('cardAdd');
                    } else if (alreadySelected) {
                        selectedCards = selectedCards.filter(s => s.card.uniqueId !== targetCard.uniqueId);
                        cardElement.style.filter = '';
                        audioManager.playSound('cardRemove');
                    }
                    
                    this.updateSelectionCounter(2, selectedCards.length);
                }
            };
            
            this.highlightPlayerUnits(gameState, rows, clickHandler);
            this.createSelectionCounter(2);
            this.showConfirmButton(() => {
                if (selectedCards.length !== 2) {
                    gameModule.showGameMessage('Выберите 2 отряда', 'warning');
                    return;
                }
                
                if (selectedCards[0].row !== selectedCards[1].row) {
                    gameModule.showGameMessage('Отряды должны быть в одном ряду для обмена!', 'warning');
                    this.removeHighlights();
                    this.removeSelectionCounter();
                    return;
                }
                
                // Усиливаем оба отряда
                this.boostCard(selectedCards[0].card, 1);
                this.boostCard(selectedCards[1].card, 1);
                
                // Меняем местами
                const rowCards = gameState.player.rows[selectedCards[0].row].cards;
                const index1 = rowCards.findIndex(c => c.uniqueId === selectedCards[0].card.uniqueId);
                const index2 = rowCards.findIndex(c => c.uniqueId === selectedCards[1].card.uniqueId);
                if (index1 !== -1 && index2 !== -1) {
                    [rowCards[index1], rowCards[index2]] = [rowCards[index2], rowCards[index1]];
                    gameModule.redrawRow(selectedCards[0].row, 'player');
                }
                
                gameState.player.abilityUsedThisRound = true;
                gameModule.updateTotalScoreDisplays();
                gameModule.showGameMessage(`Способность "${this.name}" активирована! Отряды усилены и обменяны местами.`, 'info');
                audioManager.playSound('card_boost');
                
                this.removeHighlights();
                this.removeSelectionCounter();
            });
        },
        
        highlightPlayerUnits: function(gameState, rows, clickHandler) {
            for (const row of rows) {
                const rowElement = document.getElementById(`player${gameModule.capitalizeFirst(row)}Row`);
                if (!rowElement) continue;
                const cards = rowElement.querySelectorAll('.board-card');
                cards.forEach(card => {
                    card.style.cursor = 'pointer';
                    card.style.transition = 'all 0.2s ease';
                    card.dataset.row = row;
                    card.addEventListener('click', clickHandler);
                    card.addEventListener('mouseenter', () => {
                        if (!card.style.filter || !card.style.filter.includes('#4CAF50')) {
                            card.style.transform = 'scale(1.05)';
                        }
                    });
                    card.addEventListener('mouseleave', () => {
                        card.style.transform = 'scale(1)';
                    });
                });
            }
            this.showCancelButton();
        },
        
        createSelectionCounter: function(max) {
            if (document.getElementById('abilityCounter')) return;
            const counter = document.createElement('div');
            counter.id = 'abilityCounter';
            counter.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0,0,0,0.8);
                color: #d4af37;
                padding: 10px 20px;
                border-radius: 5px;
                font-family: 'Gwent', sans-serif;
                font-size: 16px;
                z-index: 10002;
            `;
            counter.textContent = `Выбрано: 0/${max}`;
            document.body.appendChild(counter);
        },
        
        updateSelectionCounter: function(max, current) {
            const counter = document.getElementById('abilityCounter');
            if (counter) counter.textContent = `Выбрано: ${current}/${max}`;
        },
        
        removeSelectionCounter: function() {
            const counter = document.getElementById('abilityCounter');
            if (counter) counter.remove();
        },
        
        showConfirmButton: function(onConfirm) {
            if (document.getElementById('abilityConfirmBtn')) return;
            const confirmBtn = document.createElement('button');
            confirmBtn.id = 'abilityConfirmBtn';
            confirmBtn.textContent = 'ПОДТВЕРДИТЬ ОБМЕН';
            confirmBtn.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #4CAF50;
                color: white;
                border: none;
                padding: 10px 30px;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
                z-index: 10002;
                font-family: 'Gwent', sans-serif;
            `;
            confirmBtn.addEventListener('click', () => {
                onConfirm();
                audioManager.playSound('button');
            });
            document.body.appendChild(confirmBtn);
        },
        
        removeHighlights: function() {
            const rows = ['close', 'ranged', 'siege'];
            for (const row of rows) {
                const rowElement = document.getElementById(`player${gameModule.capitalizeFirst(row)}Row`);
                if (!rowElement) continue;
                const cards = rowElement.querySelectorAll('.board-card');
                cards.forEach(card => {
                    card.style.cursor = '';
                    card.style.filter = '';
                    card.style.transform = '';
                    const newCard = card.cloneNode(true);
                    card.parentNode.replaceChild(newCard, card);
                });
            }
            this.removeCancelButton();
            const confirmBtn = document.getElementById('abilityConfirmBtn');
            if (confirmBtn) confirmBtn.remove();
        },
        
        showCancelButton: function() {
            if (document.getElementById('abilityCancelBtn')) return;
            const cancelBtn = document.createElement('button');
            cancelBtn.id = 'abilityCancelBtn';
            cancelBtn.textContent = 'ОТМЕНА';
            cancelBtn.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 20px;
                background: #d4af37;
                color: #1a1a1a;
                border: none;
                padding: 10px 30px;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
                z-index: 10002;
                font-family: 'Gwent', sans-serif;
            `;
            cancelBtn.addEventListener('click', () => {
                this.removeHighlights();
                this.removeSelectionCounter();
                audioManager.playSound('button');
            });
            document.body.appendChild(cancelBtn);
        },
        
        removeCancelButton: function() {
            const btn = document.getElementById('abilityCancelBtn');
            if (btn) btn.remove();
        },
        
        boostCard: function(card, amount) {
            if (card.baseStrength === undefined) card.baseStrength = card.strength;
            if (card.originalStrength === undefined) card.originalStrength = card.strength;
            card.strength = (card.strength || 0) + amount;
            card.currentStrength = card.strength;
            card.modifiedStrength = card.strength;
            card._displayStrength = card.strength;
        }
    },
	'nilfgaard_ability_2': {
		name: 'Заточение',
		description: 'Нанесите вражескому отряду 3 еденицы урона',
		execute: function(gameState, gameModule) {
			// Собираем все вражеские отряды на поле
			const enemyUnits = [];
			const rows = ['close', 'ranged', 'siege'];
			
			rows.forEach(row => {
				gameState.opponent.rows[row].cards.forEach((card, index) => {
					if (card.type === 'unit') {
						enemyUnits.push({
							card: card,
							row: row,
							index: index
						});
					}
				});
			});
			
			if (enemyUnits.length === 0) {
				gameModule.showGameMessage('Нет вражеских отрядов для атаки', 'warning');
				return false;
			}
			
			// Показываем выбор цели
			this.showTargetSelection(enemyUnits, gameState, gameModule);
			return true;
		},
		
		showTargetSelection: function(enemyUnits, gameState, gameModule) {
			const modalOverlay = document.createElement('div');
			modalOverlay.className = 'ability-target-overlay';
			modalOverlay.style.cssText = `
				position: fixed;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				background: rgba(0,0,0,0.85);
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				z-index: 10001;
				font-family: 'Gwent', sans-serif;
			`;
			
			modalOverlay.innerHTML = `
				<div class="ability-target-modal">
					<div class="ability-target-title">ВЫБЕРИТЕ ЦЕЛЬ ДЛЯ УРОНА (3 ЕД.)</div>
					<div class="ability-target-cards">
						${enemyUnits.map((unit, idx) => `
							<div class="ability-target-card" data-target-index="${idx}">
								<div class="ability-target-card-name">${unit.card.name}</div>
								<div class="ability-target-card-strength">Сила: ${unit.card.strength} → ${Math.max(0, unit.card.strength - 3)}</div>
								<div class="ability-target-card-row">Ряд: ${this.getRowName(unit.row)}</div>
							</div>
						`).join('')}
					</div>
					<button class="ability-cancel-btn">ОТМЕНА</button>
				</div>
			`;
			
			document.body.appendChild(modalOverlay);
			
			const targetCards = modalOverlay.querySelectorAll('.ability-target-card');
			targetCards.forEach(card => {
				card.addEventListener('click', (e) => {
					const index = parseInt(card.dataset.targetIndex);
					const target = enemyUnits[index];
					
					this.dealDamage(target.card, 3);
					gameState.player.abilityUsedThisRound = true;
					
					gameModule.updateRowStrength(target.row, 'opponent');
					gameModule.updateTotalScoreDisplays();
					gameModule.updateCardStrengthDisplay(target.card, target.row, 'opponent');
					gameModule.showGameMessage(`Способность "${this.name}" активирована! Нанесён 3 урон ${target.card.name}.`, 'info');
					audioManager.playSound('card_damage');
					
					document.body.removeChild(modalOverlay);
				});
				
				card.addEventListener('mouseenter', () => {
					audioManager.playSound('touch');
					card.style.transform = 'scale(1.02)';
				});
				
				card.addEventListener('mouseleave', () => {
					card.style.transform = 'scale(1)';
				});
			});
			
			const cancelBtn = modalOverlay.querySelector('.ability-cancel-btn');
			cancelBtn.addEventListener('click', () => {
				document.body.removeChild(modalOverlay);
				audioManager.playSound('button');
			});
		},
		
		dealDamage: function(card, amount) {
			if (card.baseStrength === undefined) {
				card.baseStrength = card.strength;
			}
			if (card.originalStrength === undefined) {
				card.originalStrength = card.strength;
			}
			
			const newStrength = (card.strength || 0) - amount;
			card.strength = Math.max(0, newStrength);
			card.currentStrength = card.strength;
			card._displayStrength = card.strength;
		},
		
		getRowName: function(row) {
			const names = {
				'close': 'Ближний бой',
				'ranged': 'Дальний бой',
				'siege': 'Осадный'
			};
			return names[row] || row;
		}
	},
	'nilfgaard_ability_3': {
		name: 'Порабощение',
		description: 'Уничтожте вражеский отряд с силой 5 или меньше',
		execute: function(gameState, gameModule) {
			const destroyableUnits = [];
			const rows = ['close', 'ranged', 'siege'];
			
			rows.forEach(row => {
				gameState.opponent.rows[row].cards.forEach((card) => {
					if (card.type === 'unit' && (card.strength || 0) <= 5) {
						const isHero = card.tags && (card.tags.includes('hero') || card.tags.includes('герой'));
						if (!isHero) {
							destroyableUnits.push({ 
								card: card, 
								row: row,
								uniqueId: card.uniqueId 
							});
						}
					}
				});
			});
			
			if (destroyableUnits.length === 0) {
				gameModule.showGameMessage('Нет вражеских отрядов с силой 5 или меньше для уничтожения', 'warning');
				return false;
			}
			
			this.showTargetSelection(destroyableUnits, gameState, gameModule);
			return true;
		},
		
		showTargetSelection: function(destroyableUnits, gameState, gameModule) {
			// Сохраняем ссылки на обработчики для последующего удаления
			const handlers = new Map();
			
			// Подсвечиваем только подходящие карты
			for (const unit of destroyableUnits) {
				const rowElement = document.getElementById(`opponent${gameModule.capitalizeFirst(unit.row)}Row`);
				if (!rowElement) continue;
				
				// Ищем карту на доске по uniqueId
				let cardElement = rowElement.querySelector(`[data-unique-id="${unit.uniqueId}"]`);
				
				// Если не нашли по uniqueId, ищем по card-id
				if (!cardElement) {
					cardElement = rowElement.querySelector(`[data-card-id="${unit.card.id}"]`);
				}
				
				if (cardElement) {
					// Сохраняем оригинальные стили
					const originalCursor = cardElement.style.cursor;
					const originalFilter = cardElement.style.filter;
					
					// Подсвечиваем карту
					cardElement.style.cursor = 'pointer';
					cardElement.style.filter = 'brightness(1.2) drop-shadow(0 0 8px #ff4444)';
					cardElement.classList.add('destroyable-target');
					
					// Создаем обработчик с замыканием на конкретную карту
					const clickHandler = (event) => {
						event.stopPropagation();
						event.preventDefault();
						
						// Находим актуальную карту в gameState
						let targetCard = null;
						let targetRow = null;
						
						// Ищем по uniqueId
						for (const row of ['close', 'ranged', 'siege']) {
							const foundCard = gameState.opponent.rows[row].cards.find(c => 
								c.uniqueId === unit.uniqueId
							);
							if (foundCard) {
								targetCard = foundCard;
								targetRow = row;
								break;
							}
						}
						
						// Если не нашли по uniqueId, ищем по id
						if (!targetCard) {
							for (const row of ['close', 'ranged', 'siege']) {
								const foundCard = gameState.opponent.rows[row].cards.find(c => 
									c.id === unit.card.id
								);
								if (foundCard) {
									targetCard = foundCard;
									targetRow = row;
									break;
								}
							}
						}
						
						if (targetCard) {
							this.destroyCard(gameState, targetCard, targetRow, gameModule);
							gameState.player.abilityUsedThisRound = true;
							
							gameModule.updateTotalScoreDisplays();
							gameModule.showGameMessage(`Способность "${this.name}" активирована! ${targetCard.name} уничтожен.`, 'info');
							audioManager.playSound('card_destroy');
						}
						
						// Убираем подсветку и обработчики всех карт
						this.removeDestroyHighlights(destroyableUnits, gameModule);
					};
					
					cardElement.addEventListener('click', clickHandler);
					handlers.set(cardElement, clickHandler);
					
					// Эффект при наведении
					const mouseEnterHandler = () => {
						cardElement.style.transform = 'scale(1.05)';
					};
					const mouseLeaveHandler = () => {
						cardElement.style.transform = 'scale(1)';
					};
					
					cardElement.addEventListener('mouseenter', mouseEnterHandler);
					cardElement.addEventListener('mouseleave', mouseLeaveHandler);
					
					// Сохраняем обработчики наведения
					handlers.set(cardElement + '_enter', mouseEnterHandler);
					handlers.set(cardElement + '_leave', mouseLeaveHandler);
				}
			}
			
			// Сохраняем для удаления
			this.currentHandlers = handlers;
			this.currentDestroyableUnits = destroyableUnits;
			
			this.showDestroyCancelButton(gameState, gameModule);
		},
		
		removeDestroyHighlights: function(destroyableUnits, gameModule) {
			// Удаляем все обработчики и подсветку
			if (this.currentHandlers) {
				for (const unit of destroyableUnits) {
					const rowElement = document.getElementById(`opponent${gameModule.capitalizeFirst(unit.row)}Row`);
					if (rowElement) {
						let cardElement = rowElement.querySelector(`[data-unique-id="${unit.uniqueId}"]`);
						if (!cardElement) {
							cardElement = rowElement.querySelector(`[data-card-id="${unit.card.id}"]`);
						}
						if (cardElement) {
							// Удаляем обработчик клика
							const clickHandler = this.currentHandlers.get(cardElement);
							if (clickHandler) {
								cardElement.removeEventListener('click', clickHandler);
							}
							// Удаляем обработчики наведения
							const enterHandler = this.currentHandlers.get(cardElement + '_enter');
							const leaveHandler = this.currentHandlers.get(cardElement + '_leave');
							if (enterHandler) cardElement.removeEventListener('mouseenter', enterHandler);
							if (leaveHandler) cardElement.removeEventListener('mouseleave', leaveHandler);
							
							// Сбрасываем стили
							cardElement.style.cursor = '';
							cardElement.style.filter = '';
							cardElement.style.transform = '';
							cardElement.classList.remove('destroyable-target');
						}
					}
				}
				this.currentHandlers.clear();
			}
			this.removeDestroyCancelButton();
		},
		
		showDestroyCancelButton: function(gameState, gameModule) {
			if (document.getElementById('abilityCancelBtn')) return;
			
			const cancelBtn = document.createElement('button');
			cancelBtn.id = 'abilityCancelBtn';
			cancelBtn.textContent = 'ОТМЕНА';
			cancelBtn.className = 'ability-cancel-btn';
			cancelBtn.style.cssText = `
				position: fixed;
				bottom: 20px;
				left: 50%;
				transform: translateX(-50%);
				background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
				color: #d4af37;
				border: 2px solid #d4af37;
				padding: 10px 30px;
				border-radius: 5px;
				cursor: pointer;
				font-weight: bold;
				font-family: 'Gwent', sans-serif;
				text-transform: uppercase;
				letter-spacing: 2px;
				z-index: 10002;
				transition: all 0.3s ease;
			`;
			
			cancelBtn.addEventListener('mouseenter', () => {
				cancelBtn.style.transform = 'translateX(-50%) scale(1.05)';
				cancelBtn.style.boxShadow = '0 0 15px rgba(212, 175, 55, 0.5)';
				audioManager.playSound('touch');
			});
			
			cancelBtn.addEventListener('mouseleave', () => {
				cancelBtn.style.transform = 'translateX(-50%) scale(1)';
				cancelBtn.style.boxShadow = 'none';
			});
			
			cancelBtn.addEventListener('click', () => {
				this.removeDestroyHighlights(this.currentDestroyableUnits || [], gameModule);
				audioManager.playSound('button');
			});
			
			document.body.appendChild(cancelBtn);
			this.currentCancelBtn = cancelBtn;
		},
		
		removeDestroyCancelButton: function() {
			if (this.currentCancelBtn && this.currentCancelBtn.parentNode) {
				this.currentCancelBtn.remove();
				this.currentCancelBtn = null;
			}
			const btn = document.getElementById('abilityCancelBtn');
			if (btn) btn.remove();
		},
		
		destroyCard: function(gameState, card, row, gameModule) {
			const rowCards = gameState.opponent.rows[row].cards;
			// Ищем карту по uniqueId
			let cardIndex = rowCards.findIndex(c => c.uniqueId === card.uniqueId);
			
			if (cardIndex !== -1) {
				const destroyedCard = rowCards.splice(cardIndex, 1)[0];
				gameModule.addCardToDiscard(destroyedCard, 'opponent');
				gameModule.redrawRow(row, 'opponent');
				gameModule.updateRowStrength(row, 'opponent');
			}
		}
	},
	'nilfgaard_ability_4': {
		name: 'Туссентское гостеприимство',
		description: 'Усильте случайный дружественный отряд на 1 еденицу',
		execute: function(gameState, gameModule) {
			// Собираем все дружественные отряды на поле
			const friendlyUnits = [];
			const rows = ['close', 'ranged', 'siege'];
			
			rows.forEach(row => {
				gameState.player.rows[row].cards.forEach((card, index) => {
					if (card.type === 'unit') {
						friendlyUnits.push({
							card: card,
							row: row,
							index: index
						});
					}
				});
			});
			
			if (friendlyUnits.length === 0) {
				gameModule.showGameMessage('Нет дружественных отрядов на поле для усиления', 'warning');
				return false;
			}
			
			// Выбираем случайный отряд
			const randomIndex = Math.floor(Math.random() * friendlyUnits.length);
			const target = friendlyUnits[randomIndex];
			
			this.boostCard(target.card, 5);
			gameState.player.abilityUsedThisRound = true;
			
			gameModule.updateRowStrength(target.row, 'player');
			gameModule.updateTotalScoreDisplays();
			gameModule.updateCardStrengthDisplay(target.card, target.row, 'player');
			gameModule.showGameMessage(`Способность "${this.name}" активирована! Случайный отряд "${target.card.name}" усилен на 1 ед.`, 'info');
			audioManager.playSound('card_boost');
			
			return true;
		},
		
		boostCard: function(card, amount) {
			if (card.baseStrength === undefined) {
				card.baseStrength = card.strength;
			}
			if (card.originalStrength === undefined) {
				card.originalStrength = card.strength;
			}
			
			card.strength = (card.strength || 0) + amount;
			card.currentStrength = card.strength;
			card.modifiedStrength = card.strength;
			card._displayStrength = card.strength;
		}
	},
	'nilfgaard_ability_5': {
		name: 'Двойная игра',
		description: 'Вслепую сыграйте карту из руки противника',
		execute: async function(gameState, gameModule) {
			if (gameState.opponent.hand.length === 0) {
				gameModule.showGameMessage('У противника нет карт в руке', 'warning');
				return false;
			}
			
			// Получаем фракцию противника для фона модального окна
			const opponentFaction = gameState.opponent.faction;
			const factionBackground = `faction/${opponentFaction}/border_faction.png`;
			
			// 1. Показываем модальное окно с рубашками карт противника
			const selectedIndex = await this.showBlindSelectionModal(gameState.opponent.hand.length, factionBackground, gameModule);
			if (selectedIndex === null) return false;
			
			const selectedCard = gameState.opponent.hand[selectedIndex];
			
			// 2. Удаляем карту из руки противника
			gameState.opponent.hand.splice(selectedIndex, 1);
			
			// 3. Разыгрываем карту в зависимости от типа
			if (selectedCard.type === 'unit') {
				const success = await this.playUnitOnOpponentBoard(selectedCard, gameState, gameModule);
				if (!success) {
					// Если не удалось разместить, возвращаем карту в руку противника
					gameState.opponent.hand.push(selectedCard);
					return false;
				}
			} else if (selectedCard.type === 'special') {
				this.applySpecialCard(selectedCard, gameState, gameModule);
			} else if (selectedCard.type === 'artifact') {
				this.applyArtifactCard(selectedCard, gameState, gameModule);
			} else if (selectedCard.type === 'tactic') {
				this.applyTacticCard(selectedCard, gameState, gameModule);
			}
			
			gameState.player.abilityUsedThisRound = true;
			gameModule.updateTotalScoreDisplays();
			
			// Обновляем отображение руки противника
			if (window.aiModule && window.aiModule.updateOpponentHandDisplay) {
				window.aiModule.updateOpponentHandDisplay();
			}
			
			gameModule.showGameMessage(`Способность "${this.name}" активирована! Сыграна карта из руки противника.`, 'info');
			audioManager.playSound('cardPlay');
			
			return true;
		},
		
		// Модальное окно с рубашками карт (фон соответствует фракции противника)
		showBlindSelectionModal: function(cardCount, factionBackground, gameModule) {
			return new Promise((resolve) => {
				const modalOverlay = document.createElement('div');
				modalOverlay.className = 'deck-modal-overlay';
				
				modalOverlay.innerHTML = `
					<div class="deck-modal blind-selection-modal">
						<div class="deck-modal__header" style="background: url('${factionBackground}') center/cover;">
							<div class="deck-modal__title">ВЫБЕРИТЕ КАРТУ ИЗ РУКИ ПРОТИВНИКА</div>
							<div class="deck-modal__count">Карт: ${cardCount}</div>
						</div>
						<div class="deck-modal__content blind-cards-container">
							${Array(cardCount).fill().map((_, i) => `
								<div class="blind-card" data-card-index="${i}" style="
									width: 120px;
									cursor: pointer;
									transition: all 0.3s ease;
								">
									<div class="blind-card__container" style="position: relative;">
										<img src="deck/random.jpg" alt="?" class="blind-card__image" style="
											width: 100%;
											border-radius: 8px;
											box-shadow: 0 4px 8px rgba(0,0,0,0.3);
										">
									</div>
								</div>
							`).join('')}
						</div>
					</div>
				`;
				
				document.body.appendChild(modalOverlay);
				
				// Анимация появления
				setTimeout(() => {
					modalOverlay.classList.add('active');
				}, 10);
				
				// Обработчики для карт
				const cardElements = modalOverlay.querySelectorAll('.blind-card');
				cardElements.forEach(card => {
					card.addEventListener('click', (e) => {
						const index = parseInt(card.dataset.cardIndex);
						this.closeModal(modalOverlay);
						audioManager.playSound('button');
						resolve(index);
					});
					
					card.addEventListener('mouseenter', () => {
						card.style.transform = 'scale(1.05)';
						card.querySelector('.blind-card__image').style.boxShadow = '0 0 15px rgba(212, 175, 55, 0.5)';
						audioManager.playSound('touch');
					});
					
					card.addEventListener('mouseleave', () => {
						card.style.transform = 'scale(1)';
						card.querySelector('.blind-card__image').style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
					});
				});
				
				// Закрытие по клику вне модального окна
				modalOverlay.addEventListener('click', (e) => {
					if (e.target === modalOverlay) {
						this.closeModal(modalOverlay);
						audioManager.playSound('button');
						resolve(null);
					}
				});
				
				// Закрытие по Escape
				const escapeHandler = (e) => {
					if (e.key === 'Escape') {
						this.closeModal(modalOverlay);
						document.removeEventListener('keydown', escapeHandler);
						resolve(null);
					}
				};
				document.addEventListener('keydown', escapeHandler);
				modalOverlay.escapeHandler = escapeHandler;
			});
		},
		
		// Размещение отряда на поле противника
		playUnitOnOpponentBoard: async function(card, gameState, gameModule) {
			// Определяем доступные ряды для размещения (на стороне противника)
			const positions = Array.isArray(card.position) ? card.position : [card.position];
			const availableRows = [];
			const rows = ['close', 'ranged', 'siege'];
			
			rows.forEach(row => {
				const rowName = `${row}-row`;
				// Проверяем, может ли карта быть размещена в этом ряду
				if (positions.includes(rowName) || positions.includes('any-row')) {
					// Проверяем, есть ли место в ряду противника
					if (gameState.opponent.rows[row].cards.length < 9) {
						availableRows.push(row);
					}
				}
			});
			
			if (availableRows.length === 0) {
				gameModule.showGameMessage('Нет свободных рядов для размещения отряда на стороне противника', 'warning');
				return false;
			}
			
			// Показываем выбор ряда (подсветка рядов противника)
			const selectedRow = await this.showOpponentRowSelection(availableRows, gameModule);
			if (selectedRow === null) return false;
			
			// Создаем копию карты для размещения на поле противника
			const newCard = gameModule.createCardCopy(card);
			newCard.isStolen = true;
			newCard.originalOwner = 'opponent';
			newCard.stolenFromHand = true;
			
			// Размещаем карту в ряду противника
			gameState.opponent.rows[selectedRow].cards.push(newCard);
			gameModule.displayCardOnRow(selectedRow, newCard, 'opponent');
			
			// Обновляем силу ряда противника
			gameModule.updateRowStrength(selectedRow, 'opponent');
			
			// Проверяем, является ли карта шпионской (если позиция начинается с hidden-)
			const isSpy = positions.some(pos => pos.startsWith('hidden-'));
			if (isSpy) {
				// Шпионская карта - игрок добирает карту
				if (gameState.player.deck.length > 0 && gameState.player.hand.length < 10) {
					const drawnCard = gameState.player.deck.shift();
					gameState.player.hand.push(drawnCard);
					gameModule.displayPlayerHand();
					gameModule.displayPlayerDeck();
					gameModule.showGameMessage(`Шпионская карта! Вы получили карту: ${drawnCard.name}`, 'info');
					audioManager.playSound('cardDraw');
				} else if (gameState.player.hand.length >= 10) {
					gameModule.showGameMessage('Нет места в руке для добора карты!', 'warning');
				} else {
					gameModule.showGameMessage('В колоде нет карт для добора!', 'warning');
				}
			}
			
			// Воспроизводим звук размещения
			switch(selectedRow) {
				case 'close':
					audioManager.playSound('card_close');
					break;
				case 'ranged':
					audioManager.playSound('card_range');
					break;
				case 'siege':
					audioManager.playSound('card_siege');
					break;
				default:
					audioManager.playSound('card_close');
			}
			
			gameModule.showGameMessage(`Отряд "${newCard.name}" размещён на стороне противника в ряду ${this.getRowName(selectedRow)}`, 'info');
			
			return true;
		},
		
		// Подсветка рядов противника для размещения
		showOpponentRowSelection: function(availableRows, gameModule) {
			return new Promise((resolve) => {
				const rowsMap = {
					'close': 'opponentCloseRow',
					'ranged': 'opponentRangedRow',
					'siege': 'opponentSiegeRow'
				};
				
				const clickHandler = (row) => {
					return () => {
						this.removeOpponentRowHighlights();
						resolve(row);
					};
				};
				
				for (const row of availableRows) {
					const rowElement = document.getElementById(rowsMap[row]);
					if (rowElement) {
						rowElement.classList.add('row-available');
						rowElement.style.cursor = 'pointer';
						rowElement.addEventListener('click', clickHandler(row));
						
						rowElement.addEventListener('mouseenter', () => {
							rowElement.style.transform = 'scale(1.02)';
						});
						rowElement.addEventListener('mouseleave', () => {
							rowElement.style.transform = 'scale(1)';
						});
					}
				}
				
				// Кнопка отмены
				const cancelBtn = document.createElement('button');
				cancelBtn.textContent = 'ОТМЕНА';
				cancelBtn.className = 'ability-cancel-btn';
				cancelBtn.style.cssText = `
					position: fixed;
					bottom: 20px;
					left: 50%;
					transform: translateX(-50%);
					background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
					color: #d4af37;
					border: 2px solid #d4af37;
					padding: 10px 30px;
					border-radius: 5px;
					cursor: pointer;
					font-weight: bold;
					font-family: 'Gwent', sans-serif;
					text-transform: uppercase;
					letter-spacing: 2px;
					z-index: 10002;
					transition: all 0.3s ease;
				`;
				
				cancelBtn.addEventListener('mouseenter', () => {
					cancelBtn.style.transform = 'translateX(-50%) scale(1.05)';
					audioManager.playSound('touch');
				});
				cancelBtn.addEventListener('mouseleave', () => {
					cancelBtn.style.transform = 'translateX(-50%) scale(1)';
				});
				cancelBtn.addEventListener('click', () => {
					this.removeOpponentRowHighlights();
					cancelBtn.remove();
					audioManager.playSound('button');
					resolve(null);
				});
				
				document.body.appendChild(cancelBtn);
			});
		},
		
		removeOpponentRowHighlights: function() {
			const rows = ['close', 'ranged', 'siege'];
			for (const row of rows) {
				const rowElement = document.getElementById(`opponent${gameModule.capitalizeFirst(row)}Row`);
				if (rowElement) {
					rowElement.classList.remove('row-available');
					rowElement.style.cursor = '';
					rowElement.style.transform = '';
				}
			}
			const btn = document.querySelector('.ability-cancel-btn');
			if (btn) btn.remove();
		},
		
		// Применение специальной карты (погода и т.д.)
		applySpecialCard: function(card, gameState, gameModule) {
			if (gameModule.isWeatherCard(card)) {
				// Для погодных карт применяем эффект
				gameModule.handleRegularWeather(card);
				gameModule.showGameMessage(`Погодная карта "${card.name}" активирована!`, 'info');
			} else {
				// Для других специальных карт
				gameModule.showGameMessage(`Специальная карта "${card.name}" применена!`, 'info');
			}
			
			// Отправляем карту в сброс
			gameModule.addCardToDiscard(card, 'opponent');
		},
		
		// Применение карты артефакта
		applyArtifactCard: function(card, gameState, gameModule) {
			// Артефакты можно добавить в руку или применить эффект
			if (gameState.player.hand.length < 10) {
				gameState.player.hand.push(card);
				gameModule.displayPlayerHand();
				gameModule.showGameMessage(`Артефакт "${card.name}" добавлен в вашу руку!`, 'info');
				audioManager.playSound('cardAdd');
			} else {
				// Если нет места, отправляем в сброс
				gameModule.addCardToDiscard(card, 'opponent');
				gameModule.showGameMessage(`Нет места в руке! Артефакт "${card.name}" отправлен в сброс.`, 'warning');
			}
		},
		
		// Применение тактической карты
		applyTacticCard: function(card, gameState, gameModule) {
			gameModule.showGameMessage(`Тактика "${card.name}" применена!`, 'info');
			// Отправляем в сброс
			gameModule.addCardToDiscard(card, 'opponent');
		},
		
		// Закрытие модального окна
		closeModal: function(modal) {
			if (modal.escapeHandler) {
				document.removeEventListener('keydown', modal.escapeHandler);
			}
			modal.classList.remove('active');
			setTimeout(() => {
				if (modal.parentNode) {
					modal.parentNode.removeChild(modal);
				}
			}, 300);
		},
		
		getRowName: function(row) {
			const names = {
				'close': 'ближнего боя',
				'ranged': 'дальнего боя',
				'siege': 'осадном'
			};
			return names[row] || row;
		}
	},

'monsters_ability_1': {
    name: 'Белый Хлад',
    description: 'Создайте эффект мороза только в ближнем ряду противника',
    execute: function(gameState, gameModule) {
        const row = 'close';
        this.applyFrostToOpponentRow(gameState, row, gameModule);
        return true;
    },
    
    applyFrostToOpponentRow: function(gameState, row, gameModule) {
        // Убираем существующие эффекты погоды в этом ряду у противника
        this.removeWeatherFromOpponentRow(gameState, row, gameModule);
        
        // Применяем мороз ТОЛЬКО к ряду противника
        if (!gameState.weather) {
            gameState.weather = {
                cards: [],
                maxWeatherCards: 3,
                effects: {
                    'close': null,
                    'ranged': null,
                    'siege': null
                }
            };
        }
        
        gameState.weather.effects[row] = {
            card: { name: 'Трескучий мороз', type: 'special', faction: 'monsters' },
            image: 'board/frost.png',
            sound: 'frost',
            onlyOpponent: true
        };
        
        // Применяем визуальный эффект ТОЛЬКО на ряд противника
        this.applyVisualWeatherToOpponentRow(row, 'board/frost.png', gameModule);
        if (gameModule.playWeatherSound) {
            gameModule.playWeatherSound('frost');
        }
        
        // Уменьшаем силу отрядов противника в этом ряду до 1
        gameState.opponent.rows[row].cards.forEach(card => {
            if (card.tags && (card.tags.includes('hero') || card.tags.includes('герой'))) return;
            
            if (card.baseStrength === undefined) card.baseStrength = card.strength || 0;
            if (card.originalStrength === undefined) card.originalStrength = card.strength || 0;
            
            card.underWeather = true;
            card.currentStrength = 1;
            card.strength = 1;
            
            // Обновляем отображение карты
            if (gameModule.updateCardStrengthDisplay) {
                gameModule.updateCardStrengthDisplay(card, row, 'opponent');
            }
        });
        
        if (gameModule.updateRowStrength) {
            gameModule.updateRowStrength(row, 'opponent');
        }
        if (gameModule.updateTotalScoreDisplays) {
            gameModule.updateTotalScoreDisplays();
        }
        
        gameState.player.abilityUsedThisRound = true;
        if (gameModule.showGameMessage) {
            gameModule.showGameMessage(`Способность "${this.name}" активирована! Мороз в ближнем ряду противника.`, 'info');
        }
        if (audioManager && audioManager.playSound) {
            audioManager.playSound('weather');
        }
    },
    
    applyVisualWeatherToOpponentRow: function(row, image, gameModule) {
        const opponentRowElement = document.getElementById(`opponent${gameModule.capitalizeFirst(row)}Row`);
        if (opponentRowElement) {
            // Удаляем существующий эффект погоды в этом ряду
            const existingEffect = opponentRowElement.querySelector(`[data-weather-row="${row}"][data-weather-side="opponent"]`);
            if (existingEffect) {
                existingEffect.remove();
            }
            
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
    
    removeWeatherFromOpponentRow: function(gameState, row, gameModule) {
        // Удаляем визуальный эффект
        const opponentEffects = document.querySelectorAll(`[data-weather-row="${row}"][data-weather-side="opponent"]`);
        opponentEffects.forEach(effect => effect.remove());
        
        // Проверяем, существует ли weather в gameState
        if (gameState && gameState.weather && gameState.weather.effects && gameState.weather.effects[row]) {
            gameState.weather.effects[row] = null;
        }
        
        // Восстанавливаем силу карт
        if (gameState && gameState.opponent && gameState.opponent.rows && gameState.opponent.rows[row]) {
            gameState.opponent.rows[row].cards.forEach(card => {
                if (card.underWeather) {
                    card.underWeather = false;
                    if (card.originalStrength !== undefined) {
                        card.strength = card.originalStrength;
                        card.currentStrength = card.originalStrength;
                    }
                    if (gameModule && gameModule.updateCardStrengthDisplay) {
                        gameModule.updateCardStrengthDisplay(card, row, 'opponent');
                    }
                }
            });
            if (gameModule && gameModule.updateRowStrength) {
                gameModule.updateRowStrength(row, 'opponent');
            }
        }
    }
},
    'monsters_ability_2': {
        name: 'Неутолимый голод',
        description: 'Уничтожьте дружественный отряд, затем призовите Волколака из колоды в этом же ряду',
        execute: function(gameState, gameModule) {
            const friendlyUnits = [];
            const rows = ['close', 'ranged', 'siege'];
            
            rows.forEach(row => {
                gameState.player.rows[row].cards.forEach((card, index) => {
                    if (card.type === 'unit') {
                        friendlyUnits.push({ card: card, row: row, index: index });
                    }
                });
            });
            
            if (friendlyUnits.length === 0) {
                gameModule.showGameMessage('Нет дружественных отрядов для жертвоприношения', 'warning');
                return false;
            }
            
            this.showSacrificeSelection(friendlyUnits, gameState, gameModule);
            return true;
        },
        
        showSacrificeSelection: function(friendlyUnits, gameState, gameModule) {
            const rows = ['close', 'ranged', 'siege'];
            
            const clickHandler = (event) => {
                const cardElement = event.currentTarget;
                const cardId = cardElement.dataset.cardId;
                const uniqueId = cardElement.dataset.uniqueId;
                const row = cardElement.dataset.row;
                
                let targetCard = null;
                for (const r of rows) {
                    const card = gameState.player.rows[r].cards.find(c => 
                        (c.id === cardId || c.uniqueId === uniqueId)
                    );
                    if (card) {
                        targetCard = card;
                        break;
                    }
                }
                
                if (targetCard) {
                    const sacrificedStrength = targetCard.strength || 0;
                    const targetRow = row;
                    
                    // Уничтожаем отряд
                    this.destroyFriendlyUnit(gameState, targetCard, targetRow, gameModule);
                    
                    // Ищем Волколака в колоде
                    let werewolfIndex = -1;
                    let werewolfCard = null;
                    for (let i = 0; i < gameState.player.deck.length; i++) {
                        const card = gameState.player.deck[i];
                        if (card.name === 'Волколак' || (card.tags && card.tags.includes('werewolf'))) {
                            werewolfIndex = i;
                            werewolfCard = card;
                            break;
                        }
                    }
                    
                    if (werewolfCard) {
                        gameState.player.deck.splice(werewolfIndex, 1);
                        // Усиливаем Волколака
                        this.boostCard(werewolfCard, sacrificedStrength);
                        gameState.player.rows[targetRow].cards.push(werewolfCard);
                        gameModule.displayCardOnRow(targetRow, werewolfCard, 'player');
                        gameModule.updateRowStrength(targetRow, 'player');
                        gameModule.updateCardStrengthDisplay(werewolfCard, targetRow, 'player');
                        gameModule.showGameMessage(`Волколак призван из колоды с силой ${werewolfCard.strength}!`, 'info');
                    } else {
                        gameModule.showGameMessage('В колоде нет Волколака!', 'warning');
                    }
                    
                    gameState.player.abilityUsedThisRound = true;
                    gameModule.updateTotalScoreDisplays();
                    gameModule.showGameMessage(`Способность "${this.name}" активирована!`, 'info');
                    audioManager.playSound('summon');
                }
                
                this.removeHighlights();
            };
            
            this.highlightPlayerUnitsForSacrifice(gameState, rows, clickHandler);
        },
        
        highlightPlayerUnitsForSacrifice: function(gameState, rows, clickHandler) {
            for (const row of rows) {
                const rowElement = document.getElementById(`player${gameModule.capitalizeFirst(row)}Row`);
                if (!rowElement) continue;
                const cards = rowElement.querySelectorAll('.board-card');
                cards.forEach(card => {
                    card.style.cursor = 'pointer';
                    card.style.filter = 'brightness(1.2) drop-shadow(0 0 8px #ff4444)';
                    card.style.transition = 'all 0.2s ease';
                    card.dataset.row = row;
                    card.addEventListener('click', clickHandler);
                    card.addEventListener('mouseenter', () => {
                        card.style.transform = 'scale(1.05)';
                    });
                    card.addEventListener('mouseleave', () => {
                        card.style.transform = 'scale(1)';
                    });
                });
            }
            this.showCancelButton();
        },
        
        destroyFriendlyUnit: function(gameState, card, row, gameModule) {
            const rowCards = gameState.player.rows[row].cards;
            const cardIndex = rowCards.findIndex(c => c.uniqueId === card.uniqueId);
            if (cardIndex !== -1) {
                const destroyedCard = rowCards.splice(cardIndex, 1)[0];
                gameModule.addCardToDiscard(destroyedCard, 'player');
                gameModule.redrawRow(row, 'player');
                gameModule.updateRowStrength(row, 'player');
                audioManager.playSound('card_destroy');
            }
        },
        
        removeHighlights: function() {
            const rows = ['close', 'ranged', 'siege'];
            for (const row of rows) {
                const rowElement = document.getElementById(`player${gameModule.capitalizeFirst(row)}Row`);
                if (!rowElement) continue;
                const cards = rowElement.querySelectorAll('.board-card');
                cards.forEach(card => {
                    card.style.cursor = '';
                    card.style.filter = '';
                    card.style.transform = '';
                    const newCard = card.cloneNode(true);
                    card.parentNode.replaceChild(newCard, card);
                });
            }
            this.removeCancelButton();
        },
        
        showCancelButton: function() {
            if (document.getElementById('abilityCancelBtn')) return;
            const cancelBtn = document.createElement('button');
            cancelBtn.id = 'abilityCancelBtn';
            cancelBtn.textContent = 'ОТМЕНА';
            cancelBtn.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #d4af37;
                color: #1a1a1a;
                border: none;
                padding: 10px 30px;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
                z-index: 10002;
                font-family: 'Gwent', sans-serif;
            `;
            cancelBtn.addEventListener('click', () => {
                this.removeHighlights();
                audioManager.playSound('button');
            });
            document.body.appendChild(cancelBtn);
        },
        
        removeCancelButton: function() {
            const btn = document.getElementById('abilityCancelBtn');
            if (btn) btn.remove();
        },
        
        boostCard: function(card, amount) {
            if (card.baseStrength === undefined) card.baseStrength = card.strength;
            if (card.originalStrength === undefined) card.originalStrength = card.strength;
            card.strength = (card.strength || 0) + amount;
            card.currentStrength = card.strength;
            card.modifiedStrength = card.strength;
            card._displayStrength = card.strength;
        }
    },
	'monsters_ability_3': {
		name: 'Запах крови',
		description: 'Нанесите 2 ед. урона по вражескому ряду с наибольшим количеством карт',
		execute: function(gameState, gameModule) {
			// Находим ряд противника с наибольшим количеством карт
			let targetRow = null;
			let maxCards = -1;
			const rows = ['close', 'ranged', 'siege'];
			
			rows.forEach(row => {
				const cardCount = gameState.opponent.rows[row].cards.length;
				if (cardCount > maxCards) {
					maxCards = cardCount;
					targetRow = row;
				}
			});
			
			if (targetRow === null || maxCards === 0) {
				gameModule.showGameMessage('Нет отрядов противника для атаки', 'warning');
				return false;
			}
			
			// Наносим урон 2 всем отрядам в выбранном ряду
			let damagedCount = 0;
			const unitsToDestroy = [];
			
			gameState.opponent.rows[targetRow].cards.forEach(card => {
				if (card.type === 'unit') {
					// Пропускаем героев
					if (card.tags && (card.tags.includes('hero') || card.tags.includes('герой'))) return;
					
					this.dealDamage(card, 2);
					damagedCount++;
					gameModule.updateCardStrengthDisplay(card, targetRow, 'opponent');
					
					if (card.strength <= 0) {
						unitsToDestroy.push({ card: card, row: targetRow });
					}
				}
			});
			
			// Уничтожаем уничтоженные карты
			unitsToDestroy.forEach(unit => {
				this.destroyCard(gameState, unit.card, unit.row, gameModule);
			});
			
			gameState.player.abilityUsedThisRound = true;
			gameModule.updateRowStrength(targetRow, 'opponent');
			gameModule.updateTotalScoreDisplays();
			gameModule.showGameMessage(`Способность "${this.name}" активирована! Нанесён 2 урон ${damagedCount} отрядам в ряду ${this.getRowName(targetRow)}.`, 'info');
			audioManager.playSound('card_damage');
			
			return true;
		},
		
		dealDamage: function(card, amount) {
			if (card.baseStrength === undefined) card.baseStrength = card.strength;
			if (card.originalStrength === undefined) card.originalStrength = card.strength;
			
			const newStrength = (card.strength || 0) - amount;
			card.strength = Math.max(0, newStrength);
			card.currentStrength = card.strength;
			card._displayStrength = card.strength;
		},
		
		destroyCard: function(gameState, card, row, gameModule) {
			const rowCards = gameState.opponent.rows[row].cards;
			const cardIndex = rowCards.findIndex(c => c.uniqueId === card.uniqueId);
			if (cardIndex !== -1) {
				const destroyedCard = rowCards.splice(cardIndex, 1)[0];
				gameModule.addCardToDiscard(destroyedCard, 'opponent');
				gameModule.redrawRow(row, 'opponent');
				gameModule.updateRowStrength(row, 'opponent');
				audioManager.playSound('card_destroy');
			}
		},
		
		getRowName: function(row) {
			const names = {
				'close': 'Ближнего боя',
				'ranged': 'Дальнего боя',
				'siege': 'Осадном'
			};
			return names[row] || row;
		}
	},
	'monsters_ability_4': {
		name: 'Сила природы',
		description: 'Призовите Духа Леса',
		execute: function(gameState, gameModule) {
			// Проверяем, есть ли место на поле
			let targetRow = null;
			const rows = ['close', 'ranged', 'siege'];
			
			for (const row of rows) {
				if (gameState.player.rows[row].cards.length < 9) {
					targetRow = row;
					break;
				}
			}
			
			if (targetRow === null) {
				gameModule.showGameMessage('Нет свободных рядов для призыва Духа Леса', 'warning');
				return false;
			}
			
			// Ищем Духа Леса в ОБЩЕЙ КОЛЛЕКЦИИ (cardsData), а не в колоде игрока
			let spiritCard = null;
			
			// Ищем среди всех карт фракции monsters
			if (window.cardsModule && window.cardsModule.cardsData) {
				const monstersCards = window.cardsModule.cardsData.monsters;
				if (monstersCards && monstersCards.units) {
					spiritCard = monstersCards.units.find(card => 
						card.name === 'Леший' || 
						card.name === 'Дух Леса' ||
						(card.tags && card.tags.includes('forest_spirit')) ||
						(card.summonBy === 'monsters_ability_4')
					);
				}
			}
			
			// Если не нашли через cardsData, пробуем другие способы
			if (!spiritCard) {
				// Пробуем через getCardById
				if (window.cardsModule && window.cardsModule.getCardByIdIncludingHidden) {
					spiritCard = window.cardsModule.getCardByIdIncludingHidden('monsters_unit_???'); // нужно знать ID
				}
				
				// Если всё ещё не нашли, создаём карту динамически
				if (!spiritCard) {
					spiritCard = {
						id: 'monsters_forest_spirit',
						name: 'Дух Леса',
						namefull: 'Дух Леса - Хранитель Брокилона',
						strength: 9,
						image: 'forest_spirit.mp4',
						description: 'Хранитель леса',
						descriptionfull: 'Древний дух, охраняющий священные рощи. Призван силой природы.',
						ability: 'forest_spirit_ability',
						position: 'any-row',
						rarity: 'gold',
						faction: 'monsters',
						type: 'unit',
						tags: ['specter', 'nature'],
						border: 'deck/bord_gold.png',
						banner: 'faction/monsters/banner_gold.png',
						positionBanner: 'faction/monsters/banner_position.png',
						hidden: true,
						summonBy: 'monsters_ability_4'
					};
				}
			}
			
			if (!spiritCard) {
				gameModule.showGameMessage('Не удалось найти карту "Дух Леса"!', 'warning');
				return false;
			}
			
			// Создаём копию карты для размещения на поле
			const summonedCard = gameModule.createCardCopy(spiritCard);
			summonedCard.summonedByAbility = true;
			summonedCard.isSummoned = true;
			summonedCard.summonSource = 'monsters_ability_4';
			
			// Размещаем карту на поле
			gameState.player.rows[targetRow].cards.push(summonedCard);
			gameModule.displayCardOnRow(targetRow, summonedCard, 'player');
			gameModule.updateRowStrength(targetRow, 'player');
			gameModule.updateCardStrengthDisplay(summonedCard, targetRow, 'player');
			
			gameState.player.abilityUsedThisRound = true;
			gameModule.updateTotalScoreDisplays();
			
			const rowNames = {
				'close': 'ближнего боя',
				'ranged': 'дальнего боя',
				'siege': 'осадном'
			};
			
			gameModule.showGameMessage(`Способность "${this.name}" активирована! Дух Леса призван в ряд ${rowNames[targetRow]}.`, 'info');
			audioManager.playSound('summon');
			
			return true;
		}
	},
	'monsters_ability_5': {
		name: 'Панцирь',
		description: 'Усильте дружественный отряд на 3 ед. Кроме нейтрального отряда',
		execute: function(gameState, gameModule) {
			const friendlyUnits = [];
			const rows = ['close', 'ranged', 'siege'];
			
			rows.forEach(row => {
				gameState.player.rows[row].cards.forEach(card => {
					if (card.type === 'unit' && card.faction !== 'neutral') {
						if (card.tags && (card.tags.includes('hero') || card.tags.includes('герой'))) return;
						friendlyUnits.push({ card: card, row: row });
					}
				});
			});
			
			if (friendlyUnits.length === 0) {
				gameModule.showGameMessage('Нет дружественных отрядов не нейтральной фракции для усиления', 'warning');
				return false;
			}
			
			this.showTargetSelection(friendlyUnits, gameState, gameModule);
			return true;
		},
		
		showTargetSelection: function(friendlyUnits, gameState, gameModule) {
			const rows = ['close', 'ranged', 'siege'];
			
			const clickHandler = (target) => {
				return () => {
					if (target.card.faction === 'neutral') {
						gameModule.showGameMessage('Нельзя усилить нейтральный отряд!', 'warning');
						return;
					}
					
					this.boostCard(target.card, 3);
					gameState.player.abilityUsedThisRound = true;
					
					gameModule.updateRowStrength(target.row, 'player');
					gameModule.updateTotalScoreDisplays();
					gameModule.showGameMessage(`Способность "${this.name}" активирована! ${target.card.name} усилен на 3 ед.`, 'info');
					audioManager.playSound('card_boost');
					
					this.removeMonsterHighlights();
				};
			};
			
			for (const row of rows) {
				const rowElement = document.getElementById(`player${gameModule.capitalizeFirst(row)}Row`);
				if (!rowElement) continue;
				const cards = rowElement.querySelectorAll('.board-card');
				cards.forEach(card => {
					const cardId = card.dataset.cardId;
					const uniqueId = card.dataset.uniqueId;
					const target = friendlyUnits.find(u => 
						(u.card.id === cardId || u.card.uniqueId === uniqueId)
					);
					if (target) {
						card.style.cursor = 'pointer';
						card.classList.add('boost-target');
						card.addEventListener('click', clickHandler(target));
						card.addEventListener('mouseenter', () => {
							card.style.transform = 'scale(1.05)';
						});
						card.addEventListener('mouseleave', () => {
							card.style.transform = 'scale(1)';
						});
					}
				});
			}
			
			this.showMonsterCancelButton();
		},
		
		removeMonsterHighlights: function() {
			const rows = ['close', 'ranged', 'siege'];
			for (const row of rows) {
				const rowElement = document.getElementById(`player${gameModule.capitalizeFirst(row)}Row`);
				if (!rowElement) continue;
				const cards = rowElement.querySelectorAll('.board-card');
				cards.forEach(card => {
					card.style.cursor = '';
					card.classList.remove('boost-target');
					card.style.transform = '';
					const newCard = card.cloneNode(true);
					card.parentNode.replaceChild(newCard, card);
				});
			}
			this.removeMonsterCancelButton();
		},
		
		showMonsterCancelButton: function() {
			if (document.getElementById('abilityCancelBtn')) return;
			const cancelBtn = document.createElement('button');
			cancelBtn.id = 'abilityCancelBtn';
			cancelBtn.textContent = 'ОТМЕНА';
			cancelBtn.className = 'ability-cancel-btn';
			cancelBtn.addEventListener('click', () => {
				this.removeMonsterHighlights();
				audioManager.playSound('button');
			});
			document.body.appendChild(cancelBtn);
		},
		
		removeMonsterCancelButton: function() {
			const btn = document.getElementById('abilityCancelBtn');
			if (btn) btn.remove();
		},
		
		boostCard: function(card, amount) {
			if (card.baseStrength === undefined) card.baseStrength = card.strength;
			if (card.originalStrength === undefined) card.originalStrength = card.strength;
			card.strength = (card.strength || 0) + amount;
			card.currentStrength = card.strength;
			card.modifiedStrength = card.strength;
			card._displayStrength = card.strength;
		}
	},

	'skellige_ability_1': {
		name: 'Безрассудная ярость',
		description: 'Случайным образом распределите 4 ед. урона между всеми вражескими отрядами',
		execute: function(gameState, gameModule) {
			// Собираем все вражеские отряды на поле
			const enemyUnits = [];
			const rows = ['close', 'ranged', 'siege'];
			
			rows.forEach(row => {
				gameState.opponent.rows[row].cards.forEach((card, index) => {
					if (card.type === 'unit') {
						// Пропускаем героев
						if (card.tags && (card.tags.includes('hero') || card.tags.includes('герой'))) return;
						enemyUnits.push({ card: card, row: row, index: index });
					}
				});
			});
			
			if (enemyUnits.length === 0) {
				gameModule.showGameMessage('Нет вражеских отрядов для атаки', 'warning');
				return false;
			}
			
			// Распределяем 4 урона случайным образом
			let remainingDamage = 4;
			const unitsToDestroy = [];
			
			// Создаём массив для случайного выбора
			const aliveUnits = [...enemyUnits];
			
			while (remainingDamage > 0 && aliveUnits.length > 0) {
				const randomIndex = Math.floor(Math.random() * aliveUnits.length);
				const target = aliveUnits[randomIndex];
				
				this.dealDamage(target.card, 1);
				remainingDamage--;
				gameModule.updateCardStrengthDisplay(target.card, target.row, 'opponent');
				
				if (target.card.strength <= 0) {
					unitsToDestroy.push({ card: target.card, row: target.row });
					aliveUnits.splice(randomIndex, 1);
				}
			}
			
			// Уничтожаем уничтоженные карты
			unitsToDestroy.forEach(unit => {
				this.destroyCard(gameState, unit.card, unit.row, gameModule);
			});
			
			gameState.player.abilityUsedThisRound = true;
			
			// Обновляем все ряды
			rows.forEach(row => {
				gameModule.updateRowStrength(row, 'opponent');
			});
			gameModule.updateTotalScoreDisplays();
			
			gameModule.showGameMessage(`Способность "${this.name}" активирована! Нанесено 4 ед. урона.`, 'info');
			audioManager.playSound('card_damage');
			
			return true;
		},
		
		dealDamage: function(card, amount) {
			if (card.baseStrength === undefined) card.baseStrength = card.strength;
			if (card.originalStrength === undefined) card.originalStrength = card.strength;
			const newStrength = (card.strength || 0) - amount;
			card.strength = Math.max(0, newStrength);
			card.currentStrength = card.strength;
			card._displayStrength = card.strength;
		},
		
		destroyCard: function(gameState, card, row, gameModule) {
			const rowCards = gameState.opponent.rows[row].cards;
			const cardIndex = rowCards.findIndex(c => c.uniqueId === card.uniqueId);
			if (cardIndex !== -1) {
				const destroyedCard = rowCards.splice(cardIndex, 1)[0];
				gameModule.addCardToDiscard(destroyedCard, 'opponent');
				gameModule.redrawRow(row, 'opponent');
				gameModule.updateRowStrength(row, 'opponent');
				audioManager.playSound('card_destroy');
			}
		}
	},
	'skellige_ability_2': {
		name: 'Гнев моря',
		description: 'Создайте эффект дождя только в осадном ряду противника',
		execute: function(gameState, gameModule) {
			const row = 'siege';
			this.applyRainToOpponentRow(gameState, row, gameModule);
			return true;
		},
		
		applyRainToOpponentRow: function(gameState, row, gameModule) {
			// Убираем существующие эффекты погоды в этом ряду у противника
			if (gameState.weather.effects[row]) {
				this.removeWeatherFromOpponentRow(gameState, row, gameModule);
			}
			
			// Применяем дождь ТОЛЬКО к ряду противника
			gameState.weather.effects[row] = {
				card: { name: 'Проливной дождь', type: 'special', faction: 'skellige' },
				image: 'board/rain.png',
				sound: 'rain',
				onlyOpponent: true
			};
			
			// Применяем визуальный эффект ТОЛЬКО на ряд противника
			this.applyVisualWeatherToOpponentRow(row, 'board/rain.png', gameModule);
			gameModule.playWeatherSound('rain');
			
			// Уменьшаем силу отрядов противника в этом ряду до 1
			gameState.opponent.rows[row].cards.forEach(card => {
				if (card.tags && (card.tags.includes('hero') || card.tags.includes('герой'))) return;
				
				if (card.baseStrength === undefined) card.baseStrength = card.strength || 0;
				if (card.originalStrength === undefined) card.originalStrength = card.strength || 0;
				
				card.underWeather = true;
				card.currentStrength = 1;
				card.strength = 1;
			});
			
			gameModule.updateRowStrength(row, 'opponent');
			gameModule.updateTotalScoreDisplays();
			
			gameState.player.abilityUsedThisRound = true;
			gameModule.showGameMessage(`Способность "${this.name}" активирована! Дождь в осадном ряду противника.`, 'info');
			audioManager.playSound('weather');
		},
		
		applyVisualWeatherToOpponentRow: function(row, image, gameModule) {
			const opponentRowElement = document.getElementById(`opponent${gameModule.capitalizeFirst(row)}Row`);
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
		
		removeWeatherFromOpponentRow: function(gameState, row, gameModule) {
			const opponentEffects = document.querySelectorAll(`[data-weather-row="${row}"][data-weather-side="opponent"]`);
			opponentEffects.forEach(effect => effect.remove());
			
			if (gameState && gameState.opponent && gameState.opponent.rows[row]) {
				gameState.opponent.rows[row].cards.forEach(card => {
					if (card.underWeather) {
						card.underWeather = false;
						if (card.originalStrength !== undefined) {
							card.strength = card.originalStrength;
							card.currentStrength = card.originalStrength;
						}
					}
				});
				if (gameModule) gameModule.updateRowStrength(row, 'opponent');
			}
			
			if (gameState) gameState.weather.effects[row] = null;
		}
	},
	'skellige_ability_3': {
		name: 'Натиск',
		description: 'Нанесите 3 ед. урона вражескому отряду',
		execute: function(gameState, gameModule) {
			this.showTargetSelection(gameState, gameModule);
			return true;
		},
		
		showTargetSelection: function(gameState, gameModule) {
			const rows = ['close', 'ranged', 'siege'];
			
			const clickHandler = (event) => {
				const cardElement = event.currentTarget;
				const cardId = cardElement.dataset.cardId;
				const uniqueId = cardElement.dataset.uniqueId;
				const row = cardElement.dataset.row;
				
				let targetCard = null;
				let targetRow = null;
				for (const r of rows) {
					const card = gameState.opponent.rows[r].cards.find(c => 
						(c.id === cardId || c.uniqueId === uniqueId)
					);
					if (card) {
						targetCard = card;
						targetRow = r;
						break;
					}
				}
				
				if (targetCard) {
					if (targetCard.tags && (targetCard.tags.includes('hero') || targetCard.tags.includes('герой'))) {
						gameModule.showGameMessage('Нельзя нанести урон Герою!', 'warning');
						this.removeHighlights();
						return;
					}
					
					this.dealDamage(targetCard, 3);
					gameState.player.abilityUsedThisRound = true;
					
					gameModule.updateRowStrength(targetRow, 'opponent');
					gameModule.updateTotalScoreDisplays();
					gameModule.updateRowStrength(targetRow, 'opponent');
					
					if (targetCard.strength <= 0) {
						this.destroyCard(gameState, targetCard, targetRow, gameModule);
					}
					
					gameModule.showGameMessage(`Способность "${this.name}" активирована! Нанесён 3 урон ${targetCard.name}.`, 'info');
					audioManager.playSound('card_damage');
				}
				
				this.removeHighlights();
			};
			
			this.highlightEnemyUnits(gameState, rows, clickHandler);
		},
		
		highlightEnemyUnits: function(gameState, rows, clickHandler) {
			for (const row of rows) {
				const rowElement = document.getElementById(`opponent${gameModule.capitalizeFirst(row)}Row`);
				if (!rowElement) continue;
				const cards = rowElement.querySelectorAll('.board-card');
				cards.forEach(card => {
					card.style.cursor = 'pointer';
					card.style.filter = 'brightness(1.2) drop-shadow(0 0 8px #ff4444)';
					card.style.transition = 'all 0.2s ease';
					card.dataset.row = row;
					card.addEventListener('click', clickHandler);
					card.addEventListener('mouseenter', () => {
						card.style.transform = 'scale(1.05)';
					});
					card.addEventListener('mouseleave', () => {
						card.style.transform = 'scale(1)';
					});
				});
			}
			this.showCancelButton();
		},
		
		removeHighlights: function() {
			const rows = ['close', 'ranged', 'siege'];
			for (const row of rows) {
				const rowElement = document.getElementById(`opponent${gameModule.capitalizeFirst(row)}Row`);
				if (!rowElement) continue;
				const cards = rowElement.querySelectorAll('.board-card');
				cards.forEach(card => {
					card.style.cursor = '';
					card.style.filter = '';
					card.style.transform = '';
					const newCard = card.cloneNode(true);
					card.parentNode.replaceChild(newCard, card);
				});
			}
			this.removeCancelButton();
		},
		
		showCancelButton: function() {
			if (document.getElementById('abilityCancelBtn')) return;
			const cancelBtn = document.createElement('button');
			cancelBtn.id = 'abilityCancelBtn';
			cancelBtn.textContent = 'ОТМЕНА';
			cancelBtn.style.cssText = `
				position: fixed;
				bottom: 20px;
				left: 50%;
				transform: translateX(-50%);
				background: #d4af37;
				color: #1a1a1a;
				border: none;
				padding: 10px 30px;
				border-radius: 5px;
				cursor: pointer;
				font-weight: bold;
				z-index: 10002;
				font-family: 'Gwent', sans-serif;
			`;
			cancelBtn.addEventListener('click', () => {
				this.removeHighlights();
				audioManager.playSound('button');
			});
			document.body.appendChild(cancelBtn);
		},
		
		removeCancelButton: function() {
			const btn = document.getElementById('abilityCancelBtn');
			if (btn) btn.remove();
		},
		
		dealDamage: function(card, amount) {
			if (card.baseStrength === undefined) card.baseStrength = card.strength;
			if (card.originalStrength === undefined) card.originalStrength = card.strength;
			const newStrength = (card.strength || 0) - amount;
			card.strength = Math.max(0, newStrength);
			card.currentStrength = card.strength;
			card._displayStrength = card.strength;
		},
		
		destroyCard: function(gameState, card, row, gameModule) {
			const rowCards = gameState.opponent.rows[row].cards;
			const cardIndex = rowCards.findIndex(c => c.uniqueId === card.uniqueId);
			if (cardIndex !== -1) {
				const destroyedCard = rowCards.splice(cardIndex, 1)[0];
				gameModule.addCardToDiscard(destroyedCard, 'opponent');
				gameModule.redrawRow(row, 'opponent');
				gameModule.updateRowStrength(row, 'opponent');
				audioManager.playSound('card_destroy');
			}
		},
		
		getRowName: function(row) {
			const names = {
				'close': 'Ближний бой',
				'ranged': 'Дальний бой',
				'siege': 'Осадный'
			};
			return names[row] || row;
		}
	},
    'skellige_ability_4': {
        name: 'Медвежий ритуал',
        description: 'Нанесите 1 ед. урона дружественному отряду. И призовите Берсерка из колоды',
        execute: function(gameState, gameModule) {
            const friendlyUnits = [];
            const rows = ['close', 'ranged', 'siege'];
            
            rows.forEach(row => {
                gameState.player.rows[row].cards.forEach((card, index) => {
                    if (card.type === 'unit') {
                        friendlyUnits.push({ card: card, row: row, index: index });
                    }
                });
            });
            
            if (friendlyUnits.length === 0) {
                gameModule.showGameMessage('Нет дружественных отрядов для ритуала', 'warning');
                return false;
            }
            
            this.showRitualSelection(friendlyUnits, gameState, gameModule);
            return true;
        },
        
        showRitualSelection: function(friendlyUnits, gameState, gameModule) {
            const rows = ['close', 'ranged', 'siege'];
            
            const clickHandler = (event) => {
                const cardElement = event.currentTarget;
                const cardId = cardElement.dataset.cardId;
                const uniqueId = cardElement.dataset.uniqueId;
                const row = cardElement.dataset.row;
                
                let targetCard = null;
                for (const r of rows) {
                    const card = gameState.player.rows[r].cards.find(c => 
                        (c.id === cardId || c.uniqueId === uniqueId)
                    );
                    if (card) {
                        targetCard = card;
                        break;
                    }
                }
                
                if (targetCard) {
                    if (targetCard.tags && (targetCard.tags.includes('hero') || targetCard.tags.includes('герой'))) {
                        gameModule.showGameMessage('Нельзя нанести урон Герою!', 'warning');
                        this.removeHighlights();
                        return;
                    }
                    
                    // Наносим 1 урон
                    this.dealDamage(targetCard, 1);
                    gameModule.updateCardStrengthDisplay(targetCard, row, 'player');
                    gameModule.updateRowStrength(row, 'player');
                    
                    if (targetCard.strength <= 0) {
                        this.destroyCard(gameState, targetCard, row, gameModule);
                    }
                    
                    // Ищем Берсерка в колоде
                    let berserkerIndex = -1;
                    let berserkerCard = null;
                    for (let i = 0; i < gameState.player.deck.length; i++) {
                        const card = gameState.player.deck[i];
                        if (card.name === 'Берсерк' || (card.tags && card.tags.includes('berserker'))) {
                            berserkerIndex = i;
                            berserkerCard = card;
                            break;
                        }
                    }
                    
                    if (berserkerCard) {
                        gameState.player.deck.splice(berserkerIndex, 1);
                        
                        // Находим свободный ряд
                        let targetRow = null;
                        for (const r of rows) {
                            if (gameState.player.rows[r].cards.length < 9) {
                                targetRow = r;
                                break;
                            }
                        }
                        
                        if (targetRow) {
                            gameState.player.rows[targetRow].cards.push(berserkerCard);
                            gameModule.displayCardOnRow(targetRow, berserkerCard, 'player');
                            gameModule.updateRowStrength(targetRow, 'player');
                            gameModule.updateCardStrengthDisplay(berserkerCard, targetRow, 'player');
                            gameModule.showGameMessage(`Берсерк призван из колоды в ряд ${this.getRowName(targetRow)}!`, 'info');
                        } else {
                            gameState.player.hand.push(berserkerCard);
                            gameModule.displayPlayerHand();
                            gameModule.showGameMessage(`Нет места на поле! Берсерк добавлен в руку.`, 'info');
                        }
                        audioManager.playSound('summon');
                    } else {
                        gameModule.showGameMessage('В колоде нет Берсерка!', 'warning');
                    }
                    
                    gameState.player.abilityUsedThisRound = true;
                    gameModule.updateTotalScoreDisplays();
                    gameModule.showGameMessage(`Способность "${this.name}" активирована!`, 'info');
                    audioManager.playSound('card_damage');
                }
                
                this.removeHighlights();
            };
            
            this.highlightPlayerUnitsForRitual(gameState, rows, clickHandler);
        },
        
        highlightPlayerUnitsForRitual: function(gameState, rows, clickHandler) {
            for (const row of rows) {
                const rowElement = document.getElementById(`player${gameModule.capitalizeFirst(row)}Row`);
                if (!rowElement) continue;
                const cards = rowElement.querySelectorAll('.board-card');
                cards.forEach(card => {
                    card.style.cursor = 'pointer';
                    card.style.filter = 'brightness(1.2) drop-shadow(0 0 8px #ff9800)';
                    card.style.transition = 'all 0.2s ease';
                    card.dataset.row = row;
                    card.addEventListener('click', clickHandler);
                    card.addEventListener('mouseenter', () => {
                        card.style.transform = 'scale(1.05)';
                    });
                    card.addEventListener('mouseleave', () => {
                        card.style.transform = 'scale(1)';
                    });
                });
            }
            this.showCancelButton();
        },
        
        dealDamage: function(card, amount) {
            if (card.baseStrength === undefined) card.baseStrength = card.strength;
            if (card.originalStrength === undefined) card.originalStrength = card.strength;
            const newStrength = (card.strength || 0) - amount;
            card.strength = Math.max(0, newStrength);
            card.currentStrength = card.strength;
            card._displayStrength = card.strength;
        },
        
        destroyCard: function(gameState, card, row, gameModule) {
            const rowCards = gameState.player.rows[row].cards;
            const cardIndex = rowCards.findIndex(c => c.uniqueId === card.uniqueId);
            if (cardIndex !== -1) {
                const destroyedCard = rowCards.splice(cardIndex, 1)[0];
                gameModule.addCardToDiscard(destroyedCard, 'player');
                gameModule.redrawRow(row, 'player');
                gameModule.updateRowStrength(row, 'player');
                audioManager.playSound('card_destroy');
            }
        },
        
        removeHighlights: function() {
            const rows = ['close', 'ranged', 'siege'];
            for (const row of rows) {
                const rowElement = document.getElementById(`player${gameModule.capitalizeFirst(row)}Row`);
                if (!rowElement) continue;
                const cards = rowElement.querySelectorAll('.board-card');
                cards.forEach(card => {
                    card.style.cursor = '';
                    card.style.filter = '';
                    card.style.transform = '';
                    const newCard = card.cloneNode(true);
                    card.parentNode.replaceChild(newCard, card);
                });
            }
            this.removeCancelButton();
        },
        
        showCancelButton: function() {
            if (document.getElementById('abilityCancelBtn')) return;
            const cancelBtn = document.createElement('button');
            cancelBtn.id = 'abilityCancelBtn';
            cancelBtn.textContent = 'ОТМЕНА';
            cancelBtn.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #d4af37;
                color: #1a1a1a;
                border: none;
                padding: 10px 30px;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
                z-index: 10002;
                font-family: 'Gwent', sans-serif;
            `;
            cancelBtn.addEventListener('click', () => {
                this.removeHighlights();
                audioManager.playSound('button');
            });
            document.body.appendChild(cancelBtn);
        },
        
        removeCancelButton: function() {
            const btn = document.getElementById('abilityCancelBtn');
            if (btn) btn.remove();
        },
        
        getRowName: function(row) {
            const names = { 'close': 'ближнего боя', 'ranged': 'дальнего боя', 'siege': 'осадном' };
            return names[row] || row;
        }
    },
	'skellige_ability_5': {
		name: 'Пламя славы',
		description: 'Переместите не нейтральный отряд из вашей колоды в ваш сброс, затем нанесите вражескому отряду урон, равный значению силы перемещенного отряда',
		execute: async function(gameState, gameModule) {
			// 1. Выбор карты из колоды через модальное окно
			const factionUnits = [];
			gameState.player.deck.forEach((card, index) => {
				if (card.type === 'unit' && card.faction !== 'neutral') {
					factionUnits.push({ card: card, index: index });
				}
			});
			
			if (factionUnits.length === 0) {
				gameModule.showGameMessage('Нет не нейтральных отрядов в колоде', 'warning');
				return false;
			}
			
			const selectedUnit = await this.showDeckSelectionModal(factionUnits, gameModule);
			if (!selectedUnit) return false;
			
			const sacrificedStrength = selectedUnit.card.strength || 0;
			
			// 2. Перемещаем в сброс
			gameState.player.deck.splice(selectedUnit.index, 1);
			gameModule.addCardToDiscard(selectedUnit.card, 'player');
			gameModule.displayPlayerDeck();
			gameModule.displayPlayerDiscard();
			gameModule.showGameMessage(`Отряд "${selectedUnit.card.name}" отправлен в сброс (сила ${sacrificedStrength})`, 'info');
			audioManager.playSound('cardRemove');
			
			// 3. Выбор цели для урона
			const enemyUnits = [];
			const rows = ['close', 'ranged', 'siege'];
			
			rows.forEach(row => {
				gameState.opponent.rows[row].cards.forEach(card => {
					if (card.type === 'unit') {
						if (card.tags && (card.tags.includes('hero') || card.tags.includes('герой'))) return;
						enemyUnits.push({ card: card, row: row });
					}
				});
			});
			
			if (enemyUnits.length === 0) {
				gameModule.showGameMessage('Нет вражеских отрядов для атаки', 'warning');
				gameState.player.abilityUsedThisRound = true;
				return false;
			}
			
			const target = await this.showDamageTargetSelection(enemyUnits, sacrificedStrength, gameModule);
			if (!target) return false;
			
			this.dealDamage(target.card, sacrificedStrength);
			
			if (target.card.strength <= 0) {
				this.destroyCard(gameState, target.card, target.row, gameModule);
			}
			
			gameState.player.abilityUsedThisRound = true;
			
			gameModule.updateRowStrength(target.row, 'opponent');
			gameModule.updateTotalScoreDisplays();
			gameModule.showGameMessage(`Способность "${this.name}" активирована! Нанесён ${sacrificedStrength} урон ${target.card.name}.`, 'info');
			audioManager.playSound('card_damage');
			
			return true;
		},
		
		showDeckSelectionModal: function(cards, gameModule) {
			return new Promise((resolve) => {
				const modalOverlay = document.createElement('div');
				modalOverlay.className = 'deck-modal-overlay';
				modalOverlay.innerHTML = `
					<div class="deck-modal">
						<div class="deck-modal__header">
							<div class="deck-modal__title">ВЫБЕРИТЕ ОТРЯД ДЛЯ ЖЕРТВОПРИНОШЕНИЯ</div>
							<div class="deck-modal__count">${cards.length}</div>
						</div>
						<div class="deck-modal__content">
							${cards.map((item, idx) => `
								<div class="deck-card" data-card-index="${idx}">
									<div class="deck-card__container">
										<img src="card/${item.card.faction}/${item.card.imageStatic || item.card.image.replace('.mp4', '.jpg')}" 
											 class="deck-card__media" onerror="this.src='card/placeholder.jpg'">
										<img src="${item.card.border}" class="deck-card__border">
										<img src="${item.card.banner}" class="deck-card__banner">
										<div class="deck-card__name">${item.card.name}</div>
										<div class="deck-card__strength">${item.card.strength}</div>
									</div>
								</div>
							`).join('')}
						</div>
					</div>
				`;
				
				document.body.appendChild(modalOverlay);
				setTimeout(() => modalOverlay.classList.add('active'), 10);
				
				const cardElements = modalOverlay.querySelectorAll('.deck-card');
				cardElements.forEach(card => {
					card.addEventListener('click', () => {
						const index = parseInt(card.dataset.cardIndex);
						this.closeModal(modalOverlay);
						audioManager.playSound('button');
						resolve(cards[index]);
					});
					card.addEventListener('mouseenter', () => {
						card.style.transform = 'scale(1.05)';
						audioManager.playSound('touch');
					});
					card.addEventListener('mouseleave', () => {
						card.style.transform = 'scale(1)';
					});
				});
				
				modalOverlay.addEventListener('click', (e) => {
					if (e.target === modalOverlay) {
						this.closeModal(modalOverlay);
						resolve(null);
					}
				});
			});
		},
		
		showDamageTargetSelection: function(enemyUnits, damageAmount, gameModule) {
			return new Promise((resolve) => {
				const rows = ['close', 'ranged', 'siege'];
				
				const clickHandler = (target) => {
					return () => {
						this.removeDamageTargetHighlights();
						resolve(target);
					};
				};
				
				for (const row of rows) {
					const rowElement = document.getElementById(`opponent${gameModule.capitalizeFirst(row)}Row`);
					if (!rowElement) continue;
					const cards = rowElement.querySelectorAll('.board-card');
					cards.forEach(card => {
						const cardId = card.dataset.cardId;
						const uniqueId = card.dataset.uniqueId;
						const target = enemyUnits.find(u => 
							(u.card.id === cardId || u.card.uniqueId === uniqueId)
						);
						if (target) {
							card.style.cursor = 'pointer';
							card.classList.add('damage-target');
							card.addEventListener('click', clickHandler(target));
							card.addEventListener('mouseenter', () => {
								card.style.transform = 'scale(1.05)';
								card.style.filter = 'brightness(1.2) drop-shadow(0 0 8px #ff4444)';
							});
							card.addEventListener('mouseleave', () => {
								card.style.transform = 'scale(1)';
								card.style.filter = '';
							});
						}
					});
				}
				
				const cancelBtn = document.createElement('button');
				cancelBtn.textContent = 'ОТМЕНА';
				cancelBtn.className = 'ability-cancel-btn';
				cancelBtn.addEventListener('click', () => {
					this.removeDamageTargetHighlights();
					cancelBtn.remove();
					resolve(null);
					audioManager.playSound('button');
				});
				document.body.appendChild(cancelBtn);
			});
		},
		
		removeDamageTargetHighlights: function() {
			const rows = ['close', 'ranged', 'siege'];
			for (const row of rows) {
				const rowElement = document.getElementById(`opponent${gameModule.capitalizeFirst(row)}Row`);
				if (!rowElement) continue;
				const cards = rowElement.querySelectorAll('.board-card');
				cards.forEach(card => {
					card.style.cursor = '';
					card.classList.remove('damage-target');
					card.style.transform = '';
					card.style.filter = '';
					const newCard = card.cloneNode(true);
					card.parentNode.replaceChild(newCard, card);
				});
			}
			const btn = document.querySelector('.ability-cancel-btn');
			if (btn) btn.remove();
		},
		
		closeModal: function(modal) {
			modal.classList.remove('active');
			setTimeout(() => modal.remove(), 300);
		},
		
		dealDamage: function(card, amount) {
			if (card.baseStrength === undefined) card.baseStrength = card.strength;
			if (card.originalStrength === undefined) card.originalStrength = card.strength;
			const newStrength = (card.strength || 0) - amount;
			card.strength = Math.max(0, newStrength);
			card.currentStrength = card.strength;
			card._displayStrength = card.strength;
		},
		
		destroyCard: function(gameState, card, row, gameModule) {
			const rowCards = gameState.opponent.rows[row].cards;
			const cardIndex = rowCards.findIndex(c => c.uniqueId === card.uniqueId);
			if (cardIndex !== -1) {
				const destroyedCard = rowCards.splice(cardIndex, 1)[0];
				gameModule.addCardToDiscard(destroyedCard, 'opponent');
				gameModule.redrawRow(row, 'opponent');
				gameModule.updateRowStrength(row, 'opponent');
				audioManager.playSound('card_destroy');
			}
		}
	},

	'syndicate_ability_1': {
		name: 'Заказ на убийство',
		description: 'Нанесите 6 ед. урона вражескому отряду',
		execute: function(gameState, gameModule) {
			this.showTargetSelection(gameState, gameModule);
			return true;
		},
		
		showTargetSelection: function(gameState, gameModule) {
			const enemyUnits = [];
			const rows = ['close', 'ranged', 'siege'];
			
			rows.forEach(row => {
				gameState.opponent.rows[row].cards.forEach(card => {
					if (card.type === 'unit') {
						if (card.tags && (card.tags.includes('hero') || card.tags.includes('герой'))) return;
						enemyUnits.push({ card: card, row: row });
					}
				});
			});
			
			if (enemyUnits.length === 0) {
				gameModule.showGameMessage('Нет вражеских отрядов для атаки', 'warning');
				return;
			}
			
			this.highlightEnemyUnits(enemyUnits, gameState, gameModule);
		},
		
		highlightEnemyUnits: function(enemyUnits, gameState, gameModule) {
			const rows = ['close', 'ranged', 'siege'];
			
			const clickHandler = (target) => {
				return () => {
					this.dealDamage(target.card, 6);
					gameState.player.abilityUsedThisRound = true;
					
					gameModule.updateRowStrength(target.row, 'opponent');
					gameModule.updateTotalScoreDisplays();
					
					if (target.card.strength <= 0) {
						this.destroyCard(gameState, target.card, target.row, gameModule);
					}
					
					gameModule.showGameMessage(`Способность "${this.name}" активирована! Нанесён 6 урон ${target.card.name}.`, 'info');
					audioManager.playSound('card_damage');
					
					this.removeHighlights();
				};
			};
			
			for (const row of rows) {
				const rowElement = document.getElementById(`opponent${gameModule.capitalizeFirst(row)}Row`);
				if (!rowElement) continue;
				const cards = rowElement.querySelectorAll('.board-card');
				cards.forEach(card => {
					const cardId = card.dataset.cardId;
					const uniqueId = card.dataset.uniqueId;
					const target = enemyUnits.find(u => 
						(u.card.id === cardId || u.card.uniqueId === uniqueId)
					);
					if (target) {
						card.style.cursor = 'pointer';
						card.classList.add('damage-target');
						card.addEventListener('click', clickHandler(target));
						card.addEventListener('mouseenter', () => {
							card.style.transform = 'scale(1.05)';
						});
						card.addEventListener('mouseleave', () => {
							card.style.transform = 'scale(1)';
						});
					}
				});
			}
			
			this.showCancelButton();
		},
		
		removeHighlights: function() {
			const rows = ['close', 'ranged', 'siege'];
			for (const row of rows) {
				const rowElement = document.getElementById(`opponent${gameModule.capitalizeFirst(row)}Row`);
				if (!rowElement) continue;
				const cards = rowElement.querySelectorAll('.board-card');
				cards.forEach(card => {
					card.style.cursor = '';
					card.classList.remove('damage-target');
					card.style.transform = '';
					const newCard = card.cloneNode(true);
					card.parentNode.replaceChild(newCard, card);
				});
			}
			this.removeCancelButton();
		},
		
		showCancelButton: function() {
			if (document.getElementById('abilityCancelBtn')) return;
			const cancelBtn = document.createElement('button');
			cancelBtn.id = 'abilityCancelBtn';
			cancelBtn.textContent = 'ОТМЕНА';
			cancelBtn.className = 'ability-cancel-btn';
			cancelBtn.addEventListener('click', () => {
				this.removeHighlights();
				audioManager.playSound('button');
			});
			document.body.appendChild(cancelBtn);
		},
		
		removeCancelButton: function() {
			const btn = document.getElementById('abilityCancelBtn');
			if (btn) btn.remove();
		},
		
		dealDamage: function(card, amount) {
			if (card.baseStrength === undefined) card.baseStrength = card.strength;
			if (card.originalStrength === undefined) card.originalStrength = card.strength;
			const newStrength = (card.strength || 0) - amount;
			card.strength = Math.max(0, newStrength);
			card.currentStrength = card.strength;
			card._displayStrength = card.strength;
		},
		
		destroyCard: function(gameState, card, row, gameModule) {
			const rowCards = gameState.opponent.rows[row].cards;
			const cardIndex = rowCards.findIndex(c => c.uniqueId === card.uniqueId);
			if (cardIndex !== -1) {
				const destroyedCard = rowCards.splice(cardIndex, 1)[0];
				gameModule.addCardToDiscard(destroyedCard, 'opponent');
				gameModule.redrawRow(row, 'opponent');
				gameModule.updateRowStrength(row, 'opponent');
				audioManager.playSound('card_destroy');
			}
		}
	},
	'syndicate_ability_2': {
		name: 'Резня',
		description: 'Нанесите от 1 до 3 ед. урона всем картам в ряду противника',
		execute: function(gameState, gameModule) {
			this.showRowSelection(gameState, gameModule);
			return true;
		},
		
		showRowSelection: function(gameState, gameModule) {
			const rowsWithCards = [];
			const rows = [
				{ id: 'close', name: 'Ближний бой', elementId: 'opponentCloseRow' },
				{ id: 'ranged', name: 'Дальний бой', elementId: 'opponentRangedRow' },
				{ id: 'siege', name: 'Осадный', elementId: 'opponentSiegeRow' }
			];
			
			rows.forEach(row => {
				const hasCards = gameState.opponent.rows[row.id].cards.length > 0;
				if (hasCards) {
					rowsWithCards.push(row);
				}
			});
			
			if (rowsWithCards.length === 0) {
				gameModule.showGameMessage('Нет отрядов противника на поле для атаки', 'warning');
				return;
			}
			
			const clickHandler = (rowId, rowName) => {
				return () => {
					let damagedCount = 0;
					const unitsToDestroy = [];
					const randomDamage = Math.floor(Math.random() * 3) + 1; // 1-3 урона
					
					gameState.opponent.rows[rowId].cards.forEach(card => {
						if (card.type === 'unit') {
							if (card.tags && (card.tags.includes('hero') || card.tags.includes('герой'))) return;
							
							this.dealDamage(card, randomDamage);
							damagedCount++;
							
							if (card.strength <= 0) {
								unitsToDestroy.push({ card: card, row: rowId });
							}
						}
					});
					
					unitsToDestroy.forEach(unit => {
						this.destroyCard(gameState, unit.card, unit.row, gameModule);
					});
					
					if (damagedCount === 0) {
						gameModule.showGameMessage('В выбранном ряду нет уязвимых отрядов', 'warning');
						this.removeHighlights();
						return;
					}
					
					gameState.player.abilityUsedThisRound = true;
					gameModule.updateRowStrength(rowId, 'opponent');
					gameModule.updateTotalScoreDisplays();
					gameModule.showGameMessage(`Способность "${this.name}" активирована! Нанесён ${randomDamage} урон ${damagedCount} отрядам.`, 'info');
					audioManager.playSound('card_damage');
					
					this.removeHighlights();
				};
			};
			
			rowsWithCards.forEach(row => {
				const rowElement = document.getElementById(row.elementId);
				if (rowElement) {
					rowElement.classList.add('row-damage-target');
					rowElement.style.cursor = 'pointer';
					rowElement.addEventListener('click', clickHandler(row.id, row.name));
					
					rowElement.addEventListener('mouseenter', () => {
						rowElement.style.transform = 'scale(1.02)';
						rowElement.style.transition = 'all 0.2s ease';
					});
					rowElement.addEventListener('mouseleave', () => {
						rowElement.style.transform = 'scale(1)';
					});
				}
			});
			
			this.showCancelButton();
		},
		
		removeHighlights: function() {
			const rows = ['close', 'ranged', 'siege'];
			rows.forEach(row => {
				const rowElement = document.getElementById(`opponent${gameModule.capitalizeFirst(row)}Row`);
				if (rowElement) {
					rowElement.classList.remove('row-damage-target');
					rowElement.style.cursor = '';
					rowElement.style.transform = '';
					const newRow = rowElement.cloneNode(true);
					rowElement.parentNode.replaceChild(newRow, rowElement);
				}
			});
			this.removeCancelButton();
		},
		
		showCancelButton: function() {
			if (document.getElementById('abilityCancelBtn')) return;
			const cancelBtn = document.createElement('button');
			cancelBtn.id = 'abilityCancelBtn';
			cancelBtn.textContent = 'ОТМЕНА';
			cancelBtn.className = 'ability-cancel-btn';
			cancelBtn.style.cssText = `
				position: fixed;
				bottom: 30px;
				left: 30px;
				background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
				color: #d4af37;
				border: 2px solid #d4af37;
				padding: 12px 35px;
				border-radius: 8px;
				cursor: pointer;
				font-weight: bold;
				font-family: 'Gwent', sans-serif;
				font-size: 16px;
				text-transform: uppercase;
				letter-spacing: 2px;
				z-index: 10050;
				transition: all 0.3s ease;
				box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
			`;
			cancelBtn.addEventListener('click', () => {
				this.removeHighlights();
				audioManager.playSound('button');
			});
			cancelBtn.addEventListener('mouseenter', () => {
				cancelBtn.style.transform = 'scale(1.05)';
				cancelBtn.style.boxShadow = '0 0 20px rgba(212, 175, 55, 0.5)';
				audioManager.playSound('touch');
			});
			cancelBtn.addEventListener('mouseleave', () => {
				cancelBtn.style.transform = 'scale(1)';
				cancelBtn.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
			});
			document.body.appendChild(cancelBtn);
		},
		
		removeCancelButton: function() {
			const btn = document.getElementById('abilityCancelBtn');
			if (btn) btn.remove();
		},
		
		dealDamage: function(card, amount) {
			if (card.baseStrength === undefined) card.baseStrength = card.strength;
			if (card.originalStrength === undefined) card.originalStrength = card.strength;
			const newStrength = (card.strength || 0) - amount;
			card.strength = Math.max(0, newStrength);
			card.currentStrength = card.strength;
			card._displayStrength = card.strength;
		},
		
		destroyCard: function(gameState, card, row, gameModule) {
			const rowCards = gameState.opponent.rows[row].cards;
			const cardIndex = rowCards.findIndex(c => c.uniqueId === card.uniqueId);
			if (cardIndex !== -1) {
				const destroyedCard = rowCards.splice(cardIndex, 1)[0];
				gameModule.addCardToDiscard(destroyedCard, 'opponent');
				gameModule.redrawRow(row, 'opponent');
				gameModule.updateRowStrength(row, 'opponent');
				audioManager.playSound('card_destroy');
			}
		}
	},
	'syndicate_ability_3': {
		name: 'Пиратская бухта',
		description: 'Призовите из колоды в руку 2 карты с тегом "Пират"',
		execute: function(gameState, gameModule) {
			if (gameState.player.hand.length >= 10) {
				gameModule.showGameMessage('Нет места в руке для призыва карт', 'warning');
				return false;
			}
			
			const pirateCards = [];
			
			for (let i = 0; i < gameState.player.deck.length; i++) {
				const card = gameState.player.deck[i];
				if (card.tags && (card.tags.includes('pirat') || card.tags.includes('пират'))) {
					pirateCards.push({ card: card, index: i });
				}
			}
			
			if (pirateCards.length === 0) {
				gameModule.showGameMessage('В колоде нет карт с тегом "Пират"', 'warning');
				return false;
			}
			
			const cardsToDraw = Math.min(2, pirateCards.length, 10 - gameState.player.hand.length);
			
			let drawnCards = [];
			for (let i = 0; i < cardsToDraw; i++) {
				const pirate = pirateCards[i];
				gameState.player.deck.splice(pirate.index - i, 1);
				gameState.player.hand.push(pirate.card);
				drawnCards.push(pirate.card.name);
			}
			
			gameState.player.abilityUsedThisRound = true;
			gameModule.displayPlayerHand();
			gameModule.displayPlayerDeck();
			
			const message = `Способность "${this.name}" активирована! Призваны карты: ${drawnCards.join(', ')}`;
			gameModule.showGameMessage(message, 'info');
			audioManager.playSound('cardAdd');
			
			return true;
		}
	},
	'syndicate_ability_4': {
		name: 'Священное братство',
		description: 'Усильте 2 случайных дружественных отряда на 2 ед.',
		execute: function(gameState, gameModule) {
			const friendlyUnits = [];
			const rows = ['close', 'ranged', 'siege'];
			
			rows.forEach(row => {
				gameState.player.rows[row].cards.forEach(card => {
					if (card.type === 'unit') {
						if (card.tags && (card.tags.includes('hero') || card.tags.includes('герой'))) return;
						friendlyUnits.push({ card: card, row: row });
					}
				});
			});
			
			if (friendlyUnits.length === 0) {
				gameModule.showGameMessage('Нет дружественных отрядов для усиления', 'warning');
				return false;
			}
			
			const boostAmount = 2;
			const boostCount = Math.min(2, friendlyUnits.length);
			
			const shuffled = [...friendlyUnits];
			for (let i = shuffled.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
			}
			
			let boostedCards = [];
			for (let i = 0; i < boostCount; i++) {
				const target = shuffled[i];
				this.boostCard(target.card, boostAmount);
				gameModule.updateRowStrength(target.row, 'player');
				boostedCards.push(target.card.name);
			}
			
			gameState.player.abilityUsedThisRound = true;
			gameModule.updateTotalScoreDisplays();
			gameModule.showGameMessage(`Способность "${this.name}" активирована! Усилены на ${boostAmount} ед.: ${boostedCards.join(', ')}`, 'info');
			audioManager.playSound('card_boost');
			
			return true;
		},
		
		boostCard: function(card, amount) {
			if (card.baseStrength === undefined) card.baseStrength = card.strength;
			if (card.originalStrength === undefined) card.originalStrength = card.strength;
			card.strength = (card.strength || 0) + amount;
			card.currentStrength = card.strength;
			card.modifiedStrength = card.strength;
			card._displayStrength = card.strength;
		}
	},
	'syndicate_ability_5': {
		name: 'Кровавые деньги',
		description: 'Уничтожьте вражеский отряд с силой 4 или меньше',
		execute: function(gameState, gameModule) {
			const destroyableUnits = [];
			const rows = ['close', 'ranged', 'siege'];
			
			rows.forEach(row => {
				gameState.opponent.rows[row].cards.forEach((card) => {
					if (card.type === 'unit' && (card.strength || 0) <= 4) {
						const isHero = card.tags && (card.tags.includes('hero') || card.tags.includes('герой'));
						if (!isHero) {
							destroyableUnits.push({ 
								card: card, 
								row: row,
								uniqueId: card.uniqueId 
							});
						}
					}
				});
			});
			
			if (destroyableUnits.length === 0) {
				gameModule.showGameMessage('Нет вражеских отрядов с силой 4 или меньше для уничтожения', 'warning');
				return false;
			}
			
			this.showTargetSelection(destroyableUnits, gameState, gameModule);
			return true;
		},
		
		showTargetSelection: function(destroyableUnits, gameState, gameModule) {
			const handlers = new Map();
			
			for (const unit of destroyableUnits) {
				const rowElement = document.getElementById(`opponent${gameModule.capitalizeFirst(unit.row)}Row`);
				if (!rowElement) continue;
				
				let cardElement = rowElement.querySelector(`[data-unique-id="${unit.uniqueId}"]`);
				if (!cardElement) {
					cardElement = rowElement.querySelector(`[data-card-id="${unit.card.id}"]`);
				}
				
				if (cardElement) {
					cardElement.style.cursor = 'pointer';
					cardElement.style.filter = 'brightness(1.2) drop-shadow(0 0 8px #ff4444)';
					cardElement.classList.add('destroyable-target');
					
					const clickHandler = (event) => {
						event.stopPropagation();
						event.preventDefault();
						
						let targetCard = null;
						let targetRow = null;
						
						for (const row of ['close', 'ranged', 'siege']) {
							const foundCard = gameState.opponent.rows[row].cards.find(c => 
								c.uniqueId === unit.uniqueId
							);
							if (foundCard) {
								targetCard = foundCard;
								targetRow = row;
								break;
							}
						}
						
						if (!targetCard) {
							for (const row of ['close', 'ranged', 'siege']) {
								const foundCard = gameState.opponent.rows[row].cards.find(c => 
									c.id === unit.card.id
								);
								if (foundCard) {
									targetCard = foundCard;
									targetRow = row;
									break;
								}
							}
						}
						
						if (targetCard) {
							this.destroyCard(gameState, targetCard, targetRow, gameModule);
							gameState.player.abilityUsedThisRound = true;
							
							gameModule.updateTotalScoreDisplays();
							gameModule.showGameMessage(`Способность "${this.name}" активирована! ${targetCard.name} уничтожен.`, 'info');
							audioManager.playSound('card_destroy');
						}
						
						this.removeDestroyHighlights(destroyableUnits, gameModule);
					};
					
					cardElement.addEventListener('click', clickHandler);
					handlers.set(cardElement, clickHandler);
					
					const mouseEnterHandler = () => {
						cardElement.style.transform = 'scale(1.05)';
					};
					const mouseLeaveHandler = () => {
						cardElement.style.transform = 'scale(1)';
					};
					
					cardElement.addEventListener('mouseenter', mouseEnterHandler);
					cardElement.addEventListener('mouseleave', mouseLeaveHandler);
					
					handlers.set(cardElement + '_enter', mouseEnterHandler);
					handlers.set(cardElement + '_leave', mouseLeaveHandler);
				}
			}
			
			this.currentHandlers = handlers;
			this.currentDestroyableUnits = destroyableUnits;
			
			this.showDestroyCancelButton(gameState, gameModule);
		},
		
		removeDestroyHighlights: function(destroyableUnits, gameModule) {
			if (this.currentHandlers) {
				for (const unit of destroyableUnits) {
					const rowElement = document.getElementById(`opponent${gameModule.capitalizeFirst(unit.row)}Row`);
					if (rowElement) {
						let cardElement = rowElement.querySelector(`[data-unique-id="${unit.uniqueId}"]`);
						if (!cardElement) {
							cardElement = rowElement.querySelector(`[data-card-id="${unit.card.id}"]`);
						}
						if (cardElement) {
							const clickHandler = this.currentHandlers.get(cardElement);
							if (clickHandler) {
								cardElement.removeEventListener('click', clickHandler);
							}
							const enterHandler = this.currentHandlers.get(cardElement + '_enter');
							const leaveHandler = this.currentHandlers.get(cardElement + '_leave');
							if (enterHandler) cardElement.removeEventListener('mouseenter', enterHandler);
							if (leaveHandler) cardElement.removeEventListener('mouseleave', leaveHandler);
							
							cardElement.style.cursor = '';
							cardElement.style.filter = '';
							cardElement.style.transform = '';
							cardElement.classList.remove('destroyable-target');
						}
					}
				}
				this.currentHandlers.clear();
			}
			this.removeDestroyCancelButton();
		},
		
		showDestroyCancelButton: function(gameState, gameModule) {
			if (document.getElementById('abilityCancelBtn')) return;
			
			const cancelBtn = document.createElement('button');
			cancelBtn.id = 'abilityCancelBtn';
			cancelBtn.textContent = 'ОТМЕНА';
			cancelBtn.className = 'ability-cancel-btn';
			cancelBtn.style.cssText = `
				position: fixed;
				bottom: 30px;
				left: 30px;
				background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
				color: #d4af37;
				border: 2px solid #d4af37;
				padding: 12px 35px;
				border-radius: 8px;
				cursor: pointer;
				font-weight: bold;
				font-family: 'Gwent', sans-serif;
				font-size: 16px;
				text-transform: uppercase;
				letter-spacing: 2px;
				z-index: 10050;
				transition: all 0.3s ease;
				box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
			`;
			
			cancelBtn.addEventListener('mouseenter', () => {
				cancelBtn.style.transform = 'scale(1.05)';
				cancelBtn.style.boxShadow = '0 0 20px rgba(212, 175, 55, 0.5)';
				audioManager.playSound('touch');
			});
			
			cancelBtn.addEventListener('mouseleave', () => {
				cancelBtn.style.transform = 'scale(1)';
				cancelBtn.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
			});
			
			cancelBtn.addEventListener('click', () => {
				this.removeDestroyHighlights(this.currentDestroyableUnits || [], gameModule);
				audioManager.playSound('button');
			});
			
			document.body.appendChild(cancelBtn);
			this.currentCancelBtn = cancelBtn;
		},
		
		removeDestroyCancelButton: function() {
			if (this.currentCancelBtn && this.currentCancelBtn.parentNode) {
				this.currentCancelBtn.remove();
				this.currentCancelBtn = null;
			}
			const btn = document.getElementById('abilityCancelBtn');
			if (btn) btn.remove();
		},
		
		destroyCard: function(gameState, card, row, gameModule) {
			const rowCards = gameState.opponent.rows[row].cards;
			let cardIndex = rowCards.findIndex(c => c.uniqueId === card.uniqueId);
			
			if (cardIndex !== -1) {
				const destroyedCard = rowCards.splice(cardIndex, 1)[0];
				gameModule.addCardToDiscard(destroyedCard, 'opponent');
				gameModule.redrawRow(row, 'opponent');
				gameModule.updateRowStrength(row, 'opponent');
			}
		}
	},

};

const leaderAbilitiesStyles = document.createElement('style');
leaderAbilitiesStyles.textContent = `
    .ability-target-overlay {
        animation: overlayFadeIn 0.3s ease-out;
    }
    
    .ability-deck-card:hover {
        transform: scale(1.05);
        filter: drop-shadow(0 0 10px #d4af37);
    }
    
    @keyframes overlayFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
`;

document.head.appendChild(leaderAbilitiesStyles);

window.leaderAbilities = leaderAbilities;