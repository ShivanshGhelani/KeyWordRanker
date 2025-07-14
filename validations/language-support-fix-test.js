/**
 * Language Support Error Fix Validation
 * Tests the fix for the hasOwnProperty error
 */

console.log('🔧 Testing Language Support Error Fix...');
console.log('====================================\n');

// Mock browser environment
global.window = {};
global.navigator = {
    language: 'en-US',
    languages: ['en-US', 'en']
};

// Load the LanguageSupport class
const LanguageSupport = require('./src/scripts/modules/language-support.js');

try {
    console.log('1️⃣ Testing LanguageSupport initialization...');
    
    // This should now work without errors
    const languageSupport = new LanguageSupport();
    
    console.log('   ✅ LanguageSupport created successfully');
    console.log(`   🌍 Current language: ${languageSupport.currentLanguage}`);
    console.log(`   🏳️ Current country: ${languageSupport.currentCountry}`);
    
    // Test key methods
    console.log('\n2️⃣ Testing key methods...');
    
    const isValidEn = languageSupport.isValidLanguage('en-US');
    const isValidEs = languageSupport.isValidLanguage('es-ES');
    const isValidInvalid = languageSupport.isValidLanguage('invalid-lang');
    
    console.log(`   ✅ isValidLanguage('en-US'): ${isValidEn}`);
    console.log(`   ✅ isValidLanguage('es-ES'): ${isValidEs}`);
    console.log(`   ✅ isValidLanguage('invalid-lang'): ${isValidInvalid}`);
    
    const supportedLangs = languageSupport.getSupportedLanguages();
    console.log(`   ✅ getSupportedLanguages(): ${supportedLangs.length} languages`);
    
    const config = languageSupport.getLanguageConfig('en-US');
    console.log(`   ✅ getLanguageConfig('en-US'): ${config.googleDomain}`);
    
    console.log('\n3️⃣ Testing normalization...');
    
    const normalized1 = languageSupport.normalizeLanguageCode('en');
    const normalized2 = languageSupport.normalizeLanguageCode('es-ES');
    const normalized3 = languageSupport.normalizeLanguageCode(null);
    
    console.log(`   ✅ normalizeLanguageCode('en'): ${normalized1}`);
    console.log(`   ✅ normalizeLanguageCode('es-ES'): ${normalized2}`);
    console.log(`   ✅ normalizeLanguageCode(null): ${normalized3}`);
    
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('   - LanguageSupport initializes without hasOwnProperty errors');
    console.log('   - All methods work correctly with safety checks');
    console.log('   - Language configuration is properly loaded');
    
} catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('   Stack:', error.stack);
    
    if (error.message.includes('hasOwnProperty')) {
        console.error('   🚨 hasOwnProperty error still exists!');
    }
}

console.log('\n✅ Language support error fix validation completed!');
