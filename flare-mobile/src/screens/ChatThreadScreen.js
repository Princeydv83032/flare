import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { MessageAPI } from "../services/api";
import { getSocket } from "../services/socket";
import {
  getMyPrivateKey,
  encryptMessage,
  decryptMessage,
} from "../services/encryption";
import MessageBubble from "../components/MessageBubble";

export default function ChatThreadScreen({ route, navigation }) {
  const { chatId, otherUser, streakCount } = route.params;
  const { colors } = useTheme();
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [otherOnline, setOtherOnline] = useState(otherUser?.online || false);

  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const mySecretKeyRef = useRef(null);

  const scrollToEnd = useCallback((animated = true) => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated }), 80);
  }, []);

  // iOS only - Android handles keyboard resize natively via
  // "softwareKeyboardLayoutMode": "resize" in app.json instead.
  useEffect(() => {
    if (Platform.OS !== "ios") return;
    const showSub = Keyboard.addListener("keyboardWillShow", () =>
      scrollToEnd(true),
    );
    return () => showSub.remove();
  }, [scrollToEnd]);

  const decryptOne = useCallback(
    async (msg) => {
      const senderIsMe = msg.sender.id === user.id;
      const senderPublicKey = senderIsMe ? user.publicKey : otherUser.publicKey;
      const myKey = msg.keys?.[0];

      if (!myKey) return { ...msg, text: "", failed: true };

      try {
        const plaintext = decryptMessage({
          ciphertext: msg.ciphertext,
          iv: msg.iv,
          myEncryptedKey: myKey.encryptedKey,
          senderPublicKey,
          mySecretKeyB64: mySecretKeyRef.current,
        });
        return msg.type === "IMAGE"
          ? { ...msg, imageBase64: plaintext, failed: false }
          : { ...msg, text: plaintext, failed: false };
      } catch (err) {
        return { ...msg, text: "", failed: true };
      }
    },
    [user, otherUser],
  );

  useEffect(() => {
    (async () => {
      mySecretKeyRef.current = await getMyPrivateKey();
      try {
        const { data } = await MessageAPI.list(chatId);
        const decrypted = await Promise.all(data.messages.map(decryptOne));
        setMessages(decrypted);
      } catch (err) {
        console.log("Failed to load messages:", err.message);
      } finally {
        setLoading(false);
        scrollToEnd(false);
      }
    })();
  }, [chatId, decryptOne, scrollToEnd]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit("chat:join", chatId);

    async function handleNewMessage({ chatId: incomingChatId, message }) {
      if (incomingChatId !== chatId) return;
      const decrypted = await decryptOne(message);
      setMessages((prev) => {
        if (prev.some((m) => m.id === decrypted.id)) return prev;
        return [...prev, decrypted];
      });
      scrollToEnd(true);
    }

    function handleTypingStart({ chatId: incomingChatId, userId }) {
      if (incomingChatId === chatId && userId === otherUser?.id)
        setOtherTyping(true);
    }
    function handleTypingStop({ chatId: incomingChatId, userId }) {
      if (incomingChatId === chatId && userId === otherUser?.id)
        setOtherTyping(false);
    }
    function handlePresence({ userId, online }) {
      if (userId === otherUser?.id) setOtherOnline(online);
    }

    socket.on("message:new", handleNewMessage);
    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);
    socket.on("presence:update", handlePresence);

    return () => {
      socket.emit("chat:leave", chatId);
      socket.off("message:new", handleNewMessage);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
      socket.off("presence:update", handlePresence);
    };
  }, [chatId, otherUser, decryptOne, scrollToEnd]);

  function handleTextChange(value) {
    setText(value);
    const socket = getSocket();
    if (!socket) return;

    socket.emit("typing:start", { chatId });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing:stop", { chatId });
    }, 1500);
  }

  async function sendEncrypted(plaintext, type = "TEXT") {
    const mySecretKey = mySecretKeyRef.current;
    const recipients = [
      { userId: user.id, publicKey: user.publicKey },
      { userId: otherUser.id, publicKey: otherUser.publicKey },
    ];
    const { ciphertext, iv, keys } = encryptMessage(
      plaintext,
      mySecretKey,
      recipients,
    );
    const { data } = await MessageAPI.send({
      chatId,
      type,
      ciphertext,
      iv,
      keys,
    });

    const localMsg =
      type === "IMAGE"
        ? { ...data.message, imageBase64: plaintext, failed: false }
        : { ...data.message, text: plaintext, failed: false };

    setMessages((prev) => [...prev, localMsg]);
    scrollToEnd(true);

    const socket = getSocket();
    socket?.emit("message:new", { chatId, message: data.message });
  }

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setText("");
    getSocket()?.emit("typing:stop", { chatId });

    try {
      await sendEncrypted(trimmed, "TEXT");
    } catch (err) {
      Alert.alert("Failed to send", err?.response?.data?.error || err.message);
      setText(trimmed);
    } finally {
      setSending(false);
    }
  }

  async function handlePickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return Alert.alert(
        "Permission needed",
        "We need photo library access to send images.",
      );
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
      base64: true,
    });

    if (result.canceled || !result.assets?.[0]?.base64) return;

    setSending(true);
    try {
      await sendEncrypted(result.assets[0].base64, "IMAGE");
    } catch (err) {
      Alert.alert(
        "Failed to send image",
        err?.response?.data?.error || err.message,
      );
    } finally {
      setSending(false);
    }
  }

  const displayName = otherUser?.username || "Chat";
  const initials = displayName.slice(0, 2).toUpperCase();

  const messageList = loading ? (
    <ActivityIndicator style={{ marginTop: 40 }} color={colors.pink} />
  ) : (
    <FlatList
      ref={flatListRef}
      data={messages}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 14 }}
      onContentSizeChange={() => scrollToEnd(false)}
      renderItem={({ item }) => (
        <MessageBubble
          text={item.text}
          imageBase64={item.imageBase64}
          type={item.type}
          failed={item.failed}
          isMine={item.sender.id === user.id}
          time={new Date(item.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        />
      )}
    />
  );

  const inputBar = (
    <View
      style={[
        styles.inputBar,
        { borderTopColor: colors.border, backgroundColor: colors.background },
      ]}
    >
      <TouchableOpacity
        style={[styles.attachBtn, { backgroundColor: colors.card }]}
        onPress={handlePickImage}
        disabled={sending}
      >
        <Ionicons name="image-outline" size={20} color={colors.pink} />
      </TouchableOpacity>

      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
        placeholder="Type a message"
        placeholderTextColor={colors.textMuted}
        value={text}
        onChangeText={handleTextChange}
        onFocus={() => scrollToEnd(true)}
        multiline
      />
      <TouchableOpacity
        style={[
          styles.sendBtn,
          { backgroundColor: colors.pink, opacity: text.trim() ? 1 : 0.5 },
        ]}
        onPress={handleSend}
        disabled={!text.trim() || sending}
      >
        {sending ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons name="send" size={16} color="#fff" />
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.pink} />
        </TouchableOpacity>
        <View style={[styles.avatar, { backgroundColor: colors.pink }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerName, { color: colors.text }]}>
            @{displayName}
          </Text>
          <Text
            style={[
              styles.headerStatus,
              { color: otherTyping ? colors.pink : colors.textMuted },
            ]}
          >
            {otherTyping
              ? "typing..."
              : otherOnline
                ? "online"
                : streakCount > 0
                  ? `🔥 ${streakCount}`
                  : ""}
          </Text>
        </View>
      </View>

      {Platform.OS === "ios" ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior="padding"
          keyboardVerticalOffset={90}
        >
          {messageList}
          {inputBar}
        </KeyboardAvoidingView>
      ) : (
        <View style={{ flex: 1 }}>
          {messageList}
          {inputBar}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  headerName: { fontSize: 14.5, fontWeight: "600" },
  headerStatus: { fontSize: 11, fontWeight: "600" },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    padding: 10,
    borderTopWidth: 1,
  },
  attachBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14.5,
    maxHeight: 100,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
});
