import { router } from "expo-router";
import {
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useRankings } from "@/context/RankingContext";
import { getWinPercentage } from "@/utils/scoring";

const COLORS = {
  background: "#F4F6F1",
  card: "#FFFFFF",
  ink: "#15241E",
  muted: "#7B8981",
  green: "#176B4B",
  paleGreen: "#E3F2E9",
  lime: "#D4F45B",
  line: "#E6EBE6",
  navy: "#17342A",
};

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { rankings, rankingArchive, registeredPlayers, totalMatches, isLoaded } =
    useRankings();

  const leader = rankings[0];
  const leaderRate = leader ? getWinPercentage(leader.wins, leader.matches) : 0;
  const mostActive = rankings.reduce<(typeof rankings)[number] | null>(
    (best, player) => (!best || player.matches > best.matches ? player : best),
    null,
  );

  const stats = [
    { label: "MATCHES TODAY", value: totalMatches },
    { label: "REGISTERED", value: registeredPlayers.length },
    { label: "ON THE LADDER", value: rankings.length },
    { label: "SAVED DAYS", value: rankingArchive.length },
  ];

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: Math.max(insets.top, 16) + 8 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>YOUR COURT · AT A GLANCE</Text>
        <Text style={styles.heading}>Dashboard</Text>

        <View style={styles.leaderCard}>
          <Text style={styles.leaderKicker}>CURRENT #1</Text>
          {!isLoaded ? (
            <Text style={styles.leaderEmpty}>Loading…</Text>
          ) : leader ? (
            <>
              <Text style={styles.leaderName} numberOfLines={1}>
                {leader.name}
              </Text>
              <Text style={styles.leaderRecord}>
                {leader.wins}W · {leader.losses}L · {leaderRate}% win rate
              </Text>
            </>
          ) : (
            <Text style={styles.leaderEmpty}>
              No matches yet. Finish a match to start the ladder.
            </Text>
          )}
        </View>

        <View style={styles.statGrid}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {mostActive && (
          <View style={styles.rowCard}>
            <Text style={styles.rowLabel}>MOST ACTIVE TODAY</Text>
            <Text style={styles.rowValue} numberOfLines={1}>
              {mostActive.name} · {mostActive.matches}{" "}
              {mostActive.matches === 1 ? "match" : "matches"}
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Quick actions</Text>
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.navigate("/")}
            style={[styles.actionButton, styles.actionPrimary]}
          >
            <Text style={styles.actionPrimaryText}>Start a match</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.navigate("/players")}
            style={styles.actionButton}
          >
            <Text style={styles.actionText}>Manage players</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.navigate("/two")}
            style={styles.actionButton}
          >
            <Text style={styles.actionText}>View rankings</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
  leaderCard: {
    marginTop: 20,
    padding: 20,
    borderRadius: 22,
    backgroundColor: COLORS.navy,
  },
  leaderKicker: {
    color: COLORS.lime,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.6,
  },
  leaderName: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
    marginTop: 8,
  },
  leaderRecord: { color: "#BFD4C8", fontSize: 13, marginTop: 4 },
  leaderEmpty: { color: "#BFD4C8", fontSize: 14, marginTop: 8, lineHeight: 20 },
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
  statCard: {
    flexBasis: "48%",
    flexGrow: 1,
    padding: 16,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  statValue: { color: COLORS.ink, fontSize: 28, fontWeight: "800" },
  statLabel: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 4,
  },
  rowCard: {
    marginTop: 10,
    padding: 16,
    borderRadius: 18,
    backgroundColor: COLORS.paleGreen,
  },
  rowLabel: {
    color: COLORS.green,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  rowValue: { color: COLORS.ink, fontSize: 15, fontWeight: "700", marginTop: 4 },
  sectionTitle: {
    color: COLORS.ink,
    fontSize: 16,
    fontWeight: "800",
    marginTop: 26,
    marginBottom: 12,
  },
  actions: { gap: 8 },
  actionButton: {
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  actionPrimary: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  actionText: { color: COLORS.ink, fontSize: 13, fontWeight: "800" },
  actionPrimaryText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
});
