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
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { AuthAPI, ChatAPI } from "../services/api";

export default function NewGroupScreen({ navigation }) {
  const { colors } = useTheme();
  const { user } = useAuth();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [creating, setCreating] = useState(false);
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
    debounceRef.current = setTimeout(() => runSearch(text), 400);
  }

  function toggleSelect(person) {
    setSelected((prev) =>
      prev.some((p) => p.id === person.id)
        ? prev.filter((p) => p.id !== person.id)
        : [...prev, person],
    );
  }

  async function handleCreate() {
    if (!groupName.trim())
      return Alert.alert("Name required", "Give your group a name.");
    if (selected.length < 1)
      return Alert.alert("Add members", "Select at least one person.");

    setCreating(true);
    try {
      const { data } = await ChatAPI.createGroup(
        groupName.trim(),
        selected.map((p) => p.id),
      );
      const chat = data.chat;
      const participants = chat.participants
        .filter((p) => p.user.id !== user.id)
        .map((p) => p.user);

      navigation.replace("ChatThread", {
        chatId: chat.id,
        participants,
        isGroup: true,
        groupName: chat.groupName,
        streakCount: 0,
      });
    } catch (err) {
      Alert.alert("Error", err?.response?.data?.error || err.message);
    } finally {
      setCreating(false);
    }
  }

  const isSelected = (id) => selected.some((p) => p.id === id);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.pink} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          New Group
        </Text>
        <View style={{ width: 20 }} />
      </View>

      <TextInput
        style={[
          styles.nameInput,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
        placeholder="Group name"
        placeholderTextColor={colors.textMuted}
        value={groupName}
        onChangeText={setGroupName}
      />

      {selected.length > 0 && (
        <View style={styles.selectedRow}>
          <FlatList
            horizontal
            data={selected}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.selectedChip}
                onPress={() => toggleSelect(item)}
              >
                <View style={[styles.avatar, { backgroundColor: colors.pink }]}>
                  <Text style={styles.avatarText}>
                    {item.username.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View
                  style={[
                    styles.removeBadge,
                    { backgroundColor: colors.danger },
                  ]}
                >
                  <Ionicons name="close" size={10} color="#fff" />
                </View>
                <Text
                  style={[styles.selectedLabel, { color: colors.textMuted }]}
                  numberOfLines={1}
                >
                  {item.username}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      <TextInput
        style={[
          styles.searchInput,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
        placeholder="Search by username to add"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        value={query}
        onChangeText={handleChangeText}
      />

      {searching ? (
        <ActivityIndicator style={{ marginTop: 20 }} color={colors.pink} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 12 }}
          renderItem={({ item }) => {
            const selectedNow = isSelected(item.id);
            return (
              <TouchableOpacity
                style={styles.row}
                onPress={() => toggleSelect(item)}
              >
                <View style={[styles.avatar, { backgroundColor: colors.pink }]}>
                  <Text style={styles.avatarText}>
                    {item.username.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <Text
                  style={[styles.username, { color: colors.text, flex: 1 }]}
                >
                  @{item.username}
                </Text>
                <Ionicons
                  name={selectedNow ? "checkmark-circle" : "ellipse-outline"}
                  size={22}
                  color={selectedNow ? colors.pink : colors.border}
                />
              </TouchableOpacity>
            );
          }}
        />
      )}

      <TouchableOpacity
        style={[
          styles.createBtn,
          { backgroundColor: colors.pink, opacity: creating ? 0.6 : 1 },
        ]}
        onPress={handleCreate}
        disabled={creating}
      >
        <Text style={styles.createBtnText}>
          {creating
            ? "Creating..."
            : `Create Group${selected.length ? ` (${selected.length})` : ""}`}
        </Text>
      </TouchableOpacity>
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
  nameInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    margin: 16,
    marginBottom: 8,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  selectedRow: { marginBottom: 8 },
  selectedChip: { alignItems: "center", width: 56 },
  removeBadge: {
    position: "absolute",
    top: -2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedLabel: { fontSize: 10, marginTop: 4 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  username: { fontSize: 14, fontWeight: "600" },
  createBtn: {
    margin: 16,
    borderRadius: 24,
    padding: 15,
    alignItems: "center",
  },
  createBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
