const factionAbilitiesModule = {
    abilities: {
        'realms': {
            id: 'realms',
            name: 'Королевства Севера',
            effect: 'extra_mulligan',
            description: 'Доступно 3 муллиганы вместо 2',
            isActive: false,
            applyEffect: function(gameState) {
                gameState.mulligan.player.available = 3;
                gameState.mulligan.opponent.available = 3;
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
						<div style="text-align: center;">
							<div style="
								color: #d4af37;
								font-size: 25px;
								margin-bottom: 15px;
								text-transform: uppercase;
								letter-spacing: 2px;
							">${isPlayerScoiatael ? 'ВЫБЕРИТЕ КТО ХОДИТ ПЕРВЫМ' : 'ПРОТИВНИК ВЫБИРАЕТ КТО ХОДИТ ПЕРВЫМ'}</div>
							
							${isPlayerScoiatael ? `
								<div style="display: flex; gap: 13px; margin: 20px 0;">
									<button class="choice-btn player-choice" style="
										background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
										color: #4CAF50;
										border: 1px solid #d4af37;
										padding: 8px 10px;
										font-size: 16px;
										font-family: 'Gwent', sans-serif;
										cursor: url('ui/cursor_hover.png'), pointer;
										border-radius: 5px;
										flex: 1;
										transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
										transform-origin: center;
									">
										<div style="font-size: 15px; color: #999; margin-bottom: 5px;">ИГРОК</div>
										<div style="font-size: 18px; -webkit-text-stroke: 0.2px black;">ХОДИТ ПЕРВЫМ</div>
									</button>
									
									<button class="choice-btn opponent-choice" style="
										background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
										color: #f44336;
										border: 1px solid #d4af37;
										padding: 8px 10px;
										font-size: 16px;
										font-family: 'Gwent', sans-serif;
										cursor: url('ui/cursor_hover.png'), pointer;
										border-radius: 5px;
										flex: 1;
										transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
										transform-origin: center;
									">
										<div style="font-size: 15px; color: #999; margin-bottom: 5px;">ПРОТИВНИК</div>
										<div style="font-size: 18px; -webkit-text-stroke: 0.2px black;">ХОДИТ ПЕРВЫМ</div>
									</button>
								</div>
							` : ''}
							
							<div style="
								color: #999;
								font-size: 14px;
								margin-top: 15px;
								font-style: italic;
							">
								Способность фракции: Право выбора первого хода
							</div>
						</div>
					`;

					document.body.appendChild(modalOverlay);
					audioManager.playSound('button');

					if (isPlayerScoiatael) {
						const playerChoiceBtn = modalOverlay.querySelector('.player-choice');
						const opponentChoiceBtn = modalOverlay.querySelector('.opponent-choice');

						const setupButtonHover = (button, color) => {
							button.addEventListener('mouseenter', () => {
								audioManager.playSound('touch');
								button.style.transform = 'scale(1.05)';
								button.style.boxShadow = `0 0 15px ${color}80`;
								button.style.borderColor = color;
							});
							
							button.addEventListener('mouseleave', () => {
								button.style.transform = 'scale(1)';
								button.style.boxShadow = 'none';
								button.style.borderColor = '#d4af37';
							});
						};

						setupButtonHover(playerChoiceBtn, '#4CAF50');
						setupButtonHover(opponentChoiceBtn, '#f44336');

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
				button.style.transform = 'scale(1.05)';
				button.style.boxShadow = `0 0 20px ${isPlayer ? '#4CAF50' : '#f44336'}`;
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
				
				const cardsToResurrect = [];
				const shuffled = [...discard].sort(() => Math.random() - 0.5);
				
				const maxCards = Math.min(2, shuffled.length);
				
				for (let i = 0; i < maxCards; i++) {
					const card = shuffled[i];
					const originalIndex = discard.findIndex(c => c.id === card.id);
					if (originalIndex !== -1) {
						const removedCard = discard.splice(originalIndex, 1)[0];
						cardsToResurrect.push(removedCard);
					}
				}
				
				return cardsToResurrect;
			}
		}
    },

    init: function(gameState) {
        const playerFaction = gameState.player.faction;
        if (playerFaction && this.abilities[playerFaction]) {
            this.abilities[playerFaction].isActive = true;
            this.abilities[playerFaction].applyEffect(gameState);
        }
        
        const opponentFaction = gameState.opponent.faction;
        if (opponentFaction && this.abilities[opponentFaction]) {
            this.abilities[opponentFaction].isActive = true;
            this.abilities[opponentFaction].applyEffect(gameState);
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
                        gameState[player].hand.push(...resurrectedCards);
                        
                        if (player === 'player' && window.gameModule) {
                            window.gameModule.displayPlayerHand();
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