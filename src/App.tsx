import { useState, useEffect } from 'react';
import TitleBar from './components/TitleBar';
import NavigationBar from './components/NavigationBar';
import TabStrip from './components/TabStrip';
import ContentArea from './components/ContentArea';
import StatusBar from './components/StatusBar';
import SettingsPanel from './components/SettingsPanel';
import { Tab, Settings } from './types';

function App() {
  const [tabs, setTabs] = useState<Tab[]>([
    {
      id: 1,
      title: 'New Tab',
      url: 'zenith://start',
      isActive: true,
      isLoading: false,
      favicon: null,
    },
  ]);
  const [settings, setSettings] = useState<Settings>({
    theme: 'light',
    blockTrackers: true,
    httpsOnly: true,
    homepageUrl: 'zenith://start',
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator && import.meta.env.MODE === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }

    // Listen for settings open event
    const handleOpenSettings = () => {
      setIsSettingsOpen(true);
    };

    window.addEventListener('openSettings', handleOpenSettings);

    return () => {
      window.removeEventListener('openSettings', handleOpenSettings);
    };
  }, []);

  const addNewTab = () => {
    const newTab: Tab = {
      id: Date.now(),
      title: 'New Tab',
      url: 'zenith://start',
      isActive: false,
      isLoading: false,
      favicon: null,
    };

    setTabs((prev) => prev.map((tab) => ({ ...tab, isActive: false })));
    setTabs((prev) => [...prev, { ...newTab, isActive: true }]);
  };

  const closeTab = (tabId: number) => {
    if (tabs.length === 1) return;

    const closingTabIndex = tabs.findIndex((tab) => tab.id === tabId);
    const isActiveTab = tabs.find((tab) => tab.id === tabId)?.isActive;

    setTabs((prev) => {
      const newTabs = prev.filter((tab) => tab.id !== tabId);

      if (isActiveTab && newTabs.length > 0) {
        const nextActiveIndex = Math.min(closingTabIndex, newTabs.length - 1);
        newTabs[nextActiveIndex].isActive = true;
      }

      return newTabs;
    });
  };

  const switchTab = (tabId: number) => {
    setTabs((prev) =>
      prev.map((tab) => ({
        ...tab,
        isActive: tab.id === tabId,
      }))
    );
  };

  const updateTab = (tabId: number, updates: Partial<Tab>) => {
    setTabs((prev) =>
      prev.map((tab) => (tab.id === tabId ? { ...tab, ...updates } : tab))
    );
  };

  return (
    <div className="app" data-theme={settings.theme}>
      <TitleBar />
      <NavigationBar tabs={tabs} updateTab={updateTab} />
      <TabStrip
        tabs={tabs}
        onNewTab={addNewTab}
        onCloseTab={closeTab}
        onSwitchTab={switchTab}
      />
      <ContentArea tabs={tabs} />
      <StatusBar />
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSettingsChange={setSettings}
      />
    </div>
  );
}

export default App;
