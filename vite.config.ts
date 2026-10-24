import { defineConfig, type Plugin } from 'vite';
import { renderPage, renderHead } from './src/content/render.ts';
import { renderSagaHead, renderSagaPage } from './src/content/renderSaga.ts';
import { sagaBySlug, sagas } from './src/content/sagas.ts';

// Bakes the content from src/content/*.ts into each HTML page at build (and dev) time,
// so every page is fully readable without JavaScript and crawlable by search engines.
// index.html uses <!--head--> / <!--app-->; saga pages use <!--saga:slug-->.
function staticContent(): Plugin {
  return {
    name: 'static-content',
    transformIndexHtml(html) {
      const m = html.match(/<!--saga:([\w-]+)-->/);
      if (m) {
        const saga = sagaBySlug[m[1]];
        return html.replace('<!--head-->', renderSagaHead(saga)).replace(m[0], renderSagaPage(saga));
      }
      return html.replace('<!--head-->', renderHead()).replace('<!--app-->', renderPage());
    },
  };
}

export default defineConfig({
  // Relative base: the same build works at /, /<repo>/ on GitHub Pages and /~arnobdeb/ on the CSE server.
  base: './',
  plugins: [staticContent()],
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        main: 'index.html',
        ...Object.fromEntries(sagas.map((s) => [s.slug, s.file])),
      },
    },
  },
});
