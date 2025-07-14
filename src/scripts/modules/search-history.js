/**
 * Search History Module - Local storage and search history management
 * Handles saving, retrieving, and managing keyword search history
 */

class SearchHistory {
    constructor() {
        this.maxHistorySize = 50;
        this.historyKey = 'google_keyword_rank_history';
        this.enabled = true;
        this.autoSave = true;
        this.data = [];
        
        this.init();
    }

    async init() {
        console.log('📚 Initializing search history functionality');
        await this.loadSearchHistory();
        console.log('✅ Search history initialized');
    }

    async loadSearchHistory() {
        try {
            const result = await chrome.storage.local.get([this.historyKey]);
            const storedHistory = result[this.historyKey];
            
            if (storedHistory && Array.isArray(storedHistory)) {
                this.data = storedHistory;
                console.log(`📚 Loaded ${storedHistory.length} search history entries`);
            } else {
                this.data = [];
                console.log('📚 No existing search history found, starting fresh');
            }
            
            // Clean old entries (older than 30 days)
            this.cleanOldHistoryEntries();
            
        } catch (error) {
            console.warn('⚠️ Failed to load search history:', error);
            this.data = [];
        }
    }

    async saveSearchResult(keyword, results, matchResult) {
        if (!this.enabled || !this.autoSave) {
            return;
        }

        try {
            const historyEntry = {
                id: this.generateHistoryId(),
                keyword: keyword,
                timestamp: Date.now(),
                searchDate: new Date().toISOString(),
                results: {
                    found: matchResult.found,
                    position: matchResult.position,
                    matchType: matchResult.matchType,
                    confidence: matchResult.confidence,
                    totalResults: results.length
                },
                metadata: {
                    url: window.location.href,
                    userAgent: navigator.userAgent.substring(0, 100), // Truncate for storage
                    searchEngine: 'Google'
                }
            };

            // Add to history array
            this.data.unshift(historyEntry); // Add to beginning

            // Limit history size
            if (this.data.length > this.maxHistorySize) {
                this.data = this.data.slice(0, this.maxHistorySize);
            }

            // Save to Chrome storage
            await this.saveHistoryToStorage();

            console.log(`📚 Saved search history for keyword: "${keyword}"`);

        } catch (error) {
            console.warn('⚠️ Failed to save search history:', error);
        }
    }

    async saveHistoryToStorage() {
        try {
            await chrome.storage.local.set({
                [this.historyKey]: this.data
            });
        } catch (error) {
            console.error('❌ Failed to save history to storage:', error);
        }
    }

