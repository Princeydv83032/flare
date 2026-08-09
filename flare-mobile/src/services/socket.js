import { io } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "./api";

let socket = null;

export async function connectSocket() {
  if (socket?.connected) return socket;

  const token = await AsyncStorage.getItem("flare_token");
  socket = io(BASE_URL, { auth: { token }, transports: ["websocket"] });
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
