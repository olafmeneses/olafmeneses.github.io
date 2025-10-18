// GameMode

export class GameMode {
    constructor(mainApp) {
        this.app = mainApp;
        
        this.gameMode = false;
        this.shuttle = null;
        this.planets = [];
        this.gameControls = null;
        this.gameLights = [];
        this.gltfLoader = new window.THREE.GLTFLoader();
        
        this._gameVelocity = new THREE.Vector3();
        this._gameAngularVelocity = 0;
        this._gamePitchVelocity = 0;
        this._gameRollVelocity = 0;
        
        this._baseFOV = null;
        this._fovBoostRange = 16;
        this._camTargetOffset = new THREE.Vector3(0, 1.2, 0);
        this._camFollowOffset = new THREE.Vector3(0, 0.9, 3.0);
        this._camDynamicDistBoost = 1.2;
        this._camLookAhead = 2.2;
        this._camRollBlend = 0.35;
        
        this._mouseSensitivity = 0.0015;
        this._pendingMouseYaw = 0;
        this._pendingMousePitch = 0;
        this._pitchClamp = Math.PI * 0.499;
        this._pointerLockActive = false;
        this._onClickLock = null;
        this._onMouseMove = null;
        this._onAltToggle = null;
        
        this._softBoundaryRadius = null;
        this._softBoundaryFactor = 0.9;
        this._datasetCenter = null;
        
        this._hudElement = null;
        this._crosshairElement = null;
        
        this._raycaster = new THREE.Raycaster();
        this._planetMeshes = [];
        this._planetInstanceLookup = new Map();
        this._activePlanetHighlight = null;
        this._planetHighlightColor = new THREE.Color();
        this._planetGeometry = null;
        
        this._tempVecGameCamPos = new THREE.Vector3();
        this._tempVecGameDir = new THREE.Vector3();
        this._tempVecGameWork = new THREE.Vector3();
        this._tempVecGameWork2 = new THREE.Vector3();
        this._tempVecGameWork3 = new THREE.Vector3();
        
        this._boosting = false;
        this._savedExploreCamera = null;
        this._savedGameCamera = null;
        this._storedControlsState = null;
        
        this.keydownHandler = null;
        this.keyupHandler = null;
    }

    enterGameMode() {
        if (!this.app.visualization) return;
        
        this.saveExploreCameraState();
        
        this.gameMode = true;
        this.app.threeSetup.isGameMode = true;
        this.app.visualization.setGameMode(true);
        
        if (this.app.languageHunt) {
            this.app.languageHunt.initializeLanguageHunt();
        }

        this.app.ui.hideUIForGameMode();
        
        this.app.visualization.instancedNodes.forEach(nodeGroup => {
            if (nodeGroup.mesh) {
                this.app.threeSetup.scene.remove(nodeGroup.mesh);
            }
        });
        
        if (this.app.visualization.instancedEdges) {
            this.app.threeSetup.scene.remove(this.app.visualization.instancedEdges);
        }
        
        this.addLighting();
        this.loadShuttle();
        this.createPlanets();
        this.setupGameControls();
        this.createGameHUD();
        this.setupPointerLock();
        
        if (this.app.threeSetup.controls) {
            this._storedControlsState = {
                enabled: this.app.threeSetup.controls.enabled,
                enableRotate: this.app.threeSetup.controls.enableRotate,
                enableZoom: this.app.threeSetup.controls.enableZoom,
                enablePan: this.app.threeSetup.controls.enablePan
            };
            this.app.threeSetup.controls.enabled = false;
            this.app.threeSetup.controls.enableRotate = false;
            this.app.threeSetup.controls.enableZoom = false;
            this.app.threeSetup.controls.enablePan = false;
        }
        
        this.app.threeSetup.onAnimate = (dt) => this.updateGame(dt);
    }

