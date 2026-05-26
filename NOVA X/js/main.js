// Inicializar audio cuando el usuario haga clic
document.addEventListener('click', () => {
  if (window.audioManager && !window.audioLoaded) {
    window.audioManager.loadAllAudio();
    window.audioLoaded = true;
    console.log('🎵 Audio inicializado por interacción');
  }
}, { once: true });
// ========== DATOS DEL JUGADOR ==========
let playerData = {
  coins: 5000,
  ship: 0,
  currentLevel: 1,
  bestLevel: 1,
  extraLives: 0,
  hasWeapon: false,
  hasShield: false,
  hasGoldenHeart: false,
  rapidFire: false,
  multiShot: false,
  upgrades: {
    weapon: false,
    extraLife1: false,
    extraLife2: false,
    extraLife3: false,
    shield: false,
    goldenHeart: false,
    rapidFire: false,
    multiShot: false
  }
};

// Naves disponibles
const ships = [
  { id: 0, name: "🚀 NAVE ESTELAR", price: 0, emoji: "🚀", speed: 1.0, health: 1 },
  { id: 1, name: "⚡ FENIX ROJO", price: 800, emoji: "🔥", speed: 1.2, health: 1 },
  { id: 2, name: "💜 NEBULA PRO", price: 1500, emoji: "🪸", speed: 1.1, health: 1 },
  { id: 3, name: "👑 TITAN DE ORO", price: 3000, emoji: "🌟", speed: 1.3, health: 1 }
];

// Items de tienda
const shopItems = [
  { id: "weapon", name: "🔫 SISTEMA DE DISPARO", desc: "Activa el cañón láser", price: 300, owned: false, type: "weapon" },
  { id: "extraLife1", name: "❤️ VIDA EXTRA +1", desc: "1 vida adicional", price: 200, owned: false, type: "life" },
  { id: "extraLife2", name: "❤️❤️ VIDA EXTRA +2", desc: "2 vidas adicionales", price: 500, owned: false, type: "life", requires: "extraLife1" },
  { id: "extraLife3", name: "❤️❤️❤️ VIDA EXTRA +3", desc: "3 vidas adicionales", price: 1000, owned: false, type: "life", requires: "extraLife2" },
  { id: "shield", name: "🛡️ ESCUDO TEMPORAL", desc: "15s de invulnerabilidad", price: 800, owned: false, type: "shield" },
  { id: "goldenHeart", name: "💛 CORAZÓN DORADO", desc: "4ª vida extra", price: 1500, owned: false, type: "golden", requires: "extraLife3" },
  { id: "rapidFire", name: "⚡ DISPARO RÁPIDO", desc: "Dispara más veces por segundo", price: 600, owned: false, type: "weapon" },
  { id: "multiShot", name: "🔫 DISPARO MÚLTIPLE", desc: "Dispara en 3 direcciones", price: 1200, owned: false, type: "weapon", requires: "weapon" }
];

// Funciones de datos
function loadData() {
  const saved = localStorage.getItem('novaX_final');
  if (saved) {
    const data = JSON.parse(saved);
    playerData.coins = data.coins || 0;
    playerData.ship = data.ship || 0;
    playerData.currentLevel = data.currentLevel || 1;
    playerData.bestLevel = data.bestLevel || 1;
    playerData.upgrades = data.upgrades || {
      weapon: false, extraLife1: false, extraLife2: false, extraLife3: false,
      shield: false, goldenHeart: false, rapidFire: false, multiShot: false
    };
    playerData.hasWeapon = playerData.upgrades.weapon || false;
    playerData.hasShield = playerData.upgrades.shield || false;
    playerData.hasGoldenHeart = playerData.upgrades.goldenHeart || false;
    playerData.rapidFire = playerData.upgrades.rapidFire || false;
    playerData.multiShot = playerData.upgrades.multiShot || false;
    playerData.extraLives = (playerData.upgrades.extraLife1 ? 1 : 0) + 
                             (playerData.upgrades.extraLife2 ? 1 : 0) + 
                             (playerData.upgrades.extraLife3 ? 1 : 0) +
                             (playerData.hasGoldenHeart ? 1 : 0);
  }
  updateShopOwned();
  updateMenuStats();
  console.log('📊 Datos cargados:', playerData);
}
// Al cargar la página, preparar música (pero no reproducir hasta interacción)
console.log('✅ main.js cargado correctamente - Haz clic para activar audio');

