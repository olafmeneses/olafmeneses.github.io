// Events

export class Events {
    constructor(camera, renderer, raycaster, mouse, controls, visualization) {
        this.camera = camera;
        this.renderer = renderer;
        this.raycaster = raycaster;
        this.mouse = mouse;
        this.controls = controls;
        this.visualization = visualization;
        
        this.hoveredObject = null;
        this.searchResults = [];
        this.highlightedLanguages = [];
        this.animationsEnabled = true;
        this.showEdges = true;
        
        this.nodeInstanceData = [];
        this.languageData = [];
        this.layouts = {};
        this.currentLayout = 'tsne';
        this.familyStats = new Map();
        
        this.onLanguageHover = null;
        this.onLanguageHide = null;
        this.onLanguageClick = null;
    }

    setupMouseEvents(rendererDomElement) {
        rendererDomElement.addEventListener('mousemove', (event) => {
            this.onMouseMove(event);
        });
        
        rendererDomElement.addEventListener('click', (event) => {
            this.onMouseClick(event);
        });
    }

    updateEdgeOpacityBasedOnZoom() {
        if (!this.visualization || !this.visualization.instancedEdges || !this.showEdges) return;
        
        const distance = this.camera.position.distanceTo(this.controls.target);
        const minDistance = 50;
        const maxDistance = 400;
        
        let opacity;
        if (distance <= minDistance) {
            opacity = 0.5;
        } else if (distance >= maxDistance) {
            opacity = 0.0;
        } else {
            opacity = 0.5 * (1 - (distance - minDistance) / (maxDistance - minDistance));
        }
        
        this.visualization.instancedEdges.material.opacity = opacity;
        this.visualization.instancedEdges.material.needsUpdate = true;
    }

    updateEdgeVisibilityForHighlights() {
        if (!this.visualization || !this.visualization.instancedEdges) return;
        
        if (this.highlightedLanguages.length === 0) {
            this.visualization.instancedEdges.visible = this.showEdges;
            if (this.showEdges) {
                this.updateEdgeOpacityBasedOnZoom();
            }
        } else {
            this.visualization.instancedEdges.visible = false;
        }
    }

    performRaycast(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        const instancedMeshes = Array.from(this.nodeInstanceData).map(data => data.instancedMesh);
        const uniqueMeshes = [...new Set(instancedMeshes)];
        const intersects = this.raycaster.intersectObjects(uniqueMeshes);
        
        return intersects.find(inter => (
            typeof inter.instanceId === 'number' &&
            this.nodeInstanceData.some(d => d.instancedMesh === inter.object && d.instanceIndex === inter.instanceId)
        ));
    }

    onMouseMove(event) {
        const validIntersection = this.performRaycast(event);

        if (validIntersection) {
            const intersection = validIntersection;
            const instanceId = intersection.instanceId;
            const instancedMesh = intersection.object;

            const instanceData = this.nodeInstanceData.find(data => 
                data.instancedMesh === instancedMesh && data.instanceIndex === instanceId
            );

            if (instanceData) {
                const currentHoverKey = `${instancedMesh.uuid}-${instanceId}`;

                if (this.hoveredObject !== currentHoverKey) {
                    this.nodeInstanceData.forEach(d => {
                        if (d.currentScale && d.currentScale !== 1) {
                            this.resetInstanceScale(d.instancedMesh, d.instanceIndex);
                        }
                    });

                    this.hoveredObject = currentHoverKey;
                    this.scaleInstance(instancedMesh, instanceId, 1.5);

                    if (this.onLanguageHover) {
                        this.onLanguageHover(this.languageData[instanceData.languageIndex]);
                    }
                }
            }
        } else {
            this.nodeInstanceData.forEach(d => {
                if (d.currentScale && d.currentScale !== 1) {
                    this.resetInstanceScale(d.instancedMesh, d.instanceIndex);
                }
            });
            this.hoveredObject = null;
            if (this.onLanguageHide) {
                this.onLanguageHide();
            }
        }
    }

    onMouseClick(event) {
        const validIntersection = this.performRaycast(event);

        if (validIntersection) {
            const intersection = validIntersection;
            const instanceId = intersection.instanceId;
            const instancedMesh = intersection.object;

            // Find the corresponding language data
            const instanceData = this.nodeInstanceData.find(data => 
                data.instancedMesh === instancedMesh && data.instanceIndex === instanceId
            );

            if (instanceData && this.onLanguageClick) {
                const language = this.languageData[instanceData.languageIndex];
                this.onLanguageClick(language);
            }
        }
    }

    scaleInstance(instancedMesh, instanceId, scale) {
        const matrix = new THREE.Matrix4();
        instancedMesh.getMatrixAt(instanceId, matrix);
        
        const position = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        const currentScale = new THREE.Vector3();
        matrix.decompose(position, quaternion, currentScale);
        
        matrix.compose(position, quaternion, new THREE.Vector3(scale, scale, scale));
        instancedMesh.setMatrixAt(instanceId, matrix);
        instancedMesh.instanceMatrix.needsUpdate = true;
        
        const instanceData = this.nodeInstanceData.find(data => 
            data.instancedMesh === instancedMesh && data.instanceIndex === instanceId
        );
        if (instanceData) {
            instanceData.currentScale = scale;
        }
    }

