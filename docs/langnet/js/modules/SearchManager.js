// SearchManager

export class SearchManager {
    constructor(mainApp) {
        this.app = mainApp;
    }

    setupUnifiedSearch() {
        const searchInput = document.getElementById('global-search-input');
        const clearButton = document.getElementById('global-search-clear');
        const dropdown = document.getElementById('global-search-results');
        const container = document.getElementById('global-search');

        if (!searchInput || !clearButton || !dropdown || !container) {
            return;
        }
        let activeIndex = -1;
        let lastResults = { languages: [], families: [] };
        let debounceTimer = null;

        const collectAllResultRows = () => Array.from(dropdown.querySelectorAll('.search-result-item'));

        const updateActiveResult = () => {
            const rows = collectAllResultRows();
            rows.forEach((row, i) => row.classList.toggle('is-active', i === activeIndex));
            if (activeIndex >= 0 && rows[activeIndex]) {
                rows[activeIndex].scrollIntoView({ block: 'nearest' });
            }
        };

        const executeSelection = (row) => {
            if (!row) return;
            row.click();
        };

        const runSearch = () => {
            const query = searchInput.value.trim();
            this.app.events.updateSearchClearState(query.length > 0);

            if (query.length === 0) {
                this.app.events.hideSearchResults();
                container.setAttribute('aria-expanded', 'false');
                activeIndex = -1;
                return;
            }

            lastResults = this.app.events.performUnifiedSearch(query);
            this.renderUnifiedSearchResults(lastResults, query, (resultCount) => {
                activeIndex = resultCount > 0 ? 0 : -1;
                if (resultCount > 0) {
                    updateActiveResult();
                }
            });
        };

        const handleQuery = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(runSearch, 120);
        };

        searchInput.addEventListener('input', handleQuery);
        searchInput.addEventListener('focus', () => {
            const query = searchInput.value.trim();
            if (query.length > 0) {
                lastResults = this.app.events.performUnifiedSearch(query);
                this.renderUnifiedSearchResults(lastResults, query, (resultCount) => {
                    activeIndex = resultCount > 0 ? 0 : -1;
                    if (resultCount > 0) {
                        updateActiveResult();
                    }
                });
            }
        });

        searchInput.addEventListener('keydown', (event) => {
            const rows = collectAllResultRows();
            switch (event.key) {
                case 'Escape':
                    this.app.events.clearSearchHighlights();
                    this.app.events.hideSearchResults();
                    searchInput.blur();
                    activeIndex = -1;
                    break;
                case 'ArrowDown':
                    if (rows.length) {
                        event.preventDefault();
                        if (activeIndex === -1) {
                            activeIndex = 0;
                        } else {
                            activeIndex = (activeIndex + 1) % rows.length;
                        }
                        updateActiveResult();
                    }
                    break;
                case 'ArrowUp':
                    if (rows.length) {
                        event.preventDefault();
                        if (activeIndex === -1) {
                            activeIndex = rows.length - 1;
                        } else {
                            activeIndex = (activeIndex - 1 + rows.length) % rows.length;
                        }
                        updateActiveResult();
                    }
                    break;
                case 'Enter':
                    if (activeIndex >= 0 && rows[activeIndex]) {
                        event.preventDefault();
                        executeSelection(rows[activeIndex]);
                    } else if (rows.length) {
                        executeSelection(rows[0]);
                    }
                    break;
            }
        });

        clearButton.addEventListener('click', () => {
            searchInput.value = '';
            this.app.events.clearSearchHighlights();
            this.app.events.hideSearchResults();
            this.app.events.updateSearchClearState(false);
            container.setAttribute('aria-expanded', 'false');
            searchInput.focus();
        });

        document.addEventListener('click', (event) => {
            if (!container.contains(event.target)) {
                this.app.events.hideSearchResults();
            }
        });

