/**
 * Clean & Ultra-Optimized Main Application
 * Dual-Scene Pipeline with Interactive Seek Slider & Volume Slider
 */
class LoveGalaxyApp {
  constructor() {
    this.container = document.getElementById('webgl-container');
    this.clock = new THREE.Clock();

    this.initScene();
    this.initPostProcessing();
    this.initObjects();
    this.initAudioIntegration();
    // setAnimationLoop follows the browser's active display refresh rate,
    // instead of imposing a 60 FPS timer.
    this.renderer.setAnimationLoop(() => this.animate());
  }

  initScene() {
    // 1. Cosmic Galaxy Scene (Receives Unreal Bloom Glow)
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x000000, 0.007);

    // 2. Crystal-Clear Overlay Scene for My Melody & Text (0% Bloom, 100% True Colors)
    this.overlayScene = new THREE.Scene();

    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      precision: "highp",
      // Let the browser schedule rendering as close to the display refresh
      // rate as possible (including 120/144/165/180 Hz displays).
      desynchronized: true,
      autoClear: false
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    // Rendering at device DPR 1.5–2 multiplies bloom's pixel work while
    // offering little visible benefit for this particle scene. A modest cap
    // keeps desktop motion responsive at high refresh rates.
    this.renderPixelRatio = Math.min(window.devicePixelRatio || 1, 1.25);
    this.effectPixelRatio = Math.min(this.renderPixelRatio, 1);
    this.renderer.setPixelRatio(this.renderPixelRatio);
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.container.appendChild(this.renderer.domElement);

    // Smooth Orbit Controls (360 rotate without zoom)
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.enableZoom = false;
    this.controls.enablePan = false;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.06;

    this.adjustCameraForDevice();

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    this.scene.add(ambientLight);

