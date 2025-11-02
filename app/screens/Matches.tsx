import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';

interface MatchItem {
  id: string;
  homeTeam: string;
  awayTeam: string;
  kickoff: string;
  venue: string;
}

interface MatchesResponse {
  matches: MatchItem[];
}

interface MatchesScreenProps {
  apiBaseUrl?: string;
  onSelectMatch?: (match: MatchItem) => void;
}

const MatchesScreen: React.FC<MatchesScreenProps> = ({ apiBaseUrl = '', onSelectMatch }) => {
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMatches = async () => {
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/api/matches`);
      if (!response.ok) {
        throw new Error('Failed to load matches');
      }
      const data: MatchesResponse = await response.json();
      setMatches(data.matches);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, []);

  const renderMatch = ({ item }: { item: MatchItem }) => (
    <View style={styles.card}>
      <Text style={styles.teams}>{item.homeTeam} vs {item.awayTeam}</Text>
      <Text style={styles.meta}>{new Date(item.kickoff).toLocaleString()}</Text>
      <Text style={styles.meta}>{item.venue}</Text>
      {onSelectMatch && (
        <Text style={styles.link} onPress={() => onSelectMatch(item)}>
          Submit prediction →
        </Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={matches}
      keyExtractor={(item) => item.id}
      renderItem={renderMatch}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadMatches();
          }}
        />
      }
      ListEmptyComponent={<Text style={styles.empty}>No upcoming matches.</Text>}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    padding: 16
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3
  },
  teams: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4
  },
  meta: {
    fontSize: 14,
    color: '#475569'
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16
  },
  errorText: {
    color: '#dc2626'
  },
  empty: {
    textAlign: 'center',
    color: '#64748b',
    marginTop: 24
  },
  link: {
    marginTop: 12,
    color: '#2563eb'
  }
});

export default MatchesScreen;
