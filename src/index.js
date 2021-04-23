import * as THREE from 'https://unpkg.com/three@0.127.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.127.0/examples/jsm/controls/OrbitControls.js'
import { OBJLoader } from 'https://unpkg.com/three@0.127.0/examples/jsm/loaders/OBJLoader.js';
import Stats from 'https://unpkg.com/three@0.127.0/examples/jsm/libs/stats.module.js';
import { FirstPersonControls } from './World/Components/Controls/FirstPersonControls.js'
//------------------------GLOBAL VARIABLES-------------------------------------
var world_controls, fp_controls, drone_controls; 
var scene, renderer, stats;
var plane;
var CAMERA_STRUCT = 
{
	world_camera : new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 10000 ),	//CURRENT_VIEW = 0
	fp_camera : new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 0.1, 10000 ), 		//CURRENT_VIEW = 1 
	drone_camera : new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 10000 ),	//CURRENT_VIEW = 2
};
var CURRENT_VIEW = 0; 

const clock = new THREE.Clock();
//---------------------------------LOADING SCREEN--------------------------------------------

const loadingManager = new THREE.LoadingManager( () => 
{
	const loadingScreen = document.getElementById( 'loading-screen' );
	loadingScreen.classList.add( 'fade-out' );
	loadingScreen.addEventListener( 'transitionend', onTransitionEnd );		
});
const loader = new OBJLoader(loadingManager);

