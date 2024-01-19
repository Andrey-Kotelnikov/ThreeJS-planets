import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import init from './init';
import Stats from 'stats.js';
import * as dat from 'lil-gui';
import * as CANNON from 'cannon-es';
import CannonDebugRenderer from 'cannon-es-debugger'
// import ColorGUIHelper from './ColorGUIHelper';
import './style.css';

const { sizes, camera, scene, canvas, controls, renderer } = init();

camera.position.set(0, 5000, 15000);

// FPS на экран
const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

//const gui = new dat.GUI();

// Оси координат
const axesHelper = new THREE.AxesHelper(5000)
scene.add(axesHelper);


// Текстуры -------------------------------------------------------------

const loadingManager = new THREE.LoadingManager();
loadingManager.onStart = () => {
	console.log('loading started');
};

loadingManager.onLoad = () => {
	console.log('loading finished');
};

loadingManager.onProgress = () => {
	console.log('loading progressing');
};

loadingManager.onError = () => {
	console.log('loading error');
};

const textureLoader = new THREE.TextureLoader(loadingManager);

const grassTexture = textureLoader.load('/textures/grass.jpg');

grassTexture.wrapS = THREE.RepeatWrapping;
grassTexture.wrapT = THREE.RepeatWrapping;
grassTexture.repeat.set(10, 10);

const brickWallTexture = textureLoader.load('/textures/brick-8.jpg');

brickWallTexture.wrapS = THREE.RepeatWrapping;
brickWallTexture.wrapT = THREE.RepeatWrapping;
brickWallTexture.repeat.set(6, 1);

const earthTexture = textureLoader.load('/textures/Earth.jpg');
const moonTexture = textureLoader.load('/textures/moon.jpg');
const sunTexture = textureLoader.load('/textures/sun.jpg');


// Свет -----------------------------------------------------------------

/*const lightParameters = {
	skyColor: 0xFFFFFF,
	groundColor: 0x222222,
	intensity: 2,
}*/

// Создание направленного источника света
const light = new THREE.DirectionalLight(0xffffff, 0.5);
light.position.set(-8000, 5000, 5000);
light.target.position.set(-1000, 1000, 1000)
light.castShadow = true;

light.shadow.camera.bottom = -10000; // ширина теневой карты
light.shadow.camera.top = 10000; // ширина теневой карты
light.shadow.camera.left = -10000; // ширина теневой карты
light.shadow.camera.right = 10000; // ширина теневой карты
light.shadow.camera.near = 1; // ближняя плоскость тени
light.shadow.camera.far = 30000; // дальняя плоскость тени

scene.add(light);
scene.add(light.target);

// Создание точечного источника света внутри солнца
const pointLight = new THREE.PointLight(0xffedcd, 0.03, 10000);
pointLight.position.set(0, 800, 0);
pointLight.castShadow = true;
pointLight.decay = {}; // хз почему так
scene.add(pointLight);

// Визуализация источника света
const pointHelper = new THREE.PointLightHelper(pointLight);
scene.add(pointHelper);

// Вектор направленного света
const helper = new THREE.DirectionalLightHelper(light);
scene.add(helper);

// Отличная визуализация теневой карты напрвленного света
const cameraHelper = new THREE.CameraHelper(light.shadow.camera);
scene.add(cameraHelper);


// Меши ----------------------------------------------------------------------

// Пол (трава)
const floorGeometry = new THREE.PlaneGeometry(10000, 10000, 10, 10);
const floorMaterial = new THREE.MeshPhongMaterial({
	// color: 'gray',
	// wireframe: true,
	map: grassTexture,
	side: THREE.DoubleSide,
});
const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
floorMesh.rotation.x = -Math.PI / 2;
floorMesh.receiveShadow = true;
scene.add(floorMesh);

// Стены
const wallGeometry = new THREE.PlaneGeometry(10000, 1000)
const wallMaterial = new THREE.MeshPhongMaterial({
	// color: 'gray',
	// wireframe: true,
	map: brickWallTexture,
	side: THREE.DoubleSide,
});
const wallMesh1 = new THREE.Mesh(wallGeometry, wallMaterial);
wallMesh1.position.set(0, 500, 5000);
const wallMesh2 = new THREE.Mesh(wallGeometry, wallMaterial);
wallMesh2.position.set(0, 500, -5000);
const wallMesh3 = new THREE.Mesh(wallGeometry, wallMaterial);
wallMesh3.position.set(5000, 500, 0);
wallMesh3.rotation.y = Math.PI / 2;
const wallMesh4 = new THREE.Mesh(wallGeometry, wallMaterial);
wallMesh4.position.set(-5000, 500, 0);
wallMesh4.rotation.y = Math.PI / 2;

scene.add(wallMesh1, wallMesh2, wallMesh3, wallMesh4);

// Создание группы для вращения луны вокруг земли
const moonContainer = new THREE.Group();
moonContainer.position.set(2000, 800, 0);
scene.add(moonContainer);

