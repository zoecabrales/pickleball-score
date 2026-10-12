import { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { Palette, useAppTheme } from "@/context/ThemeContext";

type Step = { tab: string; title: string; body: string; tip?: string };

const STEPS: Step[] = [
  {
    tab: "WELCOME",
    title: "Welcome to Pickle Scorer",
    body: "Keep score, track who is winning, and set up fair doubles teams. Everything stays on this device — no account or internet needed.",
    tip: "This quick tour takes about a minute.",
  },
  {
    tab: "1 · PLAYERS TAB",
    title: "Add your players first",
    body: "Register everyone in your group so you can pick them quickly later. Tournament mode needs at least 4 registered players.",
    tip: "Players stay on the list even after you reset the rankings.",
  },
  {
    tab: "2 · PLAY TAB",
    title: "Score a match",
    body: "Choose Create Session to pick players yourself, or Tournament to get a lineup automatically. Tap a team's score to add a point; the app tracks serving for doubles.",
    tip: "Tournament lineups start random, then pair top players with players lower on the ladder.",
  },
  {
    tab: "3 · RANKINGS TAB",
    title: "Follow the ladder",
    body: "Players are ranked by win rate, then total wins. Players with the same record share a rank. When the day ends, tap “Save today & start fresh” to keep the results and start a new ladder.",
  },
  {
    tab: "4 · DASHBOARD & SETTINGS",
    title: "Check in anytime",
    body: "The Dashboard shows the current leader and highlights. Settings lets you change the theme, see what is stored, and replay this guide.",
  },
];

type WelcomeGuideProps = { visible: boolean; onClose: () => void };

export default function WelcomeGuide({ visible, onClose }: WelcomeGuideProps) {
  const { colors: COLORS } = useAppTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const [index, setIndex] = useState(0);
  const step = STEPS[index];
  const isFirst = index === 0;
  const isLast = index === STEPS.length - 1;

  const close = () => {
    setIndex(0);
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={close}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.topRow}>
            <Text style={styles.kicker}>{step.tab}</Text>
            {!isLast && (
              <Pressable
                accessibilityLabel="Skip guide"
                accessibilityRole="button"
                hitSlop={10}
                onPress={close}
              >
                <Text style={styles.skip}>Skip</Text>
              </Pressable>
            )}
          </View>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.body}>{step.body}</Text>
          {step.tip ? (
            <View style={styles.tipBox}>
              <Text style={styles.tipText}>💡 {step.tip}</Text>
            </View>
          ) : null}

          <View
            accessibilityLabel={`Step ${index + 1} of ${STEPS.length}`}
            style={styles.dots}
          >
            {STEPS.map((_, dotIndex) => (
              <View
                key={dotIndex}
                style={[styles.dot, dotIndex === index && styles.dotActive]}
              />
            ))}
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              disabled={isFirst}
              onPress={() => setIndex((current) => current - 1)}
              style={[styles.backButton, isFirst && styles.hidden]}
            >
              <Text style={styles.backText}>Back</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                isLast ? close() : setIndex((current) => current + 1)
              }
              style={styles.nextButton}
            >
              <Text style={styles.nextText}>
                {isLast ? "Start playing" : isFirst ? "Show me around" : "Next"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (COLORS: Palette) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      backgroundColor: "rgba(12, 30, 22, 0.6)",
    },
    card: {
      width: "100%",
      maxWidth: 380,
      borderRadius: 24,
      padding: 22,
      backgroundColor: COLORS.card,
      borderWidth: 1,
      borderColor: COLORS.line,
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    kicker: {
      color: COLORS.green,
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 1.4,
    },
    skip: { color: COLORS.muted, fontSize: 12, fontWeight: "700" },
    title: {
      color: COLORS.ink,
      fontSize: 24,
      fontWeight: "800",
      marginTop: 10,
    },
    body: {
      color: COLORS.muted,
      fontSize: 14,
      lineHeight: 21,
      marginTop: 10,
    },
    tipBox: {
      marginTop: 14,
      borderRadius: 12,
      padding: 12,
      backgroundColor: COLORS.paleGreen,
    },
    tipText: {
      color: COLORS.green,
      fontSize: 12,
      lineHeight: 18,
      fontWeight: "700",
    },
    dots: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 6,
      marginTop: 20,
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: COLORS.line,
    },
    dotActive: { width: 20, backgroundColor: COLORS.green },
    actions: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 18,
    },
    backButton: { paddingVertical: 12, paddingHorizontal: 6 },
    backText: { color: COLORS.muted, fontSize: 14, fontWeight: "700" },
    hidden: { opacity: 0 },
    nextButton: {
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 20,
      backgroundColor: COLORS.green,
    },
    nextText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  });
