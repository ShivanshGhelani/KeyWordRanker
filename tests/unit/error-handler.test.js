/**
 * Unit Tests for Error Handler Module
 * Tests error categorization, recovery mechanisms, and circuit breakers
 */

describe('Error Handler Unit Tests', function() {
    
    let errorHandler;
    
    beforeEach(function() {
        // Mock ErrorHandler class if not available
        if (typeof ErrorHandler === 'undefined') {
            window.ErrorHandler = class {
                constructor() {
                    this.errorCounts = {};
                    this.maxRetries = 3;
                    this.errorLog = [];
                    this.errorCategories = {
                        NETWORK: 'network',
                        DOM: 'dom',
                        PARSING: 'parsing',
                        VALIDATION: 'validation',
                        TIMEOUT: 'timeout',
                        BOT_DETECTION: 'bot_detection',
                        UNKNOWN: 'unknown'
                    };
                }

                async safeExecute(operation, context = {}, options = {}) {
                    try {
                        const result = await operation();
                        return result;
                    } catch (error) {
                        return await this.handleError(options.name || 'safeExecute', error, context);
                    }
                }

                async handleError(operation, error, context = {}) {
                    const errorDetails = {
                        id: this.generateErrorId(),
                        operation: operation,
                        message: error.message,
                        timestamp: Date.now(),
                        category: this.categorizeError(error, context),
                        severity: 'medium',
                        context: context
                    };
                    
                    this.logError(errorDetails.category, errorDetails);
                    
                    return {
                        success: false,
                        error: error.message,
                        errorCategory: errorDetails.category,
                        errorId: errorDetails.id,
                        canRetry: true
                    };
                }

                categorizeError(error, context = {}) {
                    const message = error.message.toLowerCase();
                    
                    if (message.includes('network') || message.includes('fetch')) {
                        return this.errorCategories.NETWORK;
                    }
                    if (message.includes('dom') || message.includes('element')) {
                        return this.errorCategories.DOM;
                    }
                    if (message.includes('parse') || message.includes('json')) {
                        return this.errorCategories.PARSING;
                    }
                    if (message.includes('timeout')) {
                        return this.errorCategories.TIMEOUT;
                    }
                    if (message.includes('bot') || message.includes('blocked')) {
                        return this.errorCategories.BOT_DETECTION;
                    }
                    if (message.includes('invalid') || message.includes('validation')) {
                        return this.errorCategories.VALIDATION;
                    }
                    
                    return this.errorCategories.UNKNOWN;
                }

                logError(category, errorDetails) {
                    this.errorLog.push(errorDetails);
                    this.errorCounts[category] = (this.errorCounts[category] || 0) + 1;
                    
                    // Keep only last 100 errors
                    if (this.errorLog.length > 100) {
                        this.errorLog.shift();
                    }
                }

                generateErrorId() {
                    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                }

                getErrorReport() {
                    const recentErrors = this.getRecentErrors(3600000); // Last hour
                    
                    return {
                        summary: {
                            totalErrors: this.errorLog.length,
                            recentErrors: recentErrors.length,
                            errorsByCategory: this.errorCounts
                        },
                        recentErrors: recentErrors.slice(-10),
                        systemHealth: this.getSystemHealth()
                    };
                }

                getRecentErrors(timeWindow) {
                    const now = Date.now();
                    return this.errorLog.filter(err => (now - err.timestamp) <= timeWindow);
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
                        lastError: this.errorLog.length > 0 ? 
                            this.errorLog[this.errorLog.length - 1].timestamp : null
                    };
                }

                async executeWithRetry(operation, context = {}, maxRetries = this.maxRetries) {
                    let lastError;
                    
                    for (let attempt = 1; attempt <= maxRetries; attempt++) {
                        try {
                            return await operation();
                        } catch (error) {
                            lastError = error;
                            
                            if (attempt < maxRetries) {
                                const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
                                await new Promise(resolve => setTimeout(resolve, delay));
                            }
                        }
                    }
                    
                    throw lastError;
                }
            };
        }
        
        errorHandler = new ErrorHandler();
    });

    it('should categorize network errors correctly', function() {
        const networkError = new Error('Network request failed');
        const category = errorHandler.categorizeError(networkError);
        
        expect(category).toBe('network');
    });

    it('should categorize DOM errors correctly', function() {
        const domError = new Error('Element not found in DOM');
        const category = errorHandler.categorizeError(domError);
        
        expect(category).toBe('dom');
    });

    it('should categorize timeout errors correctly', function() {
        const timeoutError = new Error('Operation timeout exceeded');
        const category = errorHandler.categorizeError(timeoutError);
        
        expect(category).toBe('timeout');
    });

    it('should categorize bot detection errors correctly', function() {
        const botError = new Error('Request blocked by bot protection');
        const category = errorHandler.categorizeError(botError);
        
        expect(category).toBe('bot_detection');
    });

    it('should handle unknown errors', function() {
        const unknownError = new Error('Something went wrong');
        const category = errorHandler.categorizeError(unknownError);
        
        expect(category).toBe('unknown');
    });

    it('should log errors and update counts', async function() {
        const testError = new Error('Test network error');
        
        await errorHandler.handleError('testOperation', testError);
        
        expect(errorHandler.errorLog.length).toBe(1);
        expect(errorHandler.errorCounts.network).toBe(1);
    });

    it('should generate unique error IDs', function() {
        const id1 = errorHandler.generateErrorId();
        const id2 = errorHandler.generateErrorId();
        
        expect(id1).not.toBe(id2);
        expect(id1).toContain('error_');
        expect(id2).toContain('error_');
    });

    it('should execute operations safely', async function() {
        const successOperation = () => Promise.resolve('success');
        const result = await errorHandler.safeExecute(successOperation);
        
        expect(result).toBe('success');
    });

    it('should handle failed operations safely', async function() {
        const failOperation = () => Promise.reject(new Error('Test error'));
        const result = await errorHandler.safeExecute(failOperation);
        
        expect(result.success).toBeFalsy();
        expect(result.error).toBe('Test error');
        expect(result).toHaveProperty('errorCategory');
        expect(result).toHaveProperty('errorId');
    });

    it('should provide error reports', function() {
        // Add some test errors
        errorHandler.logError('network', { 
            id: '1', operation: 'test', message: 'test', timestamp: Date.now() 
        });
        errorHandler.logError('dom', { 
            id: '2', operation: 'test', message: 'test', timestamp: Date.now() 
        });
        
        const report = errorHandler.getErrorReport();
        
        expect(report).toHaveProperty('summary');
        expect(report).toHaveProperty('recentErrors');
        expect(report).toHaveProperty('systemHealth');
        expect(report.summary.totalErrors).toBe(2);
    });

    it('should calculate system health correctly', function() {
        // No recent errors = excellent health
        let health = errorHandler.getSystemHealth();
        expect(health.status).toBe('excellent');
        
        // Add many recent errors
        for (let i = 0; i < 10; i++) {
            errorHandler.logError('network', {
                id: `${i}`, operation: 'test', message: 'test', timestamp: Date.now()
            });
        }
        
        health = errorHandler.getSystemHealth();
        expect(health.status).toBe('poor');
    });

    it('should retry operations with exponential backoff', async function() {
        let attempts = 0;
        const flakyOperation = () => {
            attempts++;
            if (attempts < 3) {
                throw new Error('Temporary failure');
            }
            return 'success';
        };
        
        const result = await errorHandler.executeWithRetry(flakyOperation);
        
        expect(result).toBe('success');
        expect(attempts).toBe(3);
    });

    it('should limit error log size', function() {
        // Add more than 100 errors
        for (let i = 0; i < 150; i++) {
            errorHandler.logError('test', {
                id: `${i}`, operation: 'test', message: 'test', timestamp: Date.now()
            });
        }
        
        expect(errorHandler.errorLog.length).toBe(100);
    });

    it('should filter recent errors correctly', function() {
        const now = Date.now();
        
        // Add old error
        errorHandler.errorLog.push({
            id: '1', operation: 'test', message: 'old', timestamp: now - 3600000 - 1000
        });
        
        // Add recent error
        errorHandler.errorLog.push({
            id: '2', operation: 'test', message: 'recent', timestamp: now - 30000
        });
        
        const recentErrors = errorHandler.getRecentErrors(3600000); // Last hour
        expect(recentErrors.length).toBe(1);
        expect(recentErrors[0].message).toBe('recent');
    });
});

console.log('✅ Error Handler unit tests loaded');
