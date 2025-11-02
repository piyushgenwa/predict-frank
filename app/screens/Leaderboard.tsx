import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  StyleSheet
} from 'react-native';

interface HistoryItem {
  matchId: string;
  points: number;
  calculatedAt: string;
  homeTeam: string | null;
  awayTeam: string | null;
  kickoff: string | null;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  totalPoints: number;
  matchCount: number;
  recentMatches: HistoryItem[];
}

interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
}

interface LeaderboardScreenProps {
  apiBaseUrl?: string;
}

const formatMatchTitle = (item: HistoryItem) => {
  if (item.homeTeam && item.awayTeam) {
    return `${item.homeTeam} vs ${item.awayTeam}`;
  }
  return item.matchId;
};

const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ apiBaseUrl = '' }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLeaderboard = useCallback(async () => {
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/api/leaderboard`);
      if (!response.ok) {
        throw new Error('Failed to load leaderboard');
      }
      const payload: LeaderboardResponse = await response.json();
      setEntries(payload.leaderboard);
    } catch (err: any) {
      setError(err.message || 'Unable to load leaderboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const renderHistoryItem = (item: HistoryItem) => {
    const kickoff = item.kickoff ? new Date(item.kickoff) : null;
    return (
      <View key={`${item.matchId}-${item.calculatedAt}`} style={styles.matchRow}>
        <Text style={styles.matchTitle}>{formatMatchTitle(item)}</Text>
        <Text style={styles.matchMeta}>
          {kickoff ? kickoff.toLocaleDateString() : 'Kickoff TBA'} • {item.points} pts
        </Text>
      </View>
    );
  };

  const renderEntry = ({ item }: { item: LeaderboardEntry }) => (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.rank}>#{item.rank}</Text>
        <View style={styles.headerContent}>
          <Text style={styles.displayName}>{item.displayName}</Text>
          <Text style={styles.points}>{item.totalPoints} pts</Text>
          <Text style={styles.meta}>{item.matchCount} matches scored</Text>
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent matches</Text>
        {item.recentMatches.length === 0 ? (
          <Text style={styles.empty}>No matches scored yet.</Text>
        ) : (
          item.recentMatches.map(renderHistoryItem)
        )}
      </View>
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
      data={entries}
      keyExtractor={(item) => item.userId}
      renderItem={renderEntry}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadLeaderboard();
          }}
        />
      }
      ListEmptyComponent={<Text style={styles.empty}>No scores have been recorded yet.</Text>}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    padding: 16
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  rank: {
    fontSize: 24,
    fontWeight: '700',
    marginRight: 12,
    color: '#2563eb'
  },
  headerContent: {
    flex: 1
  },
  displayName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4
  },
  points: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0f172a'
  },
  meta: {
    fontSize: 13,
    color: '#64748b'
  },
  section: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e2e8f0',
    paddingTop: 12
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#475569'
  },
  matchRow: {
    marginBottom: 8
  },
  matchTitle: {
    fontSize: 14,
    fontWeight: '500'
  },
  matchMeta: {
    fontSize: 12,
    color: '#64748b'
  },
  empty: {
    fontSize: 13,
    color: '#94a3b8'
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  errorText: {
    color: '#b91c1c'
  }
});

export default LeaderboardScreen;
