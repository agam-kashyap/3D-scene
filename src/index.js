import * as THREE from 'https://unpkg.com/three@0.127.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.127.0/examples/jsm/controls/OrbitControls.js'
import { OBJLoader } from 'https://unpkg.com/three@0.127.0/examples/jsm/loaders/OBJLoader.js';

var controls, scene, renderer;

let CAMERA_STRUCT = {
	fp_camera : new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 0.1, 1000 ),
	drone_camera : new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 1000 ),
	world_camera : new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 1000 )
};

function init() {

	// Screen setup
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );

	// Scene Setup
	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0x000000 );
	// scene.fog = new THREE.FogExp2( 0xcccccc, 0.001 );

	const loadingManager = new THREE.LoadingManager( () => {
	
		const loadingScreen = document.getElementById( 'loading-screen' );
		loadingScreen.classList.add( 'fade-out' );
		
		// optional: remove loader from DOM via event listener
		loadingScreen.addEventListener( 'transitionend', onTransitionEnd );
		
	} );

	const loader = new OBJLoader(loadingManager);
	

	

	// Set initial camera positions
	CAMERA_STRUCT.world_camera.position.set( 100, 1000, 1000 );

	// controls

	controls = new OrbitControls( CAMERA_STRUCT.world_camera, renderer.domElement );
	controls.listenToKeyEvents( window ); // optional

	controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
	controls.dampingFactor = 0.05;

	controls.screenSpacePanning = false;

	controls.minDistance = 100;
	controls.maxDistance = 500;

	controls.maxPolarAngle = Math.PI / 2.2;

	// world

	const plane_geo = new THREE.PlaneGeometry(20000,20000);
	let material = new THREE.MeshPhongMaterial( { color: 0x808080});
	let plane = new THREE.Mesh(plane_geo, material)
	plane.rotation.x = - Math.PI * 0.5;
	// plane.position.y = -10
	plane.receiveShadow = true;
	scene.add(plane);

	const geometry = new THREE.CylinderGeometry( 0, 10, 150, 5, 1 );
	material = new THREE.MeshPhongMaterial( { color: 0xffffff, flatShading: true } );

	// x+z = 200
	// x+z = -200
	// 
	let objcnt=1;
	for (let i = 0; i < 20; i ++ ) {

		let x = -300 + i*100
		let z = 200 - x;

		let object;
		loader.load( '../assets/street-lamp-1/street-lamp.obj', function ( obj ) {

			object = obj;
			
			object.scale.multiplyScalar( 0.1 );
			object.position.x = -x
			object.position.y = 50;
			object.position.z = -z;
			object.rotation.y = -Math.PI/4;
			object.updateMatrix();
			object.matrixAutoUpdate = false;
			object.castShadow = true;		

			let name = "Lamp ".concat(objcnt);
			object.name = name;

			let spotLight = new THREE.SpotLight( 0xffe692, 1 );
			spotLight.position.y = 1100;
			spotLight.position.x = 450;
			spotLight.angle = Math.PI / 6;
			spotLight.penumbra = 0.2;
			spotLight.decay = 2;
			spotLight.distance = 1000;
			spotLight.intensity = 1;

			spotLight.castShadow = true;
			spotLight.shadow.mapSize.width = 212;
			spotLight.shadow.mapSize.height = 212;
			spotLight.shadow.camera.near = 10;
			spotLight.shadow.camera.far = 200;
			spotLight.shadow.focus = 1;

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
			// object.add(spotLight);
			object.children[0].add(spotLight);
			scene.add( object );

			objcnt+=1;
		});
	}

	const box = new THREE.BoxGeometry(60,60,60);
	const box_material = new THREE.MeshPhongMaterial({color: 0xffffff, flatShading: true});
	const cube = new THREE.Mesh(box, box_material);
	cube.position.y = 30;
	cube.position.x = 0;
	cube.updateMatrix();
	cube.castShadow = true;
	scene.add(cube);

	// lights

	const dirLight1 = new THREE.DirectionalLight( 0xff0fff );
	dirLight1.position.set( 1, 1, 1 );
	// scene.add( dirLight1 );

	const dirLight2 = new THREE.DirectionalLight( 0x111111 );
	// dirLight2.position.set( 0, 1, 1 );
	dirLight2.position.y = 10;
	dirLight2.position.x = 10;
	dirLight2.position.z = 10;
	
	scene.add( dirLight2 );

	const ambient = new THREE.AmbientLight( 0xffffff, 0.1 );
	scene.add( ambient );



	window.addEventListener( 'resize', onWindowResize );

	console.log(scene);
}

function onWindowResize() {

	for( var i in CAMERA_STRUCT)
	{
		CAMERA_STRUCT[i].aspect = window.innerWidth / window.innerHeight;
		CAMERA_STRUCT[i].updateProjectionMatrix();
	}
	renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

	requestAnimationFrame( animate );

	controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true

	render();

}

function render() {

	renderer.render( scene, CAMERA_STRUCT.world_camera );

}

function onTransitionEnd( event ) {

	event.target.remove();
	
}

window.addEventListener("keydown", (ev) => {
	if(ev.key == 'v')
	{
		console.log("v");
	}
	if(ev.key == "ArrowUp")
	{
		
	}
});

init();
//render(); // remove when using next line for animation loop (requestAnimationFrame)
animate();