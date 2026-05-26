// ========== CARGA DE IMAGEN DE LA NAVE PARA EL JUEGO ==========
const naveJuegoImage = new Image();
let naveJuegoImageLoaded = false;

naveJuegoImage.onload = () => {
  naveJuegoImageLoaded = true;
  console.log('✅ Imagen de nave cargada para el juego');
};
naveJuegoImage.onerror = () => {
  naveJuegoImageLoaded = false;
  console.warn('⚠️ Usando nave vectorial');
};
naveJuegoImage.src = 'assets/images/nave-juego.png';

// ========== CARGA DE IMAGEN DEL DISPARO ==========
const disparoImage = new Image();
let disparoImageLoaded = false;

disparoImage.onload = () => {
  disparoImageLoaded = true;
  console.log('✅ Imagen de disparo cargada correctamente');
};
disparoImage.onerror = () => {
  disparoImageLoaded = false;
  console.warn('⚠️ No se encontró assets/images/disparo.png, usando forma por defecto');
};
disparoImage.src = 'assets/images/disparo.png';

// ========== VARIABLES DEL JUEGO ==========
let gameRunning = false, gameLoopId = null, W, H, ctx;
let player = { x: 0, y: 0, radius: 18 };
let meteors = [], bullets = [], particles = [];
let gameTime = 0, gameScore = 0, gameCoins = 0, lastCoinTime = 0;
let currentLives = 1, canShoot = false, shootCooldown = 0, shieldActive = false, shieldTimer = 0;
let currentGameLevel = 1;
let keys = { ArrowLeft: false, ArrowRight: false };

function resizeAndInit() {
  W = window.innerWidth;
  H = window.innerHeight;
  const canvas = document.getElementById('gameCanvas');
  canvas.width = W;
  canvas.height = H;
  ctx = canvas.getContext('2d');
}

// ========== METEORITOS CON TEXTURA REALISTA ==========
function generarPuntosIrregulares(radius) {
  const points = [];
  const segments = 10 + Math.floor(Math.random() * 6);
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const r = radius * (0.65 + Math.random() * 0.7);
    points.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
  }
  return points;
}

function dibujarMeteorito(ctx, x, y, radius, rotacion) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotacion);
  ctx.shadowBlur = 12;
  ctx.shadowColor = '#ff4400';
  ctx.shadowBlur = 0;
  
  const puntos = generarPuntosIrregulares(radius);
  ctx.beginPath();
  ctx.moveTo(puntos[0].x, puntos[0].y);
  for (let i = 1; i < puntos.length; i++) {
    ctx.lineTo(puntos[i].x, puntos[i].y);
  }
  ctx.closePath();
  
  const gradiente = ctx.createRadialGradient(-radius*0.3, -radius*0.3, radius*0.2, 0, 0, radius);
  gradiente.addColorStop(0, '#8B5A2B');
  gradiente.addColorStop(0.5, '#5C3A1E');
  gradiente.addColorStop(1, '#2A1A0A');
  ctx.fillStyle = gradiente;
  ctx.fill();
  
  ctx.fillStyle = '#3A2010';
  const crateres = 4 + Math.floor(Math.random() * 4);
  for (let i = 0; i < crateres; i++) {
    const angulo = Math.random() * Math.PI * 2;
    const distancia = Math.random() * radius * 0.6;
    const craterSize = radius * (0.15 + Math.random() * 0.2);
    ctx.beginPath();
    ctx.arc(Math.cos(angulo) * distancia, Math.sin(angulo) * distancia, craterSize, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#5A3A1A';
    ctx.beginPath();
    ctx.arc(Math.cos(angulo) * distancia, Math.sin(angulo) * distancia, craterSize * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3A2010';
  }
  
  ctx.beginPath();
  ctx.strokeStyle = '#2A1508';
  ctx.lineWidth = radius * 0.08;
  const grietas = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < grietas; i++) {
    const angulo = Math.random() * Math.PI * 2;
    const distancia = Math.random() * radius * 0.5;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angulo) * distancia, Math.sin(angulo) * distancia);
    ctx.lineTo(Math.cos(angulo + 0.5) * (distancia + radius*0.4), Math.sin(angulo + 0.5) * (distancia + radius*0.4));
    ctx.stroke();
  }
  
  ctx.fillStyle = 'rgba(255, 200, 100, 0.25)';
  ctx.beginPath();
  ctx.ellipse(-radius*0.25, -radius*0.25, radius*0.3, radius*0.2, 0, 0, Math.PI*2);
  ctx.fill();
  
  ctx.restore();
}