    window.addEventListener('resize', () => this.onWindowResize());
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.onWindowResize(), 150);
    });
  }

  adjustCameraForDevice() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;

    this.camera.aspect = aspect;

    if (aspect < 0.6) {
      this.camera.fov = 68;
      this.camera.position.set(0, 32, 84);
      this.controls.target.set(0, 7.5, 0);
    } else if (aspect < 0.85) {
      this.camera.fov = 58;
      this.camera.position.set(0, 28, 72);
      this.controls.target.set(0, 7.5, 0);
    } else if (aspect < 1.3) {
      this.camera.fov = 50;
      this.camera.position.set(0, 25, 62);
      this.controls.target.set(0, 7.0, 0);
    } else {
      this.camera.fov = 45;
      this.camera.position.set(0, 24, 58);
      this.controls.target.set(0, 7.0, 0);
    }

    this.camera.updateProjectionMatrix();
    this.controls.update();
  }

  initPostProcessing() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.renderScene = new THREE.RenderPass(this.scene, this.camera);

    // Radiant Bloom Pass for Galaxy & Heart Vortex
    this.bloomPass = new THREE.UnrealBloomPass(
      new THREE.Vector2(width, height),
      1.15, // Glow Strength
      0.35, // Glow Radius
      0.22  // Glow Threshold
    );

    this.composer = new THREE.EffectComposer(this.renderer);
    // Bloom is the most expensive pass. Render it at standard resolution;
    // the crisp overlay is still drawn afterward at renderer resolution.
    this.composer.setPixelRatio(this.effectPixelRatio);
    this.composer.addPass(this.renderScene);
    this.composer.addPass(this.bloomPass);
  }

  initObjects() {
    // 1. Glowing Systems in main scene
    this.galaxy = new GalaxySystem(this.scene);
    this.heartVortex = new HeartVortexSystem(this.scene);

    // 2. My Melody & Orbiting Text in Overlay Scene (Crystal Clear HD rendering)
    this.orbitingElements = new OrbitingElementsSystem(this.overlayScene);
  }

  initAudioIntegration() {
    const playToggle = document.getElementById('play-toggle');
    const audio = document.getElementById('bg-audio');
    const progressWrap = document.getElementById('song-progress-wrap');
    const progressFill = document.getElementById('song-progress-fill');
    const currentTimeText = document.getElementById('current-time-text');
    const remainingTimeText = document.getElementById('remaining-time-text');
    const volSlider = document.getElementById('volume-slider');
    const btnVolDown = document.getElementById('btn-vol-down');
    const btnVolUp = document.getElementById('btn-vol-up');
    const btnPrev = document.getElementById('btn-music-prev');
    const btnNext = document.getElementById('btn-music-next');
    const musicCardWrapper = document.querySelector('.music-card-wrapper');
    const collapseToggle = document.getElementById('music-collapse-toggle');

    if (!playToggle || !audio) return;

    if (musicCardWrapper && collapseToggle) {
      const compactLayout = window.matchMedia('(max-width: 1024px), (pointer: coarse) and (max-width: 1366px)').matches
        || navigator.maxTouchPoints > 0;
      if (compactLayout) musicCardWrapper.classList.add('is-collapsed');

      collapseToggle.addEventListener('click', () => {
        const collapsed = musicCardWrapper.classList.toggle('is-collapsed');
        collapseToggle.setAttribute('aria-expanded', String(!collapsed));
        collapseToggle.setAttribute('aria-label', collapsed ? 'เปิดเครื่องเล่นเพลง' : 'พับเครื่องเล่นเพลง');
      });
    }

    const formatTime = (seconds) => {
      if (isNaN(seconds) || seconds < 0) return '0:00';
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // Update Progress Bar & Live Time
    const updateProgress = () => {
      if (!audio.duration) return;
      const progress = (audio.currentTime / audio.duration) * 100;
      if (progressFill) {
        progressFill.style.width = `${progress}%`;
      }
      if (currentTimeText) {
        currentTimeText.textContent = formatTime(audio.currentTime);
      }
      if (remainingTimeText) {
        const rem = audio.duration - audio.currentTime;
        remainingTimeText.textContent = `-${formatTime(rem)}`;
      }
    };

    // Initial start time at 15 seconds
    const INITIAL_START_TIME = 15.0;

    audio.addEventListener('timeupdate', updateProgress);

    const setInitialTime = () => {
      if (audio.currentTime < INITIAL_START_TIME) {
        audio.currentTime = INITIAL_START_TIME;
        updateProgress();
      }
    };

    audio.addEventListener('loadedmetadata', () => {
      setInitialTime();
      updateProgress();
    });

    audio.addEventListener('ended', () => {
      audio.currentTime = INITIAL_START_TIME;
      audio.play();
    });

    // Click / Drag on Progress Slider to Seek
    let isSeeking = false;

    const seekToPosition = (e) => {
      if (!progressWrap || !audio.duration) return;
      const rect = progressWrap.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clickX = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percentage = clickX / rect.width;
      audio.currentTime = percentage * audio.duration;
      updateProgress();
    };

    if (progressWrap) {
      progressWrap.addEventListener('pointerdown', (e) => {
        isSeeking = true;
        seekToPosition(e);
      });
      window.addEventListener('pointermove', (e) => {
        if (isSeeking) seekToPosition(e);
      });
      window.addEventListener('pointerup', () => {
        isSeeking = false;
      });
    }

    // Start / Pause Audio Control
    const startAudio = () => {
      if (audio.currentTime < INITIAL_START_TIME) {
        audio.currentTime = INITIAL_START_TIME;
      }
      audio.play().catch(e => console.log("Waiting for user tap to play audio"));
    };

    const stopAudio = () => {
      audio.pause();
    };

    playToggle.addEventListener('change', () => {
      if (!playToggle.checked) {
        startAudio();
      } else {
        stopAudio();
      }
    });

    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        audio.currentTime = Math.max(0, audio.currentTime - 10);
        updateProgress();
      });
    }
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        audio.currentTime = Math.min(audio.duration || 999, audio.currentTime + 10);
        updateProgress();
      });
    }

    // Volume Slider & Track Fill
    const updateVolSliderBg = () => {
      if (!volSlider) return;
      const val = parseFloat(volSlider.value) * 100;
      volSlider.style.background = `linear-gradient(to right, #ff2a8d 0%, #ff2a8d ${val}%, rgba(255, 255, 255, 0.15) ${val}%, rgba(255, 255, 255, 0.15) 100%)`;
    };

    if (volSlider) {
      audio.volume = parseFloat(volSlider.value);
      updateVolSliderBg();
      volSlider.addEventListener('input', (e) => {
        audio.volume = parseFloat(e.target.value);
        updateVolSliderBg();
      });
    }

    if (btnVolDown && volSlider) {
      btnVolDown.addEventListener('click', () => {
        audio.volume = Math.max(0, audio.volume - 0.1);
        volSlider.value = audio.volume;
        updateVolSliderBg();
      });
    }

    if (btnVolUp && volSlider) {
      btnVolUp.addEventListener('click', () => {
        audio.volume = Math.min(1.0, audio.volume + 0.1);
        volSlider.value = audio.volume;
        updateVolSliderBg();
      });
    }

    // Auto-start music on first tap anywhere on screen
    const startOnFirstClick = () => {
      if (!playToggle.checked) {
        startAudio();
      }
      window.removeEventListener('pointerdown', startOnFirstClick);
    };
    window.addEventListener('pointerdown', startOnFirstClick, { once: true });

    // Try autoplay as soon as the page opens. Browsers that block audible
    // autoplay will start it from the first user interaction above.
    startAudio();
  }

  onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.renderPixelRatio);
    this.composer.setPixelRatio(this.effectPixelRatio);
    this.composer.setSize(width, height);
    this.adjustCameraForDevice();
  }

  animate() {
    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    this.controls.update();

    // 1. Update 3D systems
    this.galaxy.update(time, delta);
    this.heartVortex.update(time, delta);
    this.orbitingElements.update(time, delta, this.camera);

    // 2. Pass 1: Render Cosmic Galaxy & Heart Vortex with Glowing Bloom
    this.renderer.autoClear = true;
    this.composer.render();

    // 3. Pass 2: Render My Melody & Text Overlay (100% HD True Color)
    this.renderer.autoClear = false;
    this.renderer.clearDepth();
    this.renderer.render(this.overlayScene, this.camera);
  }
}

