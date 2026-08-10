import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Use your computer's LAN IP when testing on a physical device (not "localhost").
// Find it with `ipconfig` on Windows (look for IPv4 Address, something like 192.168.x.x).
// export const BASE_URL = "http://192.168.1.12:5000";
export const BASE_URL = 'http://192.168.1.11:5000';

const api = axios.create({ baseURL: `${BASE_URL}/api` });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("flare_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const AuthAPI = {
  requestOtp: (phone) => api.post("/auth/request-otp", { phone }),
  verifyOtp: (payload) => api.post("/auth/verify-otp", payload), // { phone, code, publicKey, ageConfirmed }
  updateProfile: (payload) => api.patch("/auth/profile", payload), // { username, avatarUrl, about }
  me: () => api.get("/auth/me"),
  search: (q) => api.get("/auth/search", { params: { q } }),
};

export const ChatAPI = {
  list: () => api.get("/chats"),
  getStreaks: () => api.get('/chats/streaks'),
  getOrCreateDirect: (userId) => api.post("/chats/direct", { userId }),
  createGroup: (groupName, participantIds) =>
    api.post("/chats/group", { groupName, participantIds }),
  setDisappearing: (chatId, enabled, expiryDuration) =>
    api.post("/chats/disappearing", { chatId, enabled, expiryDuration }),
};

export const MessageAPI = {
  send: (payload) => api.post("/messages", payload),
  list: (chatId, before) =>
    api.get(`/messages/${chatId}`, { params: { before } }),
  markRead: (messageIds) => api.post("/messages/read", { messageIds }),
  react: (messageId, emoji) =>
    api.post("/messages/react", { messageId, emoji }),
  upload: (formData) =>
    api.post("/messages/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export const MatchAPI = {
  deck: () => api.get("/matches/deck"),
  swipe: (swipedUserId, direction) =>
    api.post("/matches/swipe", { swipedUserId, direction }),
  list: () => api.get("/matches"),
  upsertProfile: (payload) => api.post("/matches/profile", payload),
  getMyProfile: () => api.get("/matches/profile/me"), // ADD THIS LINE
};

export const StatusAPI = {
  feed: () => api.get("/status"),
  create: (mediaUrl, caption) => api.post("/status", { mediaUrl, caption }),
  view: (statusId) => api.post("/status/view", { statusId }),
};

export const CallAPI = {
  log: (payload) => api.post("/calls", payload),
  history: () => api.get("/calls"),
};
export const BlockAPI = {
  list: () => api.get('/blocks'),
  block: (userId) => api.post('/blocks', { userId }),
  unblock: (userId) => api.post('/blocks/unblock', { userId }),
};
export default api;