function spawnMeteor() {
  const difficultyBonus = 1 + (currentGameLevel - 1) * 0.08;
  const radius = (18 + Math.random() * 25) * (1 + (currentGameLevel - 1) * 0.03);
  const speedBonus = 1 + (currentGameLevel - 1) * 0.05;
  
  meteors.push({
    x: 30 + Math.random() * (W - 60),
    y: -radius - Math.random() * 30,
    radius: radius,
    hp: Math.max(1, Math.floor(currentGameLevel / 5)),
    speedY: (1.5 + Math.random() * 3.5) * speedBonus,
    rotation: 0,
    rotSpeed: (Math.random() - 0.5) * 0.04
  });
}

function createExplosion(x, y, radius) {
  for (let i = 0; i < 18 + Math.floor(radius / 2); i++) {
    particles.push({
      x: x, y: y,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10 - 3,
      life: 1,
      size: 2 + Math.random() * 5,
      color: `hsl(${20 + Math.random() * 30}, 85%, 55%)`
    });
  }
  for (let i = 0; i < 20; i++) {
    particles.push({
      x: x, y: y,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 0.5) * 12 - 4,
      life: 0.7,
      size: 1 + Math.random() * 3,
      color: `hsl(${40 + Math.random() * 20}, 100%, 60%)`
    });
  }
}

function createShipExplosion(x, y) {
  for (let i = 0; i < 35; i++) {
    particles.push({
      x: x, y: y,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 0.5) * 12 - 4,
      life: 0.9,
      size: 2 + Math.random() * 6,
      color: `hsl(${0 + Math.random() * 20}, 90%, 60%)`
    });
  }
}

function startGameSession() {
  document.getElementById('mainMenu').style.display = 'none';
  document.getElementById('gameCanvas').style.display = 'block';
  document.getElementById('gameHud').style.display = 'flex';
  resizeAndInit();
  
  // Esperar a que playerData esté disponible
  if (typeof window.playerData !== 'undefined') {
    currentLives = 1 + (window.playerData.extraLives || 0);
    canShoot = window.playerData.hasWeapon || false;
    currentGameLevel = window.playerData.currentLevel || 1;
  } else {
    currentLives = 1;
    canShoot = false;
    currentGameLevel = 1;
  }
  
  shieldActive = false;
  shieldTimer = 0;
  
  gameRunning = true;
  gameTime = 0;
  gameScore = 0;
  gameCoins = 0;
  lastCoinTime = 0;
  shootCooldown = 0;
  meteors = [];
  bullets = [];
  particles = [];
  
  let shipSpeed = 1.0;
  if (typeof window.ships !== 'undefined' && window.ships[window.playerData?.ship || 0]) {
    shipSpeed = window.ships[window.playerData.ship || 0].speed;
  }
  
  player.x = W / 2;
  player.y = H - 80;
  player.radius = 18;
  player.speed = 9 * shipSpeed;
  
  updateGameHUD();
  
  window.addEventListener('keydown', handleGameKeyDown);
  window.addEventListener('keyup', handleGameKeyUp);
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('touchmove', handleTouchMove);
  
  if (gameLoopId) cancelAnimationFrame(gameLoopId);
  gameLoopId = requestAnimationFrame(gameUpdate);
}

