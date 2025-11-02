const { createScoringEngine, defaultRules } = require('./engine');
const { recordScore } = require('./store');
const { getOfficialLineup } = require('../matches/officialLineups');
const { getPredictionsForMatch } = require('../predictions/store');

let engine = createScoringEngine();
const activeJobs = new Set();

function configureScoringRules(rules) {
  engine = createScoringEngine({ ...defaultRules, ...rules });
}

async function runMatchScoring(matchId) {
  const lineup = getOfficialLineup(matchId);
  if (!lineup) {
    return;
  }

  const predictions = getPredictionsForMatch(matchId);
  const timestamp = new Date().toISOString();

  predictions.forEach((prediction) => {
    const result = engine.score(prediction, lineup);
    recordScore({
      matchId,
      userId: prediction.userId,
      points: result.points,
      breakdown: result.breakdown,
      calculatedAt: timestamp
    });
  });
}

function scheduleMatchScoring(matchId) {
  const jobPromise = (async () => {
    try {
      await runMatchScoring(matchId);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Failed to score match ${matchId}:`, error);
    } finally {
      activeJobs.delete(jobPromise);
    }
  })();

  activeJobs.add(jobPromise);
  return jobPromise;
}

function waitForScoring() {
  return Promise.all(Array.from(activeJobs));
}

module.exports = {
  configureScoringRules,
  scheduleMatchScoring,
  waitForScoring,
  runMatchScoring
};

if (process.env.SCORING_RULES) {
  try {
    const parsed = JSON.parse(process.env.SCORING_RULES);
    configureScoringRules(parsed);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to parse SCORING_RULES configuration:', error);
  }
}
