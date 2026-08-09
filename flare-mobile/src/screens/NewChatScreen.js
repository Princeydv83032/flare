import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { AuthAPI, ChatAPI } from "../services/api";

export default function NewChatScreen({ navigation }) {
  const { colors } = useTheme();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [creatingId, setCreatingId] = useState(null);
  const debounceRef = useRef(null);

  const runSearch = useCallback(async (q) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const { data } = await AuthAPI.search(q.trim());
      setResults(data.users);
    } catch (err) {
      console.log("Search failed:", err.message);
    } finally {
      setSearching(false);
    }
  }, []);

  function handleChangeText(text) {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(text), 400); // debounce so we don't hit the API on every keystroke
  }

  async function handleSelectUser(user) {
    setCreatingId(user.id);
    try {
      const { data } = await ChatAPI.getOrCreateDirect(user.id);
      navigation.goBack();
      // HomeScreen re-fetches chats on focus (added below), so the new chat appears automatically
    } catch (err) {
      Alert.alert("Error", err?.response?.data?.error || err.message);
    } finally {
      setCreatingId(null);
    }
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.pink, fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          New Chat
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate("NewGroup")}>
          <Text
            style={{ color: colors.pink, fontSize: 12.5, fontWeight: "600" }}
          >
            New Group
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
        placeholder="Search by username"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoFocus
        value={query}
        onChangeText={handleChangeText}
      />

      {searching ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={colors.pink} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 12 }}
          ListEmptyComponent={
            query.trim() ? (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No users found
              </Text>
            ) : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => handleSelectUser(item)}
              disabled={creatingId === item.id}
            >
              <View style={[styles.avatar, { backgroundColor: colors.pink }]}>
                <Text style={styles.avatarText}>
                  {item.username.slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.username, { color: colors.text }]}>
                  @{item.username}
                </Text>
                {item.about ? (
                  <Text
                    style={[styles.about, { color: colors.textMuted }]}
                    numberOfLines={1}
                  >
                    {item.about}
                  </Text>
                ) : null}
              </View>
              {creatingId === item.id && (
                <ActivityIndicator size="small" color={colors.pink} />
              )}
            </TouchableOpacity>
          )}
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
  headerTitle: { fontSize: 17, fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    margin: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  username: { fontSize: 14.5, fontWeight: "600" },
  about: { fontSize: 12.5, marginTop: 2 },
  emptyText: { textAlign: "center", marginTop: 32, fontSize: 13 },
});
