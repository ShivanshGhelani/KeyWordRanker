/**
 * Validation script for popup.js fixes
 * Checks for method existence, DOM element safety, and constructor structure
 */

const fs = require('fs');
const path = require('path');

function validatePopupFixes() {
    console.log('🔍 Validating Popup.js Fixes...\n');
    
    const popupPath = path.join(__dirname, 'src', 'popup', 'popup.js');
    
    if (!fs.existsSync(popupPath)) {
        console.error('❌ popup.js file not found');
        return false;
    }
    
    const content = fs.readFileSync(popupPath, 'utf8');
    const issues = [];
    const fixes = [];
    
    // Check 1: Method name consistency
    console.log('📋 Checking method name consistency...');
    if (content.includes('this.initializeEventListeners()')) {
        issues.push('❌ Still calling initializeEventListeners() instead of attachEventListeners()');
    } else {
        fixes.push('✅ Method name fixed: attachEventListeners()');
    }
    
    // Check 2: DOM element null safety
    console.log('📋 Checking DOM element null safety...');
    const unsafePatterns = [
        'this.resultsLimit.value',
        'this.enableNotifications.checked', 
        'this.googleDomain.value',
        'this.openInNewTab.checked',
        'this.saveHistory.checked'
    ];
    
    let hasUnsafeAccess = false;
    let unsafeLines = [];
    unsafePatterns.forEach(pattern => {
        const lines = content.split('\n');
        lines.forEach((line, index) => {
            // Skip lines that already have null safety with 'if' checks or optional chaining
            if (line.includes(pattern) && 
                !line.includes(pattern.replace('.', '?.')) && 
                !line.trim().startsWith('if (this.') &&
                !line.includes('if (this.')) {
                hasUnsafeAccess = true;
                unsafeLines.push(`Line ${index + 1}: ${line.trim()}`);
            }
        });
    });
    
    if (hasUnsafeAccess) {
        issues.push('❌ Some DOM elements still lack null safety checks:');
        unsafeLines.forEach(line => issues.push(`   ${line}`));
    } else {
        fixes.push('✅ DOM elements have null safety checks');
    }
    
    // Check 3: Constructor structure
    console.log('📋 Checking constructor structure...');
    const constructorMatch = content.match(/constructor\(\)\s*{([^}]+)}/s);
    if (constructorMatch) {
        const constructorBody = constructorMatch[1];
        const expectedMethods = [
            'initializeElements',
            'attachEventListeners',
            'loadSettings',
            'loadStats',
            'setupCharacterCounter',
            'loadHistory',
            'checkCurrentPage'
        ];
        
        let allMethodsPresent = true;
        expectedMethods.forEach(method => {
            if (!constructorBody.includes(method)) {
                allMethodsPresent = false;
                issues.push(`❌ Missing method call in constructor: ${method}`);
            }
        });
        
        if (allMethodsPresent) {
            fixes.push('✅ All required methods called in constructor');
        }
    }
    
    // Check 4: Required DOM elements initialized
    console.log('📋 Checking DOM element initialization...');
    const requiredElements = [
        'resultsLimit',
        'enableNotifications',
        'googleDomain'
    ];
    
    let allElementsInitialized = true;
    requiredElements.forEach(element => {
        if (!content.includes(`this.${element} = document.getElementById('${element}')`)) {
            allElementsInitialized = false;
            issues.push(`❌ Missing DOM element initialization: ${element}`);
        }
    });
    
    if (allElementsInitialized) {
        fixes.push('✅ All required DOM elements initialized');
    }
    
    // Check 5: No duplicate initialization
    console.log('📋 Checking for duplicate initialization...');
    const initMethodMatches = content.match(/init\(\)\s*{/g);
    if (!initMethodMatches || initMethodMatches.length === 0) {
        fixes.push('✅ Duplicate init() method removed');
    } else {
        issues.push('❌ Duplicate init() method still exists');
    }
    
    // Results
    console.log('\n' + '='.repeat(50));
    console.log('📊 VALIDATION RESULTS');
    console.log('='.repeat(50));
    
    if (fixes.length > 0) {
        console.log('\n🎉 FIXES APPLIED:');
        fixes.forEach(fix => console.log(`  ${fix}`));
    }
    
    if (issues.length > 0) {
        console.log('\n⚠️  REMAINING ISSUES:');
        issues.forEach(issue => console.log(`  ${issue}`));
        return false;
    } else {
        console.log('\n🎉 ALL POPUP ISSUES FIXED!');
        console.log('✅ Extension should now initialize properly');
        console.log('✅ DOM elements are safely accessed');
        console.log('✅ Method names are consistent');
        return true;
    }
}

// Run validation
validatePopupFixes();