function handleGameKeyDown(e) {
  if (e.key === 'ArrowLeft') keys.ArrowLeft = true;
  if (e.key === 'ArrowRight') keys.ArrowRight = true;
  
  // Disparo con ESPACIO o FLECHA ARRIBA
  if ((e.key === ' ' || e.key === 'ArrowUp') && gameRunning) {
    e.preventDefault();  // Evita que la página se desplace
    
    // Verificar si tiene el arma comprada
    let tieneArma = false;
    if (typeof window.playerData !== 'undefined') {
      tieneArma = window.playerData.hasWeapon;
    }
    
    // Solo disparar si tiene arma y el cooldown está en cero
    if (tieneArma && shootCooldown <= 0) {
      shootBullet();
      
      // Establecer cooldown según mejora de disparo rápido
      let rapido = false;
      if (typeof window.playerData !== 'undefined') {
        rapido = window.playerData.rapidFire;
      }
      
      if (rapido) {
        shootCooldown = 0.12;  // ~0.12 segundos
      } else {
        shootCooldown = 0.25;  // ~0.25 segundos
      }
      
      // Sonido de disparo
      if (window.audioManager) window.audioManager.playSound('shoot');
    } else if (!tieneArma) {
      // Mostrar mensaje si no tiene arma
      if (typeof window.showToast === 'function') {
        window.showToast('🔫 Compra el Sistema de Disparo en la Tienda');
      }
    }
  }
}

function handleGameKeyUp(e) {
  if (e.key === 'ArrowLeft') keys.ArrowLeft = false;
  if (e.key === 'ArrowRight') keys.ArrowRight = false;
}

function handleMouseMove(e) {
  if (!gameRunning) return;
  const rect = document.getElementById('gameCanvas').getBoundingClientRect();
  player.x = Math.max(30, Math.min(W - 30, (e.clientX - rect.left) * (W / rect.width)));
}

function handleTouchMove(e) {
  e.preventDefault();
  const rect = document.getElementById('gameCanvas').getBoundingClientRect();
  player.x = Math.max(30, Math.min(W - 30, (e.touches[0].clientX - rect.left) * (W / rect.width)));
}

function shootBullet() {
  let multiShot = false;
  if (typeof window.playerData !== 'undefined' && window.playerData.multiShot) multiShot = true;
  
  if (multiShot) {
    bullets.push({ x: player.x - 12, y: player.y - 25, radius: 4, speedY: -11 });
    bullets.push({ x: player.x, y: player.y - 25, radius: 5, speedY: -11 });
    bullets.push({ x: player.x + 12, y: player.y - 25, radius: 4, speedY: -11 });
  } else {
    bullets.push({ x: player.x, y: player.y - 25, radius: 5, speedY: -11 });
  }
}

function updateGameHUD() {
  document.getElementById('hudLives').textContent = currentLives;
  document.getElementById('hudLevel').textContent = currentGameLevel;
  document.getElementById('hudScore').textContent = gameScore;
  document.getElementById('hudCoins').textContent = gameCoins;
  const mins = Math.floor(gameTime / 60), secs = Math.floor(gameTime % 60);
  document.getElementById('hudTime').textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  
  const timeToNextLevel = 60 - (gameTime % 60);
  const nextLevelElem = document.getElementById('hudNextLevel');
  if (nextLevelElem) nextLevelElem.textContent = Math.ceil(timeToNextLevel);
  
  const incomeRate = 6 + Math.floor(currentGameLevel / 5);
  const incomeElem = document.getElementById('hudIncomeRate');
  if (incomeElem) incomeElem.textContent = incomeRate;
}

