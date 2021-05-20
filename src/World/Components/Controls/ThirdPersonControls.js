import {
	MathUtils,
	Spherical,
	Vector3,
    Clock,
    Quaternion
} from 'https://unpkg.com/three@0.127.0/build/three.module.js';

class ThirdPersonControls {
    constructor( object, camera, domElement)
    {
        this.enabled = false;
        this.object = object;
        this.camera = camera;
        this.domElement = domElement;
        this.speed = 150;
		this.lookSpeed = 5;

        this._cameraPosition = new Vector3();
        this._cameraLook = new Vector3();

        this.mouseX = 0;
        this.mouseY = 0;

        this.moveForward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.moveBackward = false;
        this.onMouseMove = function ( event ) {
            if ( this.domElement === document ) {

				this.mouseX = event.pageX ;
				this.mouseY = event.pageY;

			} else {

				this.mouseX = event.pageX - this.domElement.offsetLeft ;
				this.mouseY = event.pageY - this.domElement.offsetTop ;

			}
        }

        this.keyDown = function ( event ) {
            if(event.code == 'ArrowUp' || event.code == 'KeyW')
            {
                this.moveForward = true;
            }
            if(event.code == 'ArrowLeft' || event.code == 'KeyA')
            {
                this.moveLeft = true;
            }
            if(event.code == 'ArrowRight' || event.code == 'KeyD')
            {
                this.moveRight = true;
            }
            if(event.code == 'ArrowDown' || event.code == 'KeyS')
            {
                this.moveBackward = true;
            }
        }

        this.keyUp = function ( event ) {
            if(event.code == 'ArrowUp' || event.code == 'KeyW')
            {
                this.moveForward = false;
            }
            if(event.code == 'ArrowLeft' || event.code == 'KeyA')
            {
                this.moveLeft = false;
            }
            if(event.code == 'ArrowRight' || event.code == 'KeyD')
            {
                this.moveRight = false;
            }
            if(event.code == 'ArrowDown' || event.code == 'KeyS')
            {
                this.moveBackward = false;
            }
        }

        const _onMouseMove = this.onMouseMove.bind(this);
        const _onKeyUp = this.keyUp.bind(this);
        const _onKeyDown = this.keyDown.bind(this);

        this.domElement.addEventListener( 'mousemove', _onMouseMove);
        window.addEventListener( 'keyup', _onKeyUp);
        window.addEventListener( 'keydown', _onKeyDown);
    }

    update()
    {
        let delta = 0.01;
        if(!this.enabled) return;
        let actualLookSpeed = delta * this.lookSpeed //* 350;
        let actualMoveSpeed = delta * this.speed //* 1000;
        // Defining -Z as forward direction, -X as left direction
        if(this.moveForward) this.object.translateZ(-actualMoveSpeed) ;
        if(this.moveBackward) this.object.translateZ( actualMoveSpeed );
        if(this.moveLeft) this.object.translateX( -actualMoveSpeed );
        if(this.moveRight) this.object.translateX( actualMoveSpeed );
        
        let obj_lat = 0;
        let cam_lat = 0;
        let lon = 0;
        lon = -this.mouseX * actualLookSpeed;
        cam_lat = -this.mouseY * actualLookSpeed;

        let obj_phi = MathUtils.degToRad(90);
        let cam_phi = MathUtils.degToRad(90 - cam_lat);
        let theta = MathUtils.degToRad(Math.max(-90, Math.min(90, lon)));

        let _objDirection = new Vector3();
        _objDirection.setFromSphericalCoords(1, obj_phi, theta);
        this.object.lookAt(_objDirection.add(this.object.position));

        let DirectionVec = new Vector3();
        DirectionVec.setFromSphericalCoords(1, cam_phi, theta);

        let _objectposition = new Vector3(this.object.position.x, this.object.position.y+200, this.object.position.z);
        let CameraPosition = _objectposition.add(DirectionVec.multiplyScalar(300));

        // Calculate a position for the camera 
        const t = 1.0 - Math.pow(0.01, delta);
        this._cameraPosition.lerp(CameraPosition, t);
        this._cameraLook.lerp(this.object.position, t);

        this.camera.position.copy(this._cameraPosition);
        this.camera.lookAt(this._cameraLook);
    }
}

export {ThirdPersonControls};