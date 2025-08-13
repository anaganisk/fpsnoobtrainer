
// --- FPS Training Game with Standard Controls ---
let camera, scene, renderer;
let move = { forward: false, backward: false, left: false, right: false };
let velocity = new THREE.Vector3();
let prevTime = performance.now();
let canMove = false;
let yaw = 0, pitch = 0;

init();
animate();

function init() {
  // Camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 1.6, 5);

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x222233);

  // Floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshPhongMaterial({ color: 0x888888 })
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // Light
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(10, 10, 10);
  scene.add(light);

  // Obstacles
  for (let i = 0; i < 10; i++) {
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshPhongMaterial({ color: 0x44aa88 })
    );
    box.position.set(Math.random() * 40 - 20, 0.5, Math.random() * 40 - 20);
    scene.add(box);
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
    yaw -= event.movementX * 0.002;
    pitch -= event.movementY * 0.002;
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

    const moveSpeed = 8.0 * delta;
    velocity.x += moveVec.x * moveSpeed;
    velocity.z += moveVec.z * moveSpeed;

    camera.position.x += velocity.x * delta;
    camera.position.z += velocity.z * delta;
  }

  renderer.render(scene, camera);
  prevTime = time;
}
