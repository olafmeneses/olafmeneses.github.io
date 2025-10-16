// LanguageHunt

export class LanguageHunt {
    constructor(gameMode) {
        this.gameMode = gameMode;
        this.app = gameMode.app;
        
        this.languageHuntActive = false;
        this.targetLanguages = [];
        this.discoveredLanguages = new Set();
        this.gameStartTime = null;
        this.lastDimmingUpdate = 0;
        this.dimmingProgress = 0;
        this.maxDimmingTime = 1000;
        this.discoveryRadius = 8;
        this.lastDiscoveredLanguage = null;
        this.aureolaRings = new Map();
        this.discoveryNotificationTimeout = null;
    }

    initializeLanguageHunt() {
        if (!this.app.dataLoader.languageData || this.app.dataLoader.languageData.length === 0) {
            return;
        }
        
        this.languageHuntActive = true;
        this.discoveredLanguages.clear();
        this.gameStartTime = performance.now();
        this.lastDimmingUpdate = this.gameStartTime;
        this.dimmingProgress = 0;
        this.lastDiscoveredLanguage = null;
        
        this.selectRandomTargetLanguages();
    }
    
    selectRandomTargetLanguages() {
        const availableLanguages = [];
        
        const layout = this.app.dataLoader.layouts[this.app.currentLayout];
        if (!layout) {
            return;
        }
        
        for (let i = 0; i < this.app.dataLoader.languageData.length; i++) {
            if (layout[i]) {
                availableLanguages.push(i);
            }
        }
        
        const targetCount = Math.min(10, availableLanguages.length);
        this.targetLanguages = [];
        
        for (let i = 0; i < targetCount; i++) {
            const randomIndex = Math.floor(Math.random() * availableLanguages.length);
            const selectedLanguage = availableLanguages.splice(randomIndex, 1)[0];
            this.targetLanguages.push(selectedLanguage);
        }
    }
    
    restartLanguageHunt() {
        this.languageHuntActive = true;
        
        this.removeAureolaRings();
        
        this.gameMode.planets.forEach(planetMeta => {
            if (planetMeta.instancedMesh && planetMeta.instancedMesh.userData.instanceColors) {
                const instanceColors = planetMeta.instancedMesh.userData.instanceColors;
                const idx = planetMeta.instanceIndex;
                if (planetMeta.baseColor) {
                    instanceColors.setXYZ(idx, planetMeta.baseColor.r, planetMeta.baseColor.g, planetMeta.baseColor.b);
                    instanceColors.needsUpdate = true;
                }
            }
        });
        
        this.initializeLanguageHunt();
        
        this.updateLanguageHuntHUD();
    }
    
    checkLanguageHuntDiscovery() {
        if (!this.languageHuntActive || !this.gameMode.shuttle || !this.gameMode.planets) return;
        
        const now = performance.now();
        
        for (const targetIndex of this.targetLanguages) {
            if (this.discoveredLanguages.has(targetIndex)) continue;
            
            const planetMeta = this.gameMode.planets.find(p => p.layoutIndex === targetIndex);
            if (!planetMeta) continue;
            
            const distance = this.gameMode.shuttle.position.distanceTo(planetMeta.position);
            
            if (distance < this.discoveryRadius) {
                this.discoveredLanguages.add(targetIndex);
                this.lastDiscoveredLanguage = this.app.dataLoader.languageData[targetIndex];
                
                this.showDiscoveryNotification(this.lastDiscoveredLanguage);
                
                this.dimmingProgress = Math.max(0, this.dimmingProgress - 0.3);
                this.lastDimmingUpdate = now;
                
                this.updateLanguageHuntHUD();
                
                if (this.discoveredLanguages.size >= this.targetLanguages.length) {
                    this.completeLanguageHunt();
                }
                
                break;
            }
        }
    }
    
    updateLanguageHuntDimming(currentTime) {
        if (!this.languageHuntActive) return;
        
        const timeSinceLastUpdate = currentTime - this.lastDimmingUpdate;
        const dimmingRate = timeSinceLastUpdate / this.maxDimmingTime;
        this.dimmingProgress = Math.min(1.0, this.dimmingProgress + dimmingRate);
        this.lastDimmingUpdate = currentTime;
        
        this.gameMode.planets.forEach(planetMeta => {
            const isTarget = this.targetLanguages.includes(planetMeta.layoutIndex);
            const isDiscovered = this.discoveredLanguages.has(planetMeta.layoutIndex);
            
            if (!isTarget && !isDiscovered) {
                const dimmingFactor = 0.05 + (0.95 * (1 - this.dimmingProgress));
                this.applyPlanetDimming(planetMeta, dimmingFactor);
            } else if (isTarget && !isDiscovered) {
                this.applyPlanetDimming(planetMeta, 1.0);
                this.applyAureolaEffect(planetMeta, currentTime);
            }
        });
    }
    
