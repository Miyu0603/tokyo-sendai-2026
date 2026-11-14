import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { TRIP } from './trip.config';

/**
 * 網站的根路徑。GitHub Pages 是 <帳號>.github.io/<repo>/，所以要帶 repo 名。
 * - 在 GitHub Actions 上直接用真正的 repo 名，就算忘了改 TRIP.id 也不會整頁空白
 * - 本機開發用 TRIP.id
 * - 部署到根網域（例如 Cloudflare Pages）時設 BASE_PATH=/
 */
function resolveBase(): string {
  if (process.env.BASE_PATH) return process.env.BASE_PATH;
  const repo = process.env.GITHUB_REPOSITORY?.split('/')[1];
  return `/${repo ?? TRIP.id}/`;
}

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * 讓 index.html 與 manifest.json 也從 trip.config.ts 取名稱，
 * 不然每趟都要記得去改這兩個靜態檔。
 */
function tripConfigPlugin(): Plugin {
  let base = '/';
  const manifest = () =>
    JSON.stringify(
      {
        name: TRIP.title,
        short_name: TRIP.shortTitle,
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: '#FFFFFF',
        theme_color: '#FFFFFF',
        orientation: 'portrait',
        icons: [
          { src: `${base}icon-512.png`, sizes: '192x192', type: 'image/png' },
          { src: `${base}icon-512.png`, sizes: '512x512', type: 'image/png' },
        ],
      },
      null,
      2
    );

  return {
    name: 'trip-config',
    configResolved(config) {
      base = config.base;
    },
    transformIndexHtml: html =>
      html
        .replaceAll('__BASE__', base)
        .replaceAll('__TRIP_TITLE__', escapeHtml(TRIP.title))
        .replaceAll('__TRIP_SHORT_TITLE__', escapeHtml(TRIP.shortTitle)),
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url !== `${base}manifest.json`) return next();
        res.setHeader('Content-Type', 'application/manifest+json');
        res.end(manifest());
      });
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'manifest.json', source: manifest() });
    },
  };
}

export default defineConfig({
  plugins: [react(), tripConfigPlugin()],
  base: resolveBase(),
  build: {
    outDir: 'dist',
  },
});
