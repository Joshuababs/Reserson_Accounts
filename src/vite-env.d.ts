/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** The platform identity provider this app talks to. */
  readonly VITE_IDENTITY_URL?: string;
  /** Comma-separated hosts a `?next=` redirect may return to. */
  readonly VITE_ALLOWED_RETURN_HOSTS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
