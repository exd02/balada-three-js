import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';

function init() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const canvas = document.querySelector('#c');
  const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
  
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  
  return { scene, camera, renderer, canvas };
}


function createFloor(scene) {
  const floorGeometry = new THREE.PlaneGeometry(500, 500);
  const floorMaterial = new THREE.MeshPhongMaterial({ color: 0x808080, side: THREE.DoubleSide });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
}

function createTorus(scene) {
  const torusGeometry = new THREE.TorusGeometry(1, 0.4, 16, 100);
  const torusMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 });
  const torus = new THREE.Mesh(torusGeometry, torusMaterial);
  torus.position.set(-2, 2, 0);
  torus.castShadow = true;
  scene.add(torus);
}

function createPyramid(scene) {
  const triangleGeometry = new THREE.ConeGeometry(1, 2, 3);
  const triangleMaterial = new THREE.MeshPhongMaterial({ color: 0xff00ff });
  const pyramid = new THREE.Mesh(triangleGeometry, triangleMaterial);
  pyramid.position.set(2, 2, 0);
  pyramid.castShadow = true;
  scene.add(pyramid);
}

function createAmbientLight(scene) {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);
  return ambientLight;
}

function createOrbitControls(camera, renderer) {
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.target.set(0, 0, 0);
  controls.update();
  return controls;
}

function adjustCamera() {
  camera.position.set(25, 20, 25);
  camera.lookAt(0, 0, 0);
}

function createHUD() {
  const hud = document.createElement('div');
  hud.style.position = 'absolute';
  hud.style.top = '10px';
  hud.style.left = '10px';
  hud.style.color = 'white';
  hud.style.fontFamily = 'monospace';
  hud.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  hud.style.padding = '5px';
  hud.style.borderRadius = '5px';
  document.body.appendChild(hud);
  return hud;
}

function createDirectionalLightAndHelper(scene) {
  const directionalLight = new THREE.DirectionalLight(0xffffaa, 0);
  directionalLight.position.set(0, 15, 0);
  directionalLight.target.position.set(0, 0, 0);
  directionalLight.castShadow = true;
  scene.add(directionalLight);
  scene.add(directionalLight.target);

  const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 1);
  directionalLightHelper.visible = false;
  scene.add(directionalLightHelper);

  return { directionalLight, directionalLightHelper };
}

function createPointLights(vertices, lightColors) {
  const pointLights = [];
  const pointLightHelpers = [];
  const blinkSettings = [];

  vertices.forEach((position, index) => {
    const color = lightColors[index];

    const pointLight = new THREE.PointLight(color, 1, 10000, 0.1);
    pointLight.position.copy(position);
    pointLight.castShadow = true;
    pointLights.push(pointLight);

    const helper = new THREE.PointLightHelper(pointLight, 0.5, color);
    helper.visible = true;
    pointLightHelpers.push(helper);

    blinkSettings.push({
      interval: 0.5,
      elapsed: 0,
      blinking: false,
      visible: true,
      showHelper: true
    });
  });

  return { pointLights, pointLightHelpers, blinkSettings };
}

function updatePointLights(delta, pointLights, pointLightHelpers, blinkSettings) {
  pointLightHelpers.forEach(helper => helper.update());

  blinkSettings.forEach((blink, i) => {
    if (blink.blinking) {
      blink.elapsed += delta;
      if (blink.elapsed >= blink.interval) {
        blink.elapsed = 0;
        blink.visible = !blink.visible;
        pointLights[i].visible = blink.visible;
        pointLightHelpers[i].visible = blink.showHelper && blink.visible;
      }
    } else {
      pointLights[i].visible = true;
      pointLightHelpers[i].visible = blink.showHelper;
    }
  });
}

function updateHUD(camera, hud) {
  const { x, y, z } = camera.position;
  hud.innerText = `Camera: x: ${x.toFixed(2)}, y: ${y.toFixed(2)}, z: ${z.toFixed(2)}`;
}

function createGUI(ambientLight, directionalLight, directionalLightHelper, pointLights, pointLightHelpers, blinkSettings, rotationSettings) {
  const gui = new GUI();

  const ambientFolder = gui.addFolder('Ambient Light');
  ambientFolder.add(ambientLight, 'intensity', 0, 2, 0.1).name('Intensity');
  ambientFolder.open();

  const directionalFolder = gui.addFolder('Directional Light');
  directionalFolder.add(directionalLight, 'intensity', 0, 5, 0.1).name('Intensity');
  const helperControl = { showHelper: false };
  directionalFolder.add(helperControl, 'showHelper').name('Show Helper').onChange((v) => {
    directionalLightHelper.visible = v;
  });
  directionalFolder.open();

  const pointLightsFolder = gui.addFolder('Point Lights');
  pointLights.forEach((pl, i) => {
    const folder = pointLightsFolder.addFolder(`PointLight ${i + 1} (${['Red', 'Green', 'Blue'][i]})`);
    folder.add(pl, 'intensity', 0, 5, 0.1).name('Intensity');
    folder.add(blinkSettings[i], 'interval', 0.05, 1, 0.01).name('Blink Interval (s)');
    folder.add(blinkSettings[i], 'blinking').name('Blinking');
    folder.add(blinkSettings[i], 'showHelper').name('Show Helper').onChange((v) => {
      pointLightHelpers[i].visible = v;
    });
    folder.open();
  });
  pointLightsFolder.open();

  const rotationFolder = gui.addFolder('Lights Rotation');
  rotationFolder.add(rotationSettings, 'rotationSpeed', 0, 2, 0.01).name('Rotation Speed (rad/s)');
  rotationFolder.open();
}

// Setup
const { scene, camera, renderer } = init();
createFloor(scene);
createTorus(scene);
createPyramid(scene);
const ambientLight = createAmbientLight(scene);
const controls = createOrbitControls(camera, renderer);
adjustCamera();
const hud = createHUD();
const { directionalLight, directionalLightHelper } = createDirectionalLightAndHelper(scene);

const vertices = [
  new THREE.Vector3(15, 15, 9),
  new THREE.Vector3(0, 15, -16.5),
  new THREE.Vector3(-15, 15, 9),
];

const lightColors = [0xff0000, 0x00ff00, 0x0000ff];

const lightsContainer = new THREE.Object3D();
scene.add(lightsContainer);

const { pointLights, pointLightHelpers, blinkSettings } = createPointLights(vertices, lightColors);

pointLights.forEach(light => lightsContainer.add(light));
pointLightHelpers.forEach(helper => scene.add(helper));

const rotationSettings = { rotationSpeed: 0.5 };

createGUI(ambientLight, directionalLight, directionalLightHelper, pointLights, pointLightHelpers, blinkSettings, rotationSettings);

let previousTime = performance.now();

function animate() {
  requestAnimationFrame(animate);

  const currentTime = performance.now();
  const delta = (currentTime - previousTime) / 1000;
  previousTime = currentTime;

  lightsContainer.rotation.y += rotationSettings.rotationSpeed * delta;

  updatePointLights(delta, pointLights, pointLightHelpers, blinkSettings);

  controls.update();
  updateHUD(camera, hud);
  renderer.render(scene, camera);
}

animate();
