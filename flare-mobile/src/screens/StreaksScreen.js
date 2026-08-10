import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { ChatAPI } from '../services/api';

export default function StreaksScreen({ navigation }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await ChatAPI.getStreaks();
      setChats(data.chats);
    } catch (err) {
      console.log('Failed to load streaks:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function openChat(chat) {
    const participants = chat.participants
      .filter((p) => p.user.id !== user.id)
      .map((p) => p.user);

    navigation.navigate('ChatThread', {
      chatId: chat.id,
      participants,
      isGroup: chat.isGroup,
      groupName: chat.groupName,
      streakCount: chat.streak?.currentCount || 0,
    });
  }

  function fireColor(count) {
    if (count >= 30) return '#FF2E93'; // hot pink - big streak
    if (count >= 7) return '#FF6B4A'; // coral - solid streak
    return colors.textMuted; // just starting
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.pink} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Streaks</Text>
        <View style={{ width: 20 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.pink} />
      ) : chats.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 40, marginBottom: 10 }}>🔥</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No active streaks yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
            Keep chatting daily with someone to start one.
          </Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 8 }}
          renderItem={({ item, index }) => {
            const otherUser = item.isGroup
              ? null
              : item.participants.find((p) => p.user.id !== user.id)?.user;
            const displayName = item.isGroup ? item.groupName : otherUser?.username || 'Unknown';
            const initials = displayName.slice(0, 2).toUpperCase();
            const count = item.streak.currentCount;

            return (
              <TouchableOpacity style={styles.row} onPress={() => openChat(item)}>
                <Text style={[styles.rank, { color: colors.textMuted }]}>{index + 1}</Text>
                <View style={[styles.avatar, { backgroundColor: item.isGroup ? colors.violet : colors.pink }]}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <Text style={[styles.name, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                  {item.isGroup ? item.groupName : `@${displayName}`}
                </Text>
                <View style={styles.streakBadge}>
                  <Text style={{ fontSize: 15 }}>🔥</Text>
                  <Text style={[styles.streakCount, { color: fireColor(count) }]}>{count}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 15, fontWeight: '600', marginBottom: 6 },
  emptySubtitle: { fontSize: 12.5, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, gap: 12 },
  rank: { fontSize: 13, fontWeight: '700', width: 18, textAlign: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  name: { fontSize: 14, fontWeight: '600' },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  streakCount: { fontSize: 13, fontWeight: '700' },
});