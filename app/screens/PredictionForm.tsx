import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';

interface PlayerOption {
  id: string;
  name: string;
  position: string;
  team: string;
}

interface MatchDetails {
  id: string;
  homeTeam: string;
  awayTeam: string;
  kickoff: string;
  venue: string;
  players: PlayerOption[];
}

interface PredictionFormProps {
  match: MatchDetails;
  token: string;
  apiBaseUrl?: string;
}

const FORMATIONS = ['4-3-3', '4-4-2', '3-5-2', '5-3-2'];

const PredictionForm: React.FC<PredictionFormProps> = ({ match, token, apiBaseUrl = '' }) => {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formation, setFormation] = useState<string | undefined>();

  const homePlayers = useMemo(
    () => match.players.filter((player) => player.team === match.homeTeam),
    [match.players, match.homeTeam]
  );
  const awayPlayers = useMemo(
    () => match.players.filter((player) => player.team === match.awayTeam),
    [match.players, match.awayTeam]
  );

  const togglePlayer = (playerId: string) => {
    setSelectedPlayers((current) => {
      if (current.includes(playerId)) {
        return current.filter((id) => id !== playerId);
      }
      if (current.length >= 11) {
        Alert.alert('Limit reached', 'You can only select 11 players.');
        return current;
      }
      return [...current, playerId];
    });
  };

  const submitPrediction = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/matches/${match.id}/prediction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ players: selectedPlayers, formation })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || 'Unable to submit prediction');
      }

      Alert.alert('Prediction saved', 'Your match prediction has been submitted.');
    } catch (error: any) {
      Alert.alert('Submission failed', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderPlayer = (player: PlayerOption) => {
    const selected = selectedPlayers.includes(player.id);
    return (
      <TouchableOpacity
        key={player.id}
        style={[styles.playerRow, selected && styles.playerSelected]}
        onPress={() => togglePlayer(player.id)}
      >
        <Text style={styles.playerName}>{player.name}</Text>
        <Text style={styles.playerMeta}>{player.position}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Submit your XI</Text>
      <Text style={styles.subtitle}>
        {match.homeTeam} vs {match.awayTeam} • {new Date(match.kickoff).toLocaleString()}
      </Text>
      <Text style={styles.counter}>{selectedPlayers.length} / 11 players selected</Text>

      <View style={styles.formations}>
        <Text style={styles.sectionTitle}>Formation helper</Text>
        <View style={styles.formationRow}>
          {FORMATIONS.map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.formationChip, formation === option && styles.formationChipActive]}
              onPress={() => setFormation(formation === option ? undefined : option)}
            >
              <Text
                style={[styles.formationLabel, formation === option && styles.formationLabelActive]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Text style={styles.sectionTitle}>{match.homeTeam}</Text>
      {homePlayers.map(renderPlayer)}

      <Text style={styles.sectionTitle}>{match.awayTeam}</Text>
      {awayPlayers.map(renderPlayer)}

      <Button
        title={submitting ? 'Submitting…' : 'Submit prediction'}
        disabled={submitting || selectedPlayers.length === 0}
        onPress={submitPrediction}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12
  },
  title: {
    fontSize: 22,
    fontWeight: '700'
  },
  subtitle: {
    color: '#64748b'
  },
  counter: {
    fontWeight: '500'
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
  },
  formations: {
    marginBottom: 8
  },
  formationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  formationChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e2e8f0'
  },
  formationChipActive: {
    backgroundColor: '#2563eb'
  },
  formationLabel: {
    color: '#0f172a',
    fontWeight: '600'
  },
  formationLabelActive: {
    color: 'white'
  }
});

export default PredictionForm;
