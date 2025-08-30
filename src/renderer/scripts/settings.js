// Settings Management
class SettingsManager {
    constructor(browser) {
        this.browser = browser;
        this.defaultSettings = {
            // Appearance
            theme: 'auto', // 'light', 'dark', 'auto'
            fontSize: 14,
            fontFamily: 'system',
            
            // Privacy & Security
            blockTrackers: true,
            blockAds: false,
            httpsOnly: true,
            doNotTrack: true,
            clearDataOnExit: false,
            
            // Browsing
            homepage: 'zenith://start',
            searchEngine: 'google',
            openLinksInNewTab: false,
            showBookmarksBar: true,
            
            // Advanced
            enableJavaScript: true,
            enableImages: true,
            enablePlugins: false,
            enableNotifications: true,
            
            // Downloads
            downloadPath: '',
            askWhereToSave: true,
            
            // Tabs
            maxTabs: 20,
            tabBehavior: 'new-tab', // 'new-tab', 'replace'
            closeLastTab: 'show-start-page', // 'show-start-page', 'close-browser'
            
            // Startup
            startupBehavior: 'start-page', // 'start-page', 'last-session', 'custom'
            customStartupUrls: []
        };
        
        this.settings = this.loadSettings();
        this.init();
    }

    init() {
        this.bindSettingsEvents();
        this.populateSettingsPanel();
        this.applySettings();
    }

