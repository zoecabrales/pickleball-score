import { useEffect, useMemo, useRef, useState } from "react";
import {
    Keyboard,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PlayerNamePicker from "@/components/PlayerNamePicker";
import { useRankings } from "@/context/RankingContext";
import { Palette, useAppTheme } from "@/context/ThemeContext";
import { getNextBalancedDoublesTeams } from "@/utils/doubles";
import {
    getNextDoublesServe,
    getWinningSide,
    isExtensionDecision,
    type ServerNumber,
} from "@/utils/scoring";

type MatchMode = "singles" | "doubles";
type PlayCategory = "session" | "tournament";
type Side = "a" | "b";
type PlayerKey = "a1" | "a2" | "b1" | "b2";

const initialPlayers: Record<PlayerKey, string> = {
  a1: "",
  a2: "",
  b1: "",
  b2: "",
};

export default function PlayScreen() {
  const insets = useSafeAreaInsets();
  const { colors: COLORS, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const { isLoaded, rankings, registeredPlayers, recordMatch, wipeCount } =
    useRankings();
  const [playCategory, setPlayCategory] = useState<PlayCategory>("session");
  const [mode, setMode] = useState<MatchMode>("singles");
  const [players, setPlayers] = useState(initialPlayers);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [servingSide, setServingSide] = useState<Side>("a");
  const [serverNumber, setServerNumber] = useState<ServerNumber>(1);
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
  const isTournament = playCategory === "tournament";
  const isDoubles = isTournament || mode === "doubles";
  const balancedTeams = isTournament
    ? getNextBalancedDoublesTeams(rankings, registeredPlayers)
    : null;
  const lineupPlayers = isTournament
    ? winner
      ? players
      : balancedTeams
        ? {
            ...players,
            a1: balancedTeams.teamA[0],
            a2: balancedTeams.teamA[1],
            b1: balancedTeams.teamB[0],
            b2: balancedTeams.teamB[1],
          }
        : initialPlayers
    : players;
  const normalizedNames = activeKeys.map((key) =>
    lineupPlayers[key].trim().toLocaleLowerCase(),
  );
  const namesAreValid =
    normalizedNames.every(Boolean) &&
    new Set(normalizedNames).size === normalizedNames.length;
  const extensionAvailable = isExtensionDecision(scoreA, scoreB, target);
  const showExtensionChoice = extensionAvailable && resolvedAtTarget !== target;
  const canScore =
    namesAreValid && isLoaded && (!isTournament || Boolean(balancedTeams));

  const updatePlayer = (key: PlayerKey, value: string) => {
    setPlayers((current) => ({ ...current, [key]: value }));
  };

  const startNewMatch = () => {
    setScoreA(0);
    setScoreB(0);
    setServingSide("a");
    setServerNumber(1);
    setHasDoublesScored(false);
    setTarget(11);
    setResolvedAtTarget(null);
    setWinner(null);
    setStarted(false);
    setSaveError(false);
    recordedMatch.current = false;
  };

  const startNextMatch = () => {
    startNewMatch();
  };

  const lastWipeCount = useRef(wipeCount);
  useEffect(() => {
    if (lastWipeCount.current === wipeCount) return;
    lastWipeCount.current = wipeCount;
    setPlayers(initialPlayers);
    setPlayCategory("session");
    setMode("singles");
    setScoreA(0);
    setScoreB(0);
    setServingSide("a");
    setServerNumber(1);
    setHasDoublesScored(false);
    setTarget(11);
    setResolvedAtTarget(null);
    setWinner(null);
    setStarted(false);
    setSaveError(false);
    recordedMatch.current = false;
  }, [wipeCount]);

  const changePlayCategory = (nextCategory: PlayCategory) => {
    if (started || nextCategory === playCategory) return;
    setPlayCategory(nextCategory);
    setMode(nextCategory === "tournament" ? "doubles" : "singles");
    startNewMatch();
  };

  const changeMode = (nextMode: MatchMode) => {
    if (started || isTournament || nextMode === mode) return;
    setMode(nextMode);
    startNewMatch();
  };

  const addPoint = (side: Side) => {
    if (
      winner ||
      !canScore ||
      showExtensionChoice ||
      (isDoubles && side !== servingSide)
    )
      return;
    Keyboard.dismiss();
    if (isTournament && !started) setPlayers(lineupPlayers);
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
          sideA: teamAKeys.map((key) => lineupPlayers[key].trim()),
          sideB: teamBKeys.map((key) => lineupPlayers[key].trim()),
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
    <PlayerNamePicker
      key={key}
      disabled={Boolean(winner) || isTournament}
      label={label}
      onSelect={(name) => updatePlayer(key, name)}
      registeredPlayers={registeredPlayers}
      unavailableNames={activeKeys
        .filter((activeKey) => activeKey !== key)
        .map((activeKey) => lineupPlayers[activeKey])}
      value={lineupPlayers[key]}
    />
  );

  const winningNames =
    winner === "a"
      ? teamAKeys.map((key) => lineupPlayers[key]).join(" & ")
      : teamBKeys.map((key) => lineupPlayers[key]).join(" & ");

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
          {(["session", "tournament"] as PlayCategory[]).map((option) => (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{
                selected: playCategory === option,
                disabled: started,
              }}
              disabled={started}
              key={option}
              onPress={() => changePlayCategory(option)}
              style={[
                styles.modeButton,
                playCategory === option && styles.modeButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.modeText,
                  playCategory === option && styles.modeTextActive,
                ]}
              >
                {option === "session" ? "Create Session" : "Tournament"}
              </Text>
            </Pressable>
          ))}
        </View>

        {!isTournament && (
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
        )}

        <View style={styles.sectionHeadingRow}>
          <Text style={styles.sectionTitle}>Players</Text>
          <Text style={styles.sectionHint}>
            {started
              ? "Tap a name to choose a substitute"
              : "Tap a name to choose a player"}
          </Text>
        </View>

        {isTournament && (
          <View style={styles.tournamentStatus}>
            <Text style={styles.tournamentStatusTitle}>TOURNAMENT LINEUP</Text>
            <Text style={styles.tournamentStatusText}>
              {balancedTeams
                ? `${registeredPlayers.length} registered · balanced by games played and ranking`
                : "Register at least four players to start a tournament"}
            </Text>
          </View>
        )}

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

        {isDoubles && !started && (
          <View style={styles.openingServePanel}>
            <Text style={styles.openingServeTitle}>PLAY FOR SERVE</Text>
            <View style={styles.openingServeOptions}>
              {(["a", "b"] as Side[]).map((side) => {
                const isSelected = servingSide === side;
                return (
                  <Pressable
                    accessibilityLabel={`Team ${side.toUpperCase()} serves first`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    key={side}
                    onPress={() => {
                      setServingSide(side);
                      setServerNumber(1);
                    }}
                    style={[
                      styles.openingServeOption,
                      isSelected && styles.openingServeOptionActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.openingServeOptionText,
                        isSelected && styles.openingServeOptionTextActive,
                      ]}
                    >
                      TEAM {side.toUpperCase()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.scoreHeader}>
          <View>
            <Text style={styles.sectionTitle}>Match score</Text>
            <Text style={styles.sectionHint}>First to {target} wins</Text>
          </View>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>{winner ? "FINAL" : "Playing Now"}</Text>
          </View>
        </View>

        <View style={styles.scoreCard}>
          <View style={styles.scoreTeam}>
            <Text style={styles.scoreTeamLabel}>TEAM A</Text>
            {isDoubles && servingSide === "a" && (
              <Text style={styles.servingLabel}>SERVING · {serverNumber}</Text>
            )}
            <Text style={styles.teamCaption} numberOfLines={1}>
              {teamAKeys.map((key) => lineupPlayers[key]).join(" & ")}
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
                  !canScore ||
                  Boolean(winner) ||
                  showExtensionChoice ||
                  (isDoubles && servingSide !== "a")
                }
                onPress={() => addPoint("a")}
                style={[
                  styles.addButton,
                  styles.addButtonA,
                  (!canScore || Boolean(winner) || showExtensionChoice) &&
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
              {teamBKeys.map((key) => lineupPlayers[key]).join(" & ")}
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
                  !canScore ||
                  Boolean(winner) ||
                  showExtensionChoice ||
                  (isDoubles && servingSide !== "b")
                }
                onPress={() => addPoint("b")}
                style={[
                  styles.addButton,
                  styles.addButtonB,
                  (!canScore || Boolean(winner) || showExtensionChoice) &&
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
                {servingSide === "a"
                  ? `${scoreA} – ${scoreB}`
                  : `${scoreB} – ${scoreA}`}{" "}
                – {serverNumber}
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
          <Pressable onPress={startNextMatch} style={styles.newMatchButton}>
            <Text style={styles.newMatchText}>Start a new match</Text>
          </Pressable>
        )}
        {saveError && (
          <Text style={styles.validationText}>
            Could not save the ranking on this device. Please try again.
          </Text>
        )}

        <View style={styles.rulesNote}>
          <Text style={styles.rulesText}>
            At 10–10, choose to finish at 11 or extend to 15. At 14–14, choose
            to finish at 15 or extend to 21.
          </Text>
        </View>

        <Text style={styles.footer}>
          YOUR SCORES & RANKINGS STAY ON THIS DEVICE
        </Text>
      </ScrollView>
    </View>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
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
  openingServePanel: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 8,
    marginTop: 12,
  },
  openingServeTitle: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  openingServeOptions: {
    flexDirection: "row",
    gap: 4,
    borderRadius: 9,
    padding: 3,
    backgroundColor: "#F1F4F0",
  },
  openingServeOption: {
    minWidth: 66,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 7,
    paddingHorizontal: 7,
  },
  openingServeOptionActive: { backgroundColor: COLORS.green },
  openingServeOptionText: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: "800",
  },
  openingServeOptionTextActive: { color: "#FFFFFF" },
  tournamentStatus: {
    borderRadius: 12,
    backgroundColor: COLORS.paleGreen,
    padding: 12,
    marginBottom: 10,
  },
  tournamentStatusTitle: {
    color: COLORS.green,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  tournamentStatusText: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },
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
  resultSubtitle: { color: COLORS.muted, fontSize: 10, marginTop: 2 },
  rulesNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 4,
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
