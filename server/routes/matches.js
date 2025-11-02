const { randomUUID } = require('crypto');
const { matches, findMatchById } = require('../fixtures/matches');
const { authenticateRequest } = require('../auth/jwt');
const { getPrediction, savePrediction } = require('../predictions/store');
const {
  validatePlayerSelection,
  validatePlayersBelongToMatch,
  isMatchLocked
} = require('../utils/predictionValidation');

function ensureAuthenticated(req, res) {
  const user = authenticateRequest(req);
  if (!user) {
    res.status(401).json({ message: 'Authentication required' });
    return null;
  }
  return user;
}

function registerMatchRoutes(app) {
  app.get('/api/matches', async (_req, res) => {
    res.json({ matches });
  });

  app.get('/api/matches/:id/prediction', async (req, res) => {
    const user = ensureAuthenticated(req, res);
    if (!user) return;

    const match = findMatchById(req.params.id);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const prediction = getPrediction(user.sub, match.id);
    if (!prediction) {
      return res.status(404).json({ message: 'Prediction not found' });
    }

    return res.json({ prediction });
  });

  app.post('/api/matches/:id/prediction', async (req, res) => {
    const user = ensureAuthenticated(req, res);
    if (!user) return;

    const match = findMatchById(req.params.id);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const players = (req.body && req.body.players) || [];
    const formation = req.body && req.body.formation;

    if (!Array.isArray(players)) {
      return res.status(400).json({ message: 'Players must be an array' });
    }

    const playerValidation = validatePlayerSelection(players);
    if (!playerValidation.valid) {
      return res.status(400).json({ message: playerValidation.reason });
    }

    if (!validatePlayersBelongToMatch(match, players)) {
      return res.status(400).json({ message: 'All players must be part of the match roster' });
    }

    if (isMatchLocked(match)) {
      return res.status(423).json({ message: 'Predictions are locked for this match' });
    }

    const existing = getPrediction(user.sub, match.id);
    const timestamp = new Date().toISOString();
    const prediction = savePrediction({
      id: existing ? existing.id : randomUUID(),
      userId: user.sub,
      matchId: match.id,
      players,
      formation,
      createdAt: existing ? existing.createdAt : timestamp,
      updatedAt: timestamp
    });

    return res.status(existing ? 200 : 201).json({ prediction });
  });
}

module.exports = registerMatchRoutes;
