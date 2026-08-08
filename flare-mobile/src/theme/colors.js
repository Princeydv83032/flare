// Flare's color system. Screens should never hardcode hex values directly —
// always pull from here via useTheme(), so light/dark switching works everywhere at once.

export const lightColors = {
  background: "#F6EEE9",
  surface: "#FFFFFF",
  card: "#F5EBE7",
  cardAccent: "rgba(255,46,147,0.10)",
  border: "rgba(26,16,21,0.08)",
  borderAccent: "rgba(214,18,122,0.35)",

  text: "#1A1015",
  textSecondary: "#6B5F63",
  textMuted: "#8F8388",

  pink: "#D6127A",
  violet: "#6B3FD1",
  coral: "#FF6B4A",

  gradientStart: "#FF6B4A",
  gradientMid: "#FF2E93",
  gradientEnd: "#7B2FF7",

  online: "#0FA37B",
  danger: "#E0473E",

  statusBarStyle: "dark",
};

export const darkColors = {
  background: "#0A0910",
  surface: "#131019",
  card: "#1C1822",
  cardAccent: "rgba(255,46,147,0.18)",
  border: "rgba(255,255,255,0.07)",
  borderAccent: "rgba(255,46,147,0.4)",

  text: "#FFF6F2",
  textSecondary: "#9C919C",
  textMuted: "#55505C",

  pink: "#FF6FB0",
  violet: "#B79CFA",
  coral: "#FF8A6B",

  gradientStart: "#FF6B4A",
  gradientMid: "#FF2E93",
  gradientEnd: "#7B2FF7",

  online: "#34D399",
  danger: "#F87171",

  statusBarStyle: "light",
};

export const gradientColors = ["#FF6B4A", "#FF2E93", "#7B2FF7"];
