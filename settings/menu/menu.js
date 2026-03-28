document.addEventListener('DOMContentLoaded', function() {
    const startPage = document.querySelector('.start-page');
    
    let cachedLogo = null;
    let cachedMenuButtons = null;
    
    const getCachedElements = () => {
        if (!cachedLogo) cachedLogo = document.querySelector('.logo');
        if (!cachedMenuButtons) cachedMenuButtons = document.querySelector('.main-menu-buttons');
        return { logo: cachedLogo, menuButtons: cachedMenuButtons };
    };
   
    const startPageHTML = `
        <img src="ui/logo.png" alt="Gwent" class="logo">
        <div class="main-menu-buttons">
            <button class="menu-btn play-btn" id="playBtn">ИГРАТЬ</button>
            <button class="menu-btn collection-btn" id="collectionBtn">КОЛЛЕКЦИЯ</button>
            <button class="menu-btn rules-btn" id="rulesBtn">ПРАВИЛА</button>
            <button class="menu-btn settings-btn" id="settingsBtn">ОПЦИИ</button>
        </div>
    `;
    
    startPage.innerHTML = startPageHTML;
    
    cachedLogo = document.querySelector('.logo');
    cachedMenuButtons = document.querySelector('.main-menu-buttons');
 
    const buttons = {
        playBtn: document.getElementById('playBtn'),
        collectionBtn: document.getElementById('collectionBtn'),
        rulesBtn: document.getElementById('rulesBtn'),
        settingsBtn: document.getElementById('settingsBtn')
    };
    
    const animateTransition = (callback, delay = 500) => {
        const { logo, menuButtons } = getCachedElements();
        if (logo) logo.style.animation = 'fadeOutUp 0.5s ease forwards';
        if (menuButtons) menuButtons.style.animation = 'fadeOutDown 0.5s ease forwards';
        
        setTimeout(() => {
            const startPageEl = document.querySelector('.start-page');
            if (startPageEl) {
                startPageEl.style.opacity = '0';
                setTimeout(() => {
                    startPageEl.style.display = 'none';
                    if (callback) callback();
                }, 300);
            } else if (callback) {
                callback();
            }
        }, delay);
    };
    
    buttons.playBtn.addEventListener('click', () => {
        audioManager.playSound('button');
        animateTransition(() => window.factionModule?.initFactionSelection());
    });
    
    buttons.collectionBtn.addEventListener('click', () => {
        audioManager.playSound('button');
        animateTransition(() => window.collectionModule?.initCollection());
    });
    
    buttons.rulesBtn.addEventListener('click', () => {
        audioManager.playSound('button');
        window.rulesModule.initRulesPage();
    });
    
    buttons.settingsBtn.addEventListener('click', () => {
        audioManager.playSound('button');
        showSettingsModal();
    });
    
    const menuButtonsList = Object.values(buttons);
    menuButtonsList.forEach(btn => {
        btn?.addEventListener('mouseenter', () => audioManager.playSound('touch'));
    });
});