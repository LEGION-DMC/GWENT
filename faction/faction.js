const factionsData = {
    scoiatael: {
        id: 'scoiatael',
        name: 'Скоя\'таэли',
        leaderName: 'Францеска Финдабаир',
		description: 'Княгиня Дол Блатанны',
        descriptionfull: 'Когда-то Большой землей владели Старшие расы: эльфы, краснолюды, гномы. Люди оттеснили их в захолустье, в горы, в густые леса — и ждут, пока те вымрут от голода и болезней. Но это вовсе не ослабляет их желания бунтовать, а лишь усиливает его. В конце концов им нечего терять.',
        ability: 'Право выбора первого хода',
		logo: 'faction/scoiatael/logo_faction.png',
        background: 'faction/scoiatael/fon_faction.jpg',
    },
    realms: {
        id: 'realms',
        name: 'Королевства Севера',
        leaderName: 'Фольтест',
		description: 'Король Темерии',
        descriptionfull: 'Ни при одном дворе, ни в одной библиотеке, ни в одной академии нет точной карты Королевств Севера. Ибо стоит картографу провести последнюю черту, как один из многочисленных королей, принцев или маркграфов уже атакует соседа и переносит границу. Без конца кто-то с кем-то воюет.',
        ability: 'Замена до 3 карт на этапе Муллиганы',
		logo: 'faction/realms/logo_faction.png',
        background: 'faction/realms/fon_faction.jpg',
    },
    nilfgaard: {
        id: 'nilfgaard',
        name: 'Нильфгаард',
        leaderName: 'Эмгыр вар Эмрейс',
		description: 'IV Император Нильфгаарда',
        descriptionfull: 'Вся Большая земля дрожит от чеканного шага тяжеловооруженных нильфгаардских пехотинцев. За ними следом движутся плюющие огнем боевые машины, златоустые эмиссары, наемные убийцы с окровавленными стилетами. Жители Севера с ужасом наблюдают за этим походом из-за полуприкрытых ставен и шепчут слова молитвы',
        ability: 'Победа в раунде при ничьей',
		logo: 'faction/nilfgaard/logo_faction.png',
        background: 'faction/nilfgaard/fon_faction.jpg',
    },
    monsters: {
        id: 'monsters',
        name: 'Чудовища',
        leaderName: 'Эредин Бреакк Глас',
		description: 'Командир Дикой Охоты',
        descriptionfull: 'Людям нравится думать, что они хозяева Большой земли. Но достаточно сойти с привычного большака или навострить ухо во время полнолуния, как станет ясно, насколько далека эта мысль от истины. Посреди лесной чащи, в тенистых оврагах и сырых погребах покинутых домов сверкает множество глаз и мокрых от слюны клыков.',
        ability: 'Сохранение 1 размещённой карты, в конце раунда',
		logo: 'faction/monsters/logo_faction.png',
        background: 'faction/monsters/fon_faction.jpg',
    },
    skellige: {
        id: 'skellige',
        name: 'Скеллиге',
        leaderName: 'Бран Тиршах',
		description: 'Король Скеллиге',
        descriptionfull: 'В сотнях миль от восточного побережья Большой земли лежат острова Скеллиге. В сравнении с Королевствами Севера или Нильфгаардской империей они нечтожно малы. Хотя многие пытались захватить Скеллиге. Останки их кораблей до сих пор торчат среди скал, а воины-островитяне пьют мед из их заржавленных шлемов.',
        ability: 'Возврат 2 карт из Сброса в 3 раунде',
		logo: 'faction/skellige/logo_faction.png',
        background: 'faction/skellige/fon_faction.jpg',
    },
	syndicate: {
        id: 'syndicate',
        name: 'Синдикат',
        leaderName: 'Тесак',
		description: 'Предводитель группировки «Златорубы»',
        descriptionfull: 'Одни сражаются за честь, а другие — за империю. Одни сражаются за короля, а другие — за свободу. Те, кто состоит в Синдикате «Большой восьмёрки», не станут сражаться ни за что, кроме богатства. И если щедро им заплатить, они будут готовы для вас на любые деяния… Даже самые чудовищные.',
        ability: 'Отмена фазы Муллиганы противника',
		logo: 'faction/syndicate/logo_faction.png',
        background: 'faction/syndicate/fon_faction.jpg',
    },
};

let selectedFaction = null;  
let isHovering = false;      

function initFactionSelection() {
    createFactionSelectionHTML();     
    setupFactionEventListeners();    
    hideStartPage();
	document.addEventListener('keydown', handleKeyPress);
}

