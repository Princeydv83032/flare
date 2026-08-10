import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { ChatAPI } from "../services/api";
import ChatListItem from "../components/ChatListItem";

export default function HomeScreen({ navigation }) {
  const { colors } = useTheme();
  const { user, logout } = useAuth();

  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadChats = useCallback(async () => {
    try {
      const { data } = await ChatAPI.list();
      setChats(data.chats);
    } catch (err) {
      console.log("Failed to load chats:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Re-fetches every time this screen comes back into focus - e.g. after
  // creating a new chat from NewChatScreen and navigating back here.
  useFocusEffect(
    useCallback(() => {
      loadChats();
    }, [loadChats]),
  );

  function onRefresh() {
    setRefreshing(true);
    loadChats();
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Chats</Text>
        <View style={styles.headerActions}>
  <TouchableOpacity onPress={() => navigation.navigate('Streaks')}>
    <Text style={{ fontSize: 20 }}>🔥</Text>
  </TouchableOpacity>
  <TouchableOpacity
    style={[styles.iconBtn, { backgroundColor: colors.pink }]}
    onPress={() => navigation.navigate('NewChat')}
  >
    <Text style={styles.iconBtnText}>+</Text>
  </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.logoutBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.borderAccent,
              },
            ]}
            onPress={logout}
          >
            <Text
              style={{ color: colors.pink, fontSize: 12.5, fontWeight: "600" }}
            >
              Log out
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.pink} />
      ) : chats.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No chats yet
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
            Tap + to search for someone and start a conversation.
          </Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 8 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.pink}
            />
          }
          renderItem={({ item }) => {
            const participants = item.participants
              .filter((p) => p.user.id !== user.id)
              .map((p) => p.user);

            return (
              <ChatListItem
                chat={item}
                onPress={() =>
                  navigation.navigate("ChatThread", {
                    chatId: item.id,
                    participants,
                    isGroup: item.isGroup,
                    groupName: item.groupName,
                    streakCount: item.streak?.currentCount || 0,
                  })
                }
              />
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 22, fontWeight: "700" },
  headerActions: { flexDirection: "row", gap: 8, alignItems: "center" },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  logoutBtn: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: { fontSize: 16, fontWeight: "600", marginBottom: 6 },
  emptySubtitle: { fontSize: 13, textAlign: "center" },
});
