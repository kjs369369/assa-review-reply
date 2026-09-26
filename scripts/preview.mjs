import http from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
const root = new URL('../dist/public/', import.meta.url);
const site = JSON.parse(await readFile(new URL('../site.config.json', import.meta.url), 'utf8'));
const base = new URL(site.publicUrl).pathname;
const files = new Set(await readdir(root, { recursive: true }));
const types = { html:'text/html; charset=utf-8',js:'text/javascript; charset=utf-8',mjs:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8',svg:'image/svg+xml',png:'image/png',txt:'text/plain; charset=utf-8',xml:'application/xml' };
const port = Number(process.env.PREVIEW_PORT || 4317);
http.createServer(async (req,res) => {
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Cache-Control','no-store');
  try {
    if (!['GET','HEAD'].includes(req.method)) {res.writeHead(405);return res.end();}
    const url = new URL(req.url,`http://127.0.0.1:${port}`);
    if (['/','/apps/review-reply',base.slice(0,-1)].includes(url.pathname)) {res.writeHead(302,{Location:base+url.search});return res.end();}
    const file = url.pathname === base ? 'index.html' : url.pathname.startsWith(base) ? url.pathname.slice(base.length) : '';
    if (!files.has(file) || file.startsWith('.')) {res.writeHead(404);return res.end('Not found');}
    const body = await readFile(new URL(file,root));
    res.writeHead(200,{'Content-Type':types[file.split('.').pop()]||'application/octet-stream'});res.end(req.method==='HEAD'?undefined:body);
  } catch {res.writeHead(404);res.end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Static preview: http://127.0.0.1:${port}${base}`));
