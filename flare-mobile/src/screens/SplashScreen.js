import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useTheme } from "../context/ThemeContext";

export default function SplashScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.mark, { backgroundColor: colors.pink }]}>
        <Text style={styles.markText}>F</Text>
      </View>
      <Text style={[styles.title, { color: colors.text }]}>Flare</Text>
      <Text style={[styles.tagline, { color: colors.textMuted }]}>
        Spark it. Snap it. Say it.
      </Text>
      <ActivityIndicator
        size="small"
        color={colors.pink}
        style={{ marginTop: 24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  mark: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  markText: { color: "#fff", fontSize: 28, fontWeight: "700" },
  title: { fontSize: 26, fontWeight: "700", letterSpacing: -0.5 },
  tagline: {
    fontSize: 13,
    marginTop: 6,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
