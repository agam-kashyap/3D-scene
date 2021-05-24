import * as THREE from 'https://unpkg.com/three@0.127.0/build/three.module.js';
import {car} from "./car.js";
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
        // console.log(this.track,this.tofollow)
        if(this.track != null && this.tofollow == null) {
            // console.log("here track",this.car.name)
            this.move(this.track);
        }
        else {
            // console.log("here")
            if(this.tofollow) {
                // this.tofollow.attach(this.car)
                
                // console.log("here:")
                // if(this.bufferPoints == []) {
                //     if(this.bufferPoints.length < )
                // }
                if(this.bufferFollow) {

                    if(this.bufferPoints.length < 300) {
                        // console.log(this.bufferPoints)
                        var position = new THREE.Vector3(0,0,0);
                        position.copy(this.tofollow.position)
                        this.bufferPoints.push(position)
                        this.currentPoint = 1
                    }
                    else {    // debugger
                        
                        this.track = new THREE.CatmullRomCurve3([this.car.position,this.bufferPoints[0],this.bufferPoints[1]]);
                        this.track = this.track.getPoints(50)
                        
                        this.move(this.track)
                        
                        // console.log(this.bufferPoints.length,this.car.position,this.bufferPoints[0])
                        this.bufferPoints.shift()
                        // console.log(this.bufferPoints.length,this.bufferPoints[0])
                        // console.log(this.bufferPoints)
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
            // var forward = new THREE.Vector3(0, 1, 0);
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
                    // forward.applyAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);
                    forward.normalize();
                    
                    angle = forward.angleTo(NextMove)
                    temp.crossVectors(forward,NextMove)
                    if(temp.y == 0) {
                        sign = 1
                    }
                    else {
                        sign = temp.y / Math.abs(temp.y) 
                    }
                    // if(this.enableDebug) {
                    //     console.log(sign);
                    // }
                }
                var newPosition = track[this.currentPoint];
                    
                if(Math.abs(angle) < Math.PI / 40) {
                    // console.log("its coming in this if statement")
                    // console.log(this.currentPoint,track[this.currentPoint])
                    newPosition = track[this.currentPoint];
                    this.car.position.copy( newPosition );
                    this.currentPoint += 1
                }
                console.log(this.car.position)
                
                if(Math.abs(angle) > Math.PI / 40) {
                    _A.set(0, 0, 1);
                    _Q.setFromAxisAngle(_A, 4 * sign * Math.PI * 0.01);
                    _R.multiply(_Q);
                }
                // this.car.lookAt(newPosition)
                
                // console.log(NextMove,forward,angle);
                // if(this.enableDebug) {
                //     console.log(angle);
                // }

                // else {
                //     _A.set(0, 0, 1);
                // // _Q.setFromAxisAngle(_A, 4.0 * -Math.PI * timeInSeconds * this._acceleration.y);
                // // _R.multiply(_Q);
                // }
            }
            else {
                this.currentPoint = 0
            }
                
                // // Forward Movement
                // if(moveVector.x > 10) {
                //     velocity.x += moveVector.x * 0.001 ;
                // }
                // // Backward Movement
                // // velocity.x -= acc.x * timeInSeconds;
                
                // // Rotate Left
                // if(moveVector.y > 10) {
                //     _A.set(0, 0, 1);
                //     _Q.setFromAxisAngle(_A, Math.PI * moveVector.y * 0.0001);
                //     _R.multiply(_Q);
                    
                // }
                // // Rotate Right
                // // _A.set(0, 0, 1);
                // // _Q.setFromAxisAngle(_A, 4.0 * -Math.PI * timeInSeconds * this._acceleration.y);
                // // _R.multiply(_Q);
                
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
                
                // oldPosition.copy(controlObject.position);
        // console.log(this.car)
    }

}

// console.log(new CarMovement({
//     pos : new THREE.Vector3(0,0,0),
//     track: null}
//     ))