    generateHistoryId() {
        return `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    cleanOldHistoryEntries() {
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        
        const originalLength = this.data.length;
        this.data = this.data.filter(entry => 
            entry.timestamp > thirtyDaysAgo
        );
        
        const removedCount = originalLength - this.data.length;
        if (removedCount > 0) {
            console.log(`🧹 Cleaned ${removedCount} old history entries`);
            this.saveHistoryToStorage(); // Save after cleaning
        }
    }

    async getSearchHistory(options = {}) {
        const {
            limit = 20,
            keyword = null,
            dateFrom = null,
            dateTo = null,
            foundOnly = false
        } = options;

        let filteredHistory = [...this.data];

        // Filter by keyword
        if (keyword) {
            const normalizedKeyword = keyword.toLowerCase();
            filteredHistory = filteredHistory.filter(entry =>
                entry.keyword.toLowerCase().includes(normalizedKeyword)
            );
        }

        // Filter by date range
        if (dateFrom) {
            const fromTimestamp = new Date(dateFrom).getTime();
            filteredHistory = filteredHistory.filter(entry =>
                entry.timestamp >= fromTimestamp
            );
        }

        if (dateTo) {
            const toTimestamp = new Date(dateTo).getTime();
            filteredHistory = filteredHistory.filter(entry =>
                entry.timestamp <= toTimestamp
            );
        }

        // Filter by found results only
        if (foundOnly) {
            filteredHistory = filteredHistory.filter(entry =>
                entry.results.found === true
            );
        }

        // Apply limit
        filteredHistory = filteredHistory.slice(0, limit);

        return {
            history: filteredHistory,
            total: this.data.length,
            filtered: filteredHistory.length,
            options: options
        };
    }

    async clearSearchHistory(options = {}) {
        const { olderThan = null, keyword = null, confirmClear = false } = options;

        let entriesToRemove = [];

        if (olderThan) {
            const cutoffDate = new Date(olderThan).getTime();
            entriesToRemove = this.data.filter(entry =>
                entry.timestamp < cutoffDate
            );
        } else if (keyword) {
            const normalizedKeyword = keyword.toLowerCase();
            entriesToRemove = this.data.filter(entry =>
                entry.keyword.toLowerCase().includes(normalizedKeyword)
            );
        } else if (confirmClear) {
            // Clear all history
            entriesToRemove = [...this.data];
        }

        if (entriesToRemove.length > 0) {
            // Remove entries
            this.data = this.data.filter(entry =>
                !entriesToRemove.includes(entry)
            );

            // Save updated history
            await this.saveHistoryToStorage();

            console.log(`🗑️ Cleared ${entriesToRemove.length} history entries`);
            return {
                success: true,
                removedCount: entriesToRemove.length,
                remainingCount: this.data.length
            };
        }

        return {
            success: false,
            message: 'No entries matched removal criteria',
            removedCount: 0
        };
    }

    getHistoryStats() {
        const stats = {
            totalSearches: this.data.length,
            successfulSearches: 0,
            averagePosition: 0,
            topKeywords: {},
            recentActivity: {
                last7Days: 0,
                last30Days: 0
            },
            positionDistribution: {
                topThree: 0,
                firstPage: 0,
                notFound: 0
            }
        };

        if (this.data.length === 0) {
            return stats;
        }

        const now = Date.now();
        const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
        
        let totalPosition = 0;
        let foundCount = 0;

        this.data.forEach(entry => {
            // Count successful searches
            if (entry.results.found) {
                stats.successfulSearches++;
                foundCount++;
                totalPosition += entry.results.position;

                // Position distribution
                if (entry.results.position <= 3) {
                    stats.positionDistribution.topThree++;
                } else if (entry.results.position <= 10) {
                    stats.positionDistribution.firstPage++;
                }
            } else {
                stats.positionDistribution.notFound++;
            }

            // Recent activity
            if (entry.timestamp > sevenDaysAgo) {
                stats.recentActivity.last7Days++;
            }
            if (entry.timestamp > thirtyDaysAgo) {
                stats.recentActivity.last30Days++;
            }

            // Top keywords
            const keyword = entry.keyword.toLowerCase();
            stats.topKeywords[keyword] = (stats.topKeywords[keyword] || 0) + 1;
        });

        // Calculate average position
        if (foundCount > 0) {
            stats.averagePosition = Math.round((totalPosition / foundCount) * 100) / 100;
        }

        // Sort top keywords
        stats.topKeywords = Object.entries(stats.topKeywords)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .reduce((obj, [keyword, count]) => {
                obj[keyword] = count;
                return obj;
            }, {});

        return stats;
    }

    async exportSearchHistory(format = 'json') {
        try {
            const historyData = await this.getSearchHistory({ limit: 1000 });
            
            switch (format.toLowerCase()) {
                case 'csv':
                    return this.exportHistoryAsCSV(historyData.history);
                case 'json':
                default:
                    return {
                        format: 'json',
                        data: JSON.stringify({
                            exportDate: new Date().toISOString(),
                            totalEntries: historyData.total,
                            history: historyData.history,
                            stats: this.getHistoryStats()
                        }, null, 2),
                        filename: 'keyword_rank_history_' + new Date().toISOString().split('T')[0] + '.json'
                    };
            }
        } catch (error) {
            console.error('❌ Failed to export search history:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    exportHistoryAsCSV(historyData) {
        const headers = [
            'Date',
            'Keyword', 
            'Found',
            'Position',
            'Match Type',
            'Confidence',
            'Total Results',
            'URL'
        ];

        const csvRows = [headers.join(',')];

        historyData.forEach(entry => {
            const row = [
                new Date(entry.timestamp).toISOString(),
                `"${entry.keyword.replace(/"/g, '""')}"`,
                entry.results.found,
                entry.results.position || 'N/A',
                entry.results.matchType || 'N/A',
                entry.results.confidence || 'N/A',
                entry.results.totalResults || 'N/A',
                entry.metadata.url.replace(/"/g, '""')
            ];
            csvRows.push(row.join(','));
        });

        return {
            format: 'csv',
            data: csvRows.join('\n'),
            filename: 'keyword_rank_history_' + new Date().toISOString().split('T')[0] + '.csv'
        };
    }

    // Settings management
    updateSettings(settings) {
        if (settings.hasOwnProperty('enabled')) {
            this.enabled = settings.enabled;
        }
        if (settings.hasOwnProperty('autoSave')) {
            this.autoSave = settings.autoSave;
        }
        if (settings.hasOwnProperty('maxHistorySize')) {
            this.maxHistorySize = Math.max(10, Math.min(1000, settings.maxHistorySize));
        }
    }

    getSettings() {
        return {
            enabled: this.enabled,
            autoSave: this.autoSave,
            maxHistorySize: this.maxHistorySize,
            currentSize: this.data.length
        };
    }
}

// Export for use in other modules
window.SearchHistory = SearchHistory;
