export interface Tab {
  id: number;
  title: string;
  url: string;
  isActive: boolean;
  isLoading: boolean;
  favicon: string | null;
}

export interface Settings {
  theme: 'light' | 'dark' | 'auto';
  blockTrackers: boolean;
  httpsOnly: boolean;
  homepageUrl: string;
}

export interface QuickLink {
  title: string;
  url: string;
  icon: string;
}
