import { router, useLocalSearchParams } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Fragment, useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LEGAL_DOCUMENTS } from "@/constants/legalDocuments";
import { Palette, useAppTheme } from "@/context/ThemeContext";

export default function LegalDocumentScreen() {
  const { document } = useLocalSearchParams<{ document: string }>();
  const legalDocument = LEGAL_DOCUMENTS[document];
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!legalDocument) {
    return (
      <View style={[styles.screen, styles.notFound]}>
        <Text style={styles.body}>This legal document could not be found.</Text>
        <Pressable accessibilityRole="button" onPress={() => router.back()}>
          <Text style={styles.backLabel}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={{ height: insets.top }} />
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <SymbolView
            name={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" }}
            tintColor={colors.ink}
            size={20}
          />
        </Pressable>
        <Text numberOfLines={1} style={styles.headerTitle}>
          {legalDocument.title}
        </Text>
        <View style={styles.backButton} />
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{legalDocument.title}</Text>
        <Text style={styles.updatedAt}>Last updated: {legalDocument.updatedAt}</Text>
        {legalDocument.sections.map((section, index) => (
          <View key={`${section.title}-${index}`} style={styles.section}>
            {section.title ? (
              <Text style={styles.sectionTitle}>{section.title}</Text>
            ) : null}
            {section.paragraphs?.map((paragraph, paragraphIndex) => (
              <Fragment key={paragraphIndex}>
                <Text style={styles.body}>{paragraph}</Text>
                {paragraphIndex === 0 &&
                  section.bullets?.map((bullet, bulletIndex) => (
                    <View key={bulletIndex} style={styles.bulletRow}>
                      <Text style={styles.bullet}>•</Text>
                      <Text style={[styles.body, styles.bulletText]}>{bullet}</Text>
                    </View>
                  ))}
              </Fragment>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    notFound: { justifyContent: "center", padding: 24, gap: 16 },
    header: {
      minHeight: 52,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
    },
    backButton: {
      width: 36,
      height: 40,
      justifyContent: "center",
    },
    headerTitle: {
      flex: 1,
      color: colors.ink,
      fontSize: 16,
      fontWeight: "800",
      textAlign: "center",
    },
    content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
    title: {
      color: colors.ink,
      fontSize: 28,
      lineHeight: 34,
      fontWeight: "900",
    },
    updatedAt: {
      color: colors.muted,
      fontSize: 12,
      marginTop: 8,
      marginBottom: 8,
    },
    section: { marginTop: 20 },
    sectionTitle: {
      color: colors.ink,
      fontSize: 16,
      fontWeight: "800",
      marginBottom: 8,
    },
    body: {
      color: colors.ink,
      fontSize: 14,
      lineHeight: 22,
      marginBottom: 10,
    },
    bulletRow: { flexDirection: "row", paddingLeft: 4 },
    bullet: {
      color: colors.green,
      fontSize: 16,
      lineHeight: 22,
      marginRight: 10,
    },
    bulletText: { flex: 1 },
    backLabel: { color: colors.green, fontSize: 15, fontWeight: "700" },
  });
