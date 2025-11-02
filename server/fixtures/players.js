const players = [
  { id: 'p1', name: 'Sam Keeper', position: 'GK', team: 'Frankfurt' },
  { id: 'p2', name: 'Liam Back', position: 'DF', team: 'Frankfurt' },
  { id: 'p3', name: 'Otto Stopper', position: 'DF', team: 'Frankfurt' },
  { id: 'p4', name: 'Kai Wing', position: 'DF', team: 'Frankfurt' },
  { id: 'p5', name: 'Milo Shield', position: 'MF', team: 'Frankfurt' },
  { id: 'p6', name: 'Leo Creator', position: 'MF', team: 'Frankfurt' },
  { id: 'p7', name: 'Noah Engine', position: 'MF', team: 'Frankfurt' },
  { id: 'p8', name: 'Finn Striker', position: 'FW', team: 'Frankfurt' },
  { id: 'p9', name: 'Jude Runner', position: 'FW', team: 'Frankfurt' },
  { id: 'p10', name: 'Omar Target', position: 'FW', team: 'Frankfurt' },
  { id: 'p11', name: 'Ezra Guard', position: 'DF', team: 'Frankfurt' },
  { id: 'p12', name: 'Ivan Playmaker', position: 'MF', team: 'Frankfurt' },
  { id: 'p13', name: 'Max Keeper', position: 'GK', team: 'Munich' },
  { id: 'p14', name: 'Paul Defender', position: 'DF', team: 'Munich' },
  { id: 'p15', name: 'Oli Shield', position: 'DF', team: 'Munich' },
  { id: 'p16', name: 'Tim Cross', position: 'DF', team: 'Munich' },
  { id: 'p17', name: 'Rex Mid', position: 'MF', team: 'Munich' },
  { id: 'p18', name: 'Vic Drive', position: 'MF', team: 'Munich' },
  { id: 'p19', name: 'Zed Pivot', position: 'MF', team: 'Munich' },
  { id: 'p20', name: 'Art Forward', position: 'FW', team: 'Munich' },
  { id: 'p21', name: 'Ren Poacher', position: 'FW', team: 'Munich' },
  { id: 'p22', name: 'Sol Runner', position: 'FW', team: 'Munich' }
];

function findPlayersByTeam(team) {
  return players.filter((player) => player.team === team);
}

module.exports = {
  players,
  findPlayersByTeam
};
