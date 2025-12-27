import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { Serwist } from 'serwist';

// This is injected by Serwist at build time
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Default caching rules from Serwist
    ...defaultCache,

    // Live2D Models - CacheFirst with long expiration
    {
      urlPattern: /\/models\/.*\.(moc3|json|png|motion3\.json)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'live2d-models',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },

    // Sound Files - CacheFirst
    {
      urlPattern: /\/sounds\/.*\.wav$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'sound-effects',
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },

    // Live2D SDK from CDN - StaleWhileRevalidate
    {
      urlPattern: /^https:\/\/cubism\.live2d\.com\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'live2d-sdk',
        expiration: {
          maxEntries: 5,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },

    // Blockchain RPC - NetworkFirst with short cache
    {
      urlPattern: /^https:\/\/.*\.metis(devops)?\.link\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'blockchain-rpc',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 30, // 30 seconds
        },
      },
    },

    // API Health endpoint - NetworkFirst
    {
      urlPattern: /\/health$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-health',
        networkTimeoutSeconds: 5,
        expiration: {
          maxEntries: 1,
          maxAgeSeconds: 5 * 60, // 5 minutes
        },
      },
    },

    // Google Fonts stylesheets
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'google-fonts-stylesheets',
      },
    },

    // Google Fonts webfonts
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-webfonts',
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
  ],
  fallbacks: {
    entries: [
      {
        url: '/~offline',
        matcher({ request }) {
          return request.destination === 'document';
        },
      },
    ],
  },
});

serwist.addEventListeners();
