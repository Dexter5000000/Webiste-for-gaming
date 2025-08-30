// Tab Management System
class TabManager {
    constructor(browser) {
        this.browser = browser;
        this.maxTabs = 20; // Maximum number of tabs
        this.tabContextMenu = null;
        this.draggedTab = null;
        this.init();
    }

    init() {
        this.setupTabEvents();
        this.setupTabDragAndDrop();
        this.setupTabContextMenu();
    }

    setupTabEvents() {
        // Middle click to close tab
        this.browser.elements.tabStrip.addEventListener('mousedown', (e) => {
            if (e.button === 1) { // Middle mouse button
                e.preventDefault();
                const tab = e.target.closest('.tab');
                if (tab) {
                    const tabId = tab.dataset.tabId;
                    this.browser.closeTab(tabId);
                }
            }
        });

        // Right click for context menu
        this.browser.elements.tabStrip.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const tab = e.target.closest('.tab');
            if (tab) {
                this.showTabContextMenu(e, tab.dataset.tabId);
            }
        });

        // Double click on tab strip to create new tab
        this.browser.elements.tabStrip.addEventListener('dblclick', (e) => {
            if (e.target === this.browser.elements.tabStrip) {
                this.browser.createNewTab();
            }
        });

        // Keyboard shortcuts for tab navigation
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'Tab':
                        e.preventDefault();
                        if (e.shiftKey) {
                            this.switchToPreviousTab();
                        } else {
                            this.switchToNextTab();
                        }
                        break;
                    case '0':
                        e.preventDefault();
                        this.switchToLastTab();
                        break;
                }
            }
        });
    }

    setupTabDragAndDrop() {
        this.browser.elements.tabStrip.addEventListener('dragstart', (e) => {
            const tab = e.target.closest('.tab');
            if (tab && !e.target.closest('.tab-close')) {
                this.draggedTab = tab;
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', tab.outerHTML);
                tab.classList.add('dragging');
            }
        });

        this.browser.elements.tabStrip.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            const tab = e.target.closest('.tab');
            if (tab && tab !== this.draggedTab) {
                this.showDropIndicator(tab, e.clientX);
            }
        });

        this.browser.elements.tabStrip.addEventListener('drop', (e) => {
            e.preventDefault();
            this.hideDropIndicator();
            
            const targetTab = e.target.closest('.tab');
            if (targetTab && this.draggedTab && targetTab !== this.draggedTab) {
                this.reorderTabs(this.draggedTab, targetTab, e.clientX);
            }
        });

        this.browser.elements.tabStrip.addEventListener('dragend', (e) => {
            if (this.draggedTab) {
                this.draggedTab.classList.remove('dragging');
                this.draggedTab = null;
            }
            this.hideDropIndicator();
        });
    }

    setupTabContextMenu() {
        // Create context menu if it doesn't exist
        if (!this.tabContextMenu) {
            this.createTabContextMenu();
        }
    }

    createTabContextMenu() {
        this.tabContextMenu = document.createElement('div');
        this.tabContextMenu.className = 'context-menu tab-context-menu';
        this.tabContextMenu.innerHTML = `
            <div class="context-menu-item" data-action="reload">
                <svg width="14" height="14" viewBox="0 0 14 14">
                    <path d="M12 6A5 5 0 1 1 2 6a5 5 0 0 1 10 0z" fill="none" stroke="currentColor" stroke-width="1"/>
                    <path d="M12 3v3h-3" fill="none" stroke="currentColor" stroke-width="1"/>
                </svg>
                Reload Tab
            </div>
            <div class="context-menu-item" data-action="duplicate">
                <svg width="14" height="14" viewBox="0 0 14 14">
                    <rect x="2" y="2" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1"/>
                    <rect x="4" y="4" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1"/>
                </svg>
                Duplicate Tab
            </div>
            <div class="context-menu-separator"></div>
            <div class="context-menu-item" data-action="pin">
                <svg width="14" height="14" viewBox="0 0 14 14">
                    <path d="M7 2l3 3-3 3M4 2l-3 3 3 3" fill="none" stroke="currentColor" stroke-width="1"/>
                </svg>
                Pin Tab
            </div>
            <div class="context-menu-item" data-action="mute">
                <svg width="14" height="14" viewBox="0 0 14 14">
                    <path d="M7 2v10l-3-3H1V5h3l3-3z" fill="currentColor"/>
                    <path d="M10 5l4 4M14 5l-4 4" stroke="currentColor" stroke-width="1"/>
                </svg>
                Mute Tab
            </div>
            <div class="context-menu-separator"></div>
            <div class="context-menu-item" data-action="close">
                <svg width="14" height="14" viewBox="0 0 14 14">
                    <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1"/>
                </svg>
                Close Tab
            </div>
            <div class="context-menu-item" data-action="close-others">
                <svg width="14" height="14" viewBox="0 0 14 14">
                    <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1"/>
                </svg>
                Close Other Tabs
            </div>
            <div class="context-menu-item" data-action="close-right">
                <svg width="14" height="14" viewBox="0 0 14 14">
                    <path d="M7 2v10M2 7h10" stroke="currentColor" stroke-width="1"/>
                </svg>
                Close Tabs to Right
            </div>
        `;

        document.body.appendChild(this.tabContextMenu);

        // Handle context menu clicks
        this.tabContextMenu.addEventListener('click', (e) => {
            const item = e.target.closest('.context-menu-item');
            if (item) {
                const action = item.dataset.action;
                const tabId = this.tabContextMenu.dataset.tabId;
                this.handleTabContextAction(action, tabId);
                this.hideTabContextMenu();
            }
        });

        // Hide context menu when clicking outside
        document.addEventListener('click', () => {
            this.hideTabContextMenu();
        });
    }

    showTabContextMenu(event, tabId) {
        this.tabContextMenu.dataset.tabId = tabId;
        const tab = this.browser.tabs.get(tabId);
        
        // Update context menu based on tab state
        this.updateContextMenuState(tab);
        
        // Position and show context menu
        this.tabContextMenu.style.left = `${event.clientX}px`;
        this.tabContextMenu.style.top = `${event.clientY}px`;
        this.tabContextMenu.classList.add('visible');
    }

    hideTabContextMenu() {
        this.tabContextMenu.classList.remove('visible');
    }

    updateContextMenuState(tab) {
        // Update menu items based on tab state
        const pinItem = this.tabContextMenu.querySelector('[data-action="pin"]');
        const muteItem = this.tabContextMenu.querySelector('[data-action="mute"]');
        
        if (tab.isPinned) {
            pinItem.innerHTML = pinItem.innerHTML.replace('Pin Tab', 'Unpin Tab');
        } else {
            pinItem.innerHTML = pinItem.innerHTML.replace('Unpin Tab', 'Pin Tab');
        }
        
        if (tab.isMuted) {
            muteItem.innerHTML = muteItem.innerHTML.replace('Mute Tab', 'Unmute Tab');
        } else {
            muteItem.innerHTML = muteItem.innerHTML.replace('Unmute Tab', 'Mute Tab');
        }
    }

    handleTabContextAction(action, tabId) {
        const tab = this.browser.tabs.get(tabId);
        if (!tab) return;

        switch (action) {
            case 'reload':
                this.reloadTab(tabId);
                break;
            case 'duplicate':
                this.duplicateTab(tabId);
                break;
            case 'pin':
                this.togglePinTab(tabId);
                break;
            case 'mute':
                this.toggleMuteTab(tabId);
                break;
            case 'close':
                this.browser.closeTab(tabId);
                break;
            case 'close-others':
                this.closeOtherTabs(tabId);
                break;
            case 'close-right':
                this.closeTabsToRight(tabId);
                break;
        }
    }

    // Tab Actions
    reloadTab(tabId) {
        const tab = this.browser.tabs.get(tabId);
        if (tab) {
            this.browser.loadUrlInWebView(tabId, tab.url);
        }
    }

    duplicateTab(tabId) {
        const tab = this.browser.tabs.get(tabId);
        if (tab && this.browser.tabs.size < this.maxTabs) {
            this.browser.createTab(
                (++this.browser.tabCounter).toString(),
                tab.title,
                tab.url,
                false
            );
        }
    }

    togglePinTab(tabId) {
        const tab = this.browser.tabs.get(tabId);
        if (tab) {
            tab.isPinned = !tab.isPinned;
            this.updateTabAppearance(tabId);
            this.sortTabs();
        }
    }

    toggleMuteTab(tabId) {
        const tab = this.browser.tabs.get(tabId);
        if (tab) {
            tab.isMuted = !tab.isMuted;
            this.updateTabAppearance(tabId);
        }
    }

    closeOtherTabs(keepTabId) {
        const tabsToClose = Array.from(this.browser.tabs.keys()).filter(id => id !== keepTabId);
        tabsToClose.forEach(tabId => this.browser.closeTab(tabId));
    }

    closeTabsToRight(fromTabId) {
        const tabElements = Array.from(this.browser.elements.tabStrip.querySelectorAll('.tab'));
        const fromIndex = tabElements.findIndex(el => el.dataset.tabId === fromTabId);
        
        if (fromIndex >= 0) {
            const tabsToClose = tabElements.slice(fromIndex + 1);
            tabsToClose.forEach(tabEl => this.browser.closeTab(tabEl.dataset.tabId));
        }
    }

    // Tab Navigation
    switchToNextTab() {
        const tabIds = Array.from(this.browser.tabs.keys());
        const currentIndex = tabIds.indexOf(this.browser.activeTabId);
        const nextIndex = (currentIndex + 1) % tabIds.length;
        this.browser.switchToTab(tabIds[nextIndex]);
    }

    switchToPreviousTab() {
        const tabIds = Array.from(this.browser.tabs.keys());
        const currentIndex = tabIds.indexOf(this.browser.activeTabId);
        const prevIndex = currentIndex === 0 ? tabIds.length - 1 : currentIndex - 1;
        this.browser.switchToTab(tabIds[prevIndex]);
    }

    switchToLastTab() {
        const tabIds = Array.from(this.browser.tabs.keys());
        if (tabIds.length > 0) {
            this.browser.switchToTab(tabIds[tabIds.length - 1]);
        }
    }

    // Tab Appearance and State
    updateTabAppearance(tabId) {
        const tabElement = document.querySelector(`[data-tab-id="${tabId}"]`);
        const tab = this.browser.tabs.get(tabId);
        
        if (tabElement && tab) {
            // Update pinned state
            tabElement.classList.toggle('pinned', tab.isPinned);
            
            // Update muted state
            tabElement.classList.toggle('muted', tab.isMuted);
            
            // Update loading state
            tabElement.classList.toggle('loading', tab.isLoading);
            
            // Update favicon if needed
            this.updateTabFavicon(tabId, tab.favicon);
        }
    }

    updateTabFavicon(tabId, faviconUrl) {
        const tabElement = document.querySelector(`[data-tab-id="${tabId}"]`);
        const faviconElement = tabElement?.querySelector('.tab-favicon');
        
        if (faviconElement) {
            if (faviconUrl) {
                faviconElement.innerHTML = `<img src="${faviconUrl}" width="12" height="12" alt="">`;
            } else {
                // Default icon
                faviconElement.innerHTML = `
                    <svg width="12" height="12" viewBox="0 0 12 12">
                        <circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" stroke-width="1"/>
                    </svg>
                `;
            }
        }
    }

    // Tab Ordering
    reorderTabs(draggedTab, targetTab, clientX) {
        const targetRect = targetTab.getBoundingClientRect();
        const insertBefore = clientX < targetRect.left + targetRect.width / 2;
        
        if (insertBefore) {
            targetTab.parentNode.insertBefore(draggedTab, targetTab);
        } else {
            targetTab.parentNode.insertBefore(draggedTab, targetTab.nextSibling);
        }
    }

    sortTabs() {
        // Sort tabs: pinned tabs first, then regular tabs
        const tabElements = Array.from(this.browser.elements.tabStrip.querySelectorAll('.tab'));
        const pinnedTabs = [];
        const regularTabs = [];
        
        tabElements.forEach(tabEl => {
            const tabId = tabEl.dataset.tabId;
            const tab = this.browser.tabs.get(tabId);
            
            if (tab?.isPinned) {
                pinnedTabs.push(tabEl);
            } else {
                regularTabs.push(tabEl);
            }
        });
        
        // Reorder DOM elements
        [...pinnedTabs, ...regularTabs].forEach(tabEl => {
            this.browser.elements.tabStrip.insertBefore(tabEl, this.browser.elements.newTabBtn);
        });
    }

    // Drop indicator for drag and drop
    showDropIndicator(targetTab, clientX) {
        this.hideDropIndicator();
        
        const indicator = document.createElement('div');
        indicator.className = 'tab-drop-indicator';
        indicator.style.position = 'absolute';
        indicator.style.width = '2px';
        indicator.style.height = '32px';
        indicator.style.background = 'var(--accent-primary)';
        indicator.style.zIndex = '1000';
        
        const targetRect = targetTab.getBoundingClientRect();
        const insertBefore = clientX < targetRect.left + targetRect.width / 2;
        
        if (insertBefore) {
            indicator.style.left = `${targetRect.left}px`;
        } else {
            indicator.style.left = `${targetRect.right}px`;
        }
        
        indicator.style.top = `${targetRect.top}px`;
        
        document.body.appendChild(indicator);
        this.dropIndicator = indicator;
    }

    hideDropIndicator() {
        if (this.dropIndicator) {
            this.dropIndicator.remove();
            this.dropIndicator = null;
        }
    }

    // Tab Limits and Management
    canCreateNewTab() {
        return this.browser.tabs.size < this.maxTabs;
    }

    getTabLimit() {
        return this.maxTabs;
    }

    setTabLimit(limit) {
        this.maxTabs = Math.max(1, Math.min(50, limit)); // Between 1 and 50
    }

    // Tab Statistics
    getTabCount() {
        return this.browser.tabs.size;
    }

    getPinnedTabCount() {
        return Array.from(this.browser.tabs.values()).filter(tab => tab.isPinned).length;
    }

    getLoadingTabCount() {
        return Array.from(this.browser.tabs.values()).filter(tab => tab.isLoading).length;
    }
}

// Export for use in main browser
window.TabManager = TabManager;