import Constants from "expo-constants";
import { useMemo, useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGuide } from "@/context/GuideContext";
import { useRankings } from "@/context/RankingContext";
import { Palette, THEMES, useAppTheme } from "@/context/ThemeContext";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors: COLORS, isDark, id: themeId, setTheme } = useAppTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const { wipeAllData, isLoaded, registeredPlayers, rankingArchive, totalMatches } =
    useRankings();
  const { showGuide } = useGuide();
  const [isWiping, setIsWiping] = useState(false);

  const runWipe = async () => {
    setIsWiping(true);
    try {
      await wipeAllData();
      Alert.alert("All data cleared", "The app is now back to a clean slate.");
    } catch {
      Alert.alert("Could not clear data", "Nothing was changed. Please try again.");
    } finally {
      setIsWiping(false);
    }
  };

  const confirmWipe = () => {
    Alert.alert(
      "Erase everything?",
      "This deletes all players, rankings, saved days and cached data on this device. It cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          style: "destructive",
          onPress: () =>
            Alert.alert(
              "Are you absolutely sure?",
              "Last chance. Everything will be permanently erased.",
              [
                { text: "Keep my data", style: "cancel" },
                {
                  text: "Erase all data",
                  style: "destructive",
                  onPress: () => void runWipe(),
                },
              ],
            ),
        },
      ],
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={{ height: insets.top, backgroundColor: COLORS.background }} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: 8 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>YOUR COURT · PREFERENCES</Text>
        <Text style={styles.heading}>Settings</Text>

        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.card}>
          {THEMES.map((theme, index) => {
            const selected = theme.id === themeId;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={theme.id}
                onPress={() => setTheme(theme.id)}
                style={[styles.themeRow, index > 0 && styles.infoRowBorder]}
              >
                <View style={styles.swatches}>
                  <Text style={styles.check}>{selected ? "✓" : ""}</Text>
                  <Text
                    style={[styles.themeName, selected && styles.themeNameActive]}
                  >
                    {theme.name}
                  </Text>
                </View>
                <View style={styles.swatches}>
                  {[
                    theme.colors.background,
                    theme.colors.green,
                    theme.colors.navy,
                    theme.colors.lime,
                  ].map((color) => (
                    <View
                      key={color}
                      style={[styles.swatch, { backgroundColor: color }]}
                    />
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Help</Text>
        <View style={styles.card}>
          <Pressable
            accessibilityRole="button"
            onPress={showGuide}
            style={styles.themeRow}
          >
            <Text style={styles.themeName}>Replay welcome guide</Text>
            <Text style={styles.check}>›</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Stored on this device</Text>
        <View style={styles.card}>
          {[
            ["Registered players", registeredPlayers.length],
            ["Matches on current ladder", totalMatches],
            ["Saved ranking days", rankingArchive.length],
          ].map(([label, value], index) => (
            <View
              key={label}
              style={[styles.infoRow, index > 0 && styles.infoRowBorder]}
            >
              <Text style={styles.infoLabel}>{label}</Text>
              <Text style={styles.infoValue}>{value}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Danger zone</Text>
        <View style={styles.dangerCard}>
          <Text style={styles.dangerTitle}>Reset & clear all data</Text>
          <Text style={styles.dangerText}>
            Clears the cache and wipes everything clean: players, current
            rankings, previous rankings and any in-progress match. Use this to
            start completely fresh.
          </Text>
          <Pressable
            accessibilityRole="button"
            disabled={!isLoaded || isWiping}
            onPress={confirmWipe}
            style={[
              styles.dangerButton,
              (!isLoaded || isWiping) && styles.disabled,
            ]}
          >
            <Text style={styles.dangerButtonText}>
              {isWiping ? "Erasing…" : "Erase all data"}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.footer}>
          PICKLE SCORER · v{Constants.expoConfig?.version ?? "1.0.0"}
        </Text>
      </ScrollView>
    </View>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  themeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  themeName: { color: COLORS.ink, fontSize: 14, fontWeight: "800" },
  themeNameActive: { color: COLORS.green },
  swatches: { flexDirection: "row", alignItems: "center", gap: 6 },
  swatch: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  check: { color: COLORS.green, fontSize: 15, fontWeight: "900", width: 18 },
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: 20, paddingBottom: 34 },
  eyebrow: {
    color: COLORS.green,
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: "800",
    marginBottom: 6,
  },
  heading: {
    color: COLORS.ink,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "800",
  },
  sectionTitle: {
    color: COLORS.ink,
    fontSize: 16,
    fontWeight: "800",
    marginTop: 26,
    marginBottom: 12,
  },
  card: {
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingHorizontal: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  infoRowBorder: { borderTopWidth: 1, borderTopColor: COLORS.line },
  infoLabel: { color: COLORS.muted, fontSize: 13 },
  infoValue: { color: COLORS.ink, fontSize: 14, fontWeight: "800" },
  dangerCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: COLORS.paleRed,
    borderWidth: 1,
    borderColor: COLORS.borderRed,
  },
  dangerTitle: { color: COLORS.red, fontSize: 15, fontWeight: "800" },
  dangerText: { color: COLORS.ink, fontSize: 12, lineHeight: 18, marginTop: 6 },
  dangerButton: {
    height: 48,
    borderRadius: 13,
    backgroundColor: COLORS.red,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  dangerButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  disabled: { opacity: 0.5 },
  footer: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.3,
    textAlign: "center",
    marginTop: 30,
  },
});
