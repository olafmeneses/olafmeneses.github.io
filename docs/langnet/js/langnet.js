// LangNet

import { DataLoader } from './modules/DataLoader.js';
import { ThreeSetup } from './modules/ThreeSetup.js';
import { Visualization } from './modules/Visualization.js';
import { UI } from './modules/UI.js';
import { Events } from './modules/Events.js';
import { GameMode } from './modules/GameMode.js';
import { LanguageHunt } from './modules/LanguageHunt.js';
import { SearchManager } from './modules/SearchManager.js';

class LangNetApp {
    constructor() {
        if (typeof window.THREE === 'undefined') {
            throw new Error('THREE.js not loaded. Please ensure three.min_r140.js is loaded first.');
        }
        
        this.dataLoader = new DataLoader();
        this.threeSetup = new ThreeSetup();
        this.visualization = null;
        this.ui = new UI(this);
        this.events = null;
        
        this.gameMode = null;
        this.languageHunt = null;
        this.searchManager = null;
        

        this.currentLayout = 'tsne';
        this.currentMode = 'explore';
        this.showEdges = true;
        this.selectedFamilies = [];
        this.familyStats = new Map();
        
        this.loadingProgress = 0;
        this.loadingSteps = [
            'Initializing visualization...',
            'Loading language data...',
            'Processing network structure...',
            'Rendering 3D scene...',
            'Finalizing setup...'
        ];
        this.currentStep = 0;
        
        this.init();
    }

    async init() {
        try {
            this.updateLoadingProgress(0);
            
            // Step 1
            this.threeSetup.setupThreeJS();
            this.threeSetup.setupEventListeners();
            this.addLighting();
            
            this.visualization = new Visualization(this.threeSetup.scene);
            this.events = new Events(
                this.threeSetup.camera,
                this.threeSetup.renderer,
                this.threeSetup.raycaster,
                this.threeSetup.mouse,
                this.threeSetup.controls,
                this.visualization
            );
            
            this.gameMode = new GameMode(this);
            this.languageHunt = new LanguageHunt(this.gameMode);
            this.searchManager = new SearchManager(this);
            
            this.updateLoadingProgress(1);
            
            // Step 2
            await this.dataLoader.loadData();
            await this.dataLoader.loadLayouts();
            await this.dataLoader.loadColors();
            
            this.updateLoadingProgress(2);
            
            // Step 3
            this.visualization.setData(
                this.dataLoader.languageData,
                this.dataLoader.edges,
                this.dataLoader.layouts
            );
            
            this.visualization.getColorForLanguage = (lang) => this.getColorForLanguage(lang);
            
            this.updateLoadingProgress(3);
            
            // Step 4
            this.populateFilterOptions();
            this.visualization.createVisualization();
            
            // Step 5
            this.setupUI();
            this.setupEvents();
            this.setupWelcomeButton();

            this.visualization.setSmoothAnimations();
            
            this.updateLoadingProgress(4);
            
            // Animation loop
            this.threeSetup.animate();
            
            this.hideLoadingScreen();
            
        } catch (error) {
            console.error('Error initializing LangNet:', error);
            this.showError('Failed to load language data. Please refresh the page.');
        }
    }

    setupUI() {
        this.ui.onLayoutChange = (layout) => {
            this.currentLayout = layout;
            this.visualization.setCurrentLayout(layout);
            this.events.currentLayout = layout;
        };
        
        this.ui.onModeChange = (mode) => {
            this.setMode(mode);
        };
        
        this.ui.onEdgesToggle = (showEdges) => {
            this.showEdges = showEdges;
            this.events.setShowEdges(showEdges);
            this.events.updateEdgeVisibilityForHighlights();
        };
        
        this.ui.onVisibilityChange = (selectedFamilies) => {
            this.selectedFamilies = selectedFamilies;
            this.visualization.updateVisibility(selectedFamilies);
        };
        
        this.ui.onClearSearch = () => {
            this.events.clearSearchHighlights();
        };
        
        this.ui.onWindowResize = () => {
            this.threeSetup.onWindowResize();
        };
        
        this.ui.setupControls();
        
        // F key -> search, Escape key -> game mode exit
        document.addEventListener('keydown', (e) => {
            if (e.key === 'f' || e.key === 'F') {
                if (!this.threeSetup.isGameMode && !document.activeElement.matches('input, textarea, select')) {
                    e.preventDefault();
                    const searchInput = document.getElementById('global-search-input');
                    if (searchInput) {
                        searchInput.focus();
                    }
                }
            }
            if (e.key === 'Escape' && this.threeSetup.isGameMode) {
                this.exitGameMode();
            }
        });
    }

    setMode(mode) {
        this.currentMode = mode;
        if (mode === 'game') {
            this.enterGameMode();
        } else {
            this.exitGameMode();
        }
    }

