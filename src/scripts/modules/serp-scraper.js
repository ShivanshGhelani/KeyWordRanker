/**
 * SERP Scraper Module - Core scraping functionality
 * Handles Google SERP DOM scraping and result extraction
 */

class SERPScraper {
    constructor() {
        // Enhanced SERP selectors with comprehensive coverage
        this.resultSelectors = {
            organicResults: [
                'div[data-header-feature] h3',
                '.g h3',
                '.MjjYud h3',
                '.tF2Cxc h3',
                '.yuRUbf h3'
            ],
            
            resultContainers: [
                '.g',
                '.MjjYud',
                '.tF2Cxc',
                'div[data-header-feature]',
                '.yuRUbf',
                '.commercial-unit-desktop-top'
            ],
            
            snippets: [
                '.VwiC3b',
                '.s',
                '.IsZvec',
                '.lEBKkf',
                '.hgKElc',
                '.kCrYT',
                '[data-content-feature="1"] .hgKElc'
            ],
            
            urls: [
                '.yuRUbf a',
                '.dmenKe a',
                '.g a h3',
                '.tF2Cxc a',
                '.MjjYud a h3'
            ]
        };
        
        this.resultTypes = {
            ORGANIC: 'organic',
            FEATURED_SNIPPET: 'featured_snippet',
            KNOWLEDGE_PANEL: 'knowledge_panel',
            SHOPPING: 'shopping',
            NEWS: 'news',
            IMAGE: 'image',
            VIDEO: 'video',
            AD: 'advertisement',
            LOCAL: 'local'
        };
        
        this.currentResults = [];
        this.scrapingCache = new Map();
    }

    /**
     * Main scraping method to extract all search results
     */
    scrapeGoogleResults(options = {}) {
        console.log('🔍 Starting SERP scraping...');
        
        try {
            const results = [];
            const resultContainers = this.findResultContainers();
            
            resultContainers.forEach((container, index) => {
                const resultData = this.extractResultData(container, index + 1);
                if (resultData) {
                    results.push(resultData);
                }
            });
            
            // Add position numbers to search results if enabled
            if (options.addPositionNumbers !== false) {
                this.addPositionNumbersToResults(resultContainers);
            }
            
            this.currentResults = results;
            console.log(`✅ Scraped ${results.length} search results`);
            
            return {
                success: true,
                results: results,
                totalFound: results.length,
                timestamp: Date.now()
            };
            
        } catch (error) {
            console.error('❌ Error scraping SERP:', error);
            return {
                success: false,
                error: error.message,
                results: []
            };
        }
    }

    /**
     * Add position numbers to search result containers
     */
    addPositionNumbersToResults(containers) {
        try {
            console.log('🔢 Adding position numbers to search results...');
            
            containers.forEach((container, index) => {
                const position = index + 1;
                
                // Skip if position number already exists
                if (container.querySelector('.krf-position-number')) {
                    return;
                }
                
                // Create position number element
                const positionElement = document.createElement('div');
                positionElement.className = 'krf-position-number';
                positionElement.textContent = position;
                positionElement.style.cssText = `
                    position: absolute;
                    left: -35px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: #1a73e8;
                    color: white;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    font-weight: bold;
                    font-family: arial, sans-serif;
                    z-index: 1000;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                `;
                
                // Make container relative if not already
                const containerStyle = window.getComputedStyle(container);
                if (containerStyle.position === 'static') {
                    container.style.position = 'relative';
                }
                
                // Add margin to container to make space for position number
                container.style.marginLeft = '40px';
                
                // Insert position number
                container.appendChild(positionElement);
                
                // Add hover effect
                positionElement.addEventListener('mouseenter', () => {
                    positionElement.style.backgroundColor = '#1557b0';
                    positionElement.style.transform = 'translateY(-50%) scale(1.1)';
                });
                
                positionElement.addEventListener('mouseleave', () => {
                    positionElement.style.backgroundColor = '#1a73e8';
                    positionElement.style.transform = 'translateY(-50%) scale(1)';
                });
            });
            
            console.log(`✅ Added position numbers to ${containers.length} results`);
            
        } catch (error) {
            console.warn('⚠️ Failed to add position numbers:', error);
        }
    }