function gameUpdate() {
  if (!gameRunning) return;
  
  const delta = 1 / 60;
  gameTime += delta;
  
  // Actualizar cooldown del disparo
  if (shootCooldown > 0) {
    shootCooldown -= delta;
    if (shootCooldown < 0) shootCooldown = 0;
  }
  
  // Sistema de niveles - cada 60 segundos
  const newLevel = Math.floor(gameTime / 60) + 1;
  if (newLevel > currentGameLevel) {
    currentGameLevel = newLevel;
    if (typeof window.playerData !== 'undefined') {
      if (currentGameLevel > (window.playerData.bestLevel || 1)) {
        window.playerData.bestLevel = currentGameLevel;
        window.playerData.currentLevel = currentGameLevel;
        if (typeof window.saveData === 'function') window.saveData();
        if (typeof window.updateMenuStats === 'function') window.updateMenuStats();
      }
    }
    updateGameHUD();
    if (typeof window.showToast === 'function') window.showToast(`⬆️ ¡NIVEL ${currentGameLevel}! ⬆️`);
    // Sonido level up
    if (window.audioManager) window.audioManager.playSound('levelup');
    
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: player.x, y: player.y,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12 - 5,
        life: 0.8,
        size: 3 + Math.random() * 5,
        color: `hsl(${40 + Math.random() * 30}, 100%, 60%)`
      });
    }
  }
  
  // Ingreso pasivo
  const incomeRate = 6 + Math.floor(currentGameLevel / 5);
  const coinsEarned = Math.floor(gameTime * incomeRate / 60) - lastCoinTime;
  if (coinsEarned > 0) {
    gameCoins += coinsEarned;
    lastCoinTime = Math.floor(gameTime * incomeRate / 60);
    updateGameHUD();
  }
  
  // Escudo (15 segundos si comprado)
  let hasShield = false;
  if (typeof window.playerData !== 'undefined' && window.playerData.hasShield) hasShield = true;
  
  if (hasShield && !shieldActive && gameTime < 15) {
    shieldActive = true;
    shieldTimer = 15;
  }
  if (shieldActive) {
    shieldTimer -= delta;
    if (shieldTimer <= 0) {
      shieldActive = false;
      if (typeof window.showToast === 'function') window.showToast("🛡️ Escudo agotado");
    }
  }
  
  // Movimiento nave
  if (keys.ArrowLeft) player.x -= player.speed;
  if (keys.ArrowRight) player.x += player.speed;
  player.x = Math.max(25, Math.min(W - 25, player.x));
  
  // Actualizar balas
  for (let i = 0; i < bullets.length; i++) {
    bullets[i].y += bullets[i].speedY;
    if (bullets[i].y < -30) {
      bullets.splice(i, 1);
      i--;
    }
  }
  
  // Spawn meteoritos
  const meteorSpawnChance = 0.02 * (60 / Math.max(18, 40 - Math.floor(gameTime / 180))) * (1 + (currentGameLevel - 1) * 0.04);
  if (Math.random() < meteorSpawnChance) spawnMeteor();
  
  // ========== ACTUALIZAR METEORITOS Y COLISIONES (CORREGIDO) ==========
  for (let i = 0; i < meteors.length; i++) {
    const meteor = meteors[i];  // ← VARIABLE DEFINIDA CORRECTAMENTE
    
    // Movimiento
    meteor.y += meteor.speedY;
    meteor.rotation += meteor.rotSpeed;
    
    // Fuera de pantalla
    if (meteor.y > H + 100) {
      meteors.splice(i, 1);
      i--;
      continue;
    }
    
    // Colisión con la nave
    const distanciaNave = Math.hypot(player.x - meteor.x, player.y - meteor.y);
    if (distanciaNave < player.radius + meteor.radius) {
      if (shieldActive) {
        createExplosion(meteor.x, meteor.y, meteor.radius);
        meteors.splice(i, 1);
        i--;
        if (typeof window.showToast === 'function') window.showToast("🛡️ Escudo bloqueó el daño!");
      } else {
        currentLives--;
        createShipExplosion(player.x, player.y);
        meteors.splice(i, 1);
        i--;
        updateGameHUD();
        
        if (currentLives <= 0) {
          endGame();
          return;
        }
      }
      continue;
    }
    
    // Colisión con balas
    for (let j = 0; j < bullets.length; j++) {
      const distanciaBala = Math.hypot(bullets[j].x - meteor.x, bullets[j].y - meteor.y);
      
      if (distanciaBala < meteor.radius + bullets[j].radius) {
        bullets.splice(j, 1);
        meteor.hp--;
        
        if (meteor.hp <= 0) {
          const multiplicador = 1 + (currentGameLevel - 1) * 0.1;
          gameScore += 10 * multiplicador;
          gameCoins += 5 * multiplicador;
          createExplosion(meteor.x, meteor.y, meteor.radius);
          
          // Sonido de explosión
          if (window.audioManager) window.audioManager.playSound('explosion');
          
          meteors.splice(i, 1);
          updateGameHUD();
          i--;
        }
        break;
      }
    }
  }
  
  // Actualizar partículas
  for (let i = 0; i < particles.length; i++) {
    particles[i].x += particles[i].vx;
    particles[i].y += particles[i].vy;
    particles[i].life -= 0.03;
    particles[i].vy += 0.2;
    if (particles[i].life <= 0) {
      particles.splice(i, 1);
      i--;
    }
  }
  
  drawGame();
  updateGameHUD();
  requestAnimationFrame(gameUpdate);
}

