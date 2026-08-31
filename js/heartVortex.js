/**
 * High-Performance 3D Particle Heart (Without Funnel Cone)
 * Clean volumetric floating heart with heartbeat pulsation
 */
class HeartVortexSystem {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.heartCount = 15000;
    this.heartElevation = 13.5;

    this.initTexture();
    this.create3DHeart();
    this.createCoreLight();

    this.scene.add(this.group);
  }

  initTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.2, 'rgba(255, 120, 200, 0.9)');
    grad.addColorStop(0.5, 'rgba(255, 42, 141, 0.4)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    this.particleTexture = new THREE.CanvasTexture(canvas);
  }

  create3DHeart() {
    const count = this.heartCount;
    const geo = new THREE.BufferGeometry();

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const heartY = this.heartElevation;
    const heartScale = 0.58;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // 3D Heart Parametric equations
      const t = Math.random() * Math.PI * 2;
      const u = Math.pow(Math.random(), 0.55);

      const x0 = 16 * Math.pow(Math.sin(t), 3);
      const y0 = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      
      const thickness = (1.0 - Math.min(1.0, Math.abs(x0) / 16)) * 10.0;
      const z0 = (Math.random() - 0.5) * thickness * u;

      const px = x0 * u * heartScale;
      const py = (y0 * u * heartScale) + heartY;
      const pz = z0 * heartScale;

      positions[i3] = px + (Math.random() - 0.5) * 0.25;
      positions[i3 + 1] = py + (Math.random() - 0.5) * 0.25;
      positions[i3 + 2] = pz + (Math.random() - 0.5) * 0.25;

      const distFromCenter = Math.hypot(px, pz) / 10.0;
      if (u < 0.22) {
        colors[i3] = 1.0;
        colors[i3 + 1] = 0.9;
        colors[i3 + 2] = 0.95;
      } else {
        colors[i3] = 1.0;
        colors[i3 + 1] = 0.18 + (1.0 - distFromCenter) * 0.25;
        colors[i3 + 2] = 0.55 + distFromCenter * 0.35;
      }
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.heartMat = new THREE.PointsMaterial({
      size: 0.32,
      sizeAttenuation: true,
      vertexColors: true,
      map: this.particleTexture,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.heartMesh = new THREE.Points(geo, this.heartMat);
    this.group.add(this.heartMesh);
  }

  createCoreLight() {
    this.heartLight = new THREE.PointLight(0xff2a8d, 1.2, 25);
    this.heartLight.position.set(0, this.heartElevation, 0);
    this.group.add(this.heartLight);
  }

  update(time, delta) {
    // Double Heartbeat Scale Simulation (GPU-efficient transform)
    const beatTime = (time * 2.4) % (Math.PI * 2);
    let beatScale = 1.0;

    if (beatTime < 0.35) {
      beatScale = 1.0 + Math.sin((beatTime / 0.35) * Math.PI) * 0.06;
    } else if (beatTime >= 0.45 && beatTime < 0.8) {
      beatScale = 1.0 + Math.sin(((beatTime - 0.45) / 0.35) * Math.PI) * 0.03;
    }

    this.heartMesh.scale.set(beatScale, beatScale, beatScale);
    this.heartMesh.position.y = this.heartElevation * (1.0 - beatScale) + Math.sin(time * 1.5) * 0.3;
    this.heartMesh.rotation.y = Math.sin(time * 0.5) * 0.08;

    this.heartLight.intensity = 1.0 + (beatScale - 1.0) * 4.0;
  }
}

window.HeartVortexSystem = HeartVortexSystem;
