// Custom fonts loaded via expo-font in app/_layout.tsx.
// Display = Barlow Condensed (timers, big metrics). Text = IBM Plex Sans (body).

export const fontAssets = {
  "BarlowCondensed-Regular": require("../assets/fonts/BarlowCondensed-Regular.ttf"),
  "BarlowCondensed-Medium": require("../assets/fonts/BarlowCondensed-Medium.ttf"),
  "BarlowCondensed-SemiBold": require("../assets/fonts/BarlowCondensed-SemiBold.ttf"),
  "BarlowCondensed-Bold": require("../assets/fonts/BarlowCondensed-Bold.ttf"),
  "IBMPlexSans-Regular": require("../assets/fonts/IBMPlexSans-Regular.ttf"),
  "IBMPlexSans-Medium": require("../assets/fonts/IBMPlexSans-Medium.ttf"),
  "IBMPlexSans-SemiBold": require("../assets/fonts/IBMPlexSans-SemiBold.ttf"),
  "IBMPlexSans-Bold": require("../assets/fonts/IBMPlexSans-Bold.ttf"),
};

export const fonts = {
  display: {
    regular: "BarlowCondensed-Regular",
    medium: "BarlowCondensed-Medium",
    semibold: "BarlowCondensed-SemiBold",
    bold: "BarlowCondensed-Bold",
  },
  text: {
    regular: "IBMPlexSans-Regular",
    medium: "IBMPlexSans-Medium",
    semibold: "IBMPlexSans-SemiBold",
    bold: "IBMPlexSans-Bold",
  },
} as const;
