import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import MatchPlayerPicker, { MatchDetails } from '../components/MatchPlayerPicker';

interface MatchLineupEntryProps {
  matchId: string;
  token: string;
  isAdmin: boolean;
  apiBaseUrl?: string;
}

const MatchLineupEntry: React.FC<MatchLineupEntryProps> = ({
  matchId,
  token,
  isAdmin,
  apiBaseUrl = ''
}) => {
  const [match, setMatch] = useState<MatchDetails | null>(null);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    const loadMatch = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${apiBaseUrl}/api/matches`);
        if (!response.ok) {
          throw new Error('Unable to load matches');
        }
        const data = await response.json();
        const matchDetails: MatchDetails | undefined = data.matches.find(
          (item: MatchDetails) => item.id === matchId
        );
        if (!matchDetails) {
          throw new Error('Match not found');
        }
        setMatch(matchDetails);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadMatch();
  }, [apiBaseUrl, matchId, isAdmin]);

  useEffect(() => {
    if (!match || !isAdmin) {
      return;
    }

    const loadExistingLineup = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/matches/${match.id}/official-lineup`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.status === 404) {
          return;
        }
        if (!response.ok) {
          throw new Error('Unable to load existing lineup');
        }
        const payload = await response.json();
        setSelectedPlayers(payload.lineup.players || []);
      } catch (err: any) {
        console.warn(err.message);
      }
    };

    loadExistingLineup();
  }, [apiBaseUrl, match, token, isAdmin]);

  const togglePlayer = (playerId: string) => {
    setSelectedPlayers((current) => {
      if (current.includes(playerId)) {
        return current.filter((id) => id !== playerId);
      }
      if (current.length >= 11) {
        Alert.alert('Limit reached', 'Official lineup must contain exactly 11 players.');
        return current;
      }
      return [...current, playerId];
    });
  };

  const handleSubmit = async () => {
    if (!match) {
      return;
    }
    if (selectedPlayers.length !== 11) {
      Alert.alert('Incomplete lineup', 'Please choose exactly 11 players before saving.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/matches/${match.id}/official-lineup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ players: selectedPlayers })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || 'Unable to save official lineup');
      }
      Alert.alert('Lineup saved', 'The official match lineup has been recorded.');
      setSelectedPlayers(payload.lineup.players);
    } catch (err: any) {
      Alert.alert('Save failed', err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <View style={styles.centered}>
        <Text style={styles.restricted}>This view is restricted to administrators.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error || !match) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error || 'Match could not be loaded.'}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Official lineup entry</Text>
      <Text style={styles.subtitle}>
        {match.homeTeam} vs {match.awayTeam} • {new Date(match.kickoff).toLocaleString()}
      </Text>
      <Text style={styles.counter}>{selectedPlayers.length} / 11 players selected</Text>

      <MatchPlayerPicker
        match={match}
        selectedPlayers={selectedPlayers}
        onToggle={togglePlayer}
      />

      <Button
        title={saving ? 'Saving…' : 'Save official lineup'}
        onPress={handleSubmit}
        disabled={saving || selectedPlayers.length !== 11}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
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
  errorText: {
    color: '#dc2626',
    textAlign: 'center'
  },
  restricted: {
    color: '#334155',
    textAlign: 'center'
  }
});

export default MatchLineupEntry;
