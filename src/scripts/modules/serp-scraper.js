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
        } catch (error) {
            console.warn('⚠️ Failed to remove position numbers:', error);
        }
    }

    /**
     * Find all result containers on the page (organic results only)
     */
    findResultContainers() {
        let containers = [];
        
        for (const selector of this.resultSelectors.resultContainers) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                containers = Array.from(elements);
                break;
            }
        }
        
        // Filter out non-organic results (ads, PAA, etc.) - More lenient filtering
        const organicContainers = containers.filter((container, index) => {
            // Exclude obvious ads first
            if (container.querySelector('.ads-visurl, .commercial-unit-desktop-top, .pla-unit') ||
                container.classList.contains('ads-visurl') ||
                container.classList.contains('commercial-unit-desktop-top')) {
                return false;
            }
            
            // Exclude "People also ask" sections
            if (container.closest('[data-initq], .related-question-pair') ||
                container.querySelector('[data-initq], .related-question-pair')) {
                return false;
            }
            
            // Look for title elements with more lenient selectors
            const titleSelectors = [
                'h3 a',
                'h3',
                '.LC20lb',
                '[role="heading"] a',
                '.DKV0Md',
                '.yuRUbf h3 a',
                '.tF2Cxc h3 a',
                '.g h3 a',
                'a h3',  // More lenient
                '[data-hveid] h3',  // More lenient
                '.MjjYud h3'  // More lenient
            ];
            
            let hasTitle = false;
            let titleText = '';
            let linkHref = '';
            
            for (const selector of titleSelectors) {
                const titleElement = container.querySelector(selector);
                if (titleElement) {
                    hasTitle = true;
                    titleText = titleElement.textContent?.trim() || '';
                    
                    // Try to get the link
                    const linkElement = titleElement.tagName === 'A' ? titleElement : titleElement.closest('a') || titleElement.querySelector('a');
                    if (linkElement && linkElement.href) {
                        linkHref = linkElement.href;
                    }
                    break;
                }
            }
            
            if (!hasTitle || !titleText) {
                return false;
            }
            
            // Only exclude if it's clearly an ad link
            if (linkHref && (linkHref.includes('googleadservices') || 
                linkHref.includes('/aclk?') || 
                linkHref.includes('google.com/shopping'))) {
                return false;
            }
            
            return true;
        });
        
        return organicContainers;
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
     * Extract title from result container - Enhanced with more selectors
     */
    extractTitle(container) {
        // Enhanced title selectors for better extraction
        const titleSelectors = [
            'h3 a',
            'h3',
            '.LC20lb',
            '[role="heading"] a',
            '.DKV0Md',
            '.yuRUbf h3 a',
            '.tF2Cxc h3 a',
            '.g h3 a',
            'a h3',
            '[data-hveid] h3',
            '.MjjYud h3',
            '.MjjYud h3 a',
            '.tF2Cxc .DKV0Md',
            '.yuRUbf .DKV0Md'
        ];
        
        for (const selector of titleSelectors) {
            const titleElement = container.querySelector(selector);
            if (titleElement) {
                const title = titleElement.textContent?.trim() || '';
                if (title) {
                    return title;
                }
            }
        }
        
        return '';
    }

    /**
     * Extract URL from result container - Enhanced with more selectors
     */
    extractURL(container) {
        // Enhanced URL selectors for better extraction
        const urlSelectors = [
            'h3 a',
            'a[data-ved]',
            '.yuRUbf a',
            '.tF2Cxc a',
            '.g a h3',
            '.LC20lb',
            '[role="heading"] a',
            'a h3',
            '[data-hveid] a',
            '.MjjYud a',
            '.MjjYud h3 a',
            '.tF2Cxc .yuRUbf a'
        ];
        
        for (const selector of urlSelectors) {
            const linkElement = container.querySelector(selector);
            if (linkElement && linkElement.href) {
                // Clean the URL (remove Google redirect)
                let url = linkElement.href;
                
                // Extract actual URL from Google redirect
                if (url.includes('/url?')) {
                    const urlParams = new URLSearchParams(url.split('?')[1]);
                    const actualUrl = urlParams.get('url') || urlParams.get('q');
                    if (actualUrl) {
                        url = actualUrl;
                    }
                }
                
                if (url && !url.includes('googleadservices') && !url.includes('/aclk?')) {
                    return url;
                }
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
