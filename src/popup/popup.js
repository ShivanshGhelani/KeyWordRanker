/**
 * Enhanced Popup JavaScript for Keyword Rank Finder Chrome Extension
 * Handles user interactions, form validation, history, settings, and communication with content scripts
 */

class KeywordRankFinder {
    constructor() {
        // Initialize properties first
        this.searchStartTime = null;
        this.currentKeyword = null;
        this.currentResult = null;
        
        // Bind methods to preserve context
        this.handleRankCheck = this.handleRankCheck.bind(this);
        this.validateInput = this.validateInput.bind(this);
        this.updateCharacterCounter = this.updateCharacterCounter.bind(this);
        
        // Initialize DOM elements with error checking
        this.initializeElements();
        this.attachEventListeners();
        this.loadSettings();
        this.loadStats();
        this.setupCharacterCounter();
        this.loadHistory();
        this.checkCurrentPage();
    }
    
    initializeElements() {
        // Core elements with null checks
        this.form = document.getElementById('rankForm');
        this.keywordInput = document.getElementById('keyword');
        this.checkBtn = document.getElementById('checkRankBtn');
        this.spinner = document.getElementById('spinner');
        this.btnText = document.querySelector('.btn-text');
        
        // Validate critical elements
        if (!this.keywordInput) {
            this.showError('Extension initialization failed. Please reload the popup.');
            return;
        }
        
        if (!this.checkBtn) {
            this.showError('Extension initialization failed. Please reload the popup.');
            return;
        }
        
        // Character counter
        this.charCount = document.getElementById('charCount');
        
        // Options
        this.openInNewTab = document.getElementById('openInNewTab');
        this.saveHistory = document.getElementById('saveHistory');
        this.showPositionNumbers = document.getElementById('showPositionNumbers');
        
        // Result count options
        this.resultCountOptions = document.getElementById('resultCountOptions');
        this.resultCountButtons = document.querySelectorAll('.result-count-btn');
        this.currentResultCount = 'all'; // Default to 'all'
        
        // Results and stats
        this.resultsSection = document.getElementById('results');
        this.resultContent = document.getElementById('resultContent');
        this.quickStats = document.getElementById('quickStats');
        this.lastKeyword = document.getElementById('lastKeyword');
        this.totalSearches = document.getElementById('totalSearches');
        this.searchTime = document.getElementById('searchTime');
        
        // Action buttons
        this.copyResult = document.getElementById('copyResult');
        this.searchAgain = document.getElementById('searchAgain');
        this.viewInGoogle = document.getElementById('viewInGoogle');
        
        // Error handling
        this.errorSection = document.getElementById('error');
        this.errorMessage = document.getElementById('errorMessage');
        this.retryBtn = document.getElementById('retryBtn');
        
        // History
        this.toggleHistory = document.getElementById('toggleHistory');
        this.historySection = document.getElementById('history');
        this.historyList = document.getElementById('historyList');
        this.clearHistory = document.getElementById('clearHistory');
        
        // Settings
        this.toggleSettings = document.getElementById('toggleSettings');
        this.settingsPanel = document.getElementById('settingsPanel');
        this.closeSettings = document.getElementById('closeSettings');
        this.googleDomain = document.getElementById('googleDomain');
        this.resultsLimit = document.getElementById('resultsLimit');
        this.enableNotifications = document.getElementById('enableNotifications');
        
        // Bot Avoidance Testing
        this.testBotAvoidance = document.getElementById('testBotAvoidance');
        this.validateBotAvoidance = document.getElementById('validateBotAvoidance');
        this.testResults = document.getElementById('testResults');
        this.validationResults = document.getElementById('validationResults');
    }
    