        this.app.events.updateSearchClearState(false);
        container.setAttribute('aria-expanded', 'false');
    }

    renderUnifiedSearchResults(results, query, onResultsRendered = null) {
        const dropdown = document.getElementById('global-search-results');
        const searchInput = document.getElementById('global-search-input');
        const container = document.getElementById('global-search');
        if (!dropdown || !searchInput || !container) {
            return;
        }

        const filteredResults = this.app.ui.filterSearchResults(results, query);

        dropdown.innerHTML = '';
        dropdown.scrollTop = 0;

        const allResults = [];
        
        if (filteredResults.languages && filteredResults.languages.length) {
            filteredResults.languages.forEach((entry) => {
                allResults.push({ ...entry, type: 'language' });
            });
        }

        if (filteredResults.families && filteredResults.families.length) {
            filteredResults.families.forEach((entry) => {
                allResults.push({ ...entry, type: 'family' });
            });
        }

        allResults.sort((a, b) => b.score - a.score);

        if (!allResults.length) {
            dropdown.innerHTML = `
                <div class="search-empty-state">
                    <p>No matches for "${query}"</p>
                </div>
            `;
            dropdown.classList.remove('hidden');
            container.setAttribute('aria-expanded', 'true');
            return;
        }

        allResults.forEach((entry, index) => {
            const row = document.createElement('div');
            row.className = 'search-result-item';
            row.dataset.type = entry.type;
            row.setAttribute('role', 'option');
            row.setAttribute('tabindex', '-1');

            const icon = document.createElement('div');
            icon.className = `result-icon ${entry.type}`;
            icon.textContent = entry.type === 'language' ? 'L' : 'F';

            const content = document.createElement('div');
            content.className = 'result-content';

            const name = document.createElement('div');
            name.className = 'result-name';

            const meta = document.createElement('div');
            meta.className = 'result-meta';

            if (entry.type === 'language') {
                const lang = entry.lang;
                const displayName = lang.lang_name || lang.name || 'Unknown language';
                
                name.innerHTML = this.highlightMatch(displayName, query);

                const metaParts = [];
                if (lang.group1 && lang.group1 !== 'NA') {
                    metaParts.push(lang.group1);
                }
                if (lang.group2 && lang.group2 !== 'NA') {
                    metaParts.push(lang.group2);
                }

                meta.textContent = metaParts.join(' → ');

                row.addEventListener('click', () => {
                    this.app.events.highlightLanguage(lang);
                    this.app.events.focusOnLanguage(lang);
                    this.app.ui.showLanguageInfo(lang);
                    searchInput.value = displayName;
                    this.app.events.updateSearchClearState(true);
                    this.app.events.hideSearchResults();
                    
                    this.highlightSearchTarget(lang.name);
                });
            } else {
                const family = entry.family;
                const stats = entry.stats;
                
                name.innerHTML = this.highlightMatch(family, query);

                const details = [];
                details.push(`${stats} language${stats.count === 1 ? '' : 's'}`);

                meta.textContent = details.join(', ');

                row.addEventListener('click', () => {
                    this.app.events.highlightFamily(family);
                    this.app.events.focusOnFamily(family);
                    searchInput.value = family;
                    this.app.events.updateSearchClearState(true);
                    this.app.events.hideSearchResults();
                    
                    this.highlightSearchTarget(family);
                });
            }

            content.appendChild(name);
            content.appendChild(meta);
            
            row.appendChild(icon);
            row.appendChild(content);
            dropdown.appendChild(row);
        });

        dropdown.classList.remove('hidden');
        container.setAttribute('aria-expanded', 'true');

        if (onResultsRendered) {
            onResultsRendered(allResults.length);
        }
    }

    highlightMatch(text, query) {
        if (!query.trim()) return text;
        
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(regex, '<span class="result-highlight">$1</span>');
    }

    highlightSearchTarget(targetName) {
        if (this.app.events && typeof this.app.events.addSearchHighlight === 'function') {
            this.app.events.addSearchHighlight(targetName);
            
            setTimeout(() => {
                if (this.app.events && typeof this.app.events.removeSearchHighlight === 'function') {
                    this.app.events.removeSearchHighlight(targetName);
                }
            }, 3000);
        }
    }
}
