// --- Tauri invoke ---
declare module '@tauri-apps/api/tauri' {
  export function invoke<T>(command: string, args?: Record<string, unknown>): Promise<T>;
}

// --- Tauri runtime (window.__TAURI__) ---
interface TauriEvent {
  event: string;
  payload: unknown;
  windowLabel: string;
  id: number;
}

interface TauriWindow {
  __TAURI_METADATA__: {
    __windows: Array<{
      label: string;
    }>;
  };
  emit: (event: string, payload?: unknown) => Promise<void>;
  listen: (event: string, handler: (event: TauriEvent) => void) => Promise<() => void>;
}

interface TauriPlugin {
  [key: string]: unknown;
}

interface Tauri {
  event: {
    listen: (event: string, handler: (event: TauriEvent) => void) => Promise<() => void>;
    emit: (event: string, payload?: unknown) => Promise<void>;
  };
  window: TauriWindow;
  plugin: Record<string, TauriPlugin>;
  version?: string;
  isWebview: boolean;
}

declare global {
  interface Window {
    __TAURI__?: Tauri;
  }
}

export {};