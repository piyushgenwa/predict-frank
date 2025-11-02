const http = require('http');
const { URL } = require('url');
const { StringDecoder } = require('string_decoder');

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function compilePath(path) {
  if (path === '/') {
    return { regex: /^\/?$/, keys: [] };
  }
  const segments = path.split('/').filter(Boolean);
  const keys = [];
  const regexParts = segments.map((segment) => {
    if (segment.startsWith(':')) {
      keys.push(segment.slice(1));
      return '([^/]+)';
    }
    return escapeRegExp(segment);
  });
  const regex = new RegExp(`^/${regexParts.join('/')}/?$`);
  return { regex, keys };
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    const decoder = new StringDecoder('utf-8');
    let buffer = '';

    req.on('data', (chunk) => {
      buffer += decoder.write(chunk);
    });

    req.on('end', () => {
      buffer += decoder.end();
      if (!buffer) {
        return resolve(null);
      }
      try {
        const parsed = JSON.parse(buffer);
        resolve(parsed);
      } catch (error) {
        reject(new Error('Invalid JSON body'));
      }
    });

    req.on('error', (error) => reject(error));
  });
}

function createApp() {
  const routes = [];

  function addRoute(method, path, handler) {
    const { regex, keys } = compilePath(path);
    routes.push({ method, regex, keys, handler });
  }

  async function handleRequest(nodeReq, nodeRes) {
    nodeRes.setHeader('Access-Control-Allow-Origin', '*');
    nodeRes.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    nodeRes.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');

    if (nodeReq.method === 'OPTIONS') {
      nodeRes.writeHead(204).end();
      return;
    }

    const requestUrl = new URL(nodeReq.url, 'http://localhost');

    for (const route of routes) {
      if (route.method !== nodeReq.method) {
        continue;
      }
      const match = requestUrl.pathname.match(route.regex);
      if (!match) {
        continue;
      }

      const params = {};
      route.keys.forEach((key, index) => {
        params[key] = decodeURIComponent(match[index + 1]);
      });

      let body = null;
      if (nodeReq.method !== 'GET' && nodeReq.method !== 'HEAD') {
        const contentType = nodeReq.headers['content-type'] || '';
        if (contentType.includes('application/json')) {
          try {
            body = await parseJsonBody(nodeReq);
          } catch (error) {
            nodeRes.writeHead(400, { 'Content-Type': 'application/json' });
            nodeRes.end(JSON.stringify({ message: error.message }));
            return;
          }
        }
      }

      const req = {
        method: nodeReq.method,
        headers: nodeReq.headers,
        url: nodeReq.url,
        params,
        query: Object.fromEntries(requestUrl.searchParams.entries()),
        body
      };

      const res = {
        status(code) {
          nodeRes.statusCode = code;
          return this;
        },
        json(payload) {
          if (!nodeRes.headersSent) {
            nodeRes.setHeader('Content-Type', 'application/json');
          }
          nodeRes.end(JSON.stringify(payload));
        }
      };

      try {
        await route.handler(req, res);
      } catch (error) {
        nodeRes.statusCode = 500;
        nodeRes.setHeader('Content-Type', 'application/json');
        nodeRes.end(JSON.stringify({ message: 'Internal server error', detail: error.message }));
      }
      return;
    }

    nodeRes.writeHead(404, { 'Content-Type': 'application/json' });
    nodeRes.end(JSON.stringify({ message: 'Not found' }));
  }

  return {
    get: (path, handler) => addRoute('GET', path, handler),
    post: (path, handler) => addRoute('POST', path, handler),
    handler: handleRequest,
    listen(port, callback) {
      return http.createServer(handleRequest).listen(port, callback);
    }
  };
}

module.exports = createApp;
