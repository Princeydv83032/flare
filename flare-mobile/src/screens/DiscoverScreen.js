import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { MatchAPI } from "../services/api";

export default function DiscoverScreen({ navigation }) {
  const { colors } = useTheme();
  const [deck, setDeck] = useState([]);
  const [loading, setLoading] = useState(true);
  const [swiping, setSwiping] = useState(false);
  const [matchModal, setMatchModal] = useState(null); // holds match data when shown

  const loadDeck = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await MatchAPI.deck();
      setDeck(data.profiles);
    } catch (err) {
      console.log("Failed to load deck:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDeck();
  }, [loadDeck]);

  const currentProfile = deck[0];

  async function handleSwipe(direction) {
    if (!currentProfile || swiping) return;
    setSwiping(true);
    try {
      const { data } = await MatchAPI.swipe(currentProfile.user.id, direction);
      setDeck((prev) => prev.slice(1)); // remove the swiped card regardless of outcome

      if (data.matched) {
        setMatchModal({ chatId: data.chatId, otherUser: data.otherUser });
      }
    } catch (err) {
      Alert.alert("Error", err?.response?.data?.error || err.message);
    } finally {
      setSwiping(false);
    }
  }

  function handleGoToChat() {
    const { chatId, otherUser } = matchModal;
    setMatchModal(null);
    navigation.navigate("ChatThread", {
      chatId,
      participants: [otherUser],
      isGroup: false,
      groupName: "",
      streakCount: 0,
    });
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Discover
        </Text>
      </View>

      <View style={styles.deckArea}>
        {loading ? (
          <ActivityIndicator color={colors.pink} />
        ) : !currentProfile ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No more profiles right now
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              Check back later, or make sure Dating mode is on in your profile.
            </Text>
            <TouchableOpacity
              style={[styles.refreshBtn, { borderColor: colors.borderAccent }]}
              onPress={loadDeck}
            >
              <Text
                style={{ color: colors.pink, fontSize: 13, fontWeight: "600" }}
              >
                Refresh
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View
              style={[
                styles.photoPlaceholder,
                { backgroundColor: colors.pink },
              ]}
            >
              <Text style={styles.photoInitials}>
                {currentProfile.user.username.slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={[styles.cardName, { color: colors.text }]}>
                @{currentProfile.user.username}
              </Text>
              {currentProfile.bio ? (
                <Text style={[styles.cardBio, { color: colors.textSecondary }]}>
                  {currentProfile.bio}
                </Text>
              ) : null}
            </View>
          </View>
        )}
      </View>

      {currentProfile && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              styles.passBtn,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => handleSwipe("PASS")}
            disabled={swiping}
          >
            <Ionicons name="close" size={26} color={colors.coral} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionBtn,
              styles.likeBtn,
              { backgroundColor: colors.pink },
            ]}
            onPress={() => handleSwipe("LIKE")}
            disabled={swiping}
          >
            <Ionicons name="heart" size={28} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionBtn,
              styles.passBtn,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => handleSwipe("SUPER_LIKE")}
            disabled={swiping}
          >
            <Ionicons name="star" size={22} color="#F0C927" />
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={!!matchModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text style={styles.modalEmoji}>🎉</Text>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              It's a Match!
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
              You and this person both liked each other.
            </Text>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: colors.pink }]}
              onPress={handleGoToChat}
            >
              <Text style={styles.modalBtnText}>Say hi 👋</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMatchModal(null)}
              style={{ marginTop: 12 }}
            >
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                Keep swiping
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 22, fontWeight: "700" },
  deckArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    aspectRatio: 0.75,
    borderRadius: 24,
    overflow: "hidden",
  },
  photoPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  photoInitials: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 64,
    fontWeight: "700",
  },
  cardInfo: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 20 },
  cardName: { fontSize: 22, fontWeight: "700", color: "#fff" },
  cardBio: { fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 6 },
  actions: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 22,
    paddingVertical: 24,
  },
  actionBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },
  passBtn: { borderWidth: 1 },
  likeBtn: { width: 62, height: 62, borderRadius: 31 },
  emptyState: { alignItems: "center", paddingHorizontal: 20 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
    textAlign: "center",
  },
  emptySubtitle: { fontSize: 13, textAlign: "center", marginBottom: 20 },
  refreshBtn: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCard: {
    width: "80%",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
  },
  modalEmoji: { fontSize: 44, marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 6 },
  modalSubtitle: { fontSize: 13, textAlign: "center", marginBottom: 20 },
  modalBtn: { borderRadius: 24, paddingVertical: 12, paddingHorizontal: 32 },
  modalBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
