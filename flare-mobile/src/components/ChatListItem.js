import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

export default function ChatListItem({ chat, onPress }) {
  const { colors } = useTheme();
  const { user } = useAuth();

  const otherParticipant = chat.isGroup
    ? null
    : chat.participants.find((p) => p.user.id !== user.id)?.user;

  const displayName = chat.isGroup
    ? chat.groupName
    : otherParticipant?.username || "Unknown";
  const initials = displayName?.slice(0, 2).toUpperCase() || "?";

  const lastMessage = chat.messages?.[0];
  const preview = lastMessage ? "🔒 Encrypted message" : "Say hi 👋"; // we can't preview ciphertext without decrypting
  const time = lastMessage
    ? new Date(lastMessage.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const streakCount = chat.streak?.currentCount || 0;

  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={[styles.avatar, { backgroundColor: colors.pink }]}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.meta}>
        <View style={styles.topRow}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={[styles.time, { color: colors.textMuted }]}>{time}</Text>
        </View>
        <View style={styles.bottomRow}>
          <Text
            style={[styles.preview, { color: colors.textMuted }]}
            numberOfLines={1}
          >
            {preview}
          </Text>
          {streakCount > 0 && (
            <Text style={[styles.streak, { color: colors.violet }]}>
              🔥 {streakCount}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  meta: { flex: 1, minWidth: 0 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: { fontSize: 14.5, fontWeight: "600", flexShrink: 1 },
  time: { fontSize: 11 },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 3,
  },
  preview: { fontSize: 13, flex: 1 },
  streak: { fontSize: 11, fontWeight: "600", marginLeft: 8 },
});
