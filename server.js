import express from 'express';
import compression from 'compression';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', true);
app.use(compression());

const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';
const htmlPath = path.join(__dirname, 'code.html');

function resolveOrigin(req) {
  const configured = (process.env.APP_URL || '').trim().replace(/\/+$/, '');
  if (configured) return configured;
  const host = req.get('host') || `localhost:${PORT}`;
  return `${req.protocol}://${host}`;
}

function sendSeoHtml(req, res) {
  const origin = resolveOrigin(req);
  const rawHtml = fs.readFileSync(htmlPath, 'utf8');
  const renderedHtml = rawHtml.replace(/__APP_ORIGIN__/g, origin);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(renderedHtml);
}

app.use(express.static(path.join(__dirname, 'public'), {
  index: false,
  maxAge: '30d',
  immutable: true
}));
app.use(express.static(__dirname, { index: false }));

app.get('/robots.txt', (req, res) => {
  const origin = resolveOrigin(req);
  res.type('text/plain').send(
    `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`
  );
});

app.get('/sitemap.xml', (req, res) => {
  const origin = resolveOrigin(req);
  const lastmod = new Date().toISOString().split('T')[0];
  res.type('application/xml').send(
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `  <url>\n` +
    `    <loc>${origin}/</loc>\n` +
    `    <lastmod>${lastmod}</lastmod>\n` +
    `    <changefreq>weekly</changefreq>\n` +
    `    <priority>1.0</priority>\n` +
    `  </url>\n` +
    `</urlset>\n`
  );
});

app.get('/', sendSeoHtml);
app.get('/index.html', sendSeoHtml);

app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});