function saveData() {
  localStorage.setItem('novaX_final', JSON.stringify({
    coins: playerData.coins,
    ship: playerData.ship,
    currentLevel: playerData.currentLevel,
    bestLevel: playerData.bestLevel,
    upgrades: playerData.upgrades
  }));
  console.log('💾 Datos guardados');
}

function updateShopOwned() {
  shopItems.forEach(item => { item.owned = playerData.upgrades[item.id] || false; });
}

function updateMenuStats() {
  document.getElementById('menuCoins').textContent = playerData.coins;
  document.getElementById('menuBestLevel').textContent = playerData.bestLevel;
  if (document.getElementById('shopCoins')) document.getElementById('shopCoins').textContent = playerData.coins;
  if (document.getElementById('hangarCoins')) document.getElementById('hangarCoins').textContent = playerData.coins;
}

function showToast(msg) {
  const toast = document.getElementById('toastMsg');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

// Render Tienda
function renderShop() {
  const container = document.getElementById('shopList');
  if (!container) return;
  document.getElementById('shopCoins').textContent = playerData.coins;
  container.innerHTML = '';
  
  shopItems.forEach(item => {
    const canBuy = !item.owned && playerData.coins >= item.price && (!item.requires || playerData.upgrades[item.requires]);
    const div = document.createElement('div');
    div.className = 'shop-item';
    div.innerHTML = `
      <div class="item-info"><h3>${item.name}</h3><p>${item.desc}</p></div>
      <div>${item.owned ? '<span class="owned-badge">✓ ADQUIRIDO</span>' : `<span class="item-price">🪙 ${item.price}</span><button class="item-btn" ${canBuy ? '' : 'disabled'}>COMPRAR</button>`}</div>
    `;
    if (!item.owned && canBuy) {
      div.querySelector('.item-btn').addEventListener('click', () => {
        playerData.coins -= item.price;
        playerData.upgrades[item.id] = true;
        if (item.type === 'weapon') playerData.hasWeapon = true;
        if (item.type === 'shield') playerData.hasShield = true;
        if (item.type === 'golden') playerData.hasGoldenHeart = true;
        if (item.type === 'rapidFire') playerData.rapidFire = true;
        if (item.type === 'multiShot') playerData.multiShot = true;
        if (item.type === 'life') {
          playerData.extraLives = (playerData.upgrades.extraLife1 ? 1 : 0) + 
                                   (playerData.upgrades.extraLife2 ? 1 : 0) + 
                                   (playerData.upgrades.extraLife3 ? 1 : 0) +
                                   (playerData.hasGoldenHeart ? 1 : 0);
        }
        saveData();
        updateShopOwned();
        renderShop();
        updateMenuStats();
        showToast(`✅ ${item.name} comprado!`);
      });
    }
    container.appendChild(div);
  });
}

// ========== RENDER HANGAR CON IMÁGENES PERSONALIZADAS ==========
function renderHangar() {
  const container = document.getElementById('hangarList');
  if (!container) return;
  document.getElementById('hangarCoins').textContent = playerData.coins;
  container.innerHTML = '';
  
  // ⚠️ RUTAS DE LAS IMÁGENES DE CADA NAVE - MODIFICA AQUÍ SI ES NECESARIO ⚠️
  const shipImages = {
    0: 'assets/images/naves/nave-estelar.png',
    1: 'assets/images/naves/fenix-rojo.png',
    2: 'assets/images/naves/nebula-pro.png',
    3: 'assets/images/naves/titan-oro.png'
  };
  
  ships.forEach((ship) => {
    const isOwned = ship.price === 0 || playerData.ship === ship.id;
    const isEquipped = playerData.ship === ship.id;
    const canBuy = playerData.coins >= ship.price && ship.price > 0;
    const imagePath = shipImages[ship.id];
    
    const div = document.createElement('div');
    div.className = 'shop-item';
    div.style.flexDirection = 'column';
    div.style.alignItems = 'center';
    div.style.padding = '1rem';
    
    // Contenedor principal horizontal
    const rowDiv = document.createElement('div');
    rowDiv.style.display = 'flex';
    rowDiv.style.alignItems = 'center';
    rowDiv.style.gap = '20px';
    rowDiv.style.width = '100%';
    
    // Imagen de la nave
    const imgDiv = document.createElement('div');
    imgDiv.style.width = '80px';
    imgDiv.style.height = '80px';
    imgDiv.style.display = 'flex';
    imgDiv.style.alignItems = 'center';
    imgDiv.style.justifyContent = 'center';
    
    const img = document.createElement('img');
    img.src = imagePath;
    img.alt = ship.name;
    img.style.width = '70px';
    img.style.height = '70px';
    img.style.objectFit = 'contain';
    img.style.filter = 'drop-shadow(0 0 8px #00d4ff)';
    img.onerror = () => {
      img.style.display = 'none';
      const fallback = document.createElement('div');
      fallback.style.fontSize = '2rem';
      fallback.textContent = ship.emoji;
      imgDiv.appendChild(fallback);
    };
    imgDiv.appendChild(img);
    
    // Información de la nave
    const infoDiv = document.createElement('div');
    infoDiv.className = 'item-info';
    infoDiv.style.flex = '1';
    infoDiv.style.textAlign = 'left';
    infoDiv.innerHTML = `
      <h3>${ship.name}</h3>
      <p>⚡ Velocidad: +${((ship.speed-1)*100).toFixed(0)}%</p>
      <p>❤️ Salud base: ${ship.health}</p>
    `;
    
    // Botón de acción
    const actionDiv = document.createElement('div');
    if (isEquipped) {
      actionDiv.innerHTML = '<span class="owned-badge">✅ EQUIPADA</span>';
    } else if (ship.price === 0) {
      const equipBtn = document.createElement('button');
      equipBtn.className = 'item-btn equip-btn';
      equipBtn.textContent = '🔧 EQUIPAR';
      equipBtn.addEventListener('click', () => {
        playerData.ship = ship.id;
        saveData();
        renderHangar();
        showToast(`🔧 Nave equipada: ${ship.name}`);
      });
      actionDiv.appendChild(equipBtn);
    } else {
      const priceSpan = document.createElement('span');
      priceSpan.className = 'item-price';
      priceSpan.textContent = `🪙 ${ship.price}`;
      const buyBtn = document.createElement('button');
      buyBtn.className = 'item-btn buy-btn';
      buyBtn.textContent = 'COMPRAR';
      buyBtn.disabled = !canBuy;
      buyBtn.addEventListener('click', () => {
        playerData.coins -= ship.price;
        playerData.ship = ship.id;
        saveData();
        renderHangar();
        updateMenuStats();
        showToast(`✨ ${ship.name} adquirida!`);
      });
      actionDiv.appendChild(priceSpan);
      actionDiv.appendChild(buyBtn);
    }
    
    rowDiv.appendChild(imgDiv);
    rowDiv.appendChild(infoDiv);
    rowDiv.appendChild(actionDiv);
    div.appendChild(rowDiv);
    container.appendChild(div);
  });
}

// Navegación de pantallas
function openScreen(screenId) {
  const screens = ['shopScreen', 'hangarScreen', 'optionsScreen'];
  screens.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });
  if (screenId) document.getElementById(screenId).classList.add('active');
  if (screenId === 'shopScreen') renderShop();
  if (screenId === 'hangarScreen') renderHangar();
}

