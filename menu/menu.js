document.addEventListener('DOMContentLoaded', function() {
    const startPage = document.querySelector('.start-page');
   
    const startPageHTML = `
        <img src="ui/logo.png" alt="Gwent" class="logo">
        <div class="main-menu-buttons">
            <button class="menu-btn play-btn" id="playBtn">ИГРАТЬ</button>
			<button class="menu-btn p2p-btn" id="p2pBtn">ОНЛАЙН</button>
            <button class="menu-btn rules-btn" id="rulesBtn">ПРАВИЛА</button>
            <button class="menu-btn settings-btn" id="settingsBtn">ОПЦИИ</button>
        </div>
    `;
    
    startPage.innerHTML = startPageHTML;
 
    const playBtn = document.getElementById('playBtn');
    const p2pBtn = document.getElementById('p2pBtn');
	const rulesBtn = document.getElementById('rulesBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    
    playBtn.addEventListener('click', function() {
        audioManager.playSound('button');
        animateTransitionToFactionSelection();
    });
    
	p2pBtn.addEventListener('click', function() {
		audioManager.playSound('button');
		
		// Сначала выбираем фракцию для сетевой игры
		window.factionModule.initFactionSelection('p2p');
	});

    rulesBtn.addEventListener('click', function() {
        audioManager.playSound('button');
        window.rulesModule.initRulesPage();
    });
    
    settingsBtn.addEventListener('click', function() {
        audioManager.playSound('button');
        showSettingsModal();
    });
    
    const menuButtons = [playBtn, rulesBtn, settingsBtn];
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
});