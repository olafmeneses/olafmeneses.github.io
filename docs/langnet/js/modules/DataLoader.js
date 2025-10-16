// DataLoader

import { CONFIG } from './Config.js';

export class DataLoader {
    constructor() {
        this.languageData = [];
        this.edges = [];
        this.layouts = {
            tsne: {},
            mds: {}
        };
        this.colorPalette = {};
    }

    async loadData() {
        try {
            const response = await fetch(CONFIG.DATA_PATHS.GRAPH);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            let xmlText = await response.text();
            
            xmlText = xmlText.trim();
            if (xmlText.charCodeAt(0) === 0xFEFF) {
                xmlText = xmlText.substring(1);
            }
            
            return this.parseXMLAsText(xmlText);
            
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }

    parseXMLAsText(xmlText) {
        this.languageData = [];
        this.edges = [];
        
        const nodeRegex = /<node id="(n\d+)">([\s\S]*?)<\/node>/g;
        let nodeMatch;
        let nodeIndex = 0;
        
        while ((nodeMatch = nodeRegex.exec(xmlText)) !== null) {
            const nodeId = nodeMatch[1];
            const nodeContent = nodeMatch[2];
            
            const getData = (key) => {
                const dataRegex = new RegExp(`<data key="${key}">(.*?)<\/data>`, 'i');
                const match = nodeContent.match(dataRegex);
                return match ? match[1] : '';
            };
            
            const lang = {
                id: nodeIndex,
                nodeId: nodeId,
                name: getData('v_name'),
                lang_name: getData('v_lang_name'),
                extinct: getData('v_extinct') === 'true',
                gt_million: getData('v_gt_million') === 'true',
                group1: getData('v_group1'),
                group2: getData('v_group2'),
                group3: getData('v_group3'),
                group4: getData('v_group4'),
                group5: getData('v_group5'),
                group6: getData('v_group6'),
                group7: getData('v_group7'),
                nbor_id: parseInt(getData('v_nbor_id')),
                lang_name_nbor: getData('v_lang_name_nbor'),
                group1_nbor: getData('v_group1_nbor'),
                group2_nbor: getData('v_group2_nbor'),
                numbers: {
                    N1: getData('v_N1'),
                    N2: getData('v_N2'),
                    N3: getData('v_N3'),
                    N4: getData('v_N4'),
                    N5: getData('v_N5'),
                    N6: getData('v_N6'),
                    N7: getData('v_N7'),
                    N8: getData('v_N8'),
                    N9: getData('v_N9'),
                    N10: getData('v_N10')
                },
                numbers_nbor: {
                    N1: getData('v_N1_nbor'),
                    N2: getData('v_N2_nbor'),
                    N3: getData('v_N3_nbor'),
                    N4: getData('v_N4_nbor'),
                    N5: getData('v_N5_nbor'),
                    N6: getData('v_N6_nbor'),
                    N7: getData('v_N7_nbor'),
                    N8: getData('v_N8_nbor'),
                    N9: getData('v_N9_nbor'),
                    N10: getData('v_N10_nbor')
                }
            };
            
            this.languageData.push(lang);
            nodeIndex++;
        }
        
        const edgeRegex = /<edge source="(n\d+)" target="(n\d+)">/g;
        let edgeMatch;
        
        while ((edgeMatch = edgeRegex.exec(xmlText)) !== null) {
            this.edges.push({
                source: parseInt(edgeMatch[1].replace('n', '')),
                target: parseInt(edgeMatch[2].replace('n', ''))
            });
        }
    }

    async loadLayouts() {
        try {
            await Promise.all([
                this.loadTSNELayout(),
                this.loadMDSLayout()
            ]);
        } catch (error) {
            console.error('Error loading layouts:', error);
        }
    }

    async loadLayoutFromCSV(url, layoutName, scale) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to load ${layoutName} data: ${response.status}`);
        
        const text = await response.text();
        const lines = text.split('\n').slice(1);
        
        const layout = {};
        lines.forEach(line => {
            if (line.trim()) {
                const parts = line.split(',');
                const id = parseInt(parts[0].replace(/"/g, '')) - 1;
                layout[id] = {
                    x: parseFloat(parts[1].replace(/"/g, '')) * scale,
                    y: parseFloat(parts[2].replace(/"/g, '')) * scale,
                    z: parseFloat(parts[3].replace(/"/g, '')) * scale
                };
            }
        });
        return layout;
    }

    async loadTSNELayout() {
        this.layouts.tsne = await this.loadLayoutFromCSV(CONFIG.DATA_PATHS.TSNE, 't-SNE', 5);
    }

    async loadMDSLayout() {
        this.layouts.mds = await this.loadLayoutFromCSV(CONFIG.DATA_PATHS.MDS, 'MDS', 50);
    }

    async loadColors() {
        
        try {
            const response = await fetch(CONFIG.DATA_PATHS.COLORS);
            if (!response.ok) throw new Error(`Failed to load color data: ${response.status}`);
            
            const text = await response.text();
            const lines = text.split('\n');
            
            lines.forEach(line => {
                if (line.trim()) {
                    const parts = line.split(',');
                    if (parts.length === 2) {
                        const family = parts[0].replace(/"/g, '').trim();
                        const color = parts[1].replace(/"/g, '').trim();
                        if (family && color) {
                            this.colorPalette[family] = color;
                            this.colorPalette[family.toLowerCase()] = color;
                        }
                    }
                }
            });
            
        } catch (error) {
            console.error('Error loading color mappings:', error);
        }
    }

    // Utils
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);
        
        return result.map(item => item.replace(/"/g, ''));
    }
}