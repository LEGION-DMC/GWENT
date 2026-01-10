const rulesData = {
    faction: {
        title: 'Фракции',
        description: 'Противоборствующие фракции',
        type: 'rule',
        content: `
            <p style="text-align: center;">У каждой фракции своя история и свои способы ведения боя.</p>
            
            <div class="bloc-rule">
                <img src="faction/nilfgaard/logo_faction.png" alt="Нильфгаард" class="rule-modal__image">
                <div class="faction">
                    <h3>Нильфгаард</h3>
                    <p>Государство крайностей. Самое большое, самое многонаселённое, самое могущественное, самое богатое... и, конечно, самое безжалостное.</p>
                    <p style="color: #6a66d3; font-style: italic;">Способность колоды состоит в том, что при равном счете по окончании раунда победа засчитывается игравшему данной фракцией.</p>
                </div>
            </div>
            
            <div class="bloc-rule">
                <img src="faction/realms/logo_faction.png" alt="Королевства Севера" class="rule-modal__image">
                <div class="faction">
                    <h3>Королевства Севера</h3>
                    <p>Королевства Севера славятся внушительными армиями, смертоносной военной техникой и отважными военачальниками.</p>
                    <p style="color: #6a66d3; font-style: italic;">Способность колоды состоит в том, что на этапе Муллиганы, может заменить 3 карты.</p>
                </div>
            </div>
            
            <div class="bloc-rule">
                <img src="faction/monsters/logo_faction.png" alt="Чудовища" class="rule-modal__image">                
                <div class="faction">
                    <h3>Чудовища</h3>
                    <p>Эти жуткие чудовища подчиняются звериным инстинктам и ради еще большей мощи готовы даже поглотить своих собратьев.</p>
                    <p style="color: #6a66d3; font-style: italic;">Способность колоды состоит в том, что по завершении раунда сохраняется 1 разыгранная карта.</p>
                </div>
            </div>
            
            <div class="bloc-rule">
                <img src="faction/scoiatael/logo_faction.png" alt="Скоя'таэли" class="rule-modal__image"> 
                <div class="faction">
                    <h3>Скоя'таэли</h3>
                    <p>Эльфы и краснолюды, лишённые всяческих прав и загнанные в переполненные гетто, ждали удобного момента, чтобы броситься в бой против королевств Севера.</p>
                    <p style="color: #6a66d3; font-style: italic;">Способность колоды состоит в том, что за ней закреплено право выбора первого хода.</p>
                </div>
            </div>
            
            <div class="bloc-rule">	
                <img src="faction/skellige/logo_faction.png" alt="Скеллиге" class="rule-modal__image">	
                <div class="faction">
                    <h3>Скеллиге</h3>
                    <p>Воины Скеллиге без страха бросаются на врага, а потери и полученные раны лишь придают им сил в бою.</p>
                    <p style="color: #6a66d3; font-style: italic;">Способность колоды состоит в том, что в третьем раунде две случайные карты из Сброса возвращаются в игру.</p>
                </div>
            </div>

            <div class="bloc-rule">	
                <img src="faction/syndicate/logo_faction.png" alt="Синдикат" class="rule-modal__image">	
                <div class="faction">
                    <h3>Синдикат</h3>
                    <p>Одни сражаются за честь, а другие — за свободу. Те, кто состоит в Синдикате, не станут сражаться ни за что, кроме богатства.</p>
                    <p style="color: #6a66d3; font-style: italic;">Способность колоды состоит в том, что отменяет фазу Муллиганы противника.</p>
                </div>
            </div> 

            <div class="bloc-rule">	
                <img src="faction/neutral/logo_faction.png" alt="Нейтралитет" class="rule-modal__image">	
                <div class="faction">
                    <h3>Нейтралитет</h3>
                    <p>Эти карты не принадлежат ни одной фракции и могут использоваться всеми.</p>
                    <p style="color: #6a66d3; font-style: italic;">Особенностью этих карт является то, что их можно добавить в колоду любой фракции.</p>
                </div>
            </div>
        `
    },
    cards: {
        title: 'Типы карт',
        description: 'Различные виды карт и их особенности',
        type: 'rule',
        content: `
            <p style="text-align: center;">Карты делятся на несколько типов, каждый со своими уникальными свойствами.</p>
            
            <div class="bloc-rule">
                <img src="deck/unit.png" alt="Отряды" class="rule-modal__image">
                <div class="cards">
                    <h3>Отряды</h3>
                    <p>Основные боевые единицы, которые размещаются на поле боя и имеют силу атаки.</p>
                </div>
            </div>
            
            <div class="bloc-rule">
                <img src="deck/special.png" alt="Специальные" class="rule-modal__image">
                <div class="cards">
                    <h3>Специальные</h3>
                    <p>Карты, которые оказывают немедленный эффект и затем отправляются в сброс.</p>
                </div>
            </div>
            
            <div class="bloc-rule">
                <img src="deck/artifact.png" alt="Артефакты" class="rule-modal__image">
                <div class="cards">
                    <h3>Артефакты</h3>
                    <p>Мощные предметы, которые остаются на поле боя и оказывают постоянный эффект.</p>
                </div>
            </div>
            
            <div class="bloc-rule">
                <img src="deck/tactic.png" alt="Тактики" class="rule-modal__image">
                <div class="cards">
                    <h3>Тактики</h3>
                    <p>Стратегические карты, которые меняют правила игры или дают особые преимущества.</p>
                </div>
            </div>
        `
    },
    rows: {
        title: 'Боевые ряды',
        description: 'Размещение карт на поле боя',
        type: 'rule',
        content: `
            <p style="text-align: center;">Поле боя разделено на три ряда, каждый для определённого типа карт.</p>
            
            <div class="bloc-rule">
                <img src="deck/close-row.png" alt="Ближний бой" class="rule-modal__image">
                <div>
                    <h3>Ближний бой</h3>
                    <p>Первый ряд для карт ближнего боя. Эти отряды сражаются в непосредственной близости от противника.</p>
                </div>
            </div>
            
            <div class="bloc-rule">
                <img src="deck/ranged-row.png" alt="Дальний бой" class="rule-modal__image">
                <div>
                    <h3>Дальний бой</h3>
                    <p>Второй ряд для карт дальнего боя. Стрелки и лучники атакуют с расстояния.</p>
                </div>
            </div>
            
            <div class="bloc-rule">
                <img src="deck/siege-row.png" alt="Осадные ряд" class="rule-modal__image">
                <div>
                    <h3>Осадные орудия</h3>
                    <p>Третий ряд для осадных орудий и магов. Эти карты имеют особые способности или высокую силу.</p>
                </div>
            </div>
            
            <div class="bloc-rule">
                <img src="deck/any-row.png" alt="Гибрид" class="rule-modal__image">
                <div>
                    <h3>Гибрид</h3>
                    <p>Возможно размещение в любом из доступных рядов. Гибкие отряды, которые адаптируются к ситуации.</p>
                </div>
            </div>
        `
    },
    strategy: {
        title: 'Стратегия',
        description: 'Советы по построению колоды и тактике',
        type: 'instruction',
        content: `
            <p style="text-align: center;">Успех в Гвинте зависит не только от карт, но и от правильной стратегии.</p>
            
            <div class="bloc-rule">
                <div>
                    <h3>Построение колоды</h3>
                    <p>Баланс между картами отрядов и специальными картами. Старайтесь включать в колоду карты с разной силой и способностями.</p>
                    <p><strong>Совет:</strong> Оптимальное соотношение - 20-25 карт в колоде, включая 3-5 специальных карт.</p>
                </div>
            </div>
            
            <div class="bloc-rule">
                <div>
                    <h3>Управление картами</h3>
                    <p>Когда пасовать, когда играть агрессивно. Иногда лучше проиграть раунд, чтобы сохранить сильные карты для следующего.</p>
                    <p><strong>Совет:</strong> Не используйте все сильные карты в первом раунде. Сохраняйте некоторые для решающего третьего раунда.</p>
                </div>
            </div>
            
            <div class="bloc-rule">
                <div>
                    <h3>Контроль раундов</h3>
                    <p>Стратегия победы в двух из трех раундов. Помните, что нужно выиграть только два раунда.</p>
                    <p><strong>Совет:</strong> Если вы выиграли первый раунд, можно сэкономить карты во втором, чтобы иметь преимущество в третьем.</p>
                </div>
            </div>
            
            <div class="bloc-rule">
                <div>
                    <h3>Адаптация к противнику</h3>
                    <p>Изменение тактики в зависимости от фракции противника. Каждая фракция имеет свои сильные и слабые стороны.</p>
                    <p><strong>Совет:</strong> Против Нильфгаарда старайтесь не допускать равного счёта в раундах.</p>
                </div>
            </div>
        `
    },
    synergy: {
        title: 'Синергия',
        description: 'Взаимодействие карт друг с другом',
        type: 'instruction',
        content: `
            <p style="text-align: center;">Некоторые карты работают лучше вместе, создавая мощные комбинации.</p>
            
            <div class="bloc-rule">
                <div>
                    <h3>Примеры синергии:</h3>
                    <p><strong>Ледяной великан + Трескучий мороз:</strong> Ледяной великан усиливается от погодных эффектов, а Трескучий мороз ослабляет всех противников.</p>
                </div>
            </div>
            
            <div class="bloc-rule">
                <div>
                    <h3>Как создать синергию:</h3>
                    <p>1. Изучите способности своих карт</p>
                    <p>2. Ищите карты, которые усиливают друг друга</p>
                    <p>3. Стройте колоду вокруг определённой стратегии</p>
                    <p>4. Тестируйте комбинации на практике</p>
                </div>
            </div>
        `
    },
    mulligan: {
        title: 'Муллиган',
        description: 'Замена карт перед началом раунда',
        type: 'instruction',
        content: `
            <p style="text-align: center;">Муллиган - важная фаза, которая может определить успех в раунде.</p>
            
            <div class="bloc-rule">
                <div>
                    <h3>Что такое Муллиган?</h3>
                    <p>Фаза перед началом первого раунда, во время которой происходит замена карт в руке. Вы можете заменить до 2 карт.</p>
                </div>
            </div>
            
            <div class="bloc-rule">
                <div>
                    <h3>Советы:</h3>
                    <p>• Всегда заменяйте карты с самой низкой силой</p>
                    <p>• Оставляйте карты с синергией</p>
                </div>
            </div>
        `
    },
    beginner: {
        title: 'Для новичков',
        description: 'Основы игры и первые шаги',
        type: 'instruction',
        content: `
            <p style="text-align: center;">Добро пожаловать в мир Гвинта! Вот несколько советов для начала.</p>
            
            <div class="bloc-rule">
                <div>
                    <h3>Основные правила:</h3>
                    <p>1. Игра состоит из трёх раундов</p>
                    <p>2. Чтобы победить, нужно выиграть два раунда</p>
                    <p>3. Сила карт суммируется в каждом ряду</p>
                    <p>4. Игрок с большей общей силой выигрывает раунд</p>
                </div>
            </div>
            
            <div class="bloc-rule">
                <div>
                    <h3>Первые шаги:</h3>
                    <p>1. Изучайте карты и их способности</p>
                    <p>2. Тренируйтесь против AI</p>
                </div>
            </div>
            
            <div class="bloc-rule">
                <div>
                    <h3>Частые ошибки новичков:</h3>
                    <p>• Использование всех сильных карт в первом раунде</p>
                    <p>• Игнорирование способностей карт</p>
                    <p>• Неправильное размещение карт в рядах</p>
                </div>
            </div>
        `
    },
};

