/**
 * Language Support Module - Multi-language search handling
 * Provides comprehensive internationalization for Google search across different locales
 */

class LanguageSupport {
    constructor() {
        // Initialize language configurations first
        this.languageConfigs = {
            'en-US': {
                code: 'en',
                country: 'US',
                googleDomain: 'google.com',
                direction: 'ltr',
                encoding: 'UTF-8',
                searchParams: {
                    hl: 'en',
                    gl: 'US',
                    lr: 'lang_en'
                },
                keywords: {
                    sample: ['technology', 'business', 'news', 'sports', 'health'],
                    common: ['best', 'how to', 'what is', 'where', 'when']
                }
            },
            'es-ES': {
                code: 'es',
                country: 'ES',
                googleDomain: 'google.es',
                direction: 'ltr',
                encoding: 'UTF-8',
                searchParams: {
                    hl: 'es',
                    gl: 'ES',
                    lr: 'lang_es'
                },
                keywords: {
                    sample: ['tecnología', 'negocio', 'noticias', 'deportes', 'salud'],
                    common: ['mejor', 'cómo', 'qué es', 'dónde', 'cuándo']
                }
            },
            'fr-FR': {
                code: 'fr',
                country: 'FR',
                googleDomain: 'google.fr',
                direction: 'ltr',
                encoding: 'UTF-8',
                searchParams: {
                    hl: 'fr',
                    gl: 'FR',
                    lr: 'lang_fr'
                },
                keywords: {
                    sample: ['technologie', 'entreprise', 'actualités', 'sport', 'santé'],
                    common: ['meilleur', 'comment', 'qu\'est-ce que', 'où', 'quand']
                }
            },
            'de-DE': {
                code: 'de',
                country: 'DE',
                googleDomain: 'google.de',
                direction: 'ltr',
                encoding: 'UTF-8',
                searchParams: {
                    hl: 'de',
                    gl: 'DE',
                    lr: 'lang_de'
                },
                keywords: {
                    sample: ['technologie', 'geschäft', 'nachrichten', 'sport', 'gesundheit'],
                    common: ['beste', 'wie zu', 'was ist', 'wo', 'wann']
                }
            },
            'ja-JP': {
                code: 'ja',
                country: 'JP',
                googleDomain: 'google.co.jp',
                direction: 'ltr',
                encoding: 'UTF-8',
                searchParams: {
                    hl: 'ja',
                    gl: 'JP',
                    lr: 'lang_ja'
                },
                keywords: {
                    sample: ['技術', 'ビジネス', 'ニュース', 'スポーツ', '健康'],
                    common: ['最高の', 'やり方', 'とは', 'どこ', 'いつ']
                }
            },
            'zh-CN': {
                code: 'zh-CN',
                country: 'CN',
                googleDomain: 'google.com.hk', // Alternative since google.cn is restricted
                direction: 'ltr',
                encoding: 'UTF-8',
                searchParams: {
                    hl: 'zh-CN',
                    gl: 'CN',
                    lr: 'lang_zh-CN'
                },
                keywords: {
                    sample: ['技术', '商业', '新闻', '体育', '健康'],
                    common: ['最好的', '如何', '什么是', '哪里', '什么时候']
                }
            },
            'pt-BR': {
                code: 'pt',
                country: 'BR',
                googleDomain: 'google.com.br',
                direction: 'ltr',
                encoding: 'UTF-8',
                searchParams: {
                    hl: 'pt',
                    gl: 'BR',
                    lr: 'lang_pt'
                },
                keywords: {
                    sample: ['tecnologia', 'negócio', 'notícias', 'esportes', 'saúde'],
                    common: ['melhor', 'como', 'o que é', 'onde', 'quando']
                }
            },
            'it-IT': {
                code: 'it',
                country: 'IT',
                googleDomain: 'google.it',
                direction: 'ltr',
                encoding: 'UTF-8',
                searchParams: {
                    hl: 'it',
                    gl: 'IT',
                    lr: 'lang_it'
                },
                keywords: {
                    sample: ['tecnologia', 'affari', 'notizie', 'sport', 'salute'],
                    common: ['migliore', 'come', 'cos\'è', 'dove', 'quando']
                }
            },
            'ru-RU': {
                code: 'ru',
                country: 'RU',
                googleDomain: 'google.ru',
                direction: 'ltr',
                encoding: 'UTF-8',
                searchParams: {
                    hl: 'ru',
                    gl: 'RU',
                    lr: 'lang_ru'
                },
                keywords: {
                    sample: ['технология', 'бизнес', 'новости', 'спорт', 'здоровье'],
                    common: ['лучший', 'как', 'что такое', 'где', 'когда']
                }
            },
            'ko-KR': {
                code: 'ko',
                country: 'KR',
                googleDomain: 'google.co.kr',
                direction: 'ltr',
                encoding: 'UTF-8',
                searchParams: {
                    hl: 'ko',
                    gl: 'KR',
                    lr: 'lang_ko'
                },
                keywords: {
                    sample: ['기술', '비즈니스', '뉴스', '스포츠', '건강'],
                    common: ['최고의', '방법', '무엇인가', '어디', '언제']
                }
            }
        };

        // Now detect browser language using the configs
        this.currentLanguage = this.detectBrowserLanguage();
        this.currentCountry = this.detectBrowserCountry();

        this.init();
    }

