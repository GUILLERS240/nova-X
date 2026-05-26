// ========== SISTEMA DE AUDIO MEJORADO ==========

class AudioManager {
  constructor() {
    this.sounds = {};
    this.music = {};
    this.musicVolume = 0.3;
    this.sfxVolume = 0.5;
    this.isMusicPlaying = false;
    this.currentMusic = null;
    this.audioEnabled = false;  // El audio comienza desactivado
    this.audioInitialized = false;
    
    // Cargar preferencias guardadas
    this.loadPreferences();
  }
  
  // Cargar preferencias de volumen
  loadPreferences() {
    const savedMusicVol = localStorage.getItem('musicVol');
    const savedSfxVol = localStorage.getItem('sfxVol');
    if (savedMusicVol) this.musicVolume = parseFloat(savedMusicVol);
    if (savedSfxVol) this.sfxVolume = parseFloat(savedSfxVol);
  }
  
  // Guardar preferencias
  savePreferences() {
    localStorage.setItem('musicVol', this.musicVolume);
    localStorage.setItem('sfxVol', this.sfxVolume);
  }
  
  // Inicializar audio (llamar después de interacción del usuario)
  initAudio() {
    if (this.audioInitialized) return;
    
    // Cargar todos los sonidos
    this.loadAllAudio();
    this.audioInitialized = true;
    this.audioEnabled = true;
    console.log('🎵 Audio inicializado por interacción del usuario');
    
    // Reproducir música del menú automáticamente después de inicializar
    this.playMusic('menu');
  }
  
  // Cargar un sonido
  loadSound(name, url) {
    const audio = new Audio(url);
    audio.volume = this.sfxVolume;
    audio.preload = 'auto';
    this.sounds[name] = audio;
  }
  
  // Cargar música
  loadMusic(name, url) {
    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = this.musicVolume;
    audio.preload = 'auto';
    this.music[name] = audio;
  }
  
  // Reproducir sonido
  playSound(name) {
    if (!this.audioEnabled) return;
    
    if (this.sounds[name]) {
      // Clonar para poder reproducir múltiples veces simultáneamente
      const sound = this.sounds[name].cloneNode();
      sound.volume = this.sfxVolume;
      sound.play().catch(e => console.log('⚠️ Error reproduciendo sonido:', name, e));
    } else {
      console.warn('⚠️ Sonido no encontrado:', name);
    }
  }
  
  // Reproducir música
  playMusic(name) {
    if (!this.audioEnabled) return;
    
    // Detener música actual
    if (this.currentMusic && this.music[this.currentMusic]) {
      this.music[this.currentMusic].pause();
      this.music[this.currentMusic].currentTime = 0;
    }
    
    // Reproducir nueva música
    if (this.music[name]) {
      this.currentMusic = name;
      this.music[name].volume = this.musicVolume;
      this.music[name].play().catch(e => {
        console.log('⚠️ Error reproduciendo música:', name, e);
        console.log('💡 Asegúrate de que el archivo existe en: assets/audio/' + name + '.mp3');
      });
      this.isMusicPlaying = true;
    } else {
      console.warn('⚠️ Música no encontrada:', name);
    }
  }
  
  // Detener música
  stopMusic() {
    if (this.currentMusic && this.music[this.currentMusic]) {
      this.music[this.currentMusic].pause();
      this.music[this.currentMusic].currentTime = 0;
      this.isMusicPlaying = false;
      this.currentMusic = null;
    }
  }
  
  // Cambiar volumen de música
  setMusicVolume(vol) {
    this.musicVolume = vol;
    if (this.currentMusic && this.music[this.currentMusic]) {
      this.music[this.currentMusic].volume = vol;
    }
    this.savePreferences();
  }
  
  // Cambiar volumen de efectos
  setSfxVolume(vol) {
    this.sfxVolume = vol;
    this.savePreferences();
  }
  
  // Cargar todos los audios del juego
  loadAllAudio() {
    console.log('🎵 Cargando archivos de audio...');
    
    // Sonidos
    this.loadSound('shoot', 'assets/audio/shoot.mp3');
    this.loadSound('explosion', 'assets/audio/explosion.mp3');
    this.loadSound('gameover', 'assets/audio/gameover.mp3');
    this.loadSound('coin', 'assets/audio/coin.mp3');
    this.loadSound('levelup', 'assets/audio/levelup.mp3');
    this.loadSound('buy', 'assets/audio/buy.mp3');
    
    // Música
    this.loadMusic('menu', 'assets/audio/menu-music.mp3');
    this.loadMusic('game', 'assets/audio/game-music.mp3');
    
    console.log('🎵 Archivos de audio cargados (pendiente de interacción del usuario)');
  }
}

// Crear instancia global
const audioManager = new AudioManager();

// Función para inicializar audio (se llama cuando el usuario hace clic)
function initAudioOnUserInteraction() {
  if (!audioManager.audioInitialized) {
    audioManager.initAudio();
  }
}

// Escuchar el primer clic del usuario para activar el audio
document.addEventListener('click', () => {
  initAudioOnUserInteraction();
}, { once: true });

// También escuchar teclado (por si el usuario usa teclado primero)
document.addEventListener('keydown', () => {
  initAudioOnUserInteraction();
}, { once: true });

// Función para reproducir música del menú (desde main.js)
function playMenuMusic() {
  if (audioManager.audioInitialized) {
    audioManager.playMusic('menu');
  }
}

// Función para reproducir música del juego
function playGameMusic() {
  if (audioManager.audioInitialized) {
    audioManager.stopMusic();
    audioManager.playMusic('game');
  }
}

// Función para detener música
function stopMusic() {
  audioManager.stopMusic();
}

// Exportar funciones
window.audioManager = audioManager;
window.initAudioOnUserInteraction = initAudioOnUserInteraction;
window.playMenuMusic = playMenuMusic;
window.playGameMusic = playGameMusic;
window.stopMusic = stopMusic;

console.log('🎵 Sistema de audio listo (esperando interacción del usuario)');