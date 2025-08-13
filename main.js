
// --- FPS Training Game with Standard Controls ---

let camera, scene, renderer;
let move = { forward: false, backward: false, left: false, right: false };
let velocity = new THREE.Vector3();
let prevTime = performance.now();
let canMove = false;
let yaw = 0, pitch = 0;
let collectibles = [];
let collectedCount = 0;
let target = null;
let raycaster = new THREE.Raycaster();
let score = 0;


// Wait for textures to load before initializing scene
window.addEventListener('load', () => {
  setTimeout(() => { // ensure images are loaded
    init();
    animate();
  }, 100);
});

function init() {
  // Camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 1.6, 5);

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x222233);


  // Load textures from hidden <img> tags
  function tex(id, fallbackColor) {
    const img = document.getElementById(id);
    if (img && img.complete && img.naturalWidth > 0) {
      const texture = new THREE.Texture(img);
      texture.needsUpdate = true;
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;
      return texture;
    } else {
      // fallback to color if texture not loaded
      return null;
    }
  }

  // Floor (grass texture)
  let floorMat;
  const floorTex = tex('tex-grass');
  if (floorTex) {
    floorMat = new THREE.MeshPhongMaterial({ map: floorTex });
  } else {
    floorMat = new THREE.MeshPhongMaterial({ color: 0x888888 });
  }
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    floorMat
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // Lighting: ambient and multiple directional lights for even illumination
  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambient);
  const lights = [
    new THREE.DirectionalLight(0xffffff, 0.5),
    new THREE.DirectionalLight(0xffffff, 0.5),
    new THREE.DirectionalLight(0xffffff, 0.5),
    new THREE.DirectionalLight(0xffffff, 0.5)
  ];
  lights[0].position.set(10, 10, 10);   // front-top-right
  lights[1].position.set(-10, 10, 10);  // front-top-left
  lights[2].position.set(10, 10, -10);  // back-top-right
  lights[3].position.set(-10, 10, -10); // back-top-left
  lights.forEach(l => scene.add(l));


  // Obstacles (randomly use dirt, stone, or wood textures)
  const boxTexs = [tex('tex-dirt'), tex('tex-stone'), tex('tex-wood')];
  for (let i = 0; i < 10; i++) {
    let mat;
    const t = boxTexs[Math.floor(Math.random() * boxTexs.length)];
    if (t) {
      mat = new THREE.MeshPhongMaterial({ map: t });
    } else {
      mat = new THREE.MeshPhongMaterial({ color: 0x44aa88 });
    }
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      mat
    );
    box.position.set(Math.random() * 40 - 20, 0.5, Math.random() * 40 - 20);
    scene.add(box);
  }

  // Spawn initial collectibles
  for (let i = 0; i < 5; i++) spawnCollectible();
  // Spawn first target
  spawnTarget();
// Spawn a random target (sphere)
function spawnTarget() {
  if (target) scene.remove(target);
  const geometry = new THREE.SphereGeometry(0.5, 24, 24);
  const material = new THREE.MeshPhongMaterial({ color: 0xff4444 });
  target = new THREE.Mesh(geometry, material);
  // Place target randomly in front of player, 5-20 units away
  const angle = Math.random() * Math.PI * 2;
  const dist = 5 + Math.random() * 15;
  target.position.set(
    Math.sin(angle) * dist,
    1 + Math.random() * 2,
    Math.cos(angle) * dist
  );
  scene.add(target);
}
// Shoot on left click
window.addEventListener('mousedown', (e) => {
  if (!canMove || e.button !== 0) return;
  if (!target) return;
  // Only allow shooting if player is close enough
  const dist = camera.position.distanceTo(target.position);
  if (dist > 10) return; // must be within 10 units
  // Raycast from camera center
  raycaster.setFromCamera({ x: 0, y: 0 }, camera);
  const intersects = raycaster.intersectObject(target);
  if (intersects.length > 0) {
    // Remove target and spawn a new one
    scene.remove(target);
    spawnTarget();
    score++;
    const scoreElem = document.getElementById('score');
    if (scoreElem) scoreElem.textContent = score;
  }
});

// Spawn a random star-shaped collectible
function spawnCollectible() {
  // Star shape: 10-pointed 2D star extruded to 3D
  const shape = new THREE.Shape();
  const spikes = 10, outerR = 0.6, innerR = 0.25;
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = (i / (spikes * 2)) * Math.PI * 2;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
  }
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.2, bevelEnabled: false });
  const material = new THREE.MeshPhongMaterial({ color: 0xffd700, shininess: 100 });
  const star = new THREE.Mesh(geometry, material);
  // Place randomly in the world
  star.position.set(
    Math.random() * 60 - 30,
    1 + Math.random() * 2,
    Math.random() * 60 - 30
  );
  star.rotation.y = Math.random() * Math.PI * 2;
  scene.add(star);
  collectibles.push(star);
}

  // Renderer
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Pointer lock for mouse look
  renderer.domElement.addEventListener('click', () => {
    renderer.domElement.requestPointerLock();
  });
  document.addEventListener('pointerlockchange', () => {
    canMove = document.pointerLockElement === renderer.domElement;
  });

  // Mouse look (standard FPS: yaw left/right, pitch up/down, no inversion)
  document.addEventListener('mousemove', (event) => {
    if (!canMove) return;
    const sens = document.getElementById('sensitivity') ? Number(document.getElementById('sensitivity').value) : 1;
    yaw -= event.movementX * 0.002 * sens;
    pitch -= event.movementY * 0.002 * sens;
    pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitch));
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
  });

  // WASD movement
  document.addEventListener('keydown', (event) => {
    switch(event.code) {
      case 'KeyW': move.forward = true; break;
      case 'KeyS': move.backward = true; break;
      case 'KeyA': move.left = true; break;
      case 'KeyD': move.right = true; break;
    }
  });
  document.addEventListener('keyup', (event) => {
    switch(event.code) {
      case 'KeyW': move.forward = false; break;
      case 'KeyS': move.backward = false; break;
      case 'KeyA': move.left = false; break;
      case 'KeyD': move.right = false; break;
    }
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}


function animate() {
  requestAnimationFrame(animate);
  const time = performance.now();
  const delta = (time - prevTime) / 1000;

  if (canMove) {
    // Dampen velocity
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    // Calculate direction relative to camera
    let forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    let right = new THREE.Vector3();
    right.crossVectors(forward, camera.up).normalize();

    let moveVec = new THREE.Vector3();
    if (move.forward) moveVec.add(forward);
    if (move.backward) moveVec.sub(forward);
    if (move.right) moveVec.add(right);
    if (move.left) moveVec.sub(right);
    moveVec.normalize();

  let moveSpeed = 40.0 * delta;
  velocity.x += moveVec.x * moveSpeed;
  velocity.z += moveVec.z * moveSpeed;

    camera.position.x += velocity.x * delta;
    camera.position.z += velocity.z * delta;

    // Check for collectible proximity
    for (let i = collectibles.length - 1; i >= 0; i--) {
      const star = collectibles[i];
      const dist = camera.position.distanceTo(star.position);
      if (dist < 1.2) {
        scene.remove(star);
        collectibles.splice(i, 1);
        collectedCount++;
        // Spawn a new collectible
        spawnCollectible();
      }
    }
  }

  // Change target color based on distance
  if (target) {
    const dist = camera.position.distanceTo(target.position);
    if (dist <= 10) {
      target.material.color.set(0x00ff44); // green
    } else {
      target.material.color.set(0xff4444); // red
    }
  }

  renderer.render(scene, camera);
  prevTime = time;
}
