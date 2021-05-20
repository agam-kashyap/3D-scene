import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';


const vehicleColors = [0xa52523, 0xbdbb638,0x78b14b]

function wheel() {
    const wheel = new THREE.Mesh(
        new THREE.BoxBufferGeometry(12,33,12),
        new THREE.MeshLambertMaterial({ color: 0x333333})
    )
    return wheel
}

function pickColor(array) {
    return array[Math.floor(Math.random() * array.length)]
}

export function car() {
    const car = new THREE.Group();

    const backWheel = wheel();
    backWheel.position.z = 6;
    backWheel.position.x = -18;
    car.add(backWheel);

    const frontWheel = wheel();
    frontWheel.position.z = 6;
    frontWheel.position.x = 18;
    car.add(frontWheel);

    const main = new THREE.Mesh(
        new THREE.BoxBufferGeometry(60,30,15),
        new THREE.MeshLambertMaterial({ color: pickColor(vehicleColors) })
    );
    main.position.z = 12;
    car.add(main);

    const cabin = new THREE.Mesh(
        new THREE.BoxBufferGeometry(33,24,12),
        new THREE.MeshLambertMaterial({ color: 0xffffff })
    ); 
    cabin.position.x = -6;
    cabin.position.z = 25.5;
    car.add(cabin);

    return car
}