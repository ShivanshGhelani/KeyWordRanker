/**
 * Enhanced Popup JavaScript for Keyword Rank Finder Chrome Extension
 * Handles user interactions, form validation, history, settings, and communication with content scripts
 */

class KeywordRankFinder {
    constructor() {
        // Core elements
        this.form = document.getElementById('rankForm');
        this.keywordInput = document.getElementById('keyword');
        this.checkBtn = document.getElementById('checkRankBtn');
        this.spinner = document.getElementById('spinner');
        this.btnText = document.querySelector('.btn-text');
        
        // Character counter
        this.charCount = document.getElementById('charCount');
        
        // Options
        this.openInNewTab = document.getElementById('openInNewTab');
        this.saveHistory = document.getElementById('saveHistory');
        
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
        
        // State
        this.currentKeyword = '';
        this.currentResult = null;
        this.searchStartTime = null;
        
        this.init();
    }
    
    init() {
        this.attachEventListeners();
        this.loadSettings();
        this.loadStats();
        this.loadHistory();
        this.setupCharacterCounter();
        this.checkCurrentPage();
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
    }
    
    setupCharacterCounter() {
        this.updateCharacterCounter();
    }
    
    async checkCurrentPage() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab) return;
            
            if (!tab.url.includes('google.com')) {
                this.showPageWarning('For best results, navigate to Google search first.');
            } else {
                this.clearPageWarning();
            }
        } catch (error) {
            console.warn('Could not check current page:', error);
        }
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
    
    updateCharacterCounter() {
        const length = this.keywordInput.value.length;
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
        const keyword = this.keywordInput.value.trim();
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
            
            if (this.saveHistory.checked) {
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
        const keyword = this.keywordInput.value.trim();
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
            // First check if we're on a Google search page
            const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!currentTab.url.includes('google.com')) {
                // Navigate to Google search
                const domain = this.googleDomain.value || 'google.com';
                const searchUrl = `https://www.${domain}/search?q=${encodeURIComponent(keyword)}`;
                
                await chrome.tabs.update(currentTab.id, { url: searchUrl });
                
                // Wait for page to load and content script to be ready
                await this.waitForPageLoad(currentTab.id);
            }
            
            // Send scraping request to content script
            const response = await this.sendMessageToContentScript({
                action: 'scrapeResults',
                keyword: keyword
            });
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to scrape search results');
            }
            
            // Transform content script response to our format
            return {
                rank: response.ranking.found ? response.ranking.position : null,
                found: response.ranking.found,
                matchType: response.ranking.matchedIn || 'unknown',
                fuzzy: response.ranking.fuzzy || false,
                totalResults: response.totalResults
            };
            
        } catch (error) {
            console.error('Error in real rank check:', error);
            throw error;
        }
    }
    
    async waitForPageLoad(tabId, maxWait = 10000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWait) {
            try {
                // Try to ping the content script
                const response = await chrome.tabs.sendMessage(tabId, { action: 'ping' });
                if (response && response.status === 'alive') {
                    // Give it a bit more time to fully load
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    return true;
                }
            } catch (error) {
                // Content script not ready yet, wait and retry
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        
        throw new Error('Timeout waiting for Google search page to load');
    }
    
    displayResults(result, keyword) {
        const searchDuration = Date.now() - this.searchStartTime;
        this.searchTime.textContent = `Search completed in ${(searchDuration / 1000).toFixed(1)}s`;
        
        this.resultsSection.classList.remove('hidden');
        this.resultsSection.classList.add('fade-in');
        
        if (result.found) {
            const fuzzyText = result.fuzzy ? ' (fuzzy match)' : '';
            const totalResultsText = result.totalResults ? ` of ${result.totalResults} results` : '';
            
            this.resultContent.innerHTML = `
                <div class="rank-result">
                    <div class="rank-number">#${result.rank}</div>
                    <div class="rank-text">
                        "${keyword}" appears at position <strong>${result.rank}</strong> in Google search results${fuzzyText}
                    </div>
                    <div class="rank-details">
                        Found in: ${result.matchType}${totalResultsText} • Search took ${(searchDuration / 1000).toFixed(1)} seconds
                    </div>
                </div>
            `;
        } else {
            const totalResultsText = result.totalResults ? `${result.totalResults} ` : '';
            
            this.resultContent.innerHTML = `
                <div class="rank-result" style="border-left-color: #f59e0b;">
                    <div class="rank-number" style="color: #f59e0b;">Not Found</div>
                    <div class="rank-text">
                        "${keyword}" was not found in the ${totalResultsText}Google search results
                    </div>
                    <div class="rank-details">
                        Search took ${(searchDuration / 1000).toFixed(1)} seconds
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
        
        const text = this.currentResult.found 
            ? `Keyword: "${this.currentKeyword}" - Rank: #${this.currentResult.rank}`
            : `Keyword: "${this.currentKeyword}" - Not found in top ${this.resultsLimit.value || 100} results`;
            
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
        
        const domain = this.googleDomain.value || 'google.com';
        const url = `https://www.${domain}/search?q=${encodeURIComponent(this.currentKeyword)}`;
        
        if (this.openInNewTab.checked) {
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
            const data = await chrome.storage.local.get(['searchHistory']);
            const history = data.searchHistory || [];
            
            const searchEntry = {
                keyword: keyword,
                rank: result.found ? result.rank : null,
                found: result.found,
                timestamp: new Date().toISOString(),
                matchType: result.matchType
            };
            
            // Add to beginning and limit to 50 entries
            history.unshift(searchEntry);
            const limitedHistory = history.slice(0, 50);
            
            await chrome.storage.local.set({ searchHistory: limitedHistory });
            this.loadHistory();
        } catch (error) {
            console.warn('Failed to save search to history:', error);
        }
    }
    
    async loadHistory() {
        try {
            const data = await chrome.storage.local.get(['searchHistory']);
            const history = data.searchHistory || [];
            
            if (history.length === 0) {
                this.historyList.innerHTML = '<div class="text-center" style="color: #9ca3af; padding: 20px;">No search history yet</div>';
                return;
            }
            
            this.historyList.innerHTML = history.slice(0, 10).map(entry => `
                <div class="history-item" data-keyword="${entry.keyword}">
                    <div>
                        <div class="history-keyword">${entry.keyword}</div>
                        <div class="history-date">${new Date(entry.timestamp).toLocaleDateString()}</div>
                    </div>
                    <div class="history-rank ${entry.found ? 'text-success' : 'text-warning'}">
                        ${entry.found ? `#${entry.rank}` : 'Not found'}
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
            await chrome.storage.local.set({ searchHistory: [] });
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
            
            this.googleDomain.value = settings.googleDomain || 'google.com';
            this.resultsLimit.value = settings.resultsLimit || '100';
            this.enableNotifications.checked = settings.enableNotifications !== false;
            this.openInNewTab.checked = settings.openInNewTab || false;
            this.saveHistory.checked = settings.saveHistory !== false;
        } catch (error) {
            console.warn('Failed to load settings:', error);
        }
    }
    
    async saveSettings() {
        try {
            const settings = {
                googleDomain: this.googleDomain.value,
                resultsLimit: this.resultsLimit.value,
                enableNotifications: this.enableNotifications.checked,
                openInNewTab: this.openInNewTab.checked,
                saveHistory: this.saveHistory.checked
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
            
            if (!tab.url.includes('google.com')) {
                throw new Error('Please navigate to a Google search page first');
            }
            
            const response = await chrome.tabs.sendMessage(tab.id, message);
            
            if (!response) {
                throw new Error('No response from content script. Please reload the page and try again.');
            }
            
            return response;
        } catch (error) {
            console.error('Failed to communicate with content script:', error);
            
            // Provide more helpful error messages
            if (error.message.includes('Could not establish connection')) {
                throw new Error('Content script not loaded. Please reload the Google search page and try again.');
            } else if (error.message.includes('No tab')) {
                throw new Error('No active tab found. Please open a browser tab and try again.');
            }
            
            throw error;
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
