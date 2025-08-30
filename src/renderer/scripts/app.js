// Main Application Script
class ZenithBrowser {
    constructor() {
        this.tabs = new Map();
        this.activeTabId = '1';
        this.tabCounter = 1;
        this.settings = this.loadSettings();
        this.init();
    }

    init() {
        this.initializeDOM();
        this.bindEvents();
        this.setupKeyboardShortcuts();
        this.applyTheme();
        
        // Initialize with first tab
        this.createTab('1', 'New Tab', 'zenith://start', true);
    }

    initializeDOM() {
        // Get DOM elements
        this.elements = {
            // Title bar controls
            minimizeBtn: document.getElementById('minimizeBtn'),
            maximizeBtn: document.getElementById('maximizeBtn'),
            closeBtn: document.getElementById('closeBtn'),
            
            // Navigation controls
            backBtn: document.getElementById('backBtn'),
            forwardBtn: document.getElementById('forwardBtn'),
            refreshBtn: document.getElementById('refreshBtn'),
            homeBtn: document.getElementById('homeBtn'),
            
            // Address bar
            addressInput: document.getElementById('addressInput'),
            securityIndicator: document.getElementById('securityIndicator'),
            bookmarkBtn: document.getElementById('bookmarkBtn'),
            
            // Browser actions
            settingsBtn: document.getElementById('settingsBtn'),
            menuBtn: document.getElementById('menuBtn'),
            
            // Tab strip
            tabStrip: document.getElementById('tabStrip'),
            newTabBtn: document.getElementById('newTabBtn'),
            
            // Content area
            webViewContainer: document.querySelector('.web-view-container'),
            loadingIndicator: document.getElementById('loadingIndicator'),
            
            // Status bar
            pageStatus: document.getElementById('pageStatus'),
            zoomLevel: document.getElementById('zoomLevel'),
            
            // Settings panel
            settingsPanel: document.getElementById('settingsPanel'),
            closeSettings: document.getElementById('closeSettings'),
            overlay: document.getElementById('overlay'),
            
            // Start page
            quickSearchInput: document.getElementById('quickSearchInput'),
            quickSearchBtn: document.getElementById('quickSearchBtn')
        };
    }