    exitGameMode() {
        this.saveGameCameraState();
        
        this.app.threeSetup.onAnimate = null;
        this.gameMode = false;
        this.app.threeSetup.isGameMode = false;

        this.app.ui.showUIForExploreMode();
        
        this.removeShuttle();
        this.removePlanets();
        this.removeGameHUD();
        this.teardownPointerLock();
        this.restoreExplorationControls();
        
        this._gameVelocity.set(0, 0, 0);
        this._gameAngularVelocity = 0;
        this._gamePitchVelocity = 0;
        this._gameRollVelocity = 0;
        
        if (this.app.languageHunt) {
            this.app.languageHunt.resetLanguageHunt();
        }
        
        if (this.app.visualization) {
            this.app.visualization.setGameMode(false);
            this.app.visualization.createVisualization();
            this.app.setupEvents();
        }
        
        if (this.app.threeSetup.controls) {
            if (this._storedControlsState) {
                this.app.threeSetup.controls.enableRotate = this._storedControlsState.enableRotate;
                this.app.threeSetup.controls.enableZoom = this._storedControlsState.enableZoom;
                this.app.threeSetup.controls.enablePan = this._storedControlsState.enablePan;
            } else {
                this.app.threeSetup.controls.enableRotate = true;
                this.app.threeSetup.controls.enableZoom = true;
                this.app.threeSetup.controls.enablePan = true;
            }
            this.app.threeSetup.controls.enabled = true;
            this.app.threeSetup.controls.update();
        }
        
        if (this.app.threeSetup.camera && this.app.threeSetup.controls) {
            if (this._savedExploreCamera) {
                this.restoreExploreCameraState();
            } else {
                this.app.threeSetup.camera.position.set(0, 0, 200);
                this.app.threeSetup.camera.up.set(0, 1, 0);
                this.app.threeSetup.camera.updateProjectionMatrix();
                this.app.threeSetup.controls.target.set(0, 0, 0);
                this.app.threeSetup.controls.update();
            }
        }
    }
    
    saveExploreCameraState() {
        if (this.app.threeSetup.camera && this.app.threeSetup.controls) {
            this._savedExploreCamera = {
                position: this.app.threeSetup.camera.position.clone(),
                up: this.app.threeSetup.camera.up.clone(),
                fov: this.app.threeSetup.camera.fov,
                target: this.app.threeSetup.controls.target.clone()
            };
        }
    }
    
    restoreExploreCameraState() {
        if (this._savedExploreCamera && this.app.threeSetup.camera && this.app.threeSetup.controls) {
            this.app.threeSetup.camera.position.copy(this._savedExploreCamera.position);
            this.app.threeSetup.camera.up.copy(this._savedExploreCamera.up);
            this.app.threeSetup.camera.fov = this._savedExploreCamera.fov;
            this.app.threeSetup.camera.updateProjectionMatrix();
            this.app.threeSetup.controls.target.copy(this._savedExploreCamera.target);
            this.app.threeSetup.controls.update();
        }
    }
    
    saveGameCameraState() {
        if (this.shuttle && this.app.threeSetup.camera) {
            this._savedGameCamera = {
                shuttlePosition: this.shuttle.position.clone(),
                shuttleQuaternion: this.shuttle.quaternion.clone(),
                velocity: this._gameVelocity.clone(),
                angularVelocity: this._gameAngularVelocity,
                pitchVelocity: this._gamePitchVelocity,
                cameraFov: this.app.threeSetup.camera.fov
            };
        }
    }
    
    restoreGameCameraState() {
        if (this._savedGameCamera && this.shuttle && this.app.threeSetup.camera) {
            this.shuttle.position.copy(this._savedGameCamera.shuttlePosition);
            this.shuttle.quaternion.copy(this._savedGameCamera.shuttleQuaternion);
            this._gameVelocity.copy(this._savedGameCamera.velocity);
            this._gameAngularVelocity = this._savedGameCamera.angularVelocity;
            this._gamePitchVelocity = this._savedGameCamera.pitchVelocity;
            this.app.threeSetup.camera.fov = this._savedGameCamera.cameraFov;
            this.app.threeSetup.camera.updateProjectionMatrix();
            this.setupGameCamera(true);
        }
    }

    loadShuttle() {
        const path = 'assets/space_shuttle__realistic_pbr_model.glb';
        this.gltfLoader.load(
            path,
            (gltf) => {
                this.shuttle = gltf.scene || gltf.scenes?.[0];
                if (!this.shuttle) {
                    this.createPlaceholderShuttle();
                } else {
                    this.shuttle.traverse(obj => { if (obj.isMesh) { obj.frustumCulled = false; }});
                }
                this.shuttle.scale.set(2.0, 2.0, 2.0);
                this.shuttle.position.set(0, 0, 0);
                this.app.threeSetup.scene.add(this.shuttle);
                if (this.app.threeSetup.camera && this._baseFOV === null){
                    this._baseFOV = this.app.threeSetup.camera.fov;
                }
                
                if (this._savedGameCamera) {
                    this.restoreGameCameraState();
                } else {
                    this.setupGameCamera(true);
                }
            },
            undefined,
            (error) => {
                this.createPlaceholderShuttle();
                
                if (this._savedGameCamera) {
                    this.restoreGameCameraState();
                } else {
                    this.setupGameCamera(true);
                }
            }
        );
    }

