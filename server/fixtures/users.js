const users = [
  {
    id: 'user-1',
    username: 'demo',
    password: 'password123',
    displayName: 'Demo User'
  },
  {
    id: 'user-2',
    username: 'analyst',
    password: 'matchday',
    displayName: 'Matchday Analyst'
  }
];

function findUserByUsername(username) {
  return users.find((user) => user.username === username);
}

module.exports = {
  users,
  findUserByUsername
};
