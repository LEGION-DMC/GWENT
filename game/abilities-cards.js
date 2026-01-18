const skillSystem = {
    abilityTypes: {
        COMBAT: 'combat',
        WEATHER: 'weather', 
        SPECIAL: 'special',
        PASSIVE: 'passive',
        LEADER: 'leader'
    },

    targets: {
        UNIT: 'unit',
        ROW: 'row',
        GLOBAL: 'global',
        HAND: 'hand',
        DECK: 'deck'
    },

    cardStates: {
        ACTIVE: 'active',
        DAMAGED: 'damaged',
        DESTROYED: 'destroyed',
        BOOSTED: 'boosted',
        WEATHERED: 'weathered'
    },

    abilities: {
        'biting_frost': {
            name: 'Белый хлад',
            type: 'weather',
            description: 'Снижает силу всех карт в дальнем и блежнем рядах до 1',
            effect: {
                type: 'weather',
                weatherType: 'frost',
                row: 'close',
                target: 'enemy',
                strengthCap: 1
            }
        },      
		'frost': {
            name: 'Трескучий мороз',
            type: 'weather',
            description: 'Снижает силу всех карт в блежнем ряду до 1',
            effect: {
                type: 'weather',
                weatherType: 'frost',
                row: 'close',
                target: 'enemy',
                strengthCap: 1
            }
        },		
        'impenetrable_fog': {
            name: 'Густой туман',
            type: 'weather',
            description: 'Снижает силу всех карт в дальнем ряду до 1',
            effect: {
                type: 'weather',
                weatherType: 'fog',
                row: 'ranged',
                target: 'enemy',
                strengthCap: 1
            }
        },       
        'torrential_rain': {
            name: 'Проливной дождь',
            type: 'weather',
            description: 'Снижает силу всех карт в осадном ряду до 1',
            effect: {
                type: 'weather',
                weatherType: 'rain',
                row: 'siege',
                target: 'enemy',
                strengthCap: 1
            }
        },       
        'storm': {
            name: 'Шторм',
            type: 'weather',
            description: 'Снижает силу всех карт в дальнем и осадном рядах до 1',
            effect: {
                type: 'weather',
                weatherType: 'storm',
                row: 'ranged',
                target: 'all',
                damage: 1
            }
        },    
        'clear_weather': {
            name: 'Чистое небо',
            type: 'weather',
            description: 'Снимает все погодные эффекты с поля боя',
            effect: {
                type: 'clear_weather'
            }
        },
        'morale_boost': {
            name: 'Боевой дух',
            type: 'combat',
            description: 'Усилить все ваши карты в этом ряду на 1',
            effect: {
                type: 'boost',
                target: 'row',
                value: 1,
                condition: 'ally'
            }
        },
        'destroy': {
			name: 'Казнь',
			type: 'special',
			description: 'Уничтожает самую сильную карту отряда противника',
			effect: {
				type: 'destroy_strongest_enemy',
				target: 'unit',
				condition: 'enemy'
			}
		},
		'destroy_artf': {
			name: 'Коратская жара',
			type: 'special',
			description: 'Уничтожает карту артефакта противника',
			effect: {
				type: 'destroy_artifact',
				target: 'artifact',
				condition: 'enemy'
			}
		},
		'decoy': {
			name: 'Чучело',
			type: 'special',
			description: 'Замещает карту на поле Чучелом, возвращая исходную карту в руку',
			effect: {
				type: 'swap_with_hand',
				target: 'unit',
				condition: 'ally'
			}
		},
		'damage_1': {
			name: 'Нанесение урона 1',
			type: 'special',
			description: 'Наносит 1 ед. урона выбранной карте противника',
			effect: {
				type: 'damage',
				target: 'unit',
				condition: 'enemy',
				value: 1,
				requiresSelection: true
			}
		},
		
		'damage_2': {
			name: 'Нанесение урона 2',
			type: 'special',
			description: 'Наносит 2 ед. урона выбранной карте противника',
			effect: {
				type: 'damage',
				target: 'unit',
				condition: 'enemy',
				value: 2,
				requiresSelection: true
			}
		},
		
		'damage_3': {
			name: 'Нанесение урона 3',
			type: 'special',
			description: 'Наносит 3 ед. урона выбранной карте противника',
			effect: {
				type: 'damage',
				target: 'unit',
				condition: 'enemy',
				value: 3,
				requiresSelection: true
			}
		},
		
		'damage_row_1': {
			name: 'Урон по ряду 1',
			type: 'special',
			description: 'Наносит 1 ед. урона всем картам в выбранном ряду противника',
			effect: {
				type: 'damage_row',
				target: 'row',
				condition: 'enemy',
				value: 1,
				requiresRowSelection: true
			}
		},
		
		'damage_row_2': {
			name: 'Урон по ряду 2',
			type: 'special',
			description: 'Наносит 2 ед. урона всем картам в выбранном ряду противника',
			effect: {
				type: 'damage_row',
				target: 'row',
				condition: 'enemy',
				value: 2,
				requiresRowSelection: true
			}
		},
		
		'damage_row_3': {
			name: 'Урон по ряду 3',
			type: 'special',
			description: 'Наносит 3 ед. урона всем картам в выбранном ряду противника',
			effect: {
				type: 'damage_row',
				target: 'row',
				condition: 'enemy',
				value: 3,
				requiresRowSelection: true
			}
		}
	},

	applyEffect: function(effect, context) {
		try {
			switch (effect.type) {
				case 'boost':
					return this.applyBoostEffect(effect, context);
				case 'damage':
					return this.applyDamageEffect(effect, context);
				case 'conditional_damage':
					return this.applyConditionalDamageEffect(effect, context);
				case 'summon':
					return this.applySummonEffect(effect, context);
				case 'weather':
					return this.applyWeatherEffect(effect, context);
				case 'clear_weather':
					return this.applyClearWeatherEffect(context);
				case 'destroy_strongest_enemy':
					return this.applyDestroyStrongestEnemyEffect(effect, context);
				case 'destroy_artifact':
					return this.applyDestroyArtifactEffect(effect, context);
				case 'reveal':
					return this.applyRevealEffect(effect, context);
				case 'swap_with_hand':
					return this.applySwapEffect(effect, context);
				case 'damage_row': // Добавляем обработку урона по ряду
					return this.applyDamageRowEffect(effect, context);
				default:
					return { success: false, message: 'Неизвестный тип эффекта' };
			}
		} catch (error) {
			return { success: false, message: 'Ошибка применения способности' };
		}
	},

	applyDamageRowEffect: function(effect, context) {
		if (!context.gameState || !context.damageRowState) {
			return { 
				success: false, 
				message: 'Требуется выбор ряда',
				requiresRowSelection: true
			};
		}
		
		if (context.damageRowState && context.damageRowState.awaitingSelection) {
			const selectedRow = context.damageRowState.selectedRow;
			if (selectedRow) {
				return this.executeRowDamage(selectedRow, effect.value, context);
			}
		}
		
		return { 
			success: true, 
			message: 'Выберите ряд противника для нанесения урона',
			requiresRowSelection: true
		};
	},

	executeRowDamage: function(row, damageValue, context) {
		const rowState = context.gameState.opponent.rows[row];
		let damagedCards = 0;
		let destroyedCards = 0;
		
		rowState.cards.forEach(card => {
			if (card.type === 'unit') {
				const originalStrength = card.strength;
				card.strength = Math.max(0, card.strength - damageValue);
				
				if (card.strength === 0) {
					destroyedCards++;
					this.destroyCard(card);
				} else {
					damagedCards++;
					this.updateCardDisplay(card);
				}
				
				this.createVisualEffect(card, 'damage', damageValue);
			}
		});
		
		this.updateRowStrength(row, 'opponent');
		
		return {
			success: true,
			message: `Нанесен урон ${damageValue} по ряду ${row}. Повреждено: ${damagedCards}, уничтожено: ${destroyedCards}`,
			damagedCount: damagedCards,
			destroyedCount: destroyedCards
		};
	},

    activateAbility: function(abilityId, context) {
        const ability = this.abilities[abilityId];
        if (!ability) {
            return { success: false, message: 'Способность не найдена' };
        }

        if (!this.canActivateAbility(ability, context)) {
            return { success: false, message: 'Невозможно активировать способность' };
        }

        const result = this.applyEffect(ability.effect, context);
        
        if (result.success) {
            this.onAbilityActivated(ability, context);
        }
        
        return result;
    },

    canActivateAbility: function(ability, context) {
        if (ability.type === 'leader' && context.leaderUsed) {
            return false;
        }

        const targets = this.findTargets(ability.effect, context);
        return targets.length > 0 || ability.effect.type === 'clear_weather';
    },

    applyEffect: function(effect, context) {
        try {
            switch (effect.type) {
                case 'boost':
                    return this.applyBoostEffect(effect, context);
                case 'damage':
                    return this.applyDamageEffect(effect, context);
                case 'conditional_damage':
                    return this.applyConditionalDamageEffect(effect, context);
                case 'summon':
                    return this.applySummonEffect(effect, context);
                case 'weather':
                    return this.applyWeatherEffect(effect, context);
                case 'clear_weather':
                    return this.applyClearWeatherEffect(context);
                case 'destroy_strongest_enemy':
					return this.applyDestroyStrongestEnemyEffect(effect, context);
				case 'destroy_artifact':
					return this.applyDestroyArtifactEffect(effect, context);
                case 'reveal':
                    return this.applyRevealEffect(effect, context);
                case 'swap_with_hand':
					return this.applySwapEffect(effect, context);
				default:
                    return { success: false, message: 'Неизвестный тип эффекта' };
            }
        } catch (error) {
            return { success: false, message: 'Ошибка применения способности' };
        }
    },

	applyDestroyArtifactEffect: function(effect, context) {
		const enemyArtifacts = this.findEnemyArtifacts(context);
		
		if (enemyArtifacts.length === 0) {
			return { 
				success: false, 
				message: 'У противника нет артефактов для уничтожения',
				requiresSelection: true,
				selectionType: 'artifact_on_board'
			};
		}
		
		if (context.destroyArtifactState && context.destroyArtifactState.awaitingSelection) {
			const selectedArtifact = context.destroyArtifactState.selectedCard;
			if (selectedArtifact && (selectedArtifact.type === 'artifact' || selectedArtifact.type === 'tactic')) {
				return this.executeArtifactDestroy(selectedArtifact, context);
			}
		}
		
		return { 
			success: true, 
			message: 'Выберите артефакт противника для уничтожения',
			requiresSelection: true,
			selectionType: 'artifact_on_board'
		};
	},

	findEnemyArtifacts: function(context) {
		if (!context.gameState || !context.gameState.opponent) return [];
		
		const artifacts = [];
		const rows = ['close', 'ranged', 'siege'];
		
		rows.forEach(row => {
			if (context.gameState.opponent.rows[row].tactic) {
				artifacts.push({
					card: context.gameState.opponent.rows[row].tactic,
					row: row,
					type: 'tactic',
					location: 'tactic_slot'
				});
			}
			
			const rowCards = context.gameState.opponent.rows[row].cards || [];
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

	executeArtifactDestroy: function(artifactData, context) {
		const { card, row, type, location } = artifactData;
		
		this.createDestroyArtifactVisualEffect(card, row, type);
		
		if (type === 'tactic' && location === 'tactic_slot') {
			delete context.gameState.opponent.rows[row].tactic;
			
			if (window.gameModule) {
				const tacticSlot = document.getElementById(`opponent${row.charAt(0).toUpperCase() + row.slice(1)}Tactics`);
				if (tacticSlot) {
					tacticSlot.innerHTML = '';
				}
			}
		} else if (type === 'artifact' && location === 'row') {
			const rowState = context.gameState.opponent.rows[row];
			const cardIndex = rowState.cards.findIndex(c => c.id === card.id);
			if (cardIndex !== -1) {
				rowState.cards.splice(cardIndex, 1);
				
				if (window.gameModule) {
					window.gameModule.removeCardFromBoardVisual(card, row, 'opponent');
					window.gameModule.updateRowStrength(row, 'opponent');
				}
			}
		}
		
		const destroyedCardCopy = { ...card };
		context.gameState.opponent.discard.push(destroyedCardCopy);
		
		return { 
			success: true, 
			message: `Уничтожен артефакт: ${card.name}`,
			destroyedCard: card
		};
	},

	createDestroyArtifactVisualEffect: function(card, row, type) {
		if (!window.gameModule) return;
		
		let targetElement;
		
		if (type === 'tactic') {
			const tacticSlot = document.getElementById(`opponent${row.charAt(0).toUpperCase() + row.slice(1)}Tactics`);
			if (tacticSlot) {
				targetElement = tacticSlot.querySelector(`[data-card-id="${card.id}"]`);
			}
		} else {
			const rowElement = document.getElementById(`opponent${row.charAt(0).toUpperCase() + row.slice(1)}Row`);
			if (rowElement) {
				targetElement = rowElement.querySelector(`[data-card-id="${card.id}"]`);
			}
		}
		
		if (!targetElement) return;
		
		const destroyEffect = document.createElement('div');
		destroyEffect.className = 'destroy-artifact-effect';
		destroyEffect.style.cssText = `
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: url('card/destroy_card.jpg') center/cover no-repeat;
			z-index: 100;
			animation: destroyArtifactAnimation 1s ease-out forwards;
			border-radius: 5px;
		`;
		
		targetElement.appendChild(destroyEffect);
		
		if (window.audioManager && window.audioManager.playSound) {
			audioManager.playSound('artefact_destroy');
		}
		
		setTimeout(() => {
			if (destroyEffect.parentNode) {
				destroyEffect.remove();
			}
		}, 1000);
	},

	applyDestroyStrongestEnemyEffect: function(effect, context) {
		const strongestCards = this.findStrongestEnemyCards(context);
		
		if (strongestCards.length === 0) {
			return { success: false, message: 'Нет подходящих целей у противника' };
		}
		
		const targetCard = strongestCards[0];
		
		this.createDestroyVisualEffect(targetCard);
		
		this.destroyEnemyCard(targetCard, context);
		
		return { 
			success: true, 
			message: `Уничтожена карта ${targetCard.name} (сила: ${targetCard.currentStrength || targetCard.strength})`,
			destroyedCard: targetCard
		};
	},

	findStrongestEnemyCards: function(context) {
		if (!context.gameBoard || !context.gameState) return [];
		
		const enemyCards = [];
		const rows = ['close', 'ranged', 'siege'];
		
		rows.forEach(row => {
			if (context.gameState.opponent && context.gameState.opponent.rows) {
				const rowCards = context.gameState.opponent.rows[row].cards || [];
				rowCards.forEach(card => {
					if (card.type === 'unit') {
						enemyCards.push({
							card: card,
							row: row,
							strength: card.currentStrength || card.strength || 0
						});
					}
				});
			}
		});
		
		if (enemyCards.length === 0) return [];
		
		enemyCards.sort((a, b) => b.strength - a.strength);
		
		const maxStrength = enemyCards[0].strength;
		
		return enemyCards.filter(card => card.strength === maxStrength);
	},

	destroyEnemyCard: function(targetCardData, context) {
		const { card, row } = targetCardData;
		
		if (!context.gameState || !context.gameState.opponent) return;
		
		const rowState = context.gameState.opponent.rows[row];
		if (!rowState) return;
		
		const cardIndex = rowState.cards.findIndex(c => c.id === card.id);
		if (cardIndex !== -1) {
			const destroyedCard = { ...rowState.cards[cardIndex] };
			
			rowState.cards.splice(cardIndex, 1);
			
			context.gameState.opponent.discard.push(destroyedCard);
			
			if (window.gameModule) {
				window.gameModule.removeCardFromBoardVisual(card, row, 'opponent');
				
				window.gameModule.updateRowStrength(row, 'opponent');
				
				if (window.gameModule.displayOpponentDiscard) {
					window.gameModule.displayOpponentDiscard();
				}
			}
		}
	},

	createDestroyVisualEffect: function(targetCardData) {
		if (!window.gameModule) return;
		
		const { card, row } = targetCardData;
		
		const rowElement = document.getElementById(`opponent${row.charAt(0).toUpperCase() + row.slice(1)}Row`);
		if (!rowElement) return;
		
		const cardElement = rowElement.querySelector(`[data-card-id="${card.id}"]`);
		if (!cardElement) return;
		
		const destroyEffect = document.createElement('div');
		destroyEffect.className = 'destroy-effect';
		destroyEffect.style.cssText = `
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: url('card/destroy_card.jpg') center/cover no-repeat;
			z-index: 100;
			animation: destroyAnimation 1s ease-out forwards;
		`;
		
		cardElement.appendChild(destroyEffect);
		
		setTimeout(() => {
			if (destroyEffect.parentNode) {
				destroyEffect.remove();
			}
		}, 1000);
	},

	applySwapEffect: function(effect, context) {
    if (context.decoyState && context.decoyState.awaitingSelection) {
        if (context.decoyState.selectedCard && context.decoyState.selectedCard.type === 'unit') {
            const cardToSwap = context.decoyState.selectedCard;
            
            const decoyCard = context.playerHand.find(card => 
                card.ability === 'decoy' || card.id === 'neutral_special_5'
            );
            
            if (!decoyCard) {
                return { success: false, message: 'Чучело не найдено в руке' };
            }
            
            const decoyIndex = context.playerHand.indexOf(decoyCard);
            if (decoyIndex !== -1) {
                context.playerHand.splice(decoyIndex, 1);
            }
            
            if (window.gameModule && window.gameModule.removeCardFromBoard) {
                window.gameModule.removeCardFromBoard(cardToSwap);
            }
            
            const cardCopy = { ...cardToSwap };
            cardCopy.playedThisRound = false;
            context.playerHand.push(cardCopy);
            
            decoyCard.owner = 'player';
            decoyCard.row = cardToSwap.row;
            decoyCard.positionInRow = cardToSwap.positionInRow;
            
            if (window.gameModule && window.gameModule.placeCardOnBoard) {
                window.gameModule.placeCardOnBoard(decoyCard, decoyCard.row, decoyCard.positionInRow);
            }
            
            if (window.gameModule) {
                window.gameModule.displayPlayerHand();
                window.gameModule.updateRowStrength(cardToSwap.row);
            }
            
            context.decoyState = null;
            
            return { 
                success: true, 
                message: `Карта ${cardToSwap.name} заменена на Чучело`,
                swappedCard: cardToSwap
            };
        }
    }
    
    return { 
        success: true, 
        message: 'Выберите карту на поле для замены на Чучело',
        requiresSelection: true,
        selectionType: 'unit_on_board'
    };
},

    applyBoostEffect: function(effect, context) {
        const targets = this.findTargets(effect, context);
        
        if (targets.length === 0) {
            return { success: false, message: 'Нет подходящих целей' };
        }

        targets.forEach(target => {
            const boostValue = effect.value || 1;
            this.boostCard(target, boostValue);
            this.createVisualEffect(target, 'boost', boostValue);
        });

        return { 
            success: true, 
            message: `Усилено ${targets.length} целей на ${effect.value}`,
            targets: targets.length
        };
    },

    applyDamageEffect: function(effect, context) {
        const targets = this.findTargets(effect, context);
        
        if (targets.length === 0) {
            return { success: false, message: 'Нет подходящих целей' };
        }

        targets.forEach(target => {
            const damageValue = effect.value || 1;
            this.damageCard(target, damageValue);
            this.createVisualEffect(target, 'damage', damageValue);
        });

        return { 
            success: true, 
            message: `Нанесен урон ${targets.length} целям`,
            targets: targets.length
        };
    },

    applyConditionalDamageEffect: function(effect, context) {
        const target = this.findSingleTarget(effect, context);
        
        if (!target) {
            return { success: false, message: 'Нет подходящей цели' };
        }

        this.damageCard(target, effect.baseDamage);
        
        if (this.checkCondition(effect.condition, target)) {
            if (effect.bonusEffect === 'destroy') {
                this.destroyCard(target);
                return { 
                    success: true, 
                    message: 'Урон нанесен и цель уничтожена',
                    destroyed: true
                };
            }
        }

        return { 
            success: true, 
            message: 'Нанесен урон цели',
            conditionMet: false
        };
    },

    applyWeatherEffect: function(effect, context) {
        if (!context.gameBoard) {
            return { success: false, message: 'Игровое поле не доступно' };
        }

        const result = context.gameBoard.setWeather(
            effect.weatherType, 
            effect.row, 
            effect.target,
            effect.strengthCap,
            effect.damage
        );

        return result ? 
            { success: true, message: `Погода применена к ряду ${effect.row}` } :
            { success: false, message: 'Ошибка применения погоды' };
    },

    applyClearWeatherEffect: function(context) {
        if (!context.gameBoard) {
            return { success: false, message: 'Игровое поле не доступно' };
        }

        const result = context.gameBoard.clearWeather();
        return result ? 
            { success: true, message: 'Погода очищена' } :
            { success: false, message: 'Ошибка очистки погоды' };
    },

    applySummonEffect: function(effect, context) {
        const availableCards = this.findSummonableCards(effect, context);
        
        if (availableCards.length === 0) {
            return { success: false, message: 'Нет карт для призыва' };
        }

        const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
        const summonedCard = this.summonCard(randomCard, context);
        
        return summonedCard ? 
            { success: true, message: `Призван ${summonedCard.name}`, card: summonedCard } :
            { success: false, message: 'Ошибка призыва карты' };
    },

    applyDestroyEffect: function(effect, context) {
        const targets = this.findStrongestCards(effect, context);
        
        if (targets.length === 0) {
            return { success: false, message: 'Нет целей для уничтожения' };
        }

        targets.forEach(target => {
            this.destroyCard(target);
        });

        return { 
            success: true, 
            message: `Уничтожено ${targets.length} самых сильных карт`,
            targets: targets.length
        };
    },

    applyRevealEffect: function(effect, context) {
        const revealedCards = this.revealOpponentCards(effect.count, context);
        
        return { 
            success: true, 
            message: `Показано ${revealedCards.length} карт противника`,
            cards: revealedCards
        };
    },

    findTargets: function(effect, context) {
        const { target, condition, row, count } = effect;
        let targets = [];

        if (!context.gameBoard) return targets;

        switch (target) {
            case 'row':
                targets = context.gameBoard.getCardsInRow(row, condition);
                break;
            case 'random':
                targets = context.gameBoard.getRandomCards(condition, count || 1);
                break;
            case 'strongest':
                targets = context.gameBoard.getStrongestCards(condition);
                break;
            case 'unit':
                targets = context.gameBoard.getCardsByCondition(card => 
                    card.type === 'unit' && this.checkCardCondition(card, condition)
                );
                break;
            default:
                targets = context.gameBoard.getAllCards(condition);
        }

        return targets.slice(0, count || targets.length);
    },

    findSingleTarget: function(effect, context) {
        const targets = this.findTargets(effect, context);
        return targets.length > 0 ? targets[0] : null;
    },

    findSummonableCards: function(effect, context) {
        const { filters, faction } = effect;
        return context.playerDeck.filter(card => {
            if (faction && card.faction !== faction) return false;
            if (filters && !filters.some(filter => card.tags?.includes(filter))) return false;
            return card.type === 'unit';
        });
    },

    findStrongestCards: function(effect, context) {
        if (!context.gameBoard) return [];
        
        const allCards = context.gameBoard.getAllCards(effect.condition);
        if (allCards.length === 0) return [];

        const maxStrength = Math.max(...allCards.map(card => card.currentStrength));
        return allCards.filter(card => card.currentStrength === maxStrength);
    },

    checkCondition: function(condition, card) {
        switch (condition) {
            case 'strength_multiple_of_3':
                return card.currentStrength % 3 === 0;
            default:
                return true;
        }
    },

    checkCardCondition: function(card, condition) {
        switch (condition) {
            case 'ally':
                return card.owner === 'player';
            case 'enemy':
                return card.owner === 'opponent';
            case 'all':
                return true;
            default:
                return true;
        }
    },

    boostCard: function(card, value) {
        card.currentStrength += value;
        card.state = this.cardStates.BOOSTED;
        this.updateCardDisplay(card);
    },

    damageCard: function(card, value) {
        card.currentStrength = Math.max(0, card.currentStrength - value);
        card.state = card.currentStrength === 0 ? this.cardStates.DESTROYED : this.cardStates.DAMAGED;
        
        this.updateCardDisplay(card);
        
        if (card.currentStrength === 0) {
            this.onCardDestroyed(card);
        }
    },

    destroyCard: function(card) {
        card.currentStrength = 0;
        card.state = this.cardStates.DESTROYED;
        this.onCardDestroyed(card);
    },

    summonCard: function(cardData, context) {
        const summonedCard = {
            ...cardData,
            id: `${cardData.id}_summoned_${Date.now()}`,
            currentStrength: cardData.strength,
            owner: 'player',
            state: this.cardStates.ACTIVE
        };

        if (context.gameBoard.placeCard(summonedCard, 'any', 'player')) {
            return summonedCard;
        }
        
        return null;
    },

    revealOpponentCards: function(count, context) {
        const opponentHand = context.opponentHand || [];
        const revealedCards = opponentHand.slice(0, count);
        
        revealedCards.forEach(card => {
            card.revealed = true;
        });
        
        return revealedCards;
    },

    createVisualEffect: function(card, effectType, value) {
        if (!window.gameModule) return;
        
        const effect = {
            type: effectType,
            cardId: card.id,
            value: value,
            duration: 1000
        };
        
        window.gameModule.createVisualEffect(effect);
    },

    updateCardDisplay: function(card) {
        const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
        if (cardElement) {
            const strengthElement = cardElement.querySelector('.card__strength');
            if (strengthElement) {
                strengthElement.textContent = card.currentStrength;
                strengthElement.classList.add('strength-update');
                setTimeout(() => {
                    strengthElement.classList.remove('strength-update');
                }, 500);
            }
        }
    },

    onCardDestroyed: function(card) {
        if (window.gameModule) {
            window.gameModule.removeCardFromBoard(card);
        }
    },

    onAbilityActivated: function(ability, context) {
        if (ability.type === 'leader') {
            context.leaderUsed = true;
        }
    },

    initialize: function() {
        this.enhanceCardsWithAbilities();
    },

    enhanceCardsWithAbilities: function() {
        if (!window.cardsModule || !window.cardsModule.cardsData) {
            return;
        }

        const cardsData = window.cardsModule.cardsData;
        
        Object.values(cardsData).forEach(faction => {
            if (faction.units) {
                faction.units.forEach(unit => {
                    if (unit.tags && unit.tags.includes('witcher')) {
                        unit.ability = unit.ability || 'geralt';
                    }
                    if (unit.tags && unit.tags.includes('wild_hunt')) {
                        unit.ability = unit.ability || 'morale_boost';
                    }
                });
            }

            if (faction.specials) {
                faction.specials.forEach(special => {
                    if (special.tags && special.tags.includes('weather')) {
                        switch(special.name) {
                            case 'Белый Хлад':
								special.ability = 'biting_frost';
                                break;
                            case 'Трескучий мороз':
                                special.ability = 'frost';
                                break;
                            case 'Густой туман':
                                special.ability = 'impenetrable_fog';
                                break;
                            case 'Проливной дождь':
                                special.ability = 'torrential_rain';
                                break;
                            case 'Чистое небо':
                                special.ability = 'clear_weather';
                                break;
                            case 'Шторм Скеллиге':
                                special.ability = 'storm';
                                break;
                        }
                    }
                });
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', function() {
    skillSystem.initialize();
});

window.skillSystem = skillSystem;