    bindSettingsEvents() {
        const settingsPanel = document.getElementById('settingsPanel');
        if (!settingsPanel) return;

        // Theme selection
        settingsPanel.addEventListener('change', (e) => {
            if (e.target.name === 'theme') {
                this.updateSetting('theme', e.target.value);
                this.applyTheme();
            }
        });

        // Checkbox settings
        settingsPanel.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
                this.updateSetting(e.target.id, e.target.checked);
            }
        });

        // Text input settings
        settingsPanel.addEventListener('input', (e) => {
            if (e.target.type === 'text' || e.target.type === 'number') {
                this.updateSetting(e.target.id, e.target.value);
            }
        });

        // Select settings
        settingsPanel.addEventListener('change', (e) => {
            if (e.target.tagName === 'SELECT') {
                this.updateSetting(e.target.id, e.target.value);
            }
        });

        // Reset settings button
        const resetBtn = settingsPanel.querySelector('#resetSettings');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetSettings());
        }

        // Export/Import settings
        const exportBtn = settingsPanel.querySelector('#exportSettings');
        const importBtn = settingsPanel.querySelector('#importSettings');
        
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportSettings());
        }
        
        if (importBtn) {
            importBtn.addEventListener('click', () => this.importSettings());
        }
    }

    populateSettingsPanel() {
        // Update the settings panel HTML to reflect current settings
        const settingsPanel = document.getElementById('settingsPanel');
        if (!settingsPanel) return;

        // Theme settings
        const themeRadios = settingsPanel.querySelectorAll('input[name="theme"]');
        themeRadios.forEach(radio => {
            radio.checked = radio.value === this.settings.theme;
        });

        // Checkbox settings
        Object.keys(this.defaultSettings).forEach(key => {
            const element = settingsPanel.querySelector(`#${key}`);
            if (element && element.type === 'checkbox') {
                element.checked = this.settings[key];
            } else if (element && (element.type === 'text' || element.type === 'number')) {
                element.value = this.settings[key];
            } else if (element && element.tagName === 'SELECT') {
                element.value = this.settings[key];
            }
        });
    }

    createAdvancedSettingsPanel() {
        const advancedSettings = `
            <div class="settings-panel-content">
                <div class="setting-group">
                    <h3>Appearance</h3>
                    <label>
                        <span>Theme</span>
                        <select id="theme">
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                            <option value="auto">Auto (System)</option>
                        </select>
                    </label>
                    <label>
                        <span>Font Size</span>
                        <input type="number" id="fontSize" min="12" max="20" value="${this.settings.fontSize}">
                    </label>
                    <label>
                        <span>Font Family</span>
                        <select id="fontFamily">
                            <option value="system">System Default</option>
                            <option value="serif">Serif</option>
                            <option value="sans-serif">Sans-serif</option>
                            <option value="monospace">Monospace</option>
                        </select>
                    </label>
                </div>

                <div class="setting-group">
                    <h3>Privacy & Security</h3>
                    <label>
                        <input type="checkbox" id="blockTrackers" ${this.settings.blockTrackers ? 'checked' : ''}>
                        Block tracking scripts
                    </label>
                    <label>
                        <input type="checkbox" id="blockAds" ${this.settings.blockAds ? 'checked' : ''}>
                        Block advertisements
                    </label>
                    <label>
                        <input type="checkbox" id="httpsOnly" ${this.settings.httpsOnly ? 'checked' : ''}>
                        Use HTTPS when available
                    </label>
                    <label>
                        <input type="checkbox" id="doNotTrack" ${this.settings.doNotTrack ? 'checked' : ''}>
                        Send "Do Not Track" request
                    </label>
                    <label>
                        <input type="checkbox" id="clearDataOnExit" ${this.settings.clearDataOnExit ? 'checked' : ''}>
                        Clear browsing data on exit
                    </label>
                </div>

                <div class="setting-group">
                    <h3>Browsing</h3>
                    <label>
                        <span>Homepage</span>
                        <input type="text" id="homepage" placeholder="Homepage URL" value="${this.settings.homepage}">
                    </label>
                    <label>
                        <span>Search Engine</span>
                        <select id="searchEngine">
                            <option value="google">Google</option>
                            <option value="bing">Bing</option>
                            <option value="duckduckgo">DuckDuckGo</option>
                            <option value="startpage">Startpage</option>
                        </select>
                    </label>
                    <label>
                        <input type="checkbox" id="openLinksInNewTab" ${this.settings.openLinksInNewTab ? 'checked' : ''}>
                        Open links in new tab
                    </label>
                    <label>
                        <input type="checkbox" id="showBookmarksBar" ${this.settings.showBookmarksBar ? 'checked' : ''}>
                        Show bookmarks bar
                    </label>
                </div>

                <div class="setting-group">
                    <h3>Advanced</h3>
                    <label>
                        <input type="checkbox" id="enableJavaScript" ${this.settings.enableJavaScript ? 'checked' : ''}>
                        Enable JavaScript
                    </label>
                    <label>
                        <input type="checkbox" id="enableImages" ${this.settings.enableImages ? 'checked' : ''}>
                        Load images
                    </label>
                    <label>
                        <input type="checkbox" id="enableNotifications" ${this.settings.enableNotifications ? 'checked' : ''}>
                        Allow notifications
                    </label>
                </div>

                <div class="setting-group">
                    <h3>Tabs</h3>
                    <label>
                        <span>Maximum tabs</span>
                        <input type="number" id="maxTabs" min="5" max="50" value="${this.settings.maxTabs}">
                    </label>
                    <label>
                        <span>Tab behavior</span>
                        <select id="tabBehavior">
                            <option value="new-tab">Open in new tab</option>
                            <option value="replace">Replace current tab</option>
                        </select>
                    </label>
                    <label>
                        <span>When closing last tab</span>
                        <select id="closeLastTab">
                            <option value="show-start-page">Show start page</option>
                            <option value="close-browser">Close browser</option>
                        </select>
                    </label>
                </div>

                <div class="setting-group">
                    <h3>Startup</h3>
                    <label>
                        <span>On startup</span>
                        <select id="startupBehavior">
                            <option value="start-page">Open start page</option>
                            <option value="last-session">Restore last session</option>
                            <option value="custom">Open custom URLs</option>
                        </select>
                    </label>
                    <label>
                        <span>Custom startup URLs (one per line)</span>
                        <textarea id="customStartupUrls" rows="4" placeholder="https://example.com">${this.settings.customStartupUrls.join('\\n')}</textarea>
                    </label>
                </div>

                <div class="setting-group">
                    <h3>Data Management</h3>
                    <button id="clearBrowsingData" class="setting-button">Clear Browsing Data</button>
                    <button id="exportSettings" class="setting-button">Export Settings</button>
                    <button id="importSettings" class="setting-button">Import Settings</button>
                    <button id="resetSettings" class="setting-button danger">Reset to Defaults</button>
                </div>
            </div>
        `;

        return advancedSettings;
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('zenith-settings');
            return saved ? { ...this.defaultSettings, ...JSON.parse(saved) } : { ...this.defaultSettings };
        } catch (error) {
            console.error('Error loading settings:', error);
            return { ...this.defaultSettings };
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('zenith-settings', JSON.stringify(this.settings));
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    }

    updateSetting(key, value) {
        if (key in this.defaultSettings) {
            this.settings[key] = value;
            this.saveSettings();
            this.applySettingChange(key, value);
        }
    }

    applySettingChange(key, value) {
        switch (key) {
            case 'theme':
                this.applyTheme();
                break;
            case 'fontSize':
                this.applyFontSize();
                break;
            case 'fontFamily':
                this.applyFontFamily();
                break;
            case 'maxTabs':
                if (this.browser.tabManager) {
                    this.browser.tabManager.setTabLimit(parseInt(value));
                }
                break;
            case 'homepage':
                // Update home button behavior
                break;
            case 'searchEngine':
                this.updateSearchEngine();
                break;
        }
    }

    applySettings() {
        this.applyTheme();
        this.applyFontSize();
        this.applyFontFamily();
        this.updateSearchEngine();
    }

    applyTheme() {
        const theme = this.settings.theme;
        
        if (theme === 'auto') {
            // Remove manual theme classes and let CSS handle system preference
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }
    }

    applyFontSize() {
        document.documentElement.style.setProperty('--base-font-size', `${this.settings.fontSize}px`);
    }

    applyFontFamily() {
        const fontFamilies = {
            'system': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            'serif': 'Georgia, "Times New Roman", Times, serif',
            'sans-serif': 'Arial, Helvetica, sans-serif',
            'monospace': '"Courier New", Courier, monospace'
        };
        
        const fontFamily = fontFamilies[this.settings.fontFamily] || fontFamilies.system;
        document.documentElement.style.setProperty('--base-font-family', fontFamily);
    }

    updateSearchEngine() {
        const searchEngines = {
            'google': 'https://www.google.com/search?q=',
            'bing': 'https://www.bing.com/search?q=',
            'duckduckgo': 'https://duckduckgo.com/?q=',
            'startpage': 'https://www.startpage.com/sp/search?query='
        };
        
        this.searchEngineUrl = searchEngines[this.settings.searchEngine] || searchEngines.google;
    }

    getSearchUrl(query) {
        return this.searchEngineUrl + encodeURIComponent(query);
    }

    // Data Management
    clearBrowsingData(options = {}) {
        const defaultOptions = {
            history: true,
            cache: true,
            cookies: true,
            localStorage: false,
            sessionStorage: false
        };
        
        const clearOptions = { ...defaultOptions, ...options };
        
        if (clearOptions.history) {
            // Clear navigation history
            if (this.browser.navigationManager) {
                this.browser.navigationManager.clearBrowsingData({ history: true });
            }
        }
        
        if (clearOptions.localStorage) {
            localStorage.removeItem('zenith-bookmarks');
        }
        
        if (clearOptions.sessionStorage) {
            sessionStorage.clear();
        }
        
        this.browser.showNotification('Browsing data cleared', 'success');
    }

    exportSettings() {
        const exportData = {
            settings: this.settings,
            bookmarks: JSON.parse(localStorage.getItem('zenith-bookmarks') || '[]'),
            timestamp: Date.now(),
            version: '1.0.0'
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `zenith-browser-settings-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.browser.showNotification('Settings exported', 'success');
    }

    async importSettings() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const importData = JSON.parse(text);
                
                if (importData.settings) {
                    this.settings = { ...this.defaultSettings, ...importData.settings };
                    this.saveSettings();
                    this.populateSettingsPanel();
                    this.applySettings();
                }
                
                if (importData.bookmarks) {
                    localStorage.setItem('zenith-bookmarks', JSON.stringify(importData.bookmarks));
                }
                
                this.browser.showNotification('Settings imported successfully', 'success');
            } catch (error) {
                this.browser.showNotification('Error importing settings', 'error');
                console.error('Import error:', error);
            }
        };
        
        input.click();
    }

    resetSettings() {
        if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
            this.settings = { ...this.defaultSettings };
            this.saveSettings();
            this.populateSettingsPanel();
            this.applySettings();
            this.browser.showNotification('Settings reset to defaults', 'success');
        }
    }

    // Keyboard Shortcuts Management
    getKeyboardShortcuts() {
        return {
            'Ctrl+T': 'New Tab',
            'Ctrl+W': 'Close Tab',
            'Ctrl+Shift+W': 'Close Window',
            'Ctrl+R': 'Reload',
            'Ctrl+Shift+R': 'Force Reload',
            'Ctrl+L': 'Focus Address Bar',
            'Ctrl+D': 'Bookmark Page',
            'Ctrl+Shift+Delete': 'Clear Browsing Data',
            'Ctrl+Tab': 'Next Tab',
            'Ctrl+Shift+Tab': 'Previous Tab',
            'Ctrl+1-9': 'Switch to Tab',
            'Alt+Left': 'Back',
            'Alt+Right': 'Forward',
            'Alt+Home': 'Home',
            'F5': 'Reload',
            'F11': 'Fullscreen',
            'F12': 'Developer Tools'
        };
    }

    // Privacy Features
    getPrivacySettings() {
        return {
            blockTrackers: this.settings.blockTrackers,
            blockAds: this.settings.blockAds,
            httpsOnly: this.settings.httpsOnly,
            doNotTrack: this.settings.doNotTrack,
            clearDataOnExit: this.settings.clearDataOnExit
        };
    }

    updatePrivacySetting(setting, value) {
        this.updateSetting(setting, value);
    }
}

// Export for use in main browser
window.SettingsManager = SettingsManager;