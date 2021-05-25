import * as THREE from 'https://unpkg.com/three@0.127.0/build/three.module.js';
export class CarMovement {
    constructor(params) {
        this.car = params.car;
        this.currentPoint = 0;
        if(params.track) {

            this.track = new THREE.CatmullRomCurve3([...params.track]);
            this.track = this.track.getPoints( 5000 )
        }
        else  {
            this.track = null;
        }
        this._decceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0);
        this._acceleration = new THREE.Vector3(1, 0.25, 50.0);
        this._velocity = new THREE.Vector3(0, 0, 0);
        this.tofollow = null;
        this.bufferPoints = []
        this.enableDebug = true;
        this.bufferFollow = true;
        this.loop = true
        // this.car.rotation.x = Math.PI / 2;
    }

    follow(param) {
        
        console.log("called this")
        this.tofollow = param; 
        console.log(this.tofollow)
    }


    update(timeInSeconds) {
        if(this.track != null && this.tofollow == null) {
            this.move(this.track);
        }
        else {
            if(this.tofollow) {
                if(this.bufferFollow) {

                    if(this.bufferPoints.length < 300) {
                        var position = new THREE.Vector3(0,0,100);
                        position.copy(this.tofollow.position)
                        this.bufferPoints.push(position)
                        this.currentPoint = 1
                    }
                    else {    // debugger
                        
                        this.track = new THREE.CatmullRomCurve3([this.car.position,this.bufferPoints[0],this.bufferPoints[1]]);
                        this.track = this.track.getPoints(50)
                        
                        this.move(this.track)
                        
                        this.bufferPoints.shift()
                    }
                }
                else {
                    this.tofollow.attach(this.car)
                }
            }
            else {
                console.warn("Please give some track or follow object for the car")
                return;
            }
        }
    }


    move(track) {
            const velocity = this._velocity;
            const controlObject = this.car;
            
            const _Q = new THREE.Quaternion();
            const _A = new THREE.Vector3();
            const _R = controlObject.quaternion.clone();     
            
            var currentPosVector = this.car.position.clone();
            var nextPosVector = new THREE.Vector3(1,0,0);
            var next2nextPosVector =track[0];
            
            var CurrentMove = new THREE.Vector3(0,0,0);
            var NextMove = new THREE.Vector3(0,0,0);
            
            var angle = 0;
            var distance = 0;
            var sign = 1;
            var temp = new THREE.Vector3(0,0,0);

            if(this.currentPoint <=track.length - 1) {
                if(this.currentPoint <track.length - 1) {
                    NextMove.subVectors(track[this.currentPoint + 1],currentPosVector);
                    NextMove.normalize();
    
                    const forward = new THREE.Vector3(1, 0, 0);
                    forward.applyQuaternion(controlObject.quaternion);
                    forward.normalize();
                    
                    angle = forward.angleTo(NextMove)
                    temp.crossVectors(forward,NextMove)
                    if(temp.y == 0) {
                        sign = 1
                    }
                    else {
                        sign = temp.y / Math.abs(temp.y) 
                    }
                }
                var newPosition = track[this.currentPoint];
                    
                if(Math.abs(angle) < Math.PI / 40) {
                    newPosition = track[this.currentPoint];
                    this.car.position.copy( newPosition );
                    this.currentPoint += 1
                }
                
                if(Math.abs(angle) > Math.PI / 40) {
                    _A.set(0, 0, 1);
                    _Q.setFromAxisAngle(_A, 4 * sign * Math.PI * 0.01);
                    _R.multiply(_Q);
                }
            }
            else {
                this.currentPoint = 0
            }
                
            controlObject.quaternion.copy(_R);
            
            const oldPosition = new THREE.Vector3();
            oldPosition.copy(controlObject.position);
                
            const forward = new THREE.Vector3(0, 0, 1);
            forward.applyQuaternion(controlObject.quaternion);
            forward.normalize();
            
            const sideways = new THREE.Vector3(1, 0, 0);
            sideways.applyQuaternion(controlObject.quaternion);
            sideways.normalize();
            
            sideways.multiplyScalar(velocity.x * 0.01);
            forward.multiplyScalar(velocity.z * 0.01);
            
            controlObject.position.add(forward);
            controlObject.position.add(sideways);
        }
}