/**
 * API base URL - supports runtime config for deployment without rebuild.
 * 1. Runtime: /config.json (written from VITE_API_URL env var at container start)
 * 2. Build-time: import.meta.env.VITE_API_URL
 * 3. Fallback: http://localhost:5500
 */
let cachedApiBase = null;
let configPromise = null;
let configError = null;

export function getApiBaseUrl() {
  if (cachedApiBase) return cachedApiBase;
  return import.meta.env.VITE_API_URL || 'https://adventurous-victory-production.up.railway.app';
}

export function getConfigError() {
  return configError;
}

/**
 * Load config from /config.json and cache. Call early (e.g. in main.jsx).
 * Resolves to the API URL to use.
 * IMPORTANT: VITE_API_URL must be your BACKEND URL, not the client URL.
 */
export async function loadApiConfig() {
  if (cachedApiBase) return cachedApiBase;
  if (configPromise) return configPromise;

  configPromise = (async () => {
    try {
      const res = await fetch('/config.json?t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
          configError = 'config.json returned non-JSON (wrong VITE_API_URL or routing?)';
          throw new Error(configError);
        }
        const data = await res.json();
        const url = (data?.VITE_API_URL ?? '').toString().trim();
        if (url) {
          const origin = typeof window !== 'undefined' ? window.location.origin : '';
          if (origin && (url === origin || url.startsWith(origin + '/'))) {
            configError = `VITE_API_URL must be your BACKEND URL, not the client (${origin})`;
            throw new Error(configError);
          }
          cachedApiBase = url.replace(/\/$/, '');
          return cachedApiBase;
        }
      }
      configError = 'VITE_API_URL is empty. Set it in Railway client service env vars.';
    } catch (e) {
      if (!configError) configError = e?.message || 'Failed to load config';
    }
    cachedApiBase = import.meta.env.VITE_API_URL || 'http://localhost:5500';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    if (origin && (cachedApiBase === origin || !cachedApiBase || cachedApiBase === 'http://localhost:5500') && origin.includes('railway')) {
      configError = configError || 'Set VITE_API_URL to your BACKEND Railway URL in client service env vars.';
    }
    return cachedApiBase;
  })();

  return configPromise;
}

export function setApiBaseUrl(url) {
  cachedApiBase = url ? url.replace(/\/$/, '') : null;
}
