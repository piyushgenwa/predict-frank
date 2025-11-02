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

function clearPredictions() {
  predictions.clear();
}

module.exports = {
  getPrediction,
  savePrediction,
  getAllPredictions,
  clearPredictions
};
