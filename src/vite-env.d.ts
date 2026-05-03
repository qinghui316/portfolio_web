/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HERO_LOOK_SCRUB_2K_URL?: string;
  readonly VITE_HERO_LOOK_SCRUB_1080_URL?: string;
  readonly VITE_HERO_POSTER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