/*
init() used to setup all the assets of the scene,  setup controls, cameras and textures.
Provides a loading manager, shown during loading of all assets
Current scene graph:
Scene
|- dirLight
|- Ambient light
|- stars(300)
|- Plane
|- Lamps(50)
|	|-SpotLight
|		|-Sphere
|		|-PointLight
|- Player
|	|-drone camera
|	|-first person camera
*/

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

	//----------------------------WORLD CAMERA CONTROLS----------------------------------
	{
		CAMERA_STRUCT.world_camera.position.set( 100, 1000, 1000 );
		world_controls = new OrbitControls( CAMERA_STRUCT.world_camera, renderer.domElement );
		world_controls.listenToKeyEvents( window ); 
		world_controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
		world_controls.dampingFactor = 0.05;
		world_controls.screenSpacePanning = false;
		world_controls.minDistance = 100;
		world_controls.maxDistance = 1000;
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
		const plane_geo = new THREE.PlaneGeometry(20000,20000);
		let material = new THREE.MeshPhongMaterial( { color: 0x808080});
		plane = new THREE.Mesh(plane_geo, material)
		plane.rotation.x = - Math.PI * 0.5;
		plane.name = "Plane";
		scene.add(plane);
	}

	//---------------------STARS random generation--------------------
	{
		let minX=Infinity, minY=Infinity, minZ=Infinity, maxX=-Infinity, maxY=-Infinity, maxZ=-Infinity;
		let pos = plane.geometry.attributes.position.array;
		for(let i=0; i< 12;i++)
		{
			if(pos[i] < minX)
			{
				minX = pos[i];
			}
			if(pos[i] > maxX)
			{
				maxX = pos[i];
			}
			if(pos[i] < minY)
			{
				minY = pos[i];
			}
			if(pos[i] > maxY)
			{
				maxY = pos[i];
			}
			if(pos[i] < minZ)
			{
				minZ = pos[i];
			}
			if(pos[i] > maxZ)
			{
				maxZ = pos[i];
			}
		}
		for(let i =0; i< 300;i++)
		{
			let x = Math.floor(Math.random() * (maxX - minX) + minX);
			let z = Math.floor(Math.random() * (maxZ - minZ) + minZ);
			let y = Math.floor(Math.random() * 2000 + 1000);
			const star = new THREE.SphereGeometry( 5, 16, 8 );
			const starMesh = new THREE.Mesh(star, new THREE.MeshBasicMaterial( { color: '#'+(Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0') }))
			starMesh.position.x = x;
			starMesh.position.y = y;
			starMesh.position.z = z;
			scene.add(starMesh);
		}
	}

	//----------------------------STREET LAMPS-----------------------------------------
	{
		let objcnt=1;
		for (let i = 0; i < 30; i ++ ) {

			let x = -3000 + i*200
			let z = 200 - x;

			let object;
			loader.load( '../assets/mesh/street-lamp-1/street-lamp.obj', function ( obj ) {

				object = obj;
				
				object.scale.multiplyScalar( 0.1 );
				object.position.x = -x
				object.position.y = 50;
				object.position.z = -z;
				object.rotation.y = -Math.PI/4;
				object.updateMatrix();
				object.matrixAutoUpdate = false;

				let name = "Lamp ".concat(objcnt);
				object.name = name;

				let spotLight = new THREE.SpotLight( 0xffe692, 1 );
				spotLight.position.y = 1100;
				spotLight.position.x = 450;
				spotLight.angle = Math.PI / 5;
				spotLight.penumbra = 0.5;
				spotLight.decay = 2;
				spotLight.distance = 1000;
				spotLight.intensity = 1;

				spotLight.name = "Light".concat(toString(objcnt));

				let pointLight =  new THREE.PointLight( 0xffe692, 2, 100 );
				spotLight.add(pointLight);

				const sphere = new THREE.SphereGeometry( 50, 16, 8 );
				spotLight.add(new THREE.Mesh(sphere, new THREE.MeshBasicMaterial( { color: 0xffe692 })));
				
				let target = new THREE.Object3D();
				target.position.x = -x+50;
				target.position.z = -z+50;
				scene.add(target);

				spotLight.target = target;
				object.children[0].add(spotLight);
				scene.add( object );

				objcnt+=1;
			});
		}
	}

	//------------------------------------PLAYER SETUP-------------------------------------------
	{
		const box = new THREE.BoxGeometry(60,60,60);
		const box_material = new THREE.MeshPhongMaterial({color: 0xffffff, flatShading: true});
		const cube = new THREE.Mesh(box, box_material);
		cube.name = "player1"
		cube.position.y = 30;
		cube.updateMatrix();

		cube.add(CAMERA_STRUCT.fp_camera); // Making the first person camera Player's children, to facilitate same movement
		CAMERA_STRUCT.drone_camera.position.y = cube.position.y + 200;
		CAMERA_STRUCT.drone_camera.position.x = cube.position.x - 200;
		CAMERA_STRUCT.drone_camera.position.z = cube.position.z - 200; 
		CAMERA_STRUCT.drone_camera.lookAt(cube.position.x, cube.position.y, cube.position.z); //Order of calling position, lookat relatively, matters
		cube.add(CAMERA_STRUCT.drone_camera); //Making the drone Player's children, so that it can move along with the player
		scene.add(cube);
	}
	
	//---------------------------------------PLAYER CONTROLS-------------------------------------
	{
		fp_controls = new FirstPersonControls(scene.getObjectByName("player1"), CAMERA_STRUCT.fp_camera, renderer.domElement);
		fp_controls.lookVertical = true; //Work on Keeping movement restricted to ground
		fp_controls.movementSpeed = 150;
		fp_controls.lookSpeed = 0.1;
		fp_controls.activeLook = false;
	}
	//---------------------------------------SCENE LIGHT-----------------------------------------
	{
		const dirLight = new THREE.DirectionalLight( 0x210021 ); //Simulating night scene for now
		dirLight.position.set(50, 50, 50);
		scene.add( dirLight );

		const ambient = new THREE.AmbientLight( 0xffffff, 0.1 );
		scene.add( ambient );
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
}
//-------------------------------------------------------------------------------------------------------------------------

//---------------------------------------EVENT HANDLING--------------------------------------------------------------------
window.addEventListener("keydown", (ev) => {
	if(ev.key == 'v')
	{
		CURRENT_VIEW += 1;
		CURRENT_VIEW %= 3;
	}
	// if(ev.key == "ArrowUp")
	// {
	// 	scene.getObjectByName("player1").position.x += 1;
	// 	scene.getObjectByName("player1").updateMatrix();
	// }
	// if(ev.key == "ArrowDown")
	// {
	// 	scene.getObjectByName("player1").position.x -= 1;
	// 	scene.getObjectByName("player1").updateMatrix();
	// }
	// if(ev.key == "ArrowLeft")
	// {
	// 	scene.getObjectByName("player1").position.z -= 1;
	// 	scene.getObjectByName("player1").updateMatrix();
	// }
	// if(ev.key == "ArrowRight")
	// {
	// 	scene.getObjectByName("player1").position.z += 1;
	// 	scene.getObjectByName("player1").updateMatrix();
	// }
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
	requestAnimationFrame( animate );
	if(CURRENT_VIEW == 0)
	{
		world_controls.enabled = true;
		fp_controls.enabled = false;
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
		fp_controls.enabled = false;
		render();
	}
	fp_controls.update(clock.getDelta());
	world_controls.update(clock.getDelta());
	stats.update(clock.getDelta());
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