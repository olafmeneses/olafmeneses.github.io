// UI

export class UI {
    constructor(mainApp = null) {
        this.mainApp = mainApp;
        this.selectedFamilies = new Set();
        this.currentLayout = 'tsne';
        this.currentMode = 'explore';
        this.showEdges = true;
        this.animationsEnabled = true;
        this.currentSearchFilter = 'all';
        this.activeSearchResultIndex = -1;

        this.onLayoutChange = null;
        this.onEdgesToggle = null;
        this.onVisibilityChange = null;
        this.onClearSearch = null;
        this.onWindowResize = null;
        this.onModeChange = null;
        
        this.domCache = {};
        this.familyColors = new Map();
    }
    
    getElement(id) {
        if (!this.domCache[id]) {
            this.domCache[id] = document.getElementById(id);
        }
        return this.domCache[id];
    }
    
    buildFamilyTreeHTML(languageData, color, maxParts = null) {
        const groups = [
            languageData.group1, languageData.group2, languageData.group3,
            languageData.group4, languageData.group5, languageData.group6, languageData.group7
        ];
        
        const parts = [];
        for (const group of groups) {
            if (!group || group === 'NA') break;
            parts.push(group);
        }
        
        const limitedParts = maxParts ? parts.slice(0, maxParts) : parts;
        if (limitedParts.length === 0) return '';
        
        let html = `<div class="family-tree-modal" style="color: ${color};">`;
        limitedParts.forEach((part, index) => {
            const opacity = 1.0 - (index * 0.05);
            html += `<span class="family-part" style="opacity: ${opacity}">${part}</span>`;
            if (index < limitedParts.length - 1) {
                html += ` <span class="family-arrow" style="opacity: ${opacity * 0.6}">→</span> `;
            }
        });
        html += '</div>';
        return html;
    }
    
    getFamilyColor(family) {
        return this.familyColors?.get(family) || '#6366f1';
    }

    setupControls() {
        this.setupLayoutControls();
        this.setupModeControls();
        this.setupInfoCollapsible();

        window.addEventListener('resize', () => {
            if (this.onWindowResize) this.onWindowResize();
        });
    }

    setupLayoutControls() {
        const layoutButtons = document.querySelectorAll('.floating-btn[data-layout]');
        layoutButtons.forEach(button => {
            button.addEventListener('click', () => {
                const layout = button.dataset.layout;
                
                layoutButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                this.currentLayout = layout;
                if (this.onLayoutChange) this.onLayoutChange(this.currentLayout);
            });
        });
    }

