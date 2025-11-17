import * as THREE from 'three';  
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { initRenderer, initCamera, initStats, initOrbitControls, 
         initDefaultLighting, addLargeGroundPlane, addGeometry } from './util.js';

const scene = new THREE.Scene();
const renderer = initRenderer();
let camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 60, 120);
camera.lookAt(scene.position);
scene.add(camera);

let orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
const stats = initStats();


const ambiColor = "#1c1c1c";
const ambientLight = new THREE.AmbientLight(ambiColor);
scene.add(ambientLight);

// add directional light
const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
dirLight.position.set(100, 200, 200);
scene.add(dirLight);

const textureLoader = new THREE.TextureLoader();

// Icosahedron: 정 20면체, 8은 radius, 0은 detail level 
// detail level: 0은 default, 1은 더 많은 면, 2는 더 많은 면 (삼각형을 4개로 계속 나누어 감)


// Sphere: 반지름 5, 20은 가로 세로 분할 수
const Sun = new THREE.SphereGeometry(10);
const SunMaterial = new THREE.MeshBasicMaterial({color: 0xfefd48});
const SunMesh = new THREE.Mesh(Sun, SunMaterial);

scene.add(SunMesh);


// Cube: 가로, 세로, 높이 10

const Mercury = new THREE.SphereGeometry(1.5)
const MercuryTexture = textureLoader.load('./textures/Mercury.jpg');
const MercuryMaterial = new THREE.MeshStandardMaterial({
  //color: '#a6a6a6',  //color 사용시 mp4영상과 다른 색상으로 나옴.
  map: MercuryTexture,
});
const MercuryMesh = new THREE.Mesh(Mercury, MercuryMaterial);
MercuryMesh.castShadow = true;
//const MercuryMesh = addGeometry(scene, Mercury, textureLoader.load('./textures/Mercury.jpg'));
const MercuryPivot = new THREE.Object3D();
scene.add(MercuryPivot);
MercuryMesh.position.z = 20;
MercuryPivot.add(MercuryMesh);



const Venus = new THREE.SphereGeometry(3)
const VenusTexture = textureLoader.load('./textures/Venus.jpg');
const VenusMaterial = new THREE.MeshStandardMaterial({
  //color: '#e39e1c', //color 사용시 mp4영상과 다른 색상으로 나옴.
  map: VenusTexture,
});
const VenusMesh = new THREE.Mesh(Venus, VenusMaterial);

//const VenusMesh = addGeometry(scene, Venus, textureLoader.load('./textures/Venus.jpg')); addGeometry사용 시 color 설정 불가능.
const VenusPivot = new THREE.Object3D();
scene.add(VenusPivot);
VenusMesh.position.z = 35; 
VenusPivot.add(VenusMesh);
VenusMesh.castShadow = true;

const Earth = new THREE.SphereGeometry(3.5)
const EarthTexture = textureLoader.load('./textures/Earth.jpg');
const EarthMaterial = new THREE.MeshStandardMaterial({
  //color: '#3498db', //color 사용시 mp4영상과 다른 색상으로 나옴.
  map: EarthTexture,
});
const EarthMesh = new THREE.Mesh(Earth, EarthMaterial);
//scene.add(EarthMesh);
//const EarthMesh = addGeometry(scene, Earth, textureLoader.load('./textures/Earth.jpg'));
const EarthPivot = new THREE.Object3D();
scene.add(EarthPivot);
EarthMesh.position.z = 50;
EarthPivot.add(EarthMesh);
EarthMesh.castShadow = true;

const Mars = new THREE.SphereGeometry(2.5)
const MarsTexture = textureLoader.load('./textures/Mars.jpg');
const MarsMaterial = new THREE.MeshStandardMaterial({
  //color: '#c0392b', //color 사용시 mp4영상과 다른 색상으로 나옴.
  map: MarsTexture,
});
const MarsMesh = new THREE.Mesh(Mars, MarsMaterial);
//const MarsMesh = addGeometry(scene, Mars, textureLoader.load('./textures/Mars.jpg'));
const MarsPivot = new THREE.Object3D();
scene.add(MarsPivot);
MarsMesh.position.z = 65;
MarsPivot.add(MarsMesh);
MarsMesh.castShadow = true;

