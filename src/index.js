import * as THREE from 'https://unpkg.com/three@0.127.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.127.0/examples/jsm/controls/OrbitControls.js'
import { OBJLoader } from 'https://unpkg.com/three@0.127.0/examples/jsm/loaders/OBJLoader.js';
import Stats from 'https://unpkg.com/three@0.127.0/examples/jsm/libs/stats.module.js';
import { PersonController } from './World/Components/Controls/FirstPersonControl.js';
//------------------------GLOBAL VARIABLES-------------------------------------
var world_controls, 
	fp_controls, 
	scene, 
	renderer, 
	stats,
	scenery, 
	scenery_loaded = false,
	DayTexture,
	NightTexture,
	DayDirLight,
	NightDirLight;

var CAMERA_STRUCT = 
{
	world_camera : new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 10000 ),	//CURRENT_VIEW = 0
	fp_camera : new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 0.1, 10000 ), 		//CURRENT_VIEW = 1 
	drone_camera : new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 10000 ),	//CURRENT_VIEW = 2
};
var CURRENT_VIEW = 0,
	day = false; 

const clock = new THREE.Clock();

var base_position
// Animation Variables:
var previousRAF = null,
	fp_controls,
	followLight;
/*
init() used to setup all the assets of the scene,  setup controls, cameras and textures.
Provides a loading manager, shown during loading of all assets
Current scene graph:
Scene
|- dirLight
|- Ambient light
|- Plane
|- Lamps(50)
|	|-SpotLight
|		|-Sphere
|		|-PointLight
|- Player
|	|-drone camera
|	|-first person camera
*/

//-------------------------------LOADING SCREEN--------------------------------------------

const loadingManager = new THREE.LoadingManager( () => 
{
	const loadingScreen = document.getElementById( 'loading-screen' );
	loadingScreen.classList.add( 'fade-out' );
	loadingScreen.addEventListener( 'transitionend', onTransitionEnd );		
});
const loader = new OBJLoader(loadingManager);

