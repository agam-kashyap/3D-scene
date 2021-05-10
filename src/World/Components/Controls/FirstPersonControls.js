import {
	MathUtils,
	Spherical,
	Vector3
} from 'https://unpkg.com/three@0.127.0/build/three.module.js';

const _lookDirection = new Vector3();
const _spherical = new Spherical();
const _target = new Vector3();

class FirstPersonControls {

	constructor( object, camera, domElement ) {

		if ( domElement === undefined ) {

			console.warn( 'THREE.FirstPersonControls: The second parameter "domElement" is now mandatory.' );
			domElement = document;

		}

		this.object = object;
		this.camera = camera;
		this.domElement = domElement;

		// API

		this.enabled = true;

		this.movementSpeed = 1.0;
		this.lookSpeed = 0.005;

		this.lookVertical = true;
		this.autoForward = false;

		this.activeLook = true;

		this.heightSpeed = false;
		this.heightCoef = 1.0;
		this.heightMin = 0.0;
		this.heightMax = 1.0;

		this.constrainVertical = false;
		this.verticalMin = 0;
		this.verticalMax = Math.PI;

		this.mouseDragOn = false;

		// internals

		this.autoSpeedFactor = 0.0;

		this.mouseX = 0;
		this.mouseY = 0;

		this.moveForward = false;
		this.moveBackward = false;
		this.moveLeft = false;
		this.moveRight = false;

		this.viewHalfX = 0;
		this.viewHalfY = 0;

		// private variables

		let obj_lat = 0;
		let obj_lon = 0;
		let cam_lat = 0;
		let cam_lon = 0;

		//

		this.handleResize = function () {

			if ( this.domElement === document ) {

				this.viewHalfX = window.innerWidth / 2;
				this.viewHalfY = window.innerHeight / 2;

			} else {

				this.viewHalfX = this.domElement.offsetWidth / 2;
				this.viewHalfY = this.domElement.offsetHeight / 2;

			}

		};

		this.onMouseDown = function ( event ) {

			if ( this.domElement !== document ) {

				this.domElement.focus();

			}

			event.preventDefault();

			if ( this.activeLook ) {

				switch ( event.button ) {

					case 0: this.moveForward = true; break;
					case 2: this.moveBackward = true; break;

				}

			}

			this.mouseDragOn = true;

		};

		this.onMouseUp = function ( event ) {

			event.preventDefault();

			if ( this.activeLook ) {

				switch ( event.button ) {

					case 0: this.moveForward = false; break;
					case 2: this.moveBackward = false; break;

				}

			}

			this.mouseDragOn = false;

		};

		this.onMouseMove = function ( event ) {

			if ( this.domElement === document ) {

				this.mouseX = event.pageX - this.viewHalfX;
				this.mouseY = event.pageY - this.viewHalfY;

			} else {

				this.mouseX = event.pageX - this.domElement.offsetLeft - this.viewHalfX;
				this.mouseY = event.pageY - this.domElement.offsetTop - this.viewHalfY;

			}

		};

		this.onKeyDown = function ( event ) {

			//event.preventDefault();

			switch ( event.code ) {

				case 'ArrowUp':
				case 'KeyW': this.moveForward = true; break;

				case 'ArrowLeft':
				case 'KeyA': this.moveLeft = true; break;

				case 'ArrowDown':
				case 'KeyS': this.moveBackward = true; break;

				case 'ArrowRight':
				case 'KeyD': this.moveRight = true; break;

				// case 'KeyR': this.moveUp = true; break;
				// case 'KeyF': this.moveDown = true; break;

			}

		};

		this.onKeyUp = function ( event ) {
			switch ( event.code ) {

				case 'ArrowUp':
				case 'KeyW': this.moveForward = false; break;

				case 'ArrowLeft':
				case 'KeyA': this.moveLeft = false; break;

				case 'ArrowDown':
				case 'KeyS': this.moveBackward = false; break;

				case 'ArrowRight':
				case 'KeyD': this.moveRight = false; break;

				// case 'KeyR': this.moveUp = false; break;
				// case 'KeyF': this.moveDown = false; break;

			}

		};

		this.lookAt = function ( x, y, z ) {

			if ( x.isVector3 ) {

				_target.copy( x );

			} else {

				_target.set( x, y, z );

			}

			this.object.lookAt( _target );

			setOrientation( this );

			return this;

		};

		this.update = function () {

			const ObjTargetPosition = new Vector3();
			const CameraTargetPosition = new Vector3();

			return function update( delta ) {

				if ( this.enabled === false ) return;

				if ( this.heightSpeed ) {

					const y = MathUtils.clamp( this.object.position.y, this.heightMin, this.heightMax );
					const heightDelta = y - this.heightMin;

					this.autoSpeedFactor = delta * ( heightDelta * this.heightCoef );

				} else {

					this.autoSpeedFactor = 0.0;

				}

				const actualMoveSpeed = delta * this.movementSpeed;

				if ( this.moveForward || ( this.autoForward && ! this.moveBackward ) ) this.object.translateZ( - ( actualMoveSpeed + this.autoSpeedFactor ) );
				if ( this.moveBackward ) this.object.translateZ( actualMoveSpeed );

				if ( this.moveLeft ) this.object.translateX( - actualMoveSpeed );
				if ( this.moveRight ) this.object.translateX( actualMoveSpeed );

				if ( this.moveUp ) this.object.translateY( actualMoveSpeed );
				if ( this.moveDown ) this.object.translateY( - actualMoveSpeed );

				let actualLookSpeed = delta * this.lookSpeed;

				if ( ! this.activeLook ) {

					actualLookSpeed = 1/8;

				}

				let verticalLookRatio = 1;

				if ( this.constrainVertical ) {

					verticalLookRatio = Math.PI / ( this.verticalMax - this.verticalMin );

				}

				obj_lon = -this.mouseX * actualLookSpeed;
				if ( this.lookVertical ) cam_lat = -this.mouseY * actualLookSpeed * verticalLookRatio;
				
				
				// obj_lat = Math.max( - 85, Math.min( 85, obj_lat ) );
				obj_lat = 0;

				let phi = MathUtils.degToRad( 90 - obj_lat );
				obj_lon = Math.max( -90, Math.min( 90, obj_lon ) );
				const theta = MathUtils.degToRad( obj_lon );

				if ( this.constrainVertical ) {

					phi = MathUtils.mapLinear( phi, 0, Math.PI, this.verticalMin, this.verticalMax );

				}

				const position = this.object.position;

				ObjTargetPosition.setFromSphericalCoords( 1, phi, theta ).add( position );

				this.object.lookAt( ObjTargetPosition );

				//--------------CAMERA ORIENTATION-----------------------
				cam_lon = obj_lon;
				cam_lat = Math.max( -90, Math.min( 0, cam_lat ) );
				let cam_phi = MathUtils.degToRad( cam_lat - 45);
				const cam_theta = MathUtils.degToRad( cam_lon );

				if ( true) {

					cam_phi = MathUtils.mapLinear( cam_phi, 0,Math.PI, this.verticalMin, this.verticalMax );

				}

				CameraTargetPosition.setFromSphericalCoords( 1, cam_phi, cam_theta ).add( position );
				this.camera.lookAt(CameraTargetPosition);
			};

		}();

		this.dispose = function () {

			this.domElement.removeEventListener( 'contextmenu', contextmenu );
			// this.domElement.removeEventListener( 'mousedown', _onMouseDown );
			this.domElement.removeEventListener( 'mousemove', _onMouseMove );
			// this.domElement.removeEventListener( 'mouseup', _onMouseUp );

			window.removeEventListener( 'keydown', _onKeyDown );
			window.removeEventListener( 'keyup', _onKeyUp );

		};

		const _onMouseMove = this.onMouseMove.bind( this );
		const _onKeyDown = this.onKeyDown.bind( this );
		const _onKeyUp = this.onKeyUp.bind( this );

		this.domElement.addEventListener( 'contextmenu', contextmenu );
		this.domElement.addEventListener( 'mousemove', _onMouseMove );

		window.addEventListener( 'keydown', _onKeyDown );
		window.addEventListener( 'keyup', _onKeyUp );

		function setOrientation( controls ) {

			const quaternion = controls.object.quaternion;

			_lookDirection.set( -1, 0, - 1 ).applyQuaternion( quaternion );
			_spherical.setFromVector3( _lookDirection );

			obj_lat = 90 - MathUtils.radToDeg( _spherical.phi );
			obj_lon = MathUtils.radToDeg( _spherical.theta );

		}

		this.handleResize();

		setOrientation( this );

	}

}

function contextmenu( event ) {

	event.preventDefault();

}

export { FirstPersonControls };
