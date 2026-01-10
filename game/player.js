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
				case 'special':
				case 'artifact':
					this.startUnitCardPlacement(card);
					break;
				default:
					this.cancelCardSelection();
			}
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

		rowState.cards.splice(insertIndex, 0, card);
		
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