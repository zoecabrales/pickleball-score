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

export default function RankingsScreen() {
  const insets = useSafeAreaInsets();
  const { rankings, rankingArchive, totalMatches, isLoaded, resetRankings } =
    useRankings();

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

  const renderRankingRows = (players: typeof rankings) => (
    <View style={styles.rankingList}>
      {players.map((player, index) => {
        const winRate = getWinPercentage(player.wins, player.matches);
        return (
          <View
            key={player.id}
            style={[styles.playerRow, index === 0 && styles.topPlayerRow]}
          >
            <View
              style={[
                styles.rankNumber,
                index === 0 && styles.rankNumberGold,
                index === 1 && styles.rankNumberSilver,
                index === 2 && styles.rankNumberBronze,
              ]}
            >
              <Text
                style={[
                  styles.rankNumberText,
                  index < 3 && styles.rankNumberMedalText,
                ]}
              >
                {String(index + 1).padStart(2, "0")}
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
              <Text style={[styles.winRate, index === 0 && styles.winRateTop]}>
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
        <Text style={styles.eyebrow}>YOUR COURT · YOUR RECORD</Text>
        <Text style={styles.heading}>Rankings</Text>
        <Text style={styles.subtitle}>
          Every player earns their own place on the ladder.
        </Text>

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
            {rankingArchive.map((snapshot) => (
              <View key={snapshot.id} style={styles.archiveCard}>
                <View style={styles.archiveCardHeader}>
                  <View>
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
                    <Text style={styles.archiveMeta}>
                      {snapshot.totalMatches}{" "}
                      {snapshot.totalMatches === 1 ? "match" : "matches"}
                    </Text>
                  </View>
                  <Text style={styles.archiveLabel}>DAY COMPLETE</Text>
                </View>
                {snapshot.rankings.length > 0 ? (
                  renderRankingRows(snapshot.rankings)
                ) : (
                  <Text style={styles.archiveEmpty}>
                    No player results saved.
                  </Text>
                )}
              </View>
            ))}
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
            Rankings sort by win percentage, then total wins. In doubles, every
            player on the winning team gets a win and every opponent gets a
            loss. Your match records stay offline on this device.
          </Text>
        </View>
        <Text style={styles.footer}>NO ACCOUNT · NO INTERNET · JUST PLAY</Text>
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
    marginTop: 22,
    marginBottom: 26,
  },
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
    marginTop: -15,
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
    paddingBottom: 10,
  },
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
  topPlayerRow: { borderColor: "#D9E6C6", backgroundColor: "#FBFDF8" },
  rankNumber: {
    width: 35,
    height: 35,
    borderRadius: 12,
    backgroundColor: "#F1F4F0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
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
  recordSeparator: { color: "#C5CDC7" },
  winRateBlock: { minWidth: 61, alignItems: "flex-end", marginLeft: 8 },
  winRate: {
    color: COLORS.green,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  winRateTop: { color: "#68840F" },
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
  infoText: { color: "#536B5E", fontSize: 11, lineHeight: 17 },
  footer: {
    textAlign: "center",
    color: "#98A39C",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginTop: 24,
  },
});
