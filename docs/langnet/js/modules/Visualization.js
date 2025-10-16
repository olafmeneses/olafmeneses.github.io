import { CONFIG } from './Config.js';

export class Visualization {
    constructor(scene) {
        this.scene = scene;
        this.nodeObjects = [];
        this.edgeObjects = [];
        this.instancedNodes = new Map();
        this.instancedEdges = null;
        this.nodeInstanceData = [];
        this.languageData = [];
        this.edges = [];
        this.layouts = {};
        this.currentLayout = 'tsne';
        this.isGameMode = false;
        
        this.isAnimating = false;
        this.animationDuration = 1000;
        this.animationsEnabled = true;
        this.nodeAnimationData = new Map();
        this.minAnimationDuration = 600;
        this.maxAnimationDuration = 1200;
        this.animateEdges = true;
        
        this.tempMatrix = new THREE.Matrix4();
        this.tempPosition = new THREE.Vector3();
        this.tempQuaternion = new THREE.Quaternion();
        this.tempScale = new THREE.Vector3();
    }
    
    setInstanceMatrix(mesh, instanceIndex, position, scale = 1) {
        this.tempScale.set(scale, scale, scale);
        this.tempMatrix.compose(position, this.tempQuaternion, this.tempScale);
        mesh.setMatrixAt(instanceIndex, this.tempMatrix);
    }
    
    hideInstance(mesh, instanceIndex) {
        this.tempPosition.set(0, 0, 0);
        this.tempScale.set(0, 0, 0);
        this.tempMatrix.compose(this.tempPosition, this.tempQuaternion, this.tempScale);
        mesh.setMatrixAt(instanceIndex, this.tempMatrix);
    }

    setData(languageData, edges, layouts) {
        this.languageData = languageData;
        this.edges = edges;
        this.layouts = layouts;
    }

    createVisualization() {
        this.createNodes();
        this.createEdges();
        this.updateVisualization();
    }