//---------------------------------INIT BEGINS---------------------------------------------
function init() {

	//---------------------------------SCREEN SETUP---------------------------------------
	{
		renderer = new THREE.WebGLRenderer( { antialias: true } );
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize( window.innerWidth, window.innerHeight );
		document.body.appendChild( renderer.domElement );
		stats = new Stats();
		document.body.appendChild( stats.dom );
	}

	//---------------------------------CREATING MAIN SCENE--------------------------------
	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0x210021 );

	const TextureLoader = new THREE.CubeTextureLoader();
	DayTexture = TextureLoader.load([
		'/assets/Texture/Day/posx.png',
		'/assets/Texture/Day/negx.png',
		'/assets/Texture/Day/posy.png',
		'/assets/Texture/Day/negy.png',
		'/assets/Texture/Day/posz.png',
		'/assets/Texture/Day/negz.png',
	]);
	NightTexture = TextureLoader.load([
		'/assets/Texture/Night/posx.png',
		'/assets/Texture/Night/negx.png',
		'/assets/Texture/Night/posy.png',
		'/assets/Texture/Night/negy.png',
		'/assets/Texture/Night/posz.png',
		'/assets/Texture/Night/negz.png',
	]);
	DayTexture.encoding = THREE.sRGBEncoding;
	NightTexture.encoding = THREE.sRGBEncoding;

	//----------------------------WORLD CAMERA CONTROLS----------------------------------
	{
		CAMERA_STRUCT.world_camera.position.set( -1000, 1000, 0 );
		world_controls = new OrbitControls( CAMERA_STRUCT.world_camera, renderer.domElement );
		world_controls.listenToKeyEvents( window ); 
		world_controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
		world_controls.dampingFactor = 0.05;
		world_controls.screenSpacePanning = false;
		world_controls.minDistance = 100;
		world_controls.maxDistance = 100000;
		world_controls.maxPolarAngle = Math.PI / 2.2;
		world_controls.keys = {
			LEFT: 'Numpad4', //left arrow
			UP: 'Numpad8', // up arrow
			RIGHT: 'Numpad6', // right arrow
			BOTTOM: 'Numpad2' // down arrow
		}
	}

	//--------------------PLANE---------------------------------------
	{
		loader.load( '/assets/mesh/scene/scene.obj', function ( obj ) {
			scenery = obj;
			scene.add(scenery)
			scenery_loaded = true;
		});
	}

	//----------------------------STREET LAMPS-----------------------------------------
	{
		let objcnt=1;
		for(let j = 1; j>-2; j=j-2)
		{
			for (let i = 0; i < 9; i ++ ) {

				let x = -750 + i*200
				let z = -200*j;
				let object;
				loader.load( '../assets/mesh/street-lamp-1/street-lamp.obj', function ( obj ) {

					object = obj;
					
					object.scale.multiplyScalar( 0.1 );
					object.position.x = x
					object.position.y = 50;
					object.position.z = z;
					object.rotation.y = -Math.PI/2*j;
					object.updateMatrix();
					object.matrixAutoUpdate = false;

					let name = "Lamp ".concat(objcnt);
					object.name = name;

					let spotLight = new THREE.SpotLight( 0xffe692, 1 );
					spotLight.position.y = 1100;
					spotLight.position.x = 450;
					spotLight.angle = Math.PI/7 ;
					spotLight.penumbra = 0.5;
					spotLight.decay = 2;
					spotLight.distance = 1000;
					spotLight.intensity = 1;

					spotLight.name = "Light".concat(toString(objcnt));

					const sphere = new THREE.SphereGeometry( 50, 16, 8 );
					spotLight.add(new THREE.Mesh(sphere, new THREE.MeshBasicMaterial( { color: 0xffe692 })));
					
					let target = new THREE.Object3D();
					target.position.x = x;
					target.position.z = -100*j;
					scene.add(target);

					spotLight.target = target;
					object.children[0].add(spotLight);
					scene.add( object );

					objcnt+=1;
				});
			}
		}
	}

	//------------------------------------PLAYER SETUP-------------------------------------------
	{
		const box = new THREE.BoxGeometry(0,0,0);
		const box_material = new THREE.MeshPhongMaterial({color: 0xffffff, flatShading: true});
		const cube = new THREE.Mesh(box, box_material);
		cube.name = "player1"
		cube.position.y = 30;
		cube.lookAt(0,0,-200);
		cube.updateMatrix();

		// cube.add(CAMERA_STRUCT.fp_camera); // Making the first person camera Player's children, to facilitate same movement
		CAMERA_STRUCT.drone_camera.position.y = cube.position.y + 200;
		CAMERA_STRUCT.drone_camera.position.z = cube.position.z + 200; 
		CAMERA_STRUCT.drone_camera.lookAt(cube.position.x, cube.position.y, cube.position.z); //Order of calling position, lookat relatively, matters
		scene.add(CAMERA_STRUCT.drone_camera); //Making the drone Player's children, so that it can move along with the player
		scene.add(cube);
	}
	
	//---------------------------------------PLAYER CONTROLS-------------------------------------
	{
		var params = {
			fpcamera: CAMERA_STRUCT.fp_camera,
			thirdcamera: CAMERA_STRUCT.drone_camera,
			scene: scene,
			domElement: renderer.domElement,
		}
		var params_third = {
			camera: CAMERA_STRUCT.drone_camera,
			scene: scene,
			domElement: renderer.domElement,
		}

		followLight = new THREE.SpotLight(0xffffff);
		const trackLightMesh = new THREE.SphereGeometry(30,10,10);
		followLight.add(new THREE.Mesh(trackLightMesh, new THREE.MeshBasicMaterial({ color: 0xffffff})));
		console.log(followLight);
		followLight.position.set(-440,750,283);
		scene.add(followLight);
		followLight.angle = Math.PI/100
		

		fp_controls = new PersonController(params, followLight);
		

	}
	//---------------------------------------SCENE LIGHT-----------------------------------------
	{
		NightDirLight = new THREE.DirectionalLight( 0x210021 ); //Simulating night scene for now
		NightDirLight.position.set(50, 50, 50);
		// scene.add( NightDirLight );

		DayDirLight = new THREE.DirectionalLight( 0xfdfbd3 ); //Simulating night scene for now
		DayDirLight.position.set(-50, 50, 50);
		// scene.add( DayDirLight );
		
		const NightAmbient = new THREE.AmbientLight( 0xffffff, 0.1 );
		scene.add( NightAmbient );
	}

	//---------------------------------------ENABLE RESIZE--------------------------------------
	window.addEventListener( 'resize', onWindowResize );

	//----------------------------------------HELPERS-------------------------------------------
	const helper_drone = new THREE.CameraHelper( CAMERA_STRUCT.drone_camera );
	// scene.add(helper_drone);
	const helper_fp = new THREE.CameraHelper( CAMERA_STRUCT.fp_camera );
	// scene.add(helper_fp);
	const helper_world = new THREE.CameraHelper( CAMERA_STRUCT.world_camera );
	// scene.add(helper_world);
	const size = 1000;
	const divisions = 10;

	const gridHelper = new THREE.GridHelper( size, divisions, 0xffffff, 0xcccccc );
	// scene.add( gridHelper );

	const axesHelper = new THREE.AxesHelper( 1000 );
	scene.add( axesHelper );	
}
//-------------------------------------------------------------------------------------------------------------------------

