import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";

export default function MessageBubble({
  text,
  isMine,
  time,
  failed,
  type,
  imageBase64,
  senderName,
}) {
  const { colors } = useTheme();

  return (
    <View style={[styles.row, isMine ? styles.rowRight : styles.rowLeft]}>
      <View
        style={[
          styles.bubble,
          type === "IMAGE" && styles.imageBubble,
          isMine
            ? { backgroundColor: colors.pink, borderBottomRightRadius: 4 }
            : { backgroundColor: colors.card, borderBottomLeftRadius: 4 },
        ]}
      >
        {failed ? (
          <Text style={[styles.text, { color: isMine ? "#fff" : colors.text }]}>
            ⚠️ Could not decrypt
          </Text>
        ) : type === "IMAGE" && imageBase64 ? (
          <Image
            source={{ uri: `data:image/jpeg;base64,${imageBase64}` }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <Text style={[styles.text, { color: isMine ? "#fff" : colors.text }]}>
            {text}
          </Text>
        )}
      </View>
      <Text
        style={[
          styles.time,
          { color: colors.textMuted },
          isMine ? styles.timeRight : styles.timeLeft,
        ]}
      >
        {time}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginVertical: 3, maxWidth: "78%" },
  rowLeft: { alignSelf: "flex-start" },
  rowRight: { alignSelf: "flex-end" },
  bubble: { paddingVertical: 9, paddingHorizontal: 13, borderRadius: 16 },
  imageBubble: { padding: 4 },
  image: { width: 200, height: 200, borderRadius: 12 },
  text: { fontSize: 14.5, lineHeight: 19 },
  time: { fontSize: 10, marginTop: 2 },
  timeLeft: { textAlign: "left", marginLeft: 4 },
  timeRight: { textAlign: "right", marginRight: 4 },
});
