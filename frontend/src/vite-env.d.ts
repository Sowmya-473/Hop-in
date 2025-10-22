/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE: string;
  readonly VITE_GOOGLE_MAPS_KEY?: string;
  // add more custom env vars here...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