//---------------------------------------EVENT HANDLING--------------------------------------------------------------------
window.addEventListener("keydown", (ev) => {
	if(ev.key == 'v')
	{
		CURRENT_VIEW += 1;
		CURRENT_VIEW %= 3;
	}
	if(ev.key == 'n')
	{
		day = !day;
		console.log(!day);
	}
});
//------------------------------------------------------------------------------------------------------------------------

function onWindowResize() {

	for( var i in CAMERA_STRUCT)
	{
		CAMERA_STRUCT[i].aspect = window.innerWidth / window.innerHeight;
		CAMERA_STRUCT[i].updateProjectionMatrix();
	}
	renderer.setSize( window.innerWidth, window.innerHeight );

}

//--------Loading screen helper-------------
function onTransitionEnd( event ) 
{
	event.target.remove();	
}
//------------------------------------------

//---------------Animation Loop-------------
function animate() 
{
	if(day)
	{
		scene.background = DayTexture;
		scene.add(DayDirLight);
		scene.remove(NightDirLight);
		followLight.color = new THREE.Color(1,0,0);
	}
	else
	{
		scene.background = NightTexture;
		scene.add(NightDirLight);
		scene.remove(DayDirLight);
		followLight.color = new THREE.Color(1,1,1);
	}
	// requestAnimationFrame( animate );
	if(CURRENT_VIEW == 0)
	{
		world_controls.enabled = true;
		fp_controls.enabled = true;
		render();
	}
	else if(CURRENT_VIEW == 1)
	{
		world_controls.enabled = false;
		fp_controls.enabled = true;
		render();
	}
	else
	{
		world_controls.enabled = false;
		fp_controls.enabled = true;
		render();
	}
	requestAnimationFrame((t) => {
		if(previousRAF === null)
		{
			previousRAF = t;
		}
		animate();
		step(t - previousRAF);
		previousRAF = t;
	});
}

function step(timeElapsed)
{
	const timeElapsedS = timeElapsed* 0.001;

	fp_controls.Update(timeElapsedS);
	world_controls.update(timeElapsedS);
	stats.update(timeElapsedS);
}
function render() 
{
	if(CURRENT_VIEW == 0)
		renderer.render( scene, CAMERA_STRUCT.world_camera );
	else if(CURRENT_VIEW == 1)
		renderer.render(scene, CAMERA_STRUCT.fp_camera);
	else
		renderer.render(scene, CAMERA_STRUCT.drone_camera);
}
//------------------------------------------

init();
animate();