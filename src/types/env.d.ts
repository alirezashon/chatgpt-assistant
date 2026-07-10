/// <reference types="vite/client" />

declare const __APP_NAME__: string;
declare const __APP_VERSION__: string;
declare const __WORKSPACE_API_BASE_URL__: string;

interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string;
  readonly VITE_APP_VERSION?: string;
  readonly VITE_WORKSPACE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
