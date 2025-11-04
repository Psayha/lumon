// Минимальные типы Telegram WebApp с progressive enhancement
export type TelegramWebApp = {
  ready: () => void;
  close: () => void;
  BackButton: { show: () => void; hide: () => void; onClick: (cb: () => void) => void };
  MainButton?: { show: () => void; hide: () => void; setText: (t: string) => void; onClick: (cb: () => void) => void; showProgress?: () => void; hideProgress?: () => void };
  BottomButton?: { show: () => void; hide: () => void; setText: (t: string) => void; onClick: (cb: () => void) => void };
  SecondaryButton?: { show: () => void; hide: () => void };
  SettingsButton?: { show: () => void; hide: () => void };
  HapticFeedback?: { impactOccurred: (s: 'light' | 'medium' | 'heavy') => void };
  requestFullscreen?: () => void;
  exitFullscreen?: () => void;
  isFullscreen?: boolean;
  addToHomeScreen?: () => Promise<void> | void;
  shareMessage?: (payload: any) => Promise<void> | void;
  downloadFile?: (payload: any) => Promise<void> | void;
  readTextFromClipboard?: () => Promise<string>;
  showScanQrPopup?: (payload?: any) => void;
  closeScanQrPopup?: () => void;
  requestWriteAccess?: () => Promise<any> | void;
  requestContact?: () => Promise<any> | void;
  hideKeyboard?: () => void;
  enableVerticalSwipes?: () => void;
  disableVerticalSwipes?: () => void;
  LocationManager?: { requestLocation?: () => Promise<any> | void };
  CloudStorage?: { setItem?: (k: string, v: string) => Promise<void> | void };
  DeviceStorage?: { setItem?: (k: string, v: string) => Promise<void> | void };
  SecureStorage?: { setItem?: (k: string, v: string) => Promise<void> | void };
  onEvent?: (event: string, handler: (payload?: any) => void) => void;
  initData?: string;
  initDataUnsafe?: { user?: any; theme_params?: Record<string, any> };
  colorScheme?: 'light' | 'dark';
};

declare global {
  interface Window { Telegram?: { WebApp?: TelegramWebApp } }
}

export {};


