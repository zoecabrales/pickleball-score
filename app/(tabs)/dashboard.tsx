import {
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
    type HostInstance,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useRankings } from "@/context/RankingContext";
import { Palette, useAppTheme } from "@/context/ThemeContext";
import { useMemo, useRef, useState } from "react";
import HighlightsShareCard from "@/components/HighlightsShareCard";
import { getMonthlyHighlights } from "@/utils/monthly";
import { getTopRanked, getWinPercentage } from "@/utils/scoring";
import { shareViewAsImage } from "@/utils/shareImage";

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { colors: COLORS, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const { rankings, rankingArchive, registeredPlayers, totalMatches, isLoaded } =
    useRankings();

  const leaders = getTopRanked(rankings);
  const leader = leaders[0];
  const leaderNames = leaders.map((player) => player.name).join(" & ");
  const leaderRate = leader ? getWinPercentage(leader.wins, leader.matches) : 0;
  const mostActive = rankings.reduce<(typeof rankings)[number] | null>(
    (best, player) => (!best || player.matches > best.matches ? player : best),
    null,
  );

  const highlights = useMemo(
    () => getMonthlyHighlights(rankings, rankingArchive),
    [rankings, rankingArchive],
  );
  const record = (p: { wins: number; losses: number }) =>
    `${p.wins}W · ${p.losses}L`;
  const margin = (p: { diffPerMatch: number }) =>
    `${p.diffPerMatch >= 0 ? "+" : ""}${p.diffPerMatch.toFixed(1)} pts/match`;
  const awards = highlights.champion
    ? [
        {
          icon: "🏆",
          label: "MONTH CHAMPION",
          name: highlights.champion.name,
          note: `${record(highlights.champion)} · ${Math.round(highlights.champion.winRate * 100)}% win rate`,
        },
        ...(highlights.mostImproved
          ? [
              {
                icon: "📈",
                label: "MOST IMPROVED",
                name: highlights.mostImproved.player.name,
                note:
                  highlights.mostImproved.change === null
                    ? `Early read · ${margin(highlights.mostImproved.player)}`
                    : `+${Math.round(highlights.mostImproved.change * 100)}% win rate vs before`,
              },
            ]
          : []),
        ...(highlights.dontSleepOn
          ? [
              {
                icon: "👀",
                label: "DON'T TAKE FOR GRANTED",
                name: highlights.dontSleepOn.name,
                note: `${record(highlights.dontSleepOn)} · ${margin(highlights.dontSleepOn)}`,
              },
            ]
          : []),
      ]
    : [];

  const shareDuo = highlights.duo
    ? {
        names: `${highlights.duo[0].name} & ${highlights.duo[1].name}`,
        note: `${highlights.duo
          .map((p) => `${p.name} ${Math.round(p.winRate * 100)}%`)
          .join(" · ")} win rate`,
      }
    : null;

  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const shareCardRef = useRef<HostInstance>(null);

  const shareHighlights = async () => {
    if (isSharing) return;
    setIsSharing(true);
    try {
      const shared = await shareViewAsImage(
        shareCardRef,
        "Share monthly highlights",
      );
      if (!shared) {
        Alert.alert("Sharing unavailable", "This device cannot share images.");
      }
    } catch {
      Alert.alert("Could not share", "The highlights image could not be created.");
    } finally {
      setIsSharing(false);
    }
  };

  const stats = [
    { label: "MATCHES TODAY", value: totalMatches },
    { label: "REGISTERED", value: registeredPlayers.length },
    { label: "ON THE LADDER", value: rankings.length },
    { label: "SAVED DAYS", value: rankingArchive.length },
  ];

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
        <Text style={styles.eyebrow}>YOUR COURT · AT A GLANCE</Text>
        <Text style={styles.heading}>Dashboard</Text>

        <View style={styles.leaderCard}>
          <Text style={styles.leaderKicker}>
            {leaders.length > 1 ? "CURRENT #1 (TIED)" : "CURRENT #1"}
          </Text>
          {!isLoaded ? (
            <Text style={styles.leaderEmpty}>Loading…</Text>
          ) : leader ? (
            <>
              <Text style={styles.leaderName} numberOfLines={2}>
                {leaderNames}
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

        <Text style={styles.sectionTitle}>Monthly highlights</Text>
        <View style={styles.highlightCard}>
          <Text style={styles.highlightMonth}>
            {highlights.monthLabel.toUpperCase()}
          </Text>
          {!highlights.champion ? (
            <Text style={styles.highlightEmpty}>
              Finish a few matches and this month&apos;s awards will show up
              here.
            </Text>
          ) : (
            <>
              {awards.map((award) => (
                <View key={award.label} style={styles.awardRow}>
                  <Text style={styles.awardIcon}>{award.icon}</Text>
                  <View style={styles.awardBody}>
                    <Text style={styles.awardLabel}>{award.label}</Text>
                    <Text style={styles.awardName} numberOfLines={1}>
                      {award.name}
                    </Text>
                    <Text style={styles.awardNote}>{award.note}</Text>
                  </View>
                </View>
              ))}
              {highlights.duo && (
                <View style={styles.duoBox}>
                  <Text style={styles.duoLabel}>DYNAMIC DUO</Text>
                  <Text style={styles.duoNames} numberOfLines={1}>
                    {highlights.duo[0].name} & {highlights.duo[1].name}
                  </Text>
                  <Text style={styles.duoNote}>
                    {highlights.duo
                      .map((p) => `${p.name} ${Math.round(p.winRate * 100)}%`)
                      .join(" · ")}{" "}
                    win rate
                  </Text>
                </View>
              )}
              <Pressable
                accessibilityRole="button"
                onPress={() => setIsShareOpen(true)}
                style={styles.shareButton}
              >
                <Text style={styles.shareButtonText}>Share as image</Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        visible={isShareOpen}
        onRequestClose={() => setIsShareOpen(false)}
      >
        <View style={[styles.shareScreen, { paddingTop: insets.top + 8 }]}>
          <ScrollView
            contentContainerStyle={styles.shareScroll}
            showsVerticalScrollIndicator={false}
          >
            <HighlightsShareCard
              ref={shareCardRef}
              monthLabel={highlights.monthLabel}
              awards={awards}
              duo={shareDuo}
              sessions={highlights.sessions}
              matches={highlights.matches}
            />
          </ScrollView>
          <View
            style={[
              styles.shareActions,
              { paddingBottom: Math.max(insets.bottom, 12) },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              disabled={isSharing}
              onPress={shareHighlights}
              style={[styles.shareButton, styles.shareActionPrimary]}
            >
              <Text style={styles.shareButtonText}>
                {isSharing ? "Preparing…" : "Share image"}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => setIsShareOpen(false)}
              style={styles.shareClose}
            >
              <Text style={styles.shareCloseText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
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
  highlightCard: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  highlightMonth: {
    color: COLORS.green,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.6,
  },
  highlightEmpty: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  awardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 16,
  },
  awardIcon: { fontSize: 26 },
  awardBody: { flex: 1 },
  awardLabel: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  awardName: { color: COLORS.ink, fontSize: 18, fontWeight: "800", marginTop: 2 },
  awardNote: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  shareButton: {
    alignItems: "center",
    borderRadius: 14,
    backgroundColor: COLORS.green,
    paddingVertical: 13,
    marginTop: 14,
  },
  shareButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  shareScreen: { flex: 1, backgroundColor: "#E4E9E3" },
  shareScroll: { alignItems: "center", paddingVertical: 12 },
  shareActions: { paddingHorizontal: 20, paddingTop: 8 },
  shareActionPrimary: { marginTop: 0, marginBottom: 6 },
  shareClose: { alignItems: "center", paddingVertical: 10 },
  shareCloseText: { color: "#15241E", fontSize: 14, fontWeight: "700" },
  duoBox: {
    marginTop: 18,
    padding: 16,
    borderRadius: 16,
    backgroundColor: COLORS.navy,
  },
  duoLabel: {
    color: COLORS.lime,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.6,
  },
  duoNames: { color: "#FFFFFF", fontSize: 20, fontWeight: "800", marginTop: 6 },
  duoNote: { color: "#BFD4C8", fontSize: 12, marginTop: 4 },
});
