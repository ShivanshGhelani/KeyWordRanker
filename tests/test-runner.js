/**
 * Test Runner - Comprehensive testing framework for Keyword Rank Finder
 * Executes unit tests, integration tests, and end-to-end tests
 */

class TestRunner {
    constructor() {
        this.tests = new Map();
        this.testSuites = new Map();
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            startTime: 0,
            endTime: 0
        };
        
        this.init();
    }

    init() {
        console.log('🧪 Initializing Test Runner');
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('runAllTests').addEventListener('click', () => this.runAllTests());
        document.getElementById('runUnitTests').addEventListener('click', () => this.runTestSuite('unit'));
        document.getElementById('runIntegrationTests').addEventListener('click', () => this.runTestSuite('integration'));
        document.getElementById('runE2ETests').addEventListener('click', () => this.runTestSuite('e2e'));
        document.getElementById('clearResults').addEventListener('click', () => this.clearResults());
    }

    // Test registration methods
    describe(suiteName, testFunction) {
        if (!this.testSuites.has(suiteName)) {
            this.testSuites.set(suiteName, []);
        }
        
        const currentSuite = this.testSuites.get(suiteName);
        const testContext = {
            tests: currentSuite,
            suiteName: suiteName
        };
        
        testFunction.call(testContext);
    }

    it(testName, testFunction) {
        const fullTestName = `${this.suiteName}: ${testName}`;
        this.tests.set(fullTestName, {
            name: testName,
            suite: this.suiteName,
            function: testFunction,
            status: 'pending',
            error: null,
            duration: 0
        });
        
        this.tests.push({
            name: testName,
            function: testFunction,
            status: 'pending'
        });
    }

    // Assertion methods
    expect(actual) {
        return {
            toBe: (expected) => {
                if (actual !== expected) {
                    throw new Error(`Expected ${actual} to be ${expected}`);
                }
            },
            toEqual: (expected) => {
                if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                    throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
                }
            },
            toBeTruthy: () => {
                if (!actual) {
                    throw new Error(`Expected ${actual} to be truthy`);
                }
            },
            toBeFalsy: () => {
                if (actual) {
                    throw new Error(`Expected ${actual} to be falsy`);
                }
            },
            toContain: (expected) => {
                if (!actual.includes(expected)) {
                    throw new Error(`Expected ${actual} to contain ${expected}`);
                }
            },
            toBeGreaterThan: (expected) => {
                if (actual <= expected) {
                    throw new Error(`Expected ${actual} to be greater than ${expected}`);
                }
            },
            toBeLessThan: (expected) => {
                if (actual >= expected) {
                    throw new Error(`Expected ${actual} to be less than ${expected}`);
                }
            },
            toHaveProperty: (property) => {
                if (!actual.hasOwnProperty(property)) {
                    throw new Error(`Expected object to have property ${property}`);
                }
            }
        };
    }

    // Mock Chrome APIs for testing
    setupMockChromeAPIs() {
        if (typeof chrome === 'undefined') {
            window.chrome = {
                storage: {
                    local: {
                        get: (keys) => Promise.resolve({}),
                        set: (data) => Promise.resolve(),
                        clear: () => Promise.resolve()
                    }
                },
                tabs: {
                    query: (queryInfo) => Promise.resolve([{
                        id: 1,
                        url: 'https://www.google.com/search?q=test+keyword',
                        active: true
                    }]),
                    sendMessage: (tabId, message) => Promise.resolve({ success: true })
                },
                runtime: {
                    onMessage: {
                        addListener: (callback) => {}
                    }
                }
            };
        }
    }

    // Test execution methods
    async runAllTests() {
        console.log('🚀 Running all tests...');
        this.resetResults();
        this.setupMockChromeAPIs();
        
        this.results.startTime = Date.now();
        this.showLoading('Running all tests...');
        
        try {
            for (const [testName, test] of this.tests) {
                await this.runSingleTest(testName, test);
            }
        } catch (error) {
            console.error('Error running tests:', error);
        }
        
        this.results.endTime = Date.now();
        this.displayResults();
    }

    async runTestSuite(suiteType) {
        console.log(`🧪 Running ${suiteType} tests...`);
        this.resetResults();
        this.setupMockChromeAPIs();
        
        this.results.startTime = Date.now();
        this.showLoading(`Running ${suiteType} tests...`);
        
        try {
            for (const [testName, test] of this.tests) {
                if (test.suite.toLowerCase().includes(suiteType)) {
                    await this.runSingleTest(testName, test);
                }
            }
        } catch (error) {
            console.error('Error running test suite:', error);
        }
        
        this.results.endTime = Date.now();
        this.displayResults();
    }

    async runSingleTest(testName, test) {
        const startTime = Date.now();
        
        try {
            console.log(`▶️ Running: ${testName}`);
            test.status = 'running';
            this.updateTestStatus(testName, 'running');
            
            // Run the test function
            await test.function();
            
            // Test passed
            test.status = 'pass';
            test.duration = Date.now() - startTime;
            this.results.passed++;
            this.updateTestStatus(testName, 'pass');
            
            console.log(`✅ Passed: ${testName} (${test.duration}ms)`);
            
        } catch (error) {
            // Test failed
            test.status = 'fail';
            test.error = error.message;
            test.duration = Date.now() - startTime;
            this.results.failed++;
            this.updateTestStatus(testName, 'fail', error.message);
            
            console.error(`❌ Failed: ${testName} - ${error.message}`);
        }
        
        this.results.total++;
    }

    // UI update methods
    showLoading(message) {
        const output = document.getElementById('testOutput');
        output.innerHTML = `<div class="loading">${message}</div>`;
    }

    updateTestStatus(testName, status, error = null) {
        // This will be called to update individual test status in real-time
        // For now, we'll just log it
        console.log(`Test ${testName}: ${status}${error ? ` - ${error}` : ''}`);
    }

    displayResults() {
        const summary = document.getElementById('testSummary');
        const output = document.getElementById('testOutput');
        
        // Update summary
        document.getElementById('totalTests').textContent = this.results.total;
        document.getElementById('passedTests').textContent = this.results.passed;
        document.getElementById('failedTests').textContent = this.results.failed;
        document.getElementById('testTime').textContent = `${this.results.endTime - this.results.startTime}ms`;
        
        summary.style.display = 'grid';
        
        // Group tests by suite
        const suites = new Map();
        for (const [testName, test] of this.tests) {
            if (!suites.has(test.suite)) {
                suites.set(test.suite, []);
            }
            suites.get(test.suite).push({ name: testName, ...test });
        }
        
        // Generate HTML output
        let html = '';
        for (const [suiteName, tests] of suites) {
            const suitePassedCount = tests.filter(t => t.status === 'pass').length;
            const suiteTotalCount = tests.length;
            
            html += `
                <div class="test-suite">
                    <div class="test-suite-header">
                        <span>${suiteName}</span>
                        <span>${suitePassedCount}/${suiteTotalCount} passed</span>
                    </div>
            `;
            
            for (const test of tests) {
                const statusClass = test.status === 'pass' ? 'pass' : 
                                  test.status === 'fail' ? 'fail' : 'pending';
                
                html += `
                    <div class="test-case">
                        <span>${test.name}</span>
                        <span class="test-status ${statusClass}">${test.status.toUpperCase()}</span>
                    </div>
                `;
                
                if (test.error) {
                    html += `
                        <div class="test-output">
                            Error: ${test.error}
                        </div>
                    `;
                }
            }
            
            html += '</div>';
        }
        
        output.innerHTML = html;
        
        // Final summary log
        console.log(`\n🧪 Test Results Summary:`);
        console.log(`Total: ${this.results.total}`);
        console.log(`Passed: ${this.results.passed}`);
        console.log(`Failed: ${this.results.failed}`);
        console.log(`Duration: ${this.results.endTime - this.results.startTime}ms`);
    }

    clearResults() {
        this.resetResults();
        document.getElementById('testSummary').style.display = 'none';
        document.getElementById('testOutput').innerHTML = '<div class="loading">Ready to run tests...</div>';
    }

    resetResults() {
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            startTime: 0,
            endTime: 0
        };
        
        // Reset all test statuses
        for (const [testName, test] of this.tests) {
            test.status = 'pending';
            test.error = null;
            test.duration = 0;
        }
    }
}

// Initialize test runner when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.testRunner = new TestRunner();
    console.log('✅ Test Runner initialized');
});

// Global test functions for test files
window.describe = (suiteName, testFunction) => window.testRunner.describe(suiteName, testFunction);
window.it = (testName, testFunction) => window.testRunner.it(testName, testFunction);
window.expect = (actual) => window.testRunner.expect(actual);
