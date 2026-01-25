const rulesData = {
    interaction: {
        title: 'Взаимодействие и управление',
        description: 'Управление игрой и интерфейсом',
        type: 'instruction',
        content: `
            <p style="text-align: center;">Основные элементы управления и взаимодействия с игровым интерфейсом</p>
            
            <div class="bloc-rule">
                <div>
                    <h3>Сбор колоды</h3>
                    <ul>
                        <li><strong>ЛКМ (Левая кнопка мыши):</strong> Выбор карты - карта автоматически перемещается в колоду</li>
                        <li><strong>ПКМ (Правая кнопка мыши):</strong> Просмотр подробной информации о карте</li>
                    </ul>
                </div>
            </div>
            
            <div class="bloc-rule">
                <div>
                    <h3>Взаимодействие с картами на поле</h3>
                    <ul>
                        <li><strong>ЛКМ:</strong> Выбор карты для размещения на поле боя</li>
                        <li><strong>ПКМ:</strong> Просмотр подробной информации о карте на поле</li>
                    </ul>
                </div>
            </div>
            
            <div class="bloc-rule">
                <div>
                    <h3>Размещение карт на поле боя</h3>
                    <ul>
                        <li>После выбора карты доступные ряды будут подсвечены</li>
                        <li>Для размещения карты в ряду достаточно нажать на сам ряд</li>
                        <li>Для размещения в определённой позиции в ряду необходимо нажать справа, слева или между уже размещёнными картами</li>
                    </ul>
                </div>
            </div>
            
            <div class="bloc-rule">
                <div>
                    <h3>Общее управление</h3>
                    <ul>
                        <li><strong>Esc:</strong> Возврат в меню или к предыдущему экрану</li>
                        <li><strong>Клик вне окна:</strong> Закрытие модального окна и окна подробной информации</li>
                    </ul>
                </div>
            </div>
            
            <div class="bloc-rule">
                <div>
                    <h3>Сохранение и загрузка колоды</h3>
                    <ul>
                        <li>Возможно сохранение колоды в локальный файл</li>
                        <li>Возможна загрузка колоды из локального файла</li>
                        <li><strong>Важно:</strong> Каждая фракция имеет отдельные файлы сохранения. Нельзя загрузить колоду дргой фракции</li>
                        <li>Файлы сохраняются в формате JSON</li>
                    </ul>
                </div>
            </div>
        `
    },
    synergy: {
        title: 'Синергия карт',
        description: 'Взаимодействие карт друг с другом',
        type: 'instruction',
        content: `
            <p style="text-align: center;">Некоторые карты работают лучше вместе, создавая мощные комбинации, которые могут решить исход матча</p>
            
            <div class="bloc-rule">
                <div>
                    <h3>Примеры синергий</h3>
                    
                    <h4>Монстры</h4>
                    <ul>
                        <li><strong>Ледяной великан + Трескучий мороз:</strong> В отличии от других отрядов, Ледяной великан усиливается от погодных эффектов</li>
                    </ul>
                </div>
            </div>
            
            <div class="bloc-rule">
                <div>
                    <h3>Как создавать синергии</h3>
                    <ol>
                        <li><strong>Изучите способности:</strong> Внимательно читайте описание каждой карты</li>
                        <li><strong>Ищите ключевые теги:</strong> Карты с одинаковыми ключевыми словами часто хорошо сочетаются</li>
                    </ol>
                </div>
            </div>
            
            <div class="bloc-rule">
                <div>
                    <h3>Типы синергий</h3>
                    <ul>
                        <li><strong>Прямое усиление:</strong> Одна карта напрямую усиливает другую</li>
                        <li><strong>Условный бонус:</strong> Карты дают бонусы при выполнении условий</li>
                    </ul>
                </div>
            </div>
        `
    },
    
	faction: {
        title: 'Фракции',
        description: 'Противоборствующие фракции и их особенности',
        type: 'rule',
        content: `
            <p style="text-align: center;">У каждой фракции своя история, культура и уникальные способы ведения боя</p>
            
            <div class="bloc-rule">
                <img src="faction/nilfgaard/logo_faction.png" alt="Нильфгаард" class="rule-modal__image">
                <div class="faction">
                    <h3>Нильфгаард</h3>
                    <p><strong>Описание:</strong> Великая Южная Империя, самое большое, многонаселённое и могущественное государство Континента. Известна своей дисциплиной, технологиями и безжалостной эффективностью.</p>
                    <p style="color: #6a66d3; font-style: italic;"><strong>Способность фракции:</strong> При равном счёте по окончании раунда победа засчитывается игравшему данной фракцией.</p>
                </div>
            </div>
            
            <div class="bloc-rule">
                <img src="faction/realms/logo_faction.png" alt="Королевства Севера" class="rule-modal__image">
                <div class="faction">
                    <h3>Королевства Севера</h3>
                    <p><strong>Описание:</strong> Союз независимых северных королевств, славящихся мощной пехотой, смертоносной военной техникой и отважными военачальниками.</p>
                    <p style="color: #6a66d3; font-style: italic;"><strong>Способность фракции:</strong> На этапе Муллигана может заменить до 3 карт (вместо стандартных 2).</p>
                </div>
            </div>
            
            <div class="bloc-rule">
                <img src="faction/monsters/logo_faction.png" alt="Чудовища" class="rule-modal__image">                
                <div class="faction">
                    <h3>Чудовища</h3>
                    <p><strong>Описание:</strong> Орды ужасных существ, подчиняющихся звериным инстинктам. Ради силы готовы поглотить даже своих собратьев.</p>
                    <p style="color: #6a66d3; font-style: italic;"><strong>Способность фракции:</strong> По завершении каждого раунда на поле сохраняется 1 случайная разыгранная карта.</p>
                </div>
            </div>
            
            <div class="bloc-rule">
                <img src="faction/scoiatael/logo_faction.png" alt="Скоя'таэли" class="rule-modal__image"> 
                <div class="faction">
                    <h3>Скоя'таэли</h3>
                    <p><strong>Описание:</strong> Повстанцы-нелюди (эльфы и краснолюды), сражающиеся за свободу и свои права против королевств Севера.</p>
                    <p style="color: #6a66d3; font-style: italic;"><strong>Способность фракции:</strong> За фракцией закреплено право выбора первого хода в каждом раунде.</p>
                </div>
            </div>
            
            <div class="bloc-rule">	
                <img src="faction/skellige/logo_faction.png" alt="Скеллиге" class="rule-modal__image">	
                <div class="faction">
                    <h3>Скеллиге</h3>
                    <p><strong>Описание:</strong> Суровые островные воины, для которых раны и потери лишь придают сил в бою. Верят в загробную жизнь и славную смерть.</p>
                    <p style="color: #6a66d3; font-style: italic;"><strong>Способность фракции:</strong> В третьем раунде две случайные карты из Сброса возвращаются в руку.</p>
                </div>
            </div>

            <div class="bloc-rule">	
                <img src="faction/syndicate/logo_faction.png" alt="Синдикат" class="rule-modal__image">	
                <div class="faction">
                    <h3>Синдикат</h3>
                    <p><strong>Описание:</strong> Преступная организация Новиграда, где главная валюта - корона. Сражаются не за идеалы, а за богатство.</p>
                    <p style="color: #6a66d3; font-style: italic;"><strong>Способность фракции:</strong> Отменяет фазу Муллиганы противника в первом раунде.</p>
                </div>
            </div> 

            <div class="bloc-rule">	
                <img src="faction/neutral/logo_faction.png" alt="Нейтралитет" class="rule-modal__image">	
                <div class="faction">
                    <h3>Нейтральные карты</h3>
                    <p><strong>Описание:</strong> Карты, не принадлежащие ни одной фракции: ведьмаки, маги, монстры-одиночки и легендарные персонажи.</p>
                    <p style="color: #6a66d3; font-style: italic;"><strong>Особенность:</strong> Могут быть добавлены в колоду любой фракции (ограничение: не более 5 нейтральных карт в колоде).</p>
                </div>
            </div>
        `
    },
    deckBuilding: {
        title: 'Сбор колоды',
        description: 'Правила и ограничения при создании колоды',
        type: 'rule',
        content: `
            <p style="text-align: center;">Правила составления колоды определяют баланс и разнообразие игры</p>
            
            <div class="bloc-rule">
                <div>
                    <h3>Ограничения по количеству карт</h3>
                    <ul>
                        <li><strong>Кол-во всех карт в колоде:</strong> 15-25 карт</li>
                        <li><strong>Мин. кол-во карт отрядов:</strong> 10 карт</li>
                        <li><strong>Кол-во специальных карт:</strong> 3-5 карты</li>
                    </ul>
                </div>
            </div>
            
            <div>
				<h3>Типы карт в колоде</h3>
            
            <div class="bloc-rule">
                <img src="deck/unit.png" alt="Отряды" class="rule-modal__image">
                <div class="cards">
                    <h3>Отряды</h3>
                    <p><strong>Описание:</strong> Основные боевые единицы, которые размещаются на поле боя и имеют силу атаки.</p>
                    <p><strong>Особенности:</strong></p>
                    <ul>
                        <li>Имеют числовое значение силы (от 1 до 15)</li>
                        <li>Размещаются в одном из трёх боевых рядов</li>
                        <li>Могут иметь специальные способности</li>
                        <li>Остаются на поле до конца раунда</li>
                    </ul>
                </div>
            </div>
            
            <div class="bloc-rule">
                <img src="deck/special.png" alt="Специальные" class="rule-modal__image">
                <div class="cards">
                    <h3>Специальные</h3>
                    <p><strong>Описание:</strong> Карты, которые оказывают немедленный эффект и затем отправляются в сброс.</p>
                    <p><strong>Особенности:</strong></p>
                    <ul>
                        <li>Не имеют силы и не размещаются на поле (за исключением погодных карт и Чучела)</li>
                        <li>Активируются мгновенно при розыгрыше</li>
                        <li>Могут наносить урон, усиливать, лечить или применять погодные эффекты</li>
                    </ul>
                </div>
            </div>
            
            <div class="bloc-rule">
                <img src="deck/artifact.png" alt="Артефакты" class="rule-modal__image">
                <div class="cards">
                    <h3>Артефакты</h3>
                    <p><strong>Описание:</strong> Мощные предметы, которые остаются на поле боя и оказывают постоянный эффект.</p>
                    <p><strong>Особенности:</strong></p>
                    <ul>
                        <li>Размещаются на поле</li>
                        <li>Занимают место в боевых рядах</li>
                        <li>Эффект действует до конца раунда или пока артефакт не будет уничтожен</li>
                        <li>Могут усиливать отряды, давать пассивные бонусы или особые способности</li>
                    </ul>
                </div>
            </div>
            
            <div class="bloc-rule">
                <img src="deck/tactic.png" alt="Тактики" class="rule-modal__image">
                <div class="cards">
                    <h3>Тактики</h3>
                    <p><strong>Описание:</strong> Стратегические карты, которые меняют правила игры или дают особые преимущества.</p>
                    <p><strong>Особенности:</strong></p>
                    <ul>
                        <li>Могут изменять правила боя, давать дополнительные ходы или ресурсы</li>
                        <li>Некоторые тактики остаются в игре на несколько раундов</li>
                    </ul>
                </div>
            </div>
            </div>
        `
    },
    rows: {
        title: 'Боевые ряды',
        description: 'Размещение карт на поле боя',
        type: 'rule',
        content: `
            <p style="text-align: center;">Поле боя разделено 6 рядов, по 3 для игрока и противника</p>
            
            <div class="bloc-rule">
                <img src="deck/close-row.png" alt="Ближний бой" class="rule-modal__image">
                <div>
                    <h3>Ближний бой</h3>
                    <p><strong>Описание:</strong> Первый ряд для карт ближнего боя.</p>
                    <p><strong>Типичные отряды:</strong></p>
                    <ul>
                        <li>Пехота</li>
                        <li>Рыцари</li>
                        <li>Воины с мечами и топорами</li>
                        <li>Некоторые монстры</li>
                    </ul>
                    <p><strong>Особенности:</strong> Часто имеют высокую силу.</p>
                </div>
            </div>
            
            <div class="bloc-rule">
                <img src="deck/ranged-row.png" alt="Дальний бой" class="rule-modal__image">
                <div>
                    <h3>Дальний бой</h3>
                    <p><strong>Описание:</strong> Второй ряд для карт дальнего боя.</p>
                    <p><strong>Типичные отряды:</strong></p>
                    <ul>
                        <li>Лучники</li>
                        <li>Арбалетчики</li>
                        <li>Маги-атакеры</li>
                        <li>Некоторые эльфийские отряды</li>
                    </ul>
                    <p><strong>Особенности:</strong> Часто имеют среднюю силу.</p>
                </div>
            </div>
            
            <div class="bloc-rule">
                <img src="deck/siege-row.png" alt="Осадные ряд" class="rule-modal__image">
                <div>
                    <h3>Осадные орудия</h3>
                    <p><strong>Описание:</strong> Третий ряд для осадных орудий, инженеров и поддержки.</p>
                    <p><strong>Типичные отряды:</strong></p>
                    <ul>
                        <li>Катапульты</li>
                        <li>Баллисты</li>
                        <li>Инженеры</li>
                        <li>Маги поддержки</li>
                        <li>Некоторые механизмы</li>
                    </ul>
                    <p><strong>Особенности:</strong> Часто имеют низкую/среднюю силу.</p>
                </div>
            </div>
            
            <div class="bloc-rule">
                <img src="deck/any-row.png" alt="Гибрид" class="rule-modal__image">
                <div>
                    <h3>Гибридные отряды</h3>
                    <p><strong>Описание:</strong> Возможно размещение в любом из доступных рядов. Гибкие отряды, которые адаптируются к ситуации.</p>
                    <p><strong>Типичные отряды:</strong></p>
                    <ul>
                        <li>Разведчики</li>
                        <li>Кавалерия</li>
                        <li>Некоторые монстры</li>
                        <li>Элитные отряды</li>
                    </ul>
                    <p><strong>Особенности:</strong> Позволяют гибко реагировать на тактику противника.</p>
                </div>
            </div>
            
            <div class="bloc-rule">
                <div>
                    <h3>Правила размещения</h3>
                    <ul>
                        <li>Каждый ряд вмещает до 10 карт отрядов</li>
                        <li>Артефакты тоже занимают место в рядах</li>
                        <li>Специальные карты не размещаются на поле</li>
                        <li>Некоторые способности карт могут изменять правила размещения</li>
                        <li>Ряды могут быть усилены или ослаблены погодными эффектами</li>
                    </ul>
                </div>
            </div>
        `
    },
    preparation: {
        title: 'Подготовительные этапы',
        description: 'Этапы перед началом сражения',
        type: 'rule',
        content: `
            <p style="text-align: center;">Перед началом основного сражения происходят несколько важных подготовительных этапов</p>
            
            <div class="bloc-rule">
                <div>
                    <h3>1. Определение первого хода</h3>
                    <p><strong>Процесс:</strong> Случайное определение очерёдности хода путём подбрасывания монеты.</p>
                    <p><strong>Результат:</strong></p>
                    <ul>
                        <li>Крепость: Игрок ходит первым в первом раунде</li>
                        <li>Факел: Противник ходит первым в первом раунде</li>
                    </ul>
                    <p><strong>Особенности:</strong> В следующих раундах первым ходит проигравший предыдущий раунд.</p>
                </div>
            </div>
            
            <div class="bloc-rule">
                <div>
                    <h3>2. Стартовая раздача</h3>
                    <p><strong>Процесс:</strong> Каждому игроку раздаётся 10 случайных карт из собранной колоды.</p>
                    
                    <h4>Особеность раздачи в разных режимах игры:</h4>
                    <div class="bloc-rule">
                        <div>
                            <h5>Классический режим</h5>
                            <ul>
                                <li>10 карт со стартовой раздачи на всю игру</li>
                                <li>Дополнительные карты не добираются</li>
                                <li>Стратегия требует тщательного планирования всех трёх раундов</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="bloc-rule">
                        <div>
                            <h5>Режим CD Project Red</h5>
                            <ul>
                                <li>Стартовая раздача: 10 карт</li>
                                <li>В каждом раунде добор 3-х карт, максимольно до 10 в руке</li>
                                <li>Добор происходит в начале каждого раунда</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="bloc-rule">
                <div>
                    <h3>3. Муллиган</h3>
                    <p><strong>Что это:</strong> Фаза замены карт перед началом первого раунда.</p>
                    <p><strong>Правила:</strong></p>
                    <ul>
                        <li>Каждый игрок может заменить до 2 карт из стартовой руки</li>
                        <li>Заменённые карты возвращаются в колоду</li>
                        <li>Вместо них берутся случайные карты из колоды</li>
                    </ul>
                    
                    <h4>Особенности фракций:</h4>
                    <ul>
                        <li><strong>Королевства Севера:</strong> Могут заменить до 3 карт</li>
                        <li><strong>Синдикат:</strong> Может отменить Муллиган противника в первом раунде</li>
                        <li><strong>Другие фракции:</strong> Стандартные 2 замены</li>
                    </ul>
                </div>
            </div>
        `
    },
    battle: {
        title: 'Сражение',
        description: 'Основные правила ведения боя',
        type: 'rule',
        content: `
            <p style="text-align: center;">Основные принципы и правила сражения</p>
            
            <div class="bloc-rule">
                <div>
                    <h3>Структура матча</h3>
                    <ul>
                        <li>Матч состоит из <strong>трёх раундов</strong></li>
                        <li>Для победы в матче необходимо выиграть <strong>два раунда</strong></li>
                        <li>Каждый раунд продолжается до тех пор, пока оба игрока не пропустят ход (пас)</li>
                        <li>После каждого раунда поле очищается, но некоторые карты и эффекты могут сохраняться</li>
                    </ul>
                </div>
            </div>
            
            <div class="bloc-rule">
                <div>
                    <h3>Очерёдность ходов</h3>
                    <ul>
                        <li>Игроки ходят по очереди</li>
                        <li>В первом раунде очерёдность определяется монеткой</li>
                        <li>В последующих раундах первым ходит проигравший предыдущий раунд</li>
                        <li>За один ход можно разыграть одну карту</li>
                    </ul>
                </div>
            </div>
            
            <div class="bloc-rule">
                <div>
                    <h3>Определение победителя раунда</h3>
                    <ul>
                        <li>Сила всех карт на поле каждого игрока суммируется</li>
                        <li>Игрок с большей общей силой выигрывает раунд</li>
                        <li>При равной силе раунд считается ничейным</li>
                        <li><strong>Особенность Нильфгаарда:</strong> При ничьей победа засчитывается Нильфгаарду</li>
                    </ul>
                </div>
            </div>
            
            <div class="bloc-rule">
                <div>
                    <h3>Пас (Пропуск хода)</h3>
                    <ul>
                        <li>Игрок может объявить пас в любой свой ход</li>
                        <li>После паса игрок больше не может разыгрывать карты в этом раунде</li>
                        <li>Раунд продолжается, пока оба игрока не объявят пас</li>
                    </ul>
                </div>
            </div>
            
            <div class="bloc-rule">
                <div>
                    <h3>Особые правила</h3>
                    <ul>
                        <li>Максимальное количество карт в руке: 10</li>
                        <li>Эффекты карт применяются в порядке их розыгрыша</li>
                    </ul>
                </div>
            </div>
            
            <div class="bloc-rule">
                <div>
                    <h3>Конец матча</h3>
                    <ul>
                        <li>Матч заканчивается, когда один из игроков выигрывает два раунда</li>
                        <li>Если после трёх раундов счёт равный, объявляется ничья</li>
                    </ul>
                </div>
            </div>
        `
    },
    
	glossary: {
        title: 'Термины и понятия',
        description: 'Словарь основных терминов',
        type: 'glossary',
        content: `
            <p style="text-align: center;">Словарь основных терминов, которые помогут лучше понимать игру.</p>
            
            <div class="bloc-rule">
                <div>
                    <h3>Основные термины</h3>
                    <ul>
                        <li><strong>Колода:</strong> Набор карт игрока</li>
                        <li><strong>Фракция:</strong> Одна из семи групп карт со своими особенностями</li>
                        <li><strong>Сила:</strong> Числовое значение карты, определяющее её вклад в раунд</li>
                    </ul>
                </div>
            </div>
            
            <div class="bloc-rule">
                <div>
                    <h3>Игровое поле</h3>
                    <ul>
                        <li><strong>Колода:</strong> Неразыгранные карты</li>
                        <li><strong>Рука:</strong> Карты, которые может разыграть</li>
                        <li><strong>Поле:</strong> Область, где размещаются карты отрядов и артефактов</li>
                        <li><strong>Сброс:</strong> Карты, которые были разыграны в предыдущем раунде или уничтожены</li>
                        <li><strong>Удаление:</strong> Карты, удалённые из сражения полностью, минуя Сброс</li>
                    </ul>
                </div>
            </div>
            
            <div class="bloc-rule">
                <div>
                    <h3>Игровые действия</h3>
                    <ul>
                        <li><strong>Пас:</strong> Пропуск хода, после которого игрок не может играть в этом раунде</li>
                        <li><strong>Муллиган:</strong> Замена карт в стартовой руке перед первым раундом</li>
                        <li><strong>Добор:</strong> Взятие карты из колоды в руку</li>
                    </ul>
                </div>
            </div>
            
            <div class="bloc-rule">
                <div>
                    <h3>Стратегические термины</h3>
                    <ul>
                        <li><strong>Адвантаж:</strong> Преимущество в количестве карт в руке</li>
                        <li><strong>Драй-Пас:</strong> Пас на пустой стол, с целью выманить у противника карту в текущем раунде</li>
                        <li><strong>Синергия:</strong> Взаимное усиление карт при совместном использовании</li>
                    </ul>
                </div>
            </div>
        `
    }
	
};

