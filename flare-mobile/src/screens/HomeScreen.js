import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

export default function HomeScreen() {
  const { colors } = useTheme();
  const { user, logout } = useAuth();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={[styles.avatar, { backgroundColor: colors.pink }]}>
        <Text style={styles.avatarText}>
          {user?.username?.[0]?.toUpperCase() || "?"}
        </Text>
      </View>

      <Text style={[styles.title, { color: colors.text }]}>
        You're logged in! 🎉
      </Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        @{user?.username}
      </Text>
      <Text style={[styles.detail, { color: colors.textSecondary }]}>
        {user?.phone}
      </Text>

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: colors.card, borderColor: colors.borderAccent },
        ]}
        onPress={logout}
      >
        <Text style={[styles.buttonText, { color: colors.pink }]}>Log out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatarText: { color: "#fff", fontSize: 28, fontWeight: "700" },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 6 },
  subtitle: { fontSize: 15, marginBottom: 4 },
  detail: { fontSize: 13, marginBottom: 32 },
  button: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  buttonText: { fontWeight: "600", fontSize: 14 },
});