function closeAllScreens() {
  ['shopScreen', 'hangarScreen', 'optionsScreen'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });
}

// Eventos del menú
document.getElementById('btnStartMission').addEventListener('click', () => {
  if (typeof window.startGameSession === 'function') {
    window.startGameSession();
  } else {
    console.error('startGameSession no está definida');
    showToast('Error al iniciar el juego');
  }
});
document.getElementById('btnShop').addEventListener('click', () => openScreen('shopScreen'));
document.getElementById('btnHangar').addEventListener('click', () => openScreen('hangarScreen'));
document.getElementById('btnOptions').addEventListener('click', () => openScreen('optionsScreen'));
document.getElementById('btnExit').addEventListener('click', () => showToast("¡Hasta la próxima!"));
document.getElementById('closeShop')?.addEventListener('click', closeAllScreens);
document.getElementById('closeHangar')?.addEventListener('click', closeAllScreens);
document.getElementById('closeOptions')?.addEventListener('click', closeAllScreens);
document.getElementById('backFromShop')?.addEventListener('click', closeAllScreens);
document.getElementById('backFromHangar')?.addEventListener('click', closeAllScreens);
document.getElementById('backFromOptions')?.addEventListener('click', closeAllScreens);
document.getElementById('resetDataBtn')?.addEventListener('click', () => {
  if (confirm('⚠️ ¿REINICIAR PROGRESO COMPLETO? Perderás todas tus monedas, mejoras y niveles.')) {
    localStorage.removeItem('novaX_final');
    location.reload();
  }
});