function drawGame() {
  ctx.clearRect(0, 0, W, H);
  
  ctx.fillStyle = '#03030f';
  ctx.fillRect(0, 0, W, H);
  
  // Estrellas dinámicas
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 150; i++) {
    ctx.globalAlpha = 0.3 + Math.sin(Date.now() * 0.001 + i) * 0.2;
    ctx.fillRect((i * 131) % W, (i * 253 + Date.now() * 0.05) % H, 2, 2);
  }
  ctx.globalAlpha = 1;
  
  // Meteoritos con textura
  for (const meteor of meteors) {
    dibujarMeteorito(ctx, meteor.x, meteor.y, meteor.radius, meteor.rotation);
    if (meteor.hp > 1) {
      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 0;
      ctx.textAlign = 'center';
      ctx.fillText(meteor.hp, meteor.x, meteor.y - meteor.radius - 5);
    }
  }
  
  // Disparos con imagen
  for (const b of bullets) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ffaa00';
    
    if (disparoImageLoaded && disparoImage.complete && disparoImage.naturalWidth > 0) {
      const ancho = 16;
      const alto = 24;
      ctx.drawImage(disparoImage, -ancho/2, -alto/2, ancho, alto);
    } else {
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(-3, -8, 6, 16);
    }
    ctx.restore();
  }
  
  // Nave
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.shadowBlur = 15;
  ctx.shadowColor = '#00d4ff';
  
  if (naveJuegoImageLoaded && naveJuegoImage.complete && naveJuegoImage.naturalWidth > 0) {
    const naveWidth = 48;
    const naveHeight = 48;
    ctx.drawImage(naveJuegoImage, -naveWidth/2, -naveHeight/2, naveWidth, naveHeight);
  } else {
    ctx.fillStyle = '#00d4ff';
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(18, 18);
    ctx.lineTo(0, 8);
    ctx.lineTo(-18, 18);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#0099cc';
    ctx.beginPath();
    ctx.moveTo(-18, 18);
    ctx.lineTo(-28, 28);
    ctx.lineTo(-12, 22);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(18, 18);
    ctx.lineTo(28, 28);
    ctx.lineTo(12, 22);
    ctx.fill();
    
    ctx.fillStyle = '#ff6600';
    ctx.beginPath();
    ctx.moveTo(-6, 18);
    ctx.lineTo(0, 32);
    ctx.lineTo(6, 18);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -8, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#00d4ff';
    ctx.beginPath();
    ctx.arc(0, -8, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  
  if (shieldActive) {
    ctx.strokeStyle = `rgba(0, 212, 255, ${0.5 + Math.sin(Date.now() / 100) * 0.3})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 38, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
  
  // Partículas
  for (const p of particles) {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  
  if (!canShoot && gameRunning) {
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#ff3366';
    ctx.fillText('⚠️ SIN SISTEMA DE DISPARO', player.x - 90, player.y - 45);
  }
}

function endGame() {
  gameRunning = false;
  window.removeEventListener('keydown', handleGameKeyDown);
  window.removeEventListener('keyup', handleGameKeyUp);
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('touchmove', handleTouchMove);
  
  const timeBonus = Math.floor(gameTime / 10);
  const levelBonus = currentGameLevel * 10;
  const totalCoins = gameCoins + timeBonus + levelBonus;
  
  if (typeof window.playerData !== 'undefined') {
    window.playerData.coins += totalCoins;
    window.playerData.currentLevel = currentGameLevel;
    if (typeof window.saveData === 'function') window.saveData();
    if (typeof window.updateMenuStats === 'function') window.updateMenuStats();
  }
  
  // Sonido de game over
  if (window.audioManager) window.audioManager.playSound('gameover');
  
  if (typeof window.showToast === 'function') {
    window.showToast(`💀 GAME OVER | +${totalCoins}🪙 | Nivel ${currentGameLevel}`);
  }
  
  setTimeout(() => {
    document.getElementById('gameCanvas').style.display = 'none';
    document.getElementById('gameHud').style.display = 'none';
    document.getElementById('mainMenu').style.display = 'flex';
  }, 2000);
}

// Exportar función
window.startGameSession = startGameSession;

// Inicializar canvas
resizeAndInit();
window.addEventListener('resize', () => {
  if (gameRunning) resizeAndInit();
});

console.log('🎮 game.js cargado correctamente');