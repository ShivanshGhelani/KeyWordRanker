/**
 * Main Content Script - Google Extension Keyword Rank
 * Orchestrates all modules and provides the main API
 */

class GoogleSERPScraper {
    constructor() {
        // Initialize modules
        this.serpScraper = new SERPScraper();
        this.keywordMatcher = new KeywordMatcher();
        this.botAvoidance = new BotAvoidance();
        this.errorHandler = new ErrorHandler();
        this.searchHistory = new SearchHistory();
        this.languageSupport = new LanguageSupport(); // Add language support
        
        // Legacy compatibility properties
        this.resultSelectors = this.serpScraper.resultSelectors;
        this.resultTypes = this.serpScraper.resultTypes;
        this.currentResults = [];
        
        this.init();
    }

    init() {
        console.log('🔥 Enhanced Keyword Rank Finder: Content script loaded on:', window.location.href);
        this.setupMessageListener();
        this.initializeModules();
    }

    async initializeModules() {
        try {
            // All modules are already initialized in their constructors
            console.log('✅ All modules initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing modules:', error);
        }
    }

    setupMessageListener() {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
            chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
                this.handleMessage(request, sender, sendResponse);
                return true; // Keep message channel open for async response
            });
        }
    }

    async handleMessage(request, sender, sendResponse) {
        try {
            console.log('📨 Received message:', request.action);

            // Extract language context from request
            const languageContext = {
                language: request.language || this.languageSupport.currentLanguage,
                country: request.country || this.languageSupport.currentCountry,
                autoDetect: request.autoDetectLanguage !== false
            };

            switch (request.action) {
                case 'findKeywordRank':
                case 'findKeyword':
                    const result = await this.findKeywordRankWithLanguageSupport(
                        request.keyword, 
                        languageContext,
                        request.options
                    );
                    sendResponse(result);
                    break;

                case 'scrapeResults':
                    const scrapedResults = await this.scrapeGoogleResultsWithLanguageSupport(languageContext);
                    sendResponse(scrapedResults);
                    break;

                case 'getSearchHistory':
                    const history = await this.searchHistory.getSearchHistory({
                        ...request.options,
                        language: languageContext.language
                    });
                    sendResponse(history);
                    break;

                case 'clearSearchHistory':
                    const clearResult = await this.searchHistory.clearSearchHistory(request.options);
                    sendResponse(clearResult);
                    break;

                case 'getSystemReport':
                    const report = this.getSystemReportWithLanguageInfo();
                    sendResponse(report);
                    break;

                case 'getLanguageContext':
                    const context = this.languageSupport.getCurrentContext();
                    sendResponse({ success: true, context });
                    break;

                case 'validateLanguageSupport':
                    const validation = this.languageSupport.validateLanguageSupport(
                        request.language, 
                        request.features || []
                    );
                    sendResponse({ success: true, validation });
                    break;

                case 'testBotAvoidance':
                    const testResults = await this.botAvoidance.runBotAvoidanceTests();
                    sendResponse(testResults);
                    break;

                case 'validateBotAvoidance':
                    const validationResults = this.botAvoidance.validateAgainstKnownPatterns();
                    sendResponse(validationResults);
                    break;

                case 'ping':
                    sendResponse({ status: 'alive', timestamp: Date.now() });
                    break;

                case 'getCurrentSearchQuery':
                    const searchQuery = this.getCurrentSearchQuery();
                    sendResponse({ success: true, searchQuery });
                    break;

                case 'scrapeCurrentPageResults':
                    const currentPageResult = await this.scrapeCurrentPageResults(
                        request.keyword, 
                        request.currentSearchQuery,
                        request.options || {}
                    );
                    sendResponse(currentPageResult);
                    break;

                case 'verifyPageReady':
                    const pageReady = this.verifyPageReady();
                    sendResponse({ ready: pageReady });
                    break;

                case 'addPositionNumbers':
                    this.addPositionNumbersToPage();
                    sendResponse({ success: true, message: 'Position numbers added' });
                    break;

                case 'removePositionNumbers':
                    this.removePositionNumbersFromPage();
                    sendResponse({ success: true, message: 'Position numbers removed' });
                    break;

                case 'togglePositionNumbers':
                    const toggled = this.togglePositionNumbers();
                    sendResponse({ success: true, enabled: toggled, message: `Position numbers ${toggled ? 'enabled' : 'disabled'}` });
                    break;

                default:
                    sendResponse({ success: false, error: 'Unknown action: ' + request.action });
            }
        } catch (error) {
            console.error('❌ Error handling message:', error);
            sendResponse({ 
                success: false, 
                error: error.message,
                language: request.language || this.languageSupport.currentLanguage
            });
        }
    }

    /**
     * Main keyword ranking function with safety wrapper
     */
    async findKeywordRankWithSafety(keyword, options = {}) {
        return await this.errorHandler.safeExecute(
            async () => {
                // Apply bot avoidance delay
                await this.botAvoidance.applyHumanLikeDelay('search');

                // Scrape results if not cached
                if (this.currentResults.length === 0) {
                    const scrapeResult = await this.serpScraper.scrapeGoogleResults();
                    if (!scrapeResult.success) {
                        throw new Error('Failed to scrape search results');
                    }
                    this.currentResults = scrapeResult.results;
                }

                // Find keyword ranking
                const rankResult = this.keywordMatcher.findKeywordRanking(
                    keyword, 
                    this.currentResults, 
                    options
                );

                // Save to search history
                if (rankResult.found) {
                    await this.searchHistory.saveSearchResult(
                        keyword, 
                        this.currentResults, 
                        rankResult
                    );
                }

                return {
                    success: true,
                    keyword: keyword,
                    ...rankResult,
                    totalResults: this.currentResults.length,
                    timestamp: Date.now()
                };
            },
            { 
                keyword, 
                operation: 'findKeywordRank',
                hasOfflineData: false 
            },
            { 
                name: 'findKeywordRank',
                timeout: 30000 
            }
        );
    }

    /**
     * Enhanced SERP scraping with safety wrapper
     */
    async scrapeGoogleResultsWithSafety() {
        return await this.errorHandler.safeExecute(
            async () => {
                const result = await this.serpScraper.scrapeGoogleResults();
                this.currentResults = result.results;
                return result;
            },
            { 
                operation: 'scrapeResults',
                isDOMError: true 
            },
            { 
                name: 'scrapeGoogleResults',
                timeout: 15000 
            }
        );
    }

    /**
     * Enhanced keyword ranking with language support
     */
    async findKeywordRankWithLanguageSupport(keyword, languageContext, options = {}) {
        return await this.errorHandler.safeExecute(
            async () => {
                console.log(`🌍 Finding keyword rank with language support: ${languageContext.language}`);
                
                // Apply language-specific bot avoidance
                const languageConfig = this.languageSupport.getLanguageConfig(languageContext.language);
                await this.botAvoidance.applyHumanLikeDelay('search');

                // Scrape results with language context
                if (this.currentResults.length === 0) {
                    const scrapeResult = await this.scrapeGoogleResultsWithLanguageSupport(languageContext);
                    if (!scrapeResult.success) {
                        throw new Error('Failed to scrape search results');
                    }
                    this.currentResults = scrapeResult.results;
                }

                // Enhanced options with language support
                const enhancedOptions = {
                    ...options,
                    language: languageContext.language,
                    country: languageContext.country,
                    encoding: languageConfig.encoding,
                    direction: languageConfig.direction,
                    enableCrossLanguageMatching: options.enableTranslation || false
                };

                // Find keyword ranking with language-aware matching
                const rankResult = this.keywordMatcher.findKeywordRanking(
                    keyword, 
                    this.currentResults, 
                    enhancedOptions
                );

                // Enhance result with language metadata
                const enhancedResult = {
                    ...rankResult,
                    language: languageContext.language,
                    country: languageContext.country,
                    domain: languageConfig.googleDomain,
                    searchMetadata: {
                        keyword: keyword,
                        language: languageContext.language,
                        encoding: languageConfig.encoding,
                        direction: languageConfig.direction,
                        autoDetected: languageContext.autoDetect,
                        timestamp: new Date().toISOString()
                    }
                };

                // Store search with language context
                await this.searchHistory.recordSearch({
                    keyword,
                    result: enhancedResult,
                    language: languageContext.language,
                    timestamp: Date.now()
                });

                return enhancedResult;
            },
            'Language-aware keyword ranking'
        );
    }

    /**
     * Enhanced Google results scraping with language support
     */
    async scrapeGoogleResultsWithLanguageSupport(languageContext) {
        return await this.errorHandler.safeExecute(
            async () => {
                console.log(`🌍 Scraping results with language support: ${languageContext.language}`);
                
                // Apply language-specific delays and behavior
                await this.botAvoidance.applyHumanLikeDelay('scrape');

                // Get language configuration
                const languageConfig = this.languageSupport.getLanguageConfig(languageContext.language);

                // Enhanced scraping options with language context
                const scrapingOptions = {
                    language: languageContext.language,
                    country: languageContext.country,
                    encoding: languageConfig.encoding,
                    direction: languageConfig.direction,
                    selectors: this.getLanguageSpecificSelectors(languageContext.language)
                };

                // Perform scraping with language awareness
                const scrapeResult = await this.serpScraper.scrapeGoogleResults(scrapingOptions);
                
                if (scrapeResult.success) {
                    // Enhance results with language metadata
                    scrapeResult.results = scrapeResult.results.map(result => ({
                        ...result,
                        language: languageContext.language,
                        country: languageContext.country,
                        encoding: languageConfig.encoding
                    }));

                    // Update current results cache
                    this.currentResults = scrapeResult.results;

                    console.log(`✅ Scraped ${scrapeResult.results.length} results for ${languageContext.language}`);
                }

                return scrapeResult;
            },
            'Language-aware SERP scraping'
        );
    }

    /**
     * Get language-specific selectors for better scraping accuracy
     */
    getLanguageSpecificSelectors(language) {
        const baseSelectors = this.serpScraper.resultSelectors;
        
        // Language-specific selector enhancements
        const languageSelectors = {
            'ja-JP': {
                // Japanese-specific selectors might need special handling
                ...baseSelectors,
                organicResults: [
                    ...baseSelectors.organicResults,
                    '.g .LC20lb', // Japanese Google specific
                ]
            },
            'zh-CN': {
                // Chinese-specific selectors
                ...baseSelectors,
                organicResults: [
                    ...baseSelectors.organicResults,
                    '.g .LC20lb', // Chinese Google specific
                ]
            },
            'ar-SA': {
                // Arabic-specific selectors (RTL layout)
                ...baseSelectors,
                direction: 'rtl'
            }
        };

        return languageSelectors[language] || baseSelectors;
    }

    /**
     * Enhanced system report with language information
     */
    getSystemReportWithLanguageInfo() {
        const baseReport = this.getSystemReport();
        const languageContext = this.languageSupport.getCurrentContext();
        
        return {
            ...baseReport,
            language: {
                current: languageContext.language,
                country: languageContext.country,
                domain: languageContext.config.googleDomain,
                supported: this.languageSupport.getSupportedLanguages(),
                browserLanguage: navigator.language,
                browserLanguages: navigator.languages || [],
                encoding: languageContext.config.encoding,
                direction: languageContext.config.direction
            },
            timestamp: new Date().toISOString()
        };
    }

    // ============================================================================
    // ENHANCED KEYWORD MATCHING (Delegated to KeywordMatcher)
    // ============================================================================

    findKeywordRanking(keyword, results, options = {}) {
        return this.keywordMatcher.findKeywordRanking(keyword, results, options);
    }

    // ============================================================================
    // RANK POSITION DETECTION (Enhanced)
    // ============================================================================

    detectKeywordPosition(keyword, results, options = {}) {
        const rankResult = this.keywordMatcher.findKeywordRanking(keyword, results, options);
        
        if (!rankResult.found) {
            return {
                found: false,
                position: null,
                analysis: {
                    totalResults: results.length,
                    searchComplexity: this.calculateSearchComplexity(results),
                    competitionLevel: 'unknown'
                }
            };
        }

        return {
            found: true,
            position: rankResult.position,
            confidence: rankResult.confidence,
            matchType: rankResult.matchType,
            analysis: {
                totalResults: results.length,
                searchComplexity: this.calculateSearchComplexity(results),
                competitionLevel: this.analyzeCompetitionLevel(rankResult, results),
                bestPosition: rankResult.position,
                alternativePositions: rankResult.matches.map(m => m.position).slice(1, 4)
            }
        };
    }

    calculateSearchComplexity(results) {
        // Analyze the complexity of the search results
        const hasAds = results.some(r => r.type === 'advertisement');
        const hasFeaturedSnippets = results.some(r => r.type === 'featured_snippet');
        const hasKnowledgePanel = results.some(r => r.type === 'knowledge_panel');
        
        let complexity = 'low';
        
        if (hasAds && hasFeaturedSnippets) complexity = 'high';
        else if (hasAds || hasFeaturedSnippets || hasKnowledgePanel) complexity = 'medium';
        
        return complexity;
    }

    analyzeCompetitionLevel(rankResult, results) {
        const position = rankResult.position;
        const confidence = rankResult.confidence;
        
        if (position <= 3 && confidence > 0.9) return 'low';
        if (position <= 10 && confidence > 0.7) return 'medium';
        if (position <= 20) return 'high';
        return 'very_high';
    }

    generatePositionRecommendations(analysis, positionResults) {
        const recommendations = [];
        
        if (!positionResults.found) {
            recommendations.push('Keyword not found in current results - consider long-tail variations');
            recommendations.push('Check if keyword appears on subsequent pages');
        } else if (positionResults.position > 10) {
            recommendations.push('Position beyond first page - optimize content for this keyword');
            recommendations.push('Consider competitor analysis for top-ranking pages');
        } else if (positionResults.position <= 3) {
            recommendations.push('Excellent position - monitor for ranking changes');
            recommendations.push('Consider expanding content for related keywords');
        }
        
        if (analysis.competitionLevel === 'high') {
            recommendations.push('High competition detected - focus on long-tail keywords');
        }
        
        return recommendations;
    }

    /**
     * Quick position detection for simple checks
     */
    getQuickPosition(keyword, results, options = {}) {
        return this.keywordMatcher.getQuickPosition(keyword, results, options);
    }

    /**
     * Batch position detection for multiple keywords
     */
    detectMultipleKeywordPositions(keywords, results, options = {}) {
        return this.keywordMatcher.detectMultipleKeywordPositions(keywords, results, options);
    }

    // ============================================================================
    // SYSTEM REPORTING AND UTILITIES
    // ============================================================================

    getSystemReport() {
        return {
            timestamp: Date.now(),
            modules: {
                serpScraper: {
                    currentResults: this.currentResults.length,
                    lastScrape: this.serpScraper.lastScrapeTime || null
                },
                keywordMatcher: {
                    status: 'active',
                    options: this.keywordMatcher.matchingOptions
                },
                botAvoidance: this.botAvoidance.getBotAvoidanceReport(),
                errorHandler: this.errorHandler.getErrorReport(),
                searchHistory: {
                    stats: this.searchHistory.getHistoryStats(),
                    settings: this.searchHistory.getSettings()
                }
            },
            performance: {
                memoryUsage: performance.memory ? {
                    used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                    total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                    limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
                } : null
            }
        };
    }

    // ============================================================================
    // LEGACY COMPATIBILITY FUNCTIONS
    // ============================================================================

    async safeExecute(operation, context = {}, options = {}) {
        return await this.errorHandler.safeExecute(operation, context, options);
    }

    async handleError(operation, error, context = {}) {
        return await this.errorHandler.handleError(operation, error, context);
    }

    getCachedData(context) {
        return this.serpScraper.scrapingCache.get(context.cacheKey) || null;
    }

    clearCache() {
        this.serpScraper.clearCache();
        this.currentResults = [];
    }

    // Expose individual modules for direct access if needed
    getSerpScraper() { return this.serpScraper; }
    getKeywordMatcher() { return this.keywordMatcher; }
    getBotAvoidance() { return this.botAvoidance; }
    getErrorHandler() { return this.errorHandler; }
    getSearchHistory() { return this.searchHistory; }

    /**
     * Get current Google search query from the page
     */
    getCurrentSearchQuery() {
        try {
            // Method 1: Try getting from search input
            const searchInput = document.querySelector('input[name="q"]');
            if (searchInput && searchInput.value) {
                return searchInput.value.trim();
            }

            // Method 2: Try getting from URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const queryParam = urlParams.get('q');
            if (queryParam) {
                return decodeURIComponent(queryParam).trim();
            }

            // Method 3: Try getting from page title
            const title = document.title;
            if (title && title.includes(' - Google Search')) {
                return title.replace(' - Google Search', '').trim();
            }

            return 'Current search results';
        } catch (error) {
            console.warn('Could not extract search query:', error);
            return 'Current search results';
        }
    }

    /**
     * Verify if the page is ready for scraping
     */
    verifyPageReady() {
        try {
            // Check if basic Google search elements exist
            const searchResults = document.querySelector('#search');
            const resultStats = document.querySelector('#result-stats');
            const hasResults = document.querySelectorAll('[data-hveid]').length > 0;

            return !!(searchResults && (resultStats || hasResults));
        } catch (error) {
            console.warn('Error verifying page readiness:', error);
            return false;
        }
    }

    /**
     * Scrape and analyze current page results for keyword ranking
     */
    async scrapeCurrentPageResults(keyword, currentSearchQuery, options = {}) {
        try {
            console.log(`� Starting scrapeCurrentPageResults for keyword: "${keyword}"`);
            console.log(`🔍 Current search query: "${currentSearchQuery}"`);
            console.log(`⚙️  Options:`, options);
            
            // Apply bot avoidance delay
            await this.botAvoidance.applyHumanLikeDelay('scrape');

            // Get language context
            const languageContext = {
                language: this.languageSupport.currentLanguage,
                country: this.languageSupport.currentCountry,
                autoDetect: true
            };
            console.log(`🌍 Language context:`, languageContext);

            // Enhanced scraping options
            const scrapingOptions = {
                maxResults: options.maxResults || 100,
                includeAds: false,
                includeSnippets: true,
                language: languageContext.language,
                fuzzyMatching: options.fuzzyMatching !== false,
                highlightResults: options.highlightResults === true
            };
            console.log(`📋 Scraping options:`, scrapingOptions);

            // Scrape current page results
            console.log(`🔍 About to scrape Google results...`);
            const scrapeResult = await this.serpScraper.scrapeGoogleResults({
                ...scrapingOptions,
                addPositionNumbers: true // Always add position numbers when scraping
            });
            console.log(`📊 Scrape result:`, scrapeResult);
            
            if (!scrapeResult.success) {
                throw new Error(scrapeResult.error || 'Failed to scrape search results');
            }

            console.log(`✅ Successfully scraped ${scrapeResult.results.length} results`);
            console.log(`📋 Sample results (first 3):`, scrapeResult.results.slice(0, 3));

            // Find keyword ranking in results
            console.log(`🎯 About to find keyword ranking for: "${keyword}"`);
            const rankingResult = this.keywordMatcher.findKeywordRanking(
                keyword, 
                scrapeResult.results, 
                {
                    fuzzyMatching: scrapingOptions.fuzzyMatching,
                    matchThreshold: options.matchThreshold || 0.8,
                    language: languageContext.language
                }
            );
            console.log(`🎯 Ranking result:`, rankingResult);

            // Save search to history if successful
            if (rankingResult.found) {
                console.log(`💾 Saving to search history...`);
                await this.searchHistory.saveSearchResult(
                    keyword,
                    scrapeResult.results,
                    {
                        found: rankingResult.found,
                        position: rankingResult.position,
                        matchType: rankingResult.matchedIn,
                        confidence: rankingResult.confidence,
                        fuzzy: rankingResult.fuzzy || false
                    }
                );
            } else {
                console.log(`❌ No ranking found - not saving to history`);
            }

            return {
                success: true,
                ranking: {
                    found: rankingResult.found,
                    position: rankingResult.position,
                    matchedIn: rankingResult.matchedIn || 'unknown',
                    confidence: rankingResult.confidence || 'medium',
                    fuzzy: rankingResult.fuzzy || false
                },
                totalResults: scrapeResult.results.length,
                searchQuery: currentSearchQuery,
                keyword: keyword,
                timestamp: Date.now(),
                language: languageContext.language
            };

        } catch (error) {
            console.error('❌ Error in scrapeCurrentPageResults:', error);
            return {
                success: false,
                error: error.message,
                ranking: { found: false },
                totalResults: 0
            };
        }
    }

    // ============================================================================
    // POSITION NUMBERING METHODS
    // ============================================================================

    /**
     * Add position numbers to search results on the page
     */
    addPositionNumbersToPage() {
        try {
            console.log('🔢 Adding position numbers to current page...');
            const containers = this.serpScraper.findResultContainers();
            this.serpScraper.addPositionNumbersToResults(containers);
            return true;
        } catch (error) {
            console.error('❌ Error adding position numbers:', error);
            return false;
        }
    }

    /**
     * Remove position numbers from search results on the page
     */
    removePositionNumbersFromPage() {
        try {
            console.log('🗑️ Removing position numbers from current page...');
            this.serpScraper.removePositionNumbers();
            return true;
        } catch (error) {
            console.error('❌ Error removing position numbers:', error);
            return false;
        }
    }

    /**
     * Toggle position numbers on/off
     */
    togglePositionNumbers() {
        try {
            const existingNumbers = document.querySelectorAll('.krf-position-number');
            if (existingNumbers.length > 0) {
                this.removePositionNumbersFromPage();
                return false; // Disabled
            } else {
                this.addPositionNumbersToPage();
                return true; // Enabled
            }
        } catch (error) {
            console.error('❌ Error toggling position numbers:', error);
            return false;
        }
    }
}