// Создание группы для вращения земли вокруг солнца
const earthContainer = new THREE.Group();
earthContainer.position.set(0, 0, 0);
scene.add(earthContainer);

// Создание Земли
const earthGeometry = new THREE.SphereGeometry(200);
const earthMaterial = new THREE.MeshPhongMaterial({
	// color: 'gray',
	// wireframe: true,
	map: earthTexture,
});
const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
earthMesh.position.set(2000, 800, 0);

earthContainer.add(earthMesh, moonContainer);

// Создание Луны
const moonGeometry = new THREE.SphereGeometry(100);
const moonMaterial = new THREE.MeshPhongMaterial({
	// color: 'gray',
	// wireframe: true,
	map: moonTexture,
});
const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
moonMesh.position.set(0, 0, 500);

moonContainer.add(moonMesh)
// scene.add(moonMesh);

// Создание Солнца
const sunGeometry = new THREE.SphereGeometry(500);
const sunMaterial = new THREE.MeshBasicMaterial({
	// color: 'gray',
	// wireframe: true,
	map: sunTexture,
	//emissive: 0xf8c65b,
	//emissiveIntensity: 0.5
});
const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
sunMesh.position.set(0, 800, 0)
scene.add(sunMesh);


// Настройка теней------------------------------------------------------------------
earthMesh.castShadow = true; // Отбрасывает тень
earthMesh.receiveShadow = true; // Принимает тень

moonMesh.castShadow = true;
moonMesh.receiveShadow = true;

// sunMesh.castShadow = true;
sunMesh.receiveShadow = true;

floorMesh.receiveShadow = true;

wallMesh1.castShadow = true;
wallMesh1.receiveShadow = true;

wallMesh2.castShadow = true;
wallMesh2.receiveShadow = true;

wallMesh3.castShadow = true;
wallMesh3.receiveShadow = true;

wallMesh4.castShadow = true;
wallMesh4.receiveShadow = true;


//-----------------------------------------------------------------------------

// Добавим 3d модель

const loader = new GLTFLoader();

let mixer = null;
loader.load(
	'/models/BrainStem/BrainStem.gltf',
	(gltf) => {
		mixer = new THREE.AnimationMixer(gltf.scene);
		const action = mixer.clipAction(gltf.animations[0]);
		action.play();
		gltf.scene.scale.set(300, 300, 300);
		gltf.scene.position.set(4000, 0, -4000);
		console.log(gltf)
		// gltf.scene.castShadow = true;
		// gltf.scene.receiveShadow = true;
		scene.add(gltf.scene)
	}
);


// Физика Cannon--------------------------------------------------------------

// World
const world = new CANNON.World();
world.gravity.set(0, -9.8, 0);

// CannonDebugRenderer
const cannonDebugRenderer = new CannonDebugRenderer(scene, world);

// Пол
const floorBody = new CANNON.Body({
	mass: 0,
})
let floorShape = new CANNON.Plane(0.1, 0.2)
floorBody.addShape(floorShape);
floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
world.addBody(floorBody);


// Функционал-----------------------------------------------------------------

// const geometry = new THREE.BoxGeometry(1, 1, 1);
// const geometry = new THREE.TorusGeometry(1000, 500, 16, 40);
// const material = new THREE.MeshBasicMaterial({
// 	color: 'gray',
// 	wireframe: true,
// });
// const mesh = new THREE.Mesh(geometry, material);
// scene.add(mesh);

const clock = new THREE.Clock();

// Функция анимации
const tick = () => {
	stats.begin();
	const delta = clock.getDelta();

	// Вращение планет
	moonContainer.rotation.y += delta;
	moonContainer.rotation.x += delta * 0.2;
	earthContainer.rotation.y += delta * 0.1;
	earthMesh.rotation.y += delta * 1.5;

	// Анимация робота
	if (mixer) {
		mixer.update(delta * 0.5);
	}

	controls.update();
	renderer.render(scene, camera);

	stats.end();
	window.requestAnimationFrame(tick);
};
tick();

// Ресайз
window.addEventListener('resize', () => {
	// Обновляем размеры
	sizes.width = window.innerWidth;
	sizes.height = window.innerHeight;

	// Обновляем соотношение сторон камеры
	camera.aspect = sizes.width / sizes.height;
	camera.updateProjectionMatrix();

	// Обновляем renderer
	renderer.setSize(sizes.width, sizes.height);
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	renderer.render(scene, camera);
});

// Фуллскрин
window.addEventListener('dblclick', () => {
	if (!document.fullscreenElement) {
		canvas.requestFullscreen();
	} else {
		document.exitFullscreen();
	}
});

// Перемещение камеры по клавишам
window.addEventListener('keydown', handleKeyDown);

function handleKeyDown (event) {
	const speed = 100;
	switch (event.key) {
		case 'w':
			camera.position.z -= speed;
			break;
		case 's':
			camera.position.z += speed;
			break;
		case 'a':
			camera.position.x -= speed;
			break;
		case 'd':
			camera.position.x += speed;
			break;
	}
}

