/**
 * Keyword Matcher Module - Advanced keyword matching and ranking
 * Handles exact matching, fuzzy matching, text normalization, and relevance scoring
 */

class KeywordMatcher {
    constructor() {
        this.matchingOptions = {
            caseSensitive: false,
            fuzzyThreshold: 0.7,
            maxDistance: 3,
            includePartialMatches: true,
            weightTitle: 3,
            weightSnippet: 1,
            weightURL: 2
        };
    }

    /**
     * Main keyword ranking function
     */
    findKeywordRanking(keyword, results, options = {}) {
        console.log(`🔍 KeywordMatcher.findKeywordRanking called with:`);
        console.log(`   Keyword: "${keyword}"`);
        console.log(`   Results length: ${results?.length || 0}`);
        console.log(`   Options:`, options);
        
        if (!keyword || !results.length) {
            console.log(`❌ Early exit: No keyword or no results`);
            return { 
                found: false, 
                position: null, 
                matchType: 'none',
                confidence: 0,
                matches: []
            };
        }

        const mergedOptions = { ...this.matchingOptions, ...options };
        const normalizedKeyword = this.normalizeText(keyword, mergedOptions);
        
        console.log(`🔍 Searching for keyword: "${keyword}" (normalized: "${normalizedKeyword}") in ${results.length} results`);
        console.log(`📋 Merged options:`, mergedOptions);

        const matches = [];
        
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            console.log(`🔎 Analyzing result ${i + 1}:`, {
                title: result.title,
                snippet: result.snippet?.substring(0, 100) + '...',
                url: result.url
            });
            
            const matchResult = this.analyzeResultMatch(normalizedKeyword, result, mergedOptions);
            console.log(`   Match result:`, matchResult);
            
            if (matchResult.isMatch) {
                matches.push({
                    ...matchResult,
                    position: result.position || (i + 1),
                    result: result
                });
                console.log(`✅ Found match at position ${result.position || (i + 1)}`);
            }
        }

        console.log(`📊 Total matches found: ${matches.length}`);

        if (matches.length === 0) {
            console.log(`❌ No matches found`);
            return {
                found: false,
                position: null,
                matchType: 'none',
                confidence: 0,
                matches: []
            };
        }

        // Sort matches by confidence and position
        matches.sort((a, b) => {
            if (a.confidence !== b.confidence) {
                return b.confidence - a.confidence;
            }
            return a.position - b.position;
        });

        const bestMatch = matches[0];
        console.log(`🏆 Best match:`, bestMatch);
        
