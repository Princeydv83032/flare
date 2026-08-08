import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { MessageAPI, MatchAPI, BASE_URL } from "../services/api";

const MODES = [
  { key: "chat", label: "Just chatting with friends", visible: false },
  { key: "both", label: "Chatting & dating", visible: true },
  { key: "dating", label: "Just dating", visible: true },
];

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const { user, updateProfile } = useAuth();

  const [username, setUsername] = useState(
    user?.username?.startsWith("user_") ? "" : user?.username || "",
  );
  const [avatarUri, setAvatarUri] = useState(null); // local preview
  const [avatarUrl, setAvatarUrl] = useState(""); // uploaded URL
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState("both");
  const [loading, setLoading] = useState(false);

  async function pickAvatar() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return Alert.alert(
        "Permission needed",
        "We need photo library access to set your avatar.",
      );
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    setAvatarUri(asset.uri);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", {
        uri: asset.uri,
        name: "avatar.jpg",
        type: "image/jpeg",
      });
      const { data } = await MessageAPI.upload(formData);
      setAvatarUrl(`${BASE_URL}${data.url}`);
    } catch (err) {
      Alert.alert("Upload failed", "Could not upload photo, please try again.");
      setAvatarUri(null);
    } finally {
      setUploading(false);
    }
  }

  async function handleContinue() {
    if (!username.trim())
      return Alert.alert("Username required", "Please choose a username.");
    if (username.length < 3)
      return Alert.alert(
        "Too short",
        "Username must be at least 3 characters.",
      );

    setLoading(true);
    try {
      await updateProfile({
        username: username.trim(),
        avatarUrl: avatarUrl || undefined,
        onboarded: true,
      });

      const selectedMode = MODES.find((m) => m.key === mode);
      if (selectedMode.visible) {
        await MatchAPI.upsertProfile({
          visible: true,
          bio: "",
          photos: avatarUrl ? [avatarUrl] : [],
        });
      }
      // Navigation happens automatically once AppNavigator sees user.onboarded === true
    } catch (err) {
      Alert.alert("Error", err?.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
    >
      <Text style={[styles.title, { color: colors.text }]}>
        Build your profile
      </Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        Add a photo so people know it's you
      </Text>

      <TouchableOpacity
        style={[
          styles.avatarPicker,
          { borderColor: colors.borderAccent, backgroundColor: colors.card },
        ]}
        onPress={pickAvatar}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator color={colors.pink} />
        ) : avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
        ) : (
          <Text style={{ color: colors.pink, fontSize: 24 }}>+</Text>
        )}
      </TouchableOpacity>

      <Text style={[styles.label, { color: colors.textMuted }]}>Username</Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
        placeholder="yourname"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />

      <Text style={[styles.label, { color: colors.textMuted, marginTop: 20 }]}>
        I'm here for
      </Text>
      <View style={{ gap: 8, marginTop: 8 }}>
        {MODES.map((m) => (
          <TouchableOpacity
            key={m.key}
            style={[
              styles.modeCard,
              {
                backgroundColor:
                  mode === m.key ? colors.cardAccent : colors.card,
                borderColor: mode === m.key ? colors.pink : colors.border,
              },
            ]}
            onPress={() => setMode(m.key)}
          >
            <Text
              style={{
                color: mode === m.key ? colors.pink : colors.textSecondary,
                fontSize: 13,
              }}
            >
              {m.label}
            </Text>
            <View
              style={[
                styles.radioOuter,
                { borderColor: mode === m.key ? colors.pink : colors.border },
              ]}
            >
              {mode === m.key && (
                <View
                  style={[styles.radioInner, { backgroundColor: colors.pink }]}
                />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: colors.pink, opacity: loading ? 0.6 : 1 },
        ]}
        onPress={handleContinue}
        disabled={loading || uploading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Saving..." : "Continue →"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 28, paddingTop: 70 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 4 },
  subtitle: { fontSize: 13, marginBottom: 24 },
  avatarPicker: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 28,
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%" },
  label: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    marginTop: 8,
  },
  modeCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: { width: 9, height: 9, borderRadius: 4.5 },
  button: {
    borderRadius: 24,
    padding: 16,
    alignItems: "center",
    marginTop: 32,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