    applyPlanetDimming(planetMeta, dimmingFactor) {
        if (!planetMeta.instancedMesh || !planetMeta.baseColor) return;
        
        const instanceColors = planetMeta.instancedMesh.userData.instanceColors;
        if (!instanceColors) return;
        
        const idx = planetMeta.instanceIndex;
        const dimmedColor = planetMeta.baseColor.clone().multiplyScalar(dimmingFactor);
        
        instanceColors.setXYZ(idx, dimmedColor.r, dimmedColor.g, dimmedColor.b);
        instanceColors.needsUpdate = true;
    }
    
    applyAureolaEffect(planetMeta, currentTime) {
        if (!planetMeta.instancedMesh || !planetMeta.baseColor) return;
        
        const pulseSpeed = 0.001;
        const pulseIntensity = 0.3;
        const pulse = Math.sin(currentTime * pulseSpeed) * pulseIntensity + 1.0;
        
        const instanceColors = planetMeta.instancedMesh.userData.instanceColors;
        if (!instanceColors) return;
        
        const idx = planetMeta.instanceIndex;
        const glowColor = planetMeta.baseColor.clone().multiplyScalar(pulse);
        
        instanceColors.setXYZ(idx, glowColor.r, glowColor.g, glowColor.b);
        instanceColors.needsUpdate = true;
        
        this.updateAureolaRing(planetMeta, currentTime);
    }
    
    createAureolaRing(planetMeta) {
        const ringGeometry = new THREE.RingGeometry(1.5, 1.8, 32);
        const isDiscovered = this.discoveredLanguages.has(planetMeta.layoutIndex);
        const ringColor = isDiscovered ? 0xffd700 : 0xffd700;
        
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: ringColor,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        const pivot = new THREE.Object3D();
        pivot.position.copy(planetMeta.position);
        
        pivot.lookAt(this.app.threeSetup.camera.position);
        
        pivot.add(ring);
        this.app.threeSetup.scene.add(pivot);
        
        this.aureolaRings.set(planetMeta.layoutIndex, {
            pivot: pivot,
            mesh: ring,
            material: ringMaterial,
            planetMeta: planetMeta,
            rotationSpeed: 0.01 + Math.random() * 0.005
        });
        
        return pivot;
    }
    
    updateAureolaRing(planetMeta, currentTime) {
        let ringData = this.aureolaRings.get(planetMeta.layoutIndex);
        
        if (!ringData) {
            ringData = this.createAureolaRing(planetMeta);
        }
        
        if (ringData && ringData.pivot && ringData.mesh) {
            const pivot = ringData.pivot;
            const ring = ringData.mesh;
            const material = ringData.material;
    
            pivot.position.copy(planetMeta.position);
            pivot.lookAt(this.app.threeSetup.camera.position);
            
            const isDiscovered = this.discoveredLanguages.has(planetMeta.layoutIndex);
            
            if (isDiscovered) {
                material.opacity = 0.1;
                material.color.set(0x00ffff);
                ring.rotation.set(0, 0, 0);
            } else {
                material.color.set(0xffd700);
                ring.rotation.x += ringData.rotationSpeed;
                ring.rotation.y += ringData.rotationSpeed;
                ring.rotation.z += ringData.rotationSpeed;
            }
        }
    }
    
    removeAureolaRings() {
        this.aureolaRings.forEach((ringData, languageIndex) => {
            if (ringData.pivot) {
                this.app.threeSetup.scene.remove(ringData.pivot);
            }
            if (ringData.mesh) {
                ringData.material.dispose();
                ringData.mesh.geometry.dispose();
            }
        });
        this.aureolaRings.clear();
    }
    
    showDiscoveryNotification(language) {
        const notification = document.getElementById('discovery-notification');
        if (!notification) return;
        
        if (this.discoveryNotificationTimeout) {
            clearTimeout(this.discoveryNotificationTimeout);
        }
        
        notification.classList.add('hidden');
        
        setTimeout(() => {
            const textElement = document.getElementById('discovery-text');
            if (textElement) {
                textElement.innerHTML = `
                    <strong>${language.name || language.lang_name}</strong><br>
                    <span style="opacity: 0.8;">${language.group1 || 'Unknown Family'}</span><br>
                    <span style="font-size: 0.9em; margin-top: 8px; display: block;">Press SPACE for more info</span>
                `;
            }
            
            notification.classList.remove('hidden');
            
            this.discoveryNotificationTimeout = setTimeout(() => {
                notification.classList.add('hidden');
                this.discoveryNotificationTimeout = null;
            }, 2500);
        }, 100);
    }
    
