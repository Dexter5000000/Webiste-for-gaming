// Navigation Management
class NavigationManager {
    constructor(browser) {
        this.browser = browser;
        this.history = new Map(); // Tab ID -> history array
        this.historyIndex = new Map(); // Tab ID -> current index
    }

    // Navigation History Management
    addToHistory(tabId, url) {
        if (!this.history.has(tabId)) {
            this.history.set(tabId, []);
            this.historyIndex.set(tabId, -1);
        }

        const history = this.history.get(tabId);
        const currentIndex = this.historyIndex.get(tabId);

        // Remove any forward history when navigating to a new page
        history.splice(currentIndex + 1);
        
        // Add new URL to history
        history.push({
            url,
            title: this.browser.getPageTitle(url),
            timestamp: Date.now()
        });

        // Update current index
        this.historyIndex.set(tabId, history.length - 1);
        
        // Update navigation button states
        this.updateNavigationButtons(tabId);
    }

    canGoBack(tabId) {
        const currentIndex = this.historyIndex.get(tabId);
        return currentIndex > 0;
    }

    canGoForward(tabId) {
        const history = this.history.get(tabId);
        const currentIndex = this.historyIndex.get(tabId);
        return history && currentIndex < history.length - 1;
    }

    goBack(tabId) {
        if (!this.canGoBack(tabId)) return null;

        const currentIndex = this.historyIndex.get(tabId);
        const newIndex = currentIndex - 1;
        this.historyIndex.set(tabId, newIndex);

        const history = this.history.get(tabId);
        const entry = history[newIndex];
        
        this.updateNavigationButtons(tabId);
        return entry;
    }

    goForward(tabId) {
        if (!this.canGoForward(tabId)) return null;

        const currentIndex = this.historyIndex.get(tabId);
        const newIndex = currentIndex + 1;
        this.historyIndex.set(tabId, newIndex);

        const history = this.history.get(tabId);
        const entry = history[newIndex];
        
        this.updateNavigationButtons(tabId);
        return entry;
    }

    getCurrentEntry(tabId) {
        const history = this.history.get(tabId);
        const currentIndex = this.historyIndex.get(tabId);
        
        if (history && currentIndex >= 0 && currentIndex < history.length) {
            return history[currentIndex];
        }
        
        return null;
    }

    getHistory(tabId) {
        return this.history.get(tabId) || [];
    }

    updateNavigationButtons(tabId) {
        if (tabId === this.browser.activeTabId) {
            const tab = this.browser.tabs.get(tabId);
            if (tab) {
                tab.canGoBack = this.canGoBack(tabId);
                tab.canGoForward = this.canGoForward(tabId);
                this.browser.updateNavigationState();
            }
        }
    }

    // Clear history for a tab
    clearHistory(tabId) {
        this.history.delete(tabId);
        this.historyIndex.delete(tabId);
    }

