// ThreeSetup

import { CONFIG } from './Config.js';

export class ThreeSetup {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.raycaster = null;
        this.mouse = null;
        this.onZoomChange = null;
        this.onAnimate = null;
        this.onFrustumUpdate = null;
        this._lastTime = null;
        this.isGameMode = false;
    }

    setupThreeJS() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        
        const config = CONFIG.CAMERA;
        this.camera = new THREE.PerspectiveCamera(
            config.FOV,
            window.innerWidth / window.innerHeight,
            config.NEAR,
            config.FAR
        );
        this.camera.position.set(config.INITIAL_POSITION.x, config.INITIAL_POSITION.y, config.INITIAL_POSITION.z);
        
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: false,
            powerPreference: "high-performance",
            stencil: false,
            depth: true,
            alpha: false,
            premultipliedAlpha: false,
            preserveDrawingBuffer: false
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.PERFORMANCE.PIXEL_RATIO_LIMIT));
        this.renderer.shadowMap.enabled = false;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.physicallyCorrectLights = false;
        this.renderer.sortObjects = false;
        document.getElementById('container').appendChild(this.renderer.domElement);
        
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.controls.screenSpacePanning = true;
        this.controls.minDistance = 2;
        this.controls.maxDistance = 3000;
        this.controls.enablePan = true;
        this.controls.panSpeed = 1.2;
        this.controls.rotateSpeed = 0.8;
        this.controls.zoomSpeed = 1.5;
        this.controls.minPolarAngle = 0;
        this.controls.maxPolarAngle = Math.PI;
        this.controls.enableZoom = true;
        this.controls.enableRotate = true;
        
        this.controls.addEventListener('change', () => {
            const distance = this.camera.position.distanceTo(this.controls.target);
            this.camera.near = Math.max(0.1, distance * 0.001);
            this.camera.far = Math.max(1000, distance * 10);
            this.camera.updateProjectionMatrix();
            
            if (this.onZoomChange) {
                this.onZoomChange();
            }
        });
        
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
        this.scene.add(ambientLight);
    }

    animate = (time) => {
        requestAnimationFrame(this.animate);
        
        // Calculate delta time in secs
        if (this._lastTime === null) {
            this._lastTime = time || performance.now();
        }
        const now = time || performance.now();
        let delta = (now - this._lastTime) / 1000;
        if (delta > 1) delta = 1; // safety cap in case of tab switches
        this._lastTime = now;
        
        // Update TWEEN
        if (window.TWEEN) {
            window.TWEEN.update();
        }
        
        // Custom animate callback (game mode)
        if (this.onAnimate) {
            try {
                if (this.onAnimate.length === 1) {
                    this.onAnimate(delta);
                } else {
                    this.onAnimate();
                }
            } catch (e) {
                console.error('onAnimate callback error:', e);
            }
        }
        
        if (this.controls && this.controls.enabled) {
            this.controls.update();
        }

        // actualizar frustum culling
        if (this.onFrustumUpdate) {
            this.onFrustumUpdate();
        }
        
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    onWindowResize = () => {
        if (this.camera && this.renderer) {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }
    }

    setupEventListeners() {
        window.addEventListener('resize', this.onWindowResize, false);
    }
}