const rulesModule = {
    escapeHandler: null,
    currentSection: null,

    initRulesPage: function() {
        this.createRulesPageHTML();     
        this.setupRulesEventListeners(); 
        this.showRulesPage();           
    },

    createRulesPageHTML: function() {
        const rulesPage = document.createElement('div');
        rulesPage.className = 'rules-page';
        rulesPage.innerHTML = `
            <div class="rules-title">ПРАВИЛА И ИНСТРУКЦИИ</div>
            <div class="rules-container">
                <div class="rules-sidebar">
                    <div class="rules-sections">
                        <h3>ПРАВИЛА</h3>
						<div class="section-divider"></div>
                        <div class="rules-list" id="rulesList">
                            ${this.generateRulesList('rule')}
                        </div>
                    </div>
                    
                    <div class="instructions">
                        <h3>ИНСТРУКЦИИ</h3>
						<div class="section-divider"></div>
                        <div class="rules-list" id="instructionsList">
                            ${this.generateRulesList('instruction')}
                        </div>
                    </div>
                </div>
                
                <div class="rules-content" id="rulesContent">
                    <div class="no-content-selected">
                        <div>Выберите раздел для просмотра информации</div>
                        <div style="font-size: 14px; margin-top: 10px;">Нажмите на любой пункт в левой части</div>
                    </div>
                    ${this.generateContentSections()}
                </div>
            </div>
        `;
        document.body.appendChild(rulesPage);
        this.createRuleModal();
    },

    generateRulesList: function(type) {
        return Object.values(rulesData)
            .filter(rule => rule.type === type)
            .map(rule => `
                <div class="rule-item" data-rule="${rule.title}">
                    <div class="rule-item__title">${rule.title}</div>
                    <div class="rule-item__description">${rule.description}</div>
                </div>
            `).join('');
    },

    generateContentSections: function() {
        return Object.values(rulesData).map(rule => `
            <div class="content-section" id="content-${rule.title}">
                <div class="rule-modal__title">${rule.title}</div>
                <div class="rule-modal__content">
                    ${rule.content}
                </div>
            </div>
        `).join('');
    },

    createRuleModal: function() {
        const ruleModal = document.createElement('div');
        ruleModal.className = 'rule-modal-overlay';
        ruleModal.innerHTML = `
            <div class="rule-modal" id="ruleModal">
                <div class="rule-modal__title" id="ruleModalTitle"></div>
                <div class="rule-modal__content" id="ruleModalContent"></div>
            </div>
        `;
        document.body.appendChild(ruleModal);
    },

    setupRulesEventListeners: function() {
        // Обработчики для пунктов правил
        document.querySelectorAll('.rule-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const ruleTitle = e.currentTarget.dataset.rule;
                this.showContent(ruleTitle);
                audioManager.playSound('button');
            });
            
            item.addEventListener('mouseenter', () => {
                audioManager.playSound('touch');
            });
        });

        // Закрытие модального окна
        document.querySelector('.rule-modal-overlay').addEventListener('click', (e) => {
            if (e.target.classList.contains('rule-modal-overlay')) {
                this.hideRuleModal();
            }
        });
        
        this.setupEscapeHandler();
    },

    setupEscapeHandler: function() {
        if (this.escapeHandler) {
            document.removeEventListener('keydown', this.escapeHandler);
        }  
        this.escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.handleEscape();
            }
        };   
        document.addEventListener('keydown', this.escapeHandler);
    },

    handleEscape: function() {
        if (this.isRuleModalOpen()) {
            this.hideRuleModal();
        } 
        else {
            this.hideRulesPage();
        }
    },

    isRuleModalOpen: function() {
        const modalOverlay = document.querySelector('.rule-modal-overlay');
        return modalOverlay && modalOverlay.classList.contains('active');
    },

    showContent: function(ruleTitle) {
        // Убираем активный класс у всех пунктов
        document.querySelectorAll('.rule-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Добавляем активный класс к выбранному пункту
        const activeItem = document.querySelector(`.rule-item[data-rule="${ruleTitle}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
        
        // Скрываем все секции контента
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Показываем выбранную секцию
        const contentSection = document.getElementById(`content-${ruleTitle}`);
        if (contentSection) {
            contentSection.classList.add('active');
        }
        
        // Скрываем сообщение "выберите раздел"
        const noContent = document.querySelector('.no-content-selected');
        if (noContent) {
            noContent.style.display = 'none';
        }
        
        this.currentSection = ruleTitle;
    },

    showRulesPage: function() {
        const rulesPage = document.querySelector('.rules-page');
        rulesPage.classList.add('active');     
        setTimeout(() => {
            rulesPage.style.opacity = '1';
        }, 50);     
        this.setupEscapeHandler();
    },

    hideRulesPage: function() {
        const rulesPage = document.querySelector('.rules-page');
        rulesPage.style.opacity = '0';      
        setTimeout(() => {
            rulesPage.classList.remove('active');
            if (this.escapeHandler) {
                document.removeEventListener('keydown', this.escapeHandler);
                this.escapeHandler = null;
            }
        }, 300);
        
        audioManager.playSound('button');
    },

    showRuleModal: function(ruleTitle) {
        const rule = Object.values(rulesData).find(r => r.title === ruleTitle);
        if (!rule || !rule.content) return;
        const modalOverlay = document.querySelector('.rule-modal-overlay');
        const titleElement = document.getElementById('ruleModalTitle');
        const contentElement = document.getElementById('ruleModalContent');
        titleElement.textContent = rule.title;
        contentElement.innerHTML = rule.content;
        modalOverlay.classList.add('active');
        this.setupEscapeHandler();
    },

    hideRuleModal: function() {
        const modalOverlay = document.querySelector('.rule-modal-overlay');
        modalOverlay.classList.remove('active');
        audioManager.playSound('button');
    }
};

window.rulesModule = rulesModule;