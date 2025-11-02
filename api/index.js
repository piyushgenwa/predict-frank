const buildServer = require('../server/server');

const app = buildServer();

module.exports = async (req, res) => {
  await app.handler(req, res);
};
