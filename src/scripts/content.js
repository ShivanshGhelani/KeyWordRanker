/**
 * Content Script for Keyword Rank Finder Chrome Extension
 * Injected into Google Search pages to scrape and analyze SERP data
 */

class GoogleSERPScraper {
    constructor() {
        this.resultSelectors = {
            // Main organic search results
            organicResults: 'div[data-header-feature] h3, .g h3, .MjjYud h3',
            // Result containers
            resultContainers: '.g, .MjjYud, div[data-header-feature]',
            // Snippets and descriptions
            snippets: '.VwiC3b, .s, .IsZvec',
            // URLs
            urls: '.yuRUbf a, .dmenKe a',
            // Next page button (for pagination)
            nextButton: '#pnnext'
        };
        
        this.currentResults = [];
        this.init();
    }
    
    init() {
        console.log('Keyword Rank Finder: Content script loaded');
        this.setupMessageListener();
        this.observePageChanges();
    }
    
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            console.log('Content script received message:', request);
            
            switch (request.action) {
                case 'scrapeResults':
                    this.handleScrapeRequest(request, sendResponse);
                    return true; // Keep the message channel open for async response
                    
                case 'searchKeyword':
                    this.handleSearchRequest(request, sendResponse);
                    return true;
                    
                case 'ping':
                    sendResponse({ status: 'alive' });
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
            const results = this.scrapeSearchResults();
            const ranking = this.findKeywordRanking(keyword, results);
            
            sendResponse({
                success: true,
                keyword: keyword,
                ranking: ranking,
                totalResults: results.length,
                results: results.slice(0, 10) // Send first 10 for debugging
            });
        } catch (error) {
            console.error('Error scraping results:', error);
            sendResponse({
                success: false,
                error: error.message
            });
        }
    }
    
    async handleSearchRequest(request, sendResponse) {
        try {
            const keyword = request.keyword;
            
            // Navigate to Google search with the keyword
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}`;
            
            if (window.location.href !== searchUrl) {
                window.location.href = searchUrl;
                // Wait for page to load
                setTimeout(() => {
                    sendResponse({ success: true, message: 'Navigated to search page' });
                }, 2000);
            } else {
                // Already on the search page
                sendResponse({ success: true, message: 'Already on search page' });
            }
        } catch (error) {
            sendResponse({ success: false, error: error.message });
        }
    }
    
    scrapeSearchResults() {
        const results = [];
        
        try {
            // Get all result containers
            const resultElements = document.querySelectorAll(this.resultSelectors.resultContainers);
            console.log(`Found ${resultElements.length} result containers`);
            
            resultElements.forEach((container, index) => {
                try {
                    const titleElement = container.querySelector('h3');
                    const linkElement = container.querySelector('a');
                    const snippetElement = container.querySelector(this.resultSelectors.snippets);
                    
                    if (titleElement && linkElement) {
                        const result = {
                            position: index + 1,
                            title: titleElement.textContent.trim(),
                            url: linkElement.href,
                            snippet: snippetElement ? snippetElement.textContent.trim() : '',
                            element: container
                        };
                        
                        results.push(result);
                    }
                } catch (error) {
                    console.warn('Error processing result container:', error);
                }
            });
            
        } catch (error) {
            console.error('Error scraping search results:', error);
        }
        
        this.currentResults = results;
        return results;
    }
    
    findKeywordRanking(keyword, results) {
        if (!keyword || !results.length) {
            return { found: false, position: null };
        }
        
        const normalizedKeyword = this.normalizeText(keyword);
        console.log('Searching for normalized keyword:', normalizedKeyword);
        
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            const normalizedTitle = this.normalizeText(result.title);
            const normalizedSnippet = this.normalizeText(result.snippet);
            
            // Check for exact matches first
            if (this.containsKeyword(normalizedTitle, normalizedKeyword) ||
                this.containsKeyword(normalizedSnippet, normalizedKeyword)) {
                
                console.log(`Found keyword at position ${result.position}:`, result);
                return {
                    found: true,
                    position: result.position,
                    matchedIn: this.containsKeyword(normalizedTitle, normalizedKeyword) ? 'title' : 'snippet',
                    result: result
                };
            }
        }
        
        // Try fuzzy matching if no exact match found
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            const normalizedTitle = this.normalizeText(result.title);
            const normalizedSnippet = this.normalizeText(result.snippet);
            
            if (this.fuzzyMatch(normalizedTitle, normalizedKeyword) ||
                this.fuzzyMatch(normalizedSnippet, normalizedKeyword)) {
                
                console.log(`Found fuzzy match at position ${result.position}:`, result);
                return {
                    found: true,
                    position: result.position,
                    matchedIn: this.fuzzyMatch(normalizedTitle, normalizedKeyword) ? 'title' : 'snippet',
                    result: result,
                    fuzzy: true
                };
            }
        }
        
        return { found: false, position: null };
    }
    
    normalizeText(text) {
        if (!text) return '';
        
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ') // Replace non-alphanumeric with spaces
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .trim();
    }
    
    containsKeyword(text, keyword) {
        return text.includes(keyword);
    }
    
    fuzzyMatch(text, keyword, threshold = 0.7) {
        const keywordWords = keyword.split(' ').filter(word => word.length > 2);
        const textWords = text.split(' ');
        
        let matchedWords = 0;
        
        keywordWords.forEach(keywordWord => {
            if (textWords.some(textWord => 
                textWord.includes(keywordWord) || keywordWord.includes(textWord)
            )) {
                matchedWords++;
            }
        });
        
        const matchRatio = matchedWords / keywordWords.length;
        return matchRatio >= threshold;
    }
    
    observePageChanges() {
        // Watch for DOM changes (useful for dynamic content loading)
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Check if new search results were added
                    const hasNewResults = Array.from(mutation.addedNodes).some(node => 
                        node.nodeType === 1 && node.querySelector && 
                        node.querySelector(this.resultSelectors.organicResults)
                    );
                    
                    if (hasNewResults) {
                        console.log('New search results detected');
                        // Could trigger automatic re-scraping here if needed
                    }
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // Utility method to highlight found results (for debugging)
    highlightResult(position) {
        const result = this.currentResults.find(r => r.position === position);
        if (result && result.element) {
            result.element.style.border = '2px solid #ff0000';
            result.element.style.backgroundColor = '#fff3cd';
            result.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    // Method to simulate human-like behavior
    async addRandomDelay(min = 500, max = 1500) {
        const delay = Math.random() * (max - min) + min;
        return new Promise(resolve => setTimeout(resolve, delay));
    }
}

// Initialize the scraper when the script loads
const scraper = new GoogleSERPScraper();

// Make it globally available for debugging
window.serpScraper = scraper;

// Add some debugging helpers
window.debugScraper = {
    scrapeNow: () => scraper.scrapeSearchResults(),
    findKeyword: (keyword) => {
        const results = scraper.scrapeSearchResults();
        return scraper.findKeywordRanking(keyword, results);
    },
    highlight: (position) => scraper.highlightResult(position)
};
