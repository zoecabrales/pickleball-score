import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAppTheme, type Palette } from "@/context/ThemeContext";
import {
  formatRating,
  formatRatingChange,
  getRatedPlayers,
  getRatingChange,
  isProvisional,
  MAX_RATING,
  MIN_RATING,
  PROVISIONAL_MATCHES,
  START_RATING,
  type ModeRating,
  type RatingBook,
  type RatingMode,
} from "@/utils/rating";

const TREND_POINTS = 8;
const TREND_HEIGHT = 22;
const CHANGE_EPSILON = 0.0004;

function Trend({
  mode,
  color,
  muted,
}: {
  mode: ModeRating;
  color: string;
  muted: string;
}) {
  const ratings = mode.history.slice(-TREND_POINTS).map((point) => point.rating);
  if (ratings.length < 2) return null;
  const low = Math.min(...ratings);
  const spread = Math.max(Math.max(...ratings) - low, 0.05);

  return (
    <View style={trendStyles.row} accessibilityElementsHidden>
      {ratings.map((rating, index) => {
        const isLatest = index === ratings.length - 1;
        return (
          <View
            key={index}
            style={[
              trendStyles.bar,
              {
                height: 4 + ((rating - low) / spread) * (TREND_HEIGHT - 4),
                backgroundColor: isLatest ? color : muted,
                opacity: isLatest ? 1 : 0.45,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const trendStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: TREND_HEIGHT,
    gap: 2,
    marginTop: 6,
  },
  bar: { width: 5, borderRadius: 2 },
});

export default function RatingsView({ ratings }: { ratings: RatingBook }) {
  const { colors: COLORS } = useAppTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const [mode, setMode] = useState<RatingMode>("doubles");
  const players = useMemo(() => getRatedPlayers(ratings, mode), [ratings, mode]);

  return (
    <View>
      <View style={styles.modeSwitch}>
        {(["doubles", "singles"] as RatingMode[]).map((option) => (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: mode === option }}
            key={option}
            onPress={() => setMode(option)}
            style={[styles.modeButton, mode === option && styles.modeButtonActive]}
          >
            <Text
              style={[styles.modeText, mode === option && styles.modeTextActive]}
            >
              {option === "doubles" ? "Doubles" : "Singles"}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>DUPR-STYLE ESTIMATE</Text>
        <Text style={styles.bannerText}>
          Just for fun: a local guess at where you might land on a{" "}
          {MIN_RATING.toFixed(1)}–{MAX_RATING.toFixed(1)} scale. It is not an
          official DUPR rating and never connects to DUPR.
        </Text>
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>
          {mode === "doubles" ? "Doubles" : "Singles"} ratings
        </Text>
        <Text style={styles.sortLabel}>RATING</Text>
      </View>

      {players.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No {mode} ratings yet</Text>
          <Text style={styles.emptyDescription}>
            Finish a {mode} match and everyone in it starts at{" "}
            {formatRating(START_RATING)}. Ratings only count matches played from
            now on.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {players.map((player, index) => {
            const stats = player[mode];
            const change = getRatingChange(stats);
            const up = change > CHANGE_EPSILON;
            const down = change < -CHANGE_EPSILON;
            const trendColor = up ? COLORS.green : down ? COLORS.red : COLORS.muted;
            return (
              <View key={player.id} style={styles.row}>
                <Text style={styles.position}>{index + 1}</Text>
                <View style={styles.info}>
                  <Text style={styles.name} numberOfLines={1}>
                    {player.name}
                  </Text>
                  <Text style={styles.meta}>
                    {stats.matches} {stats.matches === 1 ? "match" : "matches"}
                    {isProvisional(stats)
                      ? ` · Provisional (${PROVISIONAL_MATCHES - stats.matches} to settle)`
                      : ""}
                  </Text>
                  <Trend mode={stats} color={trendColor} muted={COLORS.muted} />
                </View>
                <View style={styles.ratingBlock}>
                  <Text style={styles.rating}>{formatRating(stats.rating)}</Text>
                  <Text style={[styles.change, { color: trendColor }]}>
                    {up ? "▲ " : down ? "▼ " : ""}
                    {formatRatingChange(change)}
                  </Text>
                  <Text style={styles.changeLabel}>LAST SESSION</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.howCard}>
        <Text style={styles.howTitle}>How ratings move</Text>
        <Text style={styles.howText}>
          Everyone starts at {formatRating(START_RATING)}. Beating a stronger
          team earns more than beating a weaker one, and a bigger winning margin
          helps a little. In doubles, a team is the average of its two partners.
          New players swing quickly, then settle after {PROVISIONAL_MATCHES}{" "}
          matches. The bars show each session&apos;s rating, oldest to newest.
        </Text>
      </View>
    </View>
  );
}

function createStyles(COLORS: Palette) {
  return StyleSheet.create({
    modeSwitch: {
      flexDirection: "row",
      backgroundColor: COLORS.line,
      borderRadius: 14,
      padding: 4,
      marginBottom: 14,
    },
    modeButton: {
      flex: 1,
      alignItems: "center",
      borderRadius: 11,
      paddingVertical: 10,
    },
    modeButtonActive: { backgroundColor: COLORS.card },
    modeText: { color: COLORS.muted, fontSize: 14, fontWeight: "700" },
    modeTextActive: { color: COLORS.ink },
    banner: {
      backgroundColor: COLORS.paleGreen,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: COLORS.line,
      padding: 14,
      marginBottom: 20,
    },
    bannerTitle: {
      color: COLORS.green,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.8,
      marginBottom: 4,
    },
    bannerText: { color: COLORS.ink, fontSize: 13, lineHeight: 19 },
    listHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    sectionTitle: {
      color: COLORS.ink,
      fontSize: 18,
      fontWeight: "800",
      letterSpacing: -0.3,
    },
    sortLabel: {
      color: COLORS.muted,
      fontSize: 9,
      fontWeight: "800",
      letterSpacing: 1,
    },
    emptyCard: {
      backgroundColor: COLORS.card,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: COLORS.line,
      padding: 22,
      alignItems: "center",
    },
    emptyTitle: {
      color: COLORS.ink,
      fontSize: 16,
      fontWeight: "800",
      marginBottom: 6,
    },
    emptyDescription: {
      color: COLORS.muted,
      fontSize: 13,
      lineHeight: 19,
      textAlign: "center",
    },
    list: { gap: 8 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: COLORS.card,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: COLORS.line,
      paddingHorizontal: 13,
      paddingVertical: 12,
    },
    position: {
      width: 26,
      color: COLORS.muted,
      fontSize: 15,
      fontWeight: "800",
    },
    info: { flex: 1, paddingRight: 8 },
    name: { color: COLORS.ink, fontSize: 16, fontWeight: "800" },
    meta: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
    ratingBlock: { alignItems: "flex-end" },
    rating: {
      color: COLORS.ink,
      fontSize: 24,
      fontWeight: "800",
      letterSpacing: -0.5,
      fontVariant: ["tabular-nums"],
    },
    change: { fontSize: 12, fontWeight: "800", fontVariant: ["tabular-nums"] },
    changeLabel: {
      color: COLORS.muted,
      fontSize: 8,
      fontWeight: "800",
      letterSpacing: 0.8,
      marginTop: 1,
    },
    howCard: {
      backgroundColor: COLORS.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: COLORS.line,
      padding: 16,
      marginTop: 22,
    },
    howTitle: {
      color: COLORS.ink,
      fontSize: 15,
      fontWeight: "800",
      marginBottom: 6,
    },
    howText: { color: COLORS.muted, fontSize: 13, lineHeight: 19 },
  });
}
