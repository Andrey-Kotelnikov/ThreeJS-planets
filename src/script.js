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
// scene.add(axesHelper);


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
// scene.add(light.target);

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
// scene.add(helper);

// Отличная визуализация теневой карты напрвленного света
const cameraHelper = new THREE.CameraHelper(light.shadow.camera);
// scene.add(cameraHelper);


// Меши ----------------------------------------------------------------------

// Пол (трава)
const floorGeometry = new THREE.BoxGeometry(10000, 10000, 10);
// const floorGeometry = new THREE.PlaneGeometry(10000, 10000, 10, 10);
const floorMaterial = new THREE.MeshPhongMaterial({
	// color: 'gray',
	// wireframe: true,
	map: grassTexture,
	side: THREE.DoubleSide,
});
const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
floorMesh.rotation.x = -Math.PI / 2;
// floorMesh.position.set(0, -10, 0)
floorMesh.receiveShadow = true;
scene.add(floorMesh);

// Стены
const wallGeometry = new THREE.BoxGeometry(10000, 1000, 10);
// const wallGeometry = new THREE.PlaneGeometry(10000, 1000)
const wallMaterial = new THREE.MeshPhongMaterial({
	// color: 'gray',
	// wireframe: true,
	map: brickWallTexture,
	// side: THREE.DoubleSide,
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

// Падающая сфера1
const sphereGeo = new THREE.SphereGeometry(100);
const sphereMat = new THREE.MeshPhongMaterial({ color: 'red' });
const sphere = new THREE.Mesh(sphereGeo, sphereMat);
// sphere.position.set(0, 5, 0);
sphere.castShadow = true;
sphere.receiveShadow = true;
scene.add(sphere);

// Падающая сфера2
const sphereGeo2 = new THREE.SphereGeometry(150);
const sphereMat2 = new THREE.MeshPhongMaterial({ color: 'yellow' });
const sphere2 = new THREE.Mesh(sphereGeo2, sphereMat2);
// sphere.position.set(0, 5, 0);
sphere2.castShadow = true;
sphere2.receiveShadow = true;
scene.add(sphere2);

// Падающий куб
const cubeGeo = new THREE.BoxGeometry(80, 100, 60);
const cubeMat = new THREE.MeshPhongMaterial({
	color: 'gray',
	// wireframe: true,
});
const cube = new THREE.Mesh(cubeGeo, cubeMat);
// mesh.position.set(0, 1, 0);
cube.castShadow = true;
cube.receiveShadow = true;
scene.add(cube)


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
world.gravity.set(0, -981, 0); // увеличено в 100 раз для масштаба

// CannonDebugRenderer
const cannonDebugRenderer = new CannonDebugRenderer(scene, world);

// Пол
const floorBody = new CANNON.Body({
	mass: 0,
	// position: new CANNON.Vec3(0, -10, 0),
})
const floorShape = new CANNON.Box(new CANNON.Vec3(5000, 5000, 5))
floorBody.addShape(floorShape);
floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
world.addBody(floorBody);

// Стены--------------------------
const wallShape = new CANNON.Box(new CANNON.Vec3(5000, 500, 5));

// Ближняя
const nearWallBody = new CANNON.Body({
	mass: 0,
	shape: wallShape,
	// position: new CANNON.Vec3(0, -10, 0),
})
nearWallBody.position.set(0, 500, 5000);
world.addBody(nearWallBody);

// Дальняя
const farWallBody = new CANNON.Body({
	mass: 0,
	shape: wallShape,
})
farWallBody.position.set(0, 500, -5000);
world.addBody(farWallBody);

// Правая
const rightWallBody = new CANNON.Body({
	mass: 0,
	shape: wallShape,
})
rightWallBody.position.set(5000, 500, 0);
rightWallBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 2);
world.addBody(rightWallBody);

// Левая
const leftWallBody = new CANNON.Body({
	mass: 0,
	shape: wallShape,
})
leftWallBody.position.set(-5000, 500, 0);
leftWallBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 2);
world.addBody(leftWallBody);

// Сфера1
const sphereShape = new CANNON.Sphere(100);
const sphereBody = new CANNON.Body({
	mass: 100,
	shape: sphereShape,
	position: new CANNON.Vec3(-2000, 4000, 1970),
});
world.addBody(sphereBody);

// Сфера2
const sphereShape2 = new CANNON.Sphere(150);
const sphereBody2 = new CANNON.Body({
	mass: 100,
	shape: sphereShape2,
	position: new CANNON.Vec3(-2000, 6000, 1970),
});
world.addBody(sphereBody2);

// Куб
const cubeBody = new CANNON.Body({
	mass: 90,
	position: new CANNON.Vec3(-2000, 2000, 2000),
});
const cubeShape = new CANNON.Box(new CANNON.Vec3(40, 50, 30));
cubeBody.addShape(cubeShape);
world.addBody(cubeBody);


// Функционал-----------------------------------------------------------------

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

	// отображение дебагера
	// cannonDebugRenderer.update();

	world.step(1 / 60);

	// Обновление сферы1
	sphere.position.copy(sphereBody.position)
	sphere.quaternion.copy(sphereBody.quaternion)

	// Обновление сферы2
	sphere2.position.copy(sphereBody2.position)
	sphere2.quaternion.copy(sphereBody2.quaternion)

	// Обновление куба
	cube.position.copy(cubeBody.position);
	cube.quaternion.copy(cubeBody.quaternion);

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
