import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { MatchAPI } from "../services/api";

export default function ProfileScreen({ navigation }) {
  const { colors, preference, setThemePreference } = useTheme();
  const { lang, changeLanguage, t } = useLanguage();
  const { user, logout } = useAuth();

  const [datingMode, setDatingMode] = useState(false);
  const [savingDating, setSavingDating] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await MatchAPI.getMyProfile();
        setDatingMode(data.profile?.visible || false);
      } catch (err) {
        console.log("Failed to load dating profile:", err.message);
      }
    })();
  }, []);

  async function toggleDatingMode(value) {
    setDatingMode(value);
    setSavingDating(true);
    try {
      await MatchAPI.upsertProfile({ visible: value });
    } catch (err) {
      setDatingMode(!value); // revert on failure
      Alert.alert("Error", err?.response?.data?.error || err.message);
    } finally {
      setSavingDating(false);
    }
  }

  function confirmLogout() {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: logout },
    ]);
  }

  const initials = user?.username?.slice(0, 2).toUpperCase() || "?";

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: colors.pink }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={[styles.username, { color: colors.text }]}>
            @{user?.username}
          </Text>
          <Text style={[styles.phone, { color: colors.textMuted }]}>
            {user?.phone}
          </Text>
        </View>

        {/* Dating */}
        <SectionLabel colors={colors} text="Dating" />
        <SettingRow colors={colors}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowLabel, { color: colors.text }]}>
              Dating mode
            </Text>
            <Text style={[styles.rowSubtext, { color: colors.textMuted }]}>
              Show my profile in Discover
            </Text>
          </View>
          <Switch
            value={datingMode}
            onValueChange={toggleDatingMode}
            disabled={savingDating}
            trackColor={{ false: colors.border, true: colors.pink }}
            thumbColor="#fff"
          />
        </SettingRow>

        {/* Appearance */}
        <SectionLabel colors={colors} text="Appearance" />
        <SettingRow colors={colors} column>
          <Text
            style={[styles.rowLabel, { color: colors.text, marginBottom: 10 }]}
          >
            {t("theme")}
          </Text>
          <View style={styles.segmentGroup}>
            {["light", "dark", "system"].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.segment,
                  {
                    backgroundColor:
                      preference === option ? colors.pink : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setThemePreference(option)}
              >
                <Text
                  style={{
                    color:
                      preference === option ? "#fff" : colors.textSecondary,
                    fontSize: 12.5,
                    fontWeight: "600",
                    textTransform: "capitalize",
                  }}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SettingRow>

        <SettingRow colors={colors} column>
          <Text
            style={[styles.rowLabel, { color: colors.text, marginBottom: 10 }]}
          >
            {t("language")}
          </Text>
          <View style={styles.segmentGroup}>
            {[
              { key: "en", label: "English" },
              { key: "hi", label: "हिंदी" },
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.segment,
                  {
                    backgroundColor:
                      lang === option.key ? colors.pink : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => changeLanguage(option.key)}
              >
                <Text
                  style={{
                    color: lang === option.key ? "#fff" : colors.textSecondary,
                    fontSize: 12.5,
                    fontWeight: "600",
                  }}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SettingRow>

        {/* Account */}
        <SectionLabel colors={colors} text="Account" />
        <TouchableOpacity
          style={[styles.linkRow, { borderBottomColor: colors.border }]}
        >
          <Text style={[styles.rowLabel, { color: colors.text }]}>
            Privacy & safety
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity
  style={[styles.linkRow, { borderBottomColor: colors.border }]}
  onPress={() => navigation.navigate('BlockedAccounts')}
>
  <Text style={[styles.rowLabel, { color: colors.text }]}>Blocked accounts</Text>
  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
</TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.logoutBtn,
            { backgroundColor: colors.card, borderColor: colors.borderAccent },
          ]}
          onPress={confirmLogout}
        >
          <Text style={{ color: colors.pink, fontWeight: "700", fontSize: 14 }}>
            {t("logOut")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionLabel({ colors, text }) {
  return (
    <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
      {text}
    </Text>
  );
}

function SettingRow({ colors, children, column }) {
  return (
    <View
      style={[
        styles.settingRow,
        {
          backgroundColor: colors.card,
          flexDirection: column ? "column" : "row",
          alignItems: column ? "stretch" : "center",
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: "center", paddingVertical: 24 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: { color: "#fff", fontSize: 26, fontWeight: "700" },
  username: { fontSize: 17, fontWeight: "700" },
  phone: { fontSize: 13, marginTop: 3 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 8,
  },
  settingRow: {
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  rowLabel: { fontSize: 14.5, fontWeight: "600" },
  rowSubtext: { fontSize: 12, marginTop: 2 },
  segmentGroup: { flexDirection: "row", gap: 8 },
  segment: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: "center",
  },
  linkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  logoutBtn: {
    marginHorizontal: 16,
    marginTop: 28,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: "center",
  },
});
