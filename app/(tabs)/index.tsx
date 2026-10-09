import { useRef, useState } from "react";
import {
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
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
import {
    getNextDoublesServe,
    getWinningSide,
    isExtensionDecision,
    type ServerNumber,
} from "@/utils/scoring";

type MatchMode = "singles" | "doubles";
type Side = "a" | "b";
type PlayerKey = "a1" | "a2" | "b1" | "b2";

const COLORS = {
  background: "#F4F6F1",
  card: "#FFFFFF",
  ink: "#15241E",
  muted: "#7B8981",
  green: "#176B4B",
  paleGreen: "#E3F2E9",
  lime: "#D4F45B",
  line: "#E6EBE6",
  red: "#B74838",
  navy: "#17342A",
};

const initialPlayers: Record<PlayerKey, string> = {
  a1: "Player 1",
  a2: "Player 2",
  b1: "Player 3",
  b2: "Player 4",
};

export default function PlayScreen() {
  const insets = useSafeAreaInsets();
  const { isLoaded, recordMatch } = useRankings();
  const [mode, setMode] = useState<MatchMode>("singles");
  const [players, setPlayers] = useState(initialPlayers);
  const [editingPlayerKey, setEditingPlayerKey] = useState<PlayerKey | null>(
    null,
  );
  const [playerNameDraft, setPlayerNameDraft] = useState("");
  const [playerEditError, setPlayerEditError] = useState("");
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [servingSide, setServingSide] = useState<Side>("a");
  const [serverNumber, setServerNumber] = useState<ServerNumber>(2);
  const [hasDoublesScored, setHasDoublesScored] = useState(false);
  const [target, setTarget] = useState(11);
  const [resolvedAtTarget, setResolvedAtTarget] = useState<number | null>(null);
  const [winner, setWinner] = useState<Side | null>(null);
  const [started, setStarted] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const recordedMatch = useRef(false);

  const teamAKeys: PlayerKey[] = mode === "singles" ? ["a1"] : ["a1", "a2"];
  const teamBKeys: PlayerKey[] = mode === "singles" ? ["b1"] : ["b1", "b2"];
  const activeKeys = [...teamAKeys, ...teamBKeys];
  const normalizedNames = activeKeys.map((key) =>
    players[key].trim().toLocaleLowerCase(),
  );
  const namesAreValid =
    normalizedNames.every(Boolean) &&
    new Set(normalizedNames).size === normalizedNames.length;
  const extensionAvailable = isExtensionDecision(scoreA, scoreB, target);
  const showExtensionChoice = extensionAvailable && resolvedAtTarget !== target;
  const isDoubles = mode === "doubles";

  const updatePlayer = (key: PlayerKey, value: string) => {
    setPlayers((current) => ({ ...current, [key]: value }));
  };

  const openPlayerEditor = (key: PlayerKey) => {
    setEditingPlayerKey(key);
    setPlayerNameDraft(players[key]);
    setPlayerEditError("");
  };

  const closePlayerEditor = () => {
    Keyboard.dismiss();
    setEditingPlayerKey(null);
    setPlayerEditError("");
  };

  const savePlayerName = () => {
    if (!editingPlayerKey) return;
    const nextName = playerNameDraft.trim();
    if (!nextName) {
      setPlayerEditError("Enter a player name.");
      return;
    }
    const normalizedName = nextName.toLocaleLowerCase();
    const nameIsTaken = activeKeys.some(
      (key) =>
        key !== editingPlayerKey &&
        players[key].trim().toLocaleLowerCase() === normalizedName,
    );
    if (nameIsTaken) {
      setPlayerEditError("Each active player needs a unique name.");
      return;
    }
    updatePlayer(editingPlayerKey, nextName);
    closePlayerEditor();
  };

  const startNewMatch = () => {
    setScoreA(0);
    setScoreB(0);
    setServingSide("a");
    setServerNumber(2);
    setHasDoublesScored(false);
    setTarget(11);
    setResolvedAtTarget(null);
    setWinner(null);
    setStarted(false);
    setSaveError(false);
    recordedMatch.current = false;
  };

  const changeMode = (nextMode: MatchMode) => {
    if (started || nextMode === mode) return;
    setMode(nextMode);
    startNewMatch();
  };

  const addPoint = (side: Side) => {
    if (
      winner ||
      !namesAreValid ||
      !isLoaded ||
      showExtensionChoice ||
      (isDoubles && side !== servingSide)
    )
      return;
    Keyboard.dismiss();
    setStarted(true);
    if (isDoubles) setHasDoublesScored(true);

    const nextA = scoreA + Number(side === "a");
    const nextB = scoreB + Number(side === "b");
    setScoreA(nextA);
    setScoreB(nextB);

    const matchWinner = getWinningSide(nextA, nextB, target);
    if (matchWinner) {
      setWinner(matchWinner);
      if (!recordedMatch.current) {
        recordedMatch.current = true;
        recordMatch({
          sideA: teamAKeys.map((key) => players[key].trim()),
          sideB: teamBKeys.map((key) => players[key].trim()),
          scoreA: nextA,
          scoreB: nextB,
        }).catch(() => setSaveError(true));
      }
    }
  };

  const recordLostRally = () => {
    if (!isDoubles || winner) return;
    Keyboard.dismiss();
    setStarted(true);
    const nextServe = getNextDoublesServe(servingSide, serverNumber);
    setServingSide(nextServe.servingSide);
    setServerNumber(nextServe.serverNumber);
  };

  const undoPoint = (side: Side) => {
    if (winner) return;
    setResolvedAtTarget(null);
    if (side === "a") setScoreA((score) => Math.max(0, score - 1));
    else setScoreB((score) => Math.max(0, score - 1));
  };

  const extendMatch = () => {
    if (!showExtensionChoice) return;
    setTarget(target === 11 ? 15 : 21);
    setResolvedAtTarget(null);
  };

  const finishAtCurrentTarget = () => {
    if (!showExtensionChoice) return;
    setResolvedAtTarget(target);
  };

  const renderPlayerField = (key: PlayerKey, label: string) => (
    <View key={key} style={styles.playerField}>
      <Text style={styles.inputLabel}>{label}</Text>
      <Pressable
        accessibilityLabel={`Edit ${label} name`}
        accessibilityRole="button"
        disabled={Boolean(winner)}
        onPress={() => openPlayerEditor(key)}
        style={[
          styles.playerNameButton,
          Boolean(winner) && styles.playerNameButtonDisabled,
        ]}
      >
        <Text style={styles.playerNameText} numberOfLines={1}>
          {players[key]}
        </Text>
        <Text style={styles.editNameHint}>EDIT</Text>
      </Pressable>
    </View>
  );

  const winningNames =
    winner === "a"
      ? teamAKeys.map((key) => players[key]).join(" & ")
      : teamBKeys.map((key) => players[key]).join(" & ");

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
        <View style={styles.topRow}>
          <View>
            <Text style={styles.eyebrow}>COURT SIDE · OFFLINE</Text>
            <Text style={styles.heading}>Keep score.</Text>
          </View>
          <View style={styles.brandMark}>
            <Text style={styles.brandMarkText}>P</Text>
          </View>
        </View>

        <View style={styles.modeSwitch}>
          {(["singles", "doubles"] as MatchMode[]).map((option) => (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{
                selected: mode === option,
                disabled: started,
              }}
              disabled={started}
              key={option}
              onPress={() => changeMode(option)}
              style={[
                styles.modeButton,
                mode === option && styles.modeButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.modeText,
                  mode === option && styles.modeTextActive,
                ]}
              >
                {option === "singles" ? "Singles" : "Doubles"}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHeadingRow}>
          <Text style={styles.sectionTitle}>Players</Text>
          <Text style={styles.sectionHint}>
            {started
              ? "Tap a name to update or sub a player"
              : "Tap a name to edit · used for rankings"}
          </Text>
        </View>

        <View style={styles.teamsRow}>
          <View style={styles.teamCard}>
            <View style={styles.teamTitleRow}>
              <View style={[styles.teamDot, styles.teamDotA]} />
              <Text style={styles.teamTitle}>TEAM A</Text>
            </View>
            {teamAKeys.map((key, index) =>
              renderPlayerField(
                key,
                mode === "singles" ? "Player" : `Player ${index + 1}`,
              ),
            )}
          </View>
          <View style={styles.teamCard}>
            <View style={styles.teamTitleRow}>
              <View style={[styles.teamDot, styles.teamDotB]} />
              <Text style={styles.teamTitle}>TEAM B</Text>
            </View>
            {teamBKeys.map((key, index) =>
              renderPlayerField(
                key,
                mode === "singles" ? "Player" : `Player ${index + 1}`,
              ),
            )}
          </View>
        </View>
        {!namesAreValid && (
          <Text style={styles.validationText}>
            Enter a unique name for each player.
          </Text>
        )}

        <View style={styles.scoreHeader}>
          <View>
            <Text style={styles.sectionTitle}>Match score</Text>
            <Text style={styles.sectionHint}>First to {target} wins</Text>
          </View>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>{winner ? "FINAL" : "LIVE"}</Text>
          </View>
        </View>

        <View style={styles.scoreCard}>
          <View style={styles.scoreTeam}>
            <Text style={styles.scoreTeamLabel}>TEAM A</Text>
            {isDoubles && servingSide === "a" && (
              <Text style={styles.servingLabel}>SERVING · {serverNumber}</Text>
            )}
            <Text style={styles.teamCaption} numberOfLines={1}>
              {teamAKeys.map((key) => players[key]).join(" & ")}
            </Text>
            <Text
              style={[styles.scoreNumber, winner === "a" && styles.winnerScore]}
            >
              {scoreA}
            </Text>
            <View style={styles.scoreControls}>
              <Pressable
                accessibilityLabel="Undo Team A point"
                disabled={scoreA === 0 || Boolean(winner)}
                onPress={() => undoPoint("a")}
                style={styles.undoButton}
              >
                <Text style={styles.undoText}>−</Text>
              </Pressable>
              <Pressable
                accessibilityLabel="Add Team A point"
                disabled={
                  !namesAreValid ||
                  !isLoaded ||
                  Boolean(winner) ||
                  showExtensionChoice ||
                  (isDoubles && servingSide !== "a")
                }
                onPress={() => addPoint("a")}
                style={[
                  styles.addButton,
                  styles.addButtonA,
                  (!namesAreValid ||
                    !isLoaded ||
                    Boolean(winner) ||
                    showExtensionChoice) &&
                    styles.buttonDisabled,
                ]}
              >
                <Text style={styles.addButtonText}>+</Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.scoreDivider}>
            <Text style={styles.vsText}>VS</Text>
          </View>
          <View style={styles.scoreTeam}>
            <Text style={styles.scoreTeamLabel}>TEAM B</Text>
            {isDoubles && servingSide === "b" && (
              <Text style={styles.servingLabel}>SERVING · {serverNumber}</Text>
            )}
            <Text style={styles.teamCaption} numberOfLines={1}>
              {teamBKeys.map((key) => players[key]).join(" & ")}
            </Text>
            <Text
              style={[styles.scoreNumber, winner === "b" && styles.winnerScore]}
            >
              {scoreB}
            </Text>
            <View style={styles.scoreControls}>
              <Pressable
                accessibilityLabel="Undo Team B point"
                disabled={scoreB === 0 || Boolean(winner)}
                onPress={() => undoPoint("b")}
                style={styles.undoButton}
              >
                <Text style={styles.undoText}>−</Text>
              </Pressable>
              <Pressable
                accessibilityLabel="Add Team B point"
                disabled={
                  !namesAreValid ||
                  !isLoaded ||
                  Boolean(winner) ||
                  showExtensionChoice ||
                  (isDoubles && servingSide !== "b")
                }
                onPress={() => addPoint("b")}
                style={[
                  styles.addButton,
                  styles.addButtonB,
                  (!namesAreValid ||
                    !isLoaded ||
                    Boolean(winner) ||
                    showExtensionChoice) &&
                    styles.buttonDisabled,
                ]}
              >
                <Text style={styles.addButtonText}>+</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {isDoubles && hasDoublesScored && (
          <View style={styles.servePanel}>
            <View style={styles.serveDetails}>
              <Text style={styles.serveKicker}>DOUBLES SERVE</Text>
              <Text style={styles.serveCurrent}>
                Team {servingSide.toUpperCase()} · Server {serverNumber}
              </Text>
              <Text style={styles.serveNotation}>
                {scoreA} – {scoreB} – {serverNumber}
              </Text>
            </View>
            <Pressable
              accessibilityLabel={
                serverNumber === 1
                  ? "Lose rally and move to second server"
                  : "Lose rally and give service to the other team"
              }
              disabled={Boolean(winner)}
              onPress={recordLostRally}
              style={[
                styles.sideOutButton,
                Boolean(winner) && styles.buttonDisabled,
              ]}
            >
              <Text style={styles.sideOutButtonText}>
                {serverNumber === 1
                  ? "Lost rally\nServer 2"
                  : "Lost rally\nSide out"}
              </Text>
            </Pressable>
          </View>
        )}

        {showExtensionChoice && !winner && (
          <View style={styles.extensionCard}>
            <View style={styles.extensionIcon}>
              <Text style={styles.extensionIconText}>!</Text>
            </View>
            <Text style={styles.extensionTitle}>
              Deuce at {scoreA}–{scoreB}
            </Text>
            <Text style={styles.extensionDescription}>
              Choose {target} as the winning score, or extend the game to{" "}
              {target === 11 ? 15 : 21}. Play continues until a team reaches the
              selected score.
            </Text>
            <View style={styles.extensionActions}>
              <Pressable
                onPress={finishAtCurrentTarget}
                style={styles.finishButton}
              >
                <Text style={styles.finishButtonText}>Play to {target}</Text>
              </Pressable>
              <Pressable onPress={extendMatch} style={styles.extendButton}>
                <Text style={styles.extendButtonText}>
                  Extend to {target === 11 ? 15 : 21} ↗
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {winner && (
          <View style={styles.resultCard}>
            <View style={styles.resultIcon}>
              <Text style={styles.resultIconText}>✓</Text>
            </View>
            <View style={styles.resultCopy}>
              <Text style={styles.resultKicker}>MATCH COMPLETE</Text>
              <Text style={styles.resultTitle}>{winningNames} won</Text>
              <Text style={styles.resultSubtitle}>
                Individual records updated on this device.
              </Text>
            </View>
          </View>
        )}
        {winner && (
          <Pressable onPress={startNewMatch} style={styles.newMatchButton}>
            <Text style={styles.newMatchText}>Start a new match</Text>
          </Pressable>
        )}
        {saveError && (
          <Text style={styles.validationText}>
            Could not save the ranking on this device. Please try again.
          </Text>
        )}

        <View style={styles.rulesNote}>
          <Text style={styles.rulesIcon}>✦</Text>
          <Text style={styles.rulesText}>
            At 10–10, choose to finish at 11 or extend to 15. At 14–14, choose
            to finish at 15 or extend to 21.
          </Text>
        </View>

        <Text style={styles.footer}>
          YOUR SCORES & RANKINGS STAY ON THIS DEVICE
        </Text>
      </ScrollView>
      <Modal
        animationType="fade"
        onRequestClose={closePlayerEditor}
        statusBarTranslucent
        transparent
        visible={editingPlayerKey !== null}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalBackdrop}
        >
          <Pressable
            accessibilityLabel="Close player editor"
            onPress={closePlayerEditor}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.editPlayerModal}>
            <Text style={styles.modalEyebrow}>PLAYER LINEUP</Text>
            <Text style={styles.modalTitle}>Update player</Text>
            <Text style={styles.modalDescription}>
              Change the name or enter a substitute. The updated player will be
              used for this match’s individual ranking.
            </Text>
            <TextInput
              accessibilityLabel="Updated player name"
              autoCapitalize="words"
              autoFocus
              maxLength={24}
              onChangeText={(value) => {
                setPlayerNameDraft(value);
                setPlayerEditError("");
              }}
              onSubmitEditing={savePlayerName}
              placeholder="Player name"
              placeholderTextColor={COLORS.muted}
              returnKeyType="done"
              selectTextOnFocus
              style={styles.modalNameInput}
              value={playerNameDraft}
            />
            {playerEditError ? (
              <Text style={styles.modalError}>{playerEditError}</Text>
            ) : null}
            <View style={styles.modalActions}>
              <Pressable
                onPress={closePlayerEditor}
                style={styles.modalCancelButton}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={savePlayerName}
                style={styles.modalSaveButton}
              >
                <Text style={styles.modalSaveText}>Update player</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  eyebrow: {
    color: COLORS.green,
    fontSize: 10,
    letterSpacing: 1.7,
    fontWeight: "800",
    marginBottom: 5,
  },
  heading: {
    color: COLORS.ink,
    fontSize: 31,
    lineHeight: 36,
    fontWeight: "800",
    letterSpacing: -1.1,
  },
  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: COLORS.lime,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-7deg" }],
  },
  brandMarkText: {
    color: COLORS.navy,
    fontSize: 23,
    fontWeight: "900",
    fontStyle: "italic",
  },
  modeSwitch: {
    flexDirection: "row",
    backgroundColor: "#E9EDE8",
    padding: 4,
    borderRadius: 15,
    marginBottom: 25,
  },
  modeButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 42,
    borderRadius: 12,
  },
  modeButtonActive: {
    backgroundColor: COLORS.card,
    shadowColor: "#183729",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  modeText: { fontSize: 14, color: COLORS.muted, fontWeight: "700" },
  modeTextActive: { color: COLORS.ink },
  sectionHeadingRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: {
    color: COLORS.ink,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  sectionHint: { color: COLORS.muted, fontSize: 10, fontWeight: "600" },
  teamsRow: { flexDirection: "row", gap: 10 },
  teamCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 13,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  teamTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 6,
  },
  teamDot: { width: 7, height: 7, borderRadius: 4 },
  teamDotA: { backgroundColor: COLORS.green },
  teamDotB: { backgroundColor: "#E8A34C" },
  teamTitle: {
    color: COLORS.muted,
    fontSize: 10,
    letterSpacing: 1.3,
    fontWeight: "800",
  },
  playerField: { marginBottom: 8 },
  inputLabel: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: "700",
    marginBottom: 4,
  },
  playerNameButton: {
    height: 39,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 5,
    borderRadius: 10,
    paddingHorizontal: 9,
    backgroundColor: "#F5F7F4",
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  playerNameText: {
    flex: 1,
    color: COLORS.ink,
    fontSize: 13,
    fontWeight: "600",
  },
  editNameHint: {
    color: COLORS.green,
    fontSize: 8,
    letterSpacing: 0.5,
    fontWeight: "900",
  },
  modalBackdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "rgba(12, 30, 22, 0.5)",
  },
  editPlayerModal: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 23,
    padding: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.line,
    shadowColor: "#000000",
    shadowOpacity: 0.15,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  modalEyebrow: {
    color: COLORS.green,
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: "900",
  },
  modalTitle: {
    color: COLORS.ink,
    fontSize: 23,
    fontWeight: "800",
    marginTop: 5,
  },
  modalDescription: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 15,
  },
  modalNameInput: {
    height: 39,
    borderRadius: 11,
    paddingHorizontal: 12,
    backgroundColor: "#F5F7F4",
    color: COLORS.ink,
    fontSize: 15,
    fontWeight: "700",
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  modalError: {
    color: COLORS.red,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 7,
  },
  modalActions: { flexDirection: "row", gap: 9, marginTop: 17 },
  modalCancelButton: {
    flex: 1,
    height: 45,
    borderRadius: 13,
    backgroundColor: "#F1F4F0",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: { color: COLORS.muted, fontSize: 13, fontWeight: "800" },
  modalSaveButton: {
    flex: 1,
    height: 45,
    borderRadius: 13,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSaveText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  playerNameButtonDisabled: { opacity: 0.55 },
  validationText: {
    color: COLORS.red,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8,
  },
  scoreHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 25,
    marginBottom: 10,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.paleGreen,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.green,
  },
  liveText: {
    color: COLORS.green,
    fontSize: 9,
    letterSpacing: 1.2,
    fontWeight: "900",
  },
  scoreCard: {
    minHeight: 235,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.navy,
    borderRadius: 23,
    paddingHorizontal: 11,
    paddingVertical: 20,
  },
  scoreTeam: { flex: 1, alignItems: "center", minWidth: 0 },
  scoreTeamLabel: {
    color: "#A8C7B8",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.6,
  },
  servingLabel: {
    color: COLORS.lime,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginTop: 4,
    marginBottom: -3,
  },
  teamCaption: {
    color: "#DCE9E1",
    fontSize: 10,
    height: 20,
    marginTop: 5,
    maxWidth: "95%",
  },
  scoreNumber: {
    color: "#FFFFFF",
    fontSize: 64,
    lineHeight: 76,
    fontWeight: "800",
    letterSpacing: -3,
  },
  winnerScore: { color: COLORS.lime },
  scoreDivider: {
    width: 1,
    height: 105,
    backgroundColor: "#426053",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 2,
  },
  vsText: {
    color: "#A8C7B8",
    position: "absolute",
    backgroundColor: COLORS.navy,
    paddingVertical: 7,
    paddingHorizontal: 4,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  scoreControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 6,
  },
  undoButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#29483A",
    alignItems: "center",
    justifyContent: "center",
  },
  undoText: {
    color: "#DCE9E1",
    fontSize: 25,
    lineHeight: 28,
    fontWeight: "500",
  },
  addButton: {
    width: 49,
    height: 49,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonA: { backgroundColor: COLORS.lime },
  addButtonB: { backgroundColor: "#F4B45E" },
  addButtonText: {
    color: COLORS.navy,
    fontSize: 29,
    lineHeight: 33,
    fontWeight: "700",
  },
  buttonDisabled: { opacity: 0.42 },
  servePanel: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.card,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginTop: 9,
  },
  serveDetails: { flex: 1 },
  serveKicker: {
    color: COLORS.muted,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  serveCurrent: {
    color: COLORS.ink,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 3,
  },
  serveNotation: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.1,
    marginTop: 3,
  },
  sideOutButton: {
    minWidth: 100,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.paleGreen,
    borderRadius: 12,
    paddingHorizontal: 11,
  },
  sideOutButtonText: {
    color: COLORS.green,
    fontSize: 10,
    fontWeight: "900",
    textAlign: "center",
    lineHeight: 14,
  },
  extensionCard: {
    marginTop: 12,
    backgroundColor: "#FFF8E8",
    borderWidth: 1,
    borderColor: "#F2E2BD",
    borderRadius: 18,
    padding: 15,
  },
  extensionIcon: {
    width: 25,
    height: 25,
    borderRadius: 9,
    backgroundColor: "#F7E4B7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  extensionIconText: { color: "#8B641E", fontWeight: "900", fontSize: 15 },
  extensionTitle: { color: COLORS.ink, fontSize: 17, fontWeight: "800" },
  extensionDescription: {
    color: "#756B57",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  extensionActions: { flexDirection: "row", gap: 8, marginTop: 13 },
  finishButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: "#F2E7D1",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  finishButtonText: { color: "#6C5B3B", fontSize: 12, fontWeight: "800" },
  extendButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  extendButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  resultCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.paleGreen,
    borderRadius: 18,
    padding: 14,
    marginTop: 12,
    gap: 12,
  },
  resultIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
  },
  resultIconText: { color: "#FFFFFF", fontSize: 19, fontWeight: "900" },
  resultCopy: { flex: 1 },
  resultKicker: {
    color: COLORS.green,
    fontSize: 9,
    letterSpacing: 1.3,
    fontWeight: "900",
  },
  resultTitle: {
    color: COLORS.ink,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 2,
  },
  resultSubtitle: { color: "#5E7568", fontSize: 10, marginTop: 2 },
  rulesNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 4,
  },
  rulesIcon: {
    color: COLORS.green,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 1,
  },
  rulesText: { flex: 1, color: COLORS.muted, fontSize: 11, lineHeight: 16 },
  newMatchButton: {
    height: 49,
    borderRadius: 15,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 17,
  },
  newMatchText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  footer: {
    textAlign: "center",
    color: "#98A39C",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.25,
    marginTop: 24,
  },
});
