import { forwardRef } from "react";
import { StyleSheet, Text, View } from "react-native";

export type ShareAward = {
  icon: string;
  label: string;
  name: string;
  note: string;
};

type HighlightsShareCardProps = {
  monthLabel: string;
  awards: ShareAward[];
  duo: { names: string; note: string } | null;
  sessions: number;
  matches: number;
};

// Fixed light colors so the shared image looks the same in any app theme.
const HighlightsShareCard = forwardRef<View, HighlightsShareCardProps>(
  function HighlightsShareCard(
    { monthLabel, awards, duo, sessions, matches },
    ref,
  ) {
    return (
      <View ref={ref} collapsable={false} style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>PICKLE SCORER</Text>
          <Text style={styles.title}>Monthly Highlights</Text>
          <Text style={styles.subtitle}>
            {monthLabel} · {sessions} {sessions === 1 ? "session" : "sessions"}{" "}
            · {matches} {matches === 1 ? "match" : "matches"}
          </Text>
        </View>

        <View style={styles.list}>
          {awards.map((award) => (
            <View key={award.label} style={styles.row}>
              <Text style={styles.icon}>{award.icon}</Text>
              <View style={styles.body}>
                <Text style={styles.label}>{award.label}</Text>
                <Text style={styles.name} numberOfLines={1}>
                  {award.name}
                </Text>
                <Text style={styles.note}>{award.note}</Text>
              </View>
            </View>
          ))}
          {duo && (
            <View style={styles.duoBox}>
              <Text style={styles.duoLabel}>DYNAMIC DUO</Text>
              <Text style={styles.duoNames} numberOfLines={1}>
                {duo.names}
              </Text>
              <Text style={styles.duoNote}>{duo.note}</Text>
            </View>
          )}
        </View>

        <Text style={styles.footer}>Thanks for playing, everyone!</Text>
      </View>
    );
  },
);

export default HighlightsShareCard;

const styles = StyleSheet.create({
  card: { width: 360, padding: 20, backgroundColor: "#F4F6F1" },
  header: { padding: 16, borderRadius: 16, backgroundColor: "#17342A" },
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
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6EBE6",
  },
  icon: { fontSize: 26 },
  body: { flex: 1, minWidth: 0 },
  label: {
    color: "#176B4B",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  name: { color: "#15241E", fontSize: 18, fontWeight: "800", marginTop: 2 },
  note: { color: "#7B8981", fontSize: 12, marginTop: 2 },
  duoBox: { padding: 16, borderRadius: 14, backgroundColor: "#17342A" },
  duoLabel: {
    color: "#D4F45B",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  duoNames: { color: "#FFFFFF", fontSize: 20, fontWeight: "800", marginTop: 6 },
  duoNote: { color: "#BFD4C8", fontSize: 12, marginTop: 4 },
  footer: {
    color: "#7B8981",
    fontSize: 12,
    textAlign: "center",
    marginTop: 16,
  },
});
