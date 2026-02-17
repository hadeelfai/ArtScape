/**
 * API base URL - supports runtime config for deployment without rebuild.
 * 1. Runtime: /config.json (set VITE_API_URL there for production)
 * 2. Build-time: import.meta.env.VITE_API_URL
 * 3. Fallback: http://localhost:5500
 */
let cachedApiBase = null;
let configPromise = null;

export function getApiBaseUrl() {
  if (cachedApiBase) return cachedApiBase;
  return import.meta.env.VITE_API_URL || 'http://localhost:5500';
}

/**
 * Load config from /config.json and cache. Call early (e.g. in main.jsx).
 * Resolves to the API URL to use.
 */
export async function loadApiConfig() {
  if (cachedApiBase) return cachedApiBase;
  if (configPromise) return configPromise;

  configPromise = (async () => {
    try {
      const res = await fetch('/config.json', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const url = data?.VITE_API_URL?.trim();
        if (url) {
          cachedApiBase = url.replace(/\/$/, '');
          return cachedApiBase;
        }
      }
    } catch {
      /* ignore */
    }
    cachedApiBase = import.meta.env.VITE_API_URL || 'http://localhost:5500';
    return cachedApiBase;
  })();

  return configPromise;
}

export function setApiBaseUrl(url) {
  cachedApiBase = url ? url.replace(/\/$/, '') : null;
}
