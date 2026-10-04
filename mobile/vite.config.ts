import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

function offlinePreviewShell(): Plugin {
  return {
    name: "mobile-offline-preview-shell",
    apply: "build",
    generateBundle: {
      order: "post",
      handler(_options, bundle) {
        const fileNames = Object.keys(bundle).sort();
        if (!fileNames.includes("index.html")) {
          this.error("The mobile offline shell requires a built index.html.");
        }
        const hash = createHash("sha256");
        for (const fileName of fileNames) {
          const output = bundle[fileName];
          hash.update(fileName);
          hash.update(output.type === "chunk" ? output.code : output.source);
        }
        const cacheName = `fieldwork-mobile-shell-${hash.digest("hex").slice(0, 16)}`;
        this.emitFile({
          type: "asset",
          fileName: "sw.js",
          source: `// Generated from the complete mobile build. Browser preview only.
const CACHE_PREFIX = "fieldwork-mobile-shell-";
const CACHE_NAME = ${JSON.stringify(cacheName)};
const PRECACHE = ${JSON.stringify(fileNames.map((name) => `./${name}`))};
const INDEX_URL = new URL("./index.html", self.registration.scope).href;
const PRECACHE_URLS = new Set(PRECACHE.map(path => new URL(path, self.registration.scope).href));

self.addEventListener("install", (event) => {
  // A failed download leaves the previous worker active. New versions wait
  // until old clients close, so they cannot mix chunks across releases.
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames
      .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Vite adds Vary: Origin. Precache fetches and crossorigin module requests
    // have different Origin headers. Only these generated public build files
    // may ignore Vary; user/API responses are never cached here.
    const cached = await cache.match(request, { ignoreVary: PRECACHE_URLS.has(request.url) });
    if (cached) return cached;
    try {
      return await fetch(request);
    } catch (error) {
      if (request.mode === "navigate") {
        const shell = await cache.match(INDEX_URL, { ignoreVary: true });
        if (shell) return shell;
      }
      throw error;
    }
  })());
});
`,
        });
      },
    },
  };
}

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  base: "./",
  publicDir: false,
  plugins: [
    react(),
    {
      name: "mobile-three-license",
      apply: "build",
      generateBundle: { order: "pre", handler() {
        this.emitFile({ type: "asset", fileName: "licenses/three.txt", source: readFileSync(new URL("./src/features/anatomy/LICENSE-three.txt", import.meta.url), "utf8") });
      } },
    },
    {
      name: "mobile-content-security-policy",
      apply: "build",
      transformIndexHtml(html) {
        const bootstrap = html.match(/<script id="trainleaf-appearance-bootstrap">([\s\S]*?)<\/script>/)?.[1];
        if (!bootstrap) throw new Error('The appearance bootstrap must be present before generating its CSP hash.');
        // HTML parsing normalizes newlines before the browser checks the inline script hash.
        const bootstrapHash = createHash('sha256').update(bootstrap.replace(/\r\n?/g, '\n')).digest('base64');
        return [{
          tag: "meta",
          attrs: {
            "http-equiv": "Content-Security-Policy",
            content: [
              "default-src 'self'",
              `script-src 'self' 'wasm-unsafe-eval' 'sha256-${bootstrapHash}'`,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self'",
              "connect-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'none'",
              "frame-src 'none'",
            ].join("; "),
          },
          injectTo: "head-prepend",
        }];
      },
    },
    offlinePreviewShell(),
  ],
  build: {
    outDir: fileURLToPath(new URL("../dist-mobile", import.meta.url)),
    emptyOutDir: true,
    target: "es2020",
  },
  server: {
    host: "127.0.0.1",
    port: 4174,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 4174,
    strictPort: true,
  },
});
