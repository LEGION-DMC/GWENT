document.addEventListener('contextmenu', function(e) {
    let isCard = e.target.closest('.card, .collection-card, .deck-card');
    
    if (!isCard) {
        e.preventDefault();
        return false;
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const startPage = document.querySelector('.start-page');
    
    startPage.innerHTML = `
        <img src="ui/logo.png" alt="Gwent" class="logo">
        <div class="main-menu-buttons">
            <button class="menu-btn play-btn" id="playBtn">ИГРАТЬ</button>
            <button class="menu-btn collection-btn" id="collectionBtn">КОЛЛЕКЦИЯ</button>
            <button class="menu-btn rules-btn" id="rulesBtn">ПРАВИЛА</button>
            <button class="menu-btn settings-btn" id="settingsBtn">ОПЦИИ</button>
        </div>
    `;

    const elements = {
        logo: document.querySelector('.logo'),
        menuButtons: document.querySelector('.main-menu-buttons'),
        playBtn: document.getElementById('playBtn'),
        collectionBtn: document.getElementById('collectionBtn'),
        rulesBtn: document.getElementById('rulesBtn'),
        settingsBtn: document.getElementById('settingsBtn')
    };

    const animateTransition = (callback) => {
        if (elements.logo) {
            elements.logo.style.animation = 'fadeOutUp 0.5s ease forwards';
        }
        if (elements.menuButtons) {
            elements.menuButtons.style.animation = 'fadeOutDown 0.5s ease forwards';
        }

        setTimeout(() => {
            if (startPage) {
                startPage.style.opacity = '0';
                setTimeout(() => {
                    startPage.style.display = 'none';
                    callback?.();
                }, 300);
            } else {
                callback?.();
            }
        }, 500);
    };

    elements.playBtn?.addEventListener('click', () => {
        audioManager.playSound('button');
        animateTransition(() => window.factionModule?.initFactionSelection());
    });

    elements.collectionBtn?.addEventListener('click', () => {
        audioManager.playSound('button');
        animateTransition(() => window.collectionModule?.initCollection());
    });

    elements.rulesBtn?.addEventListener('click', () => {
        audioManager.playSound('button');
        window.rulesModule.initRulesPage();
    });

    elements.settingsBtn?.addEventListener('click', () => {
        audioManager.playSound('button');
        showSettingsModal();
    });

    const menuButtons = [elements.playBtn, elements.collectionBtn, elements.rulesBtn, elements.settingsBtn];
    menuButtons.forEach(btn => {
        btn?.addEventListener('mouseenter', () => audioManager.playSound('touch'));
    });
});