    // URL Processing and Validation
    static isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch {
            return false;
        }
    }

    static isSearchQuery(input) {
        // Check if input looks like a search query rather than a URL
        const trimmed = input.trim();
        
        // If it contains spaces, likely a search
        if (trimmed.includes(' ')) return true;
        
        // If it doesn't contain dots or common URL patterns
        if (!trimmed.includes('.') && !trimmed.includes('://')) return true;
        
        // If it starts with common search patterns
        const searchPatterns = ['what', 'how', 'where', 'when', 'why', 'who'];
        const firstWord = trimmed.split(' ')[0].toLowerCase();
        if (searchPatterns.includes(firstWord)) return true;
        
        return false;
    }

    static processUserInput(input) {
        input = input.trim();
        
        if (!input) return '';
        
        // Handle special URLs
        if (input === 'home' || input === 'start') {
            return 'zenith://start';
        }
        
        // If it's clearly a search query
        if (NavigationManager.isSearchQuery(input)) {
            return `https://www.google.com/search?q=${encodeURIComponent(input)}`;
        }
        
        // If it's already a valid URL
        if (NavigationManager.isValidUrl(input)) {
            return input;
        }
        
        // If it looks like a domain (contains at least one dot)
        if (input.includes('.') && !input.includes(' ')) {
            // Add protocol if missing
            if (!input.startsWith('http://') && !input.startsWith('https://')) {
                return `https://${input}`;
            }
            return input;
        }
        
        // Default to search
        return `https://www.google.com/search?q=${encodeURIComponent(input)}`;
    }

    static extractDomain(url) {
        try {
            return new URL(url).hostname;
        } catch {
            return '';
        }
    }

    static isSecureConnection(url) {
        try {
            return new URL(url).protocol === 'https:';
        } catch {
            return false;
        }
    }

    // Security and Privacy Features
    static shouldBlockUrl(url) {
        // List of known malicious domains (simplified)
        const blockedDomains = [
            'malware.com',
            'phishing.example.com'
            // Add more as needed
        ];
        
        try {
            const domain = new URL(url).hostname;
            return blockedDomains.some(blocked => domain.includes(blocked));
        } catch {
            return false;
        }
    }

    static getSecurityLevel(url) {
        if (url.startsWith('zenith://')) return 'internal';
        if (url.startsWith('https://')) return 'secure';
        if (url.startsWith('http://')) return 'insecure';
        return 'unknown';
    }

    // Bookmarks Management (simplified)
    static getBookmarks() {
        try {
            const bookmarks = localStorage.getItem('zenith-bookmarks');
            return bookmarks ? JSON.parse(bookmarks) : [];
        } catch {
            return [];
        }
    }

    static saveBookmarks(bookmarks) {
        try {
            localStorage.setItem('zenith-bookmarks', JSON.stringify(bookmarks));
            return true;
        } catch {
            return false;
        }
    }

    static addBookmark(url, title) {
        const bookmarks = NavigationManager.getBookmarks();
        const bookmark = {
            id: Date.now().toString(),
            url,
            title: title || NavigationManager.extractDomain(url),
            timestamp: Date.now()
        };
        
        bookmarks.push(bookmark);
        return NavigationManager.saveBookmarks(bookmarks);
    }

    static removeBookmark(id) {
        const bookmarks = NavigationManager.getBookmarks();
        const filtered = bookmarks.filter(b => b.id !== id);
        return NavigationManager.saveBookmarks(filtered);
    }

    static isBookmarked(url) {
        const bookmarks = NavigationManager.getBookmarks();
        return bookmarks.some(b => b.url === url);
    }

    // Download Management (placeholder)
    static handleDownload(url, filename) {
        // In a real browser, this would handle file downloads
        console.log('Download requested:', url, filename);
        
        // For now, just open in new tab/window
        window.open(url, '_blank');
    }

    // Auto-completion and Suggestions
    static getUrlSuggestions(input) {
        const suggestions = [];
        
        // Get from history
        const allHistory = this.getAllHistory();
        const historyMatches = allHistory
            .filter(entry => 
                entry.url.toLowerCase().includes(input.toLowerCase()) ||
                entry.title.toLowerCase().includes(input.toLowerCase())
            )
            .slice(0, 5);
        
        suggestions.push(...historyMatches.map(entry => ({
            type: 'history',
            url: entry.url,
            title: entry.title
        })));
        
        // Get from bookmarks
        const bookmarks = NavigationManager.getBookmarks();
        const bookmarkMatches = bookmarks
            .filter(bookmark =>
                bookmark.url.toLowerCase().includes(input.toLowerCase()) ||
                bookmark.title.toLowerCase().includes(input.toLowerCase())
            )
            .slice(0, 3);
        
        suggestions.push(...bookmarkMatches.map(bookmark => ({
            type: 'bookmark',
            url: bookmark.url,
            title: bookmark.title
        })));
        
        // Add search suggestion if input looks like a query
        if (NavigationManager.isSearchQuery(input)) {
            suggestions.unshift({
                type: 'search',
                url: `https://www.google.com/search?q=${encodeURIComponent(input)}`,
                title: `Search for "${input}"`
            });
        }
        
        return suggestions.slice(0, 8); // Limit to 8 suggestions
    }

    getAllHistory() {
        const allEntries = [];
        this.history.forEach((tabHistory) => {
            allEntries.push(...tabHistory);
        });
        
        // Sort by timestamp, most recent first
        return allEntries.sort((a, b) => b.timestamp - a.timestamp);
    }

    // Privacy Features
    clearBrowsingData(options = {}) {
        if (options.history) {
            this.history.clear();
            this.historyIndex.clear();
        }
        
        if (options.bookmarks) {
            localStorage.removeItem('zenith-bookmarks');
        }
        
        if (options.settings) {
            localStorage.removeItem('zenith-settings');
        }
        
        if (options.cache) {
            // Clear browser cache (simplified)
            console.log('Cache cleared');
        }
    }
}

// Export for use in other modules
window.NavigationManager = NavigationManager;