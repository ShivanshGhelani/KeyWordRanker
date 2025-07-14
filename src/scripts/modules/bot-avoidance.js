/**
 * Bot Avoidance Module - Anti-detection mechanisms
 * Handles bot detection avoidance, request throttling, and human-like behavior simulation
 */

class BotAvoidance {
    constructor() {
        this.requestHistory = [];
        this.lastRequestTime = 0;
        this.consecutiveRequests = 0;
        this.isDetected = false;
        this.detectionCount = 0;
        this.forcedCooldown = 0;
        
        this.userAgentRotation = this.initializeUserAgents();
        this.behaviorPatterns = this.initializeBehaviorPatterns();
        
        this.sessionData = {
            startTime: Date.now(),
            requestCount: 0,
            averageDelay: 0,
            suspiciousActivity: false
        };

        this.requestMonitor = {
            maxRequestsPerMinute: 10,
            baseDelay: 1000,
            requestHistory: []
        };

        this.suspiciousPatterns = {
            tooFastRequests: false,
            identicalTimingPatterns: false,
            perfectTiming: false
        };

        this.currentBehavior = {
            selectedPattern: 'normal',
            scrollPattern: 'natural',
            readingSpeed: 250 // WPM
        };

        this.humanActivities = [];
        this.stealthMode = { enabled: false };

        this.init();
    }

    init() {

        this.setupRequestMonitoring();
        this.setupBehaviorRandomization();
        this.setupSuspiciousActivityDetection();

    }

    initializeUserAgents() {
        return [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ];
    }

    initializeBehaviorPatterns() {
        return {
            humanDelayRanges: {
                reading: [1500, 4000],
                thinking: [800, 2500],
                typing: [100, 300],
                clicking: [150, 400]
            },
            scrollPatterns: [
                'natural', 'cautious', 'quick', 'thorough'
            ],
            readingSpeeds: [150, 200, 250, 300, 350] // WPM
        };
    }

    setupRequestMonitoring() {
        // Monitor request patterns
        this.requestMonitor = {
            ...this.requestMonitor,
            startTime: Date.now(),
            requestHistory: []
        };
    }

    setupBehaviorRandomization() {
        // Randomize initial behavior
        this.currentBehavior.selectedPattern = this.getRandomBehaviorPattern();
        this.currentBehavior.scrollPattern = this.getRandomScrollPattern();
        this.currentBehavior.readingSpeed = this.getRandomReadingSpeed();
    }

    setupSuspiciousActivityDetection() {
        // Initialize detection thresholds
        this.suspiciousPatterns = {
            tooFastRequests: false,
            identicalTimingPatterns: false,
            perfectTiming: false
        };
    }

    /**
     * Apply human-like delays before making requests
     */
    async applyHumanLikeDelay(requestType = 'default', customRange = null) {
        const delay = this.getDelayForRequestType(requestType, customRange);
        const humanizedDelay = this.getHumanizationDelay(requestType);
        const totalDelay = delay + humanizedDelay;



        // Check if we need forced cooldown
        if (this.forcedCooldown > 0) {

            await new Promise(resolve => setTimeout(resolve, this.forcedCooldown));
            this.forcedCooldown = 0;
        }

        // Apply the calculated delay
        await new Promise(resolve => setTimeout(resolve, totalDelay));

        // Update request tracking
        this.updateRequestTracking(totalDelay);

        return totalDelay;
    }

    getDelayForRequestType(requestType, customRange = null) {
        if (customRange) {
            return this.getRandomDelay(customRange[0], customRange[1]);
        }

        const delayRanges = {
            search: [2000, 5000],
            click: [500, 1500],
            scroll: [300, 800],
            read: [1500, 4000],
            default: [1000, 3000]
        };

        const range = delayRanges[requestType] || delayRanges.default;
        return this.getRandomDelay(range[0], range[1]);
    }

