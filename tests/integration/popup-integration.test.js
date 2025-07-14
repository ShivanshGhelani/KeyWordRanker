/**
 * Integration Tests for Popup Interface
 * Tests UI interactions, form validation, and Chrome API integration
 */

describe('Popup Integration Tests', function() {
    
    let mockPopup, mockDOM;
    
    beforeEach(function() {
        // Create mock DOM elements
        mockDOM = {
            form: document.createElement('form'),
            keywordInput: document.createElement('input'),
            submitBtn: document.createElement('button'),
            resultsSection: document.createElement('div'),
            errorSection: document.createElement('div'),
            historySection: document.createElement('div')
        };
        
        // Set up form elements
        mockDOM.form.id = 'rankForm';
        mockDOM.keywordInput.id = 'keyword';
        mockDOM.keywordInput.type = 'text';
        mockDOM.submitBtn.id = 'checkRankBtn';
        mockDOM.submitBtn.type = 'submit';
        mockDOM.resultsSection.id = 'results';
        mockDOM.errorSection.id = 'error';
        mockDOM.historySection.id = 'history';
        
        // Add to DOM
        document.body.appendChild(mockDOM.form);
        mockDOM.form.appendChild(mockDOM.keywordInput);
        mockDOM.form.appendChild(mockDOM.submitBtn);
        document.body.appendChild(mockDOM.resultsSection);
        document.body.appendChild(mockDOM.errorSection);
        document.body.appendChild(mockDOM.historySection);
        
        // Mock Chrome APIs
        window.chrome = {
            tabs: {
                query: () => Promise.resolve([{ 
                    id: 1, 
                    url: 'https://www.google.com/search?q=test',
                    active: true 
                }]),
                sendMessage: (tabId, message) => Promise.resolve({
                    success: true,
                    found: true,
                    position: 1,
                    keyword: message.keyword || 'test',
                    confidence: 0.9
                })
            },
            storage: {
                local: {
                    get: () => Promise.resolve({}),
                    set: () => Promise.resolve()
                }
            }
        };
        
        // Mock popup class
        if (typeof KeywordRankFinder === 'undefined') {
            window.KeywordRankFinder = class {
                constructor() {
                    this.form = document.getElementById('rankForm');
                    this.keywordInput = document.getElementById('keyword');
                    this.resultsSection = document.getElementById('results');
                    this.errorSection = document.getElementById('error');
                    this.isLoading = false;
                }

                async handleRankCheck() {
                    const keyword = this.keywordInput.value.trim();
                    
                    if (!keyword) {
                        this.showError('Please enter a keyword');
                        return;
                    }
                    
                    if (keyword.length > 100) {
                        this.showError('Keyword too long (max 100 characters)');
                        return;
                    }
                    
                    try {
                        this.showLoading();
                        const response = await this.sendMessageToContentScript({
                            action: 'findKeywordRank',
                            keyword: keyword
                        });
                        
                        if (response.success) {
                            this.showResults(response);
                        } else {
                            this.showError(response.error || 'Failed to find keyword rank');
                        }
                    } catch (error) {
                        this.showError(error.message);
                    } finally {
                        this.hideLoading();
                    }
                }

                async sendMessageToContentScript(message) {
                    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                    if (!tab) throw new Error('No active tab');
                    return await chrome.tabs.sendMessage(tab.id, message);
                }

                showLoading() {
                    this.isLoading = true;
                    this.hideError();
                    this.hideResults();
                }

                hideLoading() {
                    this.isLoading = false;
                }

                showResults(result) {
                    this.hideError();
                    this.resultsSection.style.display = 'block';
                    this.resultsSection.innerHTML = `
                        <div class="result-success">
                            <h3>✅ Keyword Found!</h3>
                            <p>Position: ${result.position}</p>
                            <p>Confidence: ${Math.round(result.confidence * 100)}%</p>
                        </div>
                    `;
                }

                showError(message) {
                    this.hideResults();
                    this.errorSection.style.display = 'block';
                    this.errorSection.innerHTML = `
                        <div class="error-message">
                            <h3>❌ Error</h3>
                            <p>${message}</p>
                        </div>
                    `;
                }

                hideResults() {
                    this.resultsSection.style.display = 'none';
                }

                hideError() {
                    this.errorSection.style.display = 'none';
                }

                validateKeyword(keyword) {
                    if (!keyword || keyword.trim().length === 0) {
                        return { valid: false, error: 'Keyword cannot be empty' };
                    }
                    
                    if (keyword.length > 100) {
                        return { valid: false, error: 'Keyword too long (max 100 characters)' };
                    }
                    
                    if (keyword.trim().length < 2) {
                        return { valid: false, error: 'Keyword too short (min 2 characters)' };
                    }
                    
                    return { valid: true };
                }

                updateCharacterCounter() {
                    const charCount = this.keywordInput.value.length;
                    const counter = document.getElementById('charCount');
                    if (counter) {
                        counter.textContent = charCount;
                        counter.style.color = charCount > 100 ? 'red' : 'inherit';
                    }
                }

                resetForm() {
                    this.keywordInput.value = '';
                    this.hideResults();
                    this.hideError();
                    this.updateCharacterCounter();
                }
            };
        }
        
        mockPopup = new KeywordRankFinder();
    });

    afterEach(function() {
        // Clean up DOM
        if (mockDOM.form.parentNode) {
            mockDOM.form.parentNode.removeChild(mockDOM.form);
        }
        if (mockDOM.resultsSection.parentNode) {
            mockDOM.resultsSection.parentNode.removeChild(mockDOM.resultsSection);
        }
        if (mockDOM.errorSection.parentNode) {
            mockDOM.errorSection.parentNode.removeChild(mockDOM.errorSection);
        }
        if (mockDOM.historySection.parentNode) {
            mockDOM.historySection.parentNode.removeChild(mockDOM.historySection);
        }
    });

    it('should validate keyword input correctly', function() {
        // Test empty keyword
        let validation = mockPopup.validateKeyword('');
        expect(validation.valid).toBeFalsy();
        expect(validation.error).toContain('empty');
        
        // Test too short keyword
        validation = mockPopup.validateKeyword('a');
        expect(validation.valid).toBeFalsy();
        expect(validation.error).toContain('short');
        
        // Test too long keyword
        const longKeyword = 'a'.repeat(101);
        validation = mockPopup.validateKeyword(longKeyword);
        expect(validation.valid).toBeFalsy();
        expect(validation.error).toContain('long');
        
        // Test valid keyword
        validation = mockPopup.validateKeyword('valid keyword');
        expect(validation.valid).toBeTruthy();
    });

    it('should handle successful keyword rank check', async function() {
        mockPopup.keywordInput.value = 'test keyword';
        
        await mockPopup.handleRankCheck();
        
        expect(mockPopup.resultsSection.style.display).toBe('block');
        expect(mockPopup.resultsSection.innerHTML).toContain('Keyword Found');
        expect(mockPopup.resultsSection.innerHTML).toContain('Position: 1');
        expect(mockPopup.errorSection.style.display).toBe('none');
    });

    it('should handle empty keyword submission', async function() {
        mockPopup.keywordInput.value = '';
        
        await mockPopup.handleRankCheck();
        
        expect(mockPopup.errorSection.style.display).toBe('block');
        expect(mockPopup.errorSection.innerHTML).toContain('Please enter a keyword');
        expect(mockPopup.resultsSection.style.display).toBe('none');
    });

    it('should handle keyword too long error', async function() {
        mockPopup.keywordInput.value = 'a'.repeat(101);
        
        await mockPopup.handleRankCheck();
        
        expect(mockPopup.errorSection.style.display).toBe('block');
        expect(mockPopup.errorSection.innerHTML).toContain('too long');
        expect(mockPopup.resultsSection.style.display).toBe('none');
    });

    it('should handle Chrome API communication errors', async function() {
        // Mock Chrome API to throw error
        chrome.tabs.sendMessage = () => Promise.reject(new Error('Content script not available'));
        
        mockPopup.keywordInput.value = 'test keyword';
        
        await mockPopup.handleRankCheck();
        
        expect(mockPopup.errorSection.style.display).toBe('block');
        expect(mockPopup.errorSection.innerHTML).toContain('Content script not available');
    });

    it('should handle failed rank check response', async function() {
        // Mock failed response
        chrome.tabs.sendMessage = () => Promise.resolve({
            success: false,
            error: 'Keyword not found'
        });
        
        mockPopup.keywordInput.value = 'test keyword';
        
        await mockPopup.handleRankCheck();
        
        expect(mockPopup.errorSection.style.display).toBe('block');
        expect(mockPopup.errorSection.innerHTML).toContain('Keyword not found');
    });

    it('should show loading state during request', async function() {
        let resolveMessage;
        chrome.tabs.sendMessage = () => new Promise(resolve => {
            resolveMessage = resolve;
        });
        
        mockPopup.keywordInput.value = 'test keyword';
        
        // Start the request
        const checkPromise = mockPopup.handleRankCheck();
        
        // Check loading state
        expect(mockPopup.isLoading).toBeTruthy();
        expect(mockPopup.errorSection.style.display).toBe('none');
        expect(mockPopup.resultsSection.style.display).toBe('none');
        
        // Resolve the request
        resolveMessage({ success: true, found: true, position: 1, confidence: 0.9 });
        await checkPromise;
        
        // Check loading state is cleared
        expect(mockPopup.isLoading).toBeFalsy();
    });

    it('should update character counter', function() {
        // Create character counter element
        const charCount = document.createElement('span');
        charCount.id = 'charCount';
        document.body.appendChild(charCount);
        
        // Test character counting
        mockPopup.keywordInput.value = 'test';
        mockPopup.updateCharacterCounter();
        expect(charCount.textContent).toBe('4');
        
        // Test over limit
        mockPopup.keywordInput.value = 'a'.repeat(101);
        mockPopup.updateCharacterCounter();
        expect(charCount.textContent).toBe('101');
        expect(charCount.style.color).toBe('red');
        
        // Cleanup
        document.body.removeChild(charCount);
    });

    it('should reset form correctly', function() {
        // Set up form with data
        mockPopup.keywordInput.value = 'test keyword';
        mockPopup.showResults({ found: true, position: 1, confidence: 0.9 });
        
        // Reset form
        mockPopup.resetForm();
        
        expect(mockPopup.keywordInput.value).toBe('');
        expect(mockPopup.resultsSection.style.display).toBe('none');
        expect(mockPopup.errorSection.style.display).toBe('none');
    });

    it('should handle no active tab scenario', async function() {
        // Mock no active tab
        chrome.tabs.query = () => Promise.resolve([]);
        
        mockPopup.keywordInput.value = 'test keyword';
        
        await mockPopup.handleRankCheck();
        
        expect(mockPopup.errorSection.style.display).toBe('block');
        expect(mockPopup.errorSection.innerHTML).toContain('No active tab');
    });

    it('should communicate with content script correctly', async function() {
        let capturedMessage;
        chrome.tabs.sendMessage = (tabId, message) => {
            capturedMessage = message;
            return Promise.resolve({ success: true, found: true, position: 1 });
        };
        
        const testMessage = { action: 'findKeywordRank', keyword: 'test' };
        await mockPopup.sendMessageToContentScript(testMessage);
        
        expect(capturedMessage).toEqual(testMessage);
    });
});

console.log('✅ Popup Integration tests loaded');
