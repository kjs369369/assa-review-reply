import { cp, mkdir, rm, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
await rm(new URL('dist/', root), { recursive: true, force: true });
await mkdir(new URL('dist/', root));
for (const dir of ['public', 'src']) await cp(new URL(`${dir}/`, root), new URL(`dist/${dir}/`, root), { recursive: true });
const site = JSON.parse(await readFile(new URL('site.config.json', root), 'utf8'));
const url = new URL(site.publicUrl);
if (url.protocol !== 'https:' || !url.pathname.endsWith('/')) throw new Error('Site URL must be HTTPS with a trailing slash.');
const base = process.env.LOCAL_PREVIEW === '1' ? '/' : url.pathname;
const out = new URL('dist/public/', root);
await mkdir(new URL('engine/', out));
for (const file of ['replies.mjs', 'config.mjs']) await cp(new URL(`src/${file}`, root), new URL(`engine/${file}`, out));
const escape = text => String(text).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
let html = await readFile(new URL('index.html', out), 'utf8');
const csp = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none'";
const tags = [
  `<meta http-equiv="Content-Security-Policy" content="${csp}">`,
  '<meta name="referrer" content="no-referrer">',
  `<link rel="canonical" href="${escape(site.publicUrl)}">`,
  ...Object.entries({ 'og:title': site.title, 'og:description': site.description, 'og:type': 'website', 'og:locale': 'ko_KR', 'og:site_name': site.name, 'og:url': site.publicUrl, 'og:image': new URL('og-image.png', url).href, 'og:image:secure_url': new URL('og-image.png', url).href, 'og:image:type': 'image/png', 'og:image:width': '1200', 'og:image:height': '630', 'og:image:alt': site.imageAlt }).map(([key,value])=>`<meta property="${key}" content="${escape(value)}">`),
  ...Object.entries({ 'twitter:card': 'summary_large_image', 'twitter:title': site.title, 'twitter:description': site.description, 'twitter:image': new URL('og-image.png', url).href, 'twitter:image:alt': site.imageAlt }).map(([key,value])=>`<meta name="${key}" content="${escape(value)}">`)
].join('\n  ');
html = html.replace('<base href="/">', `<base href="${escape(base)}">`).replace(/<title>.*?<\/title>/, `<title>${escape(site.title)}</title>`).replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${escape(site.description)}">`).replace('</head>', `  ${tags}\n</head>`);
await writeFile(new URL('index.html', out), html);
await writeFile(new URL('.nojekyll', out), '');
await writeFile(new URL('robots.txt', out), `User-agent: *\nAllow: /\nSitemap: ${new URL('sitemap.xml', url).href}\n`);
await writeFile(new URL('sitemap.xml', out), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escape(site.publicUrl)}</loc></url></urlset>`);
await writeFile(new URL('404.html', out), '<!doctype html><html lang="ko"><meta charset="utf-8"><title>페이지를 찾을 수 없습니다</title><h1>페이지를 찾을 수 없습니다.</h1><p><a href="'+escape(base)+'">앗싸, 답글!로 돌아가기</a></p></html>');
console.log(`빌드 완료: ${fileURLToPath(new URL('dist/', root))} (비밀 설정 제외)`);