    getHumanizationDelay(requestType) {
        // Add small random variations to make timing less predictable
        const baseVariation = this.getRandomDelay(50, 200);
        
        // Add behavior-specific variations
        const behaviorMultiplier = {
            'cautious': 1.5,
            'normal': 1.0,
            'quick': 0.7,
            'thorough': 1.8
        }[this.currentBehavior.selectedPattern] || 1.0;

        return Math.floor(baseVariation * behaviorMultiplier);
    }

    getRandomDelay(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    updateRequestTracking(delay) {
        const now = Date.now();
        
        this.requestHistory.push({
            timestamp: now,
            delay: delay,
            type: 'search'
        });

        // Keep only recent history (last 10 minutes)
        const tenMinutesAgo = now - 600000;
        this.requestHistory = this.requestHistory
            .filter(req => req.timestamp > tenMinutesAgo);

        // Update session data
        this.sessionData.requestCount++;
        this.sessionData.averageDelay = this.calculateAverageDelay();
        this.lastRequestTime = now;

        // Check for suspicious patterns
        this.detectSuspiciousPatterns();
    }

    calculateAverageDelay() {
        if (this.requestHistory.length === 0) return 0;
        
        const totalDelay = this.requestHistory.reduce((sum, req) => sum + req.delay, 0);
        return totalDelay / this.requestHistory.length;
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
        this.sessionData.suspiciousActivity = suspiciousCount >= 2;
        
        if (this.sessionData.suspiciousActivity) {
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

        
        // Increase delays
        this.behaviorPatterns.humanDelayRanges.reading = [2000, 6000];
        this.behaviorPatterns.humanDelayRanges.thinking = [1000, 3000];
        
        // Add more randomization
        this.currentBehavior.selectedPattern = this.getRandomBehaviorPattern();
        this.currentBehavior.scrollPattern = this.getRandomScrollPattern();
        
        // Force a longer cooldown before next request
        this.forcedCooldown = this.getRandomDelay(15000, 45000);
    }

    getRecentRequests(timeWindow) {
        const cutoff = Date.now() - timeWindow;
        return this.requestHistory.filter(req => req.timestamp > cutoff);
    }

    needsCooldown() {
        const recentRequests = this.getRecentRequests(60000); // Last minute
        return recentRequests.length >= this.requestMonitor.maxRequestsPerMinute;
    }

    async applyCooldown() {
        const cooldownTime = this.getRandomDelay(60000, 120000); // 1-2 minutes

        
        await this.simulateHumanCooldownBehavior(cooldownTime);
    }

    async simulateHumanCooldownBehavior(cooldownTime) {
        const activities = [
            () => this.simulateSlowScrolling(cooldownTime * 0.3),
            () => this.simulateResultReading(cooldownTime * 0.6),
            () => new Promise(resolve => setTimeout(resolve, cooldownTime * 0.1))
        ];

        // Execute activities in sequence
        for (const activity of activities) {
            await activity();
        }
    }

    async simulateSlowScrolling(totalTime) {
        const scrolls = Math.floor(totalTime / 2000); // Scroll every 2 seconds
        
        for (let i = 0; i < scrolls; i++) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            // In a real implementation, this would trigger scroll events

        }
    }

    async simulateResultReading(totalTime) {

        await new Promise(resolve => setTimeout(resolve, totalTime));
    }

    getRandomBehaviorPattern() {
        const patterns = ['cautious', 'normal', 'quick', 'thorough'];
        return patterns[Math.floor(Math.random() * patterns.length)];
    }

    getRandomScrollPattern() {
        return this.behaviorPatterns.scrollPatterns[
            Math.floor(Math.random() * this.behaviorPatterns.scrollPatterns.length)
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

        await new Promise(resolve => setTimeout(resolve, this.getRandomDelay(200, 800)));
    }

    async simulatePageInteraction() {

        await new Promise(resolve => setTimeout(resolve, this.getRandomDelay(500, 1500)));
    }

    async simulateReadingPause() {

        const readingTime = this.getRandomDelay(3000, 8000);
        await new Promise(resolve => setTimeout(resolve, readingTime));
    }

    /**
     * Generate bot avoidance report
     */
    getBotAvoidanceReport() {
        const report = {
            sessionData: this.sessionData,
            requestHistory: {
                total: this.requestHistory.length,
                recent: this.getRecentRequests(300000).length,
                averageDelay: this.calculateAverageDelay()
            },
            suspiciousPatterns: this.suspiciousPatterns,
            currentBehavior: this.currentBehavior,
            stealthMode: this.stealthMode,
            recommendations: this.getBotAvoidanceRecommendations()
        };
        
        return report;
    }

    getBotAvoidanceRecommendations() {
        const recommendations = [];
        
        if (this.sessionData.suspiciousActivity) {
            recommendations.push('Suspicious activity detected - increase delays and randomization');
        }
        
        if (this.sessionData.requestCount > 20) {
            recommendations.push('High request count - consider taking a break');
        }
        
        if (this.calculateAverageDelay() < 1000) {
            recommendations.push('Average delay too low - increase minimum delays');
        }
        
        return recommendations;
    }

    /**
     * COMPREHENSIVE BOT AVOIDANCE TESTING AND VALIDATION
     */

    /**
     * Test bot avoidance effectiveness
     */
    async runBotAvoidanceTests() {

        
        const testResults = {
            delayTesting: await this.testDelayEffectiveness(),
            patternTesting: await this.testBehaviorPatterns(),
            detectionTesting: await this.testSuspiciousActivityDetection(),
            stealthTesting: await this.testStealthMode(),
            overall: { passed: false, score: 0 }
        };

        // Calculate overall test score
        const scores = Object.values(testResults).filter(r => r.score !== undefined).map(r => r.score);
        testResults.overall.score = scores.reduce((a, b) => a + b, 0) / scores.length;
        testResults.overall.passed = testResults.overall.score >= 0.8; // 80% pass threshold


        return testResults;
    }

    async testDelayEffectiveness() {

        
        const testDelays = [];
        const testCount = 10;
        
        for (let i = 0; i < testCount; i++) {
            const startTime = Date.now();
            await this.applyHumanLikeDelay('search');
            const actualDelay = Date.now() - startTime;
            testDelays.push(actualDelay);
        }
        
        // Analyze delay patterns
        const avgDelay = testDelays.reduce((a, b) => a + b, 0) / testDelays.length;
        const minDelay = Math.min(...testDelays);
        const maxDelay = Math.max(...testDelays);
        const variance = this.calculateVariance(testDelays);
        
        // Evaluation criteria
        const hasMinimumDelay = minDelay >= 1000; // At least 1 second
        const hasVariation = variance > 500000; // Good variance in delays
        const withinReasonableRange = maxDelay <= 10000; // Not too long
        const avgInRange = avgDelay >= 2000 && avgDelay <= 5000; // Good average
        
        const score = [hasMinimumDelay, hasVariation, withinReasonableRange, avgInRange]
            .filter(Boolean).length / 4;
        
        return {
            passed: score >= 0.75,
            score: score,
            details: {
                averageDelay: avgDelay,
                minDelay: minDelay,
                maxDelay: maxDelay,
                variance: variance,
                testCount: testCount,
                delays: testDelays
            }
        };
    }

    async testBehaviorPatterns() {

        
        const originalPattern = this.currentBehavior.selectedPattern;
        const patternTests = [];
        
        // Test different behavior patterns
        const patterns = ['cautious', 'normal', 'quick', 'thorough'];
        
        for (const pattern of patterns) {
            this.currentBehavior.selectedPattern = pattern;
            
            const startTime = Date.now();
            await this.applyHumanLikeDelay('search');
            const delay = Date.now() - startTime;
            
            patternTests.push({
                pattern: pattern,
                delay: delay,
                multiplier: this.getBehaviorMultiplier(pattern)
            });
        }
        
        // Restore original pattern
        this.currentBehavior.selectedPattern = originalPattern;
        
        // Evaluate pattern diversity
        const delays = patternTests.map(t => t.delay);
        const hasVariation = Math.max(...delays) - Math.min(...delays) > 1000;
        const allPatternsWork = patternTests.every(t => t.delay > 500);
        
        const score = (hasVariation && allPatternsWork) ? 1.0 : 0.5;
        
        return {
            passed: score >= 0.8,
            score: score,
            details: {
                patternTests: patternTests,
                hasVariation: hasVariation,
                allPatternsWork: allPatternsWork
            }
        };
    }

    getBehaviorMultiplier(pattern) {
        const multipliers = {
            'cautious': 1.5,
            'normal': 1.0,
            'quick': 0.7,
            'thorough': 1.8
        };
        return multipliers[pattern] || 1.0;
    }

    async testSuspiciousActivityDetection() {

        
        // Simulate suspicious patterns
        const originalHistory = [...this.requestHistory];
        
        // Test 1: Too fast requests
        this.requestHistory = [];
        for (let i = 0; i < 5; i++) {
            this.updateRequestTracking(100); // Very fast requests
        }
        
        const detectedFastRequests = this.suspiciousPatterns.tooFastRequests;
        
        // Test 2: Identical timing patterns
        this.requestHistory = [];
        for (let i = 0; i < 5; i++) {
            this.updateRequestTracking(2000); // Identical delays
        }
        
        const detectedIdenticalTiming = this.suspiciousPatterns.identicalTimingPatterns;
        
        // Restore original history
        this.requestHistory = originalHistory;
        
        const detectionWorks = detectedFastRequests || detectedIdenticalTiming;
        const score = detectionWorks ? 1.0 : 0.0;
        
        return {
            passed: score >= 0.8,
            score: score,
            details: {
                fastRequestsDetected: detectedFastRequests,
                identicalTimingDetected: detectedIdenticalTiming,
                detectionWorks: detectionWorks
            }
        };
    }

    async testStealthMode() {

        
        const wasStealthEnabled = this.stealthMode.enabled;
        
        // Enable stealth mode
        await this.enableStealthMode();
        
        // Test stealth behaviors
        const startTime = Date.now();
        await this.applyHumanLikeDelay('search');
        const stealthDelay = Date.now() - startTime;
        
        // Test normal mode
        this.stealthMode.enabled = false;
        const normalStartTime = Date.now();
        await this.applyHumanLikeDelay('search');
        const normalDelay = Date.now() - normalStartTime;
        
        // Restore original stealth state
        this.stealthMode.enabled = wasStealthEnabled;
        
        // Evaluate stealth effectiveness
        const stealthIsSlower = stealthDelay > normalDelay * 1.5;
        const stealthModeConfigured = this.stealthMode.extraDelayMultiplier >= 2.0;
        
        const score = (stealthIsSlower && stealthModeConfigured) ? 1.0 : 0.5;
        
        return {
            passed: score >= 0.8,
            score: score,
            details: {
                stealthDelay: stealthDelay,
                normalDelay: normalDelay,
                stealthIsSlower: stealthIsSlower,
                stealthModeConfigured: stealthModeConfigured,
                stealthConfig: this.stealthMode
            }
        };
    }

    calculateVariance(numbers) {
        const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
        const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
        return squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length;
    }

    /**
     * Validate bot avoidance against Google's known detection patterns
     */
    validateAgainstKnownPatterns() {

        
        const validation = {
            timingPatterns: this.validateTimingPatterns(),
            requestFrequency: this.validateRequestFrequency(),
            behaviorConsistency: this.validateBehaviorConsistency(),
            overallSafety: false
        };
        
        // Calculate overall safety score
        const scores = Object.values(validation).filter(v => typeof v === 'object' && v.score);
        const avgScore = scores.reduce((sum, v) => sum + v.score, 0) / scores.length;
        validation.overallSafety = avgScore >= 0.8;
        
        return validation;
    }

    validateTimingPatterns() {
        const recentDelays = this.requestHistory.slice(-10).map(r => r.delay);
        
        if (recentDelays.length < 3) {
            return { safe: true, score: 1.0, reason: 'Insufficient data' };
        }
        
        // Check for too-perfect timing (red flag)
        const variance = this.calculateVariance(recentDelays);
        const avgDelay = recentDelays.reduce((a, b) => a + b, 0) / recentDelays.length;
        
        const hasGoodVariance = variance > 100000; // Good variation
        const notTooFast = avgDelay >= 1500; // Not too fast
        const notTooSlow = avgDelay <= 8000; // Not unreasonably slow
        
        const score = [hasGoodVariance, notTooFast, notTooSlow].filter(Boolean).length / 3;
        
        return {
            safe: score >= 0.67,
            score: score,
            details: {
                variance: variance,
                averageDelay: avgDelay,
                hasGoodVariance: hasGoodVariance,
                notTooFast: notTooFast,
                notTooSlow: notTooSlow
            }
        };
    }

    validateRequestFrequency() {
        const now = Date.now();
        const recentRequests = this.requestHistory.filter(r => 
            (now - r.timestamp) <= 300000 // Last 5 minutes
        );
        
        const requestsPerMinute = recentRequests.length / 5;
        const isSafeFrequency = requestsPerMinute <= 2; // Max 2 requests per minute
        
        return {
            safe: isSafeFrequency,
            score: isSafeFrequency ? 1.0 : Math.max(0, 1 - (requestsPerMinute / 10)),
            details: {
                requestsPerMinute: requestsPerMinute,
                recentRequestCount: recentRequests.length,
                isSafeFrequency: isSafeFrequency
            }
        };
    }

    validateBehaviorConsistency() {
        // Check if behavior patterns are realistic and consistent
        const hasRealisticReadingSpeed = this.currentBehavior.readingSpeed >= 150 && 
                                       this.currentBehavior.readingSpeed <= 400;
        
        const hasValidScrollPattern = this.behaviorPatterns.scrollPatterns
            .includes(this.currentBehavior.scrollPattern);
        
        const hasValidBehaviorPattern = ['cautious', 'normal', 'quick', 'thorough']
            .includes(this.currentBehavior.selectedPattern);
        
        const score = [hasRealisticReadingSpeed, hasValidScrollPattern, hasValidBehaviorPattern]
            .filter(Boolean).length / 3;
        
        return {
            safe: score >= 0.8,
            score: score,
            details: {
                readingSpeed: this.currentBehavior.readingSpeed,
                scrollPattern: this.currentBehavior.scrollPattern,
                behaviorPattern: this.currentBehavior.selectedPattern,
                hasRealisticReadingSpeed: hasRealisticReadingSpeed,
                hasValidScrollPattern: hasValidScrollPattern,
                hasValidBehaviorPattern: hasValidBehaviorPattern
            }
        };
    }

    // Enhanced header variation system
    initializeRequestHeaders() {
        return {
            // Browser and environment headers
            acceptLanguage: [
                'en-US,en;q=0.9',
                'en-US,en;q=0.9,es;q=0.8',
                'en-GB,en;q=0.9,en-US;q=0.8',
                'en-US,en;q=0.9,fr;q=0.8,de;q=0.7',
                'en-CA,en;q=0.9,fr;q=0.8'
            ],
            acceptEncoding: [
                'gzip, deflate, br',
                'gzip, deflate',
                'br, gzip, deflate'
            ],
            accept: [
                'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            ],
            cacheControl: [
                'max-age=0',
                'no-cache',
                'max-age=3600',
                'public, max-age=3600'
            ],
            dnt: ['1', '0'], // Do Not Track
            upgradeInsecureRequests: ['1'],
            secFetchDest: ['document', 'empty'],
            secFetchMode: ['navigate', 'cors'],
            secFetchSite: ['none', 'same-origin', 'cross-site'],
            secFetchUser: ['?1'],
            // Platform-specific headers
            secChUa: [
                '"Google Chrome";v="120", "Chromium";v="120", "Not_A Brand";v="99"',
                '"Google Chrome";v="119", "Chromium";v="119", "Not_A Brand";v="24"',
                '"Chromium";v="120", "Google Chrome";v="120", "Not_A Brand";v="99"'
            ],
            secChUaMobile: ['?0'],
            secChUaPlatform: [
                '"Windows"',
                '"macOS"',
                '"Linux"'
            ],
            // Connection and timing headers
            pragma: ['no-cache'],
            priority: ['u=0, i', 'u=1', 'u=2'],
            // Custom realistic headers
            xRequestedWith: ['XMLHttpRequest'],
            purpose: ['prefetch']
        };
    }

    generateVariedHeaders() {
        const headers = this.initializeRequestHeaders();
        const randomHeaders = {};

        // Always include basic headers
        randomHeaders['User-Agent'] = this.getRandomUserAgent();
        randomHeaders['Accept'] = this.getRandomFromArray(headers.accept);
        randomHeaders['Accept-Language'] = this.getRandomFromArray(headers.acceptLanguage);
        randomHeaders['Accept-Encoding'] = this.getRandomFromArray(headers.acceptEncoding);
        
        // Randomly include optional headers (80% chance each)
        if (Math.random() > 0.2) {
            randomHeaders['Cache-Control'] = this.getRandomFromArray(headers.cacheControl);
        }
        
        if (Math.random() > 0.2) {
            randomHeaders['DNT'] = this.getRandomFromArray(headers.dnt);
        }
        
        if (Math.random() > 0.3) {
            randomHeaders['Upgrade-Insecure-Requests'] = this.getRandomFromArray(headers.upgradeInsecureRequests);
        }
        
        // Chrome-specific security headers (90% chance)
        if (Math.random() > 0.1) {
            randomHeaders['Sec-Fetch-Dest'] = this.getRandomFromArray(headers.secFetchDest);
            randomHeaders['Sec-Fetch-Mode'] = this.getRandomFromArray(headers.secFetchMode);
            randomHeaders['Sec-Fetch-Site'] = this.getRandomFromArray(headers.secFetchSite);
            
            if (Math.random() > 0.3) {
                randomHeaders['Sec-Fetch-User'] = this.getRandomFromArray(headers.secFetchUser);
            }
        }
        
        // Chrome UA hints (85% chance)
        if (Math.random() > 0.15) {
            randomHeaders['Sec-CH-UA'] = this.getRandomFromArray(headers.secChUa);
            randomHeaders['Sec-CH-UA-Mobile'] = this.getRandomFromArray(headers.secChUaMobile);
            randomHeaders['Sec-CH-UA-Platform'] = this.getRandomFromArray(headers.secChUaPlatform);
        }
        
        // Occasionally add extra headers for realism (20% chance)
        if (Math.random() > 0.8) {
            randomHeaders['Pragma'] = this.getRandomFromArray(headers.pragma);
        }
        
        if (Math.random() > 0.9) {
            randomHeaders['Priority'] = this.getRandomFromArray(headers.priority);
        }

        return randomHeaders;
    }

    getRandomFromArray(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    getRandomUserAgent() {
        return this.getRandomFromArray(this.userAgentRotation);
    }

    // Enhanced header variation for different request types
    getHeadersForRequestType(requestType = 'search') {
        const baseHeaders = this.generateVariedHeaders();
        
        switch (requestType) {
            case 'search':
                return {
                    ...baseHeaders,
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'none',
                    'Sec-Fetch-User': '?1'
                };
                
            case 'ajax':
                return {
                    ...baseHeaders,
                    'X-Requested-With': 'XMLHttpRequest',
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'same-origin'
                };
                
            case 'image':
                return {
                    ...baseHeaders,
                    'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                    'Sec-Fetch-Dest': 'image',
                    'Sec-Fetch-Mode': 'no-cors',
                    'Sec-Fetch-Site': 'cross-site'
                };
                
            default:
                return baseHeaders;
        }
    }

    // Apply headers to requests (simulation for content script context)
    applyHeaderVariation(requestOptions = {}) {
        const headers = this.getHeadersForRequestType(requestOptions.type);
        
        // In content script context, we can't modify actual request headers
        // But we can simulate header variation by changing request patterns
        return {
            ...requestOptions,
            simulatedHeaders: headers,
            headerVariation: {
                userAgent: headers['User-Agent'],
                language: headers['Accept-Language'],
                encoding: headers['Accept-Encoding'],
                timestamp: Date.now()
            }
        };
    }

    // ...existing code...
}

// Export for use in other modules
window.BotAvoidance = BotAvoidance;
