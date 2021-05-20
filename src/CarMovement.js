import {car} from "./car.js";
class CarMovement {
    constructor(params) {
        this.car = car();
        this.currentPoint = 0;
        this.track = params.track;
        this._decceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0);
        this._acceleration = new THREE.Vector3(1, 0.25, 50.0);
        this._velocity = new THREE.Vector3(0, 0, 0);
    }


    update() {
        const velocity = this._velocity;
        const frameDecceleration = new THREE.Vector3(
            velocity.x * this._decceleration.x,
            velocity.y * this._decceleration.y,
            velocity.z * this._decceleration.z
        );
        
        frameDecceleration.multiplyScalar(timeInSeconds);
        frameDecceleration.z = Math.sign(frameDecceleration.z) * Math.min(
            Math.abs(frameDecceleration.z), Math.abs(velocity.z));
    
        velocity.add(frameDecceleration);
    
        const controlObject = this.car;
        
        const _Q = new THREE.Quaternion();
        const _A = new THREE.Vector3();
        const _R = controlObject.quaternion.clone();
    
        const acc = this._acceleration.clone();
        
        if(this.currentPoint < this.track.length - 1) {
            const currentPosVector = new Vector3(0,0,0)
            currentPosVector.copy(this.track[this.currentPoint])
            const moveVector = currentPosVector.sub(this.track[this.currentPoint + 1])
            if(moveVector.length < 0.1) {
                this.currentPoint += 1;
            }
            else {
                
            }

        }
        

        // if (this._input._keys.forward) {
        // velocity.z += acc.z * timeInSeconds;
        // }
        // if (this._input._keys.backward) {
        // velocity.z -= acc.z * timeInSeconds;
        // }
        // if (this._input._keys.left) {
        // _A.set(0, 1, 0);
        // _Q.setFromAxisAngle(_A, 4.0 * Math.PI * timeInSeconds * this._acceleration.y);
        // _R.multiply(_Q);
        // }
        // if (this._input._keys.right) {
        // _A.set(0, 1, 0);
        // _Q.setFromAxisAngle(_A, 4.0 * -Math.PI * timeInSeconds * this._acceleration.y);
        // _R.multiply(_Q);
        // }
    
        controlObject.quaternion.copy(_R);
    
        const oldPosition = new THREE.Vector3();
        oldPosition.copy(controlObject.position);
    
        const forward = new THREE.Vector3(0, 0, 1);
        forward.applyQuaternion(controlObject.quaternion);
        forward.normalize();
    
        const sideways = new THREE.Vector3(1, 0, 0);
        sideways.applyQuaternion(controlObject.quaternion);
        sideways.normalize();
    
        sideways.multiplyScalar(velocity.x * timeInSeconds);
        forward.multiplyScalar(velocity.z * timeInSeconds);
    
        controlObject.position.add(forward);
        controlObject.position.add(sideways);
    
        oldPosition.copy(controlObject.position);
    
        if (this._mixer) {
        this._mixer.update(timeInSeconds);
        }
    }


    move() {
        console.log(this.car)
    }

}

console.log(new CarMovement({
    pos : new THREE.Vector3(0,0,0),
    track: null}
    ))