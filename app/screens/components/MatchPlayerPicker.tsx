import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export interface PlayerOption {
  id: string;
  name: string;
  position: string;
  team: string;
}

export interface MatchDetails {
  id: string;
  homeTeam: string;
  awayTeam: string;
  kickoff: string;
  venue: string;
  players: PlayerOption[];
}

interface MatchPlayerPickerProps {
  match: MatchDetails;
  selectedPlayers: string[];
  onToggle: (playerId: string) => void;
}

const MatchPlayerPicker: React.FC<MatchPlayerPickerProps> = ({
  match,
  selectedPlayers,
  onToggle
}) => {
  const homePlayers = useMemo(
    () => match.players.filter((player) => player.team === match.homeTeam),
    [match.players, match.homeTeam]
  );
  const awayPlayers = useMemo(
    () => match.players.filter((player) => player.team === match.awayTeam),
    [match.players, match.awayTeam]
  );

  const renderPlayer = (player: PlayerOption) => {
    const selected = selectedPlayers.includes(player.id);
    return (
      <TouchableOpacity
        key={player.id}
        style={[styles.playerRow, selected && styles.playerSelected]}
        onPress={() => onToggle(player.id)}
      >
        <Text style={styles.playerName}>{player.name}</Text>
        <Text style={styles.playerMeta}>{player.position}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{match.homeTeam}</Text>
      {homePlayers.map(renderPlayer)}

      <Text style={styles.sectionTitle}>{match.awayTeam}</Text>
      {awayPlayers.map(renderPlayer)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8
  },
  sectionTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600'
  },
  playerRow: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  playerSelected: {
    backgroundColor: '#93c5fd'
  },
  playerName: {
    fontSize: 15,
    fontWeight: '500'
  },
  playerMeta: {
    fontSize: 14,
    color: '#334155'
  }
});

export default MatchPlayerPicker;
