import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusAPI } from "../services/api";

const { width } = Dimensions.get("window");
const STORY_DURATION = 5000; // 5s per story, Snap/Instagram-style

export default function StoryViewerScreen({ route, navigation }) {
  const { stories, author } = route.params;
  const [index, setIndex] = useState(0);
  const progressAnims = useRef(
    stories.map(() => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    StatusAPI.view(stories[index].id).catch(() => {});

    progressAnims[index].setValue(0);
    const animation = Animated.timing(progressAnims[index], {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    });
    animation.start(({ finished }) => {
      if (finished) goNext();
    });

    return () => animation.stop();
  }, [index]);

  function goNext() {
    if (index < stories.length - 1) {
      setIndex((i) => i + 1);
    } else {
      navigation.goBack();
    }
  }

  function goPrev() {
    if (index > 0) setIndex((i) => i - 1);
  }

  const current = stories[index];

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: current.mediaUrl }}
        style={styles.image}
        resizeMode="cover"
      />

      <SafeAreaView style={styles.overlay} edges={["top"]}>
        <View style={styles.progressRow}>
          {stories.map((_, i) => (
            <View key={i} style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width:
                      i < index
                        ? "100%"
                        : i === index
                          ? progressAnims[i].interpolate({
                              inputRange: [0, 1],
                              outputRange: ["0%", "100%"],
                            })
                          : "0%",
                  },
                ]}
              />
            </View>
          ))}
        </View>

        <View style={styles.headerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {author.username.slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.username}>@{author.username}</Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ marginLeft: "auto" }}
          >
            <Ionicons name="close" size={26} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <View style={styles.tapZones}>
        <TouchableOpacity style={{ flex: 1 }} onPress={goPrev} />
        <TouchableOpacity style={{ flex: 1 }} onPress={goNext} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  image: { width, height: "100%" },
  overlay: { position: "absolute", top: 0, left: 0, right: 0 },
  progressRow: {
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  progressTrack: {
    flex: 1,
    height: 2.5,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: "#fff" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FF2E93",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 11 },
  username: { color: "#fff", fontWeight: "600", fontSize: 13.5 },
  tapZones: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
  },
});
