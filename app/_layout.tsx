import { useFonts } from "expo-font";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from "react-native";
import "react-native-reanimated";

import { RankingProvider } from "@/context/RankingContext";
import { AppThemeProvider, useAppTheme } from "@/context/ThemeContext";

export {
    // Catch any errors thrown by the Layout component.
    ErrorBoundary
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const [showBrandSplash, setShowBrandSplash] = useState(true);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      const timer = setTimeout(() => setShowBrandSplash(false), 1100);
      return () => clearTimeout(timer);
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  if (showBrandSplash) {
    return <BrandSplash />;
  }

  return <RootLayoutNav />;
}

function BrandSplash() {
  return (
    <View style={styles.splashScreen}>
      <StatusBar barStyle="light-content" backgroundColor="#173A2B" />
      <View style={styles.splashBrand}>
        <Image
          accessibilityLabel="Pickle Scorer pickleball and paddle logo"
          resizeMode="contain"
          source={require("../assets/images/pickle-scorer-splash.png")}
          style={styles.splashLogo}
        />
        <Text style={styles.splashTitle}>Pickle Scorer</Text>
        <Text style={styles.splashCredit}>by zoeDev</Text>
      </View>
      <View style={styles.splashLoading}>
        <ActivityIndicator color="#D4F45B" size="small" />
        <Text style={styles.splashLoadingText}>GETTING THE COURT READY</Text>
      </View>
    </View>
  );
}

function RootLayoutNav() {
  return (
    <AppThemeProvider>
      <RankingProvider>
        <ThemedStack />
      </RankingProvider>
    </AppThemeProvider>
  );
}

function ThemedStack() {
  const { isDark } = useAppTheme();

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      </Stack>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  splashScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#173A2B",
    padding: 24,
  },
  splashBrand: { alignItems: "center", transform: [{ translateY: -22 }] },
  splashLogo: { width: 184, height: 184, marginBottom: 25 },
  splashTitle: {
    color: "#F8FAEF",
    fontSize: 31,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  splashCredit: {
    color: "#D4F45B",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1.3,
    marginTop: 7,
  },
  splashLoading: {
    position: "absolute",
    bottom: 64,
    alignItems: "center",
    gap: 12,
  },
  splashLoadingText: {
    color: "#B2C9BB",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.8,
  },
});
