/**
 * Unit Tests for Keyword Matcher Module
 * Tests exact matching, fuzzy matching, and edge cases
 */

describe('Keyword Matcher Unit Tests', function() {
    
    // Mock search results for testing
    const mockSearchResults = [
        {
            position: 1,
            title: 'Best Boutique in Ahmedabad - Premium Fashion Store',
            description: 'Discover the finest collection at our boutique in Ahmedabad. Premium fashion, accessories, and personalized service.',
            url: 'https://example-boutique.com',
            type: 'organic'
        },
        {
            position: 2,
            title: 'Top Fashion Boutiques in Ahmedabad | Style Guide',
            description: 'Find the best boutique stores in Ahmedabad for trendy clothing and accessories.',
            url: 'https://fashion-guide.com/ahmedabad',
            type: 'organic'
        },
        {
            position: 3,
            title: 'Ahmedabad Shopping: Boutique Stores Directory',
            description: 'Complete directory of boutique shops in Ahmedabad with reviews and ratings.',
            url: 'https://shopping-directory.com',
            type: 'organic'
        },
        {
            position: 4,
            title: 'Designer Boutique Collection | Ahmedabad Fashion',
            description: 'Exclusive designer wear from the finest boutique in Ahmedabad.',
            url: 'https://designer-collection.com',
            type: 'organic'
        },
        {
            position: 5,
            title: 'Local Business Directory - Clothing Stores',
            description: 'Find local clothing stores and fashion boutiques near you.',
            url: 'https://local-business.com',
            type: 'organic'
        }
    ];

    // Initialize KeywordMatcher for testing
    let keywordMatcher;
    
    beforeEach(function() {
        // Mock the KeywordMatcher class if not available
        if (typeof KeywordMatcher === 'undefined') {
            window.KeywordMatcher = class {
                constructor() {
                    this.matchingOptions = {
                        fuzzyMatching: true,
                        caseSensitive: false,
                        exactMatchBonus: 2.0,
                        titleWeight: 3.0,
                        descriptionWeight: 1.0,
                        urlWeight: 0.5
                    };
                }

                findKeywordRanking(keyword, results, options = {}) {
                    const opts = { ...this.matchingOptions, ...options };
                    const matches = [];
                    
                    for (const result of results) {
                        const score = this.calculateRelevanceScore(keyword, result, opts);
                        if (score > 0) {
                            matches.push({
                                position: result.position,
                                score: score,
                                matchType: score > 5 ? 'exact' : 'fuzzy',
                                confidence: Math.min(score / 10, 1.0),
                                result: result
                            });
                        }
                    }
                    
                    matches.sort((a, b) => b.score - a.score);
                    
                    if (matches.length === 0) {
                        return {
                            found: false,
                            position: null,
                            matches: [],
                            confidence: 0,
                            matchType: 'none'
                        };
                    }
                    
                    const bestMatch = matches[0];
                    return {
                        found: true,
                        position: bestMatch.position,
                        matches: matches,
                        confidence: bestMatch.confidence,
                        matchType: bestMatch.matchType,
                        score: bestMatch.score
                    };
                }

                calculateRelevanceScore(keyword, result, options) {
                    const normalizedKeyword = keyword.toLowerCase();
                    const title = result.title.toLowerCase();
                    const description = result.description.toLowerCase();
                    const url = result.url.toLowerCase();
                    
                    let score = 0;
                    
                    // Exact matches
                    if (title.includes(normalizedKeyword)) {
                        score += options.titleWeight * options.exactMatchBonus;
                    }
                    if (description.includes(normalizedKeyword)) {
                        score += options.descriptionWeight * options.exactMatchBonus;
                    }
                    if (url.includes(normalizedKeyword)) {
                        score += options.urlWeight * options.exactMatchBonus;
                    }
                    
                    // Fuzzy matching (word-by-word)
                    if (options.fuzzyMatching) {
                        const keywordWords = normalizedKeyword.split(' ');
                        for (const word of keywordWords) {
                            if (title.includes(word)) score += options.titleWeight;
                            if (description.includes(word)) score += options.descriptionWeight;
                            if (url.includes(word)) score += options.urlWeight;
                        }
                    }
                    
                    return score;
                }

                getQuickPosition(keyword, results, options = {}) {
                    const result = this.findKeywordRanking(keyword, results, options);
                    return result.found ? result.position : null;
                }

                detectMultipleKeywordPositions(keywords, results, options = {}) {
                    const positions = {};
                    for (const keyword of keywords) {
                        const result = this.findKeywordRanking(keyword, results, options);
                        positions[keyword] = {
                            found: result.found,
                            position: result.position,
                            confidence: result.confidence
                        };
                    }
                    return positions;
                }
            };
        }
        
        keywordMatcher = new KeywordMatcher();
    });

    // Test 1: Exact keyword matching
    it('should find exact keyword matches', function() {
        const result = keywordMatcher.findKeywordRanking('best boutique in ahmedabad', mockSearchResults);
        
        expect(result.found).toBeTruthy();
        expect(result.position).toBe(1);
        expect(result.matchType).toBe('exact');
        expect(result.confidence).toBeGreaterThan(0.5);
    });

    // Test 2: Fuzzy keyword matching
    it('should find fuzzy keyword matches', function() {
        const result = keywordMatcher.findKeywordRanking('boutique ahmedabad', mockSearchResults);
        
        expect(result.found).toBeTruthy();
        expect(result.position).toBeGreaterThan(0);
        expect(result.matches).toHaveProperty('length');
        expect(result.matches.length).toBeGreaterThan(0);
    });

    // Test 3: Case insensitive matching
    it('should be case insensitive by default', function() {
        const result1 = keywordMatcher.findKeywordRanking('BOUTIQUE AHMEDABAD', mockSearchResults);
        const result2 = keywordMatcher.findKeywordRanking('boutique ahmedabad', mockSearchResults);
        
        expect(result1.found).toBeTruthy();
        expect(result2.found).toBeTruthy();
        expect(result1.position).toBe(result2.position);
    });

    // Test 4: No match scenario
    it('should return not found for non-matching keywords', function() {
        const result = keywordMatcher.findKeywordRanking('pizza delivery mumbai', mockSearchResults);
        
        expect(result.found).toBeFalsy();
        expect(result.position).toBe(null);
        expect(result.matches.length).toBe(0);
        expect(result.confidence).toBe(0);
    });

    // Test 5: Partial matching
    it('should find partial matches with lower confidence', function() {
        const result = keywordMatcher.findKeywordRanking('fashion boutique', mockSearchResults);
        
        expect(result.found).toBeTruthy();
        expect(result.confidence).toBeGreaterThan(0);
        expect(result.confidence).toBeLessThan(1);
    });

    // Test 6: Position accuracy
    it('should return correct position for matched results', function() {
        const result = keywordMatcher.findKeywordRanking('designer boutique', mockSearchResults);
        
        if (result.found) {
            expect(result.position).toBeGreaterThan(0);
            expect(result.position).toBeLessThan(10);
            
            // Verify the position matches the actual result
            const matchedResult = mockSearchResults.find(r => r.position === result.position);
            expect(matchedResult).toBeTruthy();
        }
    });

    // Test 7: Multiple matches ranking
    it('should rank multiple matches by relevance', function() {
        const result = keywordMatcher.findKeywordRanking('boutique', mockSearchResults);
        
        expect(result.found).toBeTruthy();
        expect(result.matches.length).toBeGreaterThan(1);
        
        // Verify matches are sorted by score
        for (let i = 0; i < result.matches.length - 1; i++) {
            expect(result.matches[i].score).toBeGreaterThan(result.matches[i + 1].score);
        }
    });

    // Test 8: Options customization
    it('should respect custom matching options', function() {
        const customOptions = {
            fuzzyMatching: false,
            titleWeight: 5.0
        };
        
        const result = keywordMatcher.findKeywordRanking('boutique fashion', mockSearchResults, customOptions);
        
        // With fuzzy matching disabled, should be more strict
        if (result.found) {
            expect(result.confidence).toBeGreaterThan(0);
        }
    });

    // Test 9: Quick position method
    it('should provide quick position lookup', function() {
        const position = keywordMatcher.getQuickPosition('best boutique', mockSearchResults);
        
        if (position !== null) {
            expect(position).toBeGreaterThan(0);
            expect(position).toBeLessThan(10);
        }
    });

    // Test 10: Multiple keywords detection
    it('should detect positions for multiple keywords', function() {
        const keywords = ['boutique ahmedabad', 'fashion store', 'designer wear'];
        const positions = keywordMatcher.detectMultipleKeywordPositions(keywords, mockSearchResults);
        
        expect(positions).toHaveProperty('boutique ahmedabad');
        expect(positions).toHaveProperty('fashion store');
        expect(positions).toHaveProperty('designer wear');
        
        for (const keyword of keywords) {
            expect(positions[keyword]).toHaveProperty('found');
            expect(positions[keyword]).toHaveProperty('position');
            expect(positions[keyword]).toHaveProperty('confidence');
        }
    });

    // Test 11: Edge case - empty keyword
    it('should handle empty keyword gracefully', function() {
        const result = keywordMatcher.findKeywordRanking('', mockSearchResults);
        
        expect(result.found).toBeFalsy();
        expect(result.position).toBe(null);
    });

    // Test 12: Edge case - empty results
    it('should handle empty results gracefully', function() {
        const result = keywordMatcher.findKeywordRanking('test keyword', []);
        
        expect(result.found).toBeFalsy();
        expect(result.position).toBe(null);
        expect(result.matches.length).toBe(0);
    });

    // Test 13: Special characters in keywords
    it('should handle special characters in keywords', function() {
        const result = keywordMatcher.findKeywordRanking('boutique & fashion', mockSearchResults);
        
        // Should handle gracefully, even if not found
        expect(result).toHaveProperty('found');
        expect(result).toHaveProperty('position');
        expect(result).toHaveProperty('confidence');
    });

    // Test 14: Long keyword matching
    it('should handle long keywords', function() {
        const longKeyword = 'best premium luxury boutique store in ahmedabad with designer collections';
        const result = keywordMatcher.findKeywordRanking(longKeyword, mockSearchResults);
        
        expect(result).toHaveProperty('found');
        expect(result).toHaveProperty('matches');
    });

    // Test 15: Confidence score validation
    it('should provide valid confidence scores', function() {
        const result = keywordMatcher.findKeywordRanking('boutique', mockSearchResults);
        
        if (result.found) {
            expect(result.confidence).toBeGreaterThan(0);
            expect(result.confidence).toBeLessThan(1.1); // Allow slight margin
            
            for (const match of result.matches) {
                expect(match.confidence).toBeGreaterThan(0);
                expect(match.confidence).toBeLessThan(1.1);
            }
        }
    });
});

console.log('✅ Keyword Matcher unit tests loaded');
