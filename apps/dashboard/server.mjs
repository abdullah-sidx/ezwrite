import { readFile, stat } from 'node:fs/promises';
import http from 'node:http';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createOpenAiCompatibleProvider,
  generateSmartDraft,
  normalizeSmartWritingRequest,
} from '@ezwrite/core';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_DIST_DIR = resolve(__dirname, 'dist');
const MAX_BODY_BYTES = 32 * 1024;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function getServerAiConfig(env = process.env) {
  const providerType = (env.EZWRITE_AI_PROVIDER || 'none').trim().toLowerCase();
  const apiKey = (env.EZWRITE_AI_API_KEY || env.OPENAI_API_KEY || '').trim();
  const baseUrl = (env.EZWRITE_AI_BASE_URL || 'https://api.openai.com/v1').trim();
  const model = (env.EZWRITE_AI_MODEL || 'gpt-4o-mini').trim();
  const aiConfigured = providerType === 'openai-compatible' && Boolean(apiKey);

  return { providerType, apiKey, baseUrl, model, aiConfigured };
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

async function readJsonBody(req) {
  const chunks = [];
  let totalBytes = 0;

  for await (const chunk of req) {
    totalBytes += chunk.length;
    if (totalBytes > MAX_BODY_BYTES) {
      throw new Error('Request payload exceeds the 32 KB limit.');
    }
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('Request body must be valid JSON.');
  }
}

async function serveStatic(res, distDir, urlPath) {
  const cleanPath = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
  const candidate = resolve(distDir, cleanPath);

  // Prevent path traversal outside distDir.
  if (candidate !== distDir && !candidate.startsWith(`${distDir}${sep}`)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  let filePath = candidate;
  try {
    const fileStats = await stat(filePath);
    if (fileStats.isDirectory()) {
      filePath = resolve(distDir, 'index.html');
    }
  } catch {
    // SPA fallback to index.html for route paths without an extension.
    if (extname(cleanPath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    filePath = resolve(distDir, 'index.html');
  }

  const content = await readFile(filePath);
  const contentType = MIME_TYPES[extname(filePath)] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': contentType });
  res.end(content);
}

/**
 * Creates the dashboard HTTP server with static SPA hosting and an optional
 * server-side Smart Writing endpoint that never exposes API keys to clients.
 */
export function createDashboardServer(options = {}) {
  const distDir = options.distDir || DEFAULT_DIST_DIR;
  const env = options.env || process.env;
  const fetchImpl = options.fetchImpl;
  const config = getServerAiConfig(env);

  const aiProvider = config.aiConfigured
    ? createOpenAiCompatibleProvider({
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
        model: config.model,
        fetchImpl,
      })
    : null;

  return http.createServer(async (req, res) => {
    const reqUrl = new URL(req.url || '/', 'http://localhost');

    if (req.method === 'GET' && reqUrl.pathname === '/api/health') {
      sendJson(res, 200, {
        status: 'ok',
        aiConfigured: config.aiConfigured,
        provider: config.aiConfigured ? 'openai-compatible' : 'local-fallback',
        model: config.aiConfigured ? config.model : null,
      });
      return;
    }

    if (req.method === 'POST' && reqUrl.pathname === '/api/smart-writing/generate') {
      let body;
      try {
        body = await readJsonBody(req);
        normalizeSmartWritingRequest(body);
      } catch (err) {
        sendJson(res, 400, {
          error: err instanceof Error ? err.message : 'Invalid request payload.',
        });
        return;
      }

      const preferLocal = body?.preferLocal === true;
      const draft = await generateSmartDraft(body, {
        provider: preferLocal ? null : aiProvider,
      });
      sendJson(res, 200, draft);
      return;
    }

    if (req.method === 'GET' || req.method === 'HEAD') {
      try {
        await serveStatic(res, distDir, reqUrl.pathname);
      } catch {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Dashboard build files not found. Run npm run build:dashboard first.');
      }
      return;
    }

    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Method not allowed');
  });
}

const isMainModule = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  const port = Number(process.env.PORT) || 5173;
  const server = createDashboardServer();
  server.listen(port, '0.0.0.0', () => {
    const config = getServerAiConfig();
    console.info(
      `EzWrite dashboard server listening on http://localhost:${port} (AI configured: ${config.aiConfigured})`
    );
  });
}