    /**
     * Remove position numbers from search results
     */
    removePositionNumbers() {
        try {
            const positionNumbers = document.querySelectorAll('.krf-position-number');
            const containers = document.querySelectorAll('[style*="margin-left: 40px"]');
            
            positionNumbers.forEach(element => element.remove());
            containers.forEach(container => {
                container.style.marginLeft = '';
                if (container.style.position === 'relative' && 
                    !container.style.cssText.includes('position') ||
                    container.style.cssText.replace('position: relative;', '').trim() === '') {
                    container.style.position = '';
                }
            });
            
            console.log('🗑️ Removed position numbers from search results');
        } catch (error) {
            console.warn('⚠️ Failed to remove position numbers:', error);
        }
    }

    /**
     * Find all result containers on the page
     */
    findResultContainers() {
        let containers = [];
        
        for (const selector of this.resultSelectors.resultContainers) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                containers = Array.from(elements);
                console.log(`📦 Found ${containers.length} results using selector: ${selector}`);
                break;
            }
        }
        
        return containers;
    }

    /**
     * Extract data from a single result container
     */
    extractResultData(container, position) {
        try {
            const title = this.extractTitle(container);
            const url = this.extractURL(container);
            const snippet = this.extractSnippet(container);
            const resultType = this.determineResultType(container);
            
            if (!title && !url) {
                return null; // Skip if no meaningful data
            }
            
            return {
                position: position,
                title: title || '',
                url: url || '',
                snippet: snippet || '',
                type: resultType,
                element: container,
                timestamp: Date.now()
            };
            
        } catch (error) {
            console.warn(`⚠️ Error extracting data from result ${position}:`, error);
            return null;
        }
    }

    /**
     * Extract title from result container
     */
    extractTitle(container) {
        for (const selector of this.resultSelectors.organicResults) {
            const titleElement = container.querySelector(selector);
            if (titleElement) {
                return titleElement.textContent?.trim() || '';
            }
        }
        return '';
    }

    /**
     * Extract URL from result container
     */
    extractURL(container) {
        for (const selector of this.resultSelectors.urls) {
            const linkElement = container.querySelector(selector);
            if (linkElement) {
                return linkElement.href || '';
            }
        }
        return '';
    }

    /**
     * Extract snippet from result container
     */
    extractSnippet(container) {
        for (const selector of this.resultSelectors.snippets) {
            const snippetElement = container.querySelector(selector);
            if (snippetElement) {
                return snippetElement.textContent?.trim() || '';
            }
        }
        return '';
    }

    /**
     * Determine the type of search result
     */
    determineResultType(container) {
        // Check for ads
        if (container.querySelector('[data-text-ad]') || 
            container.closest('.ads-ad') ||
            container.querySelector('.commercial-unit-desktop-top')) {
            return this.resultTypes.AD;
        }
        
        // Check for featured snippets
        if (container.querySelector('[data-attrid]') || 
            container.closest('.kp-blk') ||
            container.querySelector('.xpdopen')) {
            return this.resultTypes.FEATURED_SNIPPET;
        }
        
        // Check for shopping results
        if (container.querySelector('.pla-unit') || 
            container.closest('.commercial-unit-desktop-rhs')) {
            return this.resultTypes.SHOPPING;
        }
        
        // Check for news results
        if (container.querySelector('.nChh6e') || 
            container.closest('.JJZKK')) {
            return this.resultTypes.NEWS;
        }
        
        // Check for image results
        if (container.querySelector('.eA0Zlc') || 
            container.closest('.islrc')) {
            return this.resultTypes.IMAGE;
        }
        
        // Default to organic
        return this.resultTypes.ORGANIC;
    }

    /**
     * Get cached results if available
     */
    getCachedResults() {
        return this.currentResults;
    }

    /**
     * Clear current results cache
     */
    clearCache() {
        this.currentResults = [];
        this.scrapingCache.clear();
    }
}

// Export for use in other modules
window.SERPScraper = SERPScraper;