    init() {
        this.detectCurrentContext();
        console.log(`🌍 Language Support initialized: ${this.currentLanguage} (${this.currentCountry})`);
    }

    /**
     * Detect browser language from various sources
     */
    detectBrowserLanguage() {
        // Check if we're in a browser environment
        if (typeof navigator === 'undefined') {
            return 'en-US'; // Default fallback for non-browser environments
        }
        
        // Try multiple sources for language detection
        const sources = [
            navigator.language,
            navigator.languages?.[0],
            navigator.userLanguage,
            navigator.browserLanguage,
            navigator.systemLanguage,
            'en-US' // fallback
        ];

        for (const lang of sources) {
            if (lang && this.isValidLanguage(lang)) {
                return this.normalizeLanguageCode(lang);
            }
        }

        return 'en-US';
    }

    /**
     * Detect browser country/region
     */
    detectBrowserCountry() {
        const lang = this.detectBrowserLanguage();
        const parts = lang.split('-');
        return parts.length > 1 ? parts[1] : 'US';
    }

    /**
     * Detect current page context (URL-based detection)
     */
    detectCurrentContext() {
        // Check if we're in a browser environment
        if (typeof window === 'undefined' || !window.location) {
            return; // Skip detection in non-browser environments
        }
        
        const url = window.location.href;
        const urlParams = new URLSearchParams(window.location.search);
        
        // Extract language from Google URL parameters
        const hlParam = urlParams.get('hl');
        const glParam = urlParams.get('gl');
        
        if (hlParam && glParam) {
            const detectedLang = `${hlParam}-${glParam}`;
            if (this.isValidLanguage(detectedLang)) {
                this.currentLanguage = detectedLang;
                this.currentCountry = glParam;
                return;
            }
        }

        // Extract from Google domain
        const domainMatch = url.match(/google\.([a-z]{2,3}(?:\.[a-z]{2})?)/);
        if (domainMatch) {
            const domain = domainMatch[1];
            const langFromDomain = this.getLanguageFromDomain(domain);
            if (langFromDomain) {
                this.currentLanguage = langFromDomain;
                this.currentCountry = langFromDomain.split('-')[1];
            }
        }
    }

    /**
     * Get language configuration for a specific language
     */
    getLanguageConfig(language = null) {
        if (!this.languageConfigs) {
            // Return default config if languageConfigs not initialized
            return {
                code: 'en',
                country: 'US',
                googleDomain: 'google.com',
                direction: 'ltr',
                encoding: 'UTF-8',
                searchParams: { hl: 'en', gl: 'US', lr: 'lang_en' },
                keywords: { sample: ['test'], common: ['best', 'how to'] }
            };
        }
        
        const targetLang = language || this.currentLanguage || 'en-US';
        return this.languageConfigs[targetLang] || this.languageConfigs['en-US'];
    }

    /**
     * Get all supported languages
     */
    getSupportedLanguages() {
        return this.languageConfigs ? Object.keys(this.languageConfigs) : ['en-US'];
    }

    /**
     * Check if language is supported
     */
    isValidLanguage(language) {
        return this.languageConfigs && this.languageConfigs.hasOwnProperty(language);
    }

