import { build } from 'esbuild';
import { cp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import './patch-maplibre.mjs';
const require = createRequire(import.meta.url);
const root = process.cwd();
const trip = JSON.parse(await readFile('trip.json', 'utf8')).trip;
const htmlEscape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
await rm('docs', { recursive: true, force: true });
await mkdir('docs/assets', { recursive: true });
await cp('static', 'docs', { recursive: true });
await cp('base.css', 'docs/assets/base.css');
const result = await build({
  entryPoints: ['main.tsx'], bundle: true, splitting: true, format: 'esm',
  outdir: 'docs/assets', minify: true, metafile: true, jsx: 'automatic',
  target: 'es2022', define: { 'process.env.NODE_ENV': '"production"' },
  loader: { '.png': 'file', '.svg': 'file' },
  plugins: [{ name: 'static-trip', setup(b) {
    b.onResolve({ filter: /(?:^|\/)useSharedTrip$/ }, () => ({ path: path.join(root, 'useSharedTrip.ts') }));
    b.onResolve({ filter: /(?:^|\/)settingsStore$/ }, () => ({ path: path.join(root, 'settingsStore.ts') }));
    b.onResolve({ filter: /^@trek\/shared/ }, ({ path: spec }) => ({ path: path.join(root, 'vendor/shared/src', spec === '@trek/shared' ? 'index.ts' : spec.replace('@trek/shared/', '') + '/index.ts') }));
    b.onResolve({ filter: /mapbox-gl-rtl-text.*\?url$/ }, () => ({ path: path.join(path.dirname(require.resolve('@mapbox/mapbox-gl-rtl-text')), '../dist/mapbox-gl-rtl-text.js'), namespace: 'asset-url' }));
    b.onLoad({ filter: /.*/, namespace: 'asset-url' }, async ({ path: file }) => {
      await cp(file, 'docs/assets/rtl-text.js');
      return { contents: 'export default new URL("./rtl-text.js", import.meta.url).href', loader: 'js' };
    });
  } }],
});
await writeFile('metafile.json', JSON.stringify(result.metafile, null, 2));
await cp('LICENSE', 'docs/LICENSE');
await writeFile('docs/.nojekyll', '');
await writeFile('docs/robots.txt', 'User-agent: *\nDisallow: /\n');
await writeFile('docs/index.html', `<!doctype html>
<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><meta name="description" content="${htmlEscape(trip.description)}">
<meta name="referrer" content="strict-origin-when-cross-origin">
<title>${htmlEscape(trip.title)}</title><link rel="icon" href="./icons/icon.svg">
<link rel="stylesheet" href="./assets/base.css"><link rel="stylesheet" href="./assets/main.css">
<style>html,body{height:auto;min-height:100%;overflow:visible}body{overflow-x:clip}</style>
</head><body><div id="root"></div><script type="module" src="./assets/main.js"></script></body></html>`);
console.log('Built standalone guide in docs/');
