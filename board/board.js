const boardModule = {
    gameState: null,
    boardElement: null,

    initGameBoard: function() {
        this.hideDeckBuilding();
        this.createBoardHTML();
        this.setupBoardEventListeners();
        this.animateBoardEntrance();
    
        setTimeout(() => {
            if (window.gameModule && window.gameModule.init) {
                window.gameModule.init();
            }
            // Инициализируем иконку способности после загрузки игры
            setTimeout(() => {
                this.initAbilityIcon();
            }, 500);
        }, 100);
    },

    initAbilityIcon: function() {
        const gameState = window.gameModule?.gameState;
        if (!gameState || !gameState.player) {
            setTimeout(() => this.initAbilityIcon(), 1000);
            return;
        }
        
        const abilityIcon = document.getElementById('playerAbilityIcon');
        const abilityIconImg = document.getElementById('playerAbilityIconImg');
        const tooltipTitle = document.getElementById('playerAbilityTooltipTitle');
        const tooltipDesc = document.getElementById('playerAbilityTooltipDesc');
        
        if (!abilityIcon) return;
        
        const factionId = gameState.player.faction;
        const abilityId = gameState.player.ability;
        
        // Получаем данные способности
        let abilityData = this.getAbilityData(factionId, abilityId);
        
        // Обновляем иконку и подсказки
        if (abilityData && abilityIconImg) {
            if (abilityData.icon) {
                abilityIconImg.src = abilityData.icon;
            } else {
                abilityIconImg.src = 'deck/ability.png';
            }
            if (tooltipTitle) tooltipTitle.textContent = abilityData.name || 'Способность лидера';
            if (tooltipDesc) tooltipDesc.textContent = abilityData.description || 'Активируйте способность лидера';
        }
        
        // Сохраняем данные
        abilityIcon.dataset.abilityId = abilityId;
        abilityIcon.dataset.factionId = factionId;
        
        // Настраиваем активацию
        this.setupAbilityActivation(abilityIcon);
        
        // Обновляем доступность
        this.updateAbilityAvailability(gameState);
    },

    getAbilityData: function(factionId, abilityId) {
        if (!factionId || !abilityId) return null;
        
        if (window.factionAbilities && window.factionAbilities[factionId]) {
            const abilities = window.factionAbilities[factionId];
            const found = abilities.find(a => a.id === abilityId);
            if (found) {
                return found;
            }
        }
        
        if (window.leaderAbilities && window.leaderAbilities[abilityId]) {
            const ability = window.leaderAbilities[abilityId];
            const iconName = this.getAbilityIconName(abilityId, factionId);
            return {
                id: abilityId,
                name: ability.name,
                description: ability.description,
                icon: iconName
            };
        }
        
        const iconName = this.getAbilityIconName(abilityId, factionId);
        return {
            id: abilityId,
            name: this.getAbilityName(abilityId),
            description: this.getAbilityDescription(abilityId),
            icon: iconName
        };
    },

    getAbilityIconName: function(abilityId, factionId) {
        if (!abilityId) return 'deck/ability.png';
        
        const iconMap = {
            'scoiatael_ability_1': 'forge.png',
            'scoiatael_ability_2': 'ambush.png',
            'scoiatael_ability_3': 'accuracy.png',
            'scoiatael_ability_4': 'gift.png',
            'scoiatael_ability_5': 'tactic.png',
            'realms_ability_1': 'king.png',
            'realms_ability_2': 'militia.png',
            'realms_ability_3': 'shield.png',
            'realms_ability_4': 'incitement.png',
            'realms_ability_5': 'mobilization.png',
            'nilfgaard_ability_1': 'construction.png',
            'nilfgaard_ability_2': 'block.png',
            'nilfgaard_ability_3': 'capture.png',
            'nilfgaard_ability_4': 'tusent.png',
            'nilfgaard_ability_5': 'twoface.png',
            'monsters_ability_1': 'cold.png',
            'monsters_ability_2': 'hangry.png',
            'monsters_ability_3': 'blood.png',
            'monsters_ability_4': 'forest.png',
            'monsters_ability_5': 'sheild.png',
            'skellige_ability_1': 'rage.png',
            'skellige_ability_2': 'more.png',
            'skellige_ability_3': 'onslaught.png',
            'skellige_ability_4': 'bear.png',
            'skellige_ability_5': 'respect.png',
            'syndicate_ability_1': 'order.png',
            'syndicate_ability_2': 'carnage.png',
            'syndicate_ability_3': 'pirates.png',
            'syndicate_ability_4': 'brother.png',
            'syndicate_ability_5': 'money.png'
        };
        
        const iconFile = iconMap[abilityId];
        if (iconFile && factionId) {
            return `faction/${factionId}/abilities/${iconFile}`;
        }
        
        return 'deck/ability.png';
    },

    getAbilityName: function(abilityId) {
        const nameMap = {
            'scoiatael_ability_1': 'Махакамская кузня',
            'scoiatael_ability_2': 'Засада ловчих',
            'scoiatael_ability_3': 'Точный удар',
            'scoiatael_ability_4': 'Дар природы',
            'scoiatael_ability_5': 'Партизанская тактика',
            'realms_ability_1': 'Королевское вдохновение',
            'realms_ability_2': 'Ополчение',
            'realms_ability_3': 'Стена щитов',
            'realms_ability_4': 'Побуждение к действию',
            'realms_ability_5': 'Мобилизация',
            'nilfgaard_ability_1': 'Имперское построение',
            'nilfgaard_ability_2': 'Заточение',
            'nilfgaard_ability_3': 'Порабощение',
            'nilfgaard_ability_4': 'Туссентское гостеприимство',
            'nilfgaard_ability_5': 'Двойная игра',
            'monsters_ability_1': 'Белый Хлад',
            'monsters_ability_2': 'Неутолимый голод',
            'monsters_ability_3': 'Запах крови',
            'monsters_ability_4': 'Сила природы',
            'monsters_ability_5': 'Панцирь',
            'skellige_ability_1': 'Безрассудная ярость',
            'skellige_ability_2': 'Гнев моря',
            'skellige_ability_3': 'Натиск',
            'skellige_ability_4': 'Медвежий ритуал',
            'skellige_ability_5': 'Пламя славы',
            'syndicate_ability_1': 'Заказ на убийство',
            'syndicate_ability_2': 'Резня',
            'syndicate_ability_3': 'Пиратская бухта',
            'syndicate_ability_4': 'Священное братство',
            'syndicate_ability_5': 'Кровавые деньги'
        };
        return nameMap[abilityId] || 'Способность лидера';
    },

    getAbilityDescription: function(abilityId) {
        const descMap = {
            'scoiatael_ability_1': 'Усильте всех Краснолюдов на поле 3 единицы',
            'scoiatael_ability_2': 'Призывите из колоды в руку карту Эльфа',
            'scoiatael_ability_3': 'Нанесите 5 единиц урона отряду противника',
            'scoiatael_ability_4': 'Усильте 3 отряда на поле на 2 единицы',
            'scoiatael_ability_5': 'Нанесите 3 единицы урона всем картам в ряду противника',
            'realms_ability_1': 'Усильте дружественный отряд на 5 единиц',
            'realms_ability_2': 'Нанесите 3 единицы урона 2-м отрядам противника',
            'realms_ability_3': 'Усильте дружественный отряд на 2 единицы и призвать в руку артефакт',
            'realms_ability_4': 'Усильте дружественный отряд на поле на 3 единицы',
            'realms_ability_5': 'Призовите бронзовый отряд на поле и усильте его и смежные с ним отряды на 3 единицы',
            'nilfgaard_ability_1': 'Усильте 2 дружественных отряда на 1 единицу и поменяйте их местами (только в пределах одного ряда)',
            'nilfgaard_ability_2': 'Нанесите вражескому отряду 3 единицы урона',
            'nilfgaard_ability_3': 'Уничтожьте вражеский отряд с силой 5 или меньше',
            'nilfgaard_ability_4': 'Усильте случайный дружественный отряд на 5 единиц',
            'nilfgaard_ability_5': 'Вслепую сыграйте карту из руки противника',
            'monsters_ability_1': 'Создайте эффект мороза только в ряду противника',
            'monsters_ability_2': 'Уничтожьте дружественный отряд, затем призовите Волколака, усиленного на значение силы уничтоженого отряда, из колоды на поле в этом же ряду',
            'monsters_ability_3': 'Нанесите 2 ед. урона по вражескому ряду с наибольшим количеством карт',
            'monsters_ability_4': 'Призовите могущественного "Духа Леса"',
            'monsters_ability_5': 'Усильте дружественный отряд на 3 ед. Если это не нейтральный отряд',
            'skellige_ability_1': 'Случайным образом распределите 4 ед. урона между всеми вражескими отрядами',
            'skellige_ability_2': 'Создайте эффект дождя только в ряду противника',
            'skellige_ability_3': 'Нанесите 3 ед. урона вражескому отряду',
            'skellige_ability_4': 'Нанесите 1 ед. урона дружественному отряду. И призовите Берсерка',
            'skellige_ability_5': 'Переместите не нейтральный отряд из вашей колоды в ваш сброс, затем нанесите вражескому отряду урон, равный значению силы перемещенного отряда',
            'syndicate_ability_1': 'Нанесите 6 ед. урона вражескому отряду',
            'syndicate_ability_2': 'Нанесите от 1 до 3 ед. урона всем картам в ряду противника',
            'syndicate_ability_3': 'Призовите из колоды в руку 2 карты с тегом "Пират"',
            'syndicate_ability_4': 'Усильте 2 случайных дружественных отряда на 2 ед.',
            'syndicate_ability_5': 'Уничтожьте вражеский отряд с силой 4 или меньше'
        };
        return descMap[abilityId] || 'Активируйте способность лидера';
    },

    setupAbilityActivation: function(abilityIcon) {
        // Удаляем старые обработчики
        const newIcon = abilityIcon.cloneNode(true);
        abilityIcon.parentNode.replaceChild(newIcon, abilityIcon);
        
        // Добавляем обработчик клика с проверкой
        newIcon.addEventListener('click', (event) => {
            event.stopPropagation();
            
            const gameState = window.gameModule?.gameState;
            
            // Проверяем, можно ли использовать способность
            if (this.canUseAbility(gameState)) {
                this.handleAbilityClick();
            } else {
                // Показываем сообщение о причине недоступности
                if (gameState) {
                    if (gameState.player.abilityUsedThisRound) {
                        window.gameModule?.showGameMessage('Способность уже использована в этом раунде', 'warning');
                    } else if (gameState.player.passed) {
                        window.gameModule?.showGameMessage('Нельзя использовать способность после паса', 'warning');
                    } else if (gameState.gamePhase !== 'playerTurn' || gameState.currentPlayer !== 'player') {
                        window.gameModule?.showGameMessage('Способность можно использовать только в свой ход', 'warning');
                    } else {
                        window.gameModule?.showGameMessage('Способность недоступна', 'warning');
                    }
                }
            }
        });
        
        newIcon.addEventListener('mouseenter', () => {
            if (audioManager && audioManager.playSound) {
                audioManager.playSound('touch');
            }
        });
    },

    canUseAbility: function(gameState) {
        if (!gameState) return false;
        
        // 1. Способность не должна быть использована в этом раунде
        if (gameState.player.abilityUsedThisRound) return false;
        
        // 2. Игрок не должен быть в пасе
        if (gameState.player.passed) return false;
        
        // 3. Должен быть ход игрока
        if (gameState.gamePhase !== 'playerTurn' || gameState.currentPlayer !== 'player') return false;
        
        return true;
    },

    handleAbilityClick: function() {
        // Используем метод из game.js
        if (window.gameModule?.useLeaderAbility) {
            window.gameModule.useLeaderAbility();
        }
    },

    markAbilityAsUsed: function() {
        const abilityIcon = document.getElementById('playerAbilityIcon');
        if (abilityIcon) {
            abilityIcon.classList.remove('ability-available');
            abilityIcon.classList.add('ability-used');
            abilityIcon.style.cursor = 'not-allowed';
            abilityIcon.style.opacity = '0.4';
        }
    },

    updateAbilityAvailability: function(gameState) {
        const abilityIcon = document.getElementById('playerAbilityIcon');
        if (!abilityIcon) return;
        
        // Если gameState не передан, получаем из gameModule
        if (!gameState) {
            gameState = window.gameModule?.gameState;
        }
        
        const canUse = this.canUseAbility(gameState);
        
        // Сбрасываем классы
        abilityIcon.classList.remove('ability-available', 'ability-used');
        
        if (canUse) {
            abilityIcon.classList.add('ability-available');
            abilityIcon.style.cursor = 'pointer';
            abilityIcon.style.opacity = '1';
        } else {
            abilityIcon.classList.add('ability-used');
            abilityIcon.style.cursor = 'not-allowed';
            abilityIcon.style.opacity = '0.4';
        }
    },

    generateBoardHTML: function() {
        return `
            <div class="board-background"></div>
            
            <div class="opponent-leader-area leader-area">
                <div class="leader-slot" id="opponentLeader"></div>
            </div>

            <div class="player-leader-area leader-area">
                <div class="leader-slot" id="playerLeader">
                    <!-- Иконка способности -->
                    <div class="leader-ability-wrapper" id="playerAbilityWrapper">
                        <div class="leader-ability-icon ability-used" id="playerAbilityIcon">
                            <img src="deck/ability.png" alt="Способность лидера" id="playerAbilityIconImg">
                            <div class="leader-ability-tooltip" id="playerAbilityTooltip">
                                <div class="tooltip-title" id="playerAbilityTooltipTitle">Способность лидера</div>
                                <div class="tooltip-description" id="playerAbilityTooltipDesc">Активируйте способность лидера</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="weather-area">
                <div class="weather-slot" id="weatherSlot"></div>
            </div>

            <div class="opponent-decks-area decks-area">
                <div class="deck-slot discard-pile" id="opponentDiscard">
                    <span>Сброс</span>
                </div>
                <div class="deck-slot deck-pile" id="opponentDeck">
                    <span>Колода</span>
                </div>
            </div>

            <div class="player-decks-area decks-area">
                <div class="deck-slot discard-pile" id="playerDiscard">
                    <span>Сброс</span>
                </div>
                <div class="deck-slot deck-pile" id="playerDeck">
                    <span>Колода</span>
                </div>
            </div>

            <div class="round-counter-area">
                <div class="round-display">
                    <img src="board/round1.png" alt="Раунд 1" class="round-image" id="roundImage">
                </div>
            </div>

            <div class="player-hand-area">
                <div class="hand-cards" id="playerHand"></div>
            </div>

            <div class="player-rows-area battle-rows">
                <div class="battle-row close-row" data-row="close">
                    <div class="row-strength player-strength" id="playerCloseStrength">0</div>
                    <div class="tactics-slot player-tactics" id="playerCloseTactics"></div>
                    <div class="cards-row" id="playerCloseRow"></div>
                </div>
                
                <div class="battle-row ranged-row" data-row="ranged">
                    <div class="row-strength player-strength" id="playerRangedStrength">0</div>
                    <div class="tactics-slot player-tactics" id="playerRangedTactics"></div>
                    <div class="cards-row" id="playerRangedRow"></div>
                </div>
                
                <div class="battle-row siege-row" data-row="siege">
                    <div class="row-strength player-strength" id="playerSiegeStrength">0</div>
                    <div class="tactics-slot player-tactics" id="playerSiegeTactics"></div>
                    <div class="cards-row" id="playerSiegeRow"></div>
                </div>
            </div>

            <div class="opponent-rows-area battle-rows">
                <div class="battle-row siege-row" data-row="siege">
                    <div class="row-strength opponent-strength" id="opponentSiegeStrength">0</div>
                    <div class="tactics-slot opponent-tactics" id="opponentSiegeTactics"></div>
                    <div class="cards-row" id="opponentSiegeRow"></div>
                </div>
                
                <div class="battle-row ranged-row" data-row="ranged">
                    <div class="row-strength opponent-strength" id="opponentRangedStrength">0</div>
                    <div class="tactics-slot opponent-tactics" id="opponentRangedTactics"></div>
                    <div class="cards-row" id="opponentRangedRow"></div>
                </div>
                
                <div class="battle-row close-row" data-row="close">
                    <div class="row-strength opponent-strength" id="opponentCloseStrength">0</div>
                    <div class="tactics-slot opponent-tactics" id="opponentCloseTactics"></div>
                    <div class="cards-row" id="opponentCloseRow"></div>
                </div>
            </div>

            <div class="game-controls">
                <button class="control-btn pass-btn hidden-control" id="passBtn">ПАС</button>
                <button class="control-btn end-turn-btn hidden-control" id="endTurnBtn">ЗАКОНЧИТЬ ХОД</button>
            </div>
        `;
    },

    hideDeckBuilding: function() {
        const deckBuildingSection = document.querySelector('.deck-building');
        if (deckBuildingSection) {
            deckBuildingSection.style.opacity = '0';
            deckBuildingSection.style.transform = 'translateY(50px)';
            setTimeout(() => {
                deckBuildingSection.remove();
            }, 800);
        }
    },

    createBoardHTML: function() {
        const boardSection = document.createElement('section');
        boardSection.className = 'game-board';
        boardSection.innerHTML = this.generateBoardHTML();
        document.body.appendChild(boardSection);
        this.boardElement = boardSection;
    },

    updateControlsVisibility: function(isPlayerTurn) {
        const passBtn = document.getElementById('passBtn');
        const endTurnBtn = document.getElementById('endTurnBtn');
        
        if (passBtn && endTurnBtn) {
            if (isPlayerTurn) {
                passBtn.classList.remove('hidden-control');
                endTurnBtn.classList.remove('hidden-control');
                
                setTimeout(() => {
                    passBtn.style.opacity = '1';
                    passBtn.style.transform = 'translateY(0)';
                    endTurnBtn.style.opacity = '1';
                    endTurnBtn.style.transform = 'translateY(0)';
                }, 50);
            } else {
                passBtn.style.opacity = '0';
                passBtn.style.transform = 'translateY(15px)';
                endTurnBtn.style.opacity = '0';
                endTurnBtn.style.transform = 'translateY(15px)';
                
                setTimeout(() => {
                    passBtn.classList.add('hidden-control');
                    endTurnBtn.classList.add('hidden-control');
                }, 100);
            }
        }
    },

    setupBoardEventListeners: function() {
        const passBtn = document.getElementById('passBtn');
        const endTurnBtn = document.getElementById('endTurnBtn');

        if (passBtn) {
            passBtn.addEventListener('click', () => this.handlePass());
            passBtn.addEventListener('mouseenter', () => audioManager.playSound('touch'));
        }

        if (endTurnBtn) {
            endTurnBtn.addEventListener('click', () => this.handleEndTurn());
            endTurnBtn.addEventListener('mouseenter', () => audioManager.playSound('touch'));
        }

        this.setupCardSlotsEventListeners();
    },

    setupCardSlotsEventListeners: function() {
    },

    handlePass: function() {
        audioManager.playSound('button');
        this.updateControlsVisibility(false);
        if (window.playerModule && window.playerModule.handlePass) {
            window.playerModule.handlePass();
        }
    },

    handleEndTurn: function() {
        audioManager.playSound('button');
        this.updateControlsVisibility(false);
        if (window.playerModule && window.playerModule.handleEndTurn) {
            window.playerModule.handleEndTurn();
        }
    },

    animateBoardEntrance: function() {
        setTimeout(() => {
            if (this.boardElement) {
                this.boardElement.style.opacity = '1';
                
                const elements = this.boardElement.querySelectorAll('.leader-area, .decks-area, .weather-area, .round-counter-area, .battle-rows, .player-hand-area, .game-controls');
                elements.forEach((el, index) => {
                    setTimeout(() => {
                        el.style.transform = 'translateY(0)';
                        el.style.opacity = '1';
                    }, index * 100);
                });
            }
        }, 50);
    },

    updateRoundCounter: function(roundNumber) {
        const roundImage = document.getElementById('roundImage');
        const roundNumberElement = document.getElementById('roundNumber');
        
        if (roundImage) {
            roundImage.src = `board/round${Math.min(roundNumber, 10)}.png`;
        }
        if (roundNumberElement) {
            roundNumberElement.textContent = roundNumber;
        }
    },

    updateRowStrength: function(player, row, strength) {
        const strengthElement = document.getElementById(`${player}${this.capitalizeFirst(row)}Strength`);
        if (strengthElement) {
            strengthElement.textContent = strength;
            strengthElement.classList.add('strength-update');
            setTimeout(() => {
                strengthElement.classList.remove('strength-update');
            }, 500);
        }
    },

    capitalizeFirst: function(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    },

    placeCardOnBoard: function(card, row, player) {
    },

    removeCardFromBoard: function(cardId, player) {
    },

    clearBoard: function() {
    },
    
    endTurn: function() {
        this.endPlayerTurn();
    },
};

window.boardModule = boardModule;