/**
 * Integration Tests for Content Script
 * Tests message handling, module coordination, and API integration
 */

describe('Content Script Integration Tests', function() {
    
    let mockContentScript;
    
    beforeEach(function() {
        // Mock GoogleSERPScraper class
        if (typeof GoogleSERPScraper === 'undefined') {
            window.GoogleSERPScraper = class {
                constructor() {
                    this.serpScraper = { scrapeGoogleResults: () => Promise.resolve({ success: true, results: [] }) };
                    this.keywordMatcher = { findKeywordRanking: () => ({ found: true, position: 1 }) };
                    this.botAvoidance = { 
                        applyHumanLikeDelay: () => Promise.resolve(2000),
                        getBotAvoidanceReport: () => ({ status: 'safe' })
                    };
                    this.errorHandler = { 
                        safeExecute: async (op) => await op(),
                        getErrorReport: () => ({ summary: { totalErrors: 0 } })
                    };
                    this.searchHistory = { 
                        saveSearchResult: () => Promise.resolve(),
                        getSearchHistory: () => Promise.resolve({ history: [] }),
                        getHistoryStats: () => ({ totalSearches: 0 })
                    };
                }

                async handleMessage(request, sender, sendResponse) {
                    try {
                        switch (request.action) {
                            case 'findKeywordRank':
                                return {
                                    success: true,
                                    keyword: request.keyword,
                                    found: true,
                                    position: 1,
                                    confidence: 0.9,
                                    totalResults: 10
                                };
                            
                            case 'scrapeResults':
                                return {
                                    success: true,
                                    results: [
                                        { position: 1, title: 'Test Result', url: 'test.com' }
                                    ],
                                    total: 1
                                };
                            
                            case 'getSearchHistory':
                                return await this.searchHistory.getSearchHistory(request.options);
                            
                            case 'getSystemReport':
                                return this.getSystemReport();
                            
                            default:
                                return { success: false, error: 'Unknown action' };
                        }
                    } catch (error) {
                        return { success: false, error: error.message };
                    }
                }

                getSystemReport() {
                    return {
                        timestamp: Date.now(),
                        modules: {
                            serpScraper: { status: 'active' },
                            keywordMatcher: { status: 'active' },
                            botAvoidance: { status: 'active' },
                            errorHandler: { status: 'active' },
                            searchHistory: { status: 'active' }
                        }
                    };
                }
            };
        }
        
        mockContentScript = new GoogleSERPScraper();
    });

    it('should handle findKeywordRank messages', async function() {
        const request = {
            action: 'findKeywordRank',
            keyword: 'test keyword',
            options: {}
        };
        
        const response = await mockContentScript.handleMessage(request, null, null);
        
        expect(response.success).toBeTruthy();
        expect(response.keyword).toBe('test keyword');
        expect(response.found).toBeTruthy();
        expect(response.position).toBe(1);
        expect(response).toHaveProperty('confidence');
    });

    it('should handle scrapeResults messages', async function() {
        const request = { action: 'scrapeResults' };
        
        const response = await mockContentScript.handleMessage(request, null, null);
        
        expect(response.success).toBeTruthy();
        expect(response).toHaveProperty('results');
        expect(response.results.length).toBeGreaterThan(0);
        expect(response).toHaveProperty('total');
    });

    it('should handle getSearchHistory messages', async function() {
        const request = {
            action: 'getSearchHistory',
            options: { limit: 10 }
        };
        
        const response = await mockContentScript.handleMessage(request, null, null);
        
        expect(response).toHaveProperty('history');
    });

    it('should handle getSystemReport messages', async function() {
        const request = { action: 'getSystemReport' };
        
        const response = await mockContentScript.handleMessage(request, null, null);
        
        expect(response).toHaveProperty('timestamp');
        expect(response).toHaveProperty('modules');
        expect(response.modules).toHaveProperty('serpScraper');
        expect(response.modules).toHaveProperty('keywordMatcher');
        expect(response.modules).toHaveProperty('botAvoidance');
        expect(response.modules).toHaveProperty('errorHandler');
        expect(response.modules).toHaveProperty('searchHistory');
    });

    it('should handle unknown actions gracefully', async function() {
        const request = { action: 'unknownAction' };
        
        const response = await mockContentScript.handleMessage(request, null, null);
        
        expect(response.success).toBeFalsy();
        expect(response.error).toContain('Unknown action');
    });

    it('should handle errors in message processing', async function() {
        // Mock a failing operation
        mockContentScript.keywordMatcher.findKeywordRanking = () => {
            throw new Error('Test error');
        };
        
        const request = {
            action: 'findKeywordRank',
            keyword: 'test'
        };
        
        const response = await mockContentScript.handleMessage(request, null, null);
        
        expect(response.success).toBeFalsy();
        expect(response.error).toBe('Test error');
    });

    it('should integrate all modules correctly', function() {
        expect(mockContentScript.serpScraper).toBeTruthy();
        expect(mockContentScript.keywordMatcher).toBeTruthy();
        expect(mockContentScript.botAvoidance).toBeTruthy();
        expect(mockContentScript.errorHandler).toBeTruthy();
        expect(mockContentScript.searchHistory).toBeTruthy();
    });

    it('should provide module access methods', function() {
        // Test if getter methods exist (these would be in the real implementation)
        expect(mockContentScript).toHaveProperty('serpScraper');
        expect(mockContentScript).toHaveProperty('keywordMatcher');
        expect(mockContentScript).toHaveProperty('botAvoidance');
        expect(mockContentScript).toHaveProperty('errorHandler');
        expect(mockContentScript).toHaveProperty('searchHistory');
    });

    it('should generate valid system reports', function() {
        const report = mockContentScript.getSystemReport();
        
        expect(report.timestamp).toBeGreaterThan(0);
        expect(Object.keys(report.modules).length).toBe(5);
        
        for (const moduleName in report.modules) {
            expect(report.modules[moduleName]).toHaveProperty('status');
        }
    });

    it('should handle concurrent requests', async function() {
        const requests = [
            { action: 'findKeywordRank', keyword: 'test1' },
            { action: 'findKeywordRank', keyword: 'test2' },
            { action: 'scrapeResults' },
            { action: 'getSystemReport' }
        ];
        
        const responses = await Promise.all(
            requests.map(req => mockContentScript.handleMessage(req, null, null))
        );
        
        expect(responses.length).toBe(4);
        responses.forEach(response => {
            expect(response).toHaveProperty('success');
        });
    });
});

console.log('✅ Content Script integration tests loaded');
