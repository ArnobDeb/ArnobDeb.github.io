import { defineConfig, type Plugin } from 'vite';
import { renderPage, renderHead } from './src/content/render.ts';

// Bakes the content from src/content/site.ts into index.html at build (and dev) time,
// so the page is fully readable without JavaScript and crawlable by search engines.
function staticContent(): Plugin {
  return {
    name: 'static-content',
    transformIndexHtml(html) {
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
  },
});