// Depth-based particles create a radial rush from the edges into the universe.
function startArrivalTunnel() {
  const canvas = document.getElementById('arrival-tunnel-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const particles = [];
  let width = 0;
  let height = 0;
  let scale = 1;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    scale = Math.min(width, height) * 0.72;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const reset = (particle, farAway = false) => {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.pow(Math.random(), 0.58) * 1.25 + 0.03;
    particle.x = Math.cos(angle) * radius;
    particle.y = Math.sin(angle) * radius;
    // Small z projects far from the center; increasing z pulls the particle inward.
    particle.z = farAway ? Math.random() * 0.08 + 0.035 : Math.random() * 0.08 + 0.035;
    particle.speed = Math.random() * 0.012 + 0.007;
    particle.size = Math.random() * 2.5 + 0.7;
    particle.tint = Math.random() < 0.23 ? '#e89cff' : (Math.random() < 0.18 ? '#ff8fc9' : '#f6f2ff');
  };

  resize();
  const amount = reduceMotion ? 220 : Math.min(900, Math.max(420, Math.floor(width * height / 1500)));
  for (let i = 0; i < amount; i++) {
    const particle = {};
    reset(particle, true);
    particle.z = Math.random() * 1.15 + 0.08;
    particles.push(particle);
  }

  const render = () => {
    const centerX = width / 2;
    const centerY = height / 2;
    ctx.fillStyle = 'rgba(2, 0, 8, 0.34)';
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'lighter';

    particles.forEach((particle) => {
      const oldZ = particle.z;
      particle.z += particle.speed;
      if (particle.z > 1.45) reset(particle);
      const projection = 1 / particle.z;
      const oldProjection = 1 / Math.max(oldZ, 0.018);
      const x = centerX + particle.x * projection * scale;
      const y = centerY + particle.y * projection * scale;
      const oldX = centerX + particle.x * oldProjection * scale;
      const oldY = centerY + particle.y * oldProjection * scale;
      const radius = Math.min(8, particle.size * projection * 0.15);

      ctx.strokeStyle = particle.tint;
      ctx.globalAlpha = Math.min(0.82, 0.15 + projection * 0.035);
      ctx.lineWidth = Math.max(0.5, radius * 0.55);
      ctx.beginPath();
      ctx.moveTo(oldX, oldY);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.fillStyle = particle.tint;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(0.55, radius), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalCompositeOperation = 'source-over';
    requestAnimationFrame(render);
  };

  window.addEventListener('resize', resize, { passive: true });
  render();
}

// Convert the supplied React button into a native button for this vanilla app.
function initBottomActionButton() {
  const button = document.querySelector('.bottom-action-button button');
  if (!button) return;

  button.innerHTML = `
    เว็บเก่า
    <span class="star-1"></span><span class="star-2"></span><span class="star-3"></span>
    <span class="star-4"></span><span class="star-5"></span><span class="star-6"></span>`;
}

// Start application
window.addEventListener('DOMContentLoaded', () => {
  initBottomActionButton();
  window.app = new LoveGalaxyApp();
});
