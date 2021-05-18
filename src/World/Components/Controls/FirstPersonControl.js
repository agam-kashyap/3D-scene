
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

import {FBXLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';

// Using a Proxy class to get animations from Charechter Controller
// since we don't want to edit the animation inside the Charechter Controller
class BasicCharacterControllerProxy {
    constructor(animations) {
        this._animations = animations;
    }
    get animations() { 
        return this._animations
    }
}

export class BasicCharacterController {
    constructor(params, loader) {
        this._init(params);
        this._loadingManager = loader;
    }
    
    _init(params) {
        this._animations = {};
        this._params = params
        console.log("params",this._params)

        this._lookspeed = 10;
        this._decceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0);
        this._acceleration = new THREE.Vector3(1, 0.25, 50.0);
        this._velocity = new THREE.Vector3(0, 0, 0);
        this._input = new BasicCharacterControllerInput(this._params);
        this._stateMachine = new CharechterFSM(new BasicCharacterControllerProxy(this._animations))
        this._LoadModels();

        this.enabled = false;

    }
    _LoadModels() {
        // initializing an FBX loader
        const fbxLoader = new FBXLoader(this._loadingManager);
        fbxLoader.setPath('src/World/Components/Models/')
        fbxLoader.load(
            'xbot.fbx',
            (fbx) => {
                fbx.scale.setScalar(500);
                fbx.traverse(part => {
                    part.castShadow = true;
                })
                

                console.log("object",fbx)
                this._target = fbx
                console.log(fbx)
                //Adding the camera as a child 
                // this._camera = this._target.getObjectByName('mixamorigHead').add(this._params.camera)
                this._camera = this._params.camera;

                this._params.scene.add(fbx);

                //Creating an Animation Mixer for the animation sequence
                this._mixer = new THREE.AnimationMixer(this._target)

                // A loading Manager that would check 
                // if the animation is laoding and set to an idle state until completed
                this._manager = new THREE.LoadingManager();
        
                this._manager.onLoad = () => {
                    this._stateMachine.SetState('idle')
                }
                
                const AnimLoad = (animName,anim) => {
                    const clip = anim.animations[0];
                    const action = this._mixer.clipAction(clip);
                    
                    this._animations[animName] = {
                        clip: clip,
                        action: action
                    };
                }
                
                    
                const animloader = new FBXLoader(this._manager);
                animloader.setPath('src/World/Components/Animations/')
                animloader.load('walk.fbx', (a) => { console.log("walk Animations",a); AnimLoad('walk', a); });
                animloader.load('idle.fbx', (a) => { console.log("idle Animations",a); AnimLoad('idle', a); });
                
            },
            (xhr) => {}
            //     console.log((xhr.loaded / xhr.total * 100) + '% loaded')
            // },
            ,(error) => {
                console.log(error);
        })
    }

    Update(timeInSeconds) {
        // If there is no target variable in Charechter Controller there is some error
        if (!this._target || !this.enabled) {
        return;
        }
        
        // Update your state machine to come to the initial State or change state
        this._stateMachine.Update(timeInSeconds, this._input);

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
    
        const controlObject = this._target;
        const _Q = new THREE.Quaternion();
        const _A = new THREE.Vector3();
        const _R = controlObject.quaternion.clone();
    
        const acc = this._acceleration.clone();
    
        if (this._input._keys.forward) {
        velocity.z += acc.z * timeInSeconds;
        }
        if (this._input._keys.backward) {
        velocity.z -= acc.z * timeInSeconds;
        }
        if (this._input._keys.left) {
        _A.set(0, 1, 0);
        _Q.setFromAxisAngle(_A, 4.0 * Math.PI * timeInSeconds * this._acceleration.y);
        _R.multiply(_Q);
        }
        if (this._input._keys.right) {
        _A.set(0, 1, 0);
        _Q.setFromAxisAngle(_A, 4.0 * -Math.PI * timeInSeconds * this._acceleration.y);
        _R.multiply(_Q);
        }

        controlObject.quaternion.copy(_R);
        //-----------------------Rotation with Mouse----------------
        var obj_lat = 0;
        var cam_lat = -this._input.mouseY * this._lookspeed * timeInSeconds;
        var lon = -this._input.mouseX * this._lookspeed * timeInSeconds;
        let obj_phi = THREE.MathUtils.degToRad(90 - obj_lat);
        let cam_phi = THREE.MathUtils.degToRad(45 + cam_lat);
        let theta = THREE.MathUtils.degToRad(Math.max(0, Math.min(180, lon)));

        console.log(controlObject.position);

        let _objDirection = new THREE.Vector3();
        _objDirection.setFromSphericalCoords(30, obj_phi, -theta).add(controlObject.position);
        controlObject.lookAt(_objDirection);
        
        let _camDirection = new THREE.Vector3();
        _camDirection.setFromSphericalCoords(30, cam_phi, -theta).add(controlObject.position);

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

        let _cameraPosition = controlObject.getObjectByName('mixamorigHead').clone();
        _cameraPosition.applyMatrix4(controlObject.matrix);
        this._camera.position.set(_cameraPosition.position.x, _cameraPosition.position.y+7, _cameraPosition.position.z);
        this._camera.lookAt(_camDirection);
    }
}

