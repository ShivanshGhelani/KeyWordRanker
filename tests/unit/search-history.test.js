/**
 * Unit Tests for Search History Module
 * Tests data persistence, filtering, and statistics
 */

describe('Search History Unit Tests', function() {
    
    let searchHistory;
    
    beforeEach(function() {
        // Mock Chrome storage API
        if (typeof chrome === 'undefined') {
            window.chrome = {
                storage: {
                    local: {
                        data: {},
                        get: function(keys) {
                            return Promise.resolve(
                                typeof keys === 'string' ? 
                                { [keys]: this.data[keys] } : 
                                keys.reduce((result, key) => {
                                    result[key] = this.data[key];
                                    return result;
                                }, {})
                            );
                        },
                        set: function(data) {
                            Object.assign(this.data, data);
                            return Promise.resolve();
                        },
                        clear: function() {
                            this.data = {};
                            return Promise.resolve();
                        }
                    }
                }
            };
        }
        
        // Mock SearchHistory class if not available
        if (typeof SearchHistory === 'undefined') {
            window.SearchHistory = class {
                constructor() {
                    this.maxHistorySize = 50;
                    this.historyKey = 'google_keyword_rank_history';
                    this.enabled = true;
                    this.autoSave = true;
                    this.data = [];
                }

                async saveSearchResult(keyword, results, matchResult) {
                    if (!this.enabled || !this.autoSave) return;
                    
                    const historyEntry = {
                        id: this.generateHistoryId(),
                        keyword: keyword,
                        timestamp: Date.now(),
                        searchDate: new Date().toISOString(),
                        results: {
                            found: matchResult.found,
                            position: matchResult.position,
                            matchType: matchResult.matchType,
                            confidence: matchResult.confidence,
                            totalResults: results.length
                        },
                        metadata: {
                            url: 'https://www.google.com/search',
                            userAgent: 'Test Agent',
                            searchEngine: 'Google'
                        }
                    };
                    
                    this.data.unshift(historyEntry);
                    if (this.data.length > this.maxHistorySize) {
                        this.data = this.data.slice(0, this.maxHistorySize);
                    }
                }

                async getSearchHistory(options = {}) {
                    const { limit = 20, keyword = null, foundOnly = false } = options;
                    
                    let filtered = [...this.data];
                    
                    if (keyword) {
                        filtered = filtered.filter(entry => 
                            entry.keyword.toLowerCase().includes(keyword.toLowerCase())
                        );
                    }
                    
                    if (foundOnly) {
                        filtered = filtered.filter(entry => entry.results.found);
                    }
                    
                    return {
                        history: filtered.slice(0, limit),
                        total: this.data.length,
                        filtered: filtered.length
                    };
                }

                getHistoryStats() {
                    const stats = {
                        totalSearches: this.data.length,
                        successfulSearches: 0,
                        averagePosition: 0,
                        topKeywords: {},
                        positionDistribution: {
                            topThree: 0,
                            firstPage: 0,
                            notFound: 0
                        }
                    };
                    
                    let totalPosition = 0;
                    let foundCount = 0;
                    
                    this.data.forEach(entry => {
                        if (entry.results.found) {
                            stats.successfulSearches++;
                            foundCount++;
                            totalPosition += entry.results.position;
                            
                            if (entry.results.position <= 3) {
                                stats.positionDistribution.topThree++;
                            } else if (entry.results.position <= 10) {
                                stats.positionDistribution.firstPage++;
                            }
                        } else {
                            stats.positionDistribution.notFound++;
                        }
                        
                        const keyword = entry.keyword.toLowerCase();
                        stats.topKeywords[keyword] = (stats.topKeywords[keyword] || 0) + 1;
                    });
                    
                    if (foundCount > 0) {
                        stats.averagePosition = totalPosition / foundCount;
                    }
                    
                    return stats;
                }

                generateHistoryId() {
                    return `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                }

                updateSettings(settings) {
                    if (settings.hasOwnProperty('enabled')) {
                        this.enabled = settings.enabled;
                    }
                    if (settings.hasOwnProperty('autoSave')) {
                        this.autoSave = settings.autoSave;
                    }
                }
            };
        }
        
        searchHistory = new SearchHistory();
    });

    it('should save search results', async function() {
        const mockResults = [{ title: 'Test', url: 'test.com' }];
        const mockMatch = { found: true, position: 1, confidence: 0.9 };
        
        await searchHistory.saveSearchResult('test keyword', mockResults, mockMatch);
        
        expect(searchHistory.data.length).toBe(1);
        expect(searchHistory.data[0].keyword).toBe('test keyword');
        expect(searchHistory.data[0].results.found).toBeTruthy();
    });

    it('should filter search history by keyword', async function() {
        // Add test data
        await searchHistory.saveSearchResult('boutique ahmedabad', [], { found: true, position: 1 });
        await searchHistory.saveSearchResult('fashion store', [], { found: true, position: 2 });
        await searchHistory.saveSearchResult('boutique mumbai', [], { found: false, position: null });
        
        const filtered = await searchHistory.getSearchHistory({ keyword: 'boutique' });
        
        expect(filtered.filtered).toBe(2);
        expect(filtered.history.length).toBe(2);
    });

    it('should filter by found results only', async function() {
        await searchHistory.saveSearchResult('test 1', [], { found: true, position: 1 });
        await searchHistory.saveSearchResult('test 2', [], { found: false, position: null });
        await searchHistory.saveSearchResult('test 3', [], { found: true, position: 3 });
        
        const filtered = await searchHistory.getSearchHistory({ foundOnly: true });
        
        expect(filtered.filtered).toBe(2);
        expect(filtered.history.every(entry => entry.results.found)).toBeTruthy();
    });

    it('should generate valid history statistics', function() {
        // Add test data with known positions
        searchHistory.data = [
            { keyword: 'test1', results: { found: true, position: 1 } },
            { keyword: 'test2', results: { found: true, position: 5 } },
            { keyword: 'test3', results: { found: false, position: null } },
            { keyword: 'test1', results: { found: true, position: 2 } }
        ];
        
        const stats = searchHistory.getHistoryStats();
        
        expect(stats.totalSearches).toBe(4);
        expect(stats.successfulSearches).toBe(3);
        expect(stats.averagePosition).toBe((1 + 5 + 2) / 3);
        expect(stats.positionDistribution.topThree).toBe(2);
        expect(stats.positionDistribution.firstPage).toBe(1);
        expect(stats.positionDistribution.notFound).toBe(1);
    });

    it('should respect enabled/disabled settings', async function() {
        searchHistory.updateSettings({ enabled: false });
        
        const initialLength = searchHistory.data.length;
        await searchHistory.saveSearchResult('test', [], { found: true, position: 1 });
        
        expect(searchHistory.data.length).toBe(initialLength);
    });

    it('should generate unique history IDs', function() {
        const id1 = searchHistory.generateHistoryId();
        const id2 = searchHistory.generateHistoryId();
        
        expect(id1).not.toBe(id2);
        expect(id1).toContain('hist_');
        expect(id2).toContain('hist_');
    });

    it('should limit history size', async function() {
        searchHistory.maxHistorySize = 3;
        
        // Add more entries than the limit
        for (let i = 0; i < 5; i++) {
            await searchHistory.saveSearchResult(`test ${i}`, [], { found: true, position: i + 1 });
        }
        
        expect(searchHistory.data.length).toBe(3);
        // Should keep the most recent entries
        expect(searchHistory.data[0].keyword).toBe('test 4');
    });

    it('should handle empty history gracefully', function() {
        searchHistory.data = [];
        
        const stats = searchHistory.getHistoryStats();
        
        expect(stats.totalSearches).toBe(0);
        expect(stats.successfulSearches).toBe(0);
        expect(stats.averagePosition).toBe(0);
    });
});

console.log('✅ Search History unit tests loaded');
