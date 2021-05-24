
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.127.0/build/three.module.js';

import {FBXLoader} from 'https://cdn.jsdelivr.net/npm/three@0.127.0/examples/jsm/loaders/FBXLoader.js';

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

export class PersonController {
    constructor(params, light) {
        this._init(params)
        this.light = light;
    }
    
    enable(val)
    {
        this.enabled = val;
    }
    _init(params) {
        
        this._animations = {};
        this._params = params
        console.log("params",this._params)

        this._lookspeed = 0.001;
        this._decceleration = new THREE.Vector3(-0.5, -0.01, -50.0);
        this._acceleration = new THREE.Vector3(100, 0.05, 500.0);
        this._velocity = new THREE.Vector3(0, 0, 0);
        this._input = new BasicCharacterControllerInput(this._params);
        this._stateMachine = new CharechterFSM(new BasicCharacterControllerProxy(this._animations))
        this._LoadModels();

        this.enabled = false;
        this._defaultLookVec = new THREE.Vector3(1,0,0);
        this._cameraPosition = new THREE.Vector3();
        this._cameraLook = new THREE.Vector3();

        this._jumpAngle = 0;

        //----------------------__TRIALLLL__-------------------------
        this._boundingBox = new THREE.Box3();
        this.isIntersecting = false;
        this.intersectingObjectCenter = new THREE.Vector3();
        this.basePos = 1;
    }
    _LoadModels() {
        // initializing an FBX loader
        const fbxLoader = new FBXLoader();
        fbxLoader.setPath('./src/World/Components/Models/')
        fbxLoader.load(
            'xbot.fbx',
            (fbx) => {
                fbx.scale.setScalar(0.5);
                fbx.traverse(part => {
                    part.castShadow = true;
                })
                

                console.log("object",fbx)
                this._target = fbx
                console.log(fbx)

                ///////////////////////////////////////////////
                this._boundingBox.setFromObject(fbx);
                ///////////////////////////////////////////////
                
                this.light.target = fbx;
                this._fpcamera = this._params.fpcamera;
                this._thirdcamera = this._params.thirdcamera;

                // Dummy object
                this.tofollow = this._target.getObjectByName('mixamorigHead').add(new THREE.SphereGeometry(0,0,0));

                this._params.scene.add(fbx);

                this._mixer = new THREE.AnimationMixer(this._target)

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
                animloader.setPath('./src/World/Components/Animations/')
                animloader.load('walk.fbx', (a) => { console.log("walk Animations",a); AnimLoad('walk', a); });
                animloader.load('idle.fbx', (a) => { console.log("idle Animations",a); AnimLoad('idle', a); });
                
            },
            (xhr) => {}
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

        //-------Camera Part 1--------------
        var obj_lat = 0;
        var cam_lat = THREE.MathUtils.mapLinear(-this._input.mouseY,this._params.domElement.height, 0, -90, 90);
        var lon = THREE.MathUtils.mapLinear(-this._input.mouseX, 0, this._params.domElement.width, 360, 0);
        let obj_phi = THREE.MathUtils.degToRad(90 - obj_lat);
        let cam_phi = THREE.MathUtils.degToRad(90 - cam_lat);
        let theta = THREE.MathUtils.degToRad(Math.max(0, Math.min(360, lon)));

        let _objDirection = new THREE.Vector3();
        _objDirection.setFromSphericalCoords(1, obj_phi, theta).add(controlObject.position);
        controlObject.lookAt(_objDirection);
        
        let DirectionVec = new THREE.Vector3();
        DirectionVec.setFromSphericalCoords(100, cam_phi, theta)
        let objDirectionVec = DirectionVec.clone(); 
        objDirectionVec.add(controlObject.position);
        this._fpcamera.lookAt(objDirectionVec);
        //----------------------------------
        let allowMove = true;
        if(this.isIntersecting)
        {
            if(this.canMove(this.intersectingObjectCenter,this.getBBoxCenter(), _objDirection) || this.ContactObjectBBox.max.y <= this.getBBoxLimits().y + 2)
            {
                allowMove = true;
            }
            else
            {
                allowMove = false;
            }

            if(this.isJumping)
            {
                if(this.ContactObjectBBox.max.y >= controlObject.position.y - 4 && this.ContactObjectBBox.max.y <= controlObject.position.y + 1)
                {
                    this.basePos = this.ContactObjectBBox.max.y;
                    this.isJumping = false;
                    this._jumpAngle = 0;
                }
            }
        }
        else
        {
            if(controlObject.position.y >= this.basePos - 4 && controlObject.position.y <= this.basePos + 1)
            {
                this.basePos = 1;
            }
            if(!this.isJumping && controlObject.position.y > this.basePos)
            {
                controlObject.position.y -= 4;
            }
        }

        if(allowMove)
        {
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
        }
        if (this._mixer) {
        this._mixer.update(timeInSeconds);
        }

        //-----------------------JUMPING---------------------
        if(this._input._keys.space || this.isJumping)
        {
            this.isJumping = true;
            const upward = new THREE.Vector3(0,1,0)
            this._jumpAngle += 0.25;
            upward.y = (Math.sin(this._jumpAngle) + 1)*40 + 0.9*this.basePos;
            if(upward.y < this.basePos)
            {
                this.isJumping = false;
            }
            controlObject.position.y = upward.y;
        }


        //--------CAMERA PART 2--------------------
        // Create a dummy object to find the final positions of the objects
        let dum = this.tofollow.clone()
        dum.applyMatrix4(this.tofollow.parent.matrix);
        let _proxyCameraPosition = controlObject.clone();
        let name = _proxyCameraPosition.getObjectByName('mixamorigHead').parent.name;
        while(_proxyCameraPosition.getObjectByName(name).parent != null)
        {
            dum.applyMatrix4(_proxyCameraPosition.getObjectByName(name).matrix);
            name = _proxyCameraPosition.getObjectByName(name).parent.name;
        }
        dum.applyMatrix4(_proxyCameraPosition.getObjectByName(name).matrix);
        this._fpcamera.position.set(dum.position.x,dum.position.y,dum.position.z);

        // THIRD PERSON CAMERA
        let _objectposition = new THREE.Vector3(dum.position.x, dum.position.y, dum.position.z);
        let newDirection = DirectionVec.clone();
        let CameraPosition = _objectposition.sub(newDirection.multiplyScalar(2));

        // Calculate a position for the camera 
        const t = 1.0 - Math.pow(0.01, timeInSeconds*10);
        this._cameraPosition.lerp(CameraPosition, t);
        this._cameraLook.lerp(controlObject.position, t);

        this._thirdcamera.position.set(this._cameraPosition.x, this._cameraPosition.y, this._cameraPosition.z);
        this._thirdcamera.lookAt(this._cameraLook);
        //-----------------------------------------
    }

    canMove(Center1, Center2, Look)
    {
        let v1 = new THREE.Vector2(Center1.x, Center1.z);
        let v2 = new THREE.Vector2(Center2.x, Center2.z);
        let l = new THREE.Vector2(Look.x, Look.z);
        let Vec1 = v1.sub(v2);
        let Vec2 = l.sub(v2);
        Vec1.normalize();
        Vec2.normalize();
        let temp = Vec1.dot(Vec2);
        if(temp < 0)
        {
            return true;
        }
        else
        {
            return false;
        }
    }

    // intersectingObject(bool, Center1=null)
    // {
    //     this.isIntersecting = bool;
    //     this.intersectingObjectCenter = Center1;
    // }
    intersectingObject(bool, BBox=null)
    {
        this.isIntersecting = bool;
        if(BBox == null) return;
        this.ContactObjectBBox = BBox.clone();
        this.ContactObjectBBox.getCenter(this.intersectingObjectCenter);
    }

    getObject()
    {
        return this._target;
    }
    getBoundingBox()
    {
        let step1 = this._boundingBox.clone();
        let step2 = this._target.matrixWorld;
        let step3 = step1.applyMatrix4(this._target.matrixWorld);
        return step3;
    }
    getBBoxCenter()
    {
        let step1 = this._boundingBox.clone();
        let step2 = this._target.matrixWorld;
        let step3 = step1.applyMatrix4(this._target.matrixWorld);
        let step4 = new THREE.Vector3();
        step3.getCenter(step4)
        return step4;
    }
    getBBoxLimits()
    {
        let step1 = this._boundingBox.clone();
        let step2 = this._target.matrixWorld;
        let step3 = step1.applyMatrix4(this._target.matrixWorld);
        return step3.min;
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