class BasicCharacterControllerInput {
    constructor(params) {
        this.init();
        this._params = params;
    }

    init() {
        this._keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            space: false
        };
        this._mouseX = 0;
        this._mouseY = 0;

        window.addEventListener('keydown', (e) => { this._OnKeyDown(e), false});
        window.addEventListener('keyup', (e) => { this._OnKeyUp(e), false});
        window.addEventListener('mousemove', (e)=> {this._onMouseMove(e), false});
    }

    _OnKeyDown(event) {
        switch (event.keyCode) {
          case 87: // w
            this._keys.forward = true;
            break;
          case 65: // a
            this._keys.left = true;
            break;
          case 83: // s
            this._keys.backward = true;
            break;
          case 68: // d
            this._keys.right = true;
            break;
          case 32: // SPACE
            this._keys.space = true;
            break;
          case 16: // SHIFT
            this._keys.shift = true;
            break;
        }
    }
    
    _OnKeyUp(event) {
        switch(event.keyCode) {
            case 87: // w
            this._keys.forward = false;
            break;
            case 65: // a
            this._keys.left = false;
            break;
            case 83: // s
            this._keys.backward = false;
            break;
            case 68: // d
            this._keys.right = false;
            break;
            case 32: // SPACE
            this._keys.space = false;
            break;
            case 16: // SHIFT
            this._keys.shift = false;
            break;
        }
    }

    _onMouseMove(event) {
        this.mouseX = -1*event.pageX - this._params.domElement.offsetLeft;
        this.mouseY = -1*event.pageY - this._params.domElement.offsetTop;
    }
}

// Abstract Class used in our Charechter FSM
class State {
    constructor(parent) {
      this._parent = parent;
    }
    
    Name() { }
    Enter() {}
    Exit() {}
    Update() {}
};

class FiniteStateMachine {
    constructor() {
        this._states = {}
        this._currentState = null;
    }

    _AddState(name,type) {
        this._states[name] = type;
    }

    SetState(name) {
        const prevState = this._currentState;

        // If prevState exists and has the same name as the next state then loop else exit
        if (prevState) {
            if (prevState.Name == name) {
                return;
            }
            prevState.Exit();
        }
        
        // After exiting from previous state get the new state from the name
        // console.log(this._states[name])
        var state = new this._states[name](this);
        //  Enter the new state (i.e. making a transition)
        this._currentState = state;
        state.Enter(prevState);
    
    }
     
    // Gives the time that has passed since execution and the input to the state to update itself.
    Update(timeElapsed, input) {
        // console.log(this._currentState.Name)
        if (this._currentState) {
            this._currentState.Update(timeElapsed, input);
        }
    }
}

class CharechterFSM extends FiniteStateMachine {
    constructor(proxy) {
        super();
        this._proxy = proxy;
        this._Init();
    }
    
    _Init() {
        this._AddState('idle', idleState);
        this._AddState('walk', walkState);
    }
}

class idleState extends State {
    constructor(parent) {
        super(parent);
    }
    
    get Name() {
        return 'idle';
    }
    
    Enter(prevState) {
        const idleAction = this._parent._proxy._animations['idle'].action;
        if (prevState) {
        const prevAction = this._parent._proxy._animations[prevState.Name].action;
        idleAction.time = 0.0;
        idleAction.enabled = true;
        idleAction.setEffectiveTimeScale(1.0);
        idleAction.setEffectiveWeight(1.0);

        // This adds a crossFade when transitioning from animation to another animation
        idleAction.crossFadeFrom(prevAction, 0.5, true);
        idleAction.play();
        } else {
        idleAction.play();
        }
    }
    
    Exit() {
    }
    
    Update(_, input) {
        // console.log(this.input)
        if (input._keys.forward || input._keys.backward) {
            this._parent.SetState('walk');
        }
    }
}


class walkState extends State {
    constructor(parent) {
        super(parent);
    }
    
    get Name() {
        return 'walk';
    }
    
    Enter(prevState) {
        const curAction = this._parent._proxy._animations['walk'].action;
        if (prevState) {
        const prevAction = this._parent._proxy._animations[prevState.Name].action;
    
        curAction.enabled = true;
    
        // Cross fade for when changing from run to walk by moving 
        // the walk timer ahead by the same amount of time
        // const ratio = curAction.getClip().duration / prevAction.getClip().duration;
        // curAction.time = prevAction.time * ratio;
        
        curAction.time = 0.0;
        curAction.setEffectiveTimeScale(1.0);
        curAction.setEffectiveWeight(1.0);
    
        curAction.crossFadeFrom(prevAction, 0.5, true);
        curAction.play();
        } else {
        curAction.play();
        }
    }
    
    Exit() {
    }
    
    Update(timeElapsed, input) {
        // console.log(input.forward,input.backward)
        if (input._keys.forward || input._keys.backward) {
            return
        }
        this._parent.SetState('idle');
    }
};

