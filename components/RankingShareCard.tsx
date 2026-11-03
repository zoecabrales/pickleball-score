import { forwardRef } from "react";
import { StyleSheet, Text, View, type HostInstance } from "react-native";

import { getSharedRanks, getWinPercentage } from "@/utils/scoring";

type SharePlayer = {
  id: string;
  name: string;
  wins: number;
  losses: number;
  matches: number;
};

type RankingShareCardProps = {
  players: SharePlayer[];
  totalMatches: number;
};

const MEDAL_COLORS: Record<number, string> = {
  1: "#F2C94C",
  2: "#C7D0D9",
  3: "#CD8B5A",
};

// Fixed light colors so the shared image looks the same in any app theme.
const RankingShareCard = forwardRef<HostInstance, RankingShareCardProps>(
  function RankingShareCard({ players, totalMatches }, ref) {
    const ranks = getSharedRanks(players);
    const dateLabel = new Date().toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return (
      <View ref={ref} collapsable={false} style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>PICKLE SCORER</Text>
          <Text style={styles.title}>Player Ladder</Text>
          <Text style={styles.subtitle}>
            {dateLabel} · {players.length}{" "}
            {players.length === 1 ? "player" : "players"} · {totalMatches}{" "}
            {totalMatches === 1 ? "match" : "matches"}
          </Text>
        </View>

        <View style={styles.list}>
          {players.map((player, index) => {
            const rank = ranks[index];
            return (
              <View key={player.id} style={styles.row}>
                <View
                  style={[
                    styles.rankBadge,
                    MEDAL_COLORS[rank]
                      ? { backgroundColor: MEDAL_COLORS[rank] }
                      : null,
                  ]}
                >
                  <Text style={styles.rankText}>{rank}</Text>
                </View>
                <View style={styles.info}>
                  <Text style={styles.name} numberOfLines={1}>
                    {player.name}
                  </Text>
                  <Text style={styles.record}>
                    {player.wins}W · {player.losses}L · {player.matches}{" "}
                    {player.matches === 1 ? "match" : "matches"}
                  </Text>
                </View>
                <Text style={styles.rate}>
                  {getWinPercentage(player.wins, player.matches)}%
                </Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.footer}>Thanks for playing, everyone!</Text>
      </View>
    );
  },
);

export default RankingShareCard;

const styles = StyleSheet.create({
  card: {
    width: 360,
    padding: 20,
    backgroundColor: "#F4F6F1",
  },
  header: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#17342A",
  },
  eyebrow: {
    color: "#D4F45B",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  title: { color: "#FFFFFF", fontSize: 26, fontWeight: "800", marginTop: 4 },
  subtitle: { color: "#B9CBC1", fontSize: 12, marginTop: 4 },
  list: { marginTop: 14, gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6EBE6",
  },
  rankBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E6EBE6",
  },
  rankText: { color: "#15241E", fontSize: 13, fontWeight: "800" },
  info: { flex: 1, minWidth: 0 },
  name: { color: "#15241E", fontSize: 15, fontWeight: "800" },
  record: { color: "#7B8981", fontSize: 11, marginTop: 2 },
  rate: { color: "#176B4B", fontSize: 18, fontWeight: "800" },
  footer: {
    color: "#7B8981",
    fontSize: 12,
    textAlign: "center",
    marginTop: 16,
  },
});
