/**
 * Orbiting 3D Elements with Synchronized Circular Orbit
 * Rotates uniformly in a perfect circular ring so elements NEVER collide or overlap
 */
class OrbitingElementsSystem {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.elements = [];

    // Each orbit item has its own My Melody image so characters do not repeat.
    this.messages = [
      { text: "I LUV UUUU", image: "assets/my_melody_1.png", ratio: 1 },
      { text: "HAPPY 3 MENSIVERSARY", image: "assets/my_melody_2.png", ratio: 523 / 479 },
      { text: "I'm sorry for the way I behaved", image: "assets/my_melody_3.png", ratio: 523 / 479 },
      { text: "I didn't mean to hurt you", image: "assets/my_melody_4.png", ratio: 697 / 791 },
      { text: "I Promise to Love you Forever", image: "assets/my_melody_5.png", ratio: 1 }
    ];

    this.orbitRadius = 23.5; // Circular orbit radius around the galaxy
    this.orbitSpeed = 0.045;  // Synchronized constant rotation speed

    this.initTextures();
    this.createElements();

    this.scene.add(this.group);
  }

  initTextures() {
    const loader = new THREE.TextureLoader();

    this.melodyTextures = this.messages.map((item) => {
      const texture = loader.load(item.image);
      texture.encoding = THREE.sRGBEncoding;
      texture.generateMipmaps = false;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      return texture;
    });
  }

  createTextTexture(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Crisp white text with pink neon glow shadow
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.shadowColor = '#ff2a8d';
    ctx.shadowBlur = 18;
    ctx.fillText(text, centerX, centerY);

    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 4;
    ctx.fillText(text, centerX, centerY);

    const texture = new THREE.CanvasTexture(canvas);
    texture.encoding = THREE.sRGBEncoding;
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }

  createElements() {
    const count = this.messages.length;

    for (let i = 0; i < count; i++) {
      const item = this.messages[i];
      // Fixed angular spacing across all unique image/message pairs.
      const fixedBaseAngle = (i / count) * Math.PI * 2;

      const itemGroup = new THREE.Group();

      // 1. Text Billboard Plane
      const textTex = this.createTextTexture(item.text);
      const textGeo = new THREE.PlaneGeometry(12.5, 2.8);
      const textMat = new THREE.MeshBasicMaterial({
        map: textTex,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide
      });
      const textMesh = new THREE.Mesh(textGeo, textMat);
      textMesh.position.set(0, 0, 0);
      itemGroup.add(textMesh);

      // 2. My Melody Character Plane (Elevated to y = 3.8 to never touch text)
      const melodyTex = this.melodyTextures[i];
      const imageRatio = item.ratio;
      const h = 4.5;
      const w = h * imageRatio;

      const melodyGeo = new THREE.PlaneGeometry(w, h);
      const melodyMat = new THREE.MeshBasicMaterial({
        map: melodyTex,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide,
        alphaTest: 0.05
      });
      const melodyMesh = new THREE.Mesh(melodyGeo, melodyMat);
      melodyMesh.position.set(0, 3.8, 0);
      itemGroup.add(melodyMesh);

      this.group.add(itemGroup);

      this.elements.push({
        group: itemGroup,
        textMesh: textMesh,
        melodyMesh: melodyMesh,
        baseAngle: fixedBaseAngle,
        baseW: w,
        baseH: h
      });
    }
  }

  update(time, delta, camera) {
    const total = this.elements.length;
    for (let i = 0; i < total; i++) {
      const item = this.elements[i];

      // Synchronized circular orbit: All items rotate at identical speed!
      const currentAngle = item.baseAngle + time * this.orbitSpeed;

      const x = Math.cos(currentAngle) * this.orbitRadius;
      const z = Math.sin(currentAngle) * this.orbitRadius;
      const y = 0.1 + Math.sin(time * 2.0 + i * 0.78) * 0.25;

      item.group.position.set(x, y, z);

      // Always face camera directly
      if (camera) {
        item.group.quaternion.copy(camera.quaternion);
      }

      // Gentle floating animation
      if (item.melodyMesh) {
        const pulse = 1.0 + Math.sin(time * 3.0 + i) * 0.03;
        item.melodyMesh.scale.set(pulse, pulse, 1);
      }
    }
  }
}

window.OrbitingElementsSystem = OrbitingElementsSystem;
