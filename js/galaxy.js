/**
 * High-Density Galactic Stardust System
 * White Wave Ridges + Rich, Plentiful Pink Stardust Between Waves
 */
class GalaxySystem {
  constructor(scene) {
    this.scene = scene;
    this.blackHoleGroup = new THREE.Group();

    this.initTextures();
    this.createBlackHole();
    this.createSpiralWaveGalaxy();
  }

  initTextures() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.2, 'rgba(255, 255, 255, 0.95)');
    grad.addColorStop(0.45, 'rgba(255, 100, 180, 0.65)');
    grad.addColorStop(0.75, 'rgba(255, 42, 141, 0.2)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    this.starTexture = new THREE.CanvasTexture(canvas);
  }

  createBlackHole() {
    // 1. Dark Center Event Horizon
    const horizonGeo = new THREE.SphereGeometry(2.35, 32, 32);
    const horizonMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    this.blackHoleGroup.add(new THREE.Mesh(horizonGeo, horizonMat));

    // 2. Accretion Disk Ring (White-Pink Radiant Glow)
    const ringGeo = new THREE.RingGeometry(2.45, 5.8, 64);
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 256, 0);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.25, 'rgba(255, 255, 255, 0.95)');
    grad.addColorStop(0.55, 'rgba(255, 80, 180, 0.7)');
    grad.addColorStop(0.85, 'rgba(255, 42, 141, 0.2)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 1);

    const ringTex = new THREE.CanvasTexture(canvas);
    const ringMat = new THREE.MeshBasicMaterial({
      map: ringTex,
      side: THREE.DoubleSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 0.95
    });
    this.accretionRing = new THREE.Mesh(ringGeo, ringMat);
    this.accretionRing.rotation.x = Math.PI / 2;
    this.blackHoleGroup.add(this.accretionRing);

    // Inner bright white photon rim
    const photonGeo = new THREE.TorusGeometry(2.5, 0.08, 16, 80);
    const photonMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending
    });
    const photonRim = new THREE.Mesh(photonGeo, photonMat);
    photonRim.rotation.x = Math.PI / 2;
    this.blackHoleGroup.add(photonRim);

    this.scene.add(this.blackHoleGroup);
  }

  createSpiralWaveGalaxy() {
    // Dense enough to retain the galaxy shape, while avoiding excessive
    // transparent-particle overdraw on high-refresh-rate displays.
    const count = 48000;
    const radius = 50;
    const branches = 4;
    const spin = 1.6;

    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    // Color definitions
    const colorPureWhite = new THREE.Color('#ffffff');
    const colorSoftPink = new THREE.Color('#ff85c0');   // Bright romantic pink
    const colorHotPink = new THREE.Color('#ff2a8d');    // Neon glowing pink
    const colorDeepPink = new THREE.Color('#f43f5e');   // Deep rose pink
    const colorPastelRose = new THREE.Color('#fda4af');

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // 55% wave ridge particles + 45% dense pink stardust fill between waves
      const isWaveRidge = Math.random() < 0.55;

      const r = Math.pow(Math.random(), 1.12) * (radius - 2.5) + 2.5;

      let angle = 0;
      let spreadX = 0, spreadY = 0, spreadZ = 0;
      let distFromArmCenter = 0;

      if (isWaveRidge) {
        // Tight White Wave Arm
        const branchIndex = i % branches;
        const branchAngle = (branchIndex / branches) * Math.PI * 2;
        const spinAngle = Math.pow(r / radius, 0.75) * (spin * Math.PI * 2);
        angle = branchAngle + spinAngle;

        const armWidth = 0.14 * r + 0.3;
        const u1 = Math.max(0.0001, Math.random());
        const u2 = Math.random();
        const randGaussian = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

        distFromArmCenter = Math.abs(randGaussian);
        const spreadMag = randGaussian * armWidth * 0.4;

        spreadX = -Math.sin(angle) * spreadMag;
        spreadZ = Math.cos(angle) * spreadMag;

        const verticalWave = Math.sin(r * 0.4 + branchAngle) * 0.25;
        spreadY = (Math.random() - 0.5) * (0.04 * r + 0.1) + verticalWave;
      } else {
        // Dense Pink Stardust Between the Waves
        const branchIndex = i % branches;
        const branchAngle = (branchIndex / branches) * Math.PI * 2;
        const spinAngle = Math.pow(r / radius, 0.75) * (spin * Math.PI * 2);
        
        // Offset angle to spread richly between arms
        const betweenOffset = (Math.random() - 0.5) * (Math.PI / 2) * 1.5;
        angle = branchAngle + spinAngle + betweenOffset;

        spreadX = (Math.random() - 0.5) * 1.8;
        spreadY = (Math.random() - 0.5) * (0.05 * r + 0.25);
        spreadZ = (Math.random() - 0.5) * 1.8;
        distFromArmCenter = 1.5 + Math.random() * 1.5; // High offset = pure pink
      }

      positions[i3] = Math.cos(angle) * r + spreadX;
      positions[i3 + 1] = spreadY;
      positions[i3 + 2] = Math.sin(angle) * r + spreadZ;

      // Color mapping
      let pColor;

      if (r < 5.0) {
        // Bright White Center Core
        pColor = colorPureWhite.clone();
      } else {
        if (distFromArmCenter < 0.45) {
          // 🤍 แนวคลื่น: สีขาวสว่างประกายเพชร
          pColor = colorPureWhite.clone();
        } else if (distFromArmCenter < 0.9) {
          // รอยต่อแนวคลื่น: ขาวประกายชมพูอ่อน
          const blend = (distFromArmCenter - 0.45) / 0.45;
          pColor = colorPureWhite.clone().lerp(colorPastelRose, blend);
        } else {
          // 💖 ละอองระหว่างคลื่น: สีชมพูแน่นๆ สดใสระยิบระยับ
          const pinkType = Math.random();
          if (pinkType < 0.45) {
            pColor = colorHotPink.clone();
          } else if (pinkType < 0.8) {
            pColor = colorSoftPink.clone();
          } else {
            pColor = colorDeepPink.clone();
          }

          // Random sparkling diamond glitters in the pink dust
          if (Math.random() < 0.08) {
            pColor.lerp(colorPureWhite, 0.6);
          }
        }
      }

      colors[i3] = pColor.r;
      colors[i3 + 1] = pColor.g;
      colors[i3 + 2] = pColor.b;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.material = new THREE.PointsMaterial({
      size: 0.16,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      map: this.starTexture,
      transparent: true,
      opacity: 0.95
    });

    this.points = new THREE.Points(geo, this.material);
    this.scene.add(this.points);
  }

  update(time, delta) {
    if (this.points) {
      this.points.rotation.y = time * 0.038;
    }
    if (this.accretionRing) {
      this.accretionRing.rotation.z = -time * 0.35;
    }
  }
}

window.GalaxySystem = GalaxySystem;
