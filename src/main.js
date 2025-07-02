import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const canvas = document.querySelector('#c');
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Chão
const floorGeometry = new THREE.PlaneGeometry(10, 10);
const floorMaterial = new THREE.MeshPhongMaterial({ color: 0x808080, side: THREE.DoubleSide });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);


const lightsGroup = new THREE.Object3D();
scene.add(lightsGroup);

// PointLights
const vertices = [
  new THREE.Vector3(5, 5, 3),
  new THREE.Vector3(0, 5, -5.5),
  new THREE.Vector3(-5, 5, 3),
];

const lightColors = [0xff0000, 0x00ff00, 0x0000ff];
const pointLights = [];
const pointLightHelpers = [];
const blinkSettings = [];

vertices.forEach((pos, i) => {
  const pointLight = new THREE.PointLight(lightColors[i], 1, 10000, 0.1);
  pointLight.position.copy(pos);
  lightsGroup.add(pointLight);
  pointLights.push(pointLight);

  const pointLightHelper = new THREE.PointLightHelper(pointLight, 0.2);
  lightsGroup.add(pointLightHelper);
  pointLightHelpers.push(pointLightHelper);

  blinkSettings.push({
    interval: 0.5,
    elapsed: 0,
    blinking: false,
    visible: true
  });
});

// Directional Light
const directionalLight = new THREE.DirectionalLight(0xffffaa, 0);
directionalLight.position.set(0, 15, 0);
directionalLight.target.position.set(0, 0, 0);
lightsGroup.add(directionalLight);
lightsGroup.add(directionalLight.target);

const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 1);
directionalLightHelper.visible = false;
scene.add(directionalLightHelper);

// Ambient Light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

// Camera & Controls
camera.position.set(15, 10, 15);
camera.lookAt(0, 0, 0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 0, 0);
controls.update();

// HUD camera
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

// GUI
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

// 
const rotationControl = { rotationSpeed: 0.001 };

const pointLightsFolder = gui.addFolder('Point Lights');

pointLights.forEach((pl, i) => {
  const folder = pointLightsFolder.addFolder(`PointLight ${i + 1} (${['Red', 'Green', 'Blue'][i]})`);
  folder.add(pl, 'intensity', 0, 5, 0.1).name('Intensity');
  folder.add(blinkSettings[i], 'interval', 0.05, 1, 0.01).name('Blink Interval (s)');
  folder.add(blinkSettings[i], 'blinking').name('Blinking');
  folder.open();
});

pointLightsFolder.add(rotationControl, 'rotationSpeed', 0, 0.1, 0.001).name('Rotation Speed');
pointLightsFolder.open();

let previousTime = performance.now();

function animate() {
  requestAnimationFrame(animate);

  const currentTime = performance.now();
  const delta = (currentTime - previousTime) / 1000;
  previousTime = currentTime;

  blinkSettings.forEach((blink, i) => {
    if (blink.blinking) {
      blink.elapsed += delta;
      if (blink.elapsed >= blink.interval) {
        blink.elapsed = 0;
        blink.visible = !blink.visible;
        pointLights[i].visible = blink.visible;
        pointLightHelpers[i].visible = blink.visible;
      }
    } else {
      pointLights[i].visible = true;
      pointLightHelpers[i].visible = true;
    }
  });

  lightsGroup.rotation.y += rotationControl.rotationSpeed;

  controls.update();

  const { x, y, z } = camera.position;
  hud.innerText = `Camera: x: ${x.toFixed(2)}, y: ${y.toFixed(2)}, z: ${z.toFixed(2)}`;

  renderer.render(scene, camera);
}

animate();