    resetInstanceScale(instancedMesh, instanceId) {
        const matrix = new THREE.Matrix4();
        instancedMesh.getMatrixAt(instanceId, matrix);
        
        const position = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        const currentScale = new THREE.Vector3();
        matrix.decompose(position, quaternion, currentScale);
        
        matrix.compose(position, quaternion, new THREE.Vector3(1, 1, 1));
        instancedMesh.setMatrixAt(instanceId, matrix);
        instancedMesh.instanceMatrix.needsUpdate = true;
        
        const instanceData = this.nodeInstanceData.find(data => 
            data.instancedMesh === instancedMesh && data.instanceIndex === instanceId
        );
        if (instanceData) {
            instanceData.currentScale = 1;
        }
    }

    performUnifiedSearch(query) {
        const queryLower = query.toLowerCase();

        const languageScores = this.languageData.map(lang => {
            let score = 0;
            const langNameLower = (lang.lang_name || '').toLowerCase();
            const englishNameLower = (lang.name || '').toLowerCase();
            const familyNameLower = (lang.group1 || '').toLowerCase();

            if (langNameLower === queryLower || englishNameLower === queryLower) {
                score += 120;
            } else if (langNameLower.startsWith(queryLower) || englishNameLower.startsWith(queryLower)) {
                score += 70;
            } else if (langNameLower.includes(queryLower) || englishNameLower.includes(queryLower)) {
                score += 40;
            } else if (familyNameLower === queryLower) {
                score += 30;
            } else if (familyNameLower.startsWith(queryLower)) {
                score += 15;
            } else if (familyNameLower.includes(queryLower)) {
                score += 10;
            }


            if (lang.gt_million) score += 5;
            if (lang.extinct) score -= 3;
            return { lang, score };
        }).filter(entry => entry.score > 6)
          .sort((a, b) => b.score - a.score)
          .slice(0, 7);

        this.searchResults = languageScores.map(entry => entry.lang);

        let familyEntries;
        if (this.familyStats.size > 0) {
            familyEntries = Array.from(this.familyStats.entries());
        } else {
            const fallback = new Map();
            this.languageData.forEach(lang => {
                const family = lang.group1;
                if (!family || family === 'NA') return;
                const stats = fallback.get(family);
                stats.count += 1;
                if (lang.extinct) stats.extinctCount += 1;
                if (lang.gt_million) stats.hasMillionSpeakers = true;
            });
            familyEntries = Array.from(fallback.entries());
        }

        const familyScores = familyEntries.map(([family, stats]) => {
            const familyLower = family.toLowerCase();
            let score = 0;

            if (familyLower === queryLower) {
                score += 90;
            } else if (familyLower.startsWith(queryLower)) {
                score += 50;
            } else if (familyLower.includes(queryLower)) {
                score += 20;
            }

            const hasLanguageMatch = languageScores.some(entry => {
                const entryFamily = entry.lang.group1;
                return entryFamily && entryFamily.toLowerCase() === familyLower;
            });

            if (hasLanguageMatch) {
                score += 15;
            }

            return { family, stats, score };
        }).filter(entry => entry.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 8);

        return {
            languages: languageScores,
            families: familyScores
        };
    }

    highlightLanguage(language, shouldGrayOut = true) {
        this.clearSearchHighlights(false);
        this.highlightedLanguages = [language.id];
        
        if (shouldGrayOut) {
            this.nodeInstanceData.forEach(data => {
                const opacity = this.highlightedLanguages.includes(data.languageIndex) ? 1.0 : 0.1;
                this.setInstanceOpacity(data.instancedMesh, data.instanceIndex, opacity);
            });
        }

        const instanceData = this.nodeInstanceData.find(data => 
            data.languageIndex === language.id
        );
        
        if (instanceData) {
            this.scaleInstance(instanceData.instancedMesh, instanceData.instanceIndex, 2.0);
            instanceData.instancedMesh.userData.highlighted = true;
        }
        
        this.updateEdgeVisibilityForHighlights();
    }

    highlightFamily(familyName, shouldGrayOut = true) {
        this.clearSearchHighlights(false);
        
        const familyLanguages = this.languageData
            .filter(lang => lang.group1 === familyName)
            .map(lang => lang.id);
        
        this.highlightedLanguages = familyLanguages;
        
        if (shouldGrayOut) {
            this.nodeInstanceData.forEach(data => {
                const opacity = this.highlightedLanguages.includes(data.languageIndex) ? 1.0 : 0.1;
                this.setInstanceOpacity(data.instancedMesh, data.instanceIndex, opacity);
            });
        }

        familyLanguages.forEach(langId => {
            const instanceData = this.nodeInstanceData.find(data => 
                data.languageIndex === langId
            );
            
            if (instanceData) {
                this.scaleInstance(instanceData.instancedMesh, instanceData.instanceIndex, 1.5);
            }
        });
        
        this.updateEdgeVisibilityForHighlights();
    }

