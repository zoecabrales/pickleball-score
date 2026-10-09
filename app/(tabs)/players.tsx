import { useMemo, useState } from "react";
import {
    Alert,
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
import { Palette, useAppTheme } from "@/context/ThemeContext";

export default function PlayersScreen() {
  const insets = useSafeAreaInsets();
  const { colors: COLORS, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const {
    registeredPlayers,
    rankings,
    addRegisteredPlayer,
    removeRegisteredPlayer,
    isLoaded,
  } = useRankings();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const confirmRemove = (name: string) => {
    Alert.alert(
      `Remove ${name}?`,
      "They will no longer appear in the player picker. Their ranking history is kept.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            void removeRegisteredPlayer(name).catch(() => {
              Alert.alert("Could not remove player", "Please try again.");
            });
          },
        },
      ],
    );
  };

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
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={COLORS.background} />
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
        <Text style={styles.count}>
          Register players here to pick them quickly when starting a match.
        </Text>

        <View style={styles.entryCard}>
          <Text style={styles.entryLabel}>ADD A NEW PLAYER</Text>
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
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Registered players</Text>
          <View style={styles.listCountBadge}>
            <Text style={styles.listCount}>{registeredPlayers.length}</Text>
          </View>
        </View>

        {!isLoaded ? (
          <Text style={styles.emptyMessage}>Loading players…</Text>
        ) : registeredPlayers.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No players yet</Text>
            <Text style={styles.emptyMessage}>
              Add your first player above to get started.
            </Text>
          </View>
        ) : (
          <View style={styles.playerList}>
            {registeredPlayers.map((name) => {
              const stats = rankings.find(
                (player) => player.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
              );
              return (
                <View key={name.toLocaleLowerCase()} style={styles.playerRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {name.trim().charAt(0).toLocaleUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName} numberOfLines={1}>
                      {name}
                    </Text>
                    <Text style={styles.playerRecord}>
                      {stats
                        ? `${stats.wins}W · ${stats.losses}L today`
                        : "No matches yet"}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityLabel={`Remove ${name}`}
                    accessibilityRole="button"
                    hitSlop={8}
                    onPress={() => confirmRemove(name)}
                    style={styles.removeButton}
                  >
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
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
  count: { color: COLORS.muted, fontSize: 13, marginTop: 4, lineHeight: 19 },
  entryCard: {
    marginTop: 22,
    padding: 14,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  entryLabel: {
    color: COLORS.green,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.4,
    marginBottom: 10,
  },
  entryRow: { flexDirection: "row", gap: 8 },
  nameInput: {
    flex: 1,
    minWidth: 0,
    height: 46,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: COLORS.background,
    color: COLORS.ink,
    fontSize: 14,
    fontWeight: "600",
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  addButton: {
    minWidth: 104,
    height: 46,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  disabledButton: { opacity: 0.5 },
  error: { color: COLORS.red, fontSize: 12, marginTop: 10 },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 28,
    marginBottom: 12,
  },
  listTitle: { color: COLORS.ink, fontSize: 16, fontWeight: "800" },
  listCountBadge: {
    minWidth: 26,
    alignItems: "center",
    borderRadius: 13,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: COLORS.paleGreen,
  },
  listCount: { color: COLORS.green, fontSize: 12, fontWeight: "800" },
  playerList: { gap: 8 },
  playerRow: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.paleGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: COLORS.green, fontSize: 16, fontWeight: "900" },
  playerInfo: { flex: 1, minWidth: 0 },
  playerName: { color: COLORS.ink, fontSize: 14, fontWeight: "700" },
  playerRecord: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  removeButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F0D6D1",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  removeButtonText: { color: COLORS.red, fontSize: 11, fontWeight: "800" },
  emptyCard: {
    alignItems: "center",
    padding: 24,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  emptyTitle: { color: COLORS.ink, fontSize: 15, fontWeight: "800" },
  emptyMessage: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 6,
    textAlign: "center",
  },
});
