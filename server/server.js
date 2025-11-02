const createApp = require('./app');
const registerAuthRoutes = require('./routes/auth');
const registerMatchRoutes = require('./routes/matches');

function buildServer() {
  const app = createApp();
  registerAuthRoutes(app);
  registerMatchRoutes(app);
  return app;
}

if (require.main === module) {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  buildServer().listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Predict Frank API listening on port ${port}`);
  });
}

module.exports = buildServer;