        return {
            found: true,
            position: bestMatch.position,
            matchType: bestMatch.type,
            confidence: bestMatch.confidence,
            matches: matches,
            bestMatch: bestMatch
        };
    }

    /**
     * Analyze how well a keyword matches a specific result
     */
    analyzeResultMatch(keyword, result, options) {
        const titleMatch = this.analyzeTextMatch(keyword, result.title, options);
        const snippetMatch = this.analyzeTextMatch(keyword, result.snippet, options);
        const urlMatch = this.analyzeTextMatch(keyword, result.url, options);

        // Calculate weighted confidence score
        const weightedScore = (
            (titleMatch.confidence * options.weightTitle) +
            (snippetMatch.confidence * options.weightSnippet) +
            (urlMatch.confidence * options.weightURL)
        ) / (options.weightTitle + options.weightSnippet + options.weightURL);

        const isMatch = weightedScore > 0.1; // Minimum threshold for considering it a match
        
        let matchType = 'none';
        if (titleMatch.isExact || snippetMatch.isExact || urlMatch.isExact) {
            matchType = 'exact';
        } else if (titleMatch.isFuzzy || snippetMatch.isFuzzy || urlMatch.isFuzzy) {
            matchType = 'fuzzy';
        } else if (titleMatch.isPartial || snippetMatch.isPartial || urlMatch.isPartial) {
            matchType = 'partial';
        }

        return {
            isMatch,
            confidence: weightedScore,
            type: matchType,
            details: {
                title: titleMatch,
                snippet: snippetMatch,
                url: urlMatch
            }
        };
    }

    /**
     * Analyze text match with different matching strategies
     */
    analyzeTextMatch(keyword, text, options) {
        if (!text) {
            return {
                isExact: false,
                isFuzzy: false,
                isPartial: false,
                confidence: 0,
                matchedText: ''
            };
        }

        const normalizedText = this.normalizeText(text, options);
        const normalizedKeyword = this.normalizeText(keyword, options);

        // Exact matching
        const exactMatch = this.performExactMatch(normalizedKeyword, normalizedText, options);
        if (exactMatch.found) {
            return {
                isExact: true,
                isFuzzy: false,
                isPartial: false,
                confidence: 1.0,
                matchedText: exactMatch.matchedText
            };
        }

        // Fuzzy matching
        const fuzzyMatch = this.performFuzzyMatch(normalizedKeyword, normalizedText, options);
        if (fuzzyMatch.found) {
            return {
                isExact: false,
                isFuzzy: true,
                isPartial: false,
                confidence: fuzzyMatch.confidence,
                matchedText: fuzzyMatch.matchedText
            };
        }

        // Partial matching
        const partialMatch = this.performPartialMatch(normalizedKeyword, normalizedText, options);
        if (partialMatch.found) {
            return {
                isExact: false,
                isFuzzy: false,
                isPartial: true,
                confidence: partialMatch.confidence,
                matchedText: partialMatch.matchedText
            };
        }

        return {
            isExact: false,
            isFuzzy: false,
            isPartial: false,
            confidence: 0,
            matchedText: ''
        };
    }

    /**
     * Text normalization for consistent matching
     */
    normalizeText(text, options = {}) {
        if (!text || typeof text !== 'string') {
            return '';
        }

        let normalized = text;

        // Convert to lowercase unless case sensitive
        if (!options.caseSensitive) {
            normalized = normalized.toLowerCase();
        }

        // Remove extra whitespace
        normalized = normalized.replace(/\s+/g, ' ').trim();

        // Remove special characters if specified
        if (options.removeSpecialChars) {
            normalized = normalized.replace(/[^\w\s-]/g, ' ');
        }

        // Remove common stop words if specified
        if (options.removeStopWords) {
            const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
            const words = normalized.split(' ');
            normalized = words.filter(word => !stopWords.includes(word)).join(' ');
        }

        return normalized;
    }

    /**
     * Exact string matching
     */
    performExactMatch(keyword, text, options) {
        const index = text.indexOf(keyword);
        
        if (index !== -1) {
            return {
                found: true,
                position: index,
                matchedText: keyword,
                confidence: 1.0
            };
        }

        return { found: false, confidence: 0 };
    }

    /**
     * Fuzzy matching using Levenshtein distance
     */
    /**
     * Enhanced fuzzy matching with multiple similarity algorithms
     */
    performFuzzyMatch(keyword, text, options) {
        const threshold = options.fuzzyThreshold || 0.7;
        const words = text.split(' ');
        
        let bestMatch = { found: false, confidence: 0 };

        // Strategy 1: Phrase-based fuzzy matching
        for (let i = 0; i < words.length; i++) {
            const maxPhraseLength = Math.min(keyword.split(' ').length + 2, 6);
            for (let j = i; j < Math.min(i + maxPhraseLength, words.length); j++) {
                const phrase = words.slice(i, j + 1).join(' ');
                
                // Multiple similarity measures
                const levenshtein = this.calculateSimilarity(keyword, phrase);
                const jaccardSim = this.calculateJaccardSimilarity(keyword, phrase);
                const tokenSim = this.calculateTokenSimilarity(keyword, phrase);
                
                // Weighted combination of similarity measures
                const combinedSimilarity = (
                    levenshtein * 0.4 + 
                    jaccardSim * 0.3 + 
                    tokenSim * 0.3
                );
                
                if (combinedSimilarity >= threshold && combinedSimilarity > bestMatch.confidence) {
                    bestMatch = {
                        found: true,
                        confidence: combinedSimilarity,
                        matchedText: phrase,
                        position: i,
                        algorithms: {
                            levenshtein: levenshtein,
                            jaccard: jaccardSim,
                            token: tokenSim
                        }
                    };
                }
            }
        }

        // Strategy 2: N-gram based fuzzy matching for better character-level similarity
        if (!bestMatch.found || bestMatch.confidence < 0.8) {
            const ngramMatch = this.performNgramFuzzyMatch(keyword, text, threshold);
            if (ngramMatch.found && ngramMatch.confidence > bestMatch.confidence) {
                bestMatch = ngramMatch;
            }
        }

        return bestMatch;
    }

    /**
     * Calculate Jaccard similarity between two strings
     */
    calculateJaccardSimilarity(str1, str2) {
        const set1 = new Set(str1.toLowerCase().split(''));
        const set2 = new Set(str2.toLowerCase().split(''));
        
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        
        return union.size === 0 ? 0 : intersection.size / union.size;
    }

    /**
     * Calculate token-based similarity (word overlap)
     */
    calculateTokenSimilarity(str1, str2) {
        const tokens1 = new Set(str1.toLowerCase().split(' ').filter(t => t.length > 0));
        const tokens2 = new Set(str2.toLowerCase().split(' ').filter(t => t.length > 0));
        
        const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
        const union = new Set([...tokens1, ...tokens2]);
        
        return union.size === 0 ? 0 : intersection.size / union.size;
    }

    /**
     * N-gram based fuzzy matching for character-level similarity
     */
    performNgramFuzzyMatch(keyword, text, threshold) {
        const ngramSize = 3; // trigrams
        const keywordNgrams = this.generateNgrams(keyword.toLowerCase(), ngramSize);
        const textNgrams = this.generateNgrams(text.toLowerCase(), ngramSize);
        
        if (keywordNgrams.length === 0 || textNgrams.length === 0) {
            return { found: false, confidence: 0 };
        }
        
        // Calculate n-gram overlap
        const keywordSet = new Set(keywordNgrams);
        const textSet = new Set(textNgrams);
        const intersection = new Set([...keywordSet].filter(x => textSet.has(x)));
        
        const similarity = intersection.size / Math.max(keywordSet.size, textSet.size);
        
        if (similarity >= threshold * 0.7) { // Lower threshold for n-gram matching
            return {
                found: true,
                confidence: similarity * 0.8, // Slightly lower confidence for n-gram matches
                matchedText: text,
                position: 0,
                matchType: 'ngram'
            };
        }
        
        return { found: false, confidence: 0 };
    }

    /**
     * Generate n-grams from a string
     */
    generateNgrams(str, n) {
        const ngrams = [];
        const cleanStr = str.replace(/\s+/g, ' ').trim();
        
        for (let i = 0; i <= cleanStr.length - n; i++) {
            ngrams.push(cleanStr.substring(i, i + n));
        }
        
        return ngrams;
    }

    /**
     * Enhanced partial matching with stem-based, fuzzy, and proximity analysis
     */
    performPartialMatch(keyword, text, options) {
        const keywordWords = keyword.split(' ').filter(word => word.length > 0);
        const textWords = text.split(' ').filter(word => word.length > 0);
        
        if (keywordWords.length === 0 || textWords.length === 0) {
            return { found: false, confidence: 0 };
        }

        let matchedWords = 0;
        let matchedText = [];
        let totalSimilarity = 0;
        let proximityBonus = 0;
        const wordMatches = [];

        // Enhanced word-by-word matching with multiple strategies
        for (let i = 0; i < keywordWords.length; i++) {
            const keywordWord = keywordWords[i];
            let bestMatch = null;
            let bestSimilarity = 0;
            let bestMatchIndex = -1;

            for (let j = 0; j < textWords.length; j++) {
                const textWord = textWords[j];
                let similarity = 0;

                // Strategy 1: Exact substring matching
                if (textWord.includes(keywordWord) || keywordWord.includes(textWord)) {
                    similarity = 0.9;
                }
                // Strategy 2: Stem-based matching (simple suffix removal)
                else if (this.stemMatch(keywordWord, textWord)) {
                    similarity = 0.8;
                }
                // Strategy 3: Fuzzy matching using Levenshtein distance
                else {
                    const fuzzyScore = this.calculateSimilarity(keywordWord, textWord);
                    if (fuzzyScore > 0.7) { // Only consider high similarity matches
                        similarity = fuzzyScore * 0.7;
                    }
                }

                if (similarity > bestSimilarity && similarity > 0.6) {
                    bestSimilarity = similarity;
                    bestMatch = textWord;
                    bestMatchIndex = j;
                }
            }

            if (bestMatch) {
                matchedWords++;
                matchedText.push(bestMatch);
                totalSimilarity += bestSimilarity;
                wordMatches.push({
                    keyword: keywordWord,
                    matched: bestMatch,
                    similarity: bestSimilarity,
                    position: bestMatchIndex
                });
            }
        }

        // Calculate proximity bonus for words found close together
        if (wordMatches.length > 1) {
            proximityBonus = this.calculateProximityBonus(wordMatches, textWords.length);
        }

        // Calculate enhanced confidence score
        const baseConfidence = matchedWords / keywordWords.length;
        const avgSimilarity = matchedWords > 0 ? totalSimilarity / matchedWords : 0;
        const enhancedConfidence = (baseConfidence * 0.6 + avgSimilarity * 0.3 + proximityBonus * 0.1);
        
        // Lower threshold for partial matches but with quality scoring
        if (enhancedConfidence > 0.25 && matchedWords > 0) {
            return {
                found: true,
                confidence: Math.min(enhancedConfidence * 0.6, 0.9), // Cap at 90% for partial matches
                matchedText: matchedText.join(' '),
                wordsMatched: matchedWords,
                totalWords: keywordWords.length,
                avgSimilarity: avgSimilarity,
                proximityBonus: proximityBonus,
                matchDetails: wordMatches
            };
        }

        return { found: false, confidence: 0 };
    }

    /**
     * Simple stem matching for common English suffixes
     */
    stemMatch(word1, word2) {
        const suffixes = ['ing', 'ed', 'er', 'est', 'ly', 's', 'es', 'ies', 'ied', 'ier', 'iest'];
        
        const stem1 = this.getStem(word1, suffixes);
        const stem2 = this.getStem(word2, suffixes);
        
        return stem1 === stem2 && stem1.length > 2;
    }

    /**
     * Extract word stem by removing common suffixes
     */
    getStem(word, suffixes) {
        if (word.length <= 3) return word;
        
        for (const suffix of suffixes.sort((a, b) => b.length - a.length)) {
            if (word.endsWith(suffix) && word.length > suffix.length + 2) {
                return word.slice(0, -suffix.length);
            }
        }
        return word;
    }

    /**
     * Calculate proximity bonus for matched words found close together
     */
    calculateProximityBonus(wordMatches, textLength) {
        if (wordMatches.length < 2) return 0;
        
        const positions = wordMatches.map(match => match.position).sort((a, b) => a - b);
        const maxDistance = positions[positions.length - 1] - positions[0];
        const expectedDistance = wordMatches.length - 1;
        
        // Bonus decreases as actual distance exceeds expected distance
        const proximityRatio = Math.max(0, 1 - (maxDistance - expectedDistance) / textLength);
        return proximityRatio * 0.3; // Max 30% bonus
    }

    /**
     * Calculate similarity between two strings using Levenshtein distance
     */
    calculateSimilarity(str1, str2) {
        if (str1 === str2) return 1.0;
        if (str1.length === 0 || str2.length === 0) return 0.0;

        const matrix = Array(str2.length + 1).fill(null).map(() => 
            Array(str1.length + 1).fill(null));

        for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
        for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

        for (let j = 1; j <= str2.length; j++) {
            for (let i = 1; i <= str1.length; i++) {
                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(
                    matrix[j][i - 1] + 1,     // deletion
                    matrix[j - 1][i] + 1,     // insertion
                    matrix[j - 1][i - 1] + cost // substitution
                );
            }
        }

        const distance = matrix[str2.length][str1.length];
        const maxLength = Math.max(str1.length, str2.length);
        return 1 - (distance / maxLength);
    }

    /**
     * Quick position detection for simple checks
     */
    getQuickPosition(keyword, results, options = {}) {
        const ranking = this.findKeywordRanking(keyword, results, options);
        
        if (ranking.found) {
            return {
                found: true,
                position: ranking.position,
                confidence: ranking.confidence
            };
        }

        return { found: false, position: null };
    }

    /**
     * Batch processing for multiple keywords
     */
    detectMultipleKeywordPositions(keywords, results, options = {}) {
        const batchResults = {};

        for (const keyword of keywords) {
            batchResults[keyword] = this.findKeywordRanking(keyword, results, options);
        }

        return batchResults;
    }
}

// Export for use in other modules
window.KeywordMatcher = KeywordMatcher;
