const users = [
  {
    id: 'user-1',
    username: 'demo',
    password: 'password123',
    displayName: 'Demo User',
    isAdmin: false
  },
  {
    id: 'user-2',
    username: 'analyst',
    password: 'matchday',
    displayName: 'Matchday Analyst',
    isAdmin: true
  }
];

function findUserByUsername(username) {
  return users.find((user) => user.username === username);
}

function findUserById(id) {
  return users.find((user) => user.id === id);
}

module.exports = {
  users,
  findUserByUsername,
  findUserById
};
