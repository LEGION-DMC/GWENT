const factionAbilitiesModule = {
    abilities: {
        'realms': {
            id: 'realms',
            name: 'Королевства Севера',
            effect: 'extra_mulligan',
            description: 'Доступно 3 муллиганы вместо 2',
            isActive: false,
            applyEffect: function(gameState) {
                return true;
            }
        },
        'nilfgaard': {
            id: 'nilfgaard',
            name: 'Нильфгаард',
            effect: 'win_on_tie',
            description: 'Победа при ничьей в раунде',
            isActive: false,
            applyEffect: function(gameState) {
                return true;
            },
            checkWinOnTie: function(gameState, playerScore, opponentScore, playerFaction) {
                if (playerScore === opponentScore) {
                    if (gameState.player.faction === 'nilfgaard') {
                        return 'player';
                    } else if (gameState.opponent.faction === 'nilfgaard') {
                        return 'opponent';
                    }
                }
                return null;
            }
        },
		'scoiatael': {
			id: 'scoiatael',
			name: 'Скоя\'таэли',
			effect: 'choose_first_turn',
			description: 'Право выбора первого хода',
			isActive: false,
			applyEffect: function(gameState) {
				return true;
			},
			chooseFirstTurn: function(gameState) {
				return this.showTurnChoiceModal(gameState);
			},
			showTurnChoiceModal: function(gameState) {
				return new Promise((resolve) => {
					const modalOverlay = document.createElement('div');
					modalOverlay.className = 'turn-choice-overlay';
					modalOverlay.style.cssText = `
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

					const isPlayerScoiatael = gameState.player.faction === 'scoiatael';
					
					modalOverlay.innerHTML = `
						<div class="turn-choice-modal">
							<div class="turn-choice-modal__title">
								${isPlayerScoiatael ? 'ВЫБЕРИТЕ КТО ХОДИТ ПЕРВЫМ' : 'ПРОТИВНИК ВЫБИРАЕТ КТО ХОДИТ ПЕРВЫМ'}
							</div>
							
							${isPlayerScoiatael ? `
								<div class="turn-choice-modal__buttons">
									<button class="choice-btn player-choice">
										<div class="choice-btn__label">ИГРОК</div>
										<div class="choice-btn__value">ХОДИТ ПЕРВЫМ</div>
									</button>
									
									<button class="choice-btn opponent-choice">
										<div class="choice-btn__label">ПРОТИВНИК</div>
										<div class="choice-btn__value">ХОДИТ ПЕРВЫМ</div>
									</button>
								</div>
							` : ''}
							
							<div class="turn-choice-modal__description">
								Способность фракции Скоя\'таэли
							</div>
						</div>
					`;

					document.body.appendChild(modalOverlay);
					audioManager.playSound('button');

					if (isPlayerScoiatael) {
						const playerChoiceBtn = modalOverlay.querySelector('.player-choice');
						const opponentChoiceBtn = modalOverlay.querySelector('.opponent-choice');

						playerChoiceBtn.addEventListener('click', () => {
							audioManager.playSound('choice');
							this.animateChoiceSelection(playerChoiceBtn, true);
							setTimeout(() => {
								document.body.removeChild(modalOverlay);
								resolve('player');
							}, 100);
						});

						opponentChoiceBtn.addEventListener('click', () => {
							audioManager.playSound('choice');
							this.animateChoiceSelection(opponentChoiceBtn, false);
							setTimeout(() => {
								document.body.removeChild(modalOverlay);
								resolve('opponent');
							}, 100);
						});
					} else {
						setTimeout(() => {
							const aiChoice = this.makeAIChoice(gameState);
							audioManager.playSound('choice');
							
							modalOverlay.innerHTML = `
								<div style="text-align: center;">
									<div style="color: #d4af37; font-size: 30px; margin-bottom: 15px;">
										ПРОТИВНИК ВЫБРАЛ
									</div>
									
									<div style="
										color: white;
										font-size: 25px;
										animation: choiceReveal 0.5s ease-out;
										-webkit-text-stroke: 0.2px black;
									">
										${aiChoice === 'opponent' ? 'ХОЖУ ПЕРВЫМ' : 'ХОДИТЕ ПЕРВЫМ'}
									</div>
								</div>
							`;
							
							setTimeout(() => {
								document.body.removeChild(modalOverlay);
								resolve(aiChoice);
							}, 2500);
						}, 5000);
					}
				});
			},
			makeAIChoice: function(gameState) {
				const randomValue = Math.random();
				return randomValue < 0.6 ? 'opponent' : 'player';
			},
			animateChoiceSelection: function(button, isPlayer) {
				button.style.animation = 'choiceSelected 0.5s ease-out';
			}
		},
        'monsters': {
            id: 'monsters',
            name: 'Чудовища',
            effect: 'keep_random_card',
            description: 'Случайная карта остается на поле',
            isActive: false,
            applyEffect: function(gameState) {
                return true;
            },
            keepRandomCard: function(gameState, player) {
				const rows = ['close', 'ranged', 'siege'];
				let allCards = [];
				
				rows.forEach(row => {
					const rowCards = gameState[player].rows[row].cards;
					// Берем копию карт, чтобы не модифицировать оригиналы
					rowCards.forEach(card => {
						allCards.push({
							card: JSON.parse(JSON.stringify(card)), // Глубокая копия
							row: row,
							type: 'unit'
						});
					});
					
					if (gameState[player].rows[row].tactic) {
						allCards.push({ 
							card: JSON.parse(JSON.stringify(gameState[player].rows[row].tactic)), // Глубокая копия
							row: row, 
							type: 'tactic' 
						});
					}
				});
				
				if (allCards.length === 0) return null;
				
				const randomIndex = Math.floor(Math.random() * allCards.length);
				const selected = allCards[randomIndex];
				
				return selected;
			}
		},
        'skellige': {
			id: 'skellige',
			name: 'Скеллиге',
			effect: 'resurrect_from_graveyard',
			description: 'Возвращение карт из сброса в 3 раунде',
			isActive: false,
			applyEffect: function(gameState) {
				return true;
			},
			resurrectCards: function(gameState, player) {
				if (gameState.currentRound !== 3) {
					return [];
				}
				const discard = gameState[player].discard;
				if (discard.length === 0) {
					return [];
				}
				const handSize = gameState[player].hand.length;
				const maxHandSize = 10;
				const availableSpace = maxHandSize - handSize;
				
				if (availableSpace <= 0) {
					return [];
				}
				const cardsToResurrect = [];
				const shuffled = [...discard].sort(() => Math.random() - 0.5);
				const maxCardsToTry = Math.min(2, shuffled.length, availableSpace);
				for (let i = 0; i < maxCardsToTry; i++) {
					const card = shuffled[i];
					const originalIndex = discard.findIndex(c => c.id === card.id);
					if (originalIndex !== -1) {
						const removedCard = discard.splice(originalIndex, 1)[0];
						cardsToResurrect.push(removedCard);
					}
				}
				return cardsToResurrect;
			}
		},
		'syndicate': {
            id: 'syndicate',
            name: 'Синдикат',
            effect: 'cancel_opponent_mulligan',
            description: 'Отмене фазы Муллигана противника',
            isActive: false,
            applyEffect: function(gameState) {
                return true;
            },
            cancelOpponentMulligan: function(gameState, affectedPlayer) {
                if (affectedPlayer === 'player') {
                    gameState.mulligan.player.available = 0;
                    gameState.mulligan.player.used = 0;
                } else if (affectedPlayer === 'opponent') {
                    gameState.mulligan.opponent.available = 0;
                    gameState.mulligan.opponent.used = 0;
                }
                
                gameState.mulligan.canceledFor = affectedPlayer;
                
                return true;
            }
        },
    },

    init: function(gameState) {
		const playerFaction = gameState.player.faction;
		const opponentFaction = gameState.opponent.faction;
		
		if (playerFaction && this.abilities[playerFaction]) {
			this.abilities[playerFaction].isActive = true;
			if (playerFaction === 'realms') {
				gameState.mulligan.player.available = 3;
			}
			this.abilities[playerFaction].applyEffect(gameState);
		}
		
		if (opponentFaction && this.abilities[opponentFaction]) {
			this.abilities[opponentFaction].isActive = true;
			if (opponentFaction === 'realms') {
				gameState.mulligan.opponent.available = 3;
			}
			this.abilities[opponentFaction].applyEffect(gameState);
		}
		
		if (playerFaction === 'syndicate') {
			this.abilities['syndicate'].cancelOpponentMulligan(gameState, 'opponent');
		}
		if (opponentFaction === 'syndicate') {
			this.abilities['syndicate'].cancelOpponentMulligan(gameState, 'player');
		}
	},

    checkRoundWinner: function(gameState, playerScore, opponentScore) {
        if (playerScore > opponentScore) return 'player';
        if (opponentScore > playerScore) return 'opponent';
        
        const nilfgaardAbility = this.abilities['nilfgaard'];
        if (nilfgaardAbility && nilfgaardAbility.isActive) {
            const tieWinner = nilfgaardAbility.checkWinOnTie(gameState, playerScore, opponentScore, gameState.player.faction);
            if (tieWinner) {
                return tieWinner;
            }
        }
        
        return null;
    },

    async determineFirstTurn(gameState) {
        const playerIsScoiatael = gameState.player.faction === 'scoiatael';
        const opponentIsScoiatael = gameState.opponent.faction === 'scoiatael';
        
        if (playerIsScoiatael || opponentIsScoiatael) {
            const scoiataelAbility = this.abilities['scoiatael'];
            
            if (scoiataelAbility && scoiataelAbility.isActive) {
                const firstTurn = await scoiataelAbility.chooseFirstTurn(gameState);
                return firstTurn;
            }
        }
        
        return Math.random() < 0.5 ? 'player' : 'opponent';
    },

    handleRoundEndForMonsters: function(gameState) {
		const players = ['player', 'opponent'];
		const cardsToReturn = [];
		players.forEach(player => {
			const faction = gameState[player].faction;
			if (faction === 'monsters') {
				const monstersAbility = this.abilities['monsters'];
				if (monstersAbility && monstersAbility.isActive) {
					const keptCard = monstersAbility.keepRandomCard(gameState, player);
					if (keptCard) {
						cardsToReturn.push({
							player: player,
							card: keptCard.card,
							row: keptCard.row,
							type: keptCard.type
						});
					}
				}
			}
		});
		cardsToReturn.forEach(item => {
			const rowIndex = gameState[item.player].rows[item.row].cards.findIndex(
				c => c.id === item.card.id
			);
			if (rowIndex !== -1) {
				gameState[item.player].rows[item.row].cards.splice(rowIndex, 1);
			} else if (item.type === 'tactic') {
				gameState[item.player].rows[item.row].tactic = null;
			}
		});
		players.forEach(player => {
			const rows = ['close', 'ranged', 'siege'];
			rows.forEach(row => {
				gameState[player].rows[row].cards = gameState[player].rows[row].cards.filter(card => {
					const isReturningCard = cardsToReturn.some(item => 
						item.player === player && item.card.id === card.id
					);
					return !isReturningCard;
				});
				if (gameState[player].rows[row].tactic) {
					const isReturningTactic = cardsToReturn.some(item => 
						item.player === player && 
						item.type === 'tactic' && 
						item.row === row
					);
					if (!isReturningTactic) {
						gameState[player].discard.push(gameState[player].rows[row].tactic);
						gameState[player].rows[row].tactic = null;
					}
				}
				gameState[player].rows[row].cards.forEach(card => {
					gameState[player].discard.push(card);
				});
				gameState[player].rows[row].cards = [];
				gameState[player].rows[row].strength = 0;
			});
			if (window.gameModule && window.gameModule.updateDiscardDisplay) {
				window.gameModule.updateDiscardDisplay(player);
			}
		});
		cardsToReturn.forEach(item => {
			const cardToReturn = { ...item.card };
			if (cardToReturn.originalStrength !== undefined) {
				cardToReturn.strength = cardToReturn.originalStrength;
				delete cardToReturn.originalStrength;
			}
			gameState[item.player].hand.push(cardToReturn);
			if (item.player === 'player' && window.gameModule) {
				window.gameModule.displayPlayerHand();
			}
		});
	},

    handleRound3ForSkellige: function(gameState) {
		if (gameState.currentRound !== 3) return;
		const players = ['player', 'opponent'];
		players.forEach(player => {
			const faction = gameState[player].faction;
			if (faction === 'skellige') {
				const skelligeAbility = this.abilities['skellige'];
				if (skelligeAbility && skelligeAbility.isActive) {
					const resurrectedCards = skelligeAbility.resurrectCards(gameState, player);
					if (resurrectedCards.length > 0) {
						const handSize = gameState[player].hand.length;
						const maxHandSize = 10;
						const availableSpace = maxHandSize - handSize;
						
						if (availableSpace > 0) {
							const cardsToAdd = resurrectedCards.slice(0, availableSpace);
							gameState[player].hand.push(...cardsToAdd);
							const remainingCards = resurrectedCards.slice(availableSpace);
							if (remainingCards.length > 0) {
								gameState[player].deck.push(...remainingCards);
								if (player === 'player') {
									this.showGameMessage(`Часть карт возвращена в колоду (макс. карт в руке: 10)`, 'info');
								}
							}
							if (player === 'player' && window.gameModule) {
								window.gameModule.displayPlayerHand();
							}
						}
						if (window.gameModule && window.gameModule.updateDiscardDisplay) {
							window.gameModule.updateDiscardDisplay(player);
						}
						if (window.gameModule && window.gameModule.displayPlayerDeck && player === 'player') {
							window.gameModule.displayPlayerDeck();
						}
						if (window.gameModule && window.gameModule.displayOpponentDeck && player === 'opponent') {
							window.gameModule.displayOpponentDeck();
						}
					}
				}
			}
		});
	},

    getFactionAbility: function(factionId) {
        return this.abilities[factionId] || null;
    },

    displayAbilityInfo: function(player) {
        const faction = window.gameModule.gameState[player].faction;
        const ability = this.getFactionAbility(faction);
        
        if (!ability) return null;
        
        const abilityElement = document.createElement('div');
        abilityElement.className = 'faction-ability-info';
        abilityElement.innerHTML = `
            <div style="
                background: rgba(0,0,0,0.7);
                border: 2px solid #d4af37;
                border-radius: 5px;
                padding: 10px;
                color: #d4af37;
                font-size: 12px;
                max-width: 200px;
            ">
                <div style="font-weight: bold; margin-bottom: 5px;">${ability.name}</div>
                <div style="font-size: 11px; color: #ccc;">${ability.description}</div>
            </div>
        `;
        
        return abilityElement;
    }
};

window.factionAbilitiesModule = factionAbilitiesModule;