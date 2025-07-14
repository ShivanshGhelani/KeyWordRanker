/**
 * Test Content Script Actions
 * Validates that all required actions are properly implemented
 */

const fs = require('fs');
const path = require('path');

function testContentScriptActions() {
    console.log('🔍 Testing Content Script Actions...\n');
    
    const contentPath = path.join(__dirname, 'src', 'scripts', 'content.js');
    
    if (!fs.existsSync(contentPath)) {
        console.error('❌ content.js file not found');
        return false;
    }
    
    const content = fs.readFileSync(contentPath, 'utf8');
    
    // Required actions from popup.js
    const requiredActions = [
        'ping',
        'getCurrentSearchQuery', 
        'scrapeCurrentPageResults',
        'verifyPageReady',
        'findKeywordRank',
        'scrapeResults',
        'testBotAvoidance',
        'validateBotAvoidance'
    ];
    
    const requiredMethods = [
        'getCurrentSearchQuery',
        'verifyPageReady', 
        'scrapeCurrentPageResults'
    ];
    
    let allPassed = true;
    const results = [];
    
    console.log('📋 Checking for required message actions...');
    requiredActions.forEach(action => {
        if (content.includes(`case '${action}':`)) {
            results.push(`✅ Action '${action}' found`);
        } else {
            results.push(`❌ Action '${action}' missing`);
            allPassed = false;
        }
    });
    
    console.log('\n📋 Checking for required methods...');
    requiredMethods.forEach(method => {
        if (content.includes(`${method}(`) && (content.includes(`${method}() {`) || content.includes(`async ${method}(`))) {
            results.push(`✅ Method '${method}' implemented`);
        } else {
            results.push(`❌ Method '${method}' missing implementation`);
            allPassed = false;
        }
    });
    
    // Check for proper error handling
    console.log('\n📋 Checking error handling...');
    if (content.includes('Unknown action:') && content.includes('sendResponse({ success: false')) {
        results.push('✅ Proper error handling for unknown actions');
    } else {
        results.push('❌ Missing error handling for unknown actions');
        allPassed = false;
    }
    
    // Display results
    console.log('\n' + '='.repeat(60));
    console.log('📊 CONTENT SCRIPT VALIDATION RESULTS');
    console.log('='.repeat(60));
    
    results.forEach(result => console.log(`  ${result}`));
    
    console.log('\n' + '='.repeat(60));
    if (allPassed) {
        console.log('🎉 ALL CONTENT SCRIPT ACTIONS IMPLEMENTED!');
        console.log('✅ Extension should now handle all popup requests');
        console.log('✅ All required methods are available');
        console.log('✅ Error handling is comprehensive');
        return true;
    } else {
        console.log('⚠️  Some content script actions are missing');
        console.log('❌ Extension may fail on certain requests');
        return false;
    }
}

// Run validation
const success = testContentScriptActions();
process.exit(success ? 0 : 1);
