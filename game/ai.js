const aiModule = {
    gameState: null,
    usedCardIds: new Set(),
    isMakingMove: false,
	
    init: function(gameState) {
        this.gameState = gameState;
        this.usedCardIds.clear();
		this.isMakingMove = false;
    },
    
	reset: function() {
		this.usedCardIds.clear();
		this.gameState = null;
		this.isMakingMove = false;
	},

	makeMove: function() {
		if (this.isMakingMove) return;
		this.isMakingMove = true;
		
		if (this.gameState.opponent.passed) {
			this.isMakingMove = false;
			this.endAITurn();
			return;
		}
		
		if (this.gameState.cardsPlayedThisTurn >= this.gameState.maxCardsPerTurn) {
			this.isMakingMove = false;
			this.endAITurn();
			return;
		}
		
		if (this.gameState.player.passed) {
			if (this.gameState.cardsPlayedThisTurn > 0) {
				this.isMakingMove = false;
				this.pass();
				return;
			}
			
			const playableCards = this.getPlayableCards();
			if (playableCards.length > 0) {
				const bestCard = this.selectBestCard(playableCards);
				if (bestCard && bestCard.strength > 5) {
					this.playCard(bestCard);
					
					setTimeout(() => {
						this.isMakingMove = false;
						this.pass();
					}, 1500);
					return;
				} else {
					this.isMakingMove = false;
					this.pass();
					return;
				}
			} else {
				this.isMakingMove = false;
				this.pass();
				return;
			}
		}
		
		if (this.gameState.opponent.hand.length === 0) {
			this.isMakingMove = false;
			this.pass();
			return;
		}
		
		const playableCards = this.getPlayableCards();
		
		if (playableCards.length === 0) {
			this.isMakingMove = false;
			this.pass();
			return;
		}
		
		const bestCard = this.selectBestCard(playableCards);
		
		if (bestCard) {
			this.playCard(bestCard);
			setTimeout(() => {
				this.isMakingMove = false;
			}, 100);
		} else {
			this.isMakingMove = false;
			this.pass();
		}
	},

	pass: function() {
		this.gameState.opponent.passed = true;
		
		if (window.gameModule) {
			window.gameModule.showGameMessage('Противник пасует', 'info');
			window.gameModule.updateControlButtons();
			
			if (this.gameState.player.passed) {
				setTimeout(() => {
					window.gameModule.checkRoundEnd();
				}, 1000);
			} else {
				window.gameModule.handleTurnEnd();
			}
		}
	},

    getPlayableCards: function() {
    const uniqueCards = [];
    const seenIds = new Set();
    
    this.gameState.opponent.hand.forEach(card => {
        if (this.usedCardIds.has(card.id)) {
            return;
        }
        
        if (seenIds.has(card.id)) {
            return;
        }
        seenIds.add(card.id);
        
        if (this.isWeatherCard(card)) {
            if (this.canPlayWeatherCard(card)) {
                uniqueCards.push(card);
            }
        } else if (card.type === 'tactic') {
            if (this.canPlayTacticCard(card)) {
                uniqueCards.push(card);
            }
        } else if (card.ability === 'decoy') {
            if (this.getWeakCardsOnBoard().length > 0) {
                uniqueCards.push(card);
            }
        } else if (card.ability === 'destroy') {
            if (this.findStrongestPlayerCard()) {
                uniqueCards.push(card);
            }
        } else if (card.ability === 'destroy_artf') {
            if (this.findPlayerArtifacts().length > 0) {
                uniqueCards.push(card);
            }
        } else {
            if (this.canPlayUnitCard(card)) {
                uniqueCards.push(card);
            }
        } if (card.ability && card.ability.startsWith('damage_')) {
			if (this.canPlayDamageCard(card)) {
				uniqueCards.push(card);
			}
		} 
    });
    
    return uniqueCards;
},
    
	canPlayDamageCard: function(card) {
		const ability = card.ability;
		
		if (ability.includes('damage_row_')) {
			// Для урона по ряду проверяем, есть ли ряды с картами
			const rows = ['close', 'ranged', 'siege'];
			return rows.some(row => {
				const rowCards = this.gameState.player.rows[row].cards;
				return rowCards.some(c => c.type === 'unit' && c.strength > 0);
			});
		} else {
			// Для урона по единичной карте проверяем, есть ли карты противника
			const rows = ['close', 'ranged', 'siege'];
			return rows.some(row => {
				const rowCards = this.gameState.player.rows[row].cards;
				return rowCards.some(c => c.type === 'unit' && c.strength > 0);
			});
		}
	},

    canPlayWeatherCard: function(card) {
		const isClearWeather = this.isClearWeatherCard(card);
		if (isClearWeather) {
			const hasSameClearWeather = this.gameState.weather.cards.some(wc => 
				wc.name === card.name || wc.id === card.id
			);
			
			if (hasSameClearWeather) {
				return false;
			}
			return true;
		} else {
			const sameWeatherExists = this.gameState.weather.cards.some(weatherCard => {
				if (this.isClearWeatherCard(weatherCard)) return false;
				return weatherCard.name === card.name;
			});
			if (sameWeatherExists) {
				return false;
			}
			const weatherEffect = this.getWeatherEffectForCard(card);
			if (!weatherEffect || !weatherEffect.rows) {
				return false;
			}
			const targetRows = weatherEffect.rows;
			if (targetRows.length > 1) {
				let occupiedRowsCount = 0;
				targetRows.forEach(row => {
					if (this.gameState.weather.effects[row]) {
						occupiedRowsCount++;
					}
				});
				if (occupiedRowsCount === targetRows.length) {
					return false;
				}
			}
			else if (targetRows.length === 1) {
				const targetRow = targetRows[0];
				if (this.gameState.weather.effects[targetRow]) {
					return false;
				}
			}
			const regularWeatherCards = this.gameState.weather.cards.filter(wc => 
				!this.isClearWeatherCard(wc)
			);
			const hasClearWeather = this.gameState.weather.cards.some(wc => 
				this.isClearWeatherCard(wc)
			);
			if (!hasClearWeather && regularWeatherCards.length >= this.gameState.weather.maxWeatherCards) {
				return false;
			}
			return true;
		}
	},

    hasDuplicateWeather: function(card) {
        const weatherEffect = this.getWeatherEffectForCard(card);
        if (!weatherEffect || !weatherEffect.rows) return false;
        
        const hasSameCard = this.gameState.weather.cards.some(wc => 
            wc.name === card.name
        );
        
        if (hasSameCard) return true;
        
        return weatherEffect.rows.every(row => 
            this.gameState.weather.effects[row]
        );
    },

    canPlayTacticCard: function(card) {
        const rows = ['close', 'ranged', 'siege'];
        return rows.some(row => !this.gameState.opponent.rows[row].tactic);
    },
    
    canPlayUnitCard: function(card) {
    // Для карт с особыми способностями проверка не нужна
    if (card.ability === 'decoy' || card.ability === 'destroy' || card.ability === 'destroy_artf') {
        return true;
    }
    
    const availableRows = this.getAvailableRowsForCard(card);
    return availableRows.length > 0;
},
    
    getAvailableRowsForCard: function(card) {
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
        
        return availableRows.filter(row => 
            this.gameState.opponent.rows[row].cards.length < 9
        );
    },
    
    selectBestCard: function(playableCards) {
        if (playableCards.length === 0) return null;
        
        const scoredCards = playableCards.map(card => ({
            card: card,
            score: this.evaluateCardScore(card)
        }));
        
        scoredCards.sort((a, b) => b.score - a.score);
        
        return scoredCards[0].card;
    },
    
    evaluateCardScore: function(card) {
		let baseScore = 0;
		
		if (this.isWeatherCard(card)) {
			baseScore = this.evaluateWeatherCard(card);
		} else if (card.type === 'tactic') {
			baseScore = this.evaluateTacticCard(card);
		} else if (card.type === 'unit') {
			baseScore = this.evaluateUnitCard(card);
		} else if (card.ability === 'decoy') {
			baseScore = this.evaluateDecoyCard(card);
		} else if (card.ability === 'destroy') {
			baseScore = this.evaluateDestroyCard(card);
		} else if (card.ability === 'destroy_artf') {
			baseScore = this.evaluateDestroyArtifactCard(card);
		} else if (card.ability && card.ability.startsWith('damage_')) {
			baseScore = this.evaluateDamageCard(card);
		} else {
			baseScore = 5;
		}
		
		if (card.rarity === 'gold') {
			baseScore += 3;
		}
		
		const situationBonus = this.getSituationBonus(card);
		baseScore += situationBonus;
		
		return Math.max(0, baseScore);
	},
		
	evaluateDamageCard: function(card) {
		const ability = card.ability;
		const isRowDamage = ability.includes('damage_row_');
		
		if (isRowDamage) {
			return this.evaluateRowDamageCard(card);
		} else {
			return this.evaluateUnitDamageCard(card);
		}
	},

	evaluateUnitDamageCard: function(card) {
		let score = 12;
		
		// Получаем значение урона из способности
		const damageMatch = card.ability.match(/damage_(\d+)/);
		const damageValue = damageMatch ? parseInt(damageMatch[1]) : 1;
		
		// Находим лучшую цель для урона
		const bestTarget = this.findBestDamageTarget(damageValue);
		
		if (bestTarget) {
			// Чем больше урон, тем выше оценка
			score += damageValue * 3;
			
			// Бонус за уничтожение карты
			if (bestTarget.card.strength <= damageValue) {
				score += 15;
				
				// Дополнительный бонус за уничтожение сильных карт
				if (bestTarget.card.strength >= 8) {
					score += 10;
				}
				
				// Бонус за уничтожение золотых карт
				if (bestTarget.card.rarity === 'gold') {
					score += 20;
				}
			} else {
				// Бонус за нанесение урона без уничтожения
				score += Math.min(bestTarget.card.strength, damageValue) * 2;
			}
		} else {
			// Если нет целей, не играем эту карту
			score = 0;
		}
		
		return score;
	},

	evaluateRowDamageCard: function(card) {
		let score = 10;
		
		// Получаем значение урона из способности
		const damageMatch = card.ability.match(/damage_row_(\d+)/);
		const damageValue = damageMatch ? parseInt(damageMatch[1]) : 1;
		
		// Находим лучший ряд для урона
		const bestRow = this.findBestRowForDamage(damageValue);
		
		if (bestRow) {
			const rowState = this.gameState.player.rows[bestRow];
			const unitCount = rowState.cards.filter(c => c.type === 'unit' && c.strength > 0).length;
			
			// Бонус за количество карт в ряду
			score += unitCount * 5;
			
			// Бонус за значение урона
			score += damageValue * 2;
			
			// Проверяем, сколько карт может быть уничтожено
			let potentialDestroys = 0;
			rowState.cards.forEach(unit => {
				if (unit.type === 'unit' && unit.strength > 0 && unit.strength <= damageValue) {
					potentialDestroys++;
				}
			});
			
			score += potentialDestroys * 10;
		} else {
			// Если нет подходящих рядов, не играем эту карту
			score = 0;
		}
		
		return score;
	},

	findBestDamageTarget: function(damageValue) {
		const rows = ['close', 'ranged', 'siege'];
		let bestTarget = null;
		let bestScore = -1;
		
		rows.forEach(row => {
			const rowCards = this.gameState.player.rows[row].cards;
			
			rowCards.forEach(card => {
				if (card.type === 'unit') {
					// Используем displayStrength если есть, иначе оригинальную
					const currentStrength = card._displayStrength !== undefined ? 
						card._displayStrength : (card.strength || 0);
					
					if (currentStrength > 0) {
						let score = 0;
						
						// Оценка цели
						score += currentStrength * 2;
						
						// Бонус за возможность уничтожения
						if (currentStrength <= damageValue) {
							score += 20;
							
							// Дополнительный бонус за сильные карты
							if (currentStrength >= 8) {
								score += 15;
							}
						}
					
						// Бонус за редкие карты
						if (card.rarity === 'gold') {
							score += 25;
						} else if (card.rarity === 'silver') {
							score += 10;
						}
						
						// Бонус за карты с тегами (особые способности)
						if (card.tags && card.tags.length > 0) {
							score += card.tags.length * 5;
						}
						
						if (score > bestScore) {
							bestScore = score;
							bestTarget = { card: card, row: row, score: score };
						}
					}
				}
			});
		});
		
		return bestTarget;
	},

	findBestRowForDamage: function(damageValue) {
		const rows = ['close', 'ranged', 'siege'];
		let bestRow = null;
		let bestScore = -1;
		
		rows.forEach(row => {
			const rowState = this.gameState.player.rows[row];
			const unitCards = rowState.cards.filter(c => c.type === 'unit' && c.strength > 0);
			
			if (unitCards.length === 0) return;
			
			let score = 0;
			
			// Оценка ряда
			score += unitCards.length * 3;
			
			// Бонус за общую силу ряда
			const rowStrength = unitCards.reduce((sum, card) => sum + card.strength, 0);
			score += rowStrength * 0.5;
			
			// Бонус за потенциальные уничтожения
			let potentialDestroys = 0;
			unitCards.forEach(card => {
				if (card.strength <= damageValue) {
					potentialDestroys++;
					score += 15;
					
					// Дополнительный бонус за сильные карты
					if (card.strength >= 8) {
						score += 10;
					}
				}
			});
			
			score += potentialDestroys * 10;
			
			if (score > bestScore) {
				bestScore = score;
				bestRow = row;
			}
		});
		
		return bestRow;
	},

	playDamageCard: function(card) {
		const ability = card.ability;
		const isRowDamage = ability.includes('damage_row_');
		
		if (isRowDamage) {
			this.playRowDamageCard(card);
		} else {
			this.playUnitDamageCard(card);
		}
	},

	playUnitDamageCard: function(card) {
		const damageMatch = card.ability.match(/damage_(\d+)/);
		const damageValue = damageMatch ? parseInt(damageMatch[1]) : 1;
		const bestTarget = this.findBestDamageTarget(damageValue);
		
		if (!bestTarget) {
			this.usedCardIds.delete(card.id);
			return;
		}
		this.executeUnitDamage(card, bestTarget);
	},

	playRowDamageCard: function(card) {
		const damageMatch = card.ability.match(/damage_row_(\d+)/);
		const damageValue = damageMatch ? parseInt(damageMatch[1]) : 1;
		const bestRow = this.findBestRowForDamage(damageValue);
		
		if (!bestRow) {
			this.usedCardIds.delete(card.id);
			return;
		}
		this.executeRowDamage(card, bestRow, damageValue);
	},

	executeUnitDamage: function(damageCard, targetData) {
		const { card: targetCard, row: targetRow } = targetData;
		
		this.removeCardFromHand(damageCard);
		
		const damageCardCopy = { ...damageCard };
		this.gameState.opponent.discard.push(damageCardCopy);
		
		const damageMatch = damageCard.ability.match(/damage_(\d+)/);
		const damageValue = damageMatch ? parseInt(damageMatch[1]) : 1;
		
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
		
		this.createDamageVisualEffect(targetCard, targetRow, damageValue);
		
		if (window.gameModule) {
			window.gameModule.updateCardStrengthDisplay(targetCard, targetRow, 'player');
		}
		
		if (targetCard._displayStrength === 0) {
			const rowState = this.gameState.player.rows[targetRow];
			const cardIndex = rowState.cards.findIndex(c => c.id === targetCard.id);
			if (cardIndex !== -1) {
				const destroyedCard = { ...rowState.cards[cardIndex] };
				rowState.cards.splice(cardIndex, 1);
				this.gameState.player.discard.push(destroyedCard);
				
				setTimeout(() => {
					if (window.gameModule) {
						window.gameModule.removeCardFromBoardVisual(targetCard, targetRow, 'player');
					}
				}, 500);
				
				delete targetCard.originalStrength;
				delete targetCard._displayStrength;
				delete targetCard._damageDisplayStrength;
			}
		}
		
		if (window.gameModule) {
			window.gameModule.updateRowStrength(targetRow, 'player');
			window.gameModule.displayPlayerDiscard();
			window.gameModule.displayOpponentDiscard();
			
			if (window.gameModule.completeCardPlay) {
				setTimeout(() => {
					window.gameModule.completeCardPlay();
				}, 1000);
			}
		}
		
		if (window.audioManager && window.audioManager.playSound) {
			audioManager.playSound('card_damage');
		}
	},

	executeRowDamage: function(damageCard, row, damageValue) {
		this.removeCardFromHand(damageCard);
		
		const damageCardCopy = { ...damageCard };
		this.gameState.opponent.discard.push(damageCardCopy);
		
		const rowState = this.gameState.player.rows[row];
		let destroyedCards = [];
		
		rowState.cards.forEach(card => {
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
						window.gameModule.updateCardStrengthDisplay(card, row, 'player');
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
				this.gameState.player.discard.push(destroyedCardCopy);
				
				setTimeout(() => {
					if (window.gameModule) {
						window.gameModule.removeCardFromBoardVisual(destroyedCard, row, 'player');
					}
				}, 500);
				
				delete destroyedCard.originalStrength;
				delete destroyedCard._displayStrength;
				delete destroyedCard._damageDisplayStrength;
			}
		}
		
		if (window.gameModule) {
			window.gameModule.updateRowStrength(row, 'player');
			
			window.gameModule.displayPlayerDiscard();
			window.gameModule.displayOpponentDiscard();
			
			if (window.gameModule.completeCardPlay) {
				setTimeout(() => {
					window.gameModule.completeCardPlay();
				}, 1500);
			}
		}
		
		if (window.audioManager && window.audioManager.playSound) {
			audioManager.playSound('card_damage');
		}
	},

	updateCardDisplay: function(card, row) {
		if (window.gameModule && window.gameModule.updateCardStrengthDisplay) {
			window.gameModule.updateCardStrengthDisplay(card, row, 'player');
		}
	},

	createDamageVisualEffect: function(card, row, damageValue) {
		const rowElement = document.getElementById(`player${this.capitalizeFirst(row)}Row`);
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

	evaluateDestroyCard: function(card) {
    let score = 20;
    
    // Находим самую сильную карту игрока
    const strongestPlayerCard = this.findStrongestPlayerCard();
    
    if (strongestPlayerCard) {
        const cardStrength = strongestPlayerCard.card.strength || 0;
        
        // Чем сильнее карта, тем ценнее ее уничтожение
        score += cardStrength * 2;
        
        // Бонус за уничтожение золотых/особых карт
        if (strongestPlayerCard.card.rarity === 'gold') {
            score += 10;
        }
        
        // Бонус за уничтожение карт с тегами (особые способности)
        if (strongestPlayerCard.card.tags && strongestPlayerCard.card.tags.length > 0) {
            score += strongestPlayerCard.card.tags.length * 3;
        }
        
        // Учитываем ситуацию на поле
        const playerTotalScore = this.calculateTotalScore('player');
        const opponentTotalScore = this.calculateTotalScore('opponent');
        
        if (playerTotalScore > opponentTotalScore + 5) {
            // Если игрок лидирует, уничтожение его сильной карты особенно важно
            score += 15;
        }
        
        if (cardStrength >= 8) {
            score += 10;
        }
    } else {
        // Если у игрока нет карт для уничтожения, не играем эту карту
        score = 0;
    }
    
    return score;
},

	findStrongestPlayerCard: function() {
		const rows = ['close', 'ranged', 'siege'];
		let strongestCard = null;
		let maxStrength = -1;
		let cardRow = null;
		
		rows.forEach(row => {
			const rowCards = this.gameState.player.rows[row].cards;
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

	evaluateDestroyArtifactCard: function(card) {
		let score = 18;
		
		// Находим артефакты игрока
		const playerArtifacts = this.findPlayerArtifacts();
		
		if (playerArtifacts.length > 0) {
			// Учитываем количество артефактов
			score += playerArtifacts.length * 5;
			
			// Бонус за тактические карты
			const tacticCount = playerArtifacts.filter(a => a.type === 'tactic').length;
			if (tacticCount > 0) {
				score += tacticCount * 8;
			}
			
			// Бонус за сильные/редкие артефакты
			playerArtifacts.forEach(artifact => {
				if (artifact.card.rarity === 'gold') {
					score += 12;
				} else if (artifact.card.rarity === 'silver') {
					score += 6;
				}
				
				// Бонус за артефакты с тегами (особые способности)
				if (artifact.card.tags && artifact.card.tags.length > 0) {
					score += artifact.card.tags.length * 4;
				}
			});
			
			// Учитываем ситуацию на поле
			const playerTotalScore = this.calculateTotalScore('player');
			const opponentTotalScore = this.calculateTotalScore('opponent');
			
			if (playerTotalScore > opponentTotalScore + 10) {
				// Если игрок сильно лидирует, уничтожение его артефактов менее важно
				score -= 5;
			} else if (playerTotalScore < opponentTotalScore) {
				// Если мы проигрываем, уничтожение артефактов может помочь
				score += 10;
			}
		} else {
			// Если у игрока нет артефактов, не играем эту карту
			score = 0;
		}
		
		return score;
	},

	findPlayerArtifacts: function() {
		const artifacts = [];
		const rows = ['close', 'ranged', 'siege'];
		
		rows.forEach(row => {
			// Проверяем тактические карты
			if (this.gameState.player.rows[row].tactic) {
				artifacts.push({
					card: this.gameState.player.rows[row].tactic,
					row: row,
					type: 'tactic',
					location: 'tactic_slot'
				});
			}
			
			// Проверяем артефакты в ряду
			const rowCards = this.gameState.player.rows[row].cards || [];
			rowCards.forEach(card => {
				if (card.type === 'artifact') {
					artifacts.push({
						card: card,
						row: row,
						type: 'artifact',
						location: 'row',
						position: rowCards.indexOf(card)
					});
				}
			});
		});
		
		return artifacts;
	},

    evaluateWeatherCard: function(card) {
        let score = 10;
        
        if (this.isClearWeatherCard(card)) {
            const activeWeatherCount = Object.values(this.gameState.weather.effects)
                .filter(effect => effect !== null).length;
            if (activeWeatherCount > 0) {
                score += activeWeatherCount * 20;
            } else {
                score = 0;
            }
            
            const hasClearWeather = this.gameState.weather.cards.some(wc => 
                this.isClearWeatherCard(wc)
            );
            if (hasClearWeather) {
                score = -10;
            }
        } else {
            const weatherEffect = this.getWeatherEffectForCard(card);
            if (weatherEffect && weatherEffect.rows) {
                let totalPlayerStrength = 0;
                let totalOpponentStrength = 0;
                let alreadyHasWeatherOnSomeRows = false;
                
                weatherEffect.rows.forEach(row => {
                    totalPlayerStrength += this.gameState.player.rows[row].strength;
                    totalOpponentStrength += this.gameState.opponent.rows[row].strength;
                    
                    if (this.gameState.weather.effects[row]) {
                        alreadyHasWeatherOnSomeRows = true;
                    }
                });
                
                if (totalPlayerStrength > 0) {
                    score += Math.min(totalPlayerStrength * 0.7, 20);
                }
                
                if (totalOpponentStrength > 0) {
                    score -= Math.min(totalOpponentStrength * 0.5, 10);
                }
                
                if (alreadyHasWeatherOnSomeRows) {
                    score -= 10;
                }
                
                if (weatherEffect.rows.length > 1) {
                    score += 5;
                }
            }
        }
        
        return Math.max(0, score);
    },

    evaluateTacticCard: function(card) {
        let score = 8;
        
        const playerTotal = this.calculateTotalScore('player');
        const opponentTotal = this.calculateTotalScore('opponent');
        
        if (opponentTotal < playerTotal) {
            score += 3;
        }
        
        return score;
    },
    
    evaluateUnitCard: function(card) {
        let score = card.strength || 5;
        
        const bestRow = this.findBestRowForUnit(card);
        if (bestRow) {
            score += this.getRowPlacementBonus(card, bestRow);
        }
        
        return score;
    },
    
    findBestRowForUnit: function(card) {
        const availableRows = this.getAvailableRowsForCard(card);
        if (availableRows.length === 0) return null;
        
        const scoredRows = availableRows.map(row => ({
            row: row,
            score: this.evaluateRowForPlacement(row)
        }));
        
        scoredRows.sort((a, b) => b.score - a.score);
        return scoredRows[0].row;
    },
    
    evaluateRowForPlacement: function(row) {
        let score = 0;
        
        const cardCount = this.gameState.opponent.rows[row].cards.length;
        score += (9 - cardCount) * 2;
        
        if (this.gameState.weather.effects[row]) {
            score -= 50;
        }
        
        const rowStrength = this.gameState.opponent.rows[row].strength;
        score += rowStrength * 0.5;
        
        return score;
    },
    
    getRowPlacementBonus: function(card, row) {
        let bonus = 0;
        
        const rowCards = this.gameState.opponent.rows[row].cards;
        
        if (card.tags) {
            rowCards.forEach(existingCard => {
                if (existingCard.tags) {
                    const commonTags = card.tags.filter(tag => existingCard.tags.includes(tag));
                    bonus += commonTags.length * 2;
                }
            });
        }
        
        return bonus;
    },
    
    getSituationBonus: function(card) {
        let bonus = 0;
        
        const playerTotalScore = this.calculateTotalScore('player');
        const opponentTotalScore = this.calculateTotalScore('opponent');
        
        if (opponentTotalScore < playerTotalScore) {
            if (card.strength && card.strength > 8) {
                bonus += 5;
            }
        }
        
        if (opponentTotalScore > playerTotalScore + 10) {
            if (this.isWeatherCard(card) && !this.isClearWeatherCard(card)) {
                bonus -= 5;
            }
        }
        
        return bonus;
    },
    
	evaluateDecoyCard: function(card) {
    let score = 15;
    
    // Ищем слабые карты на своем поле, которые можно вернуть в руку
    const weakCards = this.getWeakCardsOnBoard();
    if (weakCards.length > 0) {
        score += weakCards.length * 5;
    }
    
    // Учитываем наличие сильных карт в руке, которые можно сыграть повторно
    const strongCardsInHand = this.gameState.opponent.hand.filter(c => 
        c.strength > 8 && c.type === 'unit'
    );
    if (strongCardsInHand.length > 0) {
        score += 10;
    }
    
    return score;
},

	getWeakCardsOnBoard: function() {
		const weakCards = [];
		const rows = ['close', 'ranged', 'siege'];
		
		rows.forEach(row => {
			this.gameState.opponent.rows[row].cards.forEach(card => {
				if (card.type === 'unit' && card.strength < 4) {
					weakCards.push({
						card: card,
						row: row,
						score: 10 - card.strength // Чем слабее карта, тем выше приоритет
					});
				}
			});
		});
		
		return weakCards.sort((a, b) => b.score - a.score);
	},

    playCard: function(card) {
		this.usedCardIds.add(card.id);
		this.removeCardFromHand(card);
		
		if (this.isWeatherCard(card)) {
			this.playWeatherCard(card);
		} else if (card.type === 'tactic') {
			this.playTacticCard(card);
		} else if (card.ability === 'decoy') {
			this.playDecoyCard(card);
		} else if (card.ability === 'destroy') {
			this.playDestroyCard(card);
		} else if (card.ability === 'destroy_artf') {
			this.playDestroyArtifactCard(card);
		} else if (card.ability && card.ability.startsWith('damage_')) {
			this.playDamageCard(card);
		} else {
			this.playUnitCard(card);
		}
	},
	
	playDestroyArtifactCard: function(card) {
    // Находим артефакты игрока
    const playerArtifacts = this.findPlayerArtifacts();
    
    if (playerArtifacts.length === 0) {
        // Если нет целей, не играем эту карту
        this.usedCardIds.delete(card.id);
        return;
    }
    
    // Выбираем лучший артефакт для уничтожения
    const bestArtifact = this.selectBestArtifactToDestroy(playerArtifacts);
    
    if (bestArtifact) {
        // Выполняем уничтожение
        this.executeArtifactDestroy(card, bestArtifact);
    }
},

	selectBestArtifactToDestroy: function(artifacts) {
		if (artifacts.length === 0) return null;
		
		const scoredArtifacts = artifacts.map(artifact => ({
			artifact: artifact,
			score: this.evaluateArtifactForDestruction(artifact)
		}));
		
		// Сортируем по убыванию оценки
		scoredArtifacts.sort((a, b) => b.score - a.score);
		
		return scoredArtifacts[0].artifact;
	},

	evaluateArtifactForDestruction: function(artifact) {
		let score = 0;
		
		// Тактические карты приоритетнее
		if (artifact.type === 'tactic') {
			score += 20;
		}
		
		// Редкие карты приоритетнее
		if (artifact.card.rarity === 'gold') {
			score += 15;
		} else if (artifact.card.rarity === 'silver') {
			score += 10;
		}
		
		// Артефакты с тегами (особые способности)
		if (artifact.card.tags && artifact.card.tags.length > 0) {
			score += artifact.card.tags.length * 5;
		}
		
		// Учитываем силу (если есть)
		if (artifact.card.strength) {
			score += artifact.card.strength * 2;
		}
		
		// Учитываем положение на поле (центральные ряды важнее)
		if (artifact.row === 'ranged') {
			score += 3;
		}
		
		return score;
	},

	executeArtifactDestroy: function(destroyCard, artifactData) {
		const { card: targetCard, row: targetRow, type: targetType } = artifactData;
		
		// Удаляем Коратскую жару из руки
		this.removeCardFromHand(destroyCard);
		
		// Добавляем Коратскую жару в сброс противника
		const destroyCardCopy = { ...destroyCard };
		this.gameState.opponent.discard.push(destroyCardCopy);
		
		// Удаляем артефакт игрока
		if (targetType === 'tactic') {
			// Удаляем тактическую карту
			delete this.gameState.player.rows[targetRow].tactic;
			
			// Обновляем отображение
			if (window.gameModule) {
				const tacticSlot = document.getElementById(`player${this.capitalizeFirst(targetRow)}Tactics`);
				if (tacticSlot) {
					tacticSlot.innerHTML = '';
				}
			}
		} else if (targetType === 'artifact') {
			// Удаляем артефакт из ряда
			const rowState = this.gameState.player.rows[targetRow];
			const cardIndex = rowState.cards.findIndex(c => c.id === targetCard.id);
			if (cardIndex !== -1) {
				// Создаем копию для сброса
				const destroyedCard = { ...rowState.cards[cardIndex] };
				
				// Удаляем из ряда
				rowState.cards.splice(cardIndex, 1);
				
				// Добавляем в сброс игрока
				this.gameState.player.discard.push(destroyedCard);
				
				// Обновляем отображение
				if (window.gameModule) {
					window.gameModule.removeCardFromBoardVisual(targetCard, targetRow, 'player');
					window.gameModule.updateRowStrength(targetRow, 'player');
				}
			}
		}
		
		// Добавляем уничтоженный артефакт в сброс игрока
		const destroyedCardCopy = { ...targetCard };
		this.gameState.player.discard.push(destroyedCardCopy);
		
		// Воспроизводим звук
		if (window.audioManager && window.audioManager.playSound) {
			audioManager.playSound('artefact');
			setTimeout(() => {
				audioManager.playSound('card_destroy');
			}, 300);
		}
		
		// Обновляем сбросы
		if (window.gameModule) {
			window.gameModule.displayPlayerDiscard();
			window.gameModule.displayOpponentDiscard();
			
			// Завершаем ход
			if (window.gameModule.completeCardPlay) {
				setTimeout(() => {
					window.gameModule.completeCardPlay();
				}, 1000);
			}
		}
	},

	playDestroyCard: function(card) {
    // Находим самую сильную карту игрока
    const strongestPlayerCard = this.findStrongestPlayerCard();
    
    if (!strongestPlayerCard) {
        // Если нет целей, не играем эту карту
        this.usedCardIds.delete(card.id);
        return;
    }
    
    // Выполняем уничтожение
    this.executeDestroyCard(card, strongestPlayerCard);
},

	executeDestroyCard: function(destroyCard, targetData) {
		const { card: targetCard, row: targetRow } = targetData;
		
		// Удаляем Казнь из руки
		this.removeCardFromHand(destroyCard);
		
		// Добавляем Казнь в сброс противника
		const destroyCardCopy = { ...destroyCard };
		this.gameState.opponent.discard.push(destroyCardCopy);
		
		// Удаляем карту игрока из ряда
		const rowState = this.gameState.player.rows[targetRow];
		const cardIndex = rowState.cards.findIndex(c => c.id === targetCard.id);
		
		if (cardIndex !== -1) {
			// Создаем копию для сброса
			const destroyedCard = { ...rowState.cards[cardIndex] };
			
			// Удаляем из ряда
			rowState.cards.splice(cardIndex, 1);
			
			// Добавляем в сброс игрока
			this.gameState.player.discard.push(destroyedCard);
			
			// Обновляем отображение
			if (window.gameModule) {
				// Создаем визуальный эффект
				this.createDestroyVisualEffect(targetCard, targetRow);
				
				// Удаляем карту с поля через задержку
				setTimeout(() => {
					window.gameModule.removeCardFromBoardVisual(targetCard, targetRow, 'player');
				}, 500);
				
				// Обновляем силу ряда
				window.gameModule.updateRowStrength(targetRow, 'player');
				
				// Обновляем сбросы
				if (window.gameModule.displayPlayerDiscard) {
					window.gameModule.displayPlayerDiscard();
				}
				if (window.gameModule.displayOpponentDiscard) {
					window.gameModule.displayOpponentDiscard();
				}
				
				// Завершаем ход
				if (window.gameModule.completeCardPlay) {
					setTimeout(() => {
						window.gameModule.completeCardPlay();
					}, 1000);
				}
			}
			
			// Воспроизводим звук
			if (window.audioManager && window.audioManager.playSound) {
				audioManager.playSound('artefact');
				setTimeout(() => {
					audioManager.playSound('scorch');
				}, 300);
			}
		}
	},

	createDestroyVisualEffect: function(card, row) {
		const rowElement = document.getElementById(`player${this.capitalizeFirst(row)}Row`);
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
	},

	playDecoyCard: function(card) {
    const weakCards = this.getWeakCardsOnBoard();
    
    if (weakCards.length > 0) {
        const bestTarget = weakCards[0];
        this.performDecoySwap(card, bestTarget.card, bestTarget.row);
        
        // Увеличиваем счетчик сыгранных карт
        this.gameState.cardsPlayedThisTurn++;
    } else {
        // Если нет слабых карт, пропускаем эту карту
        this.usedCardIds.delete(card.id); // Убираем из использованных
        return; // Не увеличиваем счетчик и не удаляем карту
    }
},

	performDecoySwap: function(decoyCard, targetCard, row) {
		const rowState = this.gameState.opponent.rows[row];
		const targetIndex = rowState.cards.findIndex(c => c.id === targetCard.id);
		
		if (targetIndex === -1) return;
		
		// Создаем копию для возврата в руку
		const cardCopy = { ...targetCard };
		cardCopy.playedThisRound = false;
		
		// Восстанавливаем оригинальную силу, если карта была под погодой
		if (cardCopy.originalStrength !== undefined) {
			cardCopy.strength = cardCopy.originalStrength;
			delete cardCopy.originalStrength;
		}
		
		// Удаляем Чучело из руки
		this.removeCardFromHand(decoyCard);
		
		// Добавляем карту обратно в руку
		this.gameState.opponent.hand.push(cardCopy);
		
		// Заменяем на поле
		const placedDecoy = { ...decoyCard };
		placedDecoy.owner = 'opponent';
		placedDecoy.row = row;
		placedDecoy.currentStrength = 1;
		
		rowState.cards[targetIndex] = placedDecoy;
		
		// Обновляем отображение
		if (window.gameModule) {
			window.gameModule.displayCardOnRow(row, placedDecoy, 'opponent', targetIndex);
			window.gameModule.updateRowStrength(row, 'opponent');
			
			// Завершаем ход через небольшую задержку
			setTimeout(() => {
				if (window.gameModule.completeCardPlay) {
					window.gameModule.completeCardPlay();
				}
			}, 1000);
		}
		
		if (window.audioManager && window.audioManager.playSound) {
			audioManager.playSound('artefact');
		}
	},

	endAITurn: function() {
		this.isMakingMove = false;
		
		if (window.gameModule) {
			window.gameModule.handleTurnEnd();
		}
	},
	
	playWeatherCard: function(card) {
		const weatherCardWithOwner = { ...card, owner: 'opponent' };
		
		this.removeCardFromHand(card);
		
		if (window.gameModule) {
			if (this.isClearWeatherCard(card)) {
				window.gameModule.handleClearWeather(weatherCardWithOwner);
			} else {
				window.gameModule.handleRegularWeather(weatherCardWithOwner);
			}
			
			window.gameModule.displayWeatherCards();
			
			setTimeout(() => {
				if (window.gameModule.completeCardPlay) {
					window.gameModule.completeCardPlay();
				}
			}, 100);
		}
	},

    getRowsUnderWeather: function() {
        const rowsUnderWeather = [];
        const rows = ['close', 'ranged', 'siege'];
        
        rows.forEach(row => {
            if (this.gameState.weather.effects[row]) {
                rowsUnderWeather.push(row);
            }
        });
        
        return rowsUnderWeather;
    },

    findBestTacticRow: function() {
        const rows = ['close', 'ranged', 'siege'];
        const availableRows = rows.filter(row => !this.gameState.opponent.rows[row].tactic);
        
        if (availableRows.length === 0) return null;
        
        const scoredRows = availableRows.map(row => ({
            row: row,
            score: this.gameState.opponent.rows[row].strength + 
                   (this.gameState.player.rows[row].strength * 0.3)
        }));
        
        scoredRows.sort((a, b) => b.score - a.score);
        return scoredRows[0].row;
    },

	playTacticCard: function(card) {
		const bestRow = this.findBestTacticRow();
		if (bestRow) {
			this.gameState.opponent.rows[bestRow].tactic = card;
			if (window.audioManager && window.audioManager.playSound) {
				audioManager.playSound('artefact');
			}
			if (window.gameModule && window.gameModule.displayTacticCard) {
				window.gameModule.displayTacticCard(bestRow, card, 'opponent');
				
				setTimeout(() => {
					if (window.gameModule.completeCardPlay) {
						window.gameModule.completeCardPlay();
					}
				}, 1000);
			}
		}
	},
    
	playUnitCard: function(card) {
		const bestRow = this.findBestRowForUnit(card);
		if (bestRow) {
			const rowState = this.gameState.opponent.rows[bestRow];
			let insertIndex = rowState.cards.length;
			
			if (rowState.cards.length > 0) {
				const synergyResult = this.findBestCardForSynergy(card, rowState.cards);
				
				if (synergyResult.score > 0) {
					const placeLeft = Math.random() < 0.5;
					if (placeLeft) {
						insertIndex = synergyResult.index;
					} else {
						insertIndex = synergyResult.index + 1;
					}
				} else {
					const cardStrength = card.strength || 0;
					if (cardStrength >= 8) {
						insertIndex = Math.floor(rowState.cards.length / 2);
					} else if (cardStrength <= 3) {
						const placeAtStart = Math.random() < 0.5;
						insertIndex = placeAtStart ? 0 : rowState.cards.length;
					}
				}
				
				if (card.tags && card.tags.length > 0) {
					const similarCardsIndices = [];
					rowState.cards.forEach((existingCard, index) => {
						if (existingCard.tags) {
							const commonTags = card.tags.filter(tag => 
								existingCard.tags.includes(tag)
							);
							if (commonTags.length > 0) {
								similarCardsIndices.push({ index, commonTagsCount: commonTags.length });
							}
						}
					});
					
					if (similarCardsIndices.length > 0) {
						similarCardsIndices.sort((a, b) => b.commonTagsCount - a.commonTagsCount);
						const bestSimilarIndex = similarCardsIndices[0].index;
						insertIndex = bestSimilarIndex + 1;
					}
				}
				
				if (insertIndex === rowState.cards.length) {
					const strongestCardIndex = this.findStrongestCardIndex(rowState.cards);
					if (strongestCardIndex !== -1) {
						insertIndex = strongestCardIndex + 1;
					}
				}
			}
			
			rowState.cards.splice(insertIndex, 0, card);
			
			this.removeCardFromHand(card);
			
			if (window.audioManager && window.audioManager.playSound) {
				if (card.type === 'artifact' || card.type === 'special' || card.type === 'tactic') {
					audioManager.playSound('artefact');
				} else {
					switch(bestRow) {
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
				}
			}
			
			if (window.gameModule) {
				window.gameModule.displayCardOnRow(bestRow, card, 'opponent', insertIndex);
				if (window.gameModule.updateRowStrength) {
					window.gameModule.updateRowStrength(bestRow, 'opponent');
				}
				
				setTimeout(() => {
					if (window.gameModule.completeCardPlay) {
						window.gameModule.completeCardPlay();
					}
				}, 1000);
			}
		}
	},

	findStrongestCardIndex: function(cards) {
		let strongestIndex = -1;
		let maxStrength = -1;
		
		cards.forEach((card, index) => {
			const strength = card.strength || 0;
			if (strength > maxStrength) {
				maxStrength = strength;
				strongestIndex = index;
			}
		});
		
		return strongestIndex;
	},

	findBestCardForSynergy: function(card, rowCards) {
		let bestIndex = -1;
		let bestScore = -1;
		
		rowCards.forEach((existingCard, index) => {
			let score = 0;
			
			if (card.tags && existingCard.tags) {
				const commonTags = card.tags.filter(tag => 
					existingCard.tags.includes(tag)
				);
				score += commonTags.length * 3;
			}
			
			const cardStrength = card.strength || 0;
			const existingStrength = existingCard.strength || 0;
			const strengthDiff = Math.abs(cardStrength - existingStrength);
			if (strengthDiff <= 3) {
				score += 2;
			}
			
			if (score > bestScore) {
				bestScore = score;
				bestIndex = index;
			}
		});
		
		return { index: bestIndex, score: bestScore };
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
    
    removeCardFromHand: function(card) {
        if (window.gameModule && window.gameModule.removeCardFromHand) {
            window.gameModule.removeCardFromHand(card, 'opponent');
        } else {
            const cardIndex = this.gameState.opponent.hand.findIndex(c => c.id === card.id);
            if (cardIndex !== -1) {
                this.gameState.opponent.hand.splice(cardIndex, 1);
            }
        }
    },
    
    calculateTotalScore: function(player) {
        const rows = this.gameState[player].rows;
        return Object.values(rows).reduce((total, row) => total + row.strength, 0);
    },

    capitalizeFirst: function(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
};

window.aiModule = aiModule;