    /**
     * Normalize language code to our standard format
     */
    normalizeLanguageCode(language) {
        if (!language) return 'en-US';
        
        // Handle common variations
        const normalized = language.toLowerCase();
        const mappings = {
            'en': 'en-US',
            'es': 'es-ES',
            'fr': 'fr-FR',
            'de': 'de-DE',
            'ja': 'ja-JP',
            'zh': 'zh-CN',
            'pt': 'pt-BR',
            'it': 'it-IT',
            'ru': 'ru-RU',
            'ko': 'ko-KR'
        };

        if (mappings[normalized]) {
            return mappings[normalized];
        }

        // Check if it's already in our format
        if (this.languageConfigs && this.languageConfigs[language]) {
            return language;
        }

        return 'en-US';
    }

    /**
     * Extract language from Google domain
     */
    getLanguageFromDomain(domain) {
        const domainMappings = {
            'com': 'en-US',
            'es': 'es-ES',
            'fr': 'fr-FR',
            'de': 'de-DE',
            'co.jp': 'ja-JP',
            'com.hk': 'zh-CN',
            'com.br': 'pt-BR',
            'it': 'it-IT',
            'ru': 'ru-RU',
            'co.kr': 'ko-KR'
        };

        return domainMappings[domain] || null;
    }

    /**
     * Generate search URL with proper language parameters
     */
    generateSearchURL(keyword, language = null, options = {}) {
        const config = this.getLanguageConfig(language);
        const baseURL = `https://www.${config.googleDomain}/search`;
        
        const params = new URLSearchParams({
            q: keyword,
            ...config.searchParams,
            ...options
        });

        return `${baseURL}?${params.toString()}`;
    }

    /**
     * Get localized headers for HTTP requests
     */
    getLocalizedHeaders(language = null) {
        const config = this.getLanguageConfig(language);
        
        return {
            'Accept-Language': `${config.code}-${config.country},${config.code};q=0.9,en;q=0.8`,
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        };
    }

    /**
     * Get sample keywords for testing in specific language
     */
    getSampleKeywords(language = null, category = 'sample') {
        const config = this.getLanguageConfig(language);
        return config.keywords[category] || config.keywords.sample || ['test'];
    }

    /**
     * Translate basic search terms (simple mapping)
     */
    getSearchTermTranslation(term, language = null) {
        const translations = {
            'search': {
                'en-US': 'search',
                'es-ES': 'buscar',
                'fr-FR': 'rechercher',
                'de-DE': 'suchen',
                'ja-JP': '検索',
                'zh-CN': '搜索',
                'pt-BR': 'pesquisar',
                'it-IT': 'cercare',
                'ru-RU': 'поиск',
                'ko-KR': '검색'
            },
            'results': {
                'en-US': 'results',
                'es-ES': 'resultados',
                'fr-FR': 'résultats',
                'de-DE': 'ergebnisse',
                'ja-JP': '結果',
                'zh-CN': '结果',
                'pt-BR': 'resultados',
                'it-IT': 'risultati',
                'ru-RU': 'результаты',
                'ko-KR': '결과'
            }
        };

        const targetLang = language || this.currentLanguage;
        return translations[term]?.[targetLang] || term;
    }

    /**
     * Generate comprehensive test scenarios for multiple languages
     */
    generateLanguageTestScenarios() {
        const scenarios = [];
        
        for (const [langCode, config] of Object.entries(this.languageConfigs)) {
            scenarios.push({
                language: langCode,
                country: config.country,
                domain: config.googleDomain,
                sampleKeywords: config.keywords.sample,
                commonTerms: config.keywords.common,
                searchURL: this.generateSearchURL(config.keywords.sample[0], langCode),
                headers: this.getLocalizedHeaders(langCode),
                encoding: config.encoding,
                direction: config.direction
            });
        }

        return scenarios;
    }

    /**
     * Validate language support for specific functionality
     */
    validateLanguageSupport(language, features = []) {
        const config = this.getLanguageConfig(language);
        const validation = {
            language: language,
            supported: this.isValidLanguage(language),
            config: config,
            features: {}
        };

        // Check specific features
        features.forEach(feature => {
            switch (feature) {
                case 'search':
                    validation.features.search = !!config.searchParams;
                    break;
                case 'keywords':
                    validation.features.keywords = !!config.keywords;
                    break;
                case 'domain':
                    validation.features.domain = !!config.googleDomain;
                    break;
                default:
                    validation.features[feature] = true;
            }
        });

        return validation;
    }

    /**
     * Get current language context
     */
    getCurrentContext() {
        return {
            language: this.currentLanguage,
            country: this.currentCountry,
            config: this.getLanguageConfig(),
            domain: window.location.hostname,
            url: window.location.href
        };
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.LanguageSupport = LanguageSupport;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = LanguageSupport;
}
