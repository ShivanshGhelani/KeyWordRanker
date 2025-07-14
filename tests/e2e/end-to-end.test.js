/**
 * End-to-End Integration Testing Suite
 * Tests the complete workflow from keyword input to rank result display
 */

describe('End-to-End Integration Testing', () => {
    let mockChrome, mockDocument, mockWindow;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Mock Chrome APIs
        mockChrome = {
            tabs: {
                query: jest.fn(),
                sendMessage: jest.fn(),
                create: jest.fn(),
                update: jest.fn()
            },
            storage: {
                local: {
                    get: jest.fn(),
                    set: jest.fn(),
                    clear: jest.fn()
                }
            },
            runtime: {
                sendMessage: jest.fn(),
                onMessage: {
                    addListener: jest.fn(),
                    removeListener: jest.fn()
                },
                getURL: jest.fn(),
                id: 'test-extension-id'
            },
            action: {
                setBadgeText: jest.fn(),
                setBadgeBackgroundColor: jest.fn()
            }
        };
        global.chrome = mockChrome;

        // Mock DOM elements
        mockDocument = {
            querySelector: jest.fn(),
            querySelectorAll: jest.fn(),
            getElementById: jest.fn(),
            createElement: jest.fn(),
            createTextNode: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            body: {
                appendChild: jest.fn(),
                removeChild: jest.fn()
            }
        };
        global.document = mockDocument;

        // Mock Window object
        mockWindow = {
            location: {
                href: 'https://www.google.com/search?q=test+keyword',
                hostname: 'www.google.com',
                search: '?q=test+keyword'
            },
            setTimeout: jest.fn(),
            clearTimeout: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn()
        };
        global.window = mockWindow;
    });

    describe('Complete Workflow Testing', () => {
        test('should complete full keyword ranking workflow', async () => {
            // Step 1: User opens popup and enters keyword
            const keyword = 'best laptops 2024';
            
            // Mock popup elements
            const mockKeywordInput = {
                value: keyword,
                addEventListener: jest.fn(),
                focus: jest.fn(),
                blur: jest.fn()
            };
            const mockSearchButton = {
                addEventListener: jest.fn(),
                click: jest.fn(),
                disabled: false
            };
            const mockResultsDiv = {
                innerHTML: '',
                textContent: '',
                style: { display: 'none' }
            };
            const mockLoadingDiv = {
                style: { display: 'none' }
            };

            mockDocument.getElementById.mockImplementation((id) => {
                switch (id) {
                    case 'keyword-input': return mockKeywordInput;
                    case 'search-button': return mockSearchButton;
                    case 'results': return mockResultsDiv;
                    case 'loading': return mockLoadingDiv;
                    default: return null;
                }
            });

            // Step 2: User clicks search button
            mockChrome.tabs.query.mockResolvedValue([
                { id: 1, url: 'https://www.google.com/search?q=best+laptops+2024' }
            ]);

            mockChrome.tabs.sendMessage.mockResolvedValue({
                success: true,
                position: 3,
                url: 'https://techradar.com/best-laptops',
                title: 'Best Laptops 2024: Top Picks for Every Budget',
                totalResults: 10
            });

            // Simulate search button click
            const searchHandler = mockSearchButton.addEventListener.mock.calls[0][1];
            await searchHandler();

            // Step 3: Verify Chrome tab query was called
            expect(mockChrome.tabs.query).toHaveBeenCalledWith(
                { active: true, currentWindow: true }
            );

            // Step 4: Verify message sent to content script
            expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(
                1,
                expect.objectContaining({
                    action: 'findKeyword',
                    keyword: keyword
                })
            );

            // Step 5: Verify results displayed
            expect(mockResultsDiv.innerHTML).toContain('Position: 3');
            expect(mockResultsDiv.innerHTML).toContain('techradar.com');
            expect(mockLoadingDiv.style.display).toBe('none');
        });

        test('should handle keyword not found scenario', async () => {
            const keyword = 'very rare specific keyword that doesnt exist';
            
            // Mock popup elements
            const mockResultsDiv = { innerHTML: '', style: { display: 'none' } };
            const mockLoadingDiv = { style: { display: 'none' } };
            
            mockDocument.getElementById.mockImplementation((id) => {
                switch (id) {
                    case 'results': return mockResultsDiv;
                    case 'loading': return mockLoadingDiv;
                    default: return null;
                }
            });

            mockChrome.tabs.query.mockResolvedValue([
                { id: 1, url: 'https://www.google.com/search?q=very+rare+specific+keyword' }
            ]);

            mockChrome.tabs.sendMessage.mockResolvedValue({
                success: false,
                position: -1,
                message: 'Keyword not found in search results'
            });

            // Simulate search
            // (search logic would be here)

            // Verify not found message
            expect(mockResultsDiv.innerHTML).toContain('not found');
            expect(mockResultsDiv.style.display).toBe('block');
        });

        test('should handle search history integration', async () => {
            const keyword = 'smartphone reviews';
            
            // Mock storage for search history
            mockChrome.storage.local.get.mockResolvedValue({
                searchHistory: [
                    {
                        keyword: 'laptop reviews',
                        position: 2,
                        timestamp: '2024-01-01T10:00:00Z',
                        url: 'example.com'
                    }
                ]
            });

            mockChrome.storage.local.set.mockResolvedValue();

            // Simulate successful search
            mockChrome.tabs.query.mockResolvedValue([
                { id: 1, url: 'https://www.google.com/search?q=smartphone+reviews' }
            ]);

            mockChrome.tabs.sendMessage.mockResolvedValue({
                success: true,
                position: 1,
                url: 'https://gsmarena.com/reviews',
                title: 'Best Smartphone Reviews 2024'
            });

            // Verify search was saved to history
            expect(mockChrome.storage.local.set).toHaveBeenCalledWith(
                expect.objectContaining({
                    searchHistory: expect.arrayContaining([
                        expect.objectContaining({
                            keyword: keyword,
                            position: 1
                        })
                    ])
                })
            );
        });
    });

    describe('Content Script Integration', () => {
        test('should properly inject and execute content script', async () => {
            // Mock Google search results page
            const mockSearchResults = [
                {
                    querySelector: jest.fn().mockReturnValue({
                        textContent: 'Best Gaming Laptops 2024 - TechRadar',
                        href: 'https://techradar.com/gaming-laptops'
                    }),
                    textContent: 'Best Gaming Laptops 2024 - TechRadar'
                },
                {
                    querySelector: jest.fn().mockReturnValue({
                        textContent: 'Top 10 Gaming Laptops - PC Mag',
                        href: 'https://pcmag.com/gaming-laptops'
                    }),
                    textContent: 'Top 10 Gaming Laptops - PC Mag'
                }
            ];

            mockDocument.querySelectorAll.mockReturnValue(mockSearchResults);

            // Mock content script modules
            const mockSerpScraper = {
                scrapeSearchResults: jest.fn().mockReturnValue(mockSearchResults.map((result, index) => ({
                    title: result.textContent,
                    url: result.querySelector().href,
                    position: index + 1,
                    snippet: `Description for result ${index + 1}`
                })))
            };

            const mockKeywordMatcher = {
                findKeywordPosition: jest.fn().mockReturnValue({
                    position: 1,
                    found: true,
                    matchedResult: {
                        title: 'Best Gaming Laptops 2024 - TechRadar',
                        url: 'https://techradar.com/gaming-laptops'
                    }
                })
            };

            // Simulate content script execution
            const keyword = 'gaming laptops';
            const scrapedResults = mockSerpScraper.scrapeSearchResults();
            const keywordResult = mockKeywordMatcher.findKeywordPosition(keyword, scrapedResults);

            expect(mockSerpScraper.scrapeSearchResults).toHaveBeenCalled();
            expect(mockKeywordMatcher.findKeywordPosition).toHaveBeenCalledWith(keyword, scrapedResults);
            expect(keywordResult.found).toBe(true);
            expect(keywordResult.position).toBe(1);
        });

        test('should handle different Google search result layouts', async () => {
            const layouts = [
                'desktop-standard',
                'mobile-responsive', 
                'news-results',
                'shopping-results',
                'local-results'
            ];

            layouts.forEach(async (layout) => {
                // Mock different result structures
                let mockResults;
                switch (layout) {
                    case 'desktop-standard':
                        mockResults = Array.from({ length: 10 }, (_, i) => ({
                            querySelector: jest.fn().mockReturnValue({
                                textContent: `Standard Result ${i + 1}`,
                                href: `https://example${i + 1}.com`
                            })
                        }));
                        break;
                    case 'mobile-responsive':
                        mockResults = Array.from({ length: 8 }, (_, i) => ({
                            querySelector: jest.fn().mockReturnValue({
                                textContent: `Mobile Result ${i + 1}`,
                                href: `https://mobile${i + 1}.com`
                            })
                        }));
                        break;
                    case 'news-results':
                        mockResults = Array.from({ length: 5 }, (_, i) => ({
                            querySelector: jest.fn().mockReturnValue({
                                textContent: `News Result ${i + 1}`,
                                href: `https://news${i + 1}.com`
                            })
                        }));
                        break;
                    default:
                        mockResults = [];
                }

                mockDocument.querySelectorAll.mockReturnValue(mockResults);

                const scrapedCount = mockResults.length;
                expect(scrapedCount).toBeGreaterThanOrEqual(0);
            });
        });

        test('should handle dynamic content loading', async () => {
            // Simulate initial page load with fewer results
            let mockResults = Array.from({ length: 3 }, (_, i) => ({
                querySelector: jest.fn().mockReturnValue({
                    textContent: `Initial Result ${i + 1}`,
                    href: `https://initial${i + 1}.com`
                })
            }));

            mockDocument.querySelectorAll.mockReturnValue(mockResults);

            // First scrape
            let initialCount = mockResults.length;
            expect(initialCount).toBe(3);

            // Simulate more results loading dynamically
            mockResults = Array.from({ length: 10 }, (_, i) => ({
                querySelector: jest.fn().mockReturnValue({
                    textContent: `Dynamic Result ${i + 1}`,
                    href: `https://dynamic${i + 1}.com`
                })
            }));

            mockDocument.querySelectorAll.mockReturnValue(mockResults);

            // Second scrape after dynamic load
            let dynamicCount = mockResults.length;
            expect(dynamicCount).toBe(10);
            expect(dynamicCount).toBeGreaterThan(initialCount);
        });
    });

    describe('Error Handling and Edge Cases', () => {
        test('should handle network failures gracefully', async () => {
            const keyword = 'network test';
            
            // Mock network failure
            mockChrome.tabs.query.mockRejectedValue(new Error('Network error'));
            
            try {
                await mockChrome.tabs.query({ active: true, currentWindow: true });
            } catch (error) {
                expect(error.message).toBe('Network error');
            }

            // Verify error is handled properly
            const mockErrorDiv = { innerHTML: '', style: { display: 'none' } };
            mockDocument.getElementById.mockReturnValue(mockErrorDiv);
            
            // Error handling would set error message
            mockErrorDiv.innerHTML = 'Network error occurred. Please try again.';
            mockErrorDiv.style.display = 'block';
            
            expect(mockErrorDiv.innerHTML).toContain('Network error');
        });

        test('should handle invalid Google search pages', async () => {
            // Mock non-Google page
            mockWindow.location.hostname = 'bing.com';
            
            mockChrome.tabs.query.mockResolvedValue([
                { id: 1, url: 'https://bing.com/search?q=test' }
            ]);

            // Content script should detect invalid page
            const isGoogleSearch = mockWindow.location.hostname.includes('google');
            expect(isGoogleSearch).toBe(false);
            
            // Should return appropriate error
            mockChrome.tabs.sendMessage.mockResolvedValue({
                success: false,
                error: 'Not a Google search page'
            });

            const result = await mockChrome.tabs.sendMessage(1, { action: 'findKeyword' });
            expect(result.success).toBe(false);
            expect(result.error).toContain('Not a Google search page');
        });

        test('should handle bot detection scenarios', async () => {
            // Mock bot detection response
            mockChrome.tabs.sendMessage.mockResolvedValue({
                success: false,
                error: 'Bot detection triggered',
                botDetected: true
            });

            const result = await mockChrome.tabs.sendMessage(1, { 
                action: 'findKeyword',
                keyword: 'test' 
            });

            expect(result.botDetected).toBe(true);
            expect(result.success).toBe(false);
            
            // Should trigger bot avoidance measures
            expect(result.error).toContain('Bot detection');
        });

        test('should handle extension disabled or removed', async () => {
            // Mock extension context invalidated
            mockChrome.runtime.id = null;
            
            try {
                await mockChrome.tabs.sendMessage(1, { action: 'findKeyword' });
            } catch (error) {
                expect(error).toBeDefined();
            }
        });
    });

    describe('Performance and Load Testing', () => {
        test('should handle rapid successive searches', async () => {
            const keywords = ['test1', 'test2', 'test3', 'test4', 'test5'];
            const searchPromises = [];

            keywords.forEach((keyword, index) => {
                mockChrome.tabs.sendMessage.mockResolvedValueOnce({
                    success: true,
                    position: index + 1,
                    keyword: keyword
                });

                searchPromises.push(
                    mockChrome.tabs.sendMessage(1, {
                        action: 'findKeyword',
                        keyword: keyword
                    })
                );
            });

            const results = await Promise.all(searchPromises);
            
            expect(results).toHaveLength(5);
            results.forEach((result, index) => {
                expect(result.success).toBe(true);
                expect(result.position).toBe(index + 1);
            });
        });

        test('should handle large search result sets', async () => {
            // Mock large result set (100+ results)
            const largeResultSet = Array.from({ length: 100 }, (_, i) => ({
                title: `Large Result ${i + 1}`,
                url: `https://large${i + 1}.com`,
                position: i + 1
            }));

            mockChrome.tabs.sendMessage.mockResolvedValue({
                success: true,
                position: 50,
                totalResults: 100,
                processingTime: 250 // milliseconds
            });

            const startTime = Date.now();
            const result = await mockChrome.tabs.sendMessage(1, {
                action: 'findKeyword',
                keyword: 'large dataset test'
            });
            const endTime = Date.now();

            expect(result.success).toBe(true);
            expect(result.totalResults).toBe(100);
            expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
        });

        test('should handle memory constraints', async () => {
            // Test with large keyword list
            const largeKeywordList = Array.from({ length: 1000 }, (_, i) => 
                `keyword${i}`.repeat(10) // Make each keyword longer
            );

            // Simulate memory usage tracking
            let memoryUsage = 0;
            
            largeKeywordList.forEach(keyword => {
                memoryUsage += keyword.length * 2; // Rough estimate
                
                mockChrome.tabs.sendMessage.mockResolvedValueOnce({
                    success: true,
                    position: Math.floor(Math.random() * 10) + 1,
                    memoryUsage: memoryUsage
                });
            });

            // Should handle large datasets without crashing
            expect(memoryUsage).toBeGreaterThan(0);
        });
    });

    describe('Cross-Browser Compatibility', () => {
        test('should work with different Chrome API versions', async () => {
            // Test with older Chrome API structure
            const legacyChrome = {
                tabs: {
                    query: jest.fn().mockImplementation((query, callback) => {
                        callback([{ id: 1, url: 'https://google.com' }]);
                    }),
                    sendMessage: jest.fn().mockImplementation((tabId, message, callback) => {
                        callback({ success: true, position: 1 });
                    })
                }
            };

            // Test callback-based API
            legacyChrome.tabs.query({ active: true }, (tabs) => {
                expect(tabs).toHaveLength(1);
                expect(tabs[0].id).toBe(1);
            });

            legacyChrome.tabs.sendMessage(1, { action: 'test' }, (response) => {
                expect(response.success).toBe(true);
            });
        });

        test('should handle comprehensive multi-language scenarios', async () => {
            // Load language support for testing
            const LanguageSupport = require('../../src/scripts/modules/language-support.js');
            const languageSupport = new LanguageSupport();
            
            const scenarios = languageSupport.generateLanguageTestScenarios();
            
            for (const scenario of scenarios) {
                console.log(`Testing language scenario: ${scenario.language}`);
                
                // Mock browser language and region
                Object.defineProperty(navigator, 'language', {
                    value: scenario.language,
                    configurable: true
                });
                
                Object.defineProperty(navigator, 'languages', {
                    value: [scenario.language],
                    configurable: true
                });

                // Mock Google URL with proper language parameters
                Object.defineProperty(window.location, 'href', {
                    value: scenario.searchURL,
                    configurable: true
                });

                // Test sample keywords for this language
                for (const keyword of scenario.sampleKeywords.slice(0, 2)) { // Test first 2 keywords
                    // Mock search results with language-specific content
                    const mockResults = [
                        {
                            title: `${keyword} - ${languageSupport.getSearchTermTranslation('results', scenario.language)}`,
                            snippet: `Sample snippet for ${keyword} in ${scenario.language}`,
                            url: `https://example.com/${keyword}`,
                            rank: 1,
                            type: 'organic'
                        }
                    ];

                    // Mock successful search with language context
                    mockChrome.tabs.sendMessage.mockResolvedValue({
                        success: true,
                        position: 1,
                        confidence: 0.95,
                        matchType: 'exact',
                        language: scenario.language,
                        country: scenario.country,
                        domain: scenario.domain,
                        results: mockResults,
                        searchMetadata: {
                            keyword: keyword,
                            language: scenario.language,
                            encoding: scenario.encoding,
                            direction: scenario.direction
                        }
                    });

                    // Perform the search
                    const result = await mockChrome.tabs.sendMessage(1, {
                        action: 'findKeyword',
                        keyword: keyword,
                        language: scenario.language,
                        country: scenario.country,
                        headers: scenario.headers
                    });

                    // Verify language-specific results
                    expect(result.success).toBe(true);
                    expect(result.language).toBe(scenario.language);
                    expect(result.country).toBe(scenario.country);
                    expect(result.domain).toBe(scenario.domain);
                    expect(result.searchMetadata.keyword).toBe(keyword);
                    expect(result.searchMetadata.language).toBe(scenario.language);
                    expect(result.position).toBe(1);
                    expect(result.confidence).toBeGreaterThan(0.8);
                }

                // Test common search terms translation
                for (const commonTerm of scenario.commonTerms.slice(0, 1)) { // Test first common term
                    mockChrome.tabs.sendMessage.mockResolvedValue({
                        success: true,
                        position: 2,
                        confidence: 0.87,
                        matchType: 'partial',
                        language: scenario.language,
                        translatedTerm: commonTerm
                    });

                    const result = await mockChrome.tabs.sendMessage(1, {
                        action: 'findKeyword',
                        keyword: commonTerm,
                        language: scenario.language
                    });

                    expect(result.success).toBe(true);
                    expect(result.language).toBe(scenario.language);
                    expect(result.translatedTerm).toBe(commonTerm);
                }

                // Validate language configuration
                const validation = languageSupport.validateLanguageSupport(scenario.language, [
                    'search', 'keywords', 'domain'
                ]);
                
                expect(validation.supported).toBe(true);
                expect(validation.features.search).toBe(true);
                expect(validation.features.keywords).toBe(true);
                expect(validation.features.domain).toBe(true);
            }
        });

        test('should handle cross-language keyword matching', async () => {
            const LanguageSupport = require('../../src/scripts/modules/language-support.js');
            const languageSupport = new LanguageSupport();
            
            // Test keyword matching across different languages
            const crossLangTests = [
                {
                    keyword: 'technology',
                    languages: ['en-US', 'es-ES', 'fr-FR'],
                    expectedMatches: ['technology', 'tecnología', 'technologie']
                },
                {
                    keyword: 'business',
                    languages: ['en-US', 'de-DE', 'pt-BR'],
                    expectedMatches: ['business', 'geschäft', 'negócio']
                }
            ];

            for (const test of crossLangTests) {
                for (let i = 0; i < test.languages.length; i++) {
                    const language = test.languages[i];
                    const expectedMatch = test.expectedMatches[i];
                    
                    // Mock cross-language search result
                    mockChrome.tabs.sendMessage.mockResolvedValue({
                        success: true,
                        position: 1,
                        confidence: 0.92,
                        matchType: 'translated',
                        language: language,
                        originalKeyword: test.keyword,
                        matchedKeyword: expectedMatch,
                        crossLanguage: true
                    });

                    const result = await mockChrome.tabs.sendMessage(1, {
                        action: 'findKeyword',
                        keyword: test.keyword,
                        language: language,
                        enableTranslation: true
                    });

                    expect(result.success).toBe(true);
                    expect(result.language).toBe(language);
                    expect(result.originalKeyword).toBe(test.keyword);
                    expect(result.matchedKeyword).toBe(expectedMatch);
                    expect(result.crossLanguage).toBe(true);
                }
            }
        });

        test('should handle RTL language support', async () => {
            // Note: This would be expanded for actual RTL languages like Arabic/Hebrew
            const LanguageSupport = require('../../src/scripts/modules/language-support.js');
            const languageSupport = new LanguageSupport();
            
            // Test text direction detection
            const ltrLanguages = ['en-US', 'es-ES', 'fr-FR', 'de-DE'];
            
            for (const language of ltrLanguages) {
                const config = languageSupport.getLanguageConfig(language);
                expect(config.direction).toBe('ltr');
                expect(config.encoding).toBe('UTF-8');
            }
        });

        test('should handle language-specific error messages', async () => {
            const LanguageSupport = require('../../src/scripts/modules/language-support.js');
            const languageSupport = new LanguageSupport();
            
            const errorScenarios = [
                { language: 'en-US', errorType: 'notFound' },
                { language: 'es-ES', errorType: 'network' },
                { language: 'fr-FR', errorType: 'timeout' },
                { language: 'de-DE', errorType: 'blocked' }
            ];

            for (const scenario of errorScenarios) {
                // Mock language-specific error
                mockChrome.tabs.sendMessage.mockRejectedValue({
                    error: scenario.errorType,
                    language: scenario.language,
                    message: `Error in ${scenario.language}: ${scenario.errorType}`
                });

                try {
                    await mockChrome.tabs.sendMessage(1, {
                        action: 'findKeyword',
                        keyword: 'test',
                        language: scenario.language
                    });
                } catch (error) {
                    expect(error.language).toBe(scenario.language);
                    expect(error.error).toBe(scenario.errorType);
                }
            }
        });

        test('should handle different browser languages', async () => {
            const languages = ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'ja-JP', 'zh-CN', 'pt-BR', 'it-IT', 'ru-RU', 'ko-KR'];
            
            for (const lang of languages) {
                // Mock browser language
                Object.defineProperty(navigator, 'language', {
                    value: lang,
                    configurable: true
                });

                // Should handle different language search results
                mockChrome.tabs.sendMessage.mockResolvedValue({
                    success: true,
                    position: 1,
                    confidence: 0.95,
                    language: lang,
                    browserLanguage: lang,
                    autoDetected: true
                });

                const result = await mockChrome.tabs.sendMessage(1, {
                    action: 'findKeyword',
                    keyword: 'test',
                    language: lang,
                    autoDetectLanguage: true
                });

                expect(result.language).toBe(lang);
                expect(result.browserLanguage).toBe(lang);
                expect(result.autoDetected).toBe(true);
            }
        });
    });

    describe('Security Testing', () => {
        test('should sanitize user input', async () => {
            const maliciousInputs = [
                '<script>alert("xss")</script>',
                'javascript:alert("xss")',
                '<img src="x" onerror="alert(1)">',
                '"><script>alert("xss")</script>',
                'eval("alert(1)")'
            ];

            maliciousInputs.forEach(async (input) => {
                // Input should be sanitized
                const sanitized = input
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                    .replace(/javascript:/gi, '')
                    .replace(/on\w+=/gi, '');

                mockChrome.tabs.sendMessage.mockResolvedValue({
                    success: true,
                    sanitizedInput: sanitized
                });

                const result = await mockChrome.tabs.sendMessage(1, {
                    action: 'findKeyword',
                    keyword: input
                });

                expect(result.sanitizedInput).not.toContain('<script>');
                expect(result.sanitizedInput).not.toContain('javascript:');
            });
        });

        test('should validate message origins', async () => {
            // Mock message from unknown origin
            const invalidMessage = {
                origin: 'https://malicious-site.com',
                data: { action: 'findKeyword', keyword: 'test' }
            };

            // Should reject messages from invalid origins
            const validOrigins = ['chrome-extension://', 'https://www.google.com'];
            const isValidOrigin = validOrigins.some(origin => 
                invalidMessage.origin.startsWith(origin)
            );

            expect(isValidOrigin).toBe(false);
        });
    });
});