const rulesModule = {
	
    escapeHandler: null,
    currentSection: null,

    initRulesPage: function() {
        this.createRulesPageHTML();     
        this.setupRulesEventListeners(); 
        this.showRulesPage();           
    },
    
    resetRulesState: function() {
        const activeItems = document.querySelectorAll('.rule-item.active');
        const activeSections = document.querySelectorAll('.content-section.active');
        const noContent = document.querySelector('.no-content-selected');
        
        activeItems.forEach(item => item.classList.remove('active'));
        activeSections.forEach(section => section.classList.remove('active'));
        
        if (noContent) {
            noContent.style.display = 'flex';
        }
        
        const rulesContent = document.getElementById('rulesContent');
        if (rulesContent) {
            rulesContent.scrollTop = 0;
        }
        
        this.currentSection = null;
    },
    
    createRulesPageHTML: function() {
        const existingPage = document.querySelector('.rules-page');
        if (existingPage) {
            existingPage.remove();
        }
        
        const existingModal = document.querySelector('.rule-modal-overlay');
        if (existingModal) {
            existingModal.remove();
        }
        
        const rulesPage = document.createElement('div');
        rulesPage.className = 'rules-page';
        rulesPage.innerHTML = `
            <button class="back-to-menu-btn" id="backToMenuBtn">НАЗАД</button>
            <div class="rules-title">ПРАВИЛА И ИНСТРУКЦИИ</div>
            <div class="rules-container">
                <div class="rules-sidebar">
                    <div class="instructions">
                        <h3>ИНСТРУКЦИИ</h3>
                        <div class="section-divider"></div>
                        <div class="rules-list" id="instructionsList">
                            ${this.generateRulesList('instruction')}
                        </div>
                    </div>
                    <div class="rules-sections">
                        <h3>ПРАВИЛА</h3>
                        <div class="section-divider"></div>
                        <div class="rules-list" id="rulesList">
                            ${this.generateRulesList('rule')}
                        </div>
                    </div>
                    <div class="rules-sections">
                        <h3>ГЛОСАРИЙ</h3>
                        <div class="section-divider"></div>
                        <div class="rules-list" id="glossary">
                            ${this.generateRulesList('glossary')}
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
        const backButton = document.getElementById('backToMenuBtn');
        if (backButton) {
            backButton.addEventListener('click', () => {
                this.hideRulesPage();
            });
            
            backButton.addEventListener('mouseenter', () => {
                if (audioManager && audioManager.soundEnabled) {
                    audioManager.playSound('touch');
                }
            });
        }
        
        document.querySelectorAll('.rule-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const ruleTitle = e.currentTarget.dataset.rule;
                this.showContent(ruleTitle);
                if (audioManager && audioManager.soundEnabled) {
                    audioManager.playSound('button');
                }
            });
            
            item.addEventListener('mouseenter', () => {
                if (audioManager && audioManager.soundEnabled) {
                    audioManager.playSound('touch');
                }
            });
        });

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
        } else {
            this.hideRulesPage();
        }
    },

    showContent: function(ruleTitle) {
        document.querySelectorAll('.rule-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeItem = document.querySelector(`.rule-item[data-rule="${ruleTitle}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
        
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        const contentSection = document.getElementById(`content-${ruleTitle}`);
        if (contentSection) {
            contentSection.classList.add('active');
        }
        
        const noContent = document.querySelector('.no-content-selected');
        if (noContent) {
            noContent.style.display = 'none';
        }
        
        this.currentSection = ruleTitle;
        this.scrollToTop();
    },

    showRuleModal: function(ruleTitle) {
        const rule = Object.values(rulesData).find(r => r.title === ruleTitle);
        if (!rule || !rule.content) return;
        
        const modalOverlay = document.querySelector('.rule-modal-overlay');
        const titleElement = document.getElementById('ruleModalTitle');
        const contentElement = document.getElementById('ruleModalContent');
        
        if (!modalOverlay || !titleElement || !contentElement) return;
        
        titleElement.textContent = rule.title;
        contentElement.innerHTML = rule.content;
        modalOverlay.classList.add('active');
        this.setupEscapeHandler();
    },

    hideRuleModal: function() {
        const modalOverlay = document.querySelector('.rule-modal-overlay');
        if (modalOverlay) {
            modalOverlay.classList.remove('active');
        }
        
        if (audioManager && audioManager.soundEnabled) {
            audioManager.playSound('button');
        }
    },

    scrollToTop: function() {
        const rulesContent = document.getElementById('rulesContent');
        if (!rulesContent) return;
        
        rulesContent.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    },

    showRulesPage: function() {
        const logo = document.querySelector('.logo');
        const menuButtons = document.querySelector('.main-menu-buttons');
        
        if (logo) logo.style.animation = 'fadeOutUp 0.5s ease forwards';
        if (menuButtons) menuButtons.style.animation = 'fadeOutDown 0.5s ease forwards';
        
        setTimeout(() => {
            const startPage = document.querySelector('.start-page');
            if (startPage) {
                startPage.style.opacity = '0';
                setTimeout(() => {
                    startPage.style.display = 'none';
                }, 300);
            }
            
            const rulesPage = document.querySelector('.rules-page');
            if (rulesPage) {
                rulesPage.style.display = 'flex';
                
                setTimeout(() => {
                    rulesPage.classList.add('active');
                    rulesPage.style.opacity = '1';
                }, 50);
            }
            
            this.setupEscapeHandler();
            
        }, 500);
    },

    hideRulesPage: function() {
        const rulesPage = document.querySelector('.rules-page');
        const rulesTitle = document.querySelector('.rules-title');
        const rulesContainer = document.querySelector('.rules-container');
        
        if (!rulesPage) return;
        
        if (rulesTitle) rulesTitle.style.animation = 'fadeOutUp 0.5s ease forwards';
        if (rulesContainer) rulesContainer.style.animation = 'fadeOutDown 0.5s ease forwards';
        
        setTimeout(() => {
            rulesPage.style.opacity = '0';
            
            setTimeout(() => {
                rulesPage.remove();
                
                const modalOverlay = document.querySelector('.rule-modal-overlay');
                if (modalOverlay) modalOverlay.remove();
                
                this.restoreMainMenu();
                
                if (this.escapeHandler) {
                    document.removeEventListener('keydown', this.escapeHandler);
                    this.escapeHandler = null;
                }
                
                this.currentSection = null;
                
            }, 300);
            
        }, 300);
        
        if (audioManager && audioManager.soundEnabled) {
            audioManager.playSound('button');
        }
    },

    restoreMainMenu: function() {
        const startPage = document.querySelector('.start-page');
        if (!startPage) return;
        
        startPage.style.display = 'flex';
        
        setTimeout(() => {
            startPage.style.opacity = '1';
            
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
        }, 100);
    },

    isRuleModalOpen: function() {
        const modalOverlay = document.querySelector('.rule-modal-overlay');
        return modalOverlay && modalOverlay.classList.contains('active');
    },
	
};

window.rulesModule = rulesModule;