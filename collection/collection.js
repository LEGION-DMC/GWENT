const collectionModule = (function() {
    let allCards = [];
    let currentFilters = {
        faction: 'all',
        type: 'all',
        rarity: 'all',
        position: 'all'
    };
    let escapeHandler = null;
    let showCopies = false;
	
    function getAllCards() {
        if (allCards.length > 0) return allCards;
        
        const allFactions = ['monsters', 'nilfgaard', 'realms', 'scoiatael', 'skellige', 'syndicate', 'neutral'];
        
        allFactions.forEach(factionId => {
            if (window.cardsModule && window.cardsModule.getFactionCards) {
                const factionCards = window.cardsModule.getFactionCards(factionId);
                if (factionCards) {
                    const cards = [
                        ...(factionCards.units || []),
                        ...(factionCards.specials || []),
                        ...(factionCards.artifacts || []),
                        ...(factionCards.tactics || [])
                    ];
                    allCards.push(...cards);
                }
            }
        });
        
        allCards = allCards.filter((card, index, self) => 
            index === self.findIndex(c => c.id === card.id)
        );
        
        return allCards;
    }
    
	function filterCards() {
		let filtered = [...allCards];
		
		if (currentFilters.faction !== 'all') {
			filtered = filtered.filter(card => card.faction === currentFilters.faction);
		}
		
		if (currentFilters.type !== 'all') {
			filtered = filtered.filter(card => card.type === currentFilters.type);
		}
		
		if (currentFilters.rarity !== 'all') {
			filtered = filtered.filter(card => card.rarity === currentFilters.rarity);
		}
		
		if (currentFilters.position !== 'all') {
			filtered = filtered.filter(card => {
				if (card.type !== 'unit') return false;
				
				// Точное соответствие позиции
				switch (currentFilters.position) {
					case 'close-row':
						return card.position === 'close-row';
					case 'hidden-close-row':
						return card.position === 'hidden-close-row';
					case 'ranged-row':
						return card.position === 'ranged-row';
					case 'hidden-ranged-row':
						return card.position === 'hidden-ranged-row';
					case 'siege-row':
						return card.position === 'siege-row';
					case 'hidden-siege-row':
						return card.position === 'hidden-siege-row';
					case 'any-row':
						return card.position === 'any-row';
					case 'hidden-any-row':
						return card.position === 'hidden-any-row';
					default:
						return card.position === currentFilters.position;
				}
			});
		}
		
		// Фильтрация по чекбоксу копий
		if (!showCopies) {
			// Убираем дубликаты карт с копиями, оставляем только уникальные карты
			const uniqueCards = new Map();
			filtered.forEach(card => {
				if (!uniqueCards.has(card.id)) {
					uniqueCards.set(card.id, card);
				}
			});
			filtered = Array.from(uniqueCards.values());
		}
		
		// Сортировка как в модуле сбора колоды (deck.js)
		filtered.sort((a, b) => {
			// Сортировка по типу карты
			const typeOrder = { 
				'unit': 1, 
				'special': 2, 
				'artifact': 3, 
				'tactic': 4 
			};
			const typeA = typeOrder[a.type] || 5;
			const typeB = typeOrder[b.type] || 5;
			if (typeA !== typeB) return typeA - typeB;
			
			// Сортировка по редкости (золотые, серебряные, бронзовые)
			const rarityOrder = { 
				'gold': 1, 
				'silver': 2, 
				'bronze': 3 
			};
			const rarityA = rarityOrder[a.rarity] || 4;
			const rarityB = rarityOrder[b.rarity] || 4;
			if (rarityA !== rarityB) return rarityA - rarityB;
			
			// Сортировка по силе для отрядов (от большего к меньшему)
			if (a.type === 'unit' && b.type === 'unit') {
				const strengthDiff = (b.strength || 0) - (a.strength || 0);
				if (strengthDiff !== 0) return strengthDiff;
			}
			
			// Сортировка по фракции (свои фракции выше нейтральных)
			if (a.faction !== b.faction) {
				// Если одна из карт принадлежит выбранной фракции, она должна быть выше
				if (currentFilters.faction !== 'all') {
					if (a.faction === currentFilters.faction && b.faction !== currentFilters.faction) return -1;
					if (b.faction === currentFilters.faction && a.faction !== currentFilters.faction) return 1;
				}
				// Нейтральные карты идут после фракционных
				if (a.faction === 'neutral' && b.faction !== 'neutral') return 1;
				if (b.faction === 'neutral' && a.faction !== 'neutral') return -1;
			}
			
			// Сортировка по имени
			return a.name.localeCompare(b.name);
		});
		
		return filtered;
	}
		   
	function updateCardCount(filteredCards, filteredByType) {
		const countElement = document.getElementById('collectionCount');
		const strengthElement = document.getElementById('collectionStrength');
		
		// Подсчет с учетом копий для отображения в счетчике
		let displayCards = [...filteredCards];
		let totalCardsCount = 0;
		let totalStrength = 0;
		
		if (showCopies) {
			// Если показываем копии, считаем с учетом копий
			displayCards.forEach(card => {
				const copies = card.copy || 1;
				totalCardsCount += copies;
				if (card.type === 'unit' && card.strength) {
					totalStrength += card.strength * copies;
				}
			});
		} else {
			// Если не показываем копии, считаем без учета копий
			totalCardsCount = displayCards.length;
			displayCards.forEach(card => {
				if (card.type === 'unit' && card.strength) {
					totalStrength += card.strength;
				}
			});
		}
		
		if (countElement) {
			if (totalCardsCount === 0 && allCards.length > 0) {
				countElement.textContent = `0 карт`;
			} else {
				countElement.textContent = `${totalCardsCount} карт`;
			}
		}
		
		// Обновляем счетчик силы только если нужно показывать
		if (strengthElement) {
			// Проверяем, нужно ли показывать счетчик силы
			const showStrength = filteredByType === 'all' || filteredByType === 'unit';
			
			if (showStrength && totalCardsCount > 0) {
				strengthElement.textContent = `Cила: ${totalStrength}`;
				strengthElement.style.display = 'flex';
			} else {
				strengthElement.style.display = 'none';
			}
		}
	}
	   
	function displayCards() {
		const filteredCards = filterCards();
		const collectionGrid = document.getElementById('collectionGrid');
		
		if (!collectionGrid) return;
		
		collectionGrid.innerHTML = '';
		
		if (filteredCards.length === 0) {
			collectionGrid.innerHTML = `
				<div class="collection-empty">
					<img src="deck/none_cards.png" alt="Нет карт">
					<p>Нет карт, соответствующих выбранным фильтрам</p>
				</div>
			`;
			updateCardCount([], currentFilters.type);
			return;
		}
		
		filteredCards.forEach((card, index) => {
			const cardElement = createCollectionCardElement(card);
			cardElement.style.animation = `cardAddition 0.3s ease ${index * 0.02}s both`;
			collectionGrid.appendChild(cardElement);
		});
		
		updateCardCount(filteredCards, currentFilters.type);
	}

    function getCardDisplayMode() {
        if (window.settingsModule && window.settingsModule.getCardDisplayMode) {
            return window.settingsModule.getCardDisplayMode();
        }
        return 'static';
    }
    
    function getTypeIconPath(cardType) {
        const typeIcons = {
            'special': 'deck/type_special.png',
            'artifact': 'deck/type_artifact.png',
            'tactic': 'deck/type_tactic.png',
            'unit': 'deck/unit.png'
        };
        return typeIcons[cardType] || 'deck/type_unknown.png';
    }
    
    function getPositionIconPath(position) {
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
    }
    
    function getPositionName(position) {
        const positionNames = {
            'close-row': 'Ближний бой',
            'ranged-row': 'Дальний бой',
            'siege-row': 'Осадный ряд',
            'any-row': 'Все ряды',
            'hidden-close-row': 'Ближний бой',
            'hidden-ranged-row': 'Дальний бой',
            'hidden-siege-row': 'Осадный ряд',
            'hidden-any-row': 'Все ряды'
        };
        return positionNames[position] || position;
    }
    
    function getPositionDisplayName(position) {
        const displayNames = {
            'close-row': 'Ближний бой',
            'ranged-row': 'Дальний бой',
            'siege-row': 'Осадный ряд',
            'any-row': 'Все ряды'
        };
        return displayNames[position] || position;
    }
    
    function createCollectionCardElement(card) {
        const cardElement = document.createElement('div');
        cardElement.className = `card ${card.type} ${card.rarity} collection-card`;
        cardElement.dataset.cardId = card.id;
        
        const cardDisplayMode = getCardDisplayMode();
        
        let mediaPath = `card/${card.faction}/${card.image}`;
        let isVideo = card.image && card.image.endsWith('.mp4');
        
        if (cardDisplayMode === 'static' && isVideo) {
            mediaPath = mediaPath.replace('.mp4', '.jpg');
            isVideo = false;
        }
        
        let mediaElement = '';
        if (isVideo) {
            mediaElement = `
                <video class="card__media" muted playsinline preload="metadata">
                    <source src="${mediaPath}" type="video/mp4">
                </video>
            `;
        } else {
            mediaElement = `<img src="${mediaPath}" alt="${card.name}" class="card__media" onerror="this.src='card/placeholder.jpg'">`;
        }
        
        let topRightElement = '';
        if (card.type === 'unit') {
            topRightElement = `<div class="card__strength">${card.strength}</div>`;
        } else {
            const typeIconPath = getTypeIconPath(card.type);
            topRightElement = `
                <div class="card__type-icon">
                    <img src="${typeIconPath}" alt="${card.type}">
                </div>
            `;
        }
        
        let positionElement = '';
        if (card.type === 'unit' && card.position) {
            const positionIconPath = getPositionIconPath(card.position);
            positionElement = `
                <div class="card__position">
                    <img src="${card.positionBanner || 'deck/position_banner.png'}" alt="Позиция" class="card__position-banner">
                    <img src="${positionIconPath}" alt="${card.position}" class="card__position-icon">
                </div>
            `;
        }
        
        cardElement.innerHTML = `
            <div class="card__container">
                ${mediaElement}
                <img src="${card.border}" alt="Рамка" class="card__border">
                <img src="${card.banner}" alt="Баннер" class="card__banner">
                <div class="card__name">${card.name}</div>
                ${topRightElement}
                ${positionElement}
            </div>
        `;
        
        if (card.copy && card.copy > 1) {
            const copyBanner = document.createElement('img');
            copyBanner.className = 'card__copy-banner';
            copyBanner.src = `faction/${card.faction}/banner_position.png`;
            copyBanner.alt = 'Копия';
            
            const copyIndicator = document.createElement('div');
            copyIndicator.className = 'card__copy-indicator';
            copyIndicator.textContent = `×${card.copy}`;
            
            const cardContainer = cardElement.querySelector('.card__container');
            if (cardContainer) {
                cardContainer.appendChild(copyBanner);
                cardContainer.appendChild(copyIndicator);
            }
        }
        
        cardElement.addEventListener('click', () => {
            showCardDetailsModal(card);
        });
        
        if (isVideo && cardDisplayMode === 'animated') {
            setupVideoControls(cardElement);
        }
        
        return cardElement;
    }

    function setupVideoControls(cardElement) {
        const video = cardElement.querySelector('video');
        if (!video) return;
        
        video.removeAttribute('autoplay');
        video.removeAttribute('loop');
        
        cardElement.addEventListener('mouseenter', () => {
            video.currentTime = 0;
            video.play().catch(e => {});
            video.loop = true;
        });
        
        cardElement.addEventListener('mouseleave', () => {
            video.pause();
            video.currentTime = 0;
            video.loop = false;
        });
        
        cardElement.addEventListener('click', () => {
            video.pause();
            video.currentTime = 0;
        });
    }

	function showCardDetailsModal(card) {
		const modalOverlay = document.createElement('div');
		modalOverlay.className = 'card-modal-overlay';
		
		const cardDisplayMode = getCardDisplayMode();
		
		let mediaPath = `card/${card.faction}/${card.image}`;
		let isVideo = card.image && card.image.endsWith('.mp4');
		
		if (cardDisplayMode === 'static' && isVideo) {
			mediaPath = mediaPath.replace('.mp4', '.jpg');
			isVideo = false;
		}
		
		let mediaElement = '';
		if (isVideo) {
			mediaElement = `
				<video class="card__media" autoplay loop muted playsinline>
					<source src="${mediaPath}" type="video/mp4">
				</video>
			`;
		} else {
			mediaElement = `<img src="${mediaPath}" alt="${card.name}" class="card__media">`;
		}
		
		let topRightElement = '';
		if (card.type === 'unit') {
			topRightElement = `<div class="card__strength">${card.strength}</div>`;
		} else {
			const typeIconPath = getTypeIconPath(card.type);
			topRightElement = `
				<div class="card__type-icon">
					<img src="${typeIconPath}" alt="${card.type}">
				</div>
			`;
		}
		
		let positionElement = '';
		if (card.type === 'unit' && card.position) {
			const positionIconPath = getPositionIconPath(card.position);
			positionElement = `
				<div class="card__position">
					<img src="${card.positionBanner || 'deck/position_banner.png'}" alt="Позиция" class="card__position-banner">
					<img src="${positionIconPath}" alt="${card.position}" class="card__position-icon">
				</div>
			`;
		}
		
		// Получаем способность карты из глобального объекта skillSystem
		let abilityHtml = '';
		if (card.ability && window.skillSystem && window.skillSystem.abilities && window.skillSystem.abilities[card.ability]) {
			const ability = window.skillSystem.abilities[card.ability];
			abilityHtml = `
				<div class="card-modal__abilities">
					<div class="card-modal__abilities-title">Способность</div>
					<div class="card-modal__ability">
						<div class="card-modal__ability-name">${ability.name}</div>
						<div class="card-modal__ability-description">${ability.description}</div>
					</div>
				</div>
			`;
		}
		
		modalOverlay.innerHTML = `
			<div class="card-modal">
				<div class="card-modal__preview">
					<div class="card__container">
						${mediaElement}
						<img src="${card.border}" alt="Рамка" class="card__border">
						<img src="${card.banner}" alt="Баннер" class="card__banner">
						${topRightElement}
						${positionElement}
					</div>
				</div>
				<div class="card-modal__info">
					<div class="card-modal__title">${(card.namefull || card.name).replace(/'/g, "\\'")}</div>
					<div class="card-modal__faction">${card.description || localizeFaction(card.faction)}</div>
					<div class="card-modal__stats">
						<div class="card-modal__stat">
							<div class="card-modal__stat-label">Тип</div>
							<div class="card-modal__stat-value">${localizeCardType(card.type)}</div>
						</div>
						<div class="card-modal__stat">
							<div class="card-modal__stat-label">Редкость</div>
							<div class="card-modal__stat-value">${localizeRarity(card.rarity)}</div>
						</div>
						${card.strength ? `
						<div class="card-modal__stat">
							<div class="card-modal__stat-label">Сила</div>
							<div class="card-modal__stat-value">${card.strength}</div>
						</div>
						` : ''}
						${card.position ? `
						<div class="card-modal__stat">
							<div class="card-modal__stat-label">Позиция</div>
							<div class="card-modal__stat-value">${getPositionName(card.position)}</div>
						</div>
						` : ''}
					</div>
					<div class="card-modal__description">
						<div class="card-modal__description-title">Описание</div>
						<div class="card-modal__description-text">${(card.descriptionfull || card.description || 'Описание отсутствует').replace(/'/g, "\\'")}</div>
					</div>
					${abilityHtml}
					${card.tags && card.tags.length > 0 ? `
					<div class="card-modal__abilities">
						<div class="card-modal__abilities-title">Теги</div>
						<div class="tags-container ${card.tags.length > 6 ? 'tags-container-3col' : 'tags-container-2col'}">
							${localizeTags(card.tags).map(tag => `
								<div class="card-tag">${tag}</div>
							`).join('')}
						</div>
					</div>
					` : ''}
				</div>
			</div>
		`;
		
		document.body.appendChild(modalOverlay);
		
		// Функция закрытия модального окна
		const closeModal = () => {
			modalOverlay.classList.remove('active');
			setTimeout(() => {
				if (modalOverlay.parentNode) {
					modalOverlay.parentNode.removeChild(modalOverlay);
				}
			}, 300);
			if (window.audioManager) audioManager.playSound('button');
		};
		
		modalOverlay.addEventListener('click', (event) => {
			if (event.target === modalOverlay) {
				closeModal();
			}
		});
		
		setTimeout(() => {
			modalOverlay.classList.add('active');
		}, 100);
		
		if (isVideo && cardDisplayMode === 'animated') {
			const videoElement = modalOverlay.querySelector('video');
			if (videoElement) {
				videoElement.loop = true;
			}
		}
		
		if (window.audioManager) audioManager.playSound('button');
		
		// Обработчик Escape
		const escapeHandler = (e) => {
			if (e.key === 'Escape') {
				closeModal();
				document.removeEventListener('keydown', escapeHandler);
			}
		};
		document.addEventListener('keydown', escapeHandler);
		
		// Сохраняем обработчик для очистки
		modalOverlay._escapeHandler = escapeHandler;
	}

	function closeCardModal(modalOverlay) {
		if (modalOverlay._escapeHandler) {
			document.removeEventListener('keydown', modalOverlay._escapeHandler);
		}
		modalOverlay.classList.remove('active');
		setTimeout(() => {
			if (modalOverlay.parentNode) {
				modalOverlay.parentNode.removeChild(modalOverlay);
			}
		}, 300);
		if (window.audioManager) audioManager.playSound('button');
	}   
	 
    function localizeFaction(factionId) {
        const factions = {
            neutral: 'Нейтралитет',
            monsters: 'Чудовища',
            nilfgaard: 'Нильфгаард',
            realms: 'Королевства Севера',
            scoiatael: 'Скоя\'таэли',
            skellige: 'Скеллиге',
            syndicate: 'Синдикат',
        };
        return factions[factionId] || factionId;
    }
    
    function localizeCardType(type) {
        const types = {
            unit: 'Отряд',
            special: 'Спец. карта',
            artifact: 'Артефакт',
            tactic: 'Тактика',
            leader: 'Лидер',
        };
        return types[type] || type;
    }
    
    function localizeRarity(rarity) {
        const rarities = {
            bronze: 'Бронзовая',
            silver: 'Серебряная',
            gold: 'Золотая'
        };
        return rarities[rarity] || rarity;
    }
    
    function localizeTags(tags) {
        const tagNames = {
			leader: 'Лидер',
			hero: 'Герой',
			wild_hunt: 'Дикая Охота',
			emperor: 'Император',
			king: 'Правитель',
			kingser: 'Знать',
			mage: 'Чародей',
			witcher: 'Ведьмак',
			soldier: 'Солдат',
			monster: 'Чудовище',
			weather: 'Погода',
			tactic: 'Военное искуство',
			spell: 'Заклятие',
			hazard: 'Бедствие',
			ritual: 'Ритуал',
			execution: 'Наказание',
			criminal: 'Преступник',
			scavenger: 'Трупоед',
			ghost: 'Призрак',
			artifact: 'Артефакт',          
			dragon: 'Драконид',              
			fiend: 'Бес',                   
			specter: 'Дух',                 
			dwarf: 'Краснолюд',             
			mercenary: 'Наёмник',
			elf: 'Ельф',
			oak: 'Древень',
			curse: 'Проклятие',
			religy: 'Религия',
			weapons: 'Оружие',
        };
        return tags ? tags.map(tag => tagNames[tag] || tag) : [];
    }
    
	function resetFilters() {
		currentFilters = {
			faction: 'all',
			type: 'all',
			rarity: 'all',
			position: 'all'
		};
		
		// Сбрасываем чекбокс копий в выключенное состояние (false)
		showCopies = false;
		const showCopiesCheckbox = document.getElementById('showCopiesCheckbox');
		if (showCopiesCheckbox) {
			showCopiesCheckbox.checked = false;
		}
		
		const factionButtons = document.querySelectorAll('.filter-faction-btn');
		const typeButtons = document.querySelectorAll('.filter-type-btn');
		const rarityButtons = document.querySelectorAll('.filter-rarity-btn');
		const positionButtons = document.querySelectorAll('.filter-position-btn');
		
		factionButtons.forEach(btn => {
			if (btn.dataset.faction === 'all') {
				btn.classList.add('active');
			} else {
				btn.classList.remove('active');
			}
		});
		
		typeButtons.forEach(btn => {
			if (btn.dataset.type === 'all') {
				btn.classList.add('active');
			} else {
				btn.classList.remove('active');
			}
		});
		
		rarityButtons.forEach(btn => {
			if (btn.dataset.rarity === 'all') {
				btn.classList.add('active');
			} else {
				btn.classList.remove('active');
			}
		});
		
		positionButtons.forEach(btn => {
			if (btn.dataset.position === 'all') {
				btn.classList.add('active');
			} else {
				btn.classList.remove('active');
			}
		});
		
		displayCards();
		if (window.audioManager) audioManager.playSound('button');
	}
   
	function setupFilterListeners() {
		const factionButtons = document.querySelectorAll('.filter-faction-btn');
		const typeButtons = document.querySelectorAll('.filter-type-btn');
		const rarityButtons = document.querySelectorAll('.filter-rarity-btn');
		const positionButtons = document.querySelectorAll('.filter-position-btn');
		const resetBtn = document.getElementById('resetFiltersBtn');
		const showCopiesCheckbox = document.getElementById('showCopiesCheckbox');
		
		// Обработчик чекбокса
		if (showCopiesCheckbox) {
			showCopiesCheckbox.addEventListener('change', (e) => {
				showCopies = e.target.checked;
				displayCards();
				if (window.audioManager) audioManager.playSound('button');
			});
			
			showCopiesCheckbox.addEventListener('mouseenter', () => {
				if (window.audioManager) audioManager.playSound('touch');
			});
		}
		
		// Обработчики для фракций
		factionButtons.forEach(btn => {
			btn.addEventListener('click', () => {
				factionButtons.forEach(b => b.classList.remove('active'));
				btn.classList.add('active');
				currentFilters.faction = btn.dataset.faction;
				displayCards();
				if (window.audioManager) audioManager.playSound('button');
			});
			
			btn.addEventListener('mouseenter', () => {
				if (window.audioManager) audioManager.playSound('touch');
			});
		});
		
		// Обработчики для типов карт
		typeButtons.forEach(btn => {
			btn.addEventListener('click', () => {
				typeButtons.forEach(b => b.classList.remove('active'));
				btn.classList.add('active');
				currentFilters.type = btn.dataset.type;
				
				// Если выбран не "Отряды" и не "Все", сбрасываем фильтр позиции на "Все"
				if (btn.dataset.type !== 'unit' && btn.dataset.type !== 'all') {
					// Сбрасываем фильтр позиции
					currentFilters.position = 'all';
					// Снимаем активность со всех кнопок позиции
					positionButtons.forEach(posBtn => {
						if (posBtn.dataset.position === 'all') {
							posBtn.classList.add('active');
						} else {
							posBtn.classList.remove('active');
						}
					});
				}
				
				displayCards();
				if (window.audioManager) audioManager.playSound('button');
			});
			
			btn.addEventListener('mouseenter', () => {
				if (window.audioManager) audioManager.playSound('touch');
			});
		});
		
		// Обработчики для редкости
		rarityButtons.forEach(btn => {
			btn.addEventListener('click', () => {
				rarityButtons.forEach(b => b.classList.remove('active'));
				btn.classList.add('active');
				currentFilters.rarity = btn.dataset.rarity;
				displayCards();
				if (window.audioManager) audioManager.playSound('button');
			});
			
			btn.addEventListener('mouseenter', () => {
				if (window.audioManager) audioManager.playSound('touch');
			});
		});
		
		// Обработчики для позиций
		positionButtons.forEach(btn => {
			btn.addEventListener('click', () => {
				positionButtons.forEach(b => b.classList.remove('active'));
				btn.classList.add('active');
				currentFilters.position = btn.dataset.position;
				
				// Если выбрана любая позиция (не "Все"), устанавливаем тип на "Отряды"
				if (btn.dataset.position !== 'all') {
					// Устанавливаем фильтр типа на "unit"
					currentFilters.type = 'unit';
					// Снимаем активность со всех кнопок типа
					typeButtons.forEach(typeBtn => {
						if (typeBtn.dataset.type === 'unit') {
							typeBtn.classList.add('active');
						} else {
							typeBtn.classList.remove('active');
						}
					});
				}
				
				displayCards();
				if (window.audioManager) audioManager.playSound('button');
			});
			
			btn.addEventListener('mouseenter', () => {
				if (window.audioManager) audioManager.playSound('touch');
			});
		});
		
		if (resetBtn) {
			resetBtn.addEventListener('click', resetFilters);
			resetBtn.addEventListener('mouseenter', () => {
				if (window.audioManager) audioManager.playSound('touch');
			});
		}
	}
   
    function setupEscapeHandler() {
        if (escapeHandler) {
            document.removeEventListener('keydown', escapeHandler);
        }
        
        escapeHandler = (e) => {
            if (e.key === 'Escape') {
                const modalOverlay = document.querySelector('.card-modal-overlay');
                if (modalOverlay && modalOverlay.classList.contains('active')) {
                    closeCardModal(modalOverlay);
                } else {
                    closeCollection();
                }
            }
        };
        
        document.addEventListener('keydown', escapeHandler);
    }
    
    function removeEscapeHandler() {
        if (escapeHandler) {
            document.removeEventListener('keydown', escapeHandler);
            escapeHandler = null;
        }
    }
    
	function initCollection() {
		const existingCollection = document.querySelector('.collection-page');
		if (existingCollection) {
			existingCollection.remove();
		}
		
		// Сбрасываем фильтры при открытии коллекции
		currentFilters = {
			faction: 'all',
			type: 'all',
			rarity: 'all',
			position: 'all'
		};
		
		// Очищаем кэш карт, чтобы принудительно перезагрузить
		allCards = [];
		
		// Анимируем скрытие главного меню
		const startPage = document.querySelector('.start-page');
		const logo = startPage?.querySelector('.logo');
		const menuButtons = startPage?.querySelector('.main-menu-buttons');
		
		if (logo) logo.style.animation = 'fadeOutUp 0.5s ease forwards';
		if (menuButtons) menuButtons.style.animation = 'fadeOutDown 0.5s ease forwards';
		
		setTimeout(() => {
			if (startPage) {
				startPage.style.opacity = '0';
				setTimeout(() => {
					startPage.style.display = 'none';
				}, 500);
			}
			
			getAllCards();
			
			const collectionHTML = `
				<div class="collection-page">
					<button class="back-to-menu-btn-collection" id="backToMenuBtn">Назад</button>
					<div class="collection-container">
						<div class="collection-filters">
						
							<div class="filter-section">
								<div class="filter-title">Фракция</div>
								<div class="section-divider"></div>
								<div class="filter-buttons faction-buttons">
									<button class="filter-faction-btn filter-faction-all active" data-faction="all">
										<span>Все</span>
									</button>
									<div class="faction-grid">
										<button class="filter-faction-btn" data-faction="monsters">
											<img src="faction/monsters/icon.png" alt="Чудовища" class="filter-faction-img" onerror="this.src='faction/monsters/logo_faction.png'">
											<span>Чудовища</span>
										</button>
										<button class="filter-faction-btn" data-faction="nilfgaard">
											<img src="faction/nilfgaard/icon.png" alt="Нильфгаард" class="filter-faction-img" onerror="this.src='faction/nilfgaard/logo_faction.png'">
											<span>Нильфгаард</span>
										</button>
										<button class="filter-faction-btn" data-faction="realms">
											<img src="faction/realms/icon.png" alt="Королевства" class="filter-faction-img" onerror="this.src='faction/realms/logo_faction.png'">
											<span>Королевства</span>
										</button>
										<button class="filter-faction-btn" data-faction="scoiatael">
											<img src="faction/scoiatael/icon.png" alt="Скоя'таэли" class="filter-faction-img" onerror="this.src='faction/scoiatael/logo_faction.png'">
											<span>Скоя'таэли</span>
										</button>
										<button class="filter-faction-btn" data-faction="skellige">
											<img src="faction/skellige/icon.png" alt="Скеллиге" class="filter-faction-img" onerror="this.src='faction/skellige/logo_faction.png'">
											<span>Скеллиге</span>
										</button>
										<button class="filter-faction-btn" data-faction="syndicate">
											<img src="faction/syndicate/icon.png" alt="Синдикат" class="filter-faction-img" onerror="this.src='faction/syndicate/logo_faction.png'">
											<span>Синдикат</span>
										</button>
										<button class="filter-faction-btn" data-faction="neutral">
											<img src="faction/neutral/icon.png" alt="Нейтральные" class="filter-faction-img" onerror="this.src='faction/neutral/logo_faction.png'">
											<span>Нейтральные</span>
										</button>
									</div>
								</div>
							</div>
							
							<div class="filter-section">
								<div class="filter-title">Тип</div>
								<div class="section-divider"></div>
								<div class="filter-buttons type-buttons">
									<div class="type-header">
										<button class="filter-btn filter-type-btn filter-btn-all active" data-type="all">
											<span>Все</span>
										</button>
									</div>
									<div class="type-grid">
										<button class="filter-btn filter-type-btn" data-type="unit">
											<img src="deck/unit.png" alt="Отряды" class="filter-icon">
											<span>Отряды</span>
										</button>
										<button class="filter-btn filter-type-btn" data-type="special">
											<img src="deck/special.png" alt="Спец. карты" class="filter-icon">
											<span>Спец. карты</span>
										</button>
										<button class="filter-btn filter-type-btn" data-type="artifact">
											<img src="deck/artifact.png" alt="Артефакты" class="filter-icon">
											<span>Артефакты</span>
										</button>
										<button class="filter-btn filter-type-btn" data-type="tactic">
											<img src="deck/tactic.png" alt="Тактики" class="filter-icon">
											<span>Тактики</span>
										</button>
									</div>
								</div>
							</div>
							
							<div class="filter-section">
								<div class="filter-title">Редкость</div>
								<div class="section-divider"></div>
								<div class="filter-buttons rarity-buttons">
									<button class="filter-btn filter-rarity-btn filter-btn-all active" data-rarity="all">
										<span>Все</span>
									</button>
									<div class="rarity-grid">
										<button class="filter-btn filter-rarity-btn" data-rarity="bronze" style="color: #b87333;">Бронзовые</button>
										<button class="filter-btn filter-rarity-btn" data-rarity="silver" style="color: #e3e4e5;">Серебряные</button>
										<button class="filter-btn filter-rarity-btn" data-rarity="gold" style="color: #f5b642;">Золотые</button>
									</div>
								</div>
							</div>
							
							
							<div class="filter-section">
								<div class="filter-title">Позиция</div>
								<div class="section-divider"></div>
								<div class="filter-buttons position-buttons">
									<button class="filter-position-btn filter-btn-all active" data-position="all">
										<span>Все</span>
									</button>
									<div class="position-grid">
										<button class="filter-position-btn" data-position="close-row">
											<img src="deck/close-row.png" alt="Ближний бой" class="filter-icon">
											<span>Ближний</span>
										</button>
										<button class="filter-position-btn" data-position="hidden-close-row">
											<img src="deck/hidden-close-row.png" alt="Шпион (ближний)" class="filter-icon">
											<span>Шпион-Ближ</span>
										</button>
										<button class="filter-position-btn" data-position="ranged-row">
											<img src="deck/ranged-row.png" alt="Дальний бой" class="filter-icon">
											<span>Дальний</span>
										</button>
										<button class="filter-position-btn" data-position="hidden-ranged-row">
											<img src="deck/hidden-ranged-row.png" alt="Шпион (дальний)" class="filter-icon">
											<span>Шпион-Даль</span>
										</button>
										<button class="filter-position-btn" data-position="siege-row">
											<img src="deck/siege-row.png" alt="Осадный" class="filter-icon">
											<span>Осадный</span>
										</button>
										<button class="filter-position-btn" data-position="hidden-siege-row">
											<img src="deck/hidden-siege-row.png" alt="Шпион (осадный)" class="filter-icon">
											<span>Шпион-Осад</span>
										</button>
										<button class="filter-position-btn" data-position="any-row">
											<img src="deck/any-row.png" alt="Любой" class="filter-icon">
											<span>Гибридный</span>
										</button>
										<button class="filter-position-btn" data-position="hidden-any-row">
											<img src="deck/hidden-any-row.png" alt="Шпион (любой)" class="filter-icon">
											<span>Шпион-Гибр</span>
										</button>
									</div>
								</div>
							</div>
							
							<div class="section-divider"></div>
							<label class="copy-toggle">
								<input type="checkbox" id="showCopiesCheckbox">
								<span class="copy-toggle-label">Учитывать силу и кол-во копий карт</span>
							</label>

							<div class="section-divider"></div>
							<div class="filter-section reset-section">
								<button class="reset-filters-btn" id="resetFiltersBtn">
									<img src="deck/auto_build.png" alt="Сброс">
									<span>СБРОСИТЬ ФИЛЬТРЫ</span>
								</button>
							</div>
						</div>
						
						<div class="collection-cards-area">
							<div class="collection-header">
								<h2>КОЛЛЕКЦИЯ</h2>
								<div class="collection-stats">
									<div class="collection-strength" id="collectionStrength" style="display: none;">0</div>
									<div class="collection-count" id="collectionCount">0 карт</div>
								</div>
							</div>
							<div class="section-divider"></div>
							<div class="collection-grid" id="collectionGrid">
								<div class="collection-empty">
									<img src="deck/none_cards.png" alt="Загрузка">
									<p>Загрузка карт...</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			`;
			
			document.body.appendChild(createElementFromHTML(collectionHTML));
			
			setTimeout(() => {
				const collectionPage = document.querySelector('.collection-page');
				if (collectionPage) {
					collectionPage.style.opacity = '1';
				}
				document.body.style.background = "url('ui/fon.jpg') no-repeat center center fixed";
				document.body.style.backgroundSize = 'cover';
			}, 100);
			
			setupFilterListeners();
			setupEscapeHandler();
			
			// Принудительно активируем кнопку "Все" для всех фильтров
			setTimeout(() => {
				// Убеждаемся, что все кнопки "Все" активны
				const allButtons = document.querySelectorAll('.filter-faction-all, .filter-btn-all');
				allButtons.forEach(btn => {
					btn.classList.add('active');
				});
				
				// Убираем активность с остальных кнопок
				document.querySelectorAll('.filter-faction-btn:not(.filter-faction-all), .filter-type-btn:not(.filter-btn-all), .filter-rarity-btn:not(.filter-btn-all), .filter-position-btn:not(.filter-btn-all)').forEach(btn => {
					btn.classList.remove('active');
				});
				
				displayCards();
			}, 50);
			
			const backBtn = document.getElementById('backToMenuBtn');
			if (backBtn) {
				backBtn.addEventListener('click', () => {
					if (window.audioManager) audioManager.playSound('button');
					closeCollection();
				});
				
				backBtn.addEventListener('mouseenter', () => {
					if (window.audioManager) audioManager.playSound('touch');
				});
			}
			
			if (window.settingsModule) {
				const originalNotify = settingsModule.notifySettingsChange;
				settingsModule.notifySettingsChange = function() {
					if (originalNotify) originalNotify.call(this);
					refreshCardsDisplay();
				};
			}
		}, 500);
	}   
	
    function refreshCardsDisplay() {
        const collectionPage = document.querySelector('.collection-page');
        if (collectionPage) {
            displayCards();
        }
    }
    
    function createElementFromHTML(htmlString) {
        const div = document.createElement('div');
        div.innerHTML = htmlString.trim();
        return div.firstChild;
    }
    
    function closeCollection() {
        const collectionPage = document.querySelector('.collection-page');
        if (collectionPage) {
            collectionPage.style.opacity = '0';
            setTimeout(() => {
                collectionPage.remove();
                removeEscapeHandler();
                
                // Восстанавливаем главное меню
                const startPage = document.querySelector('.start-page');
                if (startPage) {
                    startPage.style.display = 'flex';
                    startPage.style.opacity = '1';
                    
                    // Анимируем элементы меню
                    const logo = startPage.querySelector('.logo');
                    const menuButtons = startPage.querySelector('.main-menu-buttons');
                    
                    if (logo) {
                        logo.style.animation = 'none';
                        void logo.offsetWidth;
                        logo.style.animation = 'fadeInDown 0.5s ease forwards';
                    }
                    
                    if (menuButtons) {
                        menuButtons.style.animation = 'none';
                        void menuButtons.offsetWidth;
                        menuButtons.style.animation = 'fadeInUp 0.5s ease forwards';
                    }
                } else {
                    // Если start-page не найден, перезагружаем страницу
                    location.reload();
                }
            }, 500);
        }
    }
    
    return {
        initCollection,
        getAllCards,
        filterCards,
        displayCards,
        resetFilters,
        refreshCardsDisplay
    };
})();

window.collectionModule = collectionModule;