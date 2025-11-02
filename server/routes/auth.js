const { findUserByUsername } = require('../fixtures/users');
const { signToken } = require('../auth/jwt');

function registerAuthRoutes(app) {
  app.post('/api/auth/login', async (req, res) => {
    const { body } = req;
    const username = body && body.username;
    const password = body && body.password;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = findUserByUsername(username);
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken({ sub: user.id, username: user.username, isAdmin: user.isAdmin });

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        isAdmin: user.isAdmin
      }
    });
  });
}

module.exports = registerAuthRoutes;
