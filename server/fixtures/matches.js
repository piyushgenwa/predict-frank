const { findPlayersByTeam } = require('./players');

const now = new Date();

const matches = [
  {
    id: 'match-1',
    homeTeam: 'Frankfurt',
    awayTeam: 'Munich',
    kickoff: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
    venue: 'Deutsche Bank Park',
    players: [...findPlayersByTeam('Frankfurt'), ...findPlayersByTeam('Munich')]
  },
  {
    id: 'match-2',
    homeTeam: 'Berlin',
    awayTeam: 'Hamburg',
    kickoff: new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString(),
    venue: 'Olympiastadion',
    players: [...findPlayersByTeam('Frankfurt'), ...findPlayersByTeam('Munich')]
  },
  {
    id: 'match-3',
    homeTeam: 'Leipzig',
    awayTeam: 'Dortmund',
    kickoff: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
    venue: 'Red Bull Arena',
    players: [...findPlayersByTeam('Frankfurt'), ...findPlayersByTeam('Munich')]
  }
];

function findMatchById(id) {
  return matches.find((match) => match.id === id);
}

module.exports = {
  matches,
  findMatchById
};
