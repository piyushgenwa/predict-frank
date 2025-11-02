const { randomUUID } = require('crypto');
const { matches, findMatchById } = require('../fixtures/matches');
const { requireAuth, requireAdmin } = require('../auth/guards');
const { getPrediction, savePrediction } = require('../predictions/store');
const {
  validatePlayerSelection,
  validatePlayersBelongToMatch,
  isMatchLocked
} = require('../utils/predictionValidation');
const { getOfficialLineup, saveOfficialLineup } = require('../matches/officialLineups');

function registerMatchRoutes(app) {
  app.get('/api/matches', async (_req, res) => {
    res.json({ matches });
  });

  app.get(
    '/api/matches/:id/prediction',
    requireAuth(async (req, res, user) => {
      const match = findMatchById(req.params.id);
      if (!match) {
        return res.status(404).json({ message: 'Match not found' });
      }

      const prediction = getPrediction(user.sub, match.id);
      if (!prediction) {
        return res.status(404).json({ message: 'Prediction not found' });
      }

      return res.json({ prediction });
    })
  );

  app.post(
    '/api/matches/:id/prediction',
    requireAuth(async (req, res, user) => {
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
        return res
          .status(400)
          .json({ message: 'All players must be part of the match roster' });
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
    })
  );

  app.get(
    '/api/matches/:id/official-lineup',
    requireAdmin(async (req, res) => {
      const match = findMatchById(req.params.id);
      if (!match) {
        return res.status(404).json({ message: 'Match not found' });
      }

      const lineup = getOfficialLineup(match.id);
      if (!lineup) {
        return res.status(404).json({ message: 'Official lineup not submitted' });
      }

      return res.json({ lineup });
    })
  );

  app.post(
    '/api/matches/:id/official-lineup',
    requireAdmin(async (req, res, user) => {
      const match = findMatchById(req.params.id);
      if (!match) {
        return res.status(404).json({ message: 'Match not found' });
      }

      const players = (req.body && req.body.players) || [];

      if (!Array.isArray(players)) {
        return res.status(400).json({ message: 'Players must be an array' });
      }

      if (players.length !== 11) {
        return res
          .status(400)
          .json({ message: 'Official lineup must contain exactly 11 players' });
      }

      const playerValidation = validatePlayerSelection(players);
      if (!playerValidation.valid) {
        return res.status(400).json({ message: playerValidation.reason });
      }

      if (!validatePlayersBelongToMatch(match, players)) {
        return res
          .status(400)
          .json({ message: 'All players must be part of the match roster' });
      }

      const existing = getOfficialLineup(match.id);
      const timestamp = new Date().toISOString();
      const lineup = saveOfficialLineup({
        matchId: match.id,
        players,
        submittedBy: user.sub,
        submittedAt: timestamp
      });

      // eslint-disable-next-line no-console
      console.log(
        `Official lineup for ${match.id} submitted by ${user.username || user.sub} at ${timestamp}`
      );

      return res.status(existing ? 200 : 201).json({ lineup });
    })
  );
}

module.exports = registerMatchRoutes;