    bindEvents() {
        // Title bar controls
        if (window.electronAPI) {
            this.elements.minimizeBtn.addEventListener('click', () => {
                window.electronAPI.minimizeWindow();
            });

            this.elements.maximizeBtn.addEventListener('click', () => {
                window.electronAPI.maximizeWindow();
            });

            this.elements.closeBtn.addEventListener('click', () => {
                window.electronAPI.closeWindow();
            });

            // Listen for menu shortcuts
            window.electronAPI.onNewTab(() => this.createNewTab());
            window.electronAPI.onCloseTab(() => this.closeCurrentTab());
            window.electronAPI.onReloadPage(() => this.reloadCurrentTab());
            window.electronAPI.onForceReloadPage(() => this.reloadCurrentTab(true));
            window.electronAPI.onGoBack(() => this.goBack());
            window.electronAPI.onGoForward(() => this.goForward());
            window.electronAPI.onGoHome(() => this.goHome());
        }

        // Navigation controls
        this.elements.backBtn.addEventListener('click', () => this.goBack());
        this.elements.forwardBtn.addEventListener('click', () => this.goForward());
        this.elements.refreshBtn.addEventListener('click', () => this.reloadCurrentTab());
        this.elements.homeBtn.addEventListener('click', () => this.goHome());

        // Address bar
        this.elements.addressInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.navigateToUrl(e.target.value);
            }
        });

        this.elements.addressInput.addEventListener('focus', () => {
            this.elements.addressInput.select();
        });

        // Browser actions
        this.elements.settingsBtn.addEventListener('click', () => this.toggleSettings());
        this.elements.menuBtn.addEventListener('click', (e) => this.showContextMenu(e));

        // Tab management
        this.elements.newTabBtn.addEventListener('click', () => this.createNewTab());

        // Settings panel
        this.elements.closeSettings.addEventListener('click', () => this.closeSettings());
        this.elements.overlay.addEventListener('click', () => this.closeSettings());

        // Start page quick search
        if (this.elements.quickSearchInput) {
            this.elements.quickSearchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.performQuickSearch(e.target.value);
                }
            });
        }

        if (this.elements.quickSearchBtn) {
            this.elements.quickSearchBtn.addEventListener('click', () => {
                this.performQuickSearch(this.elements.quickSearchInput.value);
            });
        }

        // Quick links
        document.addEventListener('click', (e) => {
            if (e.target.closest('.quick-link')) {
                e.preventDefault();
                const url = e.target.closest('.quick-link').dataset.url;
                this.navigateToUrl(url);
            }
        });

        // Tab strip delegation
        this.elements.tabStrip.addEventListener('click', (e) => {
            if (e.target.closest('.tab')) {
                const tab = e.target.closest('.tab');
                const tabId = tab.dataset.tabId;
                
                if (e.target.closest('.tab-close')) {
                    this.closeTab(tabId);
                } else {
                    this.switchToTab(tabId);
                }
            }
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 't':
                        e.preventDefault();
                        this.createNewTab();
                        break;
                    case 'w':
                        e.preventDefault();
                        if (e.shiftKey) {
                            window.electronAPI?.closeWindow();
                        } else {
                            this.closeCurrentTab();
                        }
                        break;
                    case 'r':
                        e.preventDefault();
                        this.reloadCurrentTab(e.shiftKey);
                        break;
                    case 'l':
                        e.preventDefault();
                        this.elements.addressInput.focus();
                        break;
                    case '1':
                    case '2':
                    case '3':
                    case '4':
                    case '5':
                    case '6':
                    case '7':
                    case '8':
                    case '9':
                        e.preventDefault();
                        this.switchToTabByIndex(parseInt(e.key) - 1);
                        break;
                }
            }

            if (e.altKey) {
                switch (e.key) {
                    case 'ArrowLeft':
                        e.preventDefault();
                        this.goBack();
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        this.goForward();
                        break;
                    case 'Home':
                        e.preventDefault();
                        this.goHome();
                        break;
                }
            }
        });
    }

    // Tab Management
    createTab(id, title, url, isActive = false) {
        const tab = {
            id,
            title,
            url,
            isLoading: false,
            canGoBack: false,
            canGoForward: false,
            favicon: null
        };

        this.tabs.set(id, tab);
        this.renderTab(tab);
        this.createWebView(id, url);

        if (isActive) {
            this.switchToTab(id);
        }

        return tab;
    }

    createNewTab() {
        this.tabCounter++;
        const newTabId = this.tabCounter.toString();
        this.createTab(newTabId, 'New Tab', 'zenith://start', true);
        this.updateTabsUI();
    }

    closeTab(tabId) {
        if (this.tabs.size <= 1) {
            // Don't close the last tab, navigate to start page instead
            this.navigateToUrl('zenith://start');
            return;
        }

        const tab = this.tabs.get(tabId);
        if (!tab) return;

        // Remove tab from DOM
        const tabElement = document.querySelector(`[data-tab-id="${tabId}"]`);
        const webViewElement = document.querySelector(`#webview-${tabId}`);
        
        if (tabElement) tabElement.remove();
        if (webViewElement) webViewElement.remove();

        // Remove from tabs map
        this.tabs.delete(tabId);

        // If this was the active tab, switch to another
        if (this.activeTabId === tabId) {
            const remainingTabs = Array.from(this.tabs.keys());
            if (remainingTabs.length > 0) {
                this.switchToTab(remainingTabs[0]);
            }
        }

        this.updateTabsUI();
    }

    closeCurrentTab() {
        this.closeTab(this.activeTabId);
    }

    switchToTab(tabId) {
        const tab = this.tabs.get(tabId);
        if (!tab) return;

        // Update active tab
        this.activeTabId = tabId;

        // Update tab UI
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`[data-tab-id="${tabId}"]`)?.classList.add('active');

        // Update web view
        document.querySelectorAll('.web-view').forEach(w => w.classList.remove('active'));
        document.querySelector(`#webview-${tabId}`)?.classList.add('active');

        // Update address bar
        this.elements.addressInput.value = tab.url === 'zenith://start' ? '' : tab.url;

        // Update navigation buttons
        this.updateNavigationState();
    }

    switchToTabByIndex(index) {
        const tabIds = Array.from(this.tabs.keys());
        if (index >= 0 && index < tabIds.length) {
            this.switchToTab(tabIds[index]);
        }
    }

    renderTab(tab) {
        const tabElement = document.createElement('div');
        tabElement.className = 'tab';
        tabElement.dataset.tabId = tab.id;
        
        tabElement.innerHTML = `
            <div class="tab-favicon">
                <svg width="12" height="12" viewBox="0 0 12 12">
                    <circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" stroke-width="1"/>
                </svg>
            </div>
            <span class="tab-title">${tab.title}</span>
            <button class="tab-close" data-tab-id="${tab.id}">
                <svg width="8" height="8" viewBox="0 0 8 8">
                    <path d="M1 1l6 6M7 1l-6 6" stroke="currentColor" stroke-width="1"/>
                </svg>
            </button>
        `;

        // Insert before the new tab button
        this.elements.tabStrip.insertBefore(tabElement, this.elements.newTabBtn);
    }

    createWebView(tabId, url) {
        const webView = document.createElement('div');
        webView.className = 'web-view';
        webView.id = `webview-${tabId}`;
        webView.dataset.tabId = tabId;

        if (url === 'zenith://start') {
            // Load start page content (already in HTML)
            webView.innerHTML = document.querySelector('.start-page').outerHTML;
        } else {
            // For actual web pages, we'll use an iframe (simplified for now)
            webView.innerHTML = `
                <iframe src="${url}" style="width: 100%; height: 100%; border: none;"></iframe>
            `;
        }

        this.elements.webViewContainer.appendChild(webView);
    }

    updateTabsUI() {
        // Update tab titles and states
        this.tabs.forEach(tab => {
            const tabElement = document.querySelector(`[data-tab-id="${tab.id}"]`);
            if (tabElement) {
                const titleElement = tabElement.querySelector('.tab-title');
                if (titleElement) {
                    titleElement.textContent = tab.title;
                }
            }
        });
    }

    // Navigation
    navigateToUrl(url) {
        if (!url.trim()) return;

        const activeTab = this.tabs.get(this.activeTabId);
        if (!activeTab) return;

        // Process URL
        const processedUrl = this.processUrl(url);
        
        // Update tab
        activeTab.url = processedUrl;
        activeTab.title = 'Loading...';
        activeTab.isLoading = true;

        // Update UI
        this.elements.addressInput.value = processedUrl;
        this.showLoadingIndicator();
        
        // Navigate (simplified - just reload the webview)
        this.loadUrlInWebView(this.activeTabId, processedUrl);
        
        // Update tab title
        this.updateTabTitle(this.activeTabId, this.getPageTitle(processedUrl));
        
        setTimeout(() => {
            this.hideLoadingIndicator();
            activeTab.isLoading = false;
        }, 1000);
    }

    processUrl(input) {
        input = input.trim();
        
        // If it's a search query (doesn't contain dots or protocols)
        if (!input.includes('.') && !input.includes('://')) {
            return `https://www.google.com/search?q=${encodeURIComponent(input)}`;
        }
        
        // If it doesn't start with protocol, add https
        if (!input.startsWith('http://') && !input.startsWith('https://')) {
            return `https://${input}`;
        }
        
        return input;
    }

    loadUrlInWebView(tabId, url) {
        const webView = document.querySelector(`#webview-${tabId}`);
        if (!webView) return;

        if (url === 'zenith://start') {
            webView.innerHTML = document.querySelector('.start-page').outerHTML;
        } else {
            webView.innerHTML = `
                <iframe src="${url}" style="width: 100%; height: 100%; border: none;"></iframe>
            `;
        }
    }

    getPageTitle(url) {
        if (url === 'zenith://start') return 'New Tab';
        
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch {
            return 'Page';
        }
    }

    updateTabTitle(tabId, title) {
        const tab = this.tabs.get(tabId);
        if (tab) {
            tab.title = title;
            this.updateTabsUI();
        }
    }

    goBack() {
        // Simplified navigation - in a real browser this would use history
        console.log('Going back');
    }

    goForward() {
        // Simplified navigation - in a real browser this would use history
        console.log('Going forward');
    }

    goHome() {
        const homePage = this.settings.homepage || 'zenith://start';
        this.navigateToUrl(homePage);
    }

    reloadCurrentTab(forceReload = false) {
        const activeTab = this.tabs.get(this.activeTabId);
        if (activeTab) {
            this.navigateToUrl(activeTab.url);
        }
    }

    updateNavigationState() {
        const activeTab = this.tabs.get(this.activeTabId);
        if (activeTab) {
            this.elements.backBtn.disabled = !activeTab.canGoBack;
            this.elements.forwardBtn.disabled = !activeTab.canGoForward;
        }
    }

    // UI Helper Methods
    showLoadingIndicator() {
        this.elements.loadingIndicator.classList.add('visible');
    }

    hideLoadingIndicator() {
        this.elements.loadingIndicator.classList.remove('visible');
    }

    updatePageStatus(status) {
        this.elements.pageStatus.textContent = status;
    }

    performQuickSearch(query) {
        if (query.trim()) {
            this.navigateToUrl(query);
        }
    }

    // Settings
    toggleSettings() {
        this.elements.settingsPanel.classList.toggle('open');
        this.elements.overlay.classList.toggle('visible');
    }

    closeSettings() {
        this.elements.settingsPanel.classList.remove('open');
        this.elements.overlay.classList.remove('visible');
    }

    loadSettings() {
        const defaultSettings = {
            theme: 'auto',
            homepage: 'zenith://start',
            blockTrackers: true,
            httpsOnly: true
        };

        try {
            const saved = localStorage.getItem('zenith-settings');
            return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
        } catch {
            return defaultSettings;
        }
    }

    saveSettings() {
        localStorage.setItem('zenith-settings', JSON.stringify(this.settings));
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.settings.theme);
    }

    showContextMenu(event) {
        // Simplified context menu - could be expanded
        console.log('Showing context menu', event);
    }

    // Utility methods
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => notification.classList.add('visible'), 100);
        
        // Hide and remove notification
        setTimeout(() => {
            notification.classList.remove('visible');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize the browser when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.zenithBrowser = new ZenithBrowser();
});