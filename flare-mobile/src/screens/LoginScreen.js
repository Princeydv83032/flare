import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen() {
  const { colors } = useTheme();
  const { t, lang, changeLanguage } = useLanguage();
  const { requestOtp, verifyOtp } = useAuth();

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Guards against double-taps firing two requests before React re-renders
  // the disabled button - state updates are async, a ref is instant.
  const submittingRef = useRef(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function handleSendOtp() {
    if (submittingRef.current || loading || cooldown > 0) return; // hard guard
    if (!phone)
      return Alert.alert(
        "Missing phone number",
        "Please enter your phone number",
      );

    submittingRef.current = true;
    setLoading(true);
    try {
      await requestOtp(phone);
      setOtpSent(true);
      setCooldown(30); // can't resend for 30s, standard OTP UX
    } catch (err) {
      Alert.alert("Error", err?.response?.data?.error || err.message);
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  }

  async function handleVerify() {
    if (submittingRef.current || loading) return; // hard guard
    if (!code)
      return Alert.alert(
        "Missing code",
        "Please enter the code sent to your phone",
      );
    if (!ageConfirmed)
      return Alert.alert(
        "Age confirmation required",
        "Please confirm you are 18 or older",
      );

    submittingRef.current = true;
    setLoading(true);
    try {
      await verifyOtp(phone, code, ageConfirmed);
    } catch (err) {
      Alert.alert(
        "Verification failed",
        err?.response?.data?.error || err.message,
      );
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableOpacity
        style={[
          styles.langToggle,
          { borderColor: colors.border, backgroundColor: colors.surface },
        ]}
        onPress={() => changeLanguage(lang === "en" ? "hi" : "en")}
      >
        <Text style={{ color: colors.text, fontSize: 12 }}>
          {lang === "en" ? "EN / हिंदी" : "हिंदी / EN"}
        </Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: colors.text }]}>{t("welcome")}</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        {otpSent ? `${t("codeSentTo")} ${phone}` : t("phoneNumber")}
      </Text>

      {!otpSent ? (
        <>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="+91 98765 43210"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            editable={!loading}
          />
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: colors.pink, opacity: loading ? 0.6 : 1 },
            ]}
            onPress={handleSendOtp}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Sending..." : t("sendOtp")}
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="4-digit code"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            maxLength={4}
            value={code}
            onChangeText={setCode}
            editable={!loading}
          />

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setAgeConfirmed(!ageConfirmed)}
            disabled={loading}
          >
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: colors.pink,
                  backgroundColor: ageConfirmed ? colors.pink : "transparent",
                },
              ]}
            />
            <Text
              style={[styles.checkboxLabel, { color: colors.textSecondary }]}
            >
              {t("ageConfirm")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: colors.pink, opacity: loading ? 0.6 : 1 },
            ]}
            onPress={handleVerify}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Verifying..." : t("verifyContinue")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSendOtp}
            disabled={loading || cooldown > 0}
            style={{ marginTop: 14 }}
          >
            <Text
              style={{
                color: cooldown > 0 ? colors.textMuted : colors.pink,
                fontSize: 12,
                textAlign: "center",
              }}
            >
              {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.note, { color: colors.textMuted }]}>
            {t("noIdRequired")}
          </Text>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", paddingHorizontal: 28 },
  langToggle: {
    position: "absolute",
    top: 60,
    right: 24,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 4 },
  subtitle: { fontSize: 13, marginBottom: 28 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    marginBottom: 16,
  },
  button: { borderRadius: 24, padding: 15, alignItems: "center", marginTop: 4 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  checkboxRow: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    marginRight: 10,
  },
  checkboxLabel: { fontSize: 12.5, flex: 1 },
  note: { fontSize: 11, textAlign: "center", marginTop: 14 },
});