// Exportar para game.js
window.playerData = playerData;
window.ships = ships;
window.saveData = saveData;
window.updateMenuStats = updateMenuStats;
window.showToast = showToast;

// Inicializar
loadData();
console.log('✅ main.js cargado correctamente');

// BOTÓN SECRETO PARA MONEDAS (presiona la tecla M)
document.addEventListener('keydown', (e) => {
  if (e.key === 'm' || e.key === 'M') {
    playerData.coins += 500;
    saveData();
    updateMenuStats();
    showToast('🪙 +500 MONEDAS (secreto)');
    console.log('💰 Monedas añadidas:', playerData.coins);
  }
});

// ========== REINICIAR TODO CON TECLA R ==========
document.addEventListener('keydown', (e) => {
  if (e.key === 'r' || e.key === 'R') {
    e.preventDefault();
    
    // Confirmación antes de reiniciar
    const confirmar = confirm('⚠️ ¿REINICIAR TODO EL PROGRESO? ⚠️\n\nPerderás:\n- Todas las monedas\n- Todas las mejoras compradas\n- Todas las naves desbloqueadas\n- Tu nivel actual\n\nEsta acción NO se puede deshacer.\n\n¿Estás seguro?');
    
    if (confirmar) {
      // Reiniciar datos del jugador
      playerData = {
        coins: 0,
        ship: 0,
        currentLevel: 1,
        bestLevel: 1,
        extraLives: 0,
        hasWeapon: false,
        hasShield: false,
        hasGoldenHeart: false,
        rapidFire: false,
        multiShot: false,
        upgrades: {
          weapon: false,
          extraLife1: false,
          extraLife2: false,
          extraLife3: false,
          shield: false,
          goldenHeart: false,
          rapidFire: false,
          multiShot: false
        }
      };
      
      // Guardar en localStorage
      saveData();
      
      // Actualizar la interfaz
      updateMenuStats();
      updateShopOwned();
      
      // Mostrar mensaje de confirmación
      showToast('🔄 ¡PROGRESO REINICIADO COMPLETAMENTE!');
      
      // Recargar la página para aplicar todos los cambios
      setTimeout(() => {
        location.reload();
      }, 1500);
    }
  }
});