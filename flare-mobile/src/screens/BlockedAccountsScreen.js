import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { BlockAPI } from '../services/api';

export default function BlockedAccountsScreen({ navigation }) {
  const { colors } = useTheme();
  const [blocked, setBlocked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await BlockAPI.list();
      setBlocked(data.blocked);
    } catch (err) {
      console.log('Failed to load blocked users:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function confirmUnblock(person) {
    Alert.alert('Unblock', `Unblock @${person.username}? They'll be able to message you again.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unblock',
        onPress: async () => {
          setUnblockingId(person.id);
          try {
            await BlockAPI.unblock(person.id);
            setBlocked((prev) => prev.filter((p) => p.id !== person.id));
          } catch (err) {
            Alert.alert('Error', err?.response?.data?.error || err.message);
          } finally {
            setUnblockingId(null);
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.pink} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Blocked Accounts</Text>
        <View style={{ width: 20 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.pink} />
      ) : blocked.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="shield-checkmark-outline" size={40} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No blocked accounts</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
            People you block won't be able to message or match with you.
          </Text>
        </View>
      ) : (
        <FlatList
          data={blocked}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 8 }}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={[styles.avatar, { backgroundColor: colors.textMuted }]}>
                <Text style={styles.avatarText}>{item.username.slice(0, 2).toUpperCase()}</Text>
              </View>
              <Text style={[styles.username, { color: colors.text, flex: 1 }]}>@{item.username}</Text>
              <TouchableOpacity
                style={[styles.unblockBtn, { borderColor: colors.borderAccent }]}
                onPress={() => confirmUnblock(item)}
                disabled={unblockingId === item.id}
              >
                {unblockingId === item.id ? (
                  <ActivityIndicator size="small" color={colors.pink} />
                ) : (
                  <Text style={{ color: colors.pink, fontSize: 12, fontWeight: '600' }}>Unblock</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
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
  emptyTitle: { fontSize: 15, fontWeight: '600', marginTop: 12, marginBottom: 6 },
  emptySubtitle: { fontSize: 12.5, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  username: { fontSize: 14, fontWeight: '600' },
  unblockBtn: { borderWidth: 1, borderRadius: 16, paddingVertical: 6, paddingHorizontal: 14 },
});