    setupEvents() {
        this.events.onLanguageHover = (lang) => {
            this.ui.showLanguageInfo(lang);
        };
        
        this.events.onLanguageHide = () => {
            this.ui.hideLanguageInfo();
        };
        
        this.events.onLanguageClick = (lang) => {
            if (!this.gameMode.gameMode) {
                this.ui.showLanguageModal(lang, lang);
            }
        };
        
        this.events.setupMouseEvents(this.threeSetup.renderer.domElement);
        
        this.threeSetup.onZoomChange = () => {
            this.events.updateEdgeOpacityBasedOnZoom();
        };
        
        this.events.updateEdgeOpacityBasedOnZoom();
        
        this.events.setData(
            this.visualization.nodeInstanceData,
            this.dataLoader.languageData,
            this.dataLoader.layouts,
            this.currentLayout,
            this.familyStats
        );
        
        this.setupUnifiedSearch();
    }

    enterGameMode() {
        if (this.gameMode) {
            this.gameMode.enterGameMode();
        }
    }

    exitGameMode() {
        if (this.gameMode) {
            this.gameMode.exitGameMode();
        }
    }

    setupUnifiedSearch() {
        if (this.searchManager) {
            this.searchManager.setupUnifiedSearch();
        }
    }

    renderUnifiedSearchResults(results, query, onResultsRendered) {
        if (this.searchManager) {
            this.searchManager.renderUnifiedSearchResults(results, query, onResultsRendered);
        }
    }

    highlightMatch(text, query) {
        if (this.searchManager) {
            return this.searchManager.highlightMatch(text, query);
        }
        return text;
    }

    highlightSearchTarget(targetName) {
        if (this.searchManager) {
            this.searchManager.highlightSearchTarget(targetName);
        }
    }

    populateFilterOptions() {
        const families = [...new Set(this.dataLoader.languageData.map(lang => lang.group1))];
        families.sort();
        
        this.familyStats = new Map();
        const familyColors = new Map();

        families.forEach(family => {
            if (family && family !== 'NA') {
                const languages = this.dataLoader.languageData.filter(lang => lang.group1 === family);
                this.familyStats.set(family, languages.length);
                if (languages.length > 0) {
                    familyColors.set(family, this.getColorForLanguage(languages[0]));
                }
            }
        });
        
        this.ui.populateFilterOptions(familyColors);
        
        this.selectedFamilies = families.filter(f => f && f !== 'NA');
    }

    resolveGroupColor(group) {
        if (!group || group === 'NA') {
            return '#888888';
        }
        
        return this.dataLoader.colorPalette[group] || this.dataLoader.colorPalette[group.toLowerCase()];
    }

    getColorForLanguage(lang) {
        const group = lang.group1;
        
        const paletteColor = this.resolveGroupColor(group);
        
        if (paletteColor) {
            return paletteColor;
        }
        
        return '#888888';
    }
    
    addLighting() {
        const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
        this.threeSetup.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
        directionalLight.position.set(1, 1, 1).normalize();
        this.threeSetup.scene.add(directionalLight);
    }

    updateLoadingProgress(step, message = null) {
        this.currentStep = step;
        this.loadingProgress = (step / this.loadingSteps.length) * 100;

        const loadingText = document.querySelector('.loading-subtitle');

        if (loadingText) {
            loadingText.textContent = message || this.loadingSteps[step] || 'Loading...';
        }
    }

    hideLoadingScreen() {
        const loadingElement = document.getElementById('loading');
        if (!loadingElement) return;
        
        loadingElement.style.opacity = '0';
        loadingElement.style.transition = 'opacity 0.8s ease-out';
        setTimeout(() => {
            loadingElement.classList.add('hidden');
            document.getElementById('global-search')?.classList.remove('hidden');
        }, 800);
    }

    showWelcomeModal() {
        const welcomeModal = document.getElementById('welcome-modal');
        if (!welcomeModal) return;
        
        welcomeModal.classList.remove('hidden');
        
        const closeModal = () => welcomeModal.classList.add('hidden');
        welcomeModal.querySelector('#welcome-confirm-btn')?.addEventListener('click', closeModal);
        welcomeModal.querySelector('.welcome-modal-overlay')?.addEventListener('click', closeModal);
    }

    setupWelcomeButton() {
        document.querySelector('.info-panel-collapsible .welcome-start-btn')
            ?.addEventListener('click', () => this.showWelcomeModal());
    }

    showError(message) {
        const loadingText = document.querySelector('.loading-subtitle');
        if (loadingText) {
            loadingText.textContent = message;
            loadingText.style.color = '#ff6b6b';
        }
    }
}

window.addEventListener('load', () => {
    window.langNetApp = new LangNetApp();
});

export { LangNetApp };