    createPlaceholderShuttle() {
        const geom = new THREE.ConeGeometry(0.7, 2, 12);
        const mat = new THREE.MeshStandardMaterial({ color: 0xffcc66, emissive: 0x331100 });
        const cone = new THREE.Mesh(geom, mat);
        const wingGeom = new THREE.BoxGeometry(2, 0.1, 0.5);
        const wingMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, emissive: 0x111111 });
        const wings = new THREE.Mesh(wingGeom, wingMat);
        wings.position.set(0, -0.4, 0);
        const group = new THREE.Group();
        group.add(cone);
        group.add(wings);
        cone.rotation.x = -Math.PI/2;
        this.shuttle = group;
        this.app.threeSetup.scene.add(group);
        group.scale.set(2.2, 2.2, 2.2);
        if (this.app.threeSetup.camera && this._baseFOV === null){
            this._baseFOV = this.app.threeSetup.camera.fov;
        }
    }

    removeShuttle() {
        if (this.shuttle) {
            this.app.threeSetup.scene.remove(this.shuttle);
            this.shuttle = null;
        }
    }

    createPlanets() {
        if (this._planetMeshes.length) {
            this._planetMeshes.forEach(mesh => {
                if (mesh && mesh.parent === this.app.threeSetup.scene) {
                    this.app.threeSetup.scene.remove(mesh);
                }
                mesh.material?.dispose?.();
            });
        }
        this._planetMeshes = [];
        this.planets = [];
        this._planetInstanceLookup.clear();
        this._activePlanetHighlight = null;

        const layout = this.app.dataLoader.layouts[this.app.currentLayout];
        if (!layout) {
            return;
        }

        const colorGroups = new Map();
        this.app.dataLoader.languageData.forEach((lang, index) => {
            const position = layout[index];
            if (!position) return;
            const colorHex = this.app.getColorForLanguage(lang);
            if (!colorGroups.has(colorHex)) {
                colorGroups.set(colorHex, []);
            }
            colorGroups.get(colorHex).push({ index, lang, position });
        });

        if (!this._planetGeometry) {
            this._planetGeometry = new THREE.SphereGeometry(0.5, 16, 16);
            this._planetGeometry.computeBoundingBox?.();
            this._planetGeometry.computeBoundingSphere?.();
        }
        const sharedGeometry = this._planetGeometry;
        const tempMatrix = new THREE.Matrix4();
        const tempPosition = new THREE.Vector3();

        const xs = [], ys = [], zs = [];

        colorGroups.forEach((groupEntries, colorHex) => {
            const baseColor = new THREE.Color(colorHex);
            const material = new THREE.MeshLambertMaterial({
                color: baseColor,
                emissive: baseColor,
                emissiveIntensity: 0.0
            });

            const instanced = new THREE.InstancedMesh(sharedGeometry, material, groupEntries.length);
            instanced.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
            instanced.instanceMatrix.needsUpdate = true;

            const instanceColors = new THREE.InstancedBufferAttribute(new Float32Array(groupEntries.length * 3), 3);
            instanceColors.setUsage(THREE.DynamicDrawUsage);

            const instanceMeta = [];

            groupEntries.forEach((entry, idx) => {
                tempPosition.set(entry.position.x, entry.position.y, entry.position.z);
                tempMatrix.compose(tempPosition, new THREE.Quaternion(), new THREE.Vector3(1, 1, 1));
                instanced.setMatrixAt(idx, tempMatrix);

                const color = new THREE.Color(this.app.getColorForLanguage(entry.lang));
                instanceColors.setXYZ(idx, color.r, color.g, color.b);

                const positionVec = new THREE.Vector3(entry.position.x, entry.position.y, entry.position.z);
                const baseColorClone = color.clone();

                const meta = {
                    language: entry.lang,
                    layoutIndex: entry.index,
                    position: positionVec,
                    instancedMesh: instanced,
                    instanceIndex: idx,
                    baseColor: baseColorClone,
                    currentColor: baseColorClone.clone(),
                    lastVisit: null
                };

                const lookupKey = `${instanced.uuid}:${idx}`;
                meta.lookupKey = lookupKey;

                this.planets.push(meta);
                instanceMeta.push(meta);
                this._planetInstanceLookup.set(lookupKey, meta);

                xs.push(positionVec.x);
                ys.push(positionVec.y);
                zs.push(positionVec.z);
            });

            instanced.instanceColor = instanceColors;
            instanced.instanceMatrix.needsUpdate = true;
            instanced.instanceColor.needsUpdate = true;
            instanced.count = groupEntries.length;
            instanced.frustumCulled = false;
            instanced.userData = {
                type: 'planetGroup',
                colorHex,
                instanceMeta,
                instanceColors
            };

            this.app.threeSetup.scene.add(instanced);
            this._planetMeshes.push(instanced);
        });

        if (xs.length) {
            const minX = Math.min(...xs), maxX = Math.max(...xs);
            const minY = Math.min(...ys), maxY = Math.max(...ys);
            const minZ = Math.min(...zs), maxZ = Math.max(...zs);
            const cx = (minX + maxX) / 2;
            const cy = (minY + maxY) / 2;
            const cz = (minZ + maxZ) / 2;
            this._datasetCenter = new THREE.Vector3(cx, cy, cz);
            const dx = maxX - cx;
            const dy = maxY - cy;
            const dz = maxZ - cz;
            this._softBoundaryRadius = Math.max(dx, dy, dz) * 1.35;
        } else {
            this._datasetCenter = null;
            this._softBoundaryRadius = null;
        }
    }

    removePlanets() {
        this._planetMeshes.forEach(mesh => {
            if (mesh.parent === this.app.threeSetup.scene) {
                this.app.threeSetup.scene.remove(mesh);
            }
            mesh.material?.dispose?.();
        });
        this._planetMeshes = [];
        this.planets = [];
        this._planetInstanceLookup.clear();
        this._activePlanetHighlight = null;
        if (this._planetGeometry) {
            this._planetGeometry.dispose?.();
            this._planetGeometry = null;
        }
    }

    createGameHUD() {
        if (this._hudElement) return;
        
        const hud = document.createElement('div');
        hud.id = 'game-hud';
        
        hud.innerHTML = `
            <div class="hud-panel">
                <div class="hud-title">Navigation System</div>
                <div class="hud-stat">
                    <span class="hud-stat-label">Velocity</span>
                    <span class="hud-stat-value" id="hud-speed">0</span>
                </div>
            </div>
            
            <div class="language-hunt-panel">
                <div class="panel-content">
                    <div class="panel-left">
                        <button id="restart-hunt-btn" class="hunt-action-btn" title="Restart language hunt">
                            <svg viewBox="0 0 24 24" class="hunt-btn-icon">
                                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                            </svg>
                        </button>
                    </div>
                    <div class="panel-center">
                        <div class="panel-title">Languages Found</div>
                        <div class="hud-stat">
                            <span class="hud-stat-label">Progress</span>
                            <span class="hud-stat-value" id="language-hunt-progress">0/10</span>
                        </div>
                        <div class="progress-container">
                            <div class="progress-bar-bg">
                                <div class="progress-bar-fill" id="language-hunt-progress-bar" style="width: 0%;"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="controls-panel">
                <div class="controls-title">Flight Control</div>
                <div class="control-item">
                    <span class="control-key">Mouse</span>
                    <span class="control-action">Navigate</span>
                </div>
                <div class="control-item">
                    <span class="control-key">W</span>
                    <span class="control-action">Thrust</span>
                </div>
                <div class="control-item">
                    <span class="control-key">Shift</span>
                    <span class="control-action">Boost</span>
                </div>
                <div class="control-item">
                    <span class="control-key">S</span>
                    <span class="control-action">Brake</span>
                </div>
                <div class="control-item">
                    <span class="control-key">A / D</span>
                    <span class="control-action">Strafe</span>
                </div>
                <div class="control-item">
                    <span class="control-key">Space</span>
                    <span class="control-action">Info</span>
                </div>
                <div class="control-item escape-control">
                    <span class="control-key">ESC</span>
                    <span class="control-action">Exit</span>
                </div>
            </div>
        `;
        
        document.body.appendChild(hud);
        this._hudElement = hud;
        
        const restartBtn = document.getElementById('restart-hunt-btn');
        if (restartBtn && this.app.languageHunt) {
            restartBtn.addEventListener('click', () => {
                this.app.languageHunt.restartLanguageHunt();
            });
        }
        
        const cross = document.createElement('div');
        cross.id = 'hud-crosshair';
        cross.className = 'normal';
        
        const outerRing = document.createElement('div');
        outerRing.className = 'crosshair-outer-ring';
        
        const brackets = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
        brackets.forEach(position => {
            const bracket = document.createElement('div');
            bracket.className = `crosshair-bracket ${position}`;
            outerRing.appendChild(bracket);
        });
        
        cross.appendChild(outerRing);
        
        const innerRing = document.createElement('div');
        innerRing.className = 'crosshair-inner-ring';
        cross.appendChild(innerRing);
        
        const centerDot = document.createElement('div');
        centerDot.className = 'crosshair-center-dot';
        cross.appendChild(centerDot);
        
        const scanLine = document.createElement('div');
        scanLine.className = 'crosshair-scanline';
        cross.appendChild(scanLine);
        
        document.body.appendChild(cross);
        this._crosshairElement = cross;
    }

    removeGameHUD() {
        if (this._hudElement) { this._hudElement.remove(); this._hudElement = null; }
        if (this._crosshairElement) { this._crosshairElement.remove(); this._crosshairElement = null; }
        const crosshairInfo = document.getElementById('crosshair-info');
        if (crosshairInfo) { crosshairInfo.remove(); }
    }

    setupPointerLock() {
        const canvas = this.app.threeSetup?.renderer?.domElement;
        if (!canvas) return;
        this._onClickLock = () => { if (document.pointerLockElement !== canvas) canvas.requestPointerLock(); };
        this._onMouseMove = (e) => {
            if (document.pointerLockElement === canvas) {
                const dx = e.movementX || 0;
                const dy = e.movementY || 0;
                this._pendingMouseYaw -= dx * this._mouseSensitivity;
                this._pendingMousePitch += dy * this._mouseSensitivity;
            }
        };
        canvas.addEventListener('click', this._onClickLock);
        window.addEventListener('mousemove', this._onMouseMove);
        this._onAltToggle = (e) => {
            if (e.code === 'AltRight') {
                if (document.pointerLockElement === canvas) {
                    document.exitPointerLock();
                } else {
                    canvas.requestPointerLock();
                }
            }
        };
        window.addEventListener('keydown', this._onAltToggle);
        this._pointerLockActive = true;
        if (this._hudElement) {
            const hint = document.createElement('div');
            hint.id = 'pointer-hint';
            hint.style.cssText = 'position:fixed;left:50%;bottom:40px;transform:translateX(-50%);padding:6px 12px;background:rgba(0,0,0,0.55);border:1px solid rgba(255,255,255,0.25);border-radius:4px;font-size:11px;font-family:system-ui,sans-serif;color:#ddd;pointer-events:none;z-index:1500';
            hint.textContent = 'Click to capture mouse (Esc to release)';
            document.body.appendChild(hint);
            setTimeout(() => { if (hint.parentNode) hint.remove(); }, 4000);
        }
    }

    teardownPointerLock() {
        const canvas = this.app.threeSetup?.renderer?.domElement;
        if (!canvas) return;
        if (this._onClickLock) canvas.removeEventListener('click', this._onClickLock);
        if (this._onMouseMove) window.removeEventListener('mousemove', this._onMouseMove);
        if (this._onAltToggle) window.removeEventListener('keydown', this._onAltToggle);
        this._onClickLock = null; this._onMouseMove = null; this._pointerLockActive = false;
        if (document.pointerLockElement === canvas) document.exitPointerLock();
    }

    setupGameControls() {
        this.app.threeSetup.controls.enabled = false;
        this.gameControls = { 
            forward: false,
            brake: false,
            shift: false,
            strafeLeft: false,
            strafeRight: false
        };
        
        this.keydownHandler = (e) => {
            switch(e.code) {
                case 'KeyW': this.gameControls.forward = true; break;
                case 'KeyS': this.gameControls.brake = true; break;
                case 'KeyA': this.gameControls.strafeLeft = true; break;
                case 'KeyD': this.gameControls.strafeRight = true; break;
                case 'ShiftLeft': case 'ShiftRight': this.gameControls.shift = true; break;
                case 'Space':
                    e.preventDefault();
                    if (this.app.languageHunt && this.app.languageHunt.languageHuntActive && this.app.languageHunt.lastDiscoveredLanguage) {
                        const languageModal = document.getElementById('language-modal');
                        if (!languageModal || languageModal.classList.contains('hidden')) {
                            this.app.ui.showLanguageModal(this.app.languageHunt.lastDiscoveredLanguage);
                        }
                    }
                    break;
            }
        };
        
        this.keyupHandler = (e) => {
            switch(e.code) {
                case 'KeyW': this.gameControls.forward = false; break;
                case 'KeyS': this.gameControls.brake = false; break;
                case 'KeyA': this.gameControls.strafeLeft = false; break;
                case 'KeyD': this.gameControls.strafeRight = false; break;
                case 'ShiftLeft': case 'ShiftRight': this.gameControls.shift = false; break;
            }
        };
        document.addEventListener('keydown', this.keydownHandler);
        document.addEventListener('keyup', this.keyupHandler);
    }

    restoreExplorationControls() {
        this.app.threeSetup.controls.enabled = true;
        
        if (this.keydownHandler) {
            document.removeEventListener('keydown', this.keydownHandler);
            this.keydownHandler = null;
        }
        if (this.keyupHandler) {
            document.removeEventListener('keyup', this.keyupHandler);
            this.keyupHandler = null;
        }
        this.gameControls = null;
    }

    setupGameCamera(immediate = false) {
        if (!this.shuttle) return;
        const cam = this.app.threeSetup.camera;
        const desiredPos = this.computeDesiredCameraPosition();
        if (immediate) {
            cam.position.copy(desiredPos);
        }
        cam.lookAt(this.shuttle.position.clone().add(this._camTargetOffset));
    }

    computeDesiredCameraPosition() {
        if (!this.shuttle) return this.app.threeSetup.camera.position.clone();
        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.shuttle.quaternion).normalize();
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.shuttle.quaternion).normalize();
        const upWorld = new THREE.Vector3(0, 1, 0);
        const lateral = this._camFollowOffset.x;
        const height = this._camFollowOffset.y;
        const dist = this._camFollowOffset.z;
        return this.shuttle.position.clone()
            .addScaledVector(right, lateral)
            .addScaledVector(upWorld, height)
            .addScaledVector(forward, -dist);
    }

    updateGame(delta = 0.016) {
        if (!this.shuttle || !this.gameControls) return;
        
        const thrustAccelBase = 45;
        const maxSpeedBase = 85;
        const superSpeedBoost = 3.0;
        const superThrustMultiplier = 3.5;
        const brakeDrag = 6.0;
        const linearDampBase = 1.2;
        const angularAccel = 5.5;
        const angularDamp = 4.0;

        const boosting = this.gameControls.forward && this.gameControls.shift;
        this._boosting = boosting;

        const forwardDir = new THREE.Vector3(0, 0, 1).applyQuaternion(this.shuttle.quaternion);
        const rightDir = new THREE.Vector3(1, 0, 0).applyQuaternion(this.shuttle.quaternion);
        
        let thrustAccel = thrustAccelBase;
        let currentMaxSpeed = maxSpeedBase;
        let dampFactor = linearDampBase;
        if (boosting) {
            thrustAccel *= superThrustMultiplier;
            currentMaxSpeed *= superSpeedBoost;
            dampFactor *= 0.55;
        }

        if (this.gameControls.forward) {
            this._gameVelocity.addScaledVector(forwardDir, thrustAccel * delta);
        }
        if (this.gameControls.strafeLeft) {
            this._gameVelocity.addScaledVector(rightDir, thrustAccel * 0.75 * delta);
        }
        if (this.gameControls.strafeRight) {
            this._gameVelocity.addScaledVector(rightDir, thrustAccel * 0.75 * -1 * delta);
        }

        if (this.gameControls.brake) {
            dampFactor *= brakeDrag;
        }
        
        const currentSpeed = this._gameVelocity.length();
        if (currentSpeed > currentMaxSpeed) {
            this._gameVelocity.multiplyScalar(currentMaxSpeed / currentSpeed);
        }

        if (this._pendingMouseYaw !== 0 || this._pendingMousePitch !== 0) {
            this._gameAngularVelocity += this._pendingMouseYaw * 5;
            this._gamePitchVelocity += this._pendingMousePitch * 3;
            this._pendingMouseYaw = 0; this._pendingMousePitch = 0;
        }

        const linFactor = Math.max(0, 1 - dampFactor * delta);
        this._gameVelocity.multiplyScalar(linFactor);
        
        this._gameAngularVelocity *= Math.max(0, 1 - angularDamp * delta);
        this._gamePitchVelocity *= Math.max(0, 1 - angularDamp * delta);

        this.shuttle.position.addScaledVector(this._gameVelocity, delta);

        const quat = new THREE.Quaternion();
        const yawQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this._gameAngularVelocity * delta);
        const pitchQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), this._gamePitchVelocity * delta);
        quat.multiply(yawQ).multiply(pitchQ);
        this.shuttle.quaternion.multiply(quat);

        if (this._softBoundaryRadius && this._datasetCenter) {
            const offset = this.shuttle.position.clone().sub(this._datasetCenter);
            const dist = offset.length();
            const startPush = this._softBoundaryRadius * this._softBoundaryFactor;
            if (dist > startPush) {
                const excess = dist - startPush;
                const range = this._softBoundaryRadius - startPush;
                const t = Math.min(1, excess / range);
                const pushStrength = 40 * t * t;
                this._gameVelocity.addScaledVector(offset.normalize(), -pushStrength * delta);
                if (this.app.threeSetup.camera && this._baseFOV !== null) {
                    this.app.threeSetup.camera.fov = this._baseFOV + this._fovBoostRange * 0.35 * t;
                    this.app.threeSetup.camera.updateProjectionMatrix();
                }
            }
        }

        const cam = this.app.threeSetup.camera;
        const shipForward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.shuttle.quaternion).normalize();
        const shipUp = new THREE.Vector3(0, 1, 0).applyQuaternion(this.shuttle.quaternion).normalize();
        const worldUp = new THREE.Vector3(0, 1, 0);
        const blendedUp = worldUp.clone().lerp(shipUp, this._camRollBlend).normalize();
        const right = new THREE.Vector3().crossVectors(blendedUp, shipForward).normalize();
        const speedRatio = Math.min(1, this._gameVelocity.length() / Math.max(1e-3, currentMaxSpeed));
        const dynamicDist = this._camFollowOffset.z + this._camDynamicDistBoost * speedRatio;
        const lookAhead = shipForward.clone().multiplyScalar(this._camLookAhead * speedRatio);
        const camPos = this.shuttle.position.clone()
            .addScaledVector(blendedUp, this._camFollowOffset.y)
            .addScaledVector(shipForward, -dynamicDist)
            .addScaledVector(right, this._camFollowOffset.x);
        cam.position.copy(camPos);
        const lookTarget = this.shuttle.position.clone().add(this._camTargetOffset).add(lookAhead);
        cam.up.copy(blendedUp);
        cam.lookAt(lookTarget);

        if (this.app.threeSetup.controls) {
            this.app.threeSetup.controls.target.copy(this.shuttle.position.clone().add(this._camTargetOffset));
        }

        if (this._baseFOV !== null) {
            const speedRatioFov = Math.min(1, this._gameVelocity.length() / currentMaxSpeed);
            const targetFov = this._baseFOV + this._fovBoostRange * speedRatioFov;
            cam.fov += (targetFov - cam.fov) * (1 - Math.pow(0.0001, delta));
            cam.updateProjectionMatrix();
        }

        if (this._hudElement) {
            const sEl = document.getElementById('hud-speed');
            if (sEl) {
                sEl.textContent = this._gameVelocity.length().toFixed(1);
                if (boosting) {
                    sEl.style.color = '#ffea6e';
                    sEl.style.textShadow = '0 0 6px #ffea6e';
                } else {
                    sEl.style.color = '';
                    sEl.style.textShadow = '';
                }
            }
        }

        this.updateCrosshairTarget();
        this.checkPlanetDiscovery();
        
        if (this.app.languageHunt && this.app.languageHunt.languageHuntActive) {
            const currentTime = performance.now();
            this.app.languageHunt.checkLanguageHuntDiscovery();
            this.app.languageHunt.updateLanguageHuntDimming(currentTime);
        }
    }

    addLighting() {
        const ambient = new THREE.AmbientLight(0xffffff, 0.1);
        this.app.threeSetup.scene.add(ambient); this.gameLights.push(ambient);
        const key = new THREE.DirectionalLight(0xfc0318, 1); key.position.set(30, 40, 20); this.app.threeSetup.scene.add(key); this.gameLights.push(key);
        const rim = new THREE.DirectionalLight(0x1100fc, 1.7); rim.position.set(-25, 15, -35); this.app.threeSetup.scene.add(rim); this.gameLights.push(rim);
    }

    checkPlanetDiscovery() {
        if (!this.shuttle || !this.planets || this.planets.length === 0) return;
        const now = performance.now() / 1000;
        
        for (const planetMeta of this.planets) {
            const distance = this.shuttle.position.distanceTo(planetMeta.position);
            const radius = 6;
            if (distance < radius) {
                if (!planetMeta.lastVisit || (now - planetMeta.lastVisit) > 1.5) {
                    planetMeta.lastVisit = now;
                }
            }
        }
    }

    updateCrosshairTarget() {
        if (!this.shuttle || !this._planetMeshes || this._planetMeshes.length === 0 || !this.app.threeSetup.camera) return;

        const camera = this.app.threeSetup.camera;
        const cameraDir = this._tempVecGameDir;
        camera.getWorldDirection(cameraDir);

        const maxDetectionDistance = 80;
        const maxAngleRad = 0.03;
        const ndcTolerance = 0.045;

        const camPos = this._tempVecGameCamPos.copy(camera.position);

        if (this._activePlanetHighlight) {
            const prevMeta = this._activePlanetHighlight;
            const mesh = prevMeta.instancedMesh;
            const idx = prevMeta.instanceIndex;
            const instanceColors = mesh.userData.instanceColors;
            if (instanceColors && prevMeta.baseColor) {
                instanceColors.setXYZ(idx, prevMeta.baseColor.r, prevMeta.baseColor.g, prevMeta.baseColor.b);
                instanceColors.needsUpdate = true;
            }
            this._activePlanetHighlight = null;
        }

        this._raycaster.set(camPos, cameraDir);
        const intersects = this._raycaster.intersectObjects(this._planetMeshes, false);

        let chosenMeta = null;
        let chosenDistance = Infinity;

        if (intersects.length > 0) {
            const hit = intersects[0];
            if (hit.instanceId !== undefined) {
                const lookupKey = `${hit.object.uuid}:${hit.instanceId}`;
                chosenMeta = this._planetInstanceLookup.get(lookupKey);
                if (chosenMeta) {
                    chosenDistance = camPos.distanceTo(chosenMeta.position);
                }
            }
        }

        if (!chosenMeta) {
            let bestScore = Infinity;
            const ndc = this._tempVecGameWork3;
            
            for (const planetMeta of this.planets) {
                const distCam = camPos.distanceTo(planetMeta.position);
                if (distCam > maxDetectionDistance) continue;

                const toPlanet = this._tempVecGameWork.copy(planetMeta.position).sub(camPos);
                const dist = toPlanet.length();
                const dir = this._tempVecGameWork2.copy(toPlanet).normalize();
                const angle = cameraDir.angleTo(dir);
                if (angle > maxAngleRad) continue;

                ndc.copy(planetMeta.position).project(camera);
                if (Math.abs(ndc.x) > ndcTolerance || Math.abs(ndc.y) > ndcTolerance) continue;

                const score = angle * 1000 + dist * 0.01;
                if (score < bestScore) {
                    bestScore = score;
                    chosenMeta = planetMeta;
                    chosenDistance = dist;
                }
            }
        }

        const crosshair = this._crosshairElement;

        if (chosenMeta && chosenMeta.language) {
            const mesh = chosenMeta.instancedMesh;
            const idx = chosenMeta.instanceIndex;
            const instanceColors = mesh.userData.instanceColors;
            
            if (instanceColors) {
                this._planetHighlightColor.copy(chosenMeta.baseColor).multiplyScalar(1.8);
                instanceColors.setXYZ(idx, this._planetHighlightColor.r, this._planetHighlightColor.g, this._planetHighlightColor.b);
                instanceColors.needsUpdate = true;
            }
            
            this._activePlanetHighlight = chosenMeta;

            if (crosshair) {
                crosshair.className = this._boosting ? 'boosting' : 'targeting';
            }
            
            if (this.app.events && this.app.events.onLanguageHover) {
                this.app.events.onLanguageHover(chosenMeta.language);
            }

            const shuttleDistance = this.shuttle.position.distanceTo(chosenMeta.position);
            this.showCrosshairInfo(chosenMeta.language, shuttleDistance);
            return;
        }

        if (crosshair) {
            crosshair.className = 'normal';
        }
        if (this.app.events && this.app.events.onLanguageHide) {
            this.app.events.onLanguageHide();
        }
        this.hideCrosshairInfo();
    }

    showCrosshairInfo(language, distance) {
        let infoElement = document.getElementById('crosshair-info');
        if (!infoElement) {
            infoElement = document.createElement('div');
            infoElement.id = 'crosshair-info';
            document.body.appendChild(infoElement);
        }
        
        const familyInfo = language.group1 || 'Unknown';
        const distanceStr = distance < 1 ? (distance * 1000).toFixed(0) + 'm' : distance.toFixed(1) + 'u';
        
        infoElement.innerHTML = `
            <div style="font-weight: bold; color: #0ff; margin-bottom: 4px;">${language.name}</div>
            <div style="font-size: 14px; color: rgba(255,255,255,0.8);">${familyInfo}</div>
            <div style="font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 3px;">Distance: ${distanceStr}</div>
        `;
        infoElement.style.display = 'block';
    }

    hideCrosshairInfo() {
        const infoElement = document.getElementById('crosshair-info');
        if (infoElement) {
            infoElement.style.display = 'none';
        }
    }
}