function createFactionSelectionHTML() {
    const factionSection = document.createElement('section');
    factionSection.className = 'faction-selection';
    
    factionSection.innerHTML = `
        <div class="faction-selection__title">ВЫБЕРИТЕ ФРАКЦИЮ</div>
        <div class="faction-selection__container">
            ${Object.values(factionsData).map(faction => `
                <div class="faction-card" data-faction="${faction.id}">
                    <img src="${faction.logo}" alt="${faction.name}" class="faction-card__logo">
                    <div class="faction-card__overlay"></div>
                </div>
            `).join('')}
        </div>
        <div class="faction-description">
            <div class="faction-description__name"></div>
            <div class="faction-description__text"></div>
			<div class="faction-description__ability"></div>
        </div>
        <button class="confirm-btn" id="confirmFactionBtn">ПОДТВЕРДИТЬ ВЫБОР</button>
    `;
    
    document.body.appendChild(factionSection);
    
    setTimeout(() => {
        factionSection.style.opacity = '1';
        factionSection.style.transform = 'translateY(0)';
    }, 50);
}

function setupFactionEventListeners() {
    const factionCards = document.querySelectorAll('.faction-card');
    const confirmBtn = document.getElementById('confirmFactionBtn');
    
    factionCards.forEach(card => {
        const factionId = card.dataset.faction;
        const faction = factionsData[factionId];
        
        card.addEventListener('mouseenter', () => {
            audioManager.playSound('touch');
            isHovering = true;
            showFactionDescription(faction);
        });
        
        card.addEventListener('mouseleave', () => {
            isHovering = false;
            if (!selectedFaction) {
                hideFactionDescription();
            } else {
                setTimeout(() => {
                    if (!isHovering) {
                        showFactionDescription(selectedFaction);
                    }
                }, 100);
            }
        });
        
        card.addEventListener('click', () => {
            audioManager.playSound('touch');
            selectFaction(faction);
        });
    });
    
    confirmBtn.addEventListener('mouseenter', () => {
        audioManager.playSound('touch');
    });
    
    confirmBtn.addEventListener('click', () => {
        if (selectedFaction) {
            audioManager.playSound('button');
            proceedToDeckBuilding(selectedFaction);
        }
    });
}

function showFactionDescription(faction) {
    const description = document.querySelector('.faction-description');
    const nameElement = description.querySelector('.faction-description__name');
    const textElement = description.querySelector('.faction-description__text');
    const abilityElement = description.querySelector('.faction-description__ability');
	
    nameElement.textContent = faction.name;
    textElement.textContent = faction.descriptionfull;
    
	if (faction.ability) {
        abilityElement.innerHTML = `<strong>Способность фракции:</strong> ${faction.ability}`;
        abilityElement.style.display = 'block';
    } else {
        abilityElement.style.display = 'none';
    }
	
    description.style.opacity = '1';
    description.style.transform = 'translateY(0)';
}

function hideFactionDescription() {
    const description = document.querySelector('.faction-description');
    description.style.opacity = '0';
    description.style.transform = 'translateY(20px)';
}

function selectFaction(faction) {
    document.querySelectorAll('.faction-card').forEach(card => {
        card.classList.remove('faction-card--selected');
    });
    
    const selectedCard = document.querySelector(`[data-faction="${faction.id}"]`);
    selectedCard.classList.add('faction-card--selected');
    selectedFaction = faction;
    
    showFactionDescription(faction);
    
    const confirmBtn = document.getElementById('confirmFactionBtn');
    confirmBtn.style.opacity = '1';
    confirmBtn.style.transform = 'translateY(0)';
    confirmBtn.style.pointerEvents = 'auto';
}

function hideStartPage() {
    const startPage = document.querySelector('.start-page');
    if (startPage) {
        startPage.style.display = 'none';
    }
}

function proceedToDeckBuilding(faction) {
    document.removeEventListener('keydown', handleKeyPress);
    window.deckModule.initDeckBuilding(faction);
}

function handleKeyPress(event) {
    if (event.key === 'Escape' || event.key === 'Esc') {
        returnToMainMenu();
    }
}

function returnToMainMenu() {
    const factionSection = document.querySelector('.faction-selection');
    const startPage = document.querySelector('.start-page');
    if (factionSection) {
        factionSection.style.opacity = '0';
        factionSection.style.transform = 'translateY(20px)';
        factionSection.parentNode.removeChild(factionSection);

    }
    if (startPage) {
        startPage.style.display = 'flex';
        startPage.style.opacity = '1';
        const logo = startPage.querySelector('.logo');
        const menuButtons = startPage.querySelector('.main-menu-buttons');
        if (logo) {
            logo.style.animation = 'none';
            logo.style.opacity = '1';
            logo.style.transform = 'translateY(0)';
            void logo.offsetWidth;
            logo.style.animation = 'fadeInDown 0.8s ease forwards';
        }
        if (menuButtons) {
            menuButtons.style.animation = 'none';
            menuButtons.style.opacity = '1';
            menuButtons.style.transform = 'translateY(0)';
            void menuButtons.offsetWidth;
            menuButtons.style.animation = 'fadeInUp 0.8s ease forwards';
        }
    }
    selectedFaction = null;
    isHovering = false;
    document.removeEventListener('keydown', handleKeyPress);
}

window.factionModule = {
    initFactionSelection,
    factionsData
};