const { authenticateRequest } = require('./jwt');

function requireAuth(handler) {
  return async (req, res) => {
    const user = authenticateRequest(req);
    if (!user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    await handler(req, res, user);
  };
}

function requireAdmin(handler) {
  return requireAuth(async (req, res, user) => {
    if (!user.isAdmin) {
      res.status(403).json({ message: 'Admin privileges required' });
      return;
    }
    await handler(req, res, user);
  });
}

module.exports = {
  requireAuth,
  requireAdmin
};
