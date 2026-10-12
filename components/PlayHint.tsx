import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Palette, useAppTheme } from "@/context/ThemeContext";

const SEEN_KEY = "pickleball-score:play-hint-seen:v1";

type PlayHintProps = {
  isTournament: boolean;
  isDoubles: boolean;
  started: boolean;
  hasWinner: boolean;
  hasPlayers: boolean;
};

export default function PlayHint({
  isTournament,
  isDoubles,
  started,
  hasWinner,
  hasPlayers,
}: PlayHintProps) {
  const { colors: COLORS } = useAppTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const [open, setOpen] = useState(false);

  // First-timers see the hint expanded once; afterwards it stays one tap away.
  useEffect(() => {
    let isMounted = true;
    AsyncStorage.getItem(SEEN_KEY)
      .then((seen) => {
        if (!isMounted) return;
        if (!seen) {
          setOpen(true);
          void AsyncStorage.setItem(SEEN_KEY, "1").catch(() => {});
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const nextStep = hasWinner
    ? "Match complete — it was saved to Rankings. Tap “Start a new match” for the next game."
    : started
      ? isDoubles
        ? "Tap + for the serving team when they win a rally. If the server loses the rally, tap “Lost rally”."
        : "Tap + for the player who wins each rally."
      : !hasPlayers
        ? isTournament
          ? "Register at least 4 players in the Players tab and keep them marked Ready to get a lineup."
          : "Tap each name to choose a registered player. Add players in the Players tab first."
        : isDoubles
          ? "Choose which team serves first, then tap + to score the first point."
          : "Tap + on a player's side to score the first point.";

  const tips = [
    isTournament
      ? "The lineup is chosen for you: random for the first games, then top-ranked players are paired with lower-ranked ones."
      : "Pick Singles or Doubles, then tap each name to choose a registered player.",
    isDoubles
      ? "Only the serving team can score. “Lost rally” moves to the second server, then to a side out."
      : "Each + adds a point for that player. Use − to undo a mistake.",
    "If the score is tied one point before the target (like 10–10), you choose to play to 11 or extend.",
    "Finished matches are saved to Rankings automatically.",
  ];

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityLabel={`${open ? "Hide" : "Show"} how this works`}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((current) => !current)}
        style={styles.header}
      >
        <View style={styles.icon}>
          <Text style={styles.iconText}>?</Text>
        </View>
        <Text style={styles.title}>How this works</Text>
        <Text style={styles.chevron}>{open ? "▲" : "▼"}</Text>
      </Pressable>

      <View style={styles.nextBox}>
        <Text style={styles.nextLabel}>NEXT</Text>
        <Text style={styles.nextText}>{nextStep}</Text>
      </View>

      {open &&
        tips.map((tip, index) => (
          <View key={tip} style={styles.tipRow}>
            <Text style={styles.tipNumber}>{index + 1}</Text>
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
    </View>
  );
}

const createStyles = (COLORS: Palette) =>
  StyleSheet.create({
    card: {
      marginTop: 14,
      marginBottom: 16,
      borderRadius: 16,
      padding: 12,
      backgroundColor: COLORS.card,
      borderWidth: 1,
      borderColor: COLORS.line,
    },
    header: { flexDirection: "row", alignItems: "center", gap: 8 },
    icon: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: COLORS.paleGreen,
    },
    iconText: { color: COLORS.green, fontSize: 12, fontWeight: "900" },
    title: { flex: 1, color: COLORS.ink, fontSize: 13, fontWeight: "800" },
    chevron: { color: COLORS.muted, fontSize: 10, fontWeight: "800" },
    nextBox: {
      marginTop: 10,
      borderRadius: 10,
      padding: 10,
      backgroundColor: COLORS.paleGreen,
    },
    nextLabel: {
      color: COLORS.green,
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 1.2,
    },
    nextText: {
      color: COLORS.ink,
      fontSize: 12,
      lineHeight: 18,
      fontWeight: "600",
      marginTop: 3,
    },
    tipRow: { flexDirection: "row", gap: 8, marginTop: 10 },
    tipNumber: {
      width: 16,
      color: COLORS.green,
      fontSize: 11,
      fontWeight: "900",
    },
    tipText: { flex: 1, color: COLORS.muted, fontSize: 12, lineHeight: 18 },
  });