// Initialize the scraper
const scraper = new GoogleSERPScraper();

// ============================================================================
// STANDALONE FUNCTIONS FOR BACKWARD COMPATIBILITY
// ============================================================================

function findKeywordRank(keyword, results, options = {}) {
    return scraper.findKeywordRanking(keyword, results, options);
}

function detectKeywordPosition(keyword, results, options = {}) {
    return scraper.detectKeywordPosition(keyword, results, options);
}

function getQuickPosition(keyword, results, options = {}) {
    return scraper.getQuickPosition(keyword, results, options);
}

function analyzeCompetition(keyword, results, options = {}) {
    const exact = scraper.findKeywordRanking(keyword, results, { ...options, fuzzyMatching: false });
    const fuzzy = scraper.findKeywordRanking(keyword, results, { ...options, fuzzyMatching: true });
    const positions = scraper.detectKeywordPosition(keyword, results, options);
    
    return {
        exactMatch: exact,
        fuzzyMatch: fuzzy,
        positionAnalysis: positions,
        competition: {
            totalResults: results.length,
            foundExact: exact.found,
            foundFuzzy: fuzzy.found,
            bestPosition: positions.analysis?.bestPosition || null,
            difficulty: exact.found ? 'high' : fuzzy.found ? 'medium' : 'low',
            competitionLevel: positions.analysis?.competitionLevel || 'unknown'
        }
    };
}

console.log('✅ Enhanced Keyword Rank Finder content script loaded successfully!');
