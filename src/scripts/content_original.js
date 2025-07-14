/**
 * Content Script for Keyword Rank Finder Chrome Extension - ENHANCED
 * Injected into Google Search pages to scrape and analyze SERP data
 * Task 8 Complete: Enhanced Rank Position Detection
 */

class GoogleSERPScraper {
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
        
        // Bot detection avoidance initialization
        this.botAvoidance = {
            requestHistory: [],
            lastRequestTime: 0,
            consecutiveRequests: 0,
            userAgentRotation: this.initializeUserAgents(),
            behaviorPatterns: this.initializeBehaviorPatterns(),
            sessionData: {
                startTime: Date.now(),
                requestCount: 0,
                averageDelay: 0,
                suspiciousActivity: false
            }
        };
        
        // Error handling system initialization
        this.errorHandler = {
            errorCounts: {},
            maxRetries: 3,
            retryDelays: [1000, 2000, 4000], // Progressive backoff
            errorCategories: {
                NETWORK: 'network',
                DOM: 'dom',
                PARSING: 'parsing',
                VALIDATION: 'validation',
                TIMEOUT: 'timeout',
                BOT_DETECTION: 'bot_detection',
                UNKNOWN: 'unknown'
            },
            fallbackStrategies: {},
            errorLog: []
        };
        
