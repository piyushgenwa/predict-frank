const predictions = new Map();

function key(userId, matchId) {
  return `${userId}:${matchId}`;
}

function getPrediction(userId, matchId) {
  return predictions.get(key(userId, matchId));
}

function savePrediction(prediction) {
  predictions.set(key(prediction.userId, prediction.matchId), prediction);
  return prediction;
}

function getAllPredictions() {
  return Array.from(predictions.values());
}

function getPredictionsForMatch(matchId) {
  return getAllPredictions().filter((prediction) => prediction.matchId === matchId);
}

function clearPredictions() {
  predictions.clear();
}

module.exports = {
  getPrediction,
  savePrediction,
  getAllPredictions,
  getPredictionsForMatch,
  clearPredictions
};
