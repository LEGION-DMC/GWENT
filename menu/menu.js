document.addEventListener('DOMContentLoaded', function() {
    const startPage = document.querySelector('.start-page');
   
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
 
    const playBtn = document.getElementById('playBtn');
    const collectionBtn = document.getElementById('collectionBtn');
    const rulesBtn = document.getElementById('rulesBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    
    playBtn.addEventListener('click', function() {
        audioManager.playSound('button');
        animateTransitionToFactionSelection();
    });
    
    collectionBtn.addEventListener('click', function() {
        audioManager.playSound('button');
        animateTransitionToCollection();
    });
    
    rulesBtn.addEventListener('click', function() {
        audioManager.playSound('button');
        window.rulesModule.initRulesPage();
    });
    
    settingsBtn.addEventListener('click', function() {
        audioManager.playSound('button');
        showSettingsModal();
    });
    
    const menuButtons = [playBtn, rulesBtn, settingsBtn, collectionBtn];
    menuButtons.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            audioManager.playSound('touch');
        });
    });

    function animateTransitionToFactionSelection() {
        const logo = document.querySelector('.logo');
        const menuButtons = document.querySelector('.main-menu-buttons');
        const startPage = document.querySelector('.start-page');
        
        logo.style.animation = 'fadeOutUp 0.5s ease forwards';
        menuButtons.style.animation = 'fadeOutDown 0.5s ease forwards';
        
        setTimeout(() => {
            startPage.style.opacity = '0';
            
            setTimeout(() => {
                startPage.style.display = 'none';
            }, 500);
            
            window.factionModule.initFactionSelection();
        }, 500);
    }
    
    function animateTransitionToCollection() {
        const logo = document.querySelector('.logo');
        const menuButtons = document.querySelector('.main-menu-buttons');
        const startPage = document.querySelector('.start-page');
        
        logo.style.animation = 'fadeOutUp 0.5s ease forwards';
        menuButtons.style.animation = 'fadeOutDown 0.5s ease forwards';
        
        setTimeout(() => {
            startPage.style.opacity = '0';
            
            setTimeout(() => {
                startPage.style.display = 'none';
            }, 500);
            
            if (window.collectionModule && window.collectionModule.initCollection) {
                window.collectionModule.initCollection();
            }
        }, 500);
    }
});