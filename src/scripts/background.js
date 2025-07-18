/**
 * Background Service Worker for Keyword Rank Finder Chrome Extension
 * Handles background tasks and extension lifecycle events
 */

// Extension installation and startup
chrome.runtime.onInstalled.addListener((details) => {

    
    if (details.reason === 'install') {
        // First time installation

    } else if (details.reason === 'update') {
        // Extension updated

    }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {

});

// Handle messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    
    switch (request.action) {
        case 'openGoogleSearch':
            handleOpenGoogleSearch(request, sendResponse);
            return true;
            
        case 'getTabInfo':
            handleGetTabInfo(sendResponse);
            return true;
            
        case 'contentScriptReady':

            // Store ready status if needed
            sendResponse({ success: true });
            return true;
            
        default:
            sendResponse({ error: 'Unknown action' });
    }
});

// Handle opening Google search in a new tab or current tab
async function handleOpenGoogleSearch(request, sendResponse) {
    try {
        const keyword = request.keyword;
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}`;
        
        // Get current active tab
        const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (request.newTab) {
            // Open in new tab
            const newTab = await chrome.tabs.create({ url: searchUrl });
            sendResponse({ success: true, tabId: newTab.id });
        } else {
            // Update current tab
            await chrome.tabs.update(currentTab.id, { url: searchUrl });
            sendResponse({ success: true, tabId: currentTab.id });
        }
    } catch (error) {
        console.error('Error opening Google search:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Get information about the current tab
async function handleGetTabInfo(sendResponse) {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        sendResponse({
            success: true,
            tab: {
                id: tab.id,
                url: tab.url,
                title: tab.title,
                isGoogleSearch: tab.url.includes('google.com/search')
            }
        });
    } catch (error) {
        console.error('Error getting tab info:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Handle tab updates (when user navigates to different pages)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {

        
        // Check if it's a Google search page
        if (tab.url.includes('google.com/search')) {

            // Could send message to popup or store this info
        }
    }
});

// Handle storage changes (optional: for debugging)
chrome.storage.onChanged.addListener((changes, namespace) => {

});

// Error handling for the service worker
self.addEventListener('error', (error) => {
    console.error('Background script error:', error);
});

// Handle unhandled promise rejections
self.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection in background:', event.reason);
    event.preventDefault();
});