        this.init();
    }
    
    init() {
        console.log('🔥 Enhanced Keyword Rank Finder: Content script loaded on:', window.location.href);
        this.setupMessageListener();
        this.observePageChanges();
        this.sendReadySignal();
        
        // Initialize bot avoidance mechanisms
        this.initializeBotAvoidance();
        
        // Initialize error handling
        this.initializeErrorHandling();
        
        // Initialize search history (Task 11)
        this.initializeSearchHistory();
        
        // Initialize search history
        this.initializeSearchHistory();
    }
    
    sendReadySignal() {
        try {
            chrome.runtime.sendMessage({ 
                action: 'contentScriptReady', 
                url: window.location.href,
                timestamp: Date.now(),
                enhanced: true,
                version: '2.0'
            });
        } catch (error) {
            // Ignore errors - popup might not be open
        }
    }
    
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            console.log('📨 Enhanced content script received message:', request);
            
            switch (request.action) {
                case 'scrapeResults':
                case 'scrapeCurrentPageResults':
                    this.handleScrapeRequest(request, sendResponse);
                    return true;
                    
                case 'getCurrentSearchQuery':
                    this.handleGetCurrentSearchQuery(request, sendResponse);
                    return true;
                    
                case 'detectPosition':
                    this.handlePositionDetection(request, sendResponse);
                    return true;
                    
                case 'detectMultiplePositions':
                    this.handleMultiplePositionDetection(request, sendResponse);
                    return true;
                    
                case 'ping':
                    sendResponse({ 
                        status: 'alive', 
                        timestamp: Date.now(),
                        url: window.location.href,
                        enhanced: true
                    });
                    break;
                    
                default:
                    console.warn('Unknown action:', request.action);
                    sendResponse({ error: 'Unknown action' });
            }
        });
    }
    
    async handleScrapeRequest(request, sendResponse) {
        try {
            const keyword = request.keyword;
            const options = request.options || {};
            const isCurrentPageAnalysis = request.action === 'scrapeCurrentPageResults';
            
            console.log(`🎯 Enhanced keyword analysis for: "${keyword}"`);
            
            // Apply sophisticated bot detection avoidance (Task 9)
            if (isCurrentPageAnalysis) {
                await this.applyHumanLikeDelay('search', [500, 1500]);
                
                // Add random human-like behaviors
                if (Math.random() < 0.2) { // 20% chance
                    await this.applyStealthBehaviors();
                }
            } else {
                await this.applyHumanLikeDelay('navigate', [800, 2000]);
            }
            
            // Get current search query
            const currentSearchQuery = this.extractCurrentSearchQuery();
            
            // Scrape search results
            const results = this.scrapeSearchResults(options);
            
            // Apply result limit
            const maxResults = options.maxResults || 100;
            const limitedResults = results.slice(0, maxResults);
            
            // Enhanced keyword ranking with new algorithm
            const ranking = this.findKeywordRanking(keyword, limitedResults, options);
            
            // Enhanced position detection (Task 8)
            const positionDetection = this.detectKeywordPosition(keyword, limitedResults, options);
            
            // Metadata
            const metadata = {
                currentSearchQuery: currentSearchQuery,
                isCurrentPageAnalysis: isCurrentPageAnalysis,
                scrapedAt: new Date().toISOString(),
                totalFound: results.length,
                limitApplied: maxResults,
                pageUrl: window.location.href,
                enhanced: true,
                algorithmVersion: '2.0',
                positionDetectionEnabled: true
            };
            
            sendResponse({
                success: true,
                keyword: keyword,
                ranking: ranking,
                positionDetection: positionDetection,
                totalResults: limitedResults.length,
                results: limitedResults.slice(0, 10),
                metadata: metadata,
                currentSearchQuery: currentSearchQuery
            });
        } catch (error) {
            console.error('💥 Error in enhanced scraping:', error);
            sendResponse({
                success: false,
                error: error.message,
                details: {
                    keyword: request.keyword,
                    url: window.location.href,
                    timestamp: new Date().toISOString(),
                    enhanced: true
                }
            });
        }
    }
    
    async handleGetCurrentSearchQuery(request, sendResponse) {
        try {
            const searchQuery = this.extractCurrentSearchQuery();
            sendResponse({
                success: true,
                searchQuery: searchQuery,
                url: window.location.href
            });
        } catch (error) {
            console.error('Error getting current search query:', error);
            sendResponse({
                success: false,
                error: error.message,
                searchQuery: 'Unknown search'
            });
        }
    }
    
    extractCurrentSearchQuery() {
        // Method 1: Get from URL parameters
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const query = urlParams.get('q');
            if (query) {
                return decodeURIComponent(query);
            }
        } catch (error) {
            console.warn('Could not extract query from URL:', error);
        }
        
        // Method 2: Get from search input field
        try {
            const searchInput = document.querySelector('input[name="q"]');
            if (searchInput && searchInput.value) {
                return searchInput.value;
            }
        } catch (error) {
            console.warn('Could not extract query from input field:', error);
        }
        
        // Method 3: Get from page title
        try {
            const title = document.title;
            if (title && title.includes(' - Google Search')) {
                return title.replace(' - Google Search', '');
            }
        } catch (error) {
            console.warn('Could not extract query from page title:', error);
        }
        
        return 'Current search results';
    }
    
    scrapeSearchResults(options = {}) {
        const results = [];
        
        try {
            console.log('🔍 Starting enhanced SERP scraping');
            
            // Get result containers
            let resultElements = this.getResultContainers();
            
            if (resultElements.length === 0) {
                console.warn('⚠️ No result containers found, trying fallback');
                resultElements = this.getFallbackResults();
            }
            
            console.log(`✅ Found ${resultElements.length} result containers`);
            
            // Process each container
            resultElements.forEach((container, index) => {
                try {
                    const result = this.extractResultData(container, index + 1, options);
                    
                    if (result && this.isValidResult(result, options)) {
                        results.push(result);
                    }
                } catch (error) {
                    console.warn(`⚠️ Error processing result ${index + 1}:`, error);
                }
            });
            
            console.log(`🎯 Successfully scraped ${results.length} results`);
            this.currentResults = results;
            return results;
            
        } catch (error) {
            console.error('💥 Error in SERP scraping:', error);
            return this.currentResults;
        }
    }
    
    getResultContainers() {
        for (const selector of this.resultSelectors.resultContainers) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                console.log(`📋 Using container selector: ${selector} (${elements.length} elements)`);
                return Array.from(elements);
            }
        }
        return [];
    }
    
    getFallbackResults() {
        console.log('🔄 Trying fallback result extraction');
        
        // Fallback 1: h3 elements
        let elements = document.querySelectorAll('h3');
        if (elements.length > 0) {
            const filtered = Array.from(elements).filter(h3 => {
                const parent = h3.closest('div');
                return parent && parent.querySelector('a');
            }).map(h3 => h3.closest('div'));
            
            if (filtered.length > 0) {
                console.log(`📋 Fallback found ${filtered.length} results via h3 elements`);
                return filtered;
            }
        }
        
        // Fallback 2: Data attributes
        elements = document.querySelectorAll('div[data-ved], div[data-hveid]');
        if (elements.length > 0) {
            console.log(`📋 Fallback found ${elements.length} results via data attributes`);
            return Array.from(elements);
        }
        
        return [];
    }
    
    extractResultData(container, position, options = {}) {
        const result = {
            position: position,
            title: '',
            url: '',
            snippet: '',
            element: container,
            type: this.resultTypes.ORGANIC,
            metadata: {
                scrapedAt: Date.now(),
                confidence: 0
            }
        };
        
        // Extract title
        result.title = this.extractTitle(container);
        
        // Extract URL  
        result.url = this.extractUrl(container);
        
        // Extract snippet
        result.snippet = this.extractSnippet(container);
        
        // Calculate confidence
        result.metadata.confidence = this.calculateConfidence(result);
        
        return result;
    }
    
    extractTitle(container) {
        const titleSelectors = ['h3', '[role="heading"]', '.LC20lb'];
        
        for (const selector of titleSelectors) {
            const element = container.querySelector(selector);
            if (element && element.textContent.trim()) {
                return element.textContent.trim();
            }
        }
        
        return '';
    }
    
    extractUrl(container) {
        for (const selector of this.resultSelectors.urls) {
            const element = container.querySelector(selector);
            if (element && element.href) {
                return element.href;
            }
        }
        
        return '';
    }
    
    extractSnippet(container) {
        for (const selector of this.resultSelectors.snippets) {
            const element = container.querySelector(selector);
            if (element && element.textContent.trim()) {
                return element.textContent.trim();
            }
        }
        
        return '';
    }
    
    calculateConfidence(result) {
        let confidence = 0;
        
        if (result.title) confidence += 40;
        if (result.url) confidence += 30;
        if (result.snippet) confidence += 30;
        
        return confidence;
    }
    
    isValidResult(result, options) {
        return result.title && result.title.length > 0;
    }
    
    async addRandomDelay(min, max) {
        const delay = Math.floor(Math.random() * (max - min + 1)) + min;
        return new Promise(resolve => setTimeout(resolve, delay));
    }
    
    observePageChanges() {
        // Simple observer for dynamic content
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length > 0) {
                    // Clear cache when page content changes
                    this.scrapingCache.clear();
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // ============================================================================
    // ENHANCED KEYWORD MATCHING ALGORITHM (Task 7 Complete)
    // ============================================================================

    findKeywordRanking(keyword, results, options = {}) {
        if (!keyword || !results.length) {
            return { 
                found: false, 
                position: null,
                searchedResults: 0,
                matchType: 'none',
                confidence: 0
            };
        }
        
        const matchingOptions = {
            fuzzyMatching: options.fuzzyMatching !== false,
            caseSensitive: options.caseSensitive === true,
            exactPhrase: options.exactPhrase === true,
            minWordLength: options.minWordLength || 2,
            fuzzyThreshold: options.fuzzyThreshold || 0.7,
            prioritizeTitle: options.prioritizeTitle !== false,
            includeSnippets: options.includeSnippets !== false,
            includeUrls: options.includeUrls === true,
            ...options
        };
        
        console.log(`🎯 Enhanced search for: "${keyword}" with options:`, matchingOptions);
        
        // Normalize keyword
        const normalizedKeyword = this.normalizeText(keyword, matchingOptions);
        const keywordWords = this.extractKeywordWords(normalizedKeyword, matchingOptions);
        
        console.log(`📝 Normalized: "${normalizedKeyword}"`);
        console.log(`🔤 Words:`, keywordWords);
        
        // Phase 1: Exact phrase matching (highest priority)
        if (matchingOptions.exactPhrase) {
            const exactMatch = this.findExactPhraseMatch(normalizedKeyword, results, matchingOptions);
            if (exactMatch.found) {
                console.log('🎯 Exact phrase match found:', exactMatch);
                return exactMatch;
            }
        }
        
        // Phase 2: Enhanced exact matching in titles
        const titleMatch = this.findInTitles(keywordWords, normalizedKeyword, results, matchingOptions, 'exact');
        if (titleMatch.found) {
            console.log('📰 Title match found:', titleMatch);
            return titleMatch;
        }
        
        // Phase 3: Enhanced exact matching in snippets
        if (matchingOptions.includeSnippets) {
            const snippetMatch = this.findInSnippets(keywordWords, normalizedKeyword, results, matchingOptions, 'exact');
            if (snippetMatch.found) {
                console.log('📄 Snippet match found:', snippetMatch);
                return snippetMatch;
            }
        }
        
        // Phase 4: Fuzzy matching (if enabled)
        if (matchingOptions.fuzzyMatching) {
            const fuzzyTitleMatch = this.findInTitles(keywordWords, normalizedKeyword, results, matchingOptions, 'fuzzy');
            if (fuzzyTitleMatch.found) {
                console.log('🔍 Fuzzy title match found:', fuzzyTitleMatch);
                return fuzzyTitleMatch;
            }
            
            if (matchingOptions.includeSnippets) {
                const fuzzySnippetMatch = this.findInSnippets(keywordWords, normalizedKeyword, results, matchingOptions, 'fuzzy');
                if (fuzzySnippetMatch.found) {
                    console.log('🔍 Fuzzy snippet match found:', fuzzySnippetMatch);
                    return fuzzySnippetMatch;
                }
            }
        }
        
        console.log(`❌ No matches found for: "${keyword}"`);
        return { 
            found: false, 
            position: null,
            searchedResults: results.length,
            matchType: 'none',
            confidence: 0,
            keyword: keyword,
            normalizedKeyword: normalizedKeyword,
            options: matchingOptions
        };
    }

    // ============================================================================
    // TEXT NORMALIZATION (Task 7.3) - ENHANCED
    // ============================================================================

    normalizeText(text, options = {}) {
        if (!text) return '';
        
        let normalized = text;
        
        // Basic cleaning
        normalized = normalized.replace(/<[^>]*>/g, ' '); // Remove HTML
        normalized = this.decodeHtmlEntities(normalized);
        
        // Case handling
        if (!options.caseSensitive) {
            normalized = normalized.toLowerCase();
        }
        
        // Character normalization
        normalized = this.normalizeAccentedChars(normalized);
        normalized = normalized.replace(/["""'']/g, '"');
        normalized = normalized.replace(/[‒–—―]/g, '-');
        
        // Special character handling
        if (options.preserveSpecialChars) {
            normalized = normalized.replace(/[^\w\s\-\.\@\#\$\%\&\+]/g, ' ');
        } else {
            normalized = normalized.replace(/[^\w\s\-]/g, ' ');
        }
        
        // Whitespace normalization
        normalized = normalized.replace(/\s+/g, ' ').trim();
        
        return normalized;
    }

    decodeHtmlEntities(text) {
        const entityMap = {
            '&amp;': '&', '&lt;': '<', '&gt;': '>',
            '&quot;': '"', '&#39;': "'", '&nbsp;': ' '
        };
        
        return text.replace(/&[a-zA-Z0-9#]+;/g, (entity) => {
            return entityMap[entity] || entity;
        });
    }

    normalizeAccentedChars(text) {
        const accentMap = {
            'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a',
            'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e',
            'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
            'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o',
            'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u',
            'ý': 'y', 'ÿ': 'y', 'ñ': 'n', 'ç': 'c'
        };
        
        return text.replace(/[àáâãäåèéêëìíîïòóôõöùúûüýÿñç]/g, (char) => {
            return accentMap[char] || char;
        });
    }

    extractKeywordWords(normalizedKeyword, options = {}) {
        return normalizedKeyword
            .split(' ')
            .filter(word => word.length >= options.minWordLength)
            .filter(word => !this.isStopWord(word));
    }

    isStopWord(word) {
        const stopWords = [
            'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
            'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
            'to', 'was', 'will', 'with', 'you', 'your', 'have', 'had', 'this',
            'these', 'they', 'were', 'been', 'their', 'said', 'each', 'which'
        ];
        
        return stopWords.includes(word.toLowerCase());
    }

    // ============================================================================
    // EXACT MATCHING (Task 7.1) - ENHANCED
    // ============================================================================

    findExactPhraseMatch(normalizedKeyword, results, options) {
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            
            // Check title
            const normalizedTitle = this.normalizeText(result.title, options);
            if (this.containsExactPhrase(normalizedTitle, normalizedKeyword)) {
                return this.createMatchResult(result, 'title', 'exact_phrase', 95);
            }
            
            // Check snippet
            if (options.includeSnippets && result.snippet) {
                const normalizedSnippet = this.normalizeText(result.snippet, options);
                if (this.containsExactPhrase(normalizedSnippet, normalizedKeyword)) {
                    return this.createMatchResult(result, 'snippet', 'exact_phrase', 90);
                }
            }
        }
        
        return { found: false };
    }

    containsExactPhrase(text, phrase) {
        return text.includes(phrase);
    }

    findInTitles(keywordWords, normalizedKeyword, results, options, matchType) {
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            const normalizedTitle = this.normalizeText(result.title, options);
            
            let match;
            if (matchType === 'exact') {
                match = this.exactWordMatch(normalizedTitle, keywordWords, normalizedKeyword);
            } else {
                match = this.fuzzyWordMatch(normalizedTitle, keywordWords, options);
            }
            
            if (match.isMatch) {
                const confidence = matchType === 'exact' ? 85 : 75;
                return this.createMatchResult(result, 'title', matchType, confidence, match);
            }
        }
        
        return { found: false };
    }

    findInSnippets(keywordWords, normalizedKeyword, results, options, matchType) {
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            if (!result.snippet) continue;
            
            const normalizedSnippet = this.normalizeText(result.snippet, options);
            
            let match;
            if (matchType === 'exact') {
                match = this.exactWordMatch(normalizedSnippet, keywordWords, normalizedKeyword);
            } else {
                match = this.fuzzyWordMatch(normalizedSnippet, keywordWords, options);
            }
            
            if (match.isMatch) {
                const confidence = matchType === 'exact' ? 75 : 65;
                return this.createMatchResult(result, 'snippet', matchType, confidence, match);
            }
        }
        
        return { found: false };
    }

    exactWordMatch(text, keywordWords, fullKeyword) {
        const textWords = text.split(' ');
        
        // Check if all keyword words are present
        const presentWords = keywordWords.filter(keywordWord =>
            textWords.some(textWord => textWord === keywordWord)
        );
        
        // Check for exact phrase
        const hasExactPhrase = this.containsExactPhrase(text, fullKeyword);
        
        const matchRatio = presentWords.length / keywordWords.length;
        
        let confidence = 0;
        let matchType = 'partial';
        
        if (hasExactPhrase) {
            confidence = 100;
            matchType = 'exact_phrase';
        } else if (matchRatio === 1.0) {
            confidence = 80;
            matchType = 'all_words';
        } else if (matchRatio >= 0.7) {
            confidence = 60;
            matchType = 'most_words';
        } else {
            confidence = matchRatio * 50;
            matchType = 'partial';
        }
        
        return {
            isMatch: matchRatio >= 0.5,
            matchedWords: presentWords,
            totalWords: keywordWords.length,
            matchRatio: matchRatio,
            matchType: matchType,
            confidence: confidence,
            hasExactPhrase: hasExactPhrase
        };
    }

    // ============================================================================
    // FUZZY MATCHING (Task 7.2) - ENHANCED
    // ============================================================================

    fuzzyWordMatch(text, keywordWords, options = {}) {
        const textWords = text.split(' ');
        const threshold = options.fuzzyThreshold || 0.7;
        
        let matchedWords = [];
        let partialMatches = [];
        let totalSimilarityScore = 0;
        
        keywordWords.forEach(keywordWord => {
            // Strategy 1: Exact match
            const exactMatch = textWords.find(textWord => textWord === keywordWord);
            if (exactMatch) {
                matchedWords.push({
                    keyword: keywordWord,
                    matched: exactMatch,
                    similarity: 1.0,
                    type: 'exact'
                });
                totalSimilarityScore += 1.0;
                return;
            }
            
            // Strategy 2: Fuzzy match
            const fuzzyMatch = this.findBestFuzzyMatch(keywordWord, textWords);
            if (fuzzyMatch.similarity >= threshold) {
                matchedWords.push({
                    keyword: keywordWord,
                    matched: fuzzyMatch.word,
                    similarity: fuzzyMatch.similarity,
                    type: 'fuzzy'
                });
                totalSimilarityScore += fuzzyMatch.similarity;
            } else if (fuzzyMatch.similarity > 0.4) {
                partialMatches.push(fuzzyMatch);
            }
        });
        
        const matchRatio = matchedWords.length / keywordWords.length;
        const avgSimilarity = keywordWords.length > 0 
            ? totalSimilarityScore / keywordWords.length
            : 0;
        
        return {
            isMatch: matchRatio >= threshold * 0.8,
            matchedWords: matchedWords,
            partialMatches: partialMatches,
            totalWords: keywordWords.length,
            matchRatio: matchRatio,
            avgSimilarity: avgSimilarity,
            matchType: 'fuzzy'
        };
    }

    findBestFuzzyMatch(keyword, textWords) {
        let bestMatch = { word: '', similarity: 0 };
        
        textWords.forEach(textWord => {
            const similarity = this.calculateStringSimilarity(keyword, textWord);
            if (similarity > bestMatch.similarity) {
                bestMatch = { word: textWord, similarity: similarity };
            }
        });
        
        return bestMatch;
    }

    calculateStringSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    }

    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    // ============================================================================
    // RELEVANCE SCORING (Task 7.4) - ENHANCED
    // ============================================================================

    createMatchResult(result, matchLocation, matchType, baseConfidence, matchDetails = {}) {
        let confidence = baseConfidence;
        
        // Enhanced confidence calculation
        if (matchDetails.avgSimilarity) {
            confidence = confidence * matchDetails.avgSimilarity;
        }
        
        // Location bonus
        if (matchLocation === 'title') {
            confidence += 5;
        }
        
        // Type bonus
        if (result.type === this.resultTypes.FEATURED_SNIPPET) {
            confidence += 10;
        }
        
        // Position penalty
        if (result.position > 10) {
            confidence -= 5;
        }
        
        confidence = Math.min(100, Math.max(0, confidence));
        
        return {
            found: true,
            position: result.position,
            matchedIn: matchLocation,
            matchType: matchType,
            confidence: Math.round(confidence),
            result: result,
            matchDetails: matchDetails,
            fuzzy: matchType.includes('fuzzy'),
            scoring: {
                baseConfidence: baseConfidence,
                locationBonus: matchLocation === 'title' ? 5 : 0,
                typeBonus: result.type === this.resultTypes.FEATURED_SNIPPET ? 10 : 0,
                finalConfidence: Math.round(confidence)
            },
            relevanceScore: this.calculateRelevanceScore(result, matchLocation, matchType)
        };
    }

    calculateRelevanceScore(result, matchLocation, matchType) {
        let score = 50; // Base score
        
        // Location scoring
        const locationScores = {
            'title': 25,
            'snippet': 20,
            'url': 10
        };
        score += locationScores[matchLocation] || 0;
        
        // Match type scoring
        const matchTypeScores = {
            'exact_phrase': 20,
            'exact': 15,
            'fuzzy': 8
        };
        score += matchTypeScores[matchType] || 0;
        
        // Position scoring
        score += Math.max(0, 15 - result.position);
        
        return Math.min(100, Math.max(0, Math.round(score)));
    }

    // ============================================================================
    // RANK POSITION DETECTION (Task 8) - ENHANCED
    // ============================================================================

    /**
     * Enhanced rank position detection with comprehensive result analysis
     * Returns detailed ranking information including position, confidence, and context
     */
    detectKeywordPosition(keyword, results, options = {}) {
        const detectionOptions = {
            startPosition: options.startPosition || 1,
            maxPosition: options.maxPosition || 100,
            includeMultipleMatches: options.includeMultipleMatches !== false,
            includeNearMatches: options.includeNearMatches === true,
            confidenceThreshold: options.confidenceThreshold || 60,
            ...options
        };

        console.log(`🎯 Enhanced position detection for: "${keyword}"`);
        console.log(`📊 Detection options:`, detectionOptions);

        const positionResults = {
            keyword: keyword,
            found: false,
            positions: [],
            totalSearched: results.length,
            searchRange: `${detectionOptions.startPosition}-${Math.min(detectionOptions.maxPosition, results.length)}`,
            detectionSummary: {
                exactMatches: 0,
                fuzzyMatches: 0,
                nearMatches: 0,
                highConfidenceMatches: 0
            },
            processingTime: Date.now()
        };

        // Primary position detection
        const primaryMatch = this.findKeywordRanking(keyword, results, detectionOptions);
        
        if (primaryMatch.found) {
            const positionInfo = this.createPositionInfo(primaryMatch, keyword, 'primary');
            positionResults.found = true;
            positionResults.positions.push(positionInfo);
            positionResults.primaryPosition = primaryMatch.position;
            
            // Update summary
            this.updateDetectionSummary(positionResults.detectionSummary, primaryMatch);
            
            console.log(`✅ Primary match found at position ${primaryMatch.position}`);
        }

        // Find additional matches if requested
        if (detectionOptions.includeMultipleMatches) {
            const additionalMatches = this.findAdditionalMatches(keyword, results, detectionOptions, primaryMatch);
            additionalMatches.forEach(match => {
                const positionInfo = this.createPositionInfo(match, keyword, 'additional');
                positionResults.positions.push(positionInfo);
                this.updateDetectionSummary(positionResults.detectionSummary, match);
            });
        }

        // Find near matches if requested
        if (detectionOptions.includeNearMatches) {
            const nearMatches = this.findNearMatches(keyword, results, detectionOptions);
            nearMatches.forEach(match => {
                const positionInfo = this.createPositionInfo(match, keyword, 'near');
                positionResults.positions.push(positionInfo);
                positionResults.detectionSummary.nearMatches++;
            });
        }

        // Sort positions and finalize results
        positionResults.positions.sort((a, b) => a.position - b.position);
        positionResults.processingTime = Date.now() - positionResults.processingTime;

        // Generate position analysis
        positionResults.analysis = this.generatePositionAnalysis(positionResults);

        console.log(`📊 Position detection complete:`, positionResults.analysis);
        
        return positionResults;
    }

    createPositionInfo(match, keyword, matchCategory) {
        return {
            position: match.position,
            confidence: match.confidence,
            matchType: match.matchType,
            matchedIn: match.matchedIn,
            category: matchCategory,
            result: {
                title: match.result.title,
                url: match.result.url,
                snippet: match.result.snippet,
                type: match.result.type
            },
            scoring: match.scoring || {},
            relevanceScore: match.relevanceScore || 0,
            matchDetails: match.matchDetails || {},
        };
    }

    findAdditionalMatches(keyword, results, options, excludeMatch) {
        const excludePosition = excludeMatch.position;
        const additionalMatches = [];
        
        const relaxedOptions = {
            ...options,
            fuzzyThreshold: Math.max(0.5, options.fuzzyThreshold - 0.1),
            confidenceThreshold: Math.max(40, options.confidenceThreshold - 20)
        };

        // Search through remaining results
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            
            // Skip if this is the primary match position
            if (result.position === excludePosition) continue;

            // Test this individual result
            const singleResultArray = [{ ...result, position: result.position }];
            const match = this.findKeywordRanking(keyword, singleResultArray, relaxedOptions);

            if (match.found && match.confidence >= relaxedOptions.confidenceThreshold) {
                additionalMatches.push({
                    ...match,
                    position: result.position // Preserve original position
                });
            }
        }

        return additionalMatches.slice(0, 5); // Limit to top 5 additional matches
    }

    findNearMatches(keyword, results, options) {
        const nearMatches = [];
        const keywordWords = this.extractKeywordWords(this.normalizeText(keyword, options), options);

        // Look for results that contain some but not all keyword words
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            const titleText = this.normalizeText(result.title, options);
            const snippetText = this.normalizeText(result.snippet || '', options);
            const combinedText = `${titleText} ${snippetText}`;

            // Check partial word matches
            const partialMatch = this.checkPartialWordMatch(combinedText, keywordWords);
            
            if (partialMatch.hasPartialMatch && partialMatch.matchRatio >= 0.3) {
                nearMatches.push({
                    found: true,
                    position: result.position,
                    matchType: 'near',
                    confidence: Math.round(partialMatch.matchRatio * 60),
                    result: result,
                    matchDetails: partialMatch,
                    matchedIn: partialMatch.bestLocation
                });
            }
        }

        return nearMatches.slice(0, 3); // Limit to top 3 near matches
    }

    checkPartialWordMatch(text, keywordWords) {
        const textWords = text.split(' ');
        let matchedWords = 0;
        let bestLocation = 'content';

        keywordWords.forEach(keywordWord => {
            if (textWords.some(textWord => textWord.includes(keywordWord) || keywordWord.includes(textWord))) {
                matchedWords++;
            }
        });

        const matchRatio = matchedWords / keywordWords.length;

        return {
            hasPartialMatch: matchedWords > 0,
            matchedWords: matchedWords,
            totalWords: keywordWords.length,
            matchRatio: matchRatio,
            bestLocation: bestLocation
        };
    }

    generatePositionAnalysis(positionResults) {
        const analysis = {
            status: positionResults.found ? 'found' : 'not_found',
            bestPosition: null,
            averagePosition: null,
            positionRange: null,
            confidenceDistribution: { high: 0, medium: 0, low: 0 },
            matchTypeDistribution: {},
            competitionLevel: 'unknown',
            recommendations: []
        };

        if (positionResults.positions.length > 0) {
            // Calculate position metrics
            const positions = positionResults.positions.map(p => p.position);
            analysis.bestPosition = Math.min(...positions);
            analysis.averagePosition = Math.round(positions.reduce((a, b) => a + b, 0) / positions.length);
            analysis.positionRange = `${Math.min(...positions)}-${Math.max(...positions)}`;

            // Analyze confidence distribution
            positionResults.positions.forEach(pos => {
                if (pos.confidence >= 80) analysis.confidenceDistribution.high++;
                else if (pos.confidence >= 60) analysis.confidenceDistribution.medium++;
                else analysis.confidenceDistribution.low++;

                // Track match types
                analysis.matchTypeDistribution[pos.matchType] = (analysis.matchTypeDistribution[pos.matchType] || 0) + 1;
            });

            // Determine competition level
            if (analysis.bestPosition <= 3) analysis.competitionLevel = 'high';
            else if (analysis.bestPosition <= 10) analysis.competitionLevel = 'medium';
            else if (analysis.bestPosition <= 30) analysis.competitionLevel = 'low';
            else analysis.competitionLevel = 'very_low';

            // Generate recommendations
            analysis.recommendations = this.generatePositionRecommendations(analysis, positionResults);
        }

        return analysis;
    }

    generatePositionRecommendations(analysis, positionResults) {
        const recommendations = [];

        if (analysis.bestPosition <= 3) {
            recommendations.push('Excellent ranking! Monitor competitors and maintain content quality.');
        } else if (analysis.bestPosition <= 10) {
            recommendations.push('Good first-page ranking. Focus on content optimization to move up.');
        } else if (analysis.bestPosition <= 20) {
            recommendations.push('Second-page ranking. Improve content relevance and authority.');
        } else {
            recommendations.push('Low ranking detected. Consider content restructuring and SEO optimization.');
        }

        if (analysis.confidenceDistribution.low > analysis.confidenceDistribution.high) {
            recommendations.push('Low match confidence detected. Consider refining keyword targeting.');
        }

        if (positionResults.detectionSummary.fuzzyMatches > positionResults.detectionSummary.exactMatches) {
            recommendations.push('Mostly fuzzy matches found. Consider exact keyword phrase optimization.');
        }

        return recommendations;
    }

    /**
     * Simplified position detection for quick checks
     */
    getQuickPosition(keyword, results, options = {}) {
        const match = this.findKeywordRanking(keyword, results, options);
        
        return {
            found: match.found,
            position: match.position,
            confidence: match.confidence,
            matchType: match.matchType,
            quick: true
        };
    }

    /**
     * Batch position detection for multiple keywords
     */
    detectMultipleKeywordPositions(keywords, results, options = {}) {
        const batchResults = {
            keywords: keywords,
            results: {},
            summary: {
                totalKeywords: keywords.length,
                foundKeywords: 0,
                averagePosition: null,
                bestPosition: null,
                processingTime: Date.now()
            }
        };

        const allPositions = [];

        keywords.forEach(keyword => {
            const positionResult = this.detectKeywordPosition(keyword, results, options);
            batchResults.results[keyword] = positionResult;

            if (positionResult.found) {
                batchResults.summary.foundKeywords++;
                allPositions.push(positionResult.primaryPosition);
            }
        });

        // Calculate summary statistics
        if (allPositions.length > 0) {
            batchResults.summary.averagePosition = Math.round(
                allPositions.reduce((a, b) => a + b, 0) / allPositions.length
            );
            batchResults.summary.bestPosition = Math.min(...allPositions);
        }

        batchResults.summary.processingTime = Date.now() - batchResults.summary.processingTime;

        return batchResults;
    }

    // ============================================================================
    // BOT DETECTION AVOIDANCE (Task 9) - ENHANCED
    // ============================================================================

    initializeBotAvoidance() {
        console.log('🤖 Initializing bot detection avoidance mechanisms');
        
        // Set up request monitoring
        this.setupRequestMonitoring();
        
        // Initialize behavior randomization
        this.setupBehaviorRandomization();
        
        // Set up suspicious activity detection
        this.setupSuspiciousActivityDetection();
        
        console.log('✅ Bot avoidance mechanisms initialized');
    }

    initializeUserAgents() {
        // Realistic user agents for different browsers and platforms
        return [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
        ];
    }

    initializeBehaviorPatterns() {
        return {
            humanDelayRanges: {
                reading: [800, 2500],      // Time to "read" results
                thinking: [300, 1200],     // Time to "think" about search
                typing: [100, 400],        // Delay per character when "typing"
                scrolling: [200, 800],     // Time between scroll actions
                clicking: [150, 500]       // Delay before/after clicks
            },
            
            scrollPatterns: [
                { type: 'quick_scan', scrolls: 2, delay: [200, 400] },
                { type: 'careful_read', scrolls: 5, delay: [800, 1500] },
                { type: 'focused_search', scrolls: 3, delay: [400, 800] }
            ],
            
            searchPatterns: [
                { type: 'immediate', delay: [100, 300] },
                { type: 'delayed', delay: [1000, 3000] },
                { type: 'cautious', delay: [2000, 5000] }
            ]
        };
    }

    setupRequestMonitoring() {
        // Monitor request frequency and patterns
        this.requestMonitor = {
            maxRequestsPerMinute: 10,
            cooldownPeriod: 60000, // 1 minute
            suspiciousThreshold: 15
        };
    }

    setupBehaviorRandomization() {
        // Randomize various behavioral aspects
        this.currentBehavior = {
            selectedPattern: this.getRandomBehaviorPattern(),
            userAgent: this.getRandomUserAgent(),
            scrollPattern: this.getRandomScrollPattern(),
            readingSpeed: this.getRandomReadingSpeed()
        };
    }

    setupSuspiciousActivityDetection() {
        // Monitor for patterns that might trigger bot detection
        this.suspiciousPatterns = {
            tooFastRequests: false,
            identicalTimingPatterns: false,
            unusualUserAgent: false,
            noMouseMovement: false,
            perfectTiming: false
        };
    }

    /**
     * Apply human-like delays before making requests
     */
    async applyHumanLikeDelay(requestType = 'default', customRange = null) {
        const now = Date.now();
        const timeSinceLastRequest = now - this.botAvoidance.lastRequestTime;
        
        // Check if we need to enforce cooldown
        if (this.needsCooldown()) {
            console.log('🕐 Applying cooldown period to avoid detection');
            await this.applyCooldown();
        }
        
        // Determine delay based on request type and human patterns
        let delayRange;
        
        if (customRange) {
            delayRange = customRange;
        } else {
            delayRange = this.getDelayForRequestType(requestType);
        }
        
        // Add randomization to avoid predictable patterns
        const baseDelay = this.getRandomDelay(delayRange[0], delayRange[1]);
        const jitter = this.getRandomDelay(-100, 200); // Add some jitter
        const finalDelay = Math.max(100, baseDelay + jitter);
        
        // Simulate human reading/thinking time
        const humanizationDelay = this.getHumanizationDelay(requestType);
        const totalDelay = finalDelay + humanizationDelay;
        
        console.log(`⏱️ Applying human-like delay: ${totalDelay}ms (type: ${requestType})`);
        
        // Update tracking
        this.updateRequestTracking(totalDelay);
        
        return new Promise(resolve => setTimeout(resolve, totalDelay));
    }

    needsCooldown() {
        const recentRequests = this.getRecentRequests(60000); // Last minute
        return recentRequests.length >= this.requestMonitor.maxRequestsPerMinute;
    }

    async applyCooldown() {
        const cooldownTime = this.getRandomDelay(30000, 90000); // 30-90 seconds
        console.log(`🛑 Entering cooldown period: ${cooldownTime/1000}s`);
        
        // Simulate human behavior during cooldown
        await this.simulateHumanCooldownBehavior(cooldownTime);
    }

    async simulateHumanCooldownBehavior(cooldownTime) {
        const behaviors = [
            'reading_other_results',
            'checking_other_tabs', 
            'brief_break',
            'slow_scrolling'
        ];
        
        const selectedBehavior = behaviors[Math.floor(Math.random() * behaviors.length)];
        console.log(`🎭 Simulating human behavior: ${selectedBehavior}`);
        
        // Different behaviors have different patterns
        switch (selectedBehavior) {
            case 'slow_scrolling':
                await this.simulateSlowScrolling(cooldownTime);
                break;
            case 'reading_other_results':
                await this.simulateResultReading(cooldownTime);
                break;
            default:
                await new Promise(resolve => setTimeout(resolve, cooldownTime));
        }
    }

    async simulateSlowScrolling(totalTime) {
        const scrollCount = Math.floor(totalTime / 5000); // Scroll every 5 seconds
        const scrollDelay = totalTime / scrollCount;
        
        for (let i = 0; i < scrollCount; i++) {
            // Simulate scroll event (for internal tracking)
            this.recordHumanActivity('scroll');
            await new Promise(resolve => setTimeout(resolve, scrollDelay));
        }
    }

    async simulateResultReading(totalTime) {
        const readingSegments = Math.floor(totalTime / 8000); // Read for 8 seconds at a time
        const segmentTime = totalTime / readingSegments;
        
        for (let i = 0; i < readingSegments; i++) {
            this.recordHumanActivity('reading');
            await new Promise(resolve => setTimeout(resolve, segmentTime));
        }
    }

    getDelayForRequestType(requestType) {
        const delayRanges = {
            'search': [1500, 4000],      // User thinking about search
            'scroll': [800, 2000],       // Scrolling through results
            'click': [200, 800],         // Clicking on something
            'type': [150, 400],          // Delay per character when "typing"
            'read': [2000, 5000],        // Reading content
            'navigate': [1000, 2500],    // Page navigation
            'default': [500, 1500]       // Generic delay
        };
        
        return delayRanges[requestType] || delayRanges.default;
    }

    getHumanizationDelay(requestType) {
        // Additional delays to make behavior more human-like
        const humanFactors = {
            'search': this.getRandomDelay(200, 800),    // Extra thinking time
            'scroll': this.getRandomDelay(100, 400),    // Eye movement time
            'click': this.getRandomDelay(50, 200),      // Motor delay
            'default': this.getRandomDelay(0, 300)
        };
        
        return humanFactors[requestType] || humanFactors.default;
    }

    getRandomDelay(min, max) {
        // Use more natural random distribution (slightly favors middle values)
        const random1 = Math.random();
        const random2 = Math.random();
        const gaussian = (random1 + random2) / 2; // Simple gaussian approximation
        
        return Math.floor(min + gaussian * (max - min));
    }

    updateRequestTracking(delay) {
        const now = Date.now();
        
        // Update request history
        this.botAvoidance.requestHistory.push({
            timestamp: now,
            delay: delay,
            type: 'search_request'
        });
        
        // Keep only recent history (last 10 minutes)
        const tenMinutesAgo = now - 600000;
        this.botAvoidance.requestHistory = this.botAvoidance.requestHistory
            .filter(req => req.timestamp > tenMinutesAgo);
        
        // Update session data
        this.botAvoidance.sessionData.requestCount++;
        this.botAvoidance.sessionData.averageDelay = this.calculateAverageDelay();
        this.botAvoidance.lastRequestTime = now;
        
        // Check for suspicious patterns
        this.detectSuspiciousPatterns();
    }

    getRecentRequests(timeWindow) {
        const cutoff = Date.now() - timeWindow;
        return this.botAvoidance.requestHistory.filter(req => req.timestamp > cutoff);
    }

    calculateAverageDelay() {
        if (this.botAvoidance.requestHistory.length === 0) return 0;
        
        const totalDelay = this.botAvoidance.requestHistory.reduce((sum, req) => sum + req.delay, 0);
        return totalDelay / this.botAvoidance.requestHistory.length;
    }

    detectSuspiciousPatterns() {
        const recentRequests = this.getRecentRequests(300000); // Last 5 minutes
        
        // Check for too-fast requests
        this.suspiciousPatterns.tooFastRequests = this.checkTooFastRequests(recentRequests);
        
        // Check for identical timing patterns  
        this.suspiciousPatterns.identicalTimingPatterns = this.checkIdenticalTimingPatterns(recentRequests);
        
        // Check for perfect timing (too regular)
        this.suspiciousPatterns.perfectTiming = this.checkPerfectTiming(recentRequests);
        
        // Update suspicious activity flag
        const suspiciousCount = Object.values(this.suspiciousPatterns).filter(Boolean).length;
        this.botAvoidance.sessionData.suspiciousActivity = suspiciousCount >= 2;
        
        if (this.botAvoidance.sessionData.suspiciousActivity) {
            console.warn('⚠️ Suspicious activity patterns detected - adjusting behavior');
            this.adjustBehaviorForSuspicion();
        }
    }

    checkTooFastRequests(requests) {
        if (requests.length < 3) return false;
        
        const avgDelay = requests.reduce((sum, req) => sum + req.delay, 0) / requests.length;
        return avgDelay < 500; // Less than 500ms average is suspicious
    }

    checkIdenticalTimingPatterns(requests) {
        if (requests.length < 5) return false;
        
        const delays = requests.map(req => req.delay);
        const uniqueDelays = new Set(delays);
        
        // If too many identical delays, it's suspicious
        return uniqueDelays.size < delays.length * 0.5;
    }

    checkPerfectTiming(requests) {
        if (requests.length < 4) return false;
        
        const intervals = [];
        for (let i = 1; i < requests.length; i++) {
            intervals.push(requests[i].timestamp - requests[i-1].timestamp);
        }
        
        // Check if intervals are too regular (low variance)
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const variance = intervals.reduce((sum, interval) => {
            return sum + Math.pow(interval - avgInterval, 2);
        }, 0) / intervals.length;
        
        const standardDeviation = Math.sqrt(variance);
        const coefficientOfVariation = standardDeviation / avgInterval;
        
        // If variation is too low, timing is too perfect
        return coefficientOfVariation < 0.2;
    }

    adjustBehaviorForSuspicion() {
        console.log('🔧 Adjusting behavior to reduce suspicion');
        
        // Increase delays
        this.botAvoidance.behaviourPatterns.humanDelayRanges.reading = [2000, 6000];
        this.botAvoidance.behaviourPatterns.humanDelayRanges.thinking = [1000, 3000];
        
        // Add more randomization
        this.currentBehavior.selectedPattern = this.getRandomBehaviorPattern();
        this.currentBehavior.scrollPattern = this.getRandomScrollPattern();
        
        // Force a longer cooldown before next request
        this.forcedCooldown = this.getRandomDelay(15000, 45000);
    }

    getRandomBehaviorPattern() {
        const patterns = ['cautious', 'normal', 'quick', 'thorough'];
        return patterns[Math.floor(Math.random() * patterns.length)];
    }

    getRandomUserAgent() {
        return this.botAvoidance.userAgentRotation[
            Math.floor(Math.random() * this.botAvoidance.userAgentRotation.length)
        ];
    }

    getRandomScrollPattern() {
        return this.botAvoidance.behaviorPatterns.scrollPatterns[
            Math.floor(Math.random() * this.botAvoidance.behaviorPatterns.scrollPatterns.length)
        ];
    }

    getRandomReadingSpeed() {
        // Words per minute - realistic human reading speeds
        const speeds = [150, 200, 250, 300, 350]; // WPM
        return speeds[Math.floor(Math.random() * speeds.length)];
    }

    recordHumanActivity(activityType) {
        // Record various human-like activities for behavioral analysis
        const activity = {
            type: activityType,
            timestamp: Date.now(),
            authentic: true
        };
        
        this.humanActivities = this.humanActivities || [];
        this.humanActivities.push(activity);
        
        // Keep only recent activities
        const oneHourAgo = Date.now() - 3600000;
        this.humanActivities = this.humanActivities.filter(a => a.timestamp > oneHourAgo);
    }

    /**
     * Apply stealth mode for high-risk scenarios
     */
    async enableStealthMode() {
        console.log('🥷 Enabling stealth mode for maximum bot avoidance');
        
        this.stealthMode = {
            enabled: true,
            extraDelayMultiplier: 2.5,
            maxRequestsPerSession: 5,
            extendedCooldowns: true,
            randomBehaviorInjection: true
        };
        
        // Apply immediate stealth behaviors
        await this.applyStealthBehaviors();
    }

    async applyStealthBehaviors() {
        // Inject random human-like behaviors
        const behaviors = [
            () => this.simulateMouseMovement(),
            () => this.simulatePageInteraction(),
            () => this.simulateReadingPause()
        ];
        
        const randomBehavior = behaviors[Math.floor(Math.random() * behaviors.length)];
        await randomBehavior();
    }

    async simulateMouseMovement() {
        console.log('🖱️ Simulating mouse movement');
        // This would trigger mouse move events in a real implementation
        await new Promise(resolve => setTimeout(resolve, this.getRandomDelay(200, 800)));
    }

    async simulatePageInteraction() {
        console.log('🤝 Simulating page interaction');
        // Simulate user interacting with page elements
        await new Promise(resolve => setTimeout(resolve, this.getRandomDelay(500, 1500)));
    }

    async simulateReadingPause() {
        console.log('📖 Simulating reading pause');
        const readingTime = this.getRandomDelay(3000, 8000);
        await new Promise(resolve => setTimeout(resolve, readingTime));
    }

    /**
     * Generate bot avoidance report
     */
    getBotAvoidanceReport() {
        const report = {
            sessionData: this.botAvoidance.sessionData,
            requestHistory: {
                total: this.botAvoidance.requestHistory.length,
                recent: this.getRecentRequests(300000).length,
                averageDelay: this.calculateAverageDelay()
            },
            suspiciousPatterns: this.suspiciousPatterns,
            currentBehavior: this.currentBehavior,
            stealthMode: this.stealthMode || { enabled: false },
            recommendations: this.getBotAvoidanceRecommendations()
        };
        
        return report;
    }

    getBotAvoidanceRecommendations() {
        const recommendations = [];
        
        if (this.botAvoidance.sessionData.suspiciousActivity) {
            recommendations.push('Suspicious activity detected - recommend longer delays');
        }
        
        if (this.botAvoidance.sessionData.requestCount > 20) {
            recommendations.push('High request count - consider session break');
        }
        
        if (this.calculateAverageDelay() < 1000) {
            recommendations.push('Average delay is low - increase humanization');
        }
        
        return recommendations;
    }

    // ============================================================================
    // COMPREHENSIVE ERROR HANDLING (Task 10) - ENHANCED
    // ============================================================================

    initializeErrorHandling() {
        console.log('🚨 Initializing comprehensive error handling system');
        
        // Set up global error catching
        this.setupGlobalErrorHandlers();
        
        // Initialize fallback strategies
        this.setupFallbackStrategies();
        
        // Set up recovery mechanisms
        this.setupRecoveryMechanisms();
        
        // Initialize error monitoring
        this.setupErrorMonitoring();
        
        console.log('✅ Error handling system initialized');
    }

    setupGlobalErrorHandlers() {
        // Capture unhandled errors
        window.addEventListener('error', (event) => {
            this.handleGlobalError('javascript', event.error, {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });

        // Capture unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleGlobalError('promise', event.reason, {
                promise: event.promise
            });
        });
    }

    handleGlobalError(type, error, details = {}) {
        const errorInfo = {
            type: type,
            message: error?.message || 'Unknown error',
            stack: error?.stack,
            details: details,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent
        };

        this.logError('GLOBAL', errorInfo);
        console.error(`🚨 Global ${type} error:`, errorInfo);
    }

    setupFallbackStrategies() {
        this.errorHandler.fallbackStrategies = {
            [this.errorHandler.errorCategories.DOM]: this.handleDOMError.bind(this),
            [this.errorHandler.errorCategories.NETWORK]: this.handleNetworkError.bind(this),
            [this.errorHandler.errorCategories.PARSING]: this.handleParsingError.bind(this),
            [this.errorHandler.errorCategories.VALIDATION]: this.handleValidationError.bind(this),
            [this.errorHandler.errorCategories.TIMEOUT]: this.handleTimeoutError.bind(this),
            [this.errorHandler.errorCategories.BOT_DETECTION]: this.handleBotDetectionError.bind(this),
            [this.errorHandler.errorCategories.UNKNOWN]: this.handleUnknownError.bind(this)
        };
    }

    setupRecoveryMechanisms() {
        // Set up automatic retry logic
        this.retryManager = {
            activeRetries: new Map(),
            maxConcurrentRetries: 3,
            backoffMultiplier: 1.5,
            maxRetryDelay: 30000
        };
    }

    setupErrorMonitoring() {
        // Monitor error patterns
        this.errorMonitor = {
            errorRates: {},
            thresholds: {
                maxErrorsPerMinute: 10,
                maxConsecutiveErrors: 5,
                criticalErrorTypes: ['BOT_DETECTION', 'NETWORK']
            },
            alerts: {
                active: false,
                lastAlert: 0,
                cooldownPeriod: 300000 // 5 minutes
            }
        };
    }

    /**
     * Enhanced error handling with categorization and recovery
     */
    async handleError(operation, error, context = {}) {
        const errorCategory = this.categorizeError(error, context);
        const errorId = this.generateErrorId();
        
        const errorDetails = {
            id: errorId,
            operation: operation,
            category: errorCategory,
            message: error?.message || 'Unknown error',
            stack: error?.stack,
            context: context,
            timestamp: Date.now(),
            severity: this.calculateErrorSeverity(errorCategory, context)
        };

        // Log the error
        this.logError(errorCategory, errorDetails);

        // Check if we need to apply circuit breaker
        if (this.shouldApplyCircuitBreaker(errorCategory)) {
            return await this.applyCircuitBreaker(errorCategory, errorDetails);
        }

        // Attempt recovery using fallback strategies
        const recoveryResult = await this.attemptRecovery(errorDetails);
        
        // Update error monitoring
        this.updateErrorMonitoring(errorCategory, errorDetails);

        return recoveryResult;
    }

    categorizeError(error, context = {}) {
        const message = error?.message?.toLowerCase() || '';
        const stack = error?.stack?.toLowerCase() || '';

        // Network-related errors
        if (message.includes('network') || message.includes('fetch') || 
            message.includes('connection') || context.isNetworkError) {
            return this.errorHandler.errorCategories.NETWORK;
        }

        // DOM-related errors
        if (message.includes('element') || message.includes('selector') || 
            message.includes('queryselector') || context.isDOMError) {
            return this.errorHandler.errorCategories.DOM;
        }

        // Parsing errors
        if (message.includes('parse') || message.includes('json') || 
            message.includes('syntax') || context.isParsingError) {
            return this.errorHandler.errorCategories.PARSING;
        }

        // Validation errors
        if (message.includes('invalid') || message.includes('validation') || 
            context.isValidationError) {
            return this.errorHandler.errorCategories.VALIDATION;
        }

        // Timeout errors
        if (message.includes('timeout') || message.includes('abort') || 
            context.isTimeoutError) {
            return this.errorHandler.errorCategories.TIMEOUT;
        }

        // Bot detection errors
        if (message.includes('blocked') || message.includes('captcha') || 
            message.includes('bot') || context.isBotDetectionError) {
            return this.errorHandler.errorCategories.BOT_DETECTION;
        }

        return this.errorHandler.errorCategories.UNKNOWN;
    }

    calculateErrorSeverity(category, context) {
        const severityMap = {
            [this.errorHandler.errorCategories.BOT_DETECTION]: 'critical',
            [this.errorHandler.errorCategories.NETWORK]: 'high',
            [this.errorHandler.errorCategories.TIMEOUT]: 'medium',
            [this.errorHandler.errorCategories.DOM]: 'medium',
            [this.errorHandler.errorCategories.PARSING]: 'low',
            [this.errorHandler.errorCategories.VALIDATION]: 'low',
            [this.errorHandler.errorCategories.UNKNOWN]: 'medium'
        };

        return severityMap[category] || 'medium';
    }

    generateErrorId() {
        return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    logError(category, errorDetails) {
        // Add to error log
        this.errorHandler.errorLog.push(errorDetails);
        
        // Keep only last 100 errors
        if (this.errorHandler.errorLog.length > 100) {
            this.errorHandler.errorLog.shift();
        }

        // Update error counts
        this.errorHandler.errorCounts[category] = (this.errorHandler.errorCounts[category] || 0) + 1;

        // Console logging with appropriate level
        const logLevel = this.getLogLevel(errorDetails.severity);
        console[logLevel](`🚨 [${category}] ${errorDetails.operation}:`, errorDetails);
    }

    getLogLevel(severity) {
        const levelMap = {
            'critical': 'error',
            'high': 'error', 
            'medium': 'warn',
            'low': 'warn'
        };
        return levelMap[severity] || 'warn';
    }

    async attemptRecovery(errorDetails) {
        const { category, operation, context } = errorDetails;
        
        console.log(`🔄 Attempting recovery for ${category} error in ${operation}`);

        try {
            // Get the appropriate fallback strategy
            const fallbackStrategy = this.errorHandler.fallbackStrategies[category];
            
            if (!fallbackStrategy) {
                throw new Error(`No fallback strategy for category: ${category}`);
            }

            // Attempt recovery with retry logic
            const recoveryResult = await this.executeWithRetry(
                () => fallbackStrategy(errorDetails),
                errorDetails
            );

            console.log(`✅ Recovery successful for ${category} error`);
            return {
                success: true,
                result: recoveryResult,
                errorId: errorDetails.id,
                recoveryMethod: category
            };

        } catch (recoveryError) {
            console.error(`❌ Recovery failed for ${category} error:`, recoveryError);
            
            return {
                success: false,
                error: recoveryError.message,
                originalError: errorDetails,
                errorId: errorDetails.id
            };
        }
    }

    async executeWithRetry(operation, errorDetails, customRetries = null) {
        const maxRetries = customRetries || this.errorHandler.maxRetries;
        const retryId = this.generateErrorId();
        
        this.retryManager.activeRetries.set(retryId, {
            operation: errorDetails.operation,
            startTime: Date.now(),
            attempts: 0
        });

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                if (attempt > 0) {
                    const delay = this.calculateRetryDelay(attempt);
                    console.log(`⏳ Retry attempt ${attempt}/${maxRetries} after ${delay}ms`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }

                const result = await operation();
                
                // Cleanup retry tracking
                this.retryManager.activeRetries.delete(retryId);
                
                return result;

            } catch (error) {
                console.warn(`⚠️ Attempt ${attempt + 1} failed:`, error.message);
                
                if (attempt === maxRetries) {
                    this.retryManager.activeRetries.delete(retryId);
                    throw error;
                }
            }
        }
    }

    calculateRetryDelay(attempt) {
        const baseDelay = this.errorHandler.retryDelays[Math.min(attempt - 1, this.errorHandler.retryDelays.length - 1)];
        const backoffDelay = baseDelay * Math.pow(this.retryManager.backoffMultiplier, attempt - 1);
        const jitteredDelay = backoffDelay + (Math.random() * 500); // Add jitter
        
        return Math.min(jitteredDelay, this.retryManager.maxRetryDelay);
    }

    // ============================================================================
    // SPECIFIC ERROR HANDLERS
    // ============================================================================

    async handleDOMError(errorDetails) {
        console.log('🔧 Handling DOM error with fallback selectors');
        
        const { context } = errorDetails;
        
        // Try alternative selectors if DOM element not found
        if (context.selector) {
            const fallbackSelectors = this.getFallbackSelectors(context.selector);
            
            for (const fallbackSelector of fallbackSelectors) {
                try {
                    const elements = document.querySelectorAll(fallbackSelector);
                    if (elements.length > 0) {
                        console.log(`✅ DOM recovery successful with selector: ${fallbackSelector}`);
                        return { elements: Array.from(elements), selector: fallbackSelector };
                    }
                } catch (error) {
                    console.warn(`⚠️ Fallback selector failed: ${fallbackSelector}`);
                }
            }
        }

        // If all selectors fail, try generic approaches
        return await this.useGenericDOMApproach(context);
    }

    getFallbackSelectors(originalSelector) {
        // Define fallback selectors for common patterns
        const fallbackMap = {
            '.g': ['.MjjYud', '.tF2Cxc', 'div[data-header-feature]', '[data-ved]'],
            '.MjjYud': ['.g', '.tF2Cxc', 'div[data-header-feature]'],
            'h3': ['[role="heading"]', '.LC20lb', '.DKV0Md'],
            '.VwiC3b': ['.s', '.IsZvec', '.lEBKkf', '.hgKElc']
        };

        return fallbackMap[originalSelector] || [];
    }

    async useGenericDOMApproach(context) {
        console.log('🔍 Using generic DOM approach');
        
        // Try to find results using generic patterns
        const genericSelectors = [
            'div[data-ved]',
            'div[data-hveid]', 
            '[data-header-feature]',
            'h3',
            '.g',
            '.result'
        ];

        for (const selector of genericSelectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                return { elements: Array.from(elements), selector, method: 'generic' };
            }
        }

        throw new Error('All DOM recovery strategies failed');
    }

    async handleNetworkError(errorDetails) {
        console.log('🌐 Handling network error');
        
        const { context } = errorDetails;
        
        // Wait for network recovery
        if (context.retryAfterNetwork) {
            await this.waitForNetworkRecovery();
        }

        // Implement offline fallback if available
        if (context.hasOfflineData) {
            return await this.useOfflineData(context);
        }

        // Use cached data if available
        const cachedData = this.getCachedData(context);
        if (cachedData) {
            console.log('📁 Using cached data for network recovery');
            return { data: cachedData, source: 'cache' };
        }

        throw new Error('Network recovery strategies exhausted');
    }

    async waitForNetworkRecovery(maxWait = 10000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const checkNetwork = () => {
                if (navigator.onLine) {
                    resolve(true);
                } else if (Date.now() - startTime > maxWait) {
                    reject(new Error('Network recovery timeout'));
                } else {
                    setTimeout(checkNetwork, 1000);
                }
            };
            
            checkNetwork();
        });
    }

    async handleParsingError(errorDetails) {
        console.log('📝 Handling parsing error');
        
        const { context } = errorDetails;
        
        // Try alternative parsing methods
        if (context.data && context.parseMethod) {
            const alternativeMethods = this.getAlternativeParsingMethods(context.parseMethod);
            
            for (const method of alternativeMethods) {
                try {
                    const result = await this.parseWithMethod(context.data, method);
                    console.log(`✅ Parsing recovery successful with method: ${method}`);
                    return { data: result, method: method };
                } catch (error) {
                    console.warn(`⚠️ Alternative parsing method failed: ${method}`);
                }
            }
        }

        // Use safe parsing with defaults
        return await this.useSafeParsing(context);
    }

    getAlternativeParsingMethods(originalMethod) {
        const alternatives = {
            'json': ['relaxed-json', 'eval-safe', 'manual'],
            'text': ['innerHTML', 'textContent', 'innerText'],
            'attributes': ['getAttribute', 'dataset', 'properties']
        };

        return alternatives[originalMethod] || ['manual'];
    }

    async useSafeParsing(context) {
        console.log('🛡️ Using safe parsing approach');
        
        // Return minimal safe structure
        return {
            success: false,
            data: null,
            error: 'Parsing failed - using safe defaults',
            method: 'safe-default'
        };
    }

    async handleValidationError(errorDetails) {
        console.log('✅ Handling validation error');
        
        const { context } = errorDetails;
        
        // Apply input sanitization
        if (context.input) {
            const sanitizedInput = this.sanitizeInput(context.input, context.inputType);
            
            if (sanitizedInput !== context.input) {
                console.log('🧹 Input sanitized, retrying operation');
                return { input: sanitizedInput, sanitized: true };
            }
        }

        // Use default values for invalid inputs
        return this.useDefaultValues(context);
    }

    sanitizeInput(input, inputType = 'text') {
        if (typeof input !== 'string') {
            input = String(input || '');
        }

        switch (inputType) {
            case 'keyword':
                return input.trim().replace(/[<>]/g, '').substring(0, 100);
            case 'url':
                return input.trim().replace(/[<>"']/g, '');
            case 'number':
                return Math.max(0, parseInt(input) || 0);
            default:
                return input.trim().replace(/[<>"'&]/g, '');
        }
    }

    useDefaultValues(context) {
        const defaults = {
            keyword: '',
            maxResults: 100,
            fuzzyThreshold: 0.7,
            timeout: 30000
        };

        return { 
            values: { ...defaults, ...context.defaults },
            usingDefaults: true 
        };
    }

    async handleTimeoutError(errorDetails) {
        console.log('⏰ Handling timeout error');
        
        const { context } = errorDetails;
        
        // Try with extended timeout
        if (context.operation && context.extendTimeout !== false) {
            const extendedTimeout = (context.originalTimeout || 30000) * 2;
            console.log(`⏰ Retrying with extended timeout: ${extendedTimeout}ms`);
            
            try {
                return await this.executeWithTimeout(context.operation, extendedTimeout);
            } catch (error) {
                console.warn('⚠️ Extended timeout also failed');
            }
        }

        // Return partial results if available
        if (context.partialResults) {
            console.log('📊 Returning partial results due to timeout');
            return {
                success: true,
                data: context.partialResults,
                incomplete: true,
                reason: 'timeout'
            };
        }

        throw new Error('Timeout recovery failed');
    }

    async handleBotDetectionError(errorDetails) {
        console.log('🤖 Handling bot detection error - applying countermeasures');
        
        // Trigger enhanced bot avoidance
        this.botAvoidance.isDetected = true;
        this.botAvoidance.detectionCount++;
        
        // Apply immediate countermeasures
        await this.applyBotDetectionCountermeasures();
        
        // Extended cooldown
        const cooldownTime = this.getRandomDelay(60000, 180000); // 1-3 minutes
        console.log(`🛑 Bot detection cooldown: ${cooldownTime/1000}s`);
        await new Promise(resolve => setTimeout(resolve, cooldownTime));
        
        // Reset detection flag gradually
        setTimeout(() => {
            this.botAvoidance.isDetected = false;
        }, cooldownTime * 2);

        return {
            success: true,
            action: 'cooldown_applied',
            cooldownTime: cooldownTime
        };
    }

    async applyBotDetectionCountermeasures() {
        // Reduce request frequency        this.requestMonitor.maxRequestsPerMinute = Math.max(1, this.requestMonitor.maxRequestsPerMinute - 2);
        
        // Increase delays
        this.requestMonitor.baseDelay *= 1.5;
        
        // Clear request history to start fresh
        this.requestMonitor.requestHistory = [];
        
        console.log('🛡️ Bot detection countermeasures applied');
    }

    async handleUnknownError(errorDetails) {
        console.log('❓ Handling unknown error');
        
        // Log for debugging
        console.warn('Unknown error details:', errorDetails);
        
        // Try generic recovery
        return {
            success: false,
            error: 'Unknown error occurred',
            errorId: errorDetails.id,
            fallbackApplied: true
        };
    }

    // ============================================================================
    // ERROR MONITORING AND CIRCUIT BREAKER
    // ============================================================================

    shouldApplyCircuitBreaker(errorCategory) {
        const recentErrors = this.getRecentErrors(60000); // Last minute
        const categoryErrors = recentErrors.filter(err => err.category === errorCategory);
        
        return categoryErrors.length >= this.errorMonitor.thresholds.maxErrorsPerMinute ||
               this.getConsecutiveErrors(errorCategory) >= this.errorMonitor.thresholds.maxConsecutiveErrors;
    }

    async applyCircuitBreaker(errorCategory, errorDetails) {
        console.warn(`🔌 Circuit breaker activated for ${errorCategory}`);
        
        const breakerTime = this.getCircuitBreakerTime(errorCategory);
        
        // Notify user of temporary suspension
        this.notifyCircuitBreakerActivated(errorCategory, breakerTime);
        
        // Wait for breaker period
        await new Promise(resolve => setTimeout(resolve, breakerTime));
        
        console.log(`🔌 Circuit breaker deactivated for ${errorCategory}`);
        
        return {
            success: false,
            circuitBreakerActivated: true,
            errorCategory: errorCategory,
            breakerTime: breakerTime
        };
    }

    getCircuitBreakerTime(errorCategory) {
        const breakerTimes = {
            [this.errorHandler.errorCategories.BOT_DETECTION]: 300000, // 5 minutes
            [this.errorHandler.errorCategories.NETWORK]: 60000,        // 1 minute  
            [this.errorHandler.errorCategories.TIMEOUT]: 120000,       // 2 minutes
            [this.errorHandler.errorCategories.DOM]: 30000,            // 30 seconds
        };

        return breakerTimes[errorCategory] || 60000;
    }

    notifyCircuitBreakerActivated(errorCategory, breakerTime) {
        const message = `Extension temporarily paused due to ${errorCategory} errors. Resuming in ${Math.round(breakerTime/1000)} seconds.`;
        console.warn(`🔌 ${message}`);
        
        // Could send message to popup here if needed
        try {
            chrome.runtime.sendMessage({
                action: 'circuitBreakerActivated',
                category: errorCategory,
                message: message,
                breakerTime: breakerTime
            });
        } catch (error) {
            // Ignore if popup not available
        }
    }

    getRecentErrors(timeWindow) {
        const now = Date.now();
        return this.errorHandler.errorLog.filter(err => (now - err.timestamp) <= timeWindow);
    }

    getConsecutiveErrors(errorCategory) {
        let consecutive = 0;
        
        // Check from most recent backwards
        for (let i = this.errorHandler.errorLog.length - 1; i >= 0; i--) {
            const error = this.errorHandler.errorLog[i];
            
            if (error.category === errorCategory) {
                consecutive++;
            } else {
                break; // Stop at first non-matching error
            }
        }
        
        return consecutive;
    }

    updateErrorMonitoring(errorCategory, errorDetails) {
        // Update error rates
        const now = Date.now();
        if (!this.errorMonitor.errorRates[errorCategory]) {
            this.errorMonitor.errorRates[errorCategory] = [];
        }
        
        this.errorMonitor.errorRates[errorCategory].push(now);
        
        // Clean old entries (older than 1 hour)
        this.errorMonitor.errorRates[errorCategory] = this.errorMonitor.errorRates[errorCategory]
            .filter(timestamp => (now - timestamp) <= 3600000);
            
        // Check if we need to send alerts
        this.checkErrorAlerts(errorCategory, errorDetails);
    }

    checkErrorAlerts(errorCategory, errorDetails) {
        if (this.errorMonitor.alerts.active) {
            return; // Already in alert state
        }

        const isCritical = this.errorMonitor.thresholds.criticalErrorTypes.includes(errorCategory);
        const recentErrors = this.getRecentErrors(60000);
        
        if (isCritical || recentErrors.length >= this.errorMonitor.thresholds.maxErrorsPerMinute) {
            this.triggerErrorAlert(errorCategory, errorDetails, recentErrors);
        }
    }

    triggerErrorAlert(errorCategory, errorDetails, recentErrors) {
        this.errorMonitor.alerts.active = true;
        this.errorMonitor.alerts.lastAlert = Date.now();
        
        console.error(`🚨 ERROR ALERT: High error rate detected for ${errorCategory}`);
        console.error(`📊 Recent errors: ${recentErrors.length} in last minute`);
        
        // Schedule alert cooldown
        setTimeout(() => {
            this.errorMonitor.alerts.active = false;
        }, this.errorMonitor.alerts.cooldownPeriod);
    }

    // ============================================================================
    // LOCAL STORAGE FOR SEARCH HISTORY (Task 11) - COMPLETE
    // ============================================================================

    initializeSearchHistory() {
        console.log('📚 Initializing search history functionality');
        
        this.searchHistory = {
            maxHistorySize: 50,
            historyKey: 'google_keyword_rank_history',
            enabled: true,
            autoSave: true
        };
        
        // Load existing history
        this.loadSearchHistory();
        
        console.log('✅ Search history initialized');
    }

    async loadSearchHistory() {
        try {
            const result = await chrome.storage.local.get([this.searchHistory.historyKey]);
            const storedHistory = result[this.searchHistory.historyKey];
            
            if (storedHistory && Array.isArray(storedHistory)) {
                this.searchHistory.data = storedHistory;
                console.log(`📚 Loaded ${storedHistory.length} search history entries`);
            } else {
                this.searchHistory.data = [];
                console.log('📚 No existing search history found, starting fresh');
            }
            
            // Clean old entries (older than 30 days)
            this.cleanOldHistoryEntries();
            
        } catch (error) {
            console.warn('⚠️ Failed to load search history:', error);
            this.searchHistory.data = [];
        }
    }

    async saveSearchResult(keyword, results, matchResult) {
        if (!this.searchHistory.enabled || !this.searchHistory.autoSave) {
            return;
        }

        try {
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
                    url: window.location.href,
                    userAgent: navigator.userAgent.substring(0, 100), // Truncate for storage
                    searchEngine: 'Google'
                }
            };

            // Add to history array
            this.searchHistory.data.unshift(historyEntry); // Add to beginning

            // Limit history size
            if (this.searchHistory.data.length > this.searchHistory.maxHistorySize) {
                this.searchHistory.data = this.searchHistory.data.slice(0, this.searchHistory.maxHistorySize);
            }

            // Save to Chrome storage
            await this.saveHistoryToStorage();

            console.log(`📚 Saved search history for keyword: "${keyword}"`);

        } catch (error) {
            console.warn('⚠️ Failed to save search history:', error);
        }
    }

    async saveHistoryToStorage() {
        try {
            await chrome.storage.local.set({
                [this.searchHistory.historyKey]: this.searchHistory.data
            });
        } catch (error) {
            console.error('❌ Failed to save history to storage:', error);
        }
    }

    generateHistoryId() {
        return `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    cleanOldHistoryEntries() {
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        
        const originalLength = this.searchHistory.data.length;
        this.searchHistory.data = this.searchHistory.data.filter(entry => 
            entry.timestamp > thirtyDaysAgo
        );
        
        const removedCount = originalLength - this.searchHistory.data.length;
        if (removedCount > 0) {
            console.log(`🧹 Cleaned ${removedCount} old history entries`);
            this.saveHistoryToStorage(); // Save after cleaning
        }
    }

    async getSearchHistory(options = {}) {
        const {
            limit = 20,
            keyword = null,
            dateFrom = null,
            dateTo = null,
            foundOnly = false
        } = options;

        let filteredHistory = [...this.searchHistory.data];

        // Filter by keyword
        if (keyword) {
            const normalizedKeyword = keyword.toLowerCase();
            filteredHistory = filteredHistory.filter(entry =>
                entry.keyword.toLowerCase().includes(normalizedKeyword)
            );
        }

        // Filter by date range
        if (dateFrom) {
            const fromTimestamp = new Date(dateFrom).getTime();
            filteredHistory = filteredHistory.filter(entry =>
                entry.timestamp >= fromTimestamp
            );
        }

        if (dateTo) {
            const toTimestamp = new Date(dateTo).getTime();
            filteredHistory = filteredHistory.filter(entry =>
                entry.timestamp <= toTimestamp
            );
        }

        // Filter by found results only
        if (foundOnly) {
            filteredHistory = filteredHistory.filter(entry =>
                entry.results.found === true
            );
        }

        // Apply limit
        filteredHistory = filteredHistory.slice(0, limit);

        return {
            history: filteredHistory,
            total: this.searchHistory.data.length,
            filtered: filteredHistory.length,
            options: options
        };
    }

    async clearSearchHistory(options = {}) {
        const { olderThan = null, keyword = null, confirmClear = false } = options;

        let entriesToRemove = [];

        if (olderThan) {
            const cutoffDate = new Date(olderThan).getTime();
            entriesToRemove = this.searchHistory.data.filter(entry =>
                entry.timestamp < cutoffDate
            );
        } else if (keyword) {
            const normalizedKeyword = keyword.toLowerCase();
            entriesToRemove = this.searchHistory.data.filter(entry =>
                entry.keyword.toLowerCase().includes(normalizedKeyword)
            );
        } else if (confirmClear) {
            // Clear all history
            entriesToRemove = [...this.searchHistory.data];
        }

        if (entriesToRemove.length > 0) {
            // Remove entries
            this.searchHistory.data = this.searchHistory.data.filter(entry =>
                !entriesToRemove.includes(entry)
            );

            // Save updated history
            await this.saveHistoryToStorage();

            console.log(`🗑️ Cleared ${entriesToRemove.length} history entries`);
            return {
                success: true,
                removedCount: entriesToRemove.length,
                remainingCount: this.searchHistory.data.length
            };
        }

        return {
            success: false,
            message: 'No entries matched removal criteria',
            removedCount: 0
        };
    }

    getHistoryStats() {
        const stats = {
            totalSearches: this.searchHistory.data.length,
            successfulSearches: 0,
            averagePosition: 0,
            topKeywords: {},
            recentActivity: {
                last7Days: 0,
                last30Days: 0
            },
            positionDistribution: {
                topThree: 0,
                firstPage: 0,
                notFound: 0
            }
        };

        if (this.searchHistory.data.length === 0) {
            return stats;
        }

        const now = Date.now();
        const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
        
        let totalPosition = 0;
        let foundCount = 0;

        this.searchHistory.data.forEach(entry => {
            // Count successful searches
            if (entry.results.found) {
                stats.successfulSearches++;
                foundCount++;
                totalPosition += entry.results.position;

                // Position distribution
                if (entry.results.position <= 3) {
                    stats.positionDistribution.topThree++;
                } else if (entry.results.position <= 10) {
                    stats.positionDistribution.firstPage++;
                }
            } else {
                stats.positionDistribution.notFound++;
            }

            // Recent activity
            if (entry.timestamp > sevenDaysAgo) {
                stats.recentActivity.last7Days++;
            }
            if (entry.timestamp > thirtyDaysAgo) {
                stats.recentActivity.last30Days++;
            }

            // Top keywords
            const keyword = entry.keyword.toLowerCase();
            stats.topKeywords[keyword] = (stats.topKeywords[keyword] || 0) + 1;
        });

        // Calculate average position
        if (foundCount > 0) {
            stats.averagePosition = Math.round((totalPosition / foundCount) * 100) / 100;
        }

        // Sort top keywords
        stats.topKeywords = Object.entries(stats.topKeywords)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .reduce((obj, [keyword, count]) => {
                obj[keyword] = count;
                return obj;
            }, {});

        return stats;
    }

    async exportSearchHistory(format = 'json') {
        try {
            const historyData = await this.getSearchHistory({ limit: 1000 });
            
            switch (format.toLowerCase()) {
                case 'csv':
                    return this.exportHistoryAsCSV(historyData.history);
                case 'json':
                default:
                    return {
                        format: 'json',
                        data: JSON.stringify({
                            exportDate: new Date().toISOString(),
                            totalEntries: historyData.total,
                            history: historyData.history,
                            stats: this.getHistoryStats()
                        }, null, 2),
                        filename: 'keyword_rank_history_' + new Date().toISOString().split('T')[0] + '.json'
                    };
            }
        } catch (error) {
            console.error('❌ Failed to export search history:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    exportHistoryAsCSV(historyData) {
        const headers = [
            'Date',
            'Keyword', 
            'Found',
            'Position',
            'Match Type',
            'Confidence',
            'Total Results',
            'URL'
        ];

        const csvRows = [headers.join(',')];

        historyData.forEach(entry => {
            const row = [
                new Date(entry.timestamp).toISOString(),
                `"${entry.keyword.replace(/"/g, '""')}"`,
                entry.results.found,
                entry.results.position || 'N/A',
                entry.results.matchType || 'N/A',
                entry.results.confidence || 'N/A',
                entry.results.totalResults || 'N/A',
                entry.metadata.url.replace(/"/g, '""')
            ];
            csvRows.push(row.join(','));
        });

        return {
            format: 'csv',
            data: csvRows.join('\n'),
            filename: 'keyword_rank_history_' + new Date().toISOString().split('T')[0] + '.csv'
        };
    }

    // ============================================================================
    // UTILITY METHODS
    // ============================================================================

    getCachedData(context) {
        // Simple cache lookup - could be enhanced with IndexedDB
        if (this.scrapingCache && context.cacheKey) {
            const cached = this.scrapingCache.get(context.cacheKey);
            if (cached && (Date.now() - cached.timestamp < 300000)) { // 5 minutes
                return cached.data;
            }
        }
        return null;
    }

    async useOfflineData(context) {
        // Placeholder for offline data usage
        console.log('📴 Using offline data fallback');
        return {
            success: true,
            data: context.offlineData || {},
            source: 'offline'
        };
    }

    async parseWithMethod(data, method) {
        switch (method) {
            case 'relaxed-json':
                return this.parseRelaxedJSON(data);
            case 'eval-safe':
                return this.parseWithEval(data);
            case 'manual':
                return this.parseManually(data);
            default:
                throw new Error('Unknown parsing method: ' + method);
        }
    }

    parseRelaxedJSON(data) {
        // Try to fix common JSON issues
        let cleaned = data.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
        return JSON.parse(cleaned);
    }

    parseWithEval(data) {
        // DANGER: Only use in controlled environments
        // This is a fallback and should be avoided in production
        throw new Error('Eval parsing disabled for security');
    }

    parseManually(data) {
        // Extract data manually using regex or string manipulation
        return { manual: true, raw: data };
    }

    async executeWithTimeout(operation, timeout) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error('Operation timed out after ' + timeout + 'ms'));
            }, timeout);

            Promise.resolve(operation())
                .then(result => {
                    clearTimeout(timer);
                    resolve(result);
                })
                .catch(error => {
                    clearTimeout(timer);
                    reject(error);
                });
        });
    }

    /**
     * Enhanced wrapper for operations that might fail
     */
    async safeExecute(operation, context = {}, options = {}) {
        const operationName = options.name || 'unknown';
        const timeout = options.timeout || 30000;
        
        try {
            console.log('🔧 Executing ' + operationName + ' with safety wrapper');
            
            const result = await this.executeWithTimeout(operation, timeout);
            
            console.log('✅ ' + operationName + ' completed successfully');
            return {
                success: true,
                result: result,
                operation: operationName
            };
            
        } catch (error) {
            console.warn('⚠️ ' + operationName + ' failed, attempting recovery');
            
            const enhancedContext = {
                ...context,
                operation: operationName,
                originalTimeout: timeout,
                isNetworkError: error.message?.includes('fetch'),
                isDOMError: error.message?.includes('querySelector'),
                isTimeoutError: error.message?.includes('timeout'),
                isParsingError: error.message?.includes('parse'),
                isValidationError: error.message?.includes('invalid')
            };
            
            return await this.handleError(operationName, error, enhancedContext);
        }
    }

    /**
     * Get comprehensive error report
     */
    getErrorReport() {
        const recentErrors = this.getRecentErrors(3600000); // Last hour
        
        return {
            summary: {
                totalErrors: this.errorHandler.errorLog.length,
                recentErrors: recentErrors.length,
                errorsByCategory: this.errorHandler.errorCounts,
                activeRetries: this.retryManager.activeRetries.size,
                circuitBreakerActive: this.errorMonitor.alerts.active
            },
            recentErrors: recentErrors.slice(-10), // Last 10 errors
            systemHealth: this.getSystemHealth(),
            recommendations: this.generateErrorRecommendations()
        };
    }

    getSystemHealth() {
        const recentErrors = this.getRecentErrors(300000); // Last 5 minutes
        const errorRate = recentErrors.length / 5; // Errors per minute
        
        let health = 'excellent';
        if (errorRate > 5) health = 'poor';
        else if (errorRate > 2) health = 'fair';
        else if (errorRate > 0.5) health = 'good';
        
        return {
            status: health,
            errorRate: errorRate,
            lastError: this.errorHandler.errorLog.length > 0 ? 
                this.errorHandler.errorLog[this.errorHandler.errorLog.length - 1].timestamp : null
        };
    }

    generateErrorRecommendations() {
        const recommendations = [];
        const errorCounts = this.errorHandler.errorCounts;
        
        if (errorCounts[this.errorHandler.errorCategories.DOM] > 5) {
            recommendations.push('High DOM errors - Google may have updated their layout');
        }
        
        if (errorCounts[this.errorHandler.errorCategories.NETWORK] > 3) {
            recommendations.push('Network issues detected - check internet connection');
        }
        
        if (errorCounts[this.errorHandler.errorCategories.BOT_DETECTION] > 0) {
            recommendations.push('Bot detection encountered - reduce request frequency');
        }
        
        return recommendations;
    }
}

// Initialize the scraper
const scraper = new GoogleSERPScraper();

// Standalone functions for backward compatibility
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
