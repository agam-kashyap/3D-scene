import * as THREE from 'https://unpkg.com/three@0.127.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.127.0/examples/jsm/controls/OrbitControls.js'

let camera, controls, scene, renderer;

let CAMERA_STRUCT = {
	fp_camera : new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 0.1, 1000 ),
	drone_camera : new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 1000 ),
	world_camera : new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 1, 1000 )
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
	scene.fog = new THREE.FogExp2( 0xcccccc, 0.002 );

	// Set initial camera positions
	CAMERA_STRUCT.world_camera.position.set( 400, 200, 500 );

	// controls

	controls = new OrbitControls( CAMERA_STRUCT.world_camera, renderer.domElement );
	controls.listenToKeyEvents( window ); // optional

	controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
	controls.dampingFactor = 0.05;

	controls.screenSpacePanning = false;

	controls.minDistance = 100;
	controls.maxDistance = 500;

	controls.maxPolarAngle = Math.PI / 2;

	// world

	const plane_geo = new THREE.PlaneGeometry(20000,20000);
	let material = new THREE.MeshPhongMaterial( { color: 0x808080});
	let plane = new THREE.Mesh(plane_geo, material)
	plane.rotation.x = - Math.PI * 0.5;
	plane.position.y = -10
	plane.receiveShadow = true;
	scene.add(plane);

	const geometry = new THREE.CylinderGeometry( 0, 10, 150, 5, 1 );
	material = new THREE.MeshPhongMaterial( { color: 0xffffff, flatShading: true } );

	// x+z = 200
	// x+z = -200
	// 
	for ( let i = 0; i < 20; i ++ ) {

		const mesh = new THREE.Mesh( geometry, material );
		let x = -100 + i*100
		let z = 200 - x;

		let spotLight = new THREE.SpotLight( 0xffffff, 1 );
		spotLight.position.y = 75;
		spotLight.angle = Math.PI / 4;
		spotLight.penumbra = 0.1;
		spotLight.decay = 2;
		spotLight.distance = 1200;
		spotLight.intensity = 2;

		spotLight.castShadow = true;
		spotLight.shadow.mapSize.width = 512;
		spotLight.shadow.mapSize.height = 512;
		spotLight.shadow.camera.near = 10;
		spotLight.shadow.camera.far = 200;
		spotLight.shadow.focus = 1;

		const sphere = new THREE.SphereGeometry( 2.5, 16, 8 );
		spotLight.add(new THREE.Mesh(sphere, new THREE.MeshBasicMaterial( { color: 0xffffff })));
		let target = new THREE.Object3D();
		target.position.x = x+100;
		target.position.z = z+100;
		scene.add(target);
		spotLight.target = target;
		mesh.add(spotLight);


		mesh.position.x = x
		mesh.position.y = 75;
		mesh.position.z = z;
		mesh.updateMatrix();
		mesh.matrixAutoUpdate = false;
		mesh.castShadow = true;
		scene.add( mesh );
	}

	const box = new THREE.BoxGeometry(60,60,60);
	const box_material = new THREE.MeshPhongMaterial({color: 0x00ff00, flatShading: true});
	const cube = new THREE.Mesh(box, box_material);
	cube.position.y = 30;
	cube.position.x = 500;
	cube.updateMatrix();
	cube.castShadow = true;
	scene.add(cube);

	// lights

	const dirLight1 = new THREE.DirectionalLight( 0xff0fff );
	dirLight1.position.set( 1, 1, 1 );
	// scene.add( dirLight1 );

	const dirLight2 = new THREE.DirectionalLight( 0x002288 );
	dirLight2.position.set( - 1, - 1, - 1 );
	// scene.add( dirLight2 );

	const ambient = new THREE.AmbientLight( 0xffffff, 0.1 );
	scene.add( ambient );



	window.addEventListener( 'resize', onWindowResize );

}

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

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

window.addEventListener("keydown", (ev) => {
	if(ev.key == 'v')
	{
		console.log("v");
	}
});

init();
//render(); // remove when using next line for animation loop (requestAnimationFrame)
animate();