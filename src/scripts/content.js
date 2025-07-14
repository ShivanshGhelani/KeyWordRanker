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
        this.setupMessageListener();
        this.initializeModules();
        
        // Auto-enhance Google search results if on search page
        if (this.isGoogleSearchPage()) {
            // Wait a bit for page to load, then enhance
            setTimeout(() => {
                this.autoEnhanceGoogleResults();
            }, 1000);
            
            // Force show position numbers immediately as a backup
            setTimeout(() => {
                this.addPositionNumbersToPage();
            }, 2000);
        }
    }

    async initializeModules() {
        try {
            // All modules are already initialized in their constructors
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

                case 'autoEnhanceResults':
                    const enhanceResult = await this.autoEnhanceGoogleResults();
                    sendResponse({ success: enhanceResult, message: 'Auto-enhancement toggled' });
                    break;

                case 'enhanceSearchURL':
                    await this.enhanceSearchURL();
                    sendResponse({ success: true, message: 'Search URL enhanced' });
                    break;

                case 'enhanceCurrentPageImmediately':
                    const immediateResult = this.enhanceCurrentPageImmediately();
                    sendResponse({ success: immediateResult, message: 'Page enhanced immediately' });
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
            // Apply bot avoidance delay
            await this.botAvoidance.applyHumanLikeDelay('scrape');

            // Get language context
            const languageContext = {
                language: this.languageSupport.currentLanguage,
                country: this.languageSupport.currentCountry,
                autoDetect: true
            };

            // Enhanced scraping options
            const scrapingOptions = {
                maxResults: options.maxResults || 100,
                includeAds: false,
                includeSnippets: true,
                language: languageContext.language,
                fuzzyMatching: options.fuzzyMatching !== false,
                highlightResults: options.highlightResults === true
            };

            // Scrape current page results
            const scrapeResult = await this.serpScraper.scrapeGoogleResults({
                ...scrapingOptions,
                addPositionNumbers: true // Always add position numbers when scraping
            });
            
            if (!scrapeResult.success) {
                throw new Error(scrapeResult.error || 'Failed to scrape search results');
            }

            // Find keyword ranking in results
            const rankingResult = this.keywordMatcher.findKeywordRanking(
                keyword, 
                scrapeResult.results, 
                {
                    fuzzyMatching: scrapingOptions.fuzzyMatching,
                    matchThreshold: options.matchThreshold || 0.8,
                    language: languageContext.language
                }
            );

            // Save search to history if successful
            if (rankingResult.found) {
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

    /**
     * Auto-enhance Google search results by modifying URL and page behavior
     */
    async autoEnhanceGoogleResults() {
        try {
            // Check if we're on Google search results page
            if (!this.isGoogleSearchPage()) {
                return false;
            }

            // Get current settings
            const settings = await this.getExtensionSettings();
            if (!settings.autoEnhanceResults) {
                return false;
            }

            // Enhance URL to show more results
            await this.enhanceSearchURL();
            
            // Enhance page DOM
            this.enhanceSearchResultsDOM();
            
            // Auto-add position numbers by default when extension is active
            setTimeout(() => {
                this.addPositionNumbersToPage();
            }, 1500); // Wait a bit for page to stabilize after enhancement
            
            return true;
            
        } catch (error) {
            console.error('❌ Error auto-enhancing Google results:', error);
            return false;
        }
    }

    /**
     * Modify current search URL to show more results
     */
    async enhanceSearchURL() {
        const currentUrl = new URL(window.location.href);
        const params = currentUrl.searchParams;
        
        // Check if we need to modify the URL
        const currentNum = params.get('num') || '10';
        const targetNum = '1000'; // Show 1000 results per page for comprehensive ranking
        
        if (currentNum !== targetNum) {
            // Update URL parameters
            params.set('num', targetNum);
            
            // Update URL without page refresh using history API
            const newUrl = currentUrl.toString();
            window.history.replaceState({}, '', newUrl);
            
            // If the page hasn't loaded with 1000 results, we need to reload
            const resultElements = document.querySelectorAll(this.getOrganicResultSelectors());
            if (resultElements.length < 50) { // If we have less than 50 results, reload to get more
                window.location.href = newUrl;
                return;
            }
        }
    }

    /**
     * Enhance the search results DOM for better UX
     */
    enhanceSearchResultsDOM() {
        try {
            // Add enhancement indicator
            this.addEnhancementIndicator();
            
            // Improve navigation for large result sets
            this.enhanceResultsNavigation();
            
        } catch (error) {
            console.error('❌ Error enhancing search results DOM:', error);
        }
    }

    /**
     * Add visual indicator that results are enhanced
     */
    addEnhancementIndicator() {
        // Remove existing indicator
        const existingIndicator = document.querySelector('.rank-finder-enhancement-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }

        // Create new indicator
        const indicator = document.createElement('div');
        indicator.className = 'rank-finder-enhancement-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #2563eb;
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
            z-index: 10000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            animation: fadeInOut 4s ease-in-out;
        `;
        indicator.innerHTML = `
            <div style="display: flex; align-items: center; gap: 6px;">
                <span>🔍</span>
                <span>Enhanced Results (1000 per page)</span>
            </div>
        `;

        // Add fade animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translateY(-10px); }
                15% { opacity: 1; transform: translateY(0); }
                85% { opacity: 1; transform: translateY(0); }
                100% { opacity: 0; transform: translateY(-10px); }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(indicator);

        // Remove after animation
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.remove();
            }
        }, 4000);
    }

    /**
     * Enhance navigation for large result sets
     */
    enhanceResultsNavigation() {
        // Add "Jump to" navigation for large result sets
        const organicResults = this.getOrganicResults();
        const resultCount = organicResults.length;
        
        if (resultCount > 50) {
            this.addJumpToNavigation(resultCount);
        }
    }

    /**
     * Add jump-to navigation for large result sets
     */
    addJumpToNavigation(resultCount) {
        // Remove existing navigation
        const existingNav = document.querySelector('.rank-finder-jump-nav');
        if (existingNav) {
            existingNav.remove();
        }

        // Create jump navigation
        const jumpNav = document.createElement('div');
        jumpNav.className = 'rank-finder-jump-nav';
        jumpNav.style.cssText = `
            position: fixed;
            left: 10px;
            top: 50%;
            transform: translateY(-50%);
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            z-index: 9999;
            max-height: 300px;
            overflow-y: auto;
        `;

        const title = document.createElement('div');
        title.textContent = 'Jump to Position';
        title.style.cssText = `
            font-weight: 600;
            font-size: 12px;
            color: #374151;
            margin-bottom: 8px;
            border-bottom: 1px solid #f3f4f6;
            padding-bottom: 6px;
        `;
        jumpNav.appendChild(title);

        // Add jump buttons for every 10 results
        for (let i = 1; i <= resultCount; i += 10) {
            const endRange = Math.min(i + 9, resultCount);
            const button = document.createElement('button');
            button.textContent = `${i}-${endRange}`;
            button.style.cssText = `
                display: block;
                width: 100%;
                padding: 4px 8px;
                margin: 2px 0;
                border: 1px solid #e5e7eb;
                border-radius: 4px;
                background: white;
                color: #374151;
                font-size: 11px;
                cursor: pointer;
                transition: all 0.15s ease;
            `;
            
            button.addEventListener('mouseenter', () => {
                button.style.background = '#f3f4f6';
                button.style.borderColor = '#2563eb';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.background = 'white';
                button.style.borderColor = '#e5e7eb';
            });

            button.addEventListener('click', () => {
                this.scrollToResult(i);
            });

            jumpNav.appendChild(button);
        }

        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = `
            position: absolute;
            top: 4px;
            right: 6px;
            border: none;
            background: transparent;
            color: #9ca3af;
            font-size: 14px;
            cursor: pointer;
            width: 16px;
            height: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        closeBtn.addEventListener('click', () => {
            jumpNav.remove();
        });

        jumpNav.appendChild(closeBtn);
        document.body.appendChild(jumpNav);

        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (jumpNav.parentNode) {
                jumpNav.style.transition = 'opacity 0.3s ease';
                jumpNav.style.opacity = '0';
                setTimeout(() => jumpNav.remove(), 300);
            }
        }, 10000);
    }

    /**
     * Scroll to specific result position
     */
    scrollToResult(position) {
        const organicResults = this.getOrganicResults();
        const targetResult = organicResults[position - 1];
        
        if (targetResult) {
            targetResult.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            
            // Highlight the target result briefly
            const originalStyle = targetResult.style.cssText;
            targetResult.style.cssText += `
                outline: 2px solid #2563eb;
                outline-offset: 4px;
                transition: outline 0.3s ease;
            `;
            
            setTimeout(() => {
                targetResult.style.cssText = originalStyle;
            }, 2000);
        }
    }

    /**
     * Check if current page is Google search results
     */
    isGoogleSearchPage() {
        return window.location.hostname.includes('google.') && 
               window.location.pathname === '/search' &&
               window.location.search.includes('q=');
    }

    /**
     * Get extension settings from storage
     */
    async getExtensionSettings() {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                const result = await chrome.storage.local.get({
                    autoEnhanceResults: true,
                    showPositionNumbers: true,
                    saveHistory: true,
                    openInNewTab: false
                });
                return result;
            }
            
            // Fallback to localStorage
            return {
                autoEnhanceResults: localStorage.getItem('autoEnhanceResults') !== 'false',
                showPositionNumbers: localStorage.getItem('showPositionNumbers') !== 'false',
                saveHistory: localStorage.getItem('saveHistory') !== 'false',
                openInNewTab: localStorage.getItem('openInNewTab') === 'true'
            };
        } catch (error) {
            console.error('Error getting extension settings:', error);
            return {
                autoEnhanceResults: true,
                showPositionNumbers: true,
                saveHistory: true,
                openInNewTab: false
            };
        }
    }

    /**
     * Get precise organic result selectors that exclude ads, PAA, etc.
     */
    getOrganicResultSelectors() {
        // More precise selectors for organic results only
        return [
            // Main organic results container
            '#search div[data-hveid] h3 a[href*="/url?"]',
            '#search div[data-hveid] h3 a[href]:not([href*="googleadservices"]):not([href*="/aclk?"])',
            '.g:not(.ads-visurl):not(.ads-fr) h3 a',
            '.tF2Cxc h3 a', // Standard organic result title links
            '.yuRUbf h3 a', // Another common organic result selector
            // Exclude specific non-organic elements
            ':not(.ads-visurl) .yuRUbf a',
            ':not(.commercial-unit-desktop-top) .tF2Cxc h3 a'
        ].join(', ');
    }

    /**
     * Get only organic search results (exclude ads, PAA, etc.)
     */
    getOrganicResults() {
        // Multiple selector strategies to get only organic results
        const organicSelectors = [
            // Primary organic result containers
            '.tF2Cxc', // Standard result container
            '.g:not(.ads-visurl):not(.ads-fr):not(.commercial-unit-desktop-top)', // Exclude ad containers
            '.srg .g:not(.ads-visurl)', // Results in search results group, not ads
            
            // More specific organic containers
            '#search .g[data-hveid]:not(.ads-visurl):not(.commercial-unit-desktop-top)',
            '.MjjYud', // Another organic result container
            
            // Fallback selectors
            '[data-sokoban-container] .g:not(.ads-visurl)',
            '.hlcw0c' // Organic result wrapper
        ];

        let organicResults = [];
        
        for (const selector of organicSelectors) {
            const results = Array.from(document.querySelectorAll(selector));
            
            // Filter out non-organic results
            const filtered = results.filter(result => {
                // Exclude if contains ad indicators
                if (result.querySelector('.ads-visurl, .commercial-unit-desktop-top, .pla-unit')) {
                    return false;
                }
                
                // Exclude "People also ask" sections
                if (result.closest('[data-initq], .related-question-pair, .kp-blk')) {
                    return false;
                }
                
                // Exclude knowledge panels and rich snippets that aren't organic
                if (result.closest('.kp-wholepage, .knowledge-panel, .sports-template')) {
                    return false;
                }
                
                // Must have a title link to be considered organic
                const titleLink = result.querySelector('h3 a, .LC20lb a, [role="heading"] a');
                if (!titleLink) {
                    return false;
                }
                
                // Link must not be an ad link
                const href = titleLink.href || '';
                if (href.includes('googleadservices') || href.includes('/aclk?') || href.includes('shopping.google')) {
                    return false;
                }
                
                return true;
            });
            
            if (filtered.length > organicResults.length) {
                organicResults = filtered;
            }
        }
        
        // Remove duplicates based on title links
        const uniqueResults = [];
        const seenUrls = new Set();
        
        organicResults.forEach(result => {
            const titleLink = result.querySelector('h3 a, .LC20lb a, [role="heading"] a');
            if (titleLink && titleLink.href && !seenUrls.has(titleLink.href)) {
                seenUrls.add(titleLink.href);
                uniqueResults.push(result);
            }
        });
        
        return uniqueResults;
    }

    /**
     * Immediately enhance current Google search page (like the JavaScript bookmark)
     */
    enhanceCurrentPageImmediately() {
        try {
            if (!this.isGoogleSearchPage()) {
                return false;
            }
            
            // Use the same logic as the JavaScript bookmark
            const searchParams = new URLSearchParams(window.location.search);
            searchParams.set('num', '1000');
            window.location.search = searchParams.toString();
            
            return true;
            
        } catch (error) {
            console.error('❌ Error enhancing current page immediately:', error);
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
