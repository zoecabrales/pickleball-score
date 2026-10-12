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

const MIN_DUO_MATCHES = 3;

export default function PlayersScreen() {
  const insets = useSafeAreaInsets();
  const { colors: COLORS, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const {
    registeredPlayers,
    rankings,
    duos,
    addRegisteredPlayer,
    removeRegisteredPlayer,
    absentPlayers,
    setPlayerPresent,
    isLoaded,
  } = useRankings();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isListOpen, setIsListOpen] = useState(true);
  const [isDuosOpen, setIsDuosOpen] = useState(true);

  const rankedDuos = useMemo(() => {
    const rate = (duo: (typeof duos)[number]) => duo.wins / duo.matches;
    const sorted = duos
      .filter((duo) => duo.matches > 0)
      .map((duo) => ({ ...duo, provisional: duo.matches < MIN_DUO_MATCHES }))
      .sort(
        (left, right) =>
          Number(left.provisional) - Number(right.provisional) ||
          rate(right) - rate(left) ||
          right.wins - left.wins ||
          left.names.join().localeCompare(right.names.join()),
      );
    const ranked: ((typeof sorted)[number] & { rank: number })[] = [];
    sorted.forEach((duo, index) => {
      const previous = ranked[index - 1];
      const tied =
        previous &&
        previous.provisional === duo.provisional &&
        previous.wins === duo.wins &&
        previous.matches === duo.matches;
      ranked.push({ ...duo, rank: tied ? previous.rank : index + 1 });
    });
    return ranked;
  }, [duos]);

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
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={{ height: insets.top, backgroundColor: COLORS.background }} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: 8 },
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

        <Pressable
          accessibilityLabel={`${isListOpen ? "Collapse" : "Expand"} registered players`}
          accessibilityRole="button"
          accessibilityState={{ expanded: isListOpen }}
          onPress={() => setIsListOpen((open) => !open)}
          style={styles.listHeader}
        >
          <Text style={styles.listTitle}>Registered players</Text>
          <View style={styles.listHeaderRight}>
            <View style={styles.listCountBadge}>
              <Text style={styles.listCount}>{registeredPlayers.length}</Text>
            </View>
            <Text style={styles.listChevron}>{isListOpen ? "▲" : "▼"}</Text>
          </View>
        </Pressable>

        {!isListOpen ? null : !isLoaded ? (
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
              const isPresent = !absentPlayers.some(
                (absent) => absent.toLocaleLowerCase() === name.toLocaleLowerCase(),
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
                    accessibilityLabel={`${name} is ${isPresent ? "ready" : "not ready"}. Tap to mark ${isPresent ? "not ready" : "ready"}`}
                    accessibilityRole="button"
                    hitSlop={8}
                    onPress={() => {
                      void setPlayerPresent(name, !isPresent).catch(() => {
                        Alert.alert("Could not update player", "Please try again.");
                      });
                    }}
                    style={[
                      styles.readyButton,
                      !isPresent && styles.notReadyButton,
                    ]}
                  >
                    <Text
                      style={[
                        styles.readyButtonText,
                        !isPresent && styles.notReadyButtonText,
                      ]}
                    >
                      {isPresent ? "Ready" : "Not ready"}
                    </Text>
                  </Pressable>
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

        <Pressable
          accessibilityLabel={`${isDuosOpen ? "Collapse" : "Expand"} top duos`}
          accessibilityRole="button"
          accessibilityState={{ expanded: isDuosOpen }}
          onPress={() => setIsDuosOpen((open) => !open)}
          style={styles.listHeader}
        >
          <Text style={styles.listTitle}>Top duos</Text>
          <View style={styles.listHeaderRight}>
            <View style={styles.listCountBadge}>
              <Text style={styles.listCount}>{rankedDuos.length}</Text>
            </View>
            <Text style={styles.listChevron}>{isDuosOpen ? "▲" : "▼"}</Text>
          </View>
        </Pressable>

        {isDuosOpen &&
          (rankedDuos.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No duos yet</Text>
              <Text style={styles.emptyMessage}>
                Partners from doubles matches appear here. Pairs need{" "}
                {MIN_DUO_MATCHES}+ matches together to rank.
              </Text>
            </View>
          ) : (
            <View style={styles.playerList}>
              {rankedDuos.map((duo) => (
                <View key={duo.id} style={styles.playerRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {duo.provisional ? "–" : duo.rank}
                    </Text>
                  </View>
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName} numberOfLines={1}>
                      {duo.names[0]} & {duo.names[1]}
                    </Text>
                    <Text style={styles.playerRecord}>
                      {duo.wins}W · {duo.losses}L ·{" "}
                      {Math.round((duo.wins / duo.matches) * 100)}%
                      {duo.provisional ? " · provisional" : ""}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ))}
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
  listHeaderRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  listChevron: { color: COLORS.muted, fontSize: 11, fontWeight: "800" },
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
  readyButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.green,
    backgroundColor: COLORS.paleGreen,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginRight: 6,
  },
  notReadyButton: { borderColor: COLORS.line, backgroundColor: COLORS.background },
  readyButtonText: { color: COLORS.green, fontSize: 11, fontWeight: "800" },
  notReadyButtonText: { color: COLORS.muted },
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