    createNodes() {
        this.nodeObjects = [];
        this.nodeInstanceData = [];

        this.instancedNodes.forEach(instancedMesh => {
            this.scene.remove(instancedMesh);
        });
        this.instancedNodes.clear();

        const colorGroups = new Map();
        this.languageData.forEach((lang, i) => {
            const color = this.getColorForLanguage(lang);
            if (!colorGroups.has(color)) {
                colorGroups.set(color, []);
            }
            colorGroups.get(color).push({ lang, index: i });
        });

        const segments = CONFIG.PERFORMANCE.SPHERE_SEGMENTS_SMOOTH || 24;
        const geometry = new THREE.SphereGeometry(0.8, segments, segments);

        geometry.computeBoundingSphere();
        geometry.computeBoundingBox();

        colorGroups.forEach((languages, color) => {
            const material = new THREE.MeshPhysicalMaterial({
                color: new THREE.Color(color),
                metalness: 0.6,
                roughness: 0.25,
                clearcoat: 0.2,
                clearcoatRoughness: 0.2,
                emissive: 0x000000,
                transparent: false,
                opacity: 1,
                fog: false
            });
            const instancedMesh = new THREE.InstancedMesh(geometry, material, languages.length);
            instancedMesh.userData = { type: 'instancedNodes', color: color };
            instancedMesh.frustumCulled = false;

            instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(languages.length * 3), 3);

            const matrix = new THREE.Matrix4();
            languages.forEach((langData, instanceIndex) => {
                matrix.setPosition(0, 0, 0);
                instancedMesh.setMatrixAt(instanceIndex, matrix);

                instancedMesh.setColorAt(instanceIndex, new THREE.Color(color));

                this.nodeInstanceData.push({
                    languageIndex: langData.index,
                    instancedMesh: instancedMesh,
                    instanceIndex: instanceIndex,
                    color: color,
                    currentScale: 1
                });
            });

            instancedMesh.instanceMatrix.needsUpdate = true;
            instancedMesh.instanceColor.needsUpdate = true;
            this.scene.add(instancedMesh);
            this.instancedNodes.set(color, { mesh: instancedMesh, languages: languages });
        });

    }

    createEdges() {
        this.edgeObjects = [];

        if (this.instancedEdges) {
            this.scene.remove(this.instancedEdges);
        }

        if (this.edges.length === 0) return;

        const positions = new Float32Array(this.edges.length * 6);
        const colors = new Float32Array(this.edges.length * 6);

        this.edges.forEach((edge, i) => {
            const offset = i * 6;
            positions[offset] = 0;
            positions[offset + 1] = 0;
            positions[offset + 2] = 0;
            positions[offset + 3] = 0;
            positions[offset + 4] = 0;
            positions[offset + 5] = 0;

            const sourceLang = this.languageData[edge.source];
            const targetLang = this.languageData[edge.target];
            const sourceColor = new THREE.Color(this.getColorForLanguage(sourceLang));
            const targetColor = new THREE.Color(this.getColorForLanguage(targetLang));

            colors[offset] = sourceColor.r;
            colors[offset + 1] = sourceColor.g;
            colors[offset + 2] = sourceColor.b;

            colors[offset + 3] = targetColor.r;
            colors[offset + 4] = targetColor.g;
            colors[offset + 5] = targetColor.b;
        });

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.LineBasicMaterial({
            transparent: true,
            opacity: 0.5,
            fog: false,
            vertexColors: true
        });

        this.instancedEdges = new THREE.LineSegments(geometry, material);
        this.instancedEdges.userData = { type: 'edges' };
        this.scene.add(this.instancedEdges);
    }

    updateVisualization(forceRefresh = false) {
        if (!forceRefresh && (this.isGameMode || this.isAnimating)) {
            return;
        }
        
        const layout = this.layouts[this.currentLayout];
        if (!layout) {
            return;
        }
        
        this.instancedNodes.forEach((nodeGroup, color) => {
            const { mesh, languages } = nodeGroup;
            
            let visibleCount = 0;
            let hiddenCount = 0;
            
            for (let i = 0; i < mesh.count; i++) {
                const langData = languages[i];
                if (langData) {
                    const positionData = layout[langData.index];
                    if (positionData) {
                        this.tempPosition.set(positionData.x, positionData.y, positionData.z);
                        
                        const instanceData = this.nodeInstanceData.find(data => data.languageIndex === langData.index);
                        const scale = instanceData ? instanceData.currentScale : 1;
                        
                        this.setInstanceMatrix(mesh, i, this.tempPosition, scale);
                        visibleCount++;
                    } else {
                        this.hideInstance(mesh, i);
                        hiddenCount++;
                    }
                } else {
                    this.hideInstance(mesh, i);
                    hiddenCount++;
                }
            }
            
            mesh.instanceMatrix.needsUpdate = true;
        });
        
        if (this.instancedEdges) {
            const positions = this.instancedEdges.geometry.attributes.position.array;
            const colors = this.instancedEdges.geometry.attributes.color.array;
            let visibleEdges = 0;
            let hiddenEdges = 0;
            
            this.edges.forEach((edge, i) => {
                const sourcePos = layout[edge.source];
                const targetPos = layout[edge.target];
                const offset = i * 6;
                
                if (sourcePos && targetPos) {
                    positions[offset] = sourcePos.x;
                    positions[offset + 1] = sourcePos.y;
                    positions[offset + 2] = sourcePos.z;
                    positions[offset + 3] = targetPos.x;
                    positions[offset + 4] = targetPos.y;
                    positions[offset + 5] = targetPos.z;
                    
                    const sourceLang = this.languageData[edge.source];
                    const targetLang = this.languageData[edge.target];
                    const sourceColor = new THREE.Color(this.getColorForLanguage(sourceLang));
                    const targetColor = new THREE.Color(this.getColorForLanguage(targetLang));
                    
                    colors[offset] = sourceColor.r;
                    colors[offset + 1] = sourceColor.g;
                    colors[offset + 2] = sourceColor.b;
                    
                    colors[offset + 3] = targetColor.r;
                    colors[offset + 4] = targetColor.g;
                    colors[offset + 5] = targetColor.b;
                    
                    visibleEdges++;
                } else {
                    positions[offset] = 0;
                    positions[offset + 1] = 0;
                    positions[offset + 2] = 0;
                    positions[offset + 3] = 0;
                    positions[offset + 4] = 0;
                    positions[offset + 5] = 0;
                    
                    colors[offset] = 0;
                    colors[offset + 1] = 0;
                    colors[offset + 2] = 0;
                    colors[offset + 3] = 0;
                    colors[offset + 4] = 0;
                    colors[offset + 5] = 0;
                    
                    hiddenEdges++;
                }
            });
            
            this.instancedEdges.geometry.attributes.position.needsUpdate = true;
            this.instancedEdges.geometry.attributes.color.needsUpdate = true;
        }
    }

    updateVisibility(selectedFamilies) {
        if (this.isGameMode) {
            return;
        }
        
        if (selectedFamilies.length === 0) {
            this.instancedNodes.forEach((nodeGroup) => {
                nodeGroup.mesh.visible = true;
            });
            return;
        }

        this.instancedNodes.forEach((nodeGroup, color) => {
            const { mesh, languages } = nodeGroup;
            const layout = this.layouts[this.currentLayout];

            languages.forEach((langData, instanceIndex) => {
                const lang = langData.lang;
                const visible = selectedFamilies.includes(lang.group1);
                const position = layout[langData.index];
                
                if (position && visible) {
                    this.tempPosition.set(position.x, position.y, position.z);
                    this.setInstanceMatrix(mesh, instanceIndex, this.tempPosition);
                } else {
                    this.hideInstance(mesh, instanceIndex);
                }
            });
            
            mesh.instanceMatrix.needsUpdate = true;
        });
    }

    setGameMode(isGameMode) {
        this.isGameMode = isGameMode;
        
        if (this.isAnimating) {
            this.stopCurrentAnimation();
        }
        
        if (!isGameMode) {
            this.instancedNodes.forEach((nodeGroup) => {
                const mesh = nodeGroup.mesh;
                if (mesh) {
                    mesh.visible = true;
                    mesh.frustumCulled = true;
                    mesh.instanceMatrix.needsUpdate = true;
                    if (mesh.instanceColor) {
                        mesh.instanceColor.needsUpdate = true;
                    }
                }
            });
        }
    }

    hideNodes() {
        this.instancedNodes.forEach(mesh => {
            mesh.visible = false;
        });
    }

    showNodes() {
        if (this.isGameMode) {
            return;
        }
        this.instancedNodes.forEach(mesh => {
            mesh.visible = true;
        });
    }

    hideEdges() {
        if (this.instancedEdges) {
            this.instancedEdges.visible = false;
        }
    }

    showEdges() {
        if (this.isGameMode) {
            return;
        }
        if (this.instancedEdges) {
            this.instancedEdges.visible = true;
        }
    }

    setCurrentLayout(layout) {
        if (this.isGameMode) {
            return;
        }
        
        const oldLayout = this.currentLayout;
        this.currentLayout = layout;
        
        if (oldLayout === layout) {
            this.updateVisualization();
            return;
        }
        
        if (!this.animationsEnabled) {
            this.updateVisualization();
            return;
        }
        
        if (this.isAnimating) {
            this.stopCurrentAnimation();
        }
        
        this.animateToLayout(oldLayout, layout);
    }

    stopCurrentAnimation() {
        if (window.TWEEN) {
            window.TWEEN.removeAll();
        }
        this.isAnimating = false;
        this.nodeAnimationData.clear();
    }

    animateToLayout(fromLayout, toLayout) {
        if (this.isGameMode || this.isAnimating) {
            this.updateVisualization();
            return;
        }

        if (!window.TWEEN) {
            this.updateVisualization();
            return;
        }

        const fromPositions = this.layouts[fromLayout];
        const toPositions = this.layouts[toLayout];
        
        if (!fromPositions || !toPositions) {
            this.updateVisualization();
            return;
        }

        this.isAnimating = true;
        
        const adaptiveDuration = this.calculateAnimationDuration(fromPositions, toPositions);
        
        this.instancedNodes.forEach((nodeGroup, color) => {
            const { mesh, languages } = nodeGroup;
            const animData = {
                startPositions: [],
                targetPositions: [],
                currentPositions: [],
                scales: []
            };
            
            languages.forEach((langData, index) => {
                const fromPos = fromPositions[langData.index];
                const toPos = toPositions[langData.index];
                
                const instanceData = this.nodeInstanceData.find(data => data.languageIndex === langData.index);
                const scale = instanceData ? instanceData.currentScale : 1;
                animData.scales[index] = scale;
                
                if (fromPos && toPos) {
                    animData.startPositions[index] = { x: fromPos.x, y: fromPos.y, z: fromPos.z };
                    animData.targetPositions[index] = { x: toPos.x, y: toPos.y, z: toPos.z };
                    animData.currentPositions[index] = { x: fromPos.x, y: fromPos.y, z: fromPos.z };
                } else if (toPos) {
                    animData.startPositions[index] = { x: 0, y: 0, z: 0 };
                    animData.targetPositions[index] = { x: toPos.x, y: toPos.y, z: toPos.z };
                    animData.currentPositions[index] = { x: 0, y: 0, z: 0 };
                } else if (fromPos) {
                    animData.startPositions[index] = { x: fromPos.x, y: fromPos.y, z: fromPos.z };
                    animData.targetPositions[index] = { x: 0, y: 0, z: 0 };
                    animData.currentPositions[index] = { x: fromPos.x, y: fromPos.y, z: fromPos.z };
                } else {
                    animData.startPositions[index] = { x: 0, y: 0, z: 0 };
                    animData.targetPositions[index] = { x: 0, y: 0, z: 0 };
                    animData.currentPositions[index] = { x: 0, y: 0, z: 0 };
                }
            });
            
            this.nodeAnimationData.set(color, animData);
        });

        const animationState = { progress: 0 };
        
        const tween = new window.TWEEN.Tween(animationState)
            .to({ progress: 1 }, adaptiveDuration)
            .easing(window.TWEEN.Easing.Cubic.InOut)
            .onUpdate(() => {
                try {
                    this.updateAnimationFrame(animationState.progress);
                } catch (error) {
                    this.stopCurrentAnimation();
                    this.updateVisualization();
                }
            })
            .onComplete(() => {
                this.isAnimating = false;
                this.nodeAnimationData.clear();
                this.updateVisualization();
            })
            .onStop(() => {
                this.isAnimating = false;
                this.nodeAnimationData.clear();
            })
            .start();
    }

    updateAnimationFrame(progress) {
        this.instancedNodes.forEach((nodeGroup, color) => {
            const { mesh, languages } = nodeGroup;
            const animData = this.nodeAnimationData.get(color);
            
            if (!animData) return;
            
            const batchUpdates = [];
            
            for (let index = 0; index < languages.length && index < mesh.count; index++) {
                const langData = languages[index];
                
                if (langData && animData.startPositions[index] && animData.targetPositions[index]) {
                    const start = animData.startPositions[index];
                    const target = animData.targetPositions[index];
                    
                    const currentPos = {
                        x: start.x + (target.x - start.x) * progress,
                        y: start.y + (target.y - start.y) * progress,
                        z: start.z + (target.z - start.z) * progress
                    };
                    
                    animData.currentPositions[index] = currentPos;
                    
                    const scale = animData.scales ? animData.scales[index] : 1;
                    
                    batchUpdates.push({ index, pos: currentPos, scale });
                } else {
                    batchUpdates.push({ index, pos: { x: 0, y: 0, z: 0 }, scale: 0 });
                }
            }
            
            for (const update of batchUpdates) {
                this.tempPosition.set(update.pos.x, update.pos.y, update.pos.z);
                this.setInstanceMatrix(mesh, update.index, this.tempPosition, update.scale);
            }
            
            mesh.instanceMatrix.needsUpdate = true;
        });

        if (this.animateEdges) {
            this.updateEdgeAnimationOptimized(progress);
        }
    }

    updateEdgeAnimationOptimized(progress) {
        if (!this.instancedEdges) return;
        
        const positions = this.instancedEdges.geometry.attributes.position.array;
        
        const positionLookup = new Map();
        
        this.instancedNodes.forEach((nodeGroup, color) => {
            const { languages } = nodeGroup;
            const animData = this.nodeAnimationData.get(color);
            
            if (animData) {
                for (let index = 0; index < languages.length; index++) {
                    const langData = languages[index];
                    if (langData && animData.currentPositions[index]) {
                        positionLookup.set(langData.index, animData.currentPositions[index]);
                    }
                }
            }
        });
        
        for (let i = 0; i < this.edges.length; i++) {
            const edge = this.edges[i];
            const offset = i * 6;
            
            const sourcePos = positionLookup.get(edge.source);
            const targetPos = positionLookup.get(edge.target);
            
            if (sourcePos && targetPos) {
                positions[offset] = sourcePos.x;
                positions[offset + 1] = sourcePos.y;
                positions[offset + 2] = sourcePos.z;
                positions[offset + 3] = targetPos.x;
                positions[offset + 4] = targetPos.y;
                positions[offset + 5] = targetPos.z;
            } else {
                positions[offset] = positions[offset + 1] = positions[offset + 2] = 0;
                positions[offset + 3] = positions[offset + 4] = positions[offset + 5] = 0;
            }
        }
        
        this.instancedEdges.geometry.attributes.position.needsUpdate = true;
    }

    setAnimationsEnabled(enabled) {
        this.animationsEnabled = enabled;
        
        if (!enabled && this.isAnimating) {
            this.stopCurrentAnimation();
            this.updateVisualization();
        }
    }

    setAnimationSettings(settings = {}) {
        if (settings.duration !== undefined) {
            this.animationDuration = Math.max(100, settings.duration);
        }
        if (settings.minDuration !== undefined) {
            this.minAnimationDuration = Math.max(100, settings.minDuration);
        }
        if (settings.maxDuration !== undefined) {
            this.maxAnimationDuration = Math.max(200, settings.maxDuration);
        }
        if (settings.animateEdges !== undefined) {
            this.animateEdges = settings.animateEdges;
        }
    }

    setSmoothAnimations() {
        this.setAnimationSettings({
            duration: 1200,
            minDuration: 800,
            maxDuration: 1600,
            animateEdges: true
        });
    }

    calculateAnimationDuration(fromPositions, toPositions) {
        let totalDistance = 0;
        let pointCount = 0;
        
        for (let i = 0; i < this.languageData.length; i++) {
            const fromPos = fromPositions[i];
            const toPos = toPositions[i];
            
            if (fromPos && toPos) {
                const distance = Math.sqrt(
                    Math.pow(toPos.x - fromPos.x, 2) +
                    Math.pow(toPos.y - fromPos.y, 2) +
                    Math.pow(toPos.z - fromPos.z, 2)
                );
                totalDistance += distance;
                pointCount++;
            }
        }
        
        if (pointCount === 0) return this.animationDuration;
        
        const averageDistance = totalDistance / pointCount;
        
        const normalizedDistance = Math.min(averageDistance / 100, 1);
        const duration = this.minAnimationDuration + 
                        (this.maxAnimationDuration - this.minAnimationDuration) * normalizedDistance;
        
        return Math.round(duration);
    }
}