    attachEventListeners() {
        // Form and input events
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRankCheck();
        });
        
        this.keywordInput.addEventListener('input', () => {
            this.updateCharacterCounter();
            this.clearErrors();
            this.validateInput();
        });
        
        this.keywordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleRankCheck();
            }
        });
        
        // Action buttons
        this.copyResult?.addEventListener('click', () => this.copyResultToClipboard());
        this.searchAgain?.addEventListener('click', () => this.resetForm());
        this.viewInGoogle?.addEventListener('click', () => this.openInGoogle());
        this.retryBtn?.addEventListener('click', () => this.handleRankCheck());
        
        // Navigation
        this.toggleHistory?.addEventListener('click', () => this.toggleHistoryPanel());
        this.toggleSettings?.addEventListener('click', () => this.openSettings());
        this.closeSettings?.addEventListener('click', () => this.closeSettingsPanel());
        this.clearHistory?.addEventListener('click', () => this.clearSearchHistory());
        
        // Settings
        this.googleDomain?.addEventListener('change', () => this.saveSettings());
        this.resultsLimit?.addEventListener('change', () => this.saveSettings());
        this.enableNotifications?.addEventListener('change', () => this.saveSettings());
        
        // Position Numbers
        this.showPositionNumbers?.addEventListener('change', () => this.togglePositionNumbers());
        
        // Auto-enhance Results
        // Removed - simplifying to only result count options
        
        // Result Count Options
        this.resultCountButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.selectResultCount(e.target.dataset.count));
        });
        
        // Bot Avoidance Testing
        this.testBotAvoidance?.addEventListener('click', () => this.runBotAvoidanceTest());
        this.validateBotAvoidance?.addEventListener('click', () => this.runBotAvoidanceValidation());
    }
    
    setupCharacterCounter() {
        this.updateCharacterCounter();
    }
    
    async checkCurrentPage() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab) return;
            
            if (!tab.url.includes('google.com/search?q=')) {
                this.showPageWarning('Please search for your main term on Google first (e.g., "best boutique in ahmedabad"), then use this extension to find your keyword rank in those results.');
            } else {
                // Get the current search query and show it
                try {
                    const currentQuery = await this.getCurrentSearchQuery(tab.id);
                    this.showPageInfo(`Ready to analyze results for: "${currentQuery}"`);
                } catch (error) {
                    this.showPageInfo('Ready to analyze current Google search results');
                }
            }
        } catch (error) {
            console.warn('Could not check current page:', error);
        }
    }
    
    showPageInfo(message) {
        // Create info element if it doesn't exist
        let info = document.getElementById('pageInfo');
        if (!info) {
            info = document.createElement('div');
            info.id = 'pageInfo';
            info.style.cssText = `
                background: #dcfce7;
                border: 1px solid #16a34a;
                color: #15803d;
                padding: 8px;
                border-radius: 4px;
                font-size: 12px;
                margin-bottom: 12px;
                text-align: center;
            `;
            this.form.parentNode.insertBefore(info, this.form);
        }
        info.textContent = message;
        info.style.display = 'block';
        
        // Hide any warning
        this.clearPageWarning();
    }
    
    showPageWarning(message) {
        // Create warning element if it doesn't exist
        let warning = document.getElementById('pageWarning');
        if (!warning) {
            warning = document.createElement('div');
            warning.id = 'pageWarning';
            warning.style.cssText = `
                background: #fef3c7;
                border: 1px solid #f59e0b;
                color: #92400e;
                padding: 8px;
                border-radius: 4px;
                font-size: 12px;
                margin-bottom: 12px;
                text-align: center;
            `;
            this.form.parentNode.insertBefore(warning, this.form);
        }
        warning.textContent = message;
        warning.style.display = 'block';
    }
    
    clearPageWarning() {
        const warning = document.getElementById('pageWarning');
        if (warning) {
            warning.style.display = 'none';
        }
    }
    
    clearPageInfo() {
        const info = document.getElementById('pageInfo');
        if (info) {
            info.style.display = 'none';
        }
    }
    
    updateCharacterCounter() {
        if (!this.keywordInput || !this.charCount) {
            return;
        }
        
        const length = this.keywordInput.value?.length || 0;
        this.charCount.textContent = length;
        
        if (length > 80) {
            this.charCount.style.color = '#ef4444';
        } else if (length > 60) {
            this.charCount.style.color = '#f59e0b';
        } else {
            this.charCount.style.color = '#9ca3af';
        }
    }
    
    async handleRankCheck() {
        // Add safety check for keywordInput
        if (!this.keywordInput) {
            console.error('Keyword input element not found');
            this.showError('Extension initialization error. Please reload the popup.', true);
            return;
        }
        
        const keyword = this.keywordInput.value?.trim() || '';
        this.currentKeyword = keyword;
        
        if (!this.validateKeyword(keyword)) {
            return;
        }
        
        try {
            this.searchStartTime = Date.now();
            this.setLoadingState(true);
            this.clearResults();
            this.clearErrors();
            
            // Use real rank checking with content script
            const result = await this.performRealRankCheck(keyword);
            
            this.currentResult = result;
            this.displayResults(result, keyword);
            
            if (this.saveHistory?.checked) {
                this.saveSearchToHistory(keyword, result);
            }
            
            this.updateStats();
            
        } catch (error) {
            console.error('Error checking rank:', error);
            this.showError(`Failed to check keyword rank: ${error.message}`, true);
        } finally {
            this.setLoadingState(false);
        }
    }
    
    validateKeyword(keyword) {
        if (!keyword) {
            this.showError('Please enter a keyword to search for.');
            return false;
        }
        
        if (keyword.length < 2) {
            this.showError('Keyword must be at least 2 characters long.');
            return false;
        }
        
        if (keyword.length > 100) {
            this.showError('Keyword must be less than 100 characters.');
            return false;
        }
        
        return true;
    }
    
    validateInput() {
        if (!this.keywordInput || !this.checkBtn) {
            return;
        }
        
        const keyword = this.keywordInput.value?.trim() || '';
        const isValid = keyword.length >= 2 && keyword.length <= 100;
        
        this.checkBtn.disabled = !isValid;
        
        if (keyword.length > 0 && keyword.length < 2) {
            this.keywordInput.style.borderColor = '#dc2626';
        } else {
            this.keywordInput.style.borderColor = '#e1e5e9';
        }
    }
    
    async performRealRankCheck(keyword) {
        try {
            const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Check if we're on a Google search results page
            if (!this.isOnGoogleSearchResultsPage(currentTab.url)) {
                throw new Error('Please navigate to Google, search for your main term (e.g., "best boutique in ahmedabad"), then use this extension to find the rank of your keyword in those results.');
            }
            
            // Ensure content script is loaded before proceeding
            await this.ensureContentScriptLoaded(currentTab.id);
            
            // Get the current search query from the page
            const currentSearchQuery = await this.getCurrentSearchQuery(currentTab.id);
            
            // Small delay before scraping current page results
            await this.addRandomDelay(200, 500);
            
            // Send scraping request to analyze CURRENT page results
            const maxResults = this.getAnalysisResultCount();
            const response = await this.sendMessageToContentScript({
                action: 'scrapeCurrentPageResults',
                keyword: keyword,
                currentSearchQuery: currentSearchQuery,
                options: {
                    maxResults: maxResults,
                    fuzzyMatching: true,
                    highlightResults: false,
                    findAllOccurrences: true // Request all occurrences, not just the first one
                }
            });
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to analyze current search results');
            }
            
            // Transform content script response to handle multiple rankings
            const rankings = response.ranking.allPositions || [];
            const found = rankings.length > 0;
            
            return {
                rank: found ? rankings[0] : null, // Primary rank (first occurrence)
                allRanks: rankings, // All positions where keyword appears
                found: found,
                matchType: response.ranking.matchedIn || 'unknown',
                fuzzy: response.ranking.fuzzy || false,
                totalResults: response.totalResults,
                currentSearchQuery: currentSearchQuery,
                analyzedCurrentPage: true,
                multipleRankings: rankings.length > 1
            };
            
        } catch (error) {
            console.error('Error in real rank check:', error);
            throw error;
        }
    }
    
    isOnGoogleSearchResultsPage(url) {
        return url && url.includes('google.com/search?q=');
    }
    
    async getCurrentSearchQuery(tabId) {
        try {
            // First ensure content script is loaded
            await this.ensureContentScriptLoaded(tabId);
            
            const response = await this.sendMessageToContentScript({
                action: 'getCurrentSearchQuery'
            });
            
            return response.searchQuery || 'Unknown search';
        } catch (error) {
            console.warn('Could not get current search query:', error);
            return 'Current search results';
        }
    }
    
    async ensureContentScriptLoaded(tabId, maxAttempts = 5) {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const response = await chrome.tabs.sendMessage(tabId, { action: 'ping' });
                if (response && response.status === 'alive') {
                    return true;
                }
            } catch (error) {

                
                if (attempt === maxAttempts) {
                    // Try to inject the content script manually
                    try {
                        await chrome.scripting.executeScript({
                            target: { tabId: tabId },
                            files: ['src/scripts/content.js']
                        });
                        
                        await chrome.scripting.insertCSS({
                            target: { tabId: tabId },
                            files: ['src/styles/content.css']
                        });
                        
                        // Wait a bit for the script to initialize
                        await this.addRandomDelay(1000, 2000);
                        
                        // Try one more time
                        const finalResponse = await chrome.tabs.sendMessage(tabId, { action: 'ping' });
                        if (finalResponse && finalResponse.status === 'alive') {
                            return true;
                        }
                    } catch (injectionError) {
                        console.error('Failed to inject content script:', injectionError);
                    }
                    
                    throw new Error('Content script not loaded. Please reload the Google search page and try again.');
                }
                
                // Wait before retrying
                await this.addRandomDelay(500, 1000);
            }
        }
    }
    
    buildAdvancedSearchParams(keyword) {
        const domain = this.googleDomain?.value || 'google.com';
        const settings = this.getSearchSettings();
        
        // Build sophisticated search parameters
        const params = new URLSearchParams();
        params.set('q', this.optimizeSearchQuery(keyword));
        
        // Add region/language parameters based on domain
        const regionMap = {
            'google.com': { hl: 'en', gl: 'US' },
            'google.co.uk': { hl: 'en', gl: 'GB' },
            'google.ca': { hl: 'en', gl: 'CA' },
            'google.com.au': { hl: 'en', gl: 'AU' }
        };
        
        const regionSettings = regionMap[domain] || regionMap['google.com'];
        params.set('hl', regionSettings.hl);
        params.set('gl', regionSettings.gl);
        
        // Add result count parameter based on selected count
        let numResults;
        if (this.currentResultCount === 'all') {
            // 'All' means use default Google results (usually 10-20)
            numResults = 100; // Set a reasonable default when 'all' is selected
        } else {
            numResults = parseInt(this.currentResultCount);
        }
        params.set('num', numResults.toString());
        
        // Add source parameter to indicate organic search
        params.set('source', 'hp');
        
        // Add user interface language
        params.set('uule', this.generateLocationParameter(regionSettings.gl));
        
        return {
            domain: domain,
            queryString: params.toString(),
            fullUrl: `https://www.${domain}/search?${params.toString()}`,
            originalKeyword: keyword,
            optimizedQuery: this.optimizeSearchQuery(keyword),
            region: regionSettings
        };
    }
    
    optimizeSearchQuery(keyword) {
        // Clean and optimize the search query
        let optimized = keyword.trim();
        
        // Remove excessive whitespace
        optimized = optimized.replace(/\s+/g, ' ');
        
        // Handle special characters that might interfere with search
        // Keep quotes and operators but sanitize problematic characters
        optimized = optimized.replace(/[<>]/g, '');
        
        return optimized;
    }
    
    generateLocationParameter(countryCode) {
        // Generate a location parameter for more accurate regional results
        const locationMap = {
            'US': 'w+CAIQICINVVMiDFVuaXRlZCBTdGF0ZXM',
            'GB': 'w+CAIQICIKVVMaGUdyZWF0IEJyaXRhaW4',
            'CA': 'w+CAIQICIGVVMaB0NhbmFkYQ',
            'AU': 'w+CAIQICIJVVMaCUF1c3RyYWxpYQ'
        };
        
        return locationMap[countryCode] || locationMap['US'];
    }
    
    getSearchSettings() {
        // Get current search settings from UI
        return {
            domain: this.googleDomain?.value || 'google.com',
            resultsLimit: parseInt(this.resultsLimit?.value) || 100,
            enableNotifications: this.enableNotifications?.checked || false,
            openInNewTab: this.openInNewTab?.checked || false
        };
    }
    
    isValidGoogleSearchPage(url, keyword) {
        if (!url || !url.includes('google.com')) {
            return false;
        }
        
        // Check if already on a search page with the same keyword
        try {
            const urlObj = new URL(url);
            const currentQuery = urlObj.searchParams.get('q');
            const optimizedKeyword = this.optimizeSearchQuery(keyword);
            
            return currentQuery && 
                   this.normalizeSearchQuery(currentQuery) === this.normalizeSearchQuery(optimizedKeyword);
        } catch (error) {
            return false;
        }
    }
    
    async navigateToGoogleSearch(tabId, searchParams) {
        try {
            // Add pre-navigation delay to appear more human-like
            await this.addRandomDelay(300, 800);
            
            // Navigate to the search URL
            await chrome.tabs.update(tabId, { url: searchParams.fullUrl });
            
            // Log navigation for debugging

            
        } catch (error) {
            throw new Error(`Failed to navigate to Google search: ${error.message}`);
        }
    }
    
    async addRandomDelay(min = 500, max = 1500) {
        // Add human-like random delays to avoid bot detection
        const delay = Math.random() * (max - min) + min;
        return new Promise(resolve => setTimeout(resolve, delay));
    }
    
    async waitForPageLoad(tabId, maxWait = 15000) {
        const startTime = Date.now();
        let attempts = 0;
        const maxAttempts = 8;
        
        while (Date.now() - startTime < maxWait && attempts < maxAttempts) {
            try {
                attempts++;
                
                // Add progressive delay between attempts to avoid rapid pinging
                const baseDelay = Math.min(attempts * 200, 1000);
                await this.addRandomDelay(baseDelay, baseDelay + 500);
                
                // Try to ping the content script
                const response = await chrome.tabs.sendMessage(tabId, { 
                    action: 'ping',
                    timestamp: Date.now()
                });
                
                if (response && response.status === 'alive') {
                    // Content script is ready, but wait a bit more for DOM to stabilize
                    await this.addRandomDelay(800, 1500);
                    
                    // Verify page is actually loaded by checking for search results
                    const verificationResponse = await chrome.tabs.sendMessage(tabId, {
                        action: 'verifyPageReady'
                    });
                    
                    if (verificationResponse && verificationResponse.ready) {

                        return true;
                    }
                }
            } catch (error) {
                // Content script not ready yet, continue waiting
                if (attempts === 1) {

                }
                
                // If we're getting close to timeout, try a page refresh
                if (attempts === maxAttempts - 1 && Date.now() - startTime > maxWait * 0.8) {

                    try {
                        await chrome.tabs.reload(tabId);
                        await this.addRandomDelay(2000, 3000); // Wait for refresh
                    } catch (refreshError) {
                        console.warn('Failed to refresh page:', refreshError);
                    }
                }
            }
        }
        
        throw new Error(`Timeout waiting for Google search page to load (${Math.round((Date.now() - startTime) / 1000)}s)`);
    }
    
    displayResults(result, keyword) {
        const searchDuration = Date.now() - this.searchStartTime;
        this.searchTime.textContent = `Analysis completed in ${(searchDuration / 1000).toFixed(1)}s`;
        
        this.resultsSection.classList.remove('hidden');
        this.resultsSection.classList.add('fade-in');
        
        const searchContext = result.currentSearchQuery ? 
            ` in search results for "${result.currentSearchQuery}"` : 
            ' in current Google search results';
        
        if (result.found) {
            const fuzzyText = result.fuzzy ? ' (fuzzy match)' : '';
            
            // Create clear messaging about result range analyzed
            let rangeText = '';
            if (this.currentResultCount === 'all') {
                rangeText = ` • Analyzed all ${result.totalResults} search results`;
            } else {
                const maxRange = parseInt(this.currentResultCount);
                rangeText = ` • Analyzed top ${Math.min(maxRange, result.totalResults)} search results (positions 1-${maxRange})`;
            }
            
            // Determine how many results to show and filter rankings accordingly
            let displayedRanks = [];
            let numResultsToShow = 0;
            
            if (this.currentResultCount === 'all') {
                // Show all results
                numResultsToShow = result.totalResults;
                displayedRanks = result.allRanks || [];
            } else {
                // Show only results within the selected range (e.g., positions 1-50 for "50" selection)
                const maxPosition = parseInt(this.currentResultCount);
                numResultsToShow = maxPosition;
                
                // Filter rankings to only include positions within the selected range
                if (result.allRanks) {
                    displayedRanks = result.allRanks.filter(rank => rank <= maxPosition);
                }
            }

            // Slice the rankings/allRanks arrays to only show the top N
            if (result.multipleRankings && displayedRanks.length > 1) {
                const ranksList = displayedRanks.map(rank => `#${rank}`).join(', ');
                const primaryRank = displayedRanks[0];
                this.resultContent.innerHTML = `
                    <div class="rank-result">
                        <div class="rank-number">#${primaryRank}</div>
                        <div class="rank-text">
                            "${keyword}" appears at <strong>multiple positions</strong>${searchContext}${fuzzyText}
                        </div>
                        <div class="multiple-ranks">
                            <div class="multiple-ranks-label">🎯 Positions in top ${numResultsToShow} results:</div>
                            <div class="ranks-list">${ranksList}</div>
                        </div>
                        <div class="rank-details">
                            Found in: ${result.matchType}${rangeText} • ${displayedRanks.length} occurrences • Analysis took ${(searchDuration / 1000).toFixed(1)} seconds
                        </div>
                    </div>
                `;
            } else if (displayedRanks.length === 1 || result.found) {
                // Single ranking (original display)
                const displayRank = displayedRanks.length > 0 ? displayedRanks[0] : result.rank;
                this.resultContent.innerHTML = `
                    <div class="rank-result">
                        <div class="rank-number">#${displayRank}</div>
                        <div class="rank-text">
                            "${keyword}" appears at position <strong>${displayRank}</strong>${searchContext}${fuzzyText}
                        </div>
                        <div class="rank-details">
                            Found in: ${result.matchType}${rangeText} • Analysis took ${(searchDuration / 1000).toFixed(1)} seconds
                        </div>
                    </div>
                `;
            }
        } else {
            // Create clear messaging about result range analyzed for "not found" case
            let rangeText = '';
            if (this.currentResultCount === 'all') {
                rangeText = `all ${result.totalResults || 0} search results`;
            } else {
                const maxRange = parseInt(this.currentResultCount);
                const actualAnalyzed = Math.min(maxRange, result.totalResults || 0);
                rangeText = `top ${actualAnalyzed} search results (positions 1-${maxRange})`;
            }
            
            this.resultContent.innerHTML = `
                <div class="rank-result" style="border-left-color: #f59e0b;">
                    <div class="rank-number" style="color: #f59e0b;">Not Found</div>
                    <div class="rank-text">
                        "${keyword}" was not found${searchContext}
                    </div>
                    <div class="rank-details">
                        Analyzed ${rangeText} • Analysis took ${(searchDuration / 1000).toFixed(1)} seconds
                    </div>
                </div>
            `;
        }
    }
    
    setLoadingState(isLoading) {
        if (isLoading) {
            this.checkBtn.disabled = true;
            this.btnText.textContent = 'Searching...';
            this.spinner.classList.remove('hidden');
            this.keywordInput.disabled = true;
        } else {
            this.checkBtn.disabled = false;
            this.btnText.textContent = 'Check Rank';
            this.spinner.classList.add('hidden');
            this.keywordInput.disabled = false;
        }
    }
    
    showError(message, showRetry = false) {
        this.errorMessage.textContent = message;
        this.errorSection.classList.remove('hidden');
        this.errorSection.classList.add('fade-in');
        
        if (showRetry) {
            this.retryBtn.classList.remove('hidden');
        } else {
            this.retryBtn.classList.add('hidden');
        }
    }
    
    clearErrors() {
        this.errorSection.classList.add('hidden');
        this.errorMessage.textContent = '';
        this.retryBtn.classList.add('hidden');
    }
    
    clearResults() {
        this.resultsSection.classList.add('hidden');
        this.resultContent.innerHTML = '';
    }
    
    resetForm() {
        this.keywordInput.value = '';
        this.keywordInput.focus();
        this.clearResults();
        this.clearErrors();
        this.updateCharacterCounter();
        this.validateInput();
    }
    
    copyResultToClipboard() {
        if (!this.currentResult || !this.currentKeyword) return;
        
        let text;
        if (this.currentResult.found) {
            if (this.currentResult.multipleRankings && this.currentResult.allRanks && this.currentResult.allRanks.length > 1) {
                const ranksList = this.currentResult.allRanks.map(rank => `#${rank}`).join(', ');
                text = `Keyword: "${this.currentKeyword}" - Multiple positions: ${ranksList}`;
            } else {
                text = `Keyword: "${this.currentKeyword}" - Rank: #${this.currentResult.rank}`;
            }
        } else {
            text = `Keyword: "${this.currentKeyword}" - Not found in top ${this.resultsLimit?.value || 100} results`;
        }
            
        navigator.clipboard.writeText(text).then(() => {
            // Show temporary success message
            const originalText = this.copyResult.textContent;
            this.copyResult.textContent = '✓ Copied!';
            setTimeout(() => {
                this.copyResult.textContent = originalText;
            }, 1500);
        });
    }
    
    openInGoogle() {
        if (!this.currentKeyword) return;
        
        const domain = this.googleDomain?.value || 'google.com';
        const url = `https://www.${domain}/search?q=${encodeURIComponent(this.currentKeyword)}`;
        
        if (this.openInNewTab?.checked) {
            chrome.tabs.create({ url });
        } else {
            chrome.tabs.update({ url });
            // Clear page warning since we're navigating to Google
            setTimeout(() => this.clearPageWarning(), 1000);
        }
    }
    
    // History Management
    async saveSearchToHistory(keyword, result) {
        try {
            // Use enhanced storage format compatible with content script
            const data = await chrome.storage.local.get(['google_keyword_rank_history']);
            const history = data.google_keyword_rank_history || [];
            
            const searchEntry = {
                id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                keyword: keyword,
                timestamp: Date.now(),
                searchDate: new Date().toISOString(),
                results: {
                    found: result.found,
                    position: result.found ? result.rank : null,
                    allPositions: result.allRanks || (result.found ? [result.rank] : []), // Include all positions
                    multipleRankings: result.multipleRankings || false,
                    matchType: result.matchType || 'unknown',
                    confidence: result.confidence || 'medium',
                    totalResults: result.totalResults || 0
                },
                metadata: {
                    url: result.url || window.location.href,
                    userAgent: navigator.userAgent.substring(0, 100),
                    searchEngine: 'Google'
                }
            };
            
            // Add to beginning and limit to 50 entries
            history.unshift(searchEntry);
            const limitedHistory = history.slice(0, 50);
            
            await chrome.storage.local.set({ google_keyword_rank_history: limitedHistory });
            this.loadHistory();
        } catch (error) {
            console.warn('Failed to save search to history:', error);
        }
    }
    
    async loadHistory() {
        try {
            const data = await chrome.storage.local.get(['google_keyword_rank_history']);
            const history = data.google_keyword_rank_history || [];
            
            if (history.length === 0) {
                this.historyList.innerHTML = '<div class="text-center" style="color: #9ca3af; padding: 20px;">No search history yet</div>';
                return;
            }
            
            this.historyList.innerHTML = history.slice(0, 10).map(entry => `
                <div class="history-item" data-keyword="${entry.keyword}">
                    <div>
                        <div class="history-keyword">${entry.keyword}</div>
                        <div class="history-date">${new Date(entry.timestamp).toLocaleDateString()}</div>
                        <div class="history-details" style="font-size: 11px; color: #6b7280;">
                            ${entry.results.matchType || 'unknown'} match • ${entry.results.confidence || 'medium'} confidence
                        </div>
                    </div>
                    <div class="history-rank ${entry.results.found ? 'text-success' : 'text-warning'}">
                        ${entry.results.found ? '#' + entry.results.position : 'Not found'}
                    </div>
                </div>
            `).join('');
            
            // Add click listeners to history items
            this.historyList.querySelectorAll('.history-item').forEach(item => {
                item.addEventListener('click', () => {
                    const keyword = item.dataset.keyword;
                    this.keywordInput.value = keyword;
                    this.updateCharacterCounter();
                    this.validateInput();
                    this.toggleHistoryPanel();
                });
            });
        } catch (error) {
            console.warn('Failed to load search history:', error);
        }
    }
    
    async clearSearchHistory() {
        try {
            await chrome.storage.local.set({ google_keyword_rank_history: [] });
            this.loadHistory();
        } catch (error) {
            console.warn('Failed to clear search history:', error);
        }
    }
    
    toggleHistoryPanel() {
        this.historySection.classList.toggle('hidden');
        if (!this.historySection.classList.contains('hidden')) {
            this.loadHistory();
        }
    }
    
    // Settings Management
    async loadSettings() {
        try {
            const data = await chrome.storage.local.get(['extensionSettings']);
            const settings = data.extensionSettings || {};
            
            if (this.googleDomain) this.googleDomain.value = settings.googleDomain || 'google.com';
            if (this.resultsLimit) this.resultsLimit.value = settings.resultsLimit || '1000';
            if (this.enableNotifications) this.enableNotifications.checked = settings.enableNotifications !== false;
            if (this.openInNewTab) this.openInNewTab.checked = settings.openInNewTab || false;
            if (this.saveHistory) this.saveHistory.checked = settings.saveHistory !== false;
            if (this.showPositionNumbers) this.showPositionNumbers.checked = settings.showPositionNumbers !== false;
            
            // Load result count setting
            await this.loadResultCountSetting();
        } catch (error) {
            console.warn('Failed to load settings:', error);
        }
    }
    
    async saveSettings() {
        try {
            const settings = {
                googleDomain: this.googleDomain?.value || 'google.com',
                resultsLimit: this.resultsLimit?.value || '1000',
                enableNotifications: this.enableNotifications?.checked !== false,
                openInNewTab: this.openInNewTab?.checked || false,
                saveHistory: this.saveHistory?.checked !== false,
                showPositionNumbers: this.showPositionNumbers?.checked !== false,
                resultCount: this.currentResultCount || 'all'
            };
            
            await chrome.storage.local.set({ extensionSettings: settings });
        } catch (error) {
            console.warn('Failed to save settings:', error);
        }
    }
    
    openSettings() {
        this.settingsPanel.classList.add('show');
    }
    
    closeSettingsPanel() {
        this.settingsPanel.classList.remove('show');
    }
    
    // Stats Management
    async updateStats() {
        try {
            const data = await chrome.storage.local.get(['extensionStats']);
            const stats = data.extensionStats || { totalSearches: 0 };
            
            stats.totalSearches++;
            stats.lastSearch = this.currentKeyword;
            stats.lastSearchTime = new Date().toISOString();
            
            await chrome.storage.local.set({ extensionStats: stats });
            this.loadStats();
        } catch (error) {
            console.warn('Failed to update stats:', error);
        }
    }
    
    async loadStats() {
        try {
            const data = await chrome.storage.local.get(['extensionStats']);
            const stats = data.extensionStats || { totalSearches: 0 };
            
            this.totalSearches.textContent = stats.totalSearches || 0;
            this.lastKeyword.textContent = stats.lastSearch || '-';
            
            if (stats.totalSearches > 0) {
                this.quickStats.classList.remove('hidden');
            }
        } catch (error) {
            console.warn('Failed to load stats:', error);
        }
    }
    
    // Communication with content script
    async sendMessageToContentScript(message) {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab) {
                throw new Error('No active tab found');
            }
            
            if (!tab.url.includes('google.com/search')) {
                throw new Error('Please navigate to Google, search for your main term, then use this extension to find your keyword rank in those results.');
            }
            
            const response = await chrome.tabs.sendMessage(tab.id, message);
            
            if (!response) {
                throw new Error('No response from content script. Please reload the page and try again.');
            }
            
            return response;
        } catch (error) {
            console.error('Failed to communicate with content script:', error);
            
            // Provide more helpful error messages based on error type
            if (error.message.includes('Could not establish connection') || 
                error.message.includes('Receiving end does not exist')) {
                throw new Error('Content script not loaded. Please reload the Google search page and try again.');
            } else if (error.message.includes('No tab')) {
                throw new Error('No active tab found. Please open a browser tab and try again.');
            } else if (error.message.includes('Cannot access chrome://')) {
                throw new Error('Please navigate to a regular Google search page, not a Chrome system page.');
            }
            
            throw error;
        }
    }
    
    // =========================================================================
    // BOT AVOIDANCE TESTING METHODS
    // =========================================================================
    
    async runBotAvoidanceTest() {
        this.testBotAvoidance.disabled = true;
        this.testBotAvoidance.textContent = 'Running Tests...';
        this.testResults.classList.remove('hidden', 'success', 'warning', 'error');
        this.testResults.textContent = 'Initializing bot avoidance tests...';
        
        try {
            const response = await this.sendMessageToContentScript({
                action: 'testBotAvoidance'
            });
            
            this.displayTestResults(response);
            
        } catch (error) {
            this.testResults.className = 'test-results error';
            this.testResults.textContent = `Test failed: ${error.message}`;
        } finally {
            this.testBotAvoidance.disabled = false;
            this.testBotAvoidance.textContent = 'Run Bot Avoidance Test';
        }
    }
    
    async runBotAvoidanceValidation() {
        this.validateBotAvoidance.disabled = true;
        this.validateBotAvoidance.textContent = 'Validating...';
        this.validationResults.classList.remove('hidden', 'success', 'warning', 'error');
        this.validationResults.textContent = 'Running validation against known patterns...';
        
        try {
            const response = await this.sendMessageToContentScript({
                action: 'validateBotAvoidance'
            });
            
            this.displayValidationResults(response);
            
        } catch (error) {
            this.validationResults.className = 'test-results error';
            this.validationResults.textContent = `Validation failed: ${error.message}`;
        } finally {
            this.validateBotAvoidance.disabled = false;
            this.validateBotAvoidance.textContent = 'Validate Detection Patterns';
        }
    }
    
    displayTestResults(results) {
        this.testResults.classList.remove('hidden');
        
        if (results.overall.passed) {
            this.testResults.className = 'test-results success';
        } else if (results.overall.score >= 0.5) {
            this.testResults.className = 'test-results warning';
        } else {
            this.testResults.className = 'test-results error';
        }
        
        const scorePercent = Math.round(results.overall.score * 100);
        
        let output = `🧪 Bot Avoidance Test Results\n`;
        output += `Overall Score: ${scorePercent}% ${results.overall.passed ? '✅' : '❌'}\n\n`;
        
        // Delay testing
        if (results.delayTesting) {
            const delayScore = Math.round(results.delayTesting.score * 100);
            output += `⏰ Delay Testing: ${delayScore}% ${results.delayTesting.passed ? '✅' : '❌'}\n`;
            output += `  Average: ${Math.round(results.delayTesting.details.averageDelay)}ms\n`;
            output += `  Range: ${results.delayTesting.details.minDelay}-${results.delayTesting.details.maxDelay}ms\n\n`;
        }
        
        // Pattern testing
        if (results.patternTesting) {
            const patternScore = Math.round(results.patternTesting.score * 100);
            output += `🎭 Pattern Testing: ${patternScore}% ${results.patternTesting.passed ? '✅' : '❌'}\n`;
            output += `  Patterns tested: ${results.patternTesting.details.patternTests.length}\n\n`;
        }
        
        // Detection testing
        if (results.detectionTesting) {
            const detectionScore = Math.round(results.detectionTesting.score * 100);
            output += `🚨 Detection Testing: ${detectionScore}% ${results.detectionTesting.passed ? '✅' : '❌'}\n\n`;
        }
        
        // Stealth testing
        if (results.stealthTesting) {
            const stealthScore = Math.round(results.stealthTesting.score * 100);
            output += `🥷 Stealth Testing: ${stealthScore}% ${results.stealthTesting.passed ? '✅' : '❌'}\n`;
        }
        
        this.testResults.textContent = output;
    }
    
    displayValidationResults(results) {
        this.validationResults.classList.remove('hidden');
        
        if (results.overallSafety) {
            this.validationResults.className = 'test-results success';
        } else {
            this.validationResults.className = 'test-results warning';
        }
        
        let output = `🔍 Bot Detection Validation\n`;
        output += `Overall Safety: ${results.overallSafety ? 'SAFE ✅' : 'NEEDS IMPROVEMENT ⚠️'}\n\n`;
        
        // Timing patterns
        if (results.timingPatterns) {
            output += `⏰ Timing Patterns: ${results.timingPatterns.safe ? 'SAFE ✅' : 'RISKY ❌'}\n`;
            if (results.timingPatterns.details) {
                output += `  Avg Delay: ${Math.round(results.timingPatterns.details.averageDelay)}ms\n`;
                output += `  Variance: ${Math.round(results.timingPatterns.details.variance)}\n`;
            }
            output += '\n';
        }
        
        // Request frequency
        if (results.requestFrequency) {
            output += `📊 Request Frequency: ${results.requestFrequency.safe ? 'SAFE ✅' : 'TOO HIGH ❌'}\n`;
            if (results.requestFrequency.details) {
                output += `  Rate: ${results.requestFrequency.details.requestsPerMinute.toFixed(1)}/min\n`;
            }
            output += '\n';
        }
        
        // Behavior consistency
        if (results.behaviorConsistency) {
            output += `🎭 Behavior: ${results.behaviorConsistency.safe ? 'CONSISTENT ✅' : 'SUSPICIOUS ❌'}\n`;
        }
        
        this.validationResults.textContent = output;
    }

    // =========================================================================
    // POSITION NUMBERS METHODS
    // =========================================================================
    
    async togglePositionNumbers() {
        try {
            const action = this.showPositionNumbers?.checked ? 'addPositionNumbers' : 'removePositionNumbers';
            
            const response = await this.sendMessageToContentScript({
                action: action
            });
            
            if (response.success) {

                // Save the setting
                this.saveSettings();
            } else {
                console.error('❌ Failed to toggle position numbers:', response.error);
                // Revert checkbox if failed
                if (this.showPositionNumbers) {
                    this.showPositionNumbers.checked = !this.showPositionNumbers.checked;
                }
            }
            
        } catch (error) {
            console.error('❌ Error toggling position numbers:', error);
            // Revert checkbox if failed
            if (this.showPositionNumbers) {
                this.showPositionNumbers.checked = !this.showPositionNumbers.checked;
            }
        }
    }

    // =========================================================================
    // RESULT COUNT METHODS
    // =========================================================================

    showMessage(text, type = 'info', duration = 3000) {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());
        
        // Create new message
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.textContent = text;
        
        // Insert after form
        const form = document.getElementById('rankForm');
        form.parentNode.insertBefore(message, form.nextSibling);
        
        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                if (message.parentNode) {
                    message.remove();
                }
            }, duration);
        }
    }
    
    getAnalysisResultCount() {
        // Determine how many results to analyze based on current settings
        if (this.currentResultCount === 'all') {
            // 'All' means analyze all available results on the current page
            return 1000; // Set high limit to capture all available results
        } else {
            return parseInt(this.currentResultCount);
        }
    }
    
    // =========================================================================
    // RESULT COUNT SELECTION METHODS
    // =========================================================================
    
    selectResultCount(count, silent = false) {
        try {
            // Update current result count
            this.currentResultCount = count;
            
            // Update button states
            this.resultCountButtons.forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.count === count) {
                    btn.classList.add('active');
                }
            });
            
            // Save the selection
            this.saveResultCountSetting();
            
            // Show feedback only if not silent (avoid showing on initial load)
            if (!silent) {
                const displayCount = count === 'all' ? 'all available' : count;
                this.showMessage(`📊 Will analyze ${displayCount} search results`, 'success', 1500);
                
                // Auto-trigger search if keyword is entered and not silent
                if (this.keywordInput?.value?.trim() && !silent) {
                    setTimeout(() => {
                        this.handleRankCheck();
                    }, 800); // Small delay to show the message first
                }
            }
            
        } catch (error) {
            console.error('Error selecting result count:', error);
            if (!silent) {
                this.showError('Failed to update result count setting');
            }
        }
    }
    
    async saveResultCountSetting() {
        try {
            const data = await chrome.storage.local.get(['extensionSettings']);
            const settings = data.extensionSettings || {};
            settings.resultCount = this.currentResultCount;
            await chrome.storage.local.set({ extensionSettings: settings });
        } catch (error) {
            console.error('Error saving result count setting:', error);
        }
    }
    
    async loadResultCountSetting() {
        try {
            const data = await chrome.storage.local.get(['extensionSettings']);
            const settings = data.extensionSettings || {};
            const savedCount = settings.resultCount || 'all';
            this.selectResultCount(savedCount, true); // Silent load to avoid showing message
        } catch (error) {
            console.error('Error loading result count setting:', error);
            // Default to 'all' if error
            this.selectResultCount('all', true);
        }
    }
}

// Initialize the extension when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const rankFinder = new KeywordRankFinder();
    
    // Make it globally available for debugging
    window.rankFinder = rankFinder;
});

// Handle any unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    event.preventDefault();
});