    setupModeControls() {
        const modeButtons = document.querySelectorAll('.floating-btn[data-mode]');
        modeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const mode = button.dataset.mode;
                
                modeButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                this.currentMode = mode;
                if (this.onModeChange) {
                    this.onModeChange(this.currentMode);
                }
            });
        });
    }

    setupInfoCollapsible() {
        const infoBtn = document.getElementById('info-btn');
        const infoPanel = document.getElementById('info-panel-collapsible');

        if (infoBtn && infoPanel) {
            infoBtn.addEventListener('click', () => {
                const isExpanded = infoBtn.getAttribute('aria-expanded') === 'true';
                
                if (isExpanded) {
                    infoPanel.classList.add('hidden');
                    infoBtn.classList.remove('active');
                    infoBtn.setAttribute('aria-expanded', 'false');
                } else {
                    infoPanel.classList.remove('hidden');
                    infoBtn.classList.add('active');
                    infoBtn.setAttribute('aria-expanded', 'true');
                }
            });

            // esc key -> close
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && !infoPanel.classList.contains('hidden')) {
                    infoPanel.classList.add('hidden');
                    infoBtn.classList.remove('active');
                    infoBtn.setAttribute('aria-expanded', 'false');
                }
            });
        }
    }

    populateFilterOptions(familyColors) {
        this.familyColors = familyColors;
        
        this.selectedFamilies = new Set(familyColors.keys());
        
        this.applyFamilyVisibility();
    }

    applyFamilyVisibility() {
        const selectedArray = this.selectedFamilies.size > 0 ? Array.from(this.selectedFamilies) : null;
        if (this.onVisibilityChange) {
            this.onVisibilityChange(selectedArray);
        }
    }
    filterSearchResults(results) {
        switch (this.currentSearchFilter) {
            case 'languages':
                return { languages: results.languages, families: [] };
            case 'families':
                return { languages: [], families: results.families };
            default:
                return results;
        }
    }

    manageModalPointerLock(modalId, isOpening) {
        const canvas = document.querySelector('canvas');
        const isGameMode = document.getElementById('game-hud') !== null;
        const modal = document.getElementById(modalId);

        if (!canvas || !isGameMode || !modal) return;

        if (isOpening) {
            if (document.pointerLockElement === canvas) {
                document.exitPointerLock();
            }
        } else {
            setTimeout(() => {
                const modalElement = document.getElementById(modalId);
                if (modalElement && modalElement.classList.contains('hidden')) {
                    if (canvas && document.getElementById('game-hud') && document.pointerLockElement !== canvas) {
                        canvas.requestPointerLock();
                    }
                }
            }, 150);
        }
    }

    showLanguageInfo(languageData) {
        const infoPanel = this.getElement('language-info');
        const title = this.getElement('hover-title');
        const details = this.getElement('language-details');
        
        if (!infoPanel || !title || !details) return;

        title.textContent = languageData.name || languageData.lang_name || 'Unknown';
        
        const color = this.getFamilyColor(languageData.group1);
        const familyTreeHTML = this.buildFamilyTreeHTML(languageData, color, 3)
            .replace('family-tree-modal', 'family-tree-colored');
        
        details.innerHTML = familyTreeHTML;
        infoPanel.classList.remove('hidden');
    }

    hideLanguageInfo() {
        this.getElement('language-info')?.classList.add('hidden');
    }

    showLanguageModal(languageData) {
        const modal = this.getElement('language-modal');
        const modalBody = this.getElement('language-modal-body');
        
        if (!modal || !modalBody) return;

        const colorStyle = this.getFamilyColor(languageData.group1);
        const familyTree = this.buildFamilyTreeHTML(languageData, colorStyle);

        const numbersArray = Array.from({length: 10}, (_, i) => 
            languageData.numbers?.[`N${i+1}`] || 'N/A'
        );

        const neighborName = languageData.lang_name_nbor || 'No neighbor data';
        const hasNeighbor = neighborName !== 'No neighbor data' && neighborName;
        
        let neighborFamilyTree = '';
        let neighborNumbersArray = [];
        let neighborColor = colorStyle;
        
        if (hasNeighbor) {
            const neighborData = {
                group1: languageData.group1_nbor,
                group2: languageData.group2_nbor,
                group3: languageData.group3_nbor,
                group4: languageData.group4_nbor,
                group5: languageData.group5_nbor,
                group6: languageData.group6_nbor,
                group7: languageData.group7_nbor
            };
            
            neighborColor = this.getFamilyColor(languageData.group1_nbor);
            neighborFamilyTree = this.buildFamilyTreeHTML(neighborData, neighborColor);
            
            neighborNumbersArray = Array.from({length: 10}, (_, i) =>
                languageData.numbers_nbor?.[`N${i+1}`] || 'N/A'
            );
        }

        let modalHTML = `
            <div class="modal-header-modern">
                <h2 class="modal-language-title">${languageData.name || languageData.lang_name || 'Unknown'}</h2>
                ${familyTree}
                <div class="modal-hint" style="font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 8px; text-align: center;">
                    Press SPACE or ESC to close • Click outside to close
                </div>
            </div>
        `;

        if (hasNeighbor) {
            modalHTML += `
                <div class="modal-comparison-container">
                    <div class="comparison-section-title">Nearest Neighbor</div>
                    <div class="comparison-header">
                        <div class="comparison-col">
                            <h3 class="comparison-lang-name" style="color: ${colorStyle};">${languageData.name || languageData.lang_name}</h3>
                        </div>
                        <div class="comparison-col">
                            <h3 class="comparison-lang-name" style="color: ${neighborColor};">${neighborName}</h3>
                            ${neighborFamilyTree}
                        </div>
                    </div>
                    <div class="comparison-numbers">
            `;
            
            for (let i = 0; i < 10; i++) {
                modalHTML += `
                    <div class="comparison-row">
                        <div class="comparison-num-label">${i + 1}</div>
                        <div class="comparison-value" style="border-left: 3px solid ${colorStyle};">${numbersArray[i]}</div>
                        <div class="comparison-value" style="border-left: 3px solid ${neighborColor};">${neighborNumbersArray[i] || 'N/A'}</div>
                    </div>
                `;
            }
            
            modalHTML += `
                    </div>
                </div>
            `;
        } else {
            modalHTML += `
                <div class="modal-section">
                    <h3 class="modal-section-title">Numbers 1-10</h3>
                    <div class="modal-numbers-list">
                        ${numbersArray.map((num, idx) => `
                            <div class="modal-number-row">
                                <span class="modal-number-label">${idx + 1}</span>
                                <span class="modal-number-value">${num}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        modalBody.innerHTML = modalHTML;
        modal.classList.remove('hidden');

        modalBody.scrollTop = 0;

        if (this.mainApp && this.mainApp.discoveryNotificationTimeout) {
            clearTimeout(this.mainApp.discoveryNotificationTimeout);
            this.mainApp.discoveryNotificationTimeout = null;
            const notification = document.getElementById('discovery-notification');
            if (notification) {
                notification.classList.add('hidden');
            }
        }

        const closeBtn = modal.querySelector('.language-modal-close');
        const overlay = modal.querySelector('.language-modal-overlay');
        
        const closeModal = () => {
            modal.classList.add('hidden');
            this.manageModalPointerLock('language-modal', false);
        };

        if (closeBtn) {
            closeBtn.onclick = () => {
                closeModal();
                this.manageModalPointerLock('language-modal', false);
            };
        }

        if (overlay) {
            overlay.onclick = () => {
                closeModal();
                this.manageModalPointerLock('language-modal', false);
            };
        }

        const keyHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                this.manageModalPointerLock('language-modal', false);
                document.removeEventListener('keydown', keyHandler);
            } else if (e.key === ' ' || e.key === 'Space') {
                closeModal();
                this.manageModalPointerLock('language-modal', false);
                document.removeEventListener('keydown', keyHandler);
            }
        };
        document.addEventListener('keydown', keyHandler);

        this.manageModalPointerLock('language-modal', true);
    }

    hideUIForGameMode() {
        const globalSearch = document.getElementById('global-search');
        const floatingControlsWrapper = document.getElementById('floating-controls-wrapper');
        const languageInfo = document.getElementById('language-info');
        const infoPanel = document.getElementById('info-panel-collapsible');
        const infoBtn = document.getElementById('info-btn');

        if (globalSearch) {
            globalSearch.style.display = 'none';
        }

        if (floatingControlsWrapper) {
            floatingControlsWrapper.classList.add('hidden');
        }

        if (languageInfo) {
            languageInfo.style.display = 'none';
        }

        if (infoPanel) infoPanel.classList.add('hidden');
        if (infoBtn) {
            infoBtn.classList.remove('active');
            infoBtn.setAttribute('aria-expanded', 'false');
        }
        
        this.setModeUI('game');
    }

    showUIForExploreMode() {
        const globalSearch = document.getElementById('global-search');
        const floatingControlsWrapper = document.getElementById('floating-controls-wrapper');
        const languageInfo = document.getElementById('language-info');
        
        if (globalSearch) {
            globalSearch.style.display = '';
        }
        
        if (floatingControlsWrapper) {
            floatingControlsWrapper.classList.remove('hidden');
        }
        
        if (languageInfo) {
            languageInfo.style.display = '';
        }
        
        this.setModeUI('explore');
    }
    
    setModeUI(mode) {
        const modeButtons = document.querySelectorAll('.floating-btn[data-mode]');
        modeButtons.forEach(btn => {
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
}