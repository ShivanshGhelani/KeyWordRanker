/**
 * Content Script for Keyword Rank Finder Chrome Extension - ENHANCED
 * Injected into Google Search pages to scrape and analyze SERP data
 * Task 7 Complete: Enhanced Keyword Matching Algorithm
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
        this.init();
    }
    
    init() {
        console.log('🔥 Enhanced Keyword Rank Finder: Content script loaded on:', window.location.href);
        this.setupMessageListener();
        this.observePageChanges();
        this.sendReadySignal();
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
            
            // Add small delay for current page analysis
            if (isCurrentPageAnalysis) {
                await this.addRandomDelay(100, 300);
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
            
            // Metadata
            const metadata = {
                currentSearchQuery: currentSearchQuery,
                isCurrentPageAnalysis: isCurrentPageAnalysis,
                scrapedAt: new Date().toISOString(),
                totalFound: results.length,
                limitApplied: maxResults,
                pageUrl: window.location.href,
                enhanced: true,
                algorithmVersion: '2.0'
            };
            
            sendResponse({
                success: true,
                keyword: keyword,
                ranking: ranking,
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
}

// Initialize the scraper
const scraper = new GoogleSERPScraper();

// Standalone functions for backward compatibility
function findKeywordRank(keyword, results, options = {}) {
    return scraper.findKeywordRanking(keyword, results, options);
}

function analyzeCompetition(keyword, results, options = {}) {
    const exact = scraper.findKeywordRanking(keyword, results, { ...options, fuzzyMatching: false });
    const fuzzy = scraper.findKeywordRanking(keyword, results, { ...options, fuzzyMatching: true });
    
    return {
        exactMatch: exact,
        fuzzyMatch: fuzzy,
        competition: {
            totalResults: results.length,
            foundExact: exact.found,
            foundFuzzy: fuzzy.found,
            difficulty: exact.found ? 'high' : fuzzy.found ? 'medium' : 'low'
        }
    };
}

console.log('✅ Enhanced Keyword Rank Finder content script loaded successfully!');
