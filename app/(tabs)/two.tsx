import { useMemo, useRef, useState } from "react";
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

import RankingShareCard from "@/components/RankingShareCard";
import RatingsView from "@/components/RatingsView";
import { useRankings } from "@/context/RankingContext";
import { Palette, useAppTheme } from "@/context/ThemeContext";
import {
  getSharedRanks,
  getTopRanked,
  getWinPercentage,
} from "@/utils/scoring";
import { shareViewAsImage } from "@/utils/shareImage";

export default function RankingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors: COLORS, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const { rankings, rankingArchive, ratings, totalMatches, isLoaded, resetRankings } =
    useRankings();
  const [view, setView] = useState<"ladder" | "ratings">("ladder");
  const [expandedArchiveId, setExpandedArchiveId] = useState<string | null>(
    null,
  );

  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const shareCardRef = useRef<HostInstance>(null);

  const shareLadder = async () => {
    if (isSharing) return;
    setIsSharing(true);
    try {
      const shared = await shareViewAsImage(
        shareCardRef,
        "Share player ladder",
      );
      if (!shared) {
        Alert.alert("Sharing unavailable", "This device cannot share images.");
      }
    } catch {
      Alert.alert("Could not share", "The ladder image could not be created.");
    } finally {
      setIsSharing(false);
    }
  };

  const confirmReset = () => {
    Alert.alert(
      "Start a new ranking day?",
      "Today's standings will be saved under Previous rankings, and the current ladder will reset to zero.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Save & reset",
          style: "destructive",
          onPress: () => {
            void resetRankings().catch(() => {
              Alert.alert(
                "Could not reset rankings",
                "Your current standings were not saved. Please try again.",
              );
            });
          },
        },
      ],
    );
  };

  const renderRankingRows = (players: typeof rankings) => {
    const ranks = getSharedRanks(players);

    return (
    <View style={styles.rankingList}>
      {players.map((player, index) => {
        const winRate = getWinPercentage(player.wins, player.matches);
        const rank = ranks[index];
        return (
          <View
            key={player.id}
            style={[styles.playerRow, rank === 1 && styles.topPlayerRow]}
          >
            <View
              style={[
                styles.rankNumber,
                rank === 1 && styles.rankNumberGold,
                rank === 2 && styles.rankNumberSilver,
                rank === 3 && styles.rankNumberBronze,
              ]}
            >
              <Text
                style={[
                  styles.rankNumberText,
                  rank <= 3 && styles.rankNumberMedalText,
                ]}
              >
                {String(rank).padStart(2, "0")}
              </Text>
            </View>
            <View style={styles.playerInfo}>
              <Text style={styles.playerName} numberOfLines={1}>
                {player.name}
              </Text>
              <Text style={styles.playerRecord}>
                {player.wins}W · {player.losses}L{" "}
                <Text style={styles.recordSeparator}>/</Text> {player.matches}{" "}
                {player.matches === 1 ? "match" : "matches"}
              </Text>
            </View>
            <View style={styles.winRateBlock}>
              <Text style={[styles.winRate, rank === 1 && styles.winRateTop]}>
                {winRate}
                <Text style={styles.percentSign}>%</Text>
              </Text>
              <Text style={styles.winRateLabel}>WIN RATE</Text>
            </View>
          </View>
        );
      })}
    </View>
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
        <Text style={styles.eyebrow}>YOUR COURT · YOUR RECORD</Text>
        <Text style={styles.heading}>Rankings</Text>
        <Text style={styles.subtitle}>
          Every player earns their own place on the ladder.
        </Text>

        <View style={styles.viewSwitch}>
          {(["ladder", "ratings"] as const).map((option) => (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: view === option }}
              key={option}
              onPress={() => setView(option)}
              style={[
                styles.viewButton,
                view === option && styles.viewButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.viewButtonText,
                  view === option && styles.viewButtonTextActive,
                ]}
              >
                {option === "ladder" ? "Ladder" : "Ratings"}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{rankings.length}</Text>
            <Text style={styles.summaryLabel}>PLAYERS</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{totalMatches}</Text>
            <Text style={styles.summaryLabel}>MATCHES LOGGED</Text>
          </View>
          <View style={styles.summaryBadge}>
            <Text style={styles.summaryBadgeText}>LOCAL</Text>
          </View>
        </View>

        {isLoaded && view === "ratings" ? (
          <RatingsView ratings={ratings} />
        ) : (
        <>
        {isLoaded && rankings.length > 0 && (
          <Pressable
            accessibilityRole="button"
            onPress={() => setIsShareOpen(true)}
            style={styles.shareButton}
          >
            <Text style={styles.shareButtonText}>Share ladder as image</Text>
          </Pressable>
        )}

        <Pressable
          accessibilityRole="button"
          disabled={!isLoaded}
          onPress={confirmReset}
          style={[styles.resetButton, !isLoaded && styles.resetButtonDisabled]}
        >
          <Text style={styles.resetButtonText}>Save today & start fresh</Text>
        </Pressable>

        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Player ladder</Text>
          <Text style={styles.sortLabel}>WIN RATE</Text>
        </View>

        {!isLoaded ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Loading local records…</Text>
          </View>
        ) : rankings.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>↗</Text>
            </View>
            <Text style={styles.emptyTitle}>Your ladder starts here</Text>
            <Text style={styles.emptyDescription}>
              Finish a singles or doubles match. Each player will receive an
              individual win or loss, saved on this device.
            </Text>
          </View>
        ) : (
          renderRankingRows(rankings)
        )}

        {rankingArchive.length > 0 && (
          <View style={styles.archiveSection}>
            <View style={styles.archiveHeader}>
              <Text style={styles.sectionTitle}>Previous rankings</Text>
              <Text style={styles.archiveCount}>
                {rankingArchive.length} saved
              </Text>
            </View>
            {rankingArchive.map((snapshot) => {
              const isExpanded = expandedArchiveId === snapshot.id;
              const topPlayers = getTopRanked(snapshot.rankings)
                .map((player) => player.name)
                .join(" & ");
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isExpanded }}
                  key={snapshot.id}
                  onPress={() =>
                    setExpandedArchiveId(isExpanded ? null : snapshot.id)
                  }
                  style={styles.archiveCard}
                >
                  <View
                    style={[
                      styles.archiveCardHeader,
                      isExpanded && styles.archiveCardHeaderExpanded,
                    ]}
                  >
                    <View style={styles.archiveSummary}>
                      <Text style={styles.archiveDate}>
                        {new Date(snapshot.savedAt).toLocaleDateString(
                          undefined,
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </Text>
                      <Text style={styles.archiveMeta} numberOfLines={1}>
                        {snapshot.totalMatches}{" "}
                        {snapshot.totalMatches === 1 ? "match" : "matches"}
                        {topPlayers ? ` · 🏆 ${topPlayers}` : ""}
                      </Text>
                    </View>
                    <Text style={styles.archiveChevron}>
                      {isExpanded ? "▲" : "▼"}
                    </Text>
                  </View>
                  {isExpanded &&
                    (snapshot.rankings.length > 0 ? (
                      renderRankingRows(snapshot.rankings)
                    ) : (
                      <Text style={styles.archiveEmpty}>
                        No player results saved.
                      </Text>
                    ))}
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={styles.infoCard}>
          <View style={styles.infoTopRow}>
            <View style={styles.infoIcon}>
              <Text style={styles.infoIconText}>↗</Text>
            </View>
            <Text style={styles.infoTitle}>How rankings work</Text>
          </View>
          <Text style={styles.infoText}>
            The #1 player is the one who wins the highest share of their
            matches.
          </Text>
          {[
            [
              "1",
              "Every match counts for each player.",
              "Winners get 1 win, losers get 1 loss. In doubles, both partners share the result.",
            ],
            [
              "2",
              "Win rate decides the order.",
              "Win rate = wins ÷ matches played. 3 wins in 4 matches is 75%.",
            ],
            [
              "3",
              "Ties go to the player with more wins.",
              "If two players have the same win rate, the one with more total wins ranks higher.",
            ],
            [
              "4",
              "Still tied? They share the rank.",
              "Players with the same record share a rank (1, 1, 2) and are listed alphabetically.",
            ],
          ].map(([step, title, detail]) => (
            <View key={step} style={styles.infoStep}>
              <View style={styles.infoStepNumber}>
                <Text style={styles.infoStepNumberText}>{step}</Text>
              </View>
              <View style={styles.infoStepBody}>
                <Text style={styles.infoStepTitle}>{title}</Text>
                <Text style={styles.infoText}>{detail}</Text>
              </View>
            </View>
          ))}
          <Text style={styles.infoExample}>
            Example: Ana is 2–0 (100%) and Ben is 5–1 (83%). Ana ranks higher
            because her win rate is higher, even though Ben has more wins.
          </Text>
          <Text style={styles.infoText}>
            Your match records stay offline on this device.
          </Text>
        </View>
        </>
        )}
        <Text style={styles.footer}>NO ACCOUNT · NO INTERNET · JUST PLAY</Text>
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
            <RankingShareCard
              ref={shareCardRef}
              players={rankings}
              totalMatches={totalMatches}
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
              onPress={shareLadder}
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
    letterSpacing: 1.7,
    fontWeight: "800",
    marginBottom: 6,
  },
  heading: {
    color: COLORS.ink,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "800",
    letterSpacing: -1,
  },
  subtitle: { color: COLORS.muted, fontSize: 13, lineHeight: 19, marginTop: 5 },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.navy,
    borderRadius: 21,
    paddingVertical: 19,
    paddingHorizontal: 17,
    marginTop: 14,
    marginBottom: 26,
  },
  viewSwitch: {
    flexDirection: "row",
    backgroundColor: COLORS.line,
    borderRadius: 14,
    padding: 4,
    marginTop: 18,
  },
  viewButton: {
    flex: 1,
    alignItems: "center",
    borderRadius: 11,
    paddingVertical: 10,
  },
  viewButtonActive: { backgroundColor: COLORS.card },
  viewButtonText: { color: COLORS.muted, fontSize: 14, fontWeight: "700" },
  viewButtonTextActive: { color: COLORS.ink },
  summaryItem: { minWidth: 75 },
  summaryNumber: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "800",
    letterSpacing: -0.7,
  },
  summaryLabel: {
    color: "#AAC6B8",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginTop: 3,
  },
  summaryDivider: {
    width: 1,
    height: 39,
    backgroundColor: "#426053",
    marginHorizontal: 16,
  },
  summaryBadge: {
    marginLeft: "auto",
    backgroundColor: COLORS.lime,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },
  summaryBadgeText: {
    color: COLORS.navy,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },
  resetButton: {
    alignSelf: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 4,
    marginBottom: 20,
    borderRadius: 11,
    backgroundColor: "#FBE9E5",
  },
  resetButtonDisabled: { opacity: 0.5 },
  resetButtonText: { color: "#A44336", fontSize: 11, fontWeight: "800" },
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
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingHorizontal: 22,
    paddingVertical: 27,
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: COLORS.paleGreen,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyIconText: { color: COLORS.green, fontSize: 23, fontWeight: "800" },
  emptyTitle: {
    color: COLORS.ink,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyDescription: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 7,
  },
  rankingList: { gap: 9 },
  archiveSection: { marginTop: 25 },
  archiveHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  archiveCount: { color: COLORS.muted, fontSize: 10, fontWeight: "700" },
  archiveCard: {
    backgroundColor: "#EDF1EC",
    borderRadius: 19,
    padding: 11,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  archiveCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 3,
    paddingVertical: 4,
  },
  archiveCardHeaderExpanded: { paddingBottom: 10 },
  archiveSummary: { flex: 1, marginRight: 10 },
  archiveChevron: { color: COLORS.green, fontSize: 11, fontWeight: "900" },
  archiveDate: { color: COLORS.ink, fontSize: 13, fontWeight: "800" },
  archiveMeta: { color: COLORS.muted, fontSize: 10, marginTop: 2 },
  archiveLabel: {
    color: COLORS.green,
    backgroundColor: COLORS.paleGreen,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  archiveEmpty: {
    color: COLORS.muted,
    fontSize: 11,
    paddingVertical: 12,
    textAlign: "center",
  },
  playerRow: {
    minHeight: 77,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 17,
    paddingHorizontal: 13,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  topPlayerRow: { borderColor: COLORS.green, backgroundColor: COLORS.paleGreen },
  rankNumber: {
    width: 35,
    height: 35,
    borderRadius: 12,
    backgroundColor: "#F1F4F0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  shareButton: {
    alignItems: "center",
    borderRadius: 14,
    backgroundColor: COLORS.green,
    paddingVertical: 13,
    marginBottom: 10,
  },
  shareButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  shareScreen: { flex: 1, backgroundColor: "#E4E9E3" },
  shareScroll: { alignItems: "center", paddingVertical: 12 },
  shareActions: { paddingHorizontal: 20, paddingTop: 8 },
  shareActionPrimary: { marginBottom: 6 },
  shareClose: { alignItems: "center", paddingVertical: 10 },
  shareCloseText: { color: "#15241E", fontSize: 14, fontWeight: "700" },
  rankNumberGold: { backgroundColor: "#F2C94C" },
  rankNumberSilver: { backgroundColor: "#C7D0D9" },
  rankNumberBronze: { backgroundColor: "#CD8B5A" },
  rankNumberText: { color: COLORS.muted, fontSize: 11, fontWeight: "800" },
  rankNumberMedalText: { color: "#42351B" },
  playerInfo: { flex: 1, minWidth: 0 },
  playerName: { color: COLORS.ink, fontSize: 14, fontWeight: "800" },
  playerRecord: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "600",
    marginTop: 5,
  },
  recordSeparator: { color: COLORS.line },
  winRateBlock: { minWidth: 61, alignItems: "flex-end", marginLeft: 8 },
  winRate: {
    color: COLORS.green,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  winRateTop: { color: COLORS.green },
  percentSign: { fontSize: 12 },
  winRateLabel: {
    color: COLORS.muted,
    fontSize: 7,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginTop: 1,
  },
  infoCard: {
    backgroundColor: COLORS.paleGreen,
    borderRadius: 18,
    padding: 16,
    marginTop: 20,
  },
  infoTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 8,
  },
  infoIcon: {
    width: 25,
    height: 25,
    borderRadius: 8,
    backgroundColor: "#CBE6D4",
    alignItems: "center",
    justifyContent: "center",
  },
  infoIconText: { color: COLORS.green, fontSize: 15, fontWeight: "900" },
  infoTitle: { color: COLORS.ink, fontSize: 14, fontWeight: "800" },
  infoText: { color: COLORS.muted, fontSize: 11, lineHeight: 17 },
  infoStep: { flexDirection: "row", marginTop: 10 },
  infoStepNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    marginTop: 1,
  },
  infoStepNumberText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900" },
  infoStepBody: { flex: 1 },
  infoStepTitle: { color: COLORS.ink, fontSize: 12, fontWeight: "800" },
  infoExample: {
    color: COLORS.ink,
    backgroundColor: COLORS.paleGreen,
    borderRadius: 10,
    padding: 10,
    marginVertical: 12,
    fontSize: 11,
    lineHeight: 17,
  },
  footer: {
    textAlign: "center",
    color: "#98A39C",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginTop: 24,
  },
});