    focusOnLanguage(language) {
        const layout = this.layouts[this.currentLayout];
        const position = layout[language.id];
        
        if (position && this.controls) {
            // Animate camera to focus on the language
            const targetPosition = new THREE.Vector3(position.x, position.y, position.z);
            const offset = new THREE.Vector3(0, 20, 50);
            targetPosition.add(offset);
            
            if (this.animationsEnabled) {
                this.animateCameraTo(targetPosition, new THREE.Vector3(position.x, position.y, position.z));
            } else {
                this.camera.position.copy(targetPosition);
                this.controls.target.copy(new THREE.Vector3(position.x, position.y, position.z));
                this.controls.update();
            }
        }
    }

    focusOnFamily(familyName) {
        const familyLanguages = this.languageData.filter(lang => lang.group1 === familyName);
        if (familyLanguages.length === 0) return;
        
        const layout = this.layouts[this.currentLayout];
        
        // Calculate center of family
        let centerX = 0, centerY = 0, centerZ = 0;
        let count = 0;
        
        familyLanguages.forEach(lang => {
            const position = layout[lang.id];
            if (position) {
                centerX += position.x;
                centerY += position.y;
                centerZ += position.z;
                count++;
            }
        });
        
        if (count > 0) {
            centerX /= count;
            centerY /= count;
            centerZ /= count;
            
            const targetPosition = new THREE.Vector3(centerX, centerY + 50, centerZ + 100);
            const lookAt = new THREE.Vector3(centerX, centerY, centerZ);
            
            if (this.animationsEnabled) {
                this.animateCameraTo(targetPosition, lookAt);
            } else {
                this.camera.position.copy(targetPosition);
                this.controls.target.copy(lookAt);
                this.controls.update();
            }
        }
    }

    animateCameraTo(targetPosition, lookAtPosition) {
        const startPosition = this.camera.position.clone();
        const startLookAt = this.controls.target.clone();
        const duration = 1500;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
            
            this.camera.position.lerpVectors(startPosition, targetPosition, easeProgress);
            this.controls.target.lerpVectors(startLookAt, lookAtPosition, easeProgress);
            this.controls.update();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    clearSearchHighlights(resetSearchUI = true) {
        if (resetSearchUI) {
            this.setGlobalOpacity(1.0);
        }

        this.highlightedLanguages.forEach(langId => {
            const instanceData = this.nodeInstanceData.find(data =>
                data.languageIndex === langId
            );

            if (instanceData) {
                this.resetInstanceScale(instanceData.instancedMesh, instanceData.instanceIndex);
                instanceData.instancedMesh.userData.highlighted = false;
            }
        });

        this.highlightedLanguages = [];
        this.searchResults = [];

        this.updateEdgeVisibilityForHighlights();

        if (resetSearchUI) {
            const searchInput = document.getElementById('global-search-input');
            if (searchInput) {
                searchInput.value = '';
            }
            this.hideSearchResults();
            this.updateSearchClearState(false);
        }
    }

    hideSearchResults() {
        const dropdown = document.getElementById('global-search-results');
        const container = document.getElementById('global-search');
        if (dropdown) {
            dropdown.classList.add('hidden');
            dropdown.innerHTML = '';
        }
        if (container) {
            container.setAttribute('aria-expanded', 'false');
        }
    }

    updateSearchClearState(isActive) {
        const clearButton = document.getElementById('global-search-clear');
        if (clearButton) {
            clearButton.classList.toggle('hidden', !isActive);
        }
    }

    setData(nodeInstanceData, languageData, layouts, currentLayout, familyStats) {
        this.nodeInstanceData = nodeInstanceData;
        this.languageData = languageData;
        this.layouts = layouts;
        this.currentLayout = currentLayout;
        this.familyStats = familyStats;
    }

    setAnimationsEnabled(enabled) {
        this.animationsEnabled = enabled;
    }

    setShowEdges(show) {
        this.showEdges = show;
    }

    setInstanceOpacity(instancedMesh, instanceId, opacity) {
        const instanceData = this.nodeInstanceData.find(data => 
            data.instancedMesh === instancedMesh && data.instanceIndex === instanceId
        );
        if (!instanceData) return;
        
        const originalColor = new THREE.Color(instanceData.color);
        if (opacity < 1) {
            const newColor = originalColor.clone().lerp(new THREE.Color(0x000000), 0.85);
            instancedMesh.setColorAt(instanceId, newColor);
        } else {
            instancedMesh.setColorAt(instanceId, originalColor);
        }
        instancedMesh.instanceColor.needsUpdate = true;
    }

    setGlobalOpacity(opacity) {
        this.nodeInstanceData.forEach(data => {
            this.setInstanceOpacity(data.instancedMesh, data.instanceIndex, opacity);
        });
    }
}