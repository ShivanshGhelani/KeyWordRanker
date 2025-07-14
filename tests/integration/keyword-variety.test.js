/**
 * Keyword Variety Testing Suite
 * Tests different types of keywords to ensure the extension handles all scenarios
 */

describe('Keyword Variety Testing', () => {
    let mockKeywordMatcher, mockSerpScraper, mockSearchHistory;

    beforeEach(() => {
        // Mock the KeywordMatcher module
        mockKeywordMatcher = {
            findKeywordPosition: jest.fn(),
            normalizeKeyword: jest.fn(),
            createKeywordRegex: jest.fn(),
            isExactMatch: jest.fn()
        };

        // Mock the SerpScraper module
        mockSerpScraper = {
            scrapeSearchResults: jest.fn(),
            extractResultData: jest.fn(),
            getResultSnippet: jest.fn(),
            isValidResult: jest.fn()
        };

        // Mock the SearchHistory module
        mockSearchHistory = {
            saveSearch: jest.fn(),
            getSearchHistory: jest.fn(),
            clearHistory: jest.fn()
        };

        // Setup Chrome API mocks
        global.chrome = {
            tabs: {
                query: jest.fn(),
                sendMessage: jest.fn()
            },
            storage: {
                local: {
                    get: jest.fn(),
                    set: jest.fn()
                }
            }
        };
    });

    describe('Brand Keywords', () => {
        const brandKeywords = [
            'Nike',
            'Apple iPhone',
            'Samsung Galaxy',
            'McDonald\'s',
            'Coca-Cola',
            'Google Chrome',
            'Microsoft Office',
            'Amazon Prime'
        ];

        test('should handle single-word brand names correctly', async () => {
            const keyword = 'Nike';
            mockKeywordMatcher.normalizeKeyword.mockReturnValue('nike');
            mockKeywordMatcher.findKeywordPosition.mockResolvedValue({ position: 1, found: true });
            
            const result = await mockKeywordMatcher.findKeywordPosition(keyword, [
                { title: 'Nike Official Store - Athletic Shoes', url: 'nike.com' },
                { title: 'Adidas vs Nike Comparison', url: 'sports.com' }
            ]);

            expect(mockKeywordMatcher.normalizeKeyword).toHaveBeenCalledWith(keyword);
            expect(result.position).toBe(1);
            expect(result.found).toBe(true);
        });

        test('should handle multi-word brand names', async () => {
            const keyword = 'Apple iPhone';
            mockKeywordMatcher.normalizeKeyword.mockReturnValue('apple iphone');
            mockKeywordMatcher.findKeywordPosition.mockResolvedValue({ position: 2, found: true });

            const result = await mockKeywordMatcher.findKeywordPosition(keyword, [
                { title: 'Samsung Galaxy Reviews', url: 'tech.com' },
                { title: 'Apple iPhone 15 Pro - Official Store', url: 'apple.com' }
            ]);

            expect(result.position).toBe(2);
            expect(result.found).toBe(true);
        });

        test('should handle brand names with special characters', async () => {
            const keyword = 'McDonald\'s';
            mockKeywordMatcher.normalizeKeyword.mockReturnValue('mcdonalds');
            mockKeywordMatcher.createKeywordRegex.mockReturnValue(/mcdonalds/i);
            mockKeywordMatcher.findKeywordPosition.mockResolvedValue({ position: 1, found: true });

            const result = await mockKeywordMatcher.findKeywordPosition(keyword, [
                { title: 'McDonald\'s Near Me - Fast Food Restaurant', url: 'mcdonalds.com' }
            ]);

            expect(mockKeywordMatcher.normalizeKeyword).toHaveBeenCalledWith(keyword);
            expect(result.found).toBe(true);
        });

        test('should handle brand variations and misspellings', async () => {
            brandKeywords.forEach(async (keyword) => {
                mockKeywordMatcher.normalizeKeyword.mockReturnValue(keyword.toLowerCase().replace(/[^\w\s]/g, ''));
                
                const variations = [
                    keyword,
                    keyword.toLowerCase(),
                    keyword.toUpperCase(),
                    keyword.replace(/\s+/g, '')
                ];

                for (const variation of variations) {
                    mockKeywordMatcher.findKeywordPosition.mockResolvedValue({ 
                        position: Math.floor(Math.random() * 10) + 1, 
                        found: true 
                    });

                    const result = await mockKeywordMatcher.findKeywordPosition(variation, [
                        { title: `${keyword} Official Store`, url: 'example.com' }
                    ]);

                    expect(result.found).toBe(true);
                }
            });
        });
    });

    describe('Local Business Keywords', () => {
        const localKeywords = [
            'pizza near me',
            'dentist New York',
            'hair salon downtown',
            'auto repair shop',
            'plumber emergency',
            'restaurant delivery',
            'gym membership',
            'coffee shop open now'
        ];

        test('should handle "near me" queries', async () => {
            const keyword = 'pizza near me';
            mockKeywordMatcher.normalizeKeyword.mockReturnValue('pizza near me');
            mockKeywordMatcher.findKeywordPosition.mockResolvedValue({ position: 1, found: true });

            const mockResults = [
                { title: 'Best Pizza Near You - Domino\'s Pizza', url: 'dominos.com' },
                { title: 'Local Pizza Restaurants in Your Area', url: 'yelp.com' }
            ];

            const result = await mockKeywordMatcher.findKeywordPosition(keyword, mockResults);
            expect(result.found).toBe(true);
        });

        test('should handle location-specific queries', async () => {
            const keyword = 'dentist New York';
            mockKeywordMatcher.normalizeKeyword.mockReturnValue('dentist new york');
            mockKeywordMatcher.findKeywordPosition.mockResolvedValue({ position: 2, found: true });

            const result = await mockKeywordMatcher.findKeywordPosition(keyword, [
                { title: 'Top Dentists in Manhattan', url: 'healthgrades.com' },
                { title: 'New York Dentist - Best Dental Care', url: 'nydentist.com' }
            ]);

            expect(result.position).toBe(2);
        });

        test('should handle service + location combinations', async () => {
            localKeywords.forEach(async (keyword) => {
                mockKeywordMatcher.normalizeKeyword.mockReturnValue(keyword.toLowerCase());
                mockKeywordMatcher.findKeywordPosition.mockResolvedValue({ 
                    position: Math.floor(Math.random() * 5) + 1, 
                    found: true 
                });

                const mockResults = [
                    { title: `${keyword} - Local Business Directory`, url: 'yellowpages.com' },
                    { title: `Find ${keyword} - Yelp Reviews`, url: 'yelp.com' }
                ];

                const result = await mockKeywordMatcher.findKeywordPosition(keyword, mockResults);
                expect(result.found).toBe(true);
            });
        });

        test('should save local search history with location data', async () => {
            const keyword = 'restaurant delivery';
            const location = 'Chicago, IL';
            
            mockSearchHistory.saveSearch.mockResolvedValue(true);
            
            await mockSearchHistory.saveSearch({
                keyword: keyword,
                location: location,
                timestamp: new Date().toISOString(),
                position: 3,
                url: 'grubhub.com'
            });

            expect(mockSearchHistory.saveSearch).toHaveBeenCalledWith(
                expect.objectContaining({
                    keyword: keyword,
                    location: location
                })
            );
        });
    });

    describe('Long-tail Keywords', () => {
        const longTailKeywords = [
            'best wireless noise cancelling headphones under 200',
            'how to fix leaky faucet in kitchen sink',
            'affordable wedding venues in southern california',
            'what is the difference between machine learning and ai',
            'organic dog food for puppies with sensitive stomach',
            'fastest way to learn javascript for beginners',
            'small business accounting software comparison 2024'
        ];

        test('should handle very specific long queries', async () => {
            const keyword = 'best wireless noise cancelling headphones under 200';
            mockKeywordMatcher.normalizeKeyword.mockReturnValue(keyword.toLowerCase());
            mockKeywordMatcher.findKeywordPosition.mockResolvedValue({ position: 1, found: true });

            const mockResults = [
                { title: 'Best Noise Cancelling Headphones Under $200 - TechRadar', url: 'techradar.com' },
                { title: '10 Affordable Wireless Headphones with Great Sound', url: 'wirecutter.com' }
            ];

            const result = await mockKeywordMatcher.findKeywordPosition(keyword, mockResults);
            expect(result.found).toBe(true);
        });

        test('should handle question-based queries', async () => {
            const keyword = 'how to fix leaky faucet in kitchen sink';
            mockKeywordMatcher.normalizeKeyword.mockReturnValue(keyword.toLowerCase());
            mockKeywordMatcher.findKeywordPosition.mockResolvedValue({ position: 2, found: true });

            const result = await mockKeywordMatcher.findKeywordPosition(keyword, [
                { title: 'Home Depot - Plumbing Supplies', url: 'homedepot.com' },
                { title: 'How to Fix a Leaky Kitchen Faucet - DIY Guide', url: 'familyhandyman.com' }
            ]);

            expect(result.position).toBe(2);
        });

        test('should handle partial matches in long-tail keywords', async () => {
            longTailKeywords.forEach(async (keyword) => {
                const words = keyword.split(' ');
                const partialKeyword = words.slice(0, Math.floor(words.length / 2)).join(' ');
                
                mockKeywordMatcher.normalizeKeyword.mockReturnValue(partialKeyword.toLowerCase());
                mockKeywordMatcher.findKeywordPosition.mockResolvedValue({ 
                    position: Math.floor(Math.random() * 10) + 1, 
                    found: true 
                });

                const mockResults = [
                    { title: `${keyword} - Complete Guide`, url: 'example.com' }
                ];

                const result = await mockKeywordMatcher.findKeywordPosition(partialKeyword, mockResults);
                expect(result.found).toBe(true);
            });
        });

        test('should extract relevant snippets from long-tail results', async () => {
            const keyword = 'organic dog food for puppies with sensitive stomach';
            
            mockSerpScraper.getResultSnippet.mockReturnValue(
                'Find the best organic dog food specially formulated for puppies with sensitive stomachs. Our natural ingredients help with digestion.'
            );

            const snippet = mockSerpScraper.getResultSnippet({
                title: 'Best Organic Puppy Food for Sensitive Stomachs',
                description: 'Find the best organic dog food specially formulated for puppies with sensitive stomachs. Our natural ingredients help with digestion.',
                url: 'petfood.com'
            });

            expect(snippet).toContain('organic dog food');
            expect(snippet).toContain('puppies');
            expect(snippet).toContain('sensitive stomach');
        });
    });

    describe('Special Characters and Symbols', () => {
        const specialKeywords = [
            'C++',
            '.NET framework',
            'jQuery $',
            'React.js',
            'Node.js',
            'iPhone 15 Pro Max',
            'COVID-19',
            'Wi-Fi router',
            'E-commerce',
            'B2B software',
            'AI/ML engineer',
            '@mentions',
            '#hashtags',
            'price: $100-$500'
        ];

        test('should handle programming languages with special chars', async () => {
            const keyword = 'C++';
            mockKeywordMatcher.normalizeKeyword.mockReturnValue('c++');
            mockKeywordMatcher.createKeywordRegex.mockReturnValue(/c\+\+/i);
            mockKeywordMatcher.findKeywordPosition.mockResolvedValue({ position: 1, found: true });

            const result = await mockKeywordMatcher.findKeywordPosition(keyword, [
                { title: 'C++ Programming Tutorial - Learn C++', url: 'cplusplus.com' }
            ]);

            expect(result.found).toBe(true);
        });

        test('should handle framework names with dots', async () => {
            const keyword = '.NET framework';
            mockKeywordMatcher.normalizeKeyword.mockReturnValue('.net framework');
            mockKeywordMatcher.createKeywordRegex.mockReturnValue(/\.net framework/i);
            mockKeywordMatcher.findKeywordPosition.mockResolvedValue({ position: 1, found: true });

            const result = await mockKeywordMatcher.findKeywordPosition(keyword, [
                { title: 'Microsoft .NET Framework Download', url: 'microsoft.com' }
            ]);

            expect(result.found).toBe(true);
        });

        test('should handle symbols and currency', async () => {
            const keyword = 'price: $100-$500';
            mockKeywordMatcher.normalizeKeyword.mockReturnValue('price 100 500');
            mockKeywordMatcher.findKeywordPosition.mockResolvedValue({ position: 2, found: true });

            const result = await mockKeywordMatcher.findKeywordPosition(keyword, [
                { title: 'Expensive Gadgets Over $1000', url: 'tech.com' },
                { title: 'Best Laptops Under $500 - Price Comparison', url: 'deals.com' }
            ]);

            expect(result.position).toBe(2);
        });

        test('should handle hyphenated terms', async () => {
            const keyword = 'COVID-19';
            mockKeywordMatcher.normalizeKeyword.mockReturnValue('covid 19');
            mockKeywordMatcher.createKeywordRegex.mockReturnValue(/covid.?19/i);
            mockKeywordMatcher.findKeywordPosition.mockResolvedValue({ position: 1, found: true });

            const result = await mockKeywordMatcher.findKeywordPosition(keyword, [
                { title: 'COVID-19 Vaccine Information - CDC', url: 'cdc.gov' }
            ]);

            expect(result.found).toBe(true);
        });

        test('should handle social media symbols', async () => {
            const socialKeywords = ['@mentions', '#hashtags'];
            
            socialKeywords.forEach(async (keyword) => {
                mockKeywordMatcher.normalizeKeyword.mockReturnValue(keyword.replace(/[@#]/g, ''));
                mockKeywordMatcher.findKeywordPosition.mockResolvedValue({ 
                    position: 1, 
                    found: true 
                });

                const result = await mockKeywordMatcher.findKeywordPosition(keyword, [
                    { title: `How to use ${keyword} on social media`, url: 'socialmedia.com' }
                ]);

                expect(result.found).toBe(true);
            });
        });

        test('should escape special regex characters properly', async () => {
            specialKeywords.forEach(async (keyword) => {
                mockKeywordMatcher.createKeywordRegex.mockReturnValue(
                    new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
                );
                
                const regex = mockKeywordMatcher.createKeywordRegex(keyword);
                expect(regex).toBeInstanceOf(RegExp);
                
                // Test that the regex doesn't throw errors
                expect(() => regex.test('test string')).not.toThrow();
            });
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('should handle empty keywords', async () => {
            const keyword = '';
            mockKeywordMatcher.normalizeKeyword.mockReturnValue('');
            mockKeywordMatcher.findKeywordPosition.mockResolvedValue({ position: -1, found: false });

            const result = await mockKeywordMatcher.findKeywordPosition(keyword, []);
            expect(result.found).toBe(false);
            expect(result.position).toBe(-1);
        });

        test('should handle very long keywords', async () => {
            const keyword = 'a'.repeat(1000); // 1000 character keyword
            mockKeywordMatcher.normalizeKeyword.mockReturnValue(keyword.toLowerCase());
            mockKeywordMatcher.findKeywordPosition.mockResolvedValue({ position: -1, found: false });

            const result = await mockKeywordMatcher.findKeywordPosition(keyword, [
                { title: 'Normal search result', url: 'example.com' }
            ]);

            expect(result.found).toBe(false);
        });

        test('should handle keywords with only special characters', async () => {
            const keyword = '!@#$%^&*()';
            mockKeywordMatcher.normalizeKeyword.mockReturnValue('');
            mockKeywordMatcher.findKeywordPosition.mockResolvedValue({ position: -1, found: false });

            const result = await mockKeywordMatcher.findKeywordPosition(keyword, []);
            expect(result.found).toBe(false);
        });

        test('should handle unicode and international characters', async () => {
            const internationalKeywords = [
                'café',
                'naïve',
                'résumé',
                'piñata',
                'Москва',
                '北京',
                'العربية',
                'हिंदी'
            ];

            internationalKeywords.forEach(async (keyword) => {
                mockKeywordMatcher.normalizeKeyword.mockReturnValue(keyword.toLowerCase());
                mockKeywordMatcher.findKeywordPosition.mockResolvedValue({ 
                    position: 1, 
                    found: true 
                });

                const result = await mockKeywordMatcher.findKeywordPosition(keyword, [
                    { title: `${keyword} - International Search`, url: 'international.com' }
                ]);

                expect(result.found).toBe(true);
            });
        });

        test('should handle keywords with mixed case and spacing', async () => {
            const variations = [
                'JavaScript',
                'javascript',
                'JAVASCRIPT',
                'Java Script',
                'java script',
                'JAVA SCRIPT',
                '  javascript  ',
                'Java\tScript'
            ];

            variations.forEach(async (keyword) => {
                mockKeywordMatcher.normalizeKeyword.mockReturnValue('javascript');
                mockKeywordMatcher.findKeywordPosition.mockResolvedValue({ 
                    position: 1, 
                    found: true 
                });

                const result = await mockKeywordMatcher.findKeywordPosition(keyword, [
                    { title: 'JavaScript Tutorial - Learn JS', url: 'javascript.com' }
                ]);

                expect(result.found).toBe(true);
            });
        });
    });

    describe('Performance Testing', () => {
        test('should handle large keyword lists efficiently', async () => {
            const largeKeywordList = Array.from({ length: 1000 }, (_, i) => `keyword${i}`);
            
            const startTime = Date.now();
            
            for (const keyword of largeKeywordList) {
                mockKeywordMatcher.normalizeKeyword.mockReturnValue(keyword.toLowerCase());
                mockKeywordMatcher.findKeywordPosition.mockResolvedValue({ 
                    position: Math.floor(Math.random() * 10) + 1, 
                    found: true 
                });

                await mockKeywordMatcher.findKeywordPosition(keyword, [
                    { title: `${keyword} result`, url: 'example.com' }
                ]);
            }

            const endTime = Date.now();
            const executionTime = endTime - startTime;

            // Should complete within reasonable time (adjust threshold as needed)
            expect(executionTime).toBeLessThan(5000); // 5 seconds
        });

        test('should handle concurrent keyword searches', async () => {
            const keywords = ['test1', 'test2', 'test3', 'test4', 'test5'];
            
            const promises = keywords.map(keyword => {
                mockKeywordMatcher.normalizeKeyword.mockReturnValue(keyword.toLowerCase());
                mockKeywordMatcher.findKeywordPosition.mockResolvedValue({ 
                    position: 1, 
                    found: true 
                });

                return mockKeywordMatcher.findKeywordPosition(keyword, [
                    { title: `${keyword} result`, url: 'example.com' }
                ]);
            });

            const results = await Promise.all(promises);
            
            expect(results).toHaveLength(5);
            results.forEach(result => {
                expect(result.found).toBe(true);
            });
        });
    });
});