    updateLanguageHuntHUD() {
        const progressElement = document.getElementById('language-hunt-progress');
        if (progressElement) {
            const discovered = this.discoveredLanguages.size;
            const total = this.targetLanguages.length;
            progressElement.textContent = `${discovered}/${total}`;
        }
        
        const progressBar = document.getElementById('language-hunt-progress-bar');
        if (progressBar) {
            const percentage = (this.discoveredLanguages.size / this.targetLanguages.length) * 100;
            progressBar.style.width = `${percentage}%`;
        }
    }
    
    completeLanguageHunt() {
        const completionTime = (performance.now() - this.gameStartTime) / 1000;
        this.showCompletionModal(completionTime);
    }
    
    showCompletionModal(completionTime) {
        const modal = document.getElementById('language-hunt-completion-modal');
        const timeElement = document.getElementById('completion-time');
        const languagesElement = document.getElementById('completion-languages');
        
        if (!modal) {
            setTimeout(() => {
                if (confirm(`🎉 Congratulations! You discovered all languages in ${completionTime.toFixed(1)} seconds!\n\nWould you like to play again?`)) {
                    this.restartLanguageHunt();
                }
            }, 500);
            return;
        }
        
        const minutes = Math.floor(completionTime / 60);
        const seconds = Math.floor(completionTime % 60);
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeElement) {
            timeElement.textContent = timeString;
        }
        
        if (languagesElement) {
            languagesElement.textContent = this.discoveredLanguages.size.toString();
        }
        
        const canvas = this.app.threeSetup?.renderer?.domElement;
        if (canvas && document.pointerLockElement === canvas) {
            document.exitPointerLock();
        }

        modal.classList.remove('hidden');

        const closeBtn = modal.querySelector('.language-modal-close');
        const restartBtn = document.getElementById('restart-language-hunt');
        const exitBtn = document.getElementById('exit-language-hunt');
        const overlay = modal.querySelector('.completion-modal-overlay');
        
        const closeModal = () => {
            modal.classList.add('hidden');
        };
        
        const handleRestart = () => {
            closeModal();
            if (!this.languageHuntActive) {
                this.languageHuntActive = true;
            }
            if (canvas) {
                canvas.requestPointerLock();
            }
            this.restartLanguageHunt();
        };
        
        const handleExit = () => {
            closeModal();
            this.gameMode.exitGameMode();
        };

        if (restartBtn) {
            const textNodes = [];
            const walker = document.createTreeWalker(
                restartBtn,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );

            let node;
            while (node = walker.nextNode()) {
                textNodes.push(node);
            }

            const playAgainNode = textNodes.find(n => {
                const text = n.textContent;
                return text.includes('Play Again') && !text.includes('(R)');
            });

            if (playAgainNode) {
                playAgainNode.textContent = playAgainNode.textContent.replace('Play Again', 'Play Again (R)');
            } else {
                if (restartBtn.innerHTML.includes('Play Again') && !restartBtn.innerHTML.includes('(R)')) {
                    restartBtn.innerHTML = restartBtn.innerHTML.replace('Play Again', 'Play Again (R)');
                }
            }
        }
        
        if (exitBtn) {
            exitBtn.replaceWith(exitBtn.cloneNode(true));
            document.getElementById('exit-language-hunt').addEventListener('click', handleExit);
        }
        
        if (overlay) {
            overlay.onclick = closeModal;
        }

        const rKeyHandler = (e) => {
            if (e.key === 'r' || e.key === 'R') {
                e.preventDefault();
                handleRestart();
            }
        };
        document.addEventListener('keydown', rKeyHandler);

        const originalCloseModal = closeModal;
        closeModal = () => {
            originalCloseModal();
            document.removeEventListener('keydown', rKeyHandler);
        };

        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }

    resetLanguageHunt() {
        this.languageHuntActive = false;
        this.discoveredLanguages.clear();
        this.targetLanguages = [];
        this.lastDiscoveredLanguage = null;
        
        this.removeAureolaRings();
        
        if (this.discoveryNotificationTimeout) {
            clearTimeout(this.discoveryNotificationTimeout);
            this.discoveryNotificationTimeout = null;
        }
    }
}