const gui = new GUI();
const camerafolder = gui.addFolder("Camera");
const Mercuryfolder = gui.addFolder("Mercury");
const Venusfolder = gui.addFolder("Venus");
const Earthfolder = gui.addFolder("Earth");
const Marsfolder = gui.addFolder("Mars");
let rotations = [0.02, 0.015, 0.01, 0.008];
let orbits = [0.02, 0.015, 0.01, 0.008];
const controls = new function () {
    this.perspective = "Perspective";
    this.switchCamera = function () {
        if (camera instanceof THREE.PerspectiveCamera) {
            scene.remove(camera);
            camera = null; // 기존의 camera 제거    
            // OrthographicCamera(left, right, top, bottom, near, far)
            camera = new THREE.OrthographicCamera(window.innerWidth / -16, 
                window.innerWidth / 16, window.innerHeight / 16, window.innerHeight / -16, -200, 500);
            camera.position.x = 0;
            camera.position.y = 60;
            camera.position.z = 120;
            camera.lookAt(scene.position);
            orbitControls.dispose(); // 기존의 orbitControls 제거
            orbitControls = null;
            orbitControls = new OrbitControls(camera, renderer.domElement);
            orbitControls.enableDamping = true;
            this.perspective = "Orthographic";
        } else {
            scene.remove(camera);
            camera = null; 
            camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.x = 0;
            camera.position.y = 60;
            camera.position.z = 120;
            camera.lookAt(scene.position);
            orbitControls.dispose(); // 기존의 orbitControls 제거
            orbitControls = null;
            orbitControls = new OrbitControls(camera, renderer.domElement);
            orbitControls.enableDamping = true;
            this.perspective = "Perspective";
        }
    };
};
const mercury = new function () {
    this.rotation = 0.02;
    this.orbit = 0.02;
};
const venus = new function () {
    this.rotation = 0.015;
    this.orbit = 0.015;
};
const earth = new function () {
    this.rotation = 0.01;
    this.orbit = 0.01;
};
const mars = new function () {
    this.rotation = 0.008;
    this.orbit = 0.008;
};
Mercuryfolder.add(mercury, 'rotation', 0, 0.1).name('Rotation Speed').onChange(function (e) {
  rotations[0] = e
});
Mercuryfolder.add(mercury, 'orbit', 0, 0.1).name('Orbit Speed').onChange(function (e) {
  orbits[0] = e
});
Venusfolder.add(venus, 'rotation', 0, 0.1).name('Rotation Speed').onChange(function (e) {
  rotations[1] = e
});
Venusfolder.add(venus, 'orbit', 0, 0.1).name('Orbit Speed').onChange(function (e) {
  orbits[1] = e
});
Earthfolder.add(earth, 'rotation', 0, 0.1).name('Rotation Speed').onChange(function (e) {
  rotations[2] = e
});
Earthfolder.add(earth, 'orbit', 0, 0.1).name('Orbit Speed').onChange(function (e) {
  orbits[2] = e
});
Marsfolder.add(mars, 'rotation', 0, 0.1).name('Rotation Speed').onChange(function (e) {
  rotations[3] = e
});
Marsfolder.add(mars, 'orbit', 0, 0.1).name('Orbit Speed').onChange(function (e) {
  orbits[3] = e
});

camerafolder.add(controls, 'switchCamera').name('Switch Camera Type');
camerafolder.add(controls, 'perspective').name('Current Camera').listen();


render();


function render() {
  stats.update();
  orbitControls.update();

  MercuryMesh.rotation.y += rotations[0] - orbits[0];
  VenusMesh.rotation.y += rotations[1] - orbits[1];
  EarthMesh.rotation.y += rotations[2] - orbits[2];
  MarsMesh.rotation.y += rotations[3] - orbits[3];

  MercuryPivot.rotation.y += orbits[0];
  VenusPivot.rotation.y += orbits[1];
  EarthPivot.rotation.y += orbits[2];
  MarsPivot.rotation.y += orbits[3];
  requestAnimationFrame(render);
  renderer.render(scene, camera);

}

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});
