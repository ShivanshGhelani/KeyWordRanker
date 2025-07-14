/**
 * Error Handler Module - Comprehensive error handling and recovery
 * Handles categorization, fallback strategies, recovery mechanisms, and circuit breakers
 */

class ErrorHandler {
    constructor() {
        this.errorCounts = {};
        this.maxRetries = 3;
        this.retryDelays = [1000, 2000, 4000]; // Progressive backoff
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

        this.fallbackStrategies = {};
        
        this.retryManager = {
            activeRetries: new Map(),
            maxConcurrentRetries: 3,
            backoffMultiplier: 1.5,
            maxRetryDelay: 30000
        };

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

        this.init();
    }

    init() {
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
            this.handleGlobalError('error', event.error, {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });

        // Capture unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleGlobalError('unhandledrejection', event.reason, {
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
            userAgent: navigator.userAgent.substring(0, 100)
        };

        this.logError('GLOBAL', errorInfo);
        console.error(`🚨 Global ${type} error:`, errorInfo);
    }

    setupFallbackStrategies() {
        this.fallbackStrategies = {
            [this.errorCategories.DOM]: this.handleDOMError.bind(this),
            [this.errorCategories.NETWORK]: this.handleNetworkError.bind(this),
            [this.errorCategories.PARSING]: this.handleParsingError.bind(this),
            [this.errorCategories.VALIDATION]: this.handleValidationError.bind(this),
            [this.errorCategories.TIMEOUT]: this.handleTimeoutError.bind(this),
            [this.errorCategories.BOT_DETECTION]: this.handleBotDetectionError.bind(this),
            [this.errorCategories.UNKNOWN]: this.handleUnknownError.bind(this)
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
        
        // Network-related errors
        if (message.includes('network') || message.includes('fetch') || 
            message.includes('connection') || context.isNetworkError) {
            return this.errorCategories.NETWORK;
        }

        // DOM-related errors
        if (message.includes('element') || message.includes('selector') || 
            message.includes('queryselector') || context.isDOMError) {
            return this.errorCategories.DOM;
        }

        // Parsing errors
        if (message.includes('parse') || message.includes('json') || 
            message.includes('syntax') || context.isParsingError) {
            return this.errorCategories.PARSING;
        }

        // Validation errors
        if (message.includes('invalid') || message.includes('validation') || 
            context.isValidationError) {
            return this.errorCategories.VALIDATION;
        }

        // Timeout errors
        if (message.includes('timeout') || message.includes('abort') || 
            context.isTimeoutError) {
            return this.errorCategories.TIMEOUT;
        }

        // Bot detection errors
        if (message.includes('blocked') || message.includes('captcha') || 
            message.includes('bot') || context.isBotDetectionError) {
            return this.errorCategories.BOT_DETECTION;
        }

        return this.errorCategories.UNKNOWN;
    }

    calculateErrorSeverity(category, context) {
        const severityMap = {
            [this.errorCategories.BOT_DETECTION]: 'critical',
            [this.errorCategories.NETWORK]: 'high',
            [this.errorCategories.TIMEOUT]: 'medium',
            [this.errorCategories.DOM]: 'medium',
            [this.errorCategories.PARSING]: 'low',
            [this.errorCategories.VALIDATION]: 'low',
            [this.errorCategories.UNKNOWN]: 'medium'
        };

        return severityMap[category] || 'medium';
    }

    generateErrorId() {
        return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    logError(category, errorDetails) {
        // Add to error log
        this.errorLog.push(errorDetails);
        
        // Keep only last 100 errors
        if (this.errorLog.length > 100) {
            this.errorLog.shift();
        }

        // Update error counts
        this.errorCounts[category] = (this.errorCounts[category] || 0) + 1;

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
        const { category, operation } = errorDetails;
        
        console.log(`🔄 Attempting recovery for ${category} error in ${operation}`);

        try {
            // Get the appropriate fallback strategy
            const fallbackStrategy = this.fallbackStrategies[category];
            
            if (!fallbackStrategy) {
                throw new Error(`No fallback strategy available for ${category} errors`);
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
        const maxRetries = customRetries || this.maxRetries;
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
                    console.log(`⏰ Retry attempt ${attempt}/${maxRetries} after ${delay}ms delay`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }

                const result = await operation();
                this.retryManager.activeRetries.delete(retryId);
                return result;

            } catch (error) {
                if (attempt === maxRetries) {
                    this.retryManager.activeRetries.delete(retryId);
                    throw error;
                }
                console.warn(`⚠️ Retry attempt ${attempt + 1} failed:`, error.message);
            }
        }
    }

    calculateRetryDelay(attempt) {
        const baseDelay = this.retryDelays[Math.min(attempt - 1, this.retryDelays.length - 1)];
        const backoffDelay = baseDelay * Math.pow(this.retryManager.backoffMultiplier, attempt - 1);
        const jitteredDelay = backoffDelay + (Math.random() * 500); // Add jitter
        
        return Math.min(jitteredDelay, this.retryManager.maxRetryDelay);
    }

    // Specific error handlers
    async handleDOMError(errorDetails) {
        console.log('🔧 Handling DOM error with fallback selectors');
        
        const { context } = errorDetails;
        
        // Try alternative selectors if DOM element not found
        if (context.selector) {
            const fallbackSelectors = this.getFallbackSelectors(context.selector);
            
            for (const fallbackSelector of fallbackSelectors) {
                const elements = document.querySelectorAll(fallbackSelector);
                if (elements.length > 0) {
                    return { elements: Array.from(elements), selector: fallbackSelector };
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
        return { success: false, error: 'Network error - retry suggested' };
    }

    async handleParsingError(errorDetails) {
        console.log('📝 Handling parsing error');
        return { success: false, error: 'Parsing error - using safe defaults' };
    }

    async handleValidationError(errorDetails) {
        console.log('✅ Handling validation error');
        return { success: false, error: 'Validation error - input sanitized' };
    }

    async handleTimeoutError(errorDetails) {
        console.log('⏰ Handling timeout error');
        return { success: false, error: 'Operation timed out - retry with extended timeout' };
    }

    async handleBotDetectionError(errorDetails) {
        console.log('🤖 Handling bot detection error');
        
        // Extended cooldown
        const cooldownTime = 60000 + (Math.random() * 120000); // 1-3 minutes
        console.log(`🛑 Bot detection cooldown: ${cooldownTime/1000}s`);
        await new Promise(resolve => setTimeout(resolve, cooldownTime));
        
        return {
            success: true,
            action: 'cooldown_applied',
            cooldownTime: cooldownTime
        };
    }

    async handleUnknownError(errorDetails) {
        console.log('❓ Handling unknown error');
        return {
            success: false,
            error: 'Unknown error occurred',
            errorId: errorDetails.id
        };
    }

    /**
     * Safe execution wrapper with comprehensive error handling
     */
    async safeExecute(operation, context = {}, options = {}) {
        const { timeout = 30000, retries = this.maxRetries } = options;
        
        try {
            // Set up timeout if specified
            let timeoutId;
            const timeoutPromise = new Promise((_, reject) => {
                if (timeout > 0) {
                    timeoutId = setTimeout(() => {
                        reject(new Error(`Operation timed out after ${timeout}ms`));
                    }, timeout);
                }
            });

            // Execute the operation with timeout
            const operationPromise = this.executeWithRetry(operation, context, retries);
            
            let result;
            if (timeout > 0) {
                result = await Promise.race([operationPromise, timeoutPromise]);
                clearTimeout(timeoutId);
            } else {
                result = await operationPromise;
            }

            return result;

        } catch (error) {
            console.error('🚨 SafeExecute error:', error);
            
            // Handle the error using existing error handling system
            const errorResult = await this.handleError(
                options.name || 'safeExecute',
                error,
                context
            );

            // Return a safe response structure
            return {
                success: false,
                error: error.message,
                errorCategory: this.categorizeError(error, context),
                recovery: errorResult,
                context: context
            };
        }
    }

    // Circuit breaker functionality
    shouldApplyCircuitBreaker(errorCategory) {
        const recentErrors = this.getRecentErrors(60000); // Last minute
        const categoryErrors = recentErrors.filter(err => err.category === errorCategory);
        
        return categoryErrors.length >= this.errorMonitor.thresholds.maxErrorsPerMinute ||
               this.getConsecutiveErrors(errorCategory) >= this.errorMonitor.thresholds.maxConsecutiveErrors;
    }

    async applyCircuitBreaker(errorCategory, errorDetails) {
        console.warn(`🔌 Circuit breaker activated for ${errorCategory}`);
        
        const breakerTime = this.getCircuitBreakerTime(errorCategory);
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
            [this.errorCategories.BOT_DETECTION]: 300000, // 5 minutes
            [this.errorCategories.NETWORK]: 60000,        // 1 minute  
            [this.errorCategories.TIMEOUT]: 120000,       // 2 minutes
            [this.errorCategories.DOM]: 30000,            // 30 seconds
        };

        return breakerTimes[errorCategory] || 60000;
    }

    getRecentErrors(timeWindow) {
        const now = Date.now();
        return this.errorLog.filter(err => (now - err.timestamp) <= timeWindow);
    }

    getConsecutiveErrors(errorCategory) {
        let consecutive = 0;
        
        // Check from most recent backwards
        for (let i = this.errorLog.length - 1; i >= 0; i--) {
            const error = this.errorLog[i];
            
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
    }

    /**
     * Get comprehensive error report
     */
    getErrorReport() {
        const recentErrors = this.getRecentErrors(3600000); // Last hour
        
        return {
            summary: {
                totalErrors: this.errorLog.length,
                recentErrors: recentErrors.length,
                errorsByCategory: this.errorCounts,
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
            lastError: this.errorLog.length > 0 ? 
                this.errorLog[this.errorLog.length - 1].timestamp : null
        };
    }

    generateErrorRecommendations() {
        const recommendations = [];
        const errorCounts = this.errorCounts;
        
        if (errorCounts[this.errorCategories.DOM] > 5) {
            recommendations.push('High DOM errors - Google may have updated their layout');
        }
        
        if (errorCounts[this.errorCategories.NETWORK] > 3) {
            recommendations.push('Network issues detected - check internet connection');
        }
        
        if (errorCounts[this.errorCategories.BOT_DETECTION] > 0) {
            recommendations.push('Bot detection encountered - reduce request frequency');
        }
        
        return recommendations;
    }
}

// Export for use in other modules
window.ErrorHandler = ErrorHandler;
