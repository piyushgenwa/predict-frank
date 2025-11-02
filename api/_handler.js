const buildServer = require('../server/server');

const app = buildServer();

module.exports = (req, res) => {
  if (!req.url.startsWith('/api')) {
    req.url = req.url === '/' ? '/api' : `/api${req.url.startsWith('/') ? '' : '/'}${req.url}`;
  }
  return app.handler(req, res);
};
