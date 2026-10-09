import { useState } from "react";
import {
    Keyboard,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useRankings } from "@/context/RankingContext";

const COLORS = {
  background: "#F4F6F1",
  card: "#FFFFFF",
  ink: "#15241E",
  muted: "#7B8981",
  green: "#176B4B",
  paleGreen: "#E3F2E9",
  line: "#E6EBE6",
  red: "#B74838",
};

export default function PlayersScreen() {
  const insets = useSafeAreaInsets();
  const { registeredPlayers, addRegisteredPlayer, isLoaded } = useRankings();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const registerPlayer = async () => {
    const name = draft.trim();
    if (!name) {
      setError("Enter a player name.");
      return;
    }
    if (!isLoaded || isSaving) return;

    setIsSaving(true);
    setError("");
    try {
      const wasAdded = await addRegisteredPlayer(name);
      if (!wasAdded) {
        setError("That player is already registered.");
        return;
      }
      setDraft("");
      Keyboard.dismiss();
    } catch {
      setError("Could not save this player. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: Math.max(insets.top, 16) + 8 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>YOUR COURT · PLAYER ROSTER</Text>
        <Text style={styles.heading}>Players</Text>
        <Text style={styles.count}>{registeredPlayers.length} registered</Text>

        <View style={styles.entryRow}>
          <TextInput
            accessibilityLabel="Player name"
            autoCapitalize="words"
            editable={isLoaded && !isSaving}
            maxLength={24}
            onChangeText={(value) => {
              setDraft(value);
              setError("");
            }}
            onSubmitEditing={() => void registerPlayer()}
            placeholder="Player name"
            placeholderTextColor={COLORS.muted}
            returnKeyType="done"
            style={styles.nameInput}
            value={draft}
          />
          <Pressable
            accessibilityRole="button"
            disabled={!isLoaded || isSaving}
            onPress={() => void registerPlayer()}
            style={[
              styles.addButton,
              (!isLoaded || isSaving) && styles.disabledButton,
            ]}
          >
            <Text style={styles.addButtonText}>Add player</Text>
          </Pressable>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Registered players</Text>
          <Text style={styles.listCount}>{registeredPlayers.length}</Text>
        </View>

        {!isLoaded ? (
          <Text style={styles.emptyMessage}>Loading players…</Text>
        ) : registeredPlayers.length === 0 ? (
          <Text style={styles.emptyMessage}>No players registered yet.</Text>
        ) : (
          <View style={styles.playerList}>
            {registeredPlayers.map((name, index) => (
              <View key={name.toLocaleLowerCase()} style={styles.playerRow}>
                <Text style={styles.playerIndex}>
                  {String(index + 1).padStart(2, "0")}
                </Text>
                <Text style={styles.playerName} numberOfLines={1}>
                  {name}
                </Text>
                <View style={styles.registeredMark}>
                  <Text style={styles.registeredMarkText}>READY</Text>
                </View>
              </View>
            ))}
          </View>
        )}
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
  count: { color: COLORS.muted, fontSize: 13, marginTop: 4 },
  entryRow: { flexDirection: "row", gap: 8, marginTop: 22 },
  nameInput: {
    flex: 1,
    minWidth: 0,
    height: 46,
    borderRadius: 11,
    paddingHorizontal: 12,
    backgroundColor: COLORS.card,
    color: COLORS.ink,
    fontSize: 14,
    fontWeight: "600",
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  addButton: {
    minWidth: 104,
    height: 46,
    borderRadius: 11,
    paddingHorizontal: 12,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  disabledButton: { opacity: 0.5 },
  error: { color: COLORS.red, fontSize: 12, marginTop: 8 },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 30,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  listTitle: { color: COLORS.ink, fontSize: 16, fontWeight: "800" },
  listCount: { color: COLORS.muted, fontSize: 12, fontWeight: "700" },
  playerList: { backgroundColor: COLORS.card },
  playerRow: {
    minHeight: 55,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    paddingHorizontal: 4,
  },
  playerIndex: {
    width: 25,
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "800",
  },
  playerName: { flex: 1, color: COLORS.ink, fontSize: 14, fontWeight: "700" },
  registeredMark: {
    borderRadius: 20,
    backgroundColor: COLORS.paleGreen,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  registeredMarkText: {
    color: COLORS.green,
    fontSize: 8,
    fontWeight: "900",
  },
  emptyMessage: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 16,
  },
});
