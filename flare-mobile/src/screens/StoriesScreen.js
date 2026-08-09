import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { StatusAPI, MessageAPI, BASE_URL } from "../services/api";

export default function StoriesScreen({ navigation }) {
  const { colors } = useTheme();
  const { user } = useAuth();

  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const loadFeed = useCallback(async () => {
    try {
      const { data } = await StatusAPI.feed();
      setStatuses(data.statuses);
    } catch (err) {
      console.log("Failed to load stories:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFeed();
    }, [loadFeed]),
  );

  // Group statuses by user, so each person shows one ring even with multiple stories
  const groupedByUser = statuses.reduce((acc, status) => {
    const uid = status.user.id;
    if (!acc[uid]) acc[uid] = { user: status.user, stories: [] };
    acc[uid].stories.push(status);
    return acc;
  }, {});
  const groups = Object.values(groupedByUser);

  async function handleAddStory() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      return Alert.alert(
        "Permission needed",
        "We need camera access to add a story.",
      );
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.6,
      allowsEditing: true,
      aspect: [9, 16],
    });

    if (result.canceled) return;

    setUploading(true);
    try {
      const asset = result.assets[0];
      const formData = new FormData();
      formData.append("file", {
        uri: asset.uri,
        name: "story.jpg",
        type: "image/jpeg",
      });
      const { data: uploadData } = await MessageAPI.upload(formData);

      await StatusAPI.create(`${BASE_URL}${uploadData.url}`, "");
      loadFeed();
    } catch (err) {
      Alert.alert(
        "Failed to post story",
        err?.response?.data?.error || err.message,
      );
    } finally {
      setUploading(false);
    }
  }

  function openViewer(group) {
    navigation.navigate("StoryViewer", {
      stories: group.stories,
      author: group.user,
    });
  }

  const myGroup = groups.find((g) => g.user.id === user.id);
  const otherGroups = groups.filter((g) => g.user.id !== user.id);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Stories
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.pink} />
      ) : (
        <FlatList
          data={otherGroups}
          keyExtractor={(item) => item.user.id}
          numColumns={3}
          contentContainerStyle={{ padding: 12 }}
          ListHeaderComponent={
            <TouchableOpacity
              style={styles.myStoryRow}
              onPress={myGroup ? () => openViewer(myGroup) : handleAddStory}
            >
              <View style={styles.ringWrap}>
                <View
                  style={[
                    styles.ring,
                    { borderColor: myGroup ? colors.pink : colors.border },
                  ]}
                >
                  <View
                    style={[styles.avatar, { backgroundColor: colors.pink }]}
                  >
                    <Text style={styles.avatarText}>
                      {user.username.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.addBadge,
                    {
                      backgroundColor: colors.pink,
                      borderColor: colors.background,
                    },
                  ]}
                  onPress={handleAddStory}
                  disabled={uploading}
                >
                  {uploading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="add" size={14} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
              <Text style={[styles.myStoryLabel, { color: colors.text }]}>
                {myGroup ? "Your story" : "Add to story"}
              </Text>
            </TouchableOpacity>
          }
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No stories from others yet.
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.gridItem}
              onPress={() => openViewer(item)}
            >
              <View style={[styles.ring, { borderColor: colors.pink }]}>
                <View
                  style={[styles.avatar, { backgroundColor: colors.violet }]}
                >
                  <Text style={styles.avatarText}>
                    {item.user.username.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text
                style={[styles.gridLabel, { color: colors.text }]}
                numberOfLines={1}
              >
                @{item.user.username}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 22, fontWeight: "700" },
  myStoryRow: { alignItems: "center", marginBottom: 20 },
  ringWrap: { position: "relative" },
  ring: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  addBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  myStoryLabel: { fontSize: 12, fontWeight: "600", marginTop: 6 },
  gridItem: { width: "33%", alignItems: "center", marginBottom: 20 },
  gridLabel: { fontSize: 11, fontWeight: "600", marginTop: 6, maxWidth: 80 },
  emptyText: { textAlign: "center", marginTop: 20, fontSize: 13 },
});
