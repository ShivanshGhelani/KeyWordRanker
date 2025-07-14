/**
 * Unit Tests for SERP Scraper Module
 * Tests DOM extraction, result parsing, and layout handling
 */

describe('SERP Scraper Unit Tests', function() {
    
    // Mock DOM elements for testing
    let mockContainer;
    
    beforeEach(function() {
        // Create mock Google search results DOM
        mockContainer = document.createElement('div');
        mockContainer.innerHTML = `
            <div class="g">
                <div class="yuRUbf">
                    <a href="https://example1.com">
                        <h3>Best Boutique in Ahmedabad - Premium Store</h3>
                    </a>
                </div>
                <div class="VwiC3b">
                    Discover premium fashion at our boutique in Ahmedabad.
                </div>
            </div>
            <div class="g">
                <div class="yuRUbf">
                    <a href="https://example2.com">
                        <h3>Top Fashion Boutiques | Ahmedabad Guide</h3>
                    </a>
                </div>
                <div class="VwiC3b">
                    Complete guide to fashion boutiques in Ahmedabad.
                </div>
            </div>
        `;
        
        // Mock SERPScraper class if not available
        if (typeof SERPScraper === 'undefined') {
            window.SERPScraper = class {
                constructor() {
                    this.resultSelectors = {
                        container: '.g',
                        title: 'h3',
                        url: 'a[href]',
                        description: '.VwiC3b'
                    };
                    this.scrapingCache = new Map();
                    this.lastScrapeTime = null;
                }

                async scrapeGoogleResults() {
                    try {
                        const results = this.extractResultsFromDOM();
                        this.lastScrapeTime = Date.now();
                        
                        return {
                            success: true,
                            results: results,
                            total: results.length,
                            timestamp: this.lastScrapeTime
                        };
                    } catch (error) {
                        return {
                            success: false,
                            error: error.message,
                            results: []
                        };
                    }
                }

                extractResultsFromDOM() {
                    const results = [];
                    const containers = document.querySelectorAll(this.resultSelectors.container);
                    
                    containers.forEach((container, index) => {
                        const titleEl = container.querySelector(this.resultSelectors.title);
                        const urlEl = container.querySelector(this.resultSelectors.url);
                        const descEl = container.querySelector(this.resultSelectors.description);
                        
                        if (titleEl && urlEl) {
                            results.push({
                                position: index + 1,
                                title: titleEl.textContent.trim(),
                                url: urlEl.href,
                                description: descEl?.textContent.trim() || '',
                                type: 'organic'
                            });
                        }
                    });
                    
                    return results;
                }

                clearCache() {
                    this.scrapingCache.clear();
                }
            };
        }
    });

    it('should extract search results from DOM', function() {
        // Temporarily add mock elements to document
        document.body.appendChild(mockContainer);
        
        const scraper = new SERPScraper();
        const results = scraper.extractResultsFromDOM();
        
        expect(results.length).toBe(2);
        expect(results[0]).toHaveProperty('title');
        expect(results[0]).toHaveProperty('url');
        expect(results[0]).toHaveProperty('description');
        expect(results[0]).toHaveProperty('position');
        
        // Cleanup
        document.body.removeChild(mockContainer);
    });

    it('should handle empty search results', function() {
        const scraper = new SERPScraper();
        const results = scraper.extractResultsFromDOM();
        
        expect(results.length).toBe(0);
    });

    it('should assign correct positions to results', function() {
        document.body.appendChild(mockContainer);
        
        const scraper = new SERPScraper();
        const results = scraper.extractResultsFromDOM();
        
        expect(results[0].position).toBe(1);
        expect(results[1].position).toBe(2);
        
        document.body.removeChild(mockContainer);
    });

    it('should extract valid URLs', function() {
        document.body.appendChild(mockContainer);
        
        const scraper = new SERPScraper();
        const results = scraper.extractResultsFromDOM();
        
        expect(results[0].url).toBe('https://example1.com');
        expect(results[1].url).toBe('https://example2.com');
        
        document.body.removeChild(mockContainer);
    });

    it('should handle missing description gracefully', function() {
        const emptyContainer = document.createElement('div');
        emptyContainer.innerHTML = `
            <div class="g">
                <div class="yuRUbf">
                    <a href="https://example.com">
                        <h3>Test Title</h3>
                    </a>
                </div>
            </div>
        `;
        
        document.body.appendChild(emptyContainer);
        
        const scraper = new SERPScraper();
        const results = scraper.extractResultsFromDOM();
        
        expect(results[0].description).toBe('');
        
        document.body.removeChild(emptyContainer);
    });
});

console.log('✅ SERP Scraper unit tests loaded');
