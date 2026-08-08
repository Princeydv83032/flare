import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthAPI } from "../services/api";
import { getOrCreateKeyPair } from "../services/encryption";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem("flare_token");
      if (token) {
        try {
          const { data } = await AuthAPI.me();
          setUser(data.user);
        } catch (err) {
          await AsyncStorage.removeItem("flare_token");
        }
      }
      setLoading(false);
    })();
  }, []);

  // Step 1: request an OTP for a phone number
  async function requestOtp(phone) {
    await AuthAPI.requestOtp(phone);
  }

  // Step 2: verify the OTP. Generates a device keypair first (safe to call
  // repeatedly - getOrCreateKeyPair reuses an existing one if present).
  async function verifyOtp(phone, code, ageConfirmed) {
    const { publicKey } = await getOrCreateKeyPair();
    const { data } = await AuthAPI.verifyOtp({
      phone,
      code,
      publicKey,
      ageConfirmed,
    });
    await AsyncStorage.setItem("flare_token", data.token);
    setUser(data.user);
    return data; // { token, isNewUser, user }
  }

  async function updateProfile(payload) {
    const { data } = await AuthAPI.updateProfile(payload);
    setUser(data.user);
    return data.user;
  }

  async function logout() {
    await AsyncStorage.removeItem("flare_token");
    setUser(null);
    // Note: we deliberately do NOT delete the on-device private key on logout,
    // so re-logging in on the same device can still decrypt old messages.
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, requestOtp, verifyOtp, updateProfile, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
