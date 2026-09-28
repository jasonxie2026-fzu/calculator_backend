import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';
import { evaluateExpression } from './calculator.js';
import { createDatabase } from './database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '..');
const frontendRoot = path.resolve(backendRoot, '..', 'frontend');
const port = Number(process.env.PORT || 3000);
const database = createDatabase(process.env.DATABASE_FILE || path.join(backendRoot, 'data', 'history.sqlite'));

function sendJson(response, status, body) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  response.end(JSON.stringify(body));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 10_000) reject(new Error('Request too large'));
    });
    request.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    request.on('error', reject);
  });
}

function serveFrontend(request, response, pathname) {
  const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
  const filename = path.resolve(frontendRoot, relative);
  if (!filename.startsWith(frontendRoot) || !fs.existsSync(filename) || fs.statSync(filename).isDirectory()) {
    response.writeHead(404);
    response.end('Not found');
    return;
  }

  const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };
  response.writeHead(200, { 'Content-Type': types[path.extname(filename)] || 'application/octet-stream' });
  fs.createReadStream(filename).pipe(response);
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  if (request.method === 'OPTIONS') {
    sendJson(response, 204, {});
    return;
  }

  try {
    if (request.method === 'POST' && pathname === '/api/calculate') {
      const body = await readJson(request);
      const expression = typeof body.expression === 'string' ? body.expression.trim() : '';
      const result = evaluateExpression(expression);
      const record = database.addHistory(expression, result);
      sendJson(response, 201, { success: true, ...record });
      return;
    }

    if (request.method === 'GET' && pathname === '/api/history') {
      sendJson(response, 200, { success: true, history: database.listHistory() });
      return;
    }

    if (request.method === 'DELETE' && pathname === '/api/history') {
      const deleted = database.deleteAll();
      sendJson(response, 200, { success: true, deleted });
      return;
    }

    const idMatch = pathname.match(/^\/api\/history\/(\d+)$/);
    if (request.method === 'DELETE' && idMatch) {
      const deleted = database.deleteHistory(Number(idMatch[1]));
      if (!deleted) {
        sendJson(response, 404, { success: false, message: 'History record not found' });
        return;
      }
      sendJson(response, 200, { success: true });
      return;
    }

    if (request.method === 'GET') {
      serveFrontend(request, response, pathname);
      return;
    }

    sendJson(response, 404, { success: false, message: 'Not found' });
  } catch (error) {
    const status = error.message === 'Invalid JSON' || error.message === 'Request too large' || error.message === 'Invalid expression' || error.message === 'Division by zero' ? 400 : 500;
    sendJson(response, status, { success: false, message: error.message || 'Server error' });
  }
});

server.listen(port, () => {
  console.log(`Calculator backend listening on http://localhost:${port}`);
});

process.on('SIGINT', () => {
  database.close();
  server.close(() => process.exit(0));
});
