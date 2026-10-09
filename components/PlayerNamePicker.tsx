import { useState } from "react";
import {
    Keyboard,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

type PlayerNamePickerProps = {
  label: string;
  value: string;
  registeredPlayers: string[];
  unavailableNames: string[];
  disabled?: boolean;
  onSelect: (name: string) => void;
};

const COLORS = {
  card: "#FFFFFF",
  ink: "#15241E",
  muted: "#7B8981",
  green: "#176B4B",
  line: "#E6EBE6",
};

function normalizeName(name: string) {
  return name.trim().toLocaleLowerCase();
}

export default function PlayerNamePicker({
  label,
  value,
  registeredPlayers,
  unavailableNames,
  disabled = false,
  onSelect,
}: PlayerNamePickerProps) {
  const [visible, setVisible] = useState(false);
  const unavailable = new Set(unavailableNames.map(normalizeName));
  const players = Array.from(
    new Map(
      registeredPlayers
        .map((name) => name.trim())
        .filter(Boolean)
        .map((name) => [normalizeName(name), name]),
    ).values(),
  ).sort((left, right) => left.localeCompare(right));

  const closePicker = () => {
    Keyboard.dismiss();
    setVisible(false);
  };

  const selectPlayer = (name: string) => {
    onSelect(name);
    closePicker();
  };

  return (
    <View style={styles.playerField}>
      <Text style={styles.inputLabel}>{label}</Text>
      <Pressable
        accessibilityLabel={`Choose ${label} name`}
        accessibilityRole="button"
        disabled={disabled}
        onPress={() => setVisible(true)}
        style={[styles.playerNameButton, disabled && styles.disabled]}
      >
        <Text
          style={[
            styles.playerNameText,
            !value && styles.playerNamePlaceholder,
          ]}
          numberOfLines={1}
        >
          {value || "Select registered player"}
        </Text>
        <Text style={styles.chooseHint}>CHOOSE</Text>
      </Pressable>

      <Modal
        animationType="fade"
        onRequestClose={closePicker}
        statusBarTranslucent
        transparent
        visible={visible}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            accessibilityLabel="Close player picker"
            onPress={closePicker}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.pickerModal}>
            <Text style={styles.modalEyebrow}>PLAYER LINEUP</Text>
            <Text style={styles.modalTitle}>Choose a player</Text>
            {players.length > 0 ? (
              <ScrollView
                keyboardShouldPersistTaps="handled"
                style={styles.playerList}
              >
                {players.map((name) => {
                  const isUnavailable = unavailable.has(normalizeName(name));
                  return (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ disabled: isUnavailable }}
                      disabled={isUnavailable}
                      key={normalizeName(name)}
                      onPress={() => selectPlayer(name)}
                      style={[
                        styles.playerOption,
                        isUnavailable && styles.playerOptionDisabled,
                      ]}
                    >
                      <Text style={styles.playerOptionName}>{name}</Text>
                      <Text style={styles.playerOptionHint}>
                        {isUnavailable ? "IN USE" : "SELECT"}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : (
              <Text style={styles.emptyMessage}>
                Register players in the Players tab to choose them here.
              </Text>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
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
  playerNamePlaceholder: { color: COLORS.muted, fontWeight: "500" },
  chooseHint: {
    color: COLORS.green,
    fontSize: 8,
    letterSpacing: 0.5,
    fontWeight: "900",
  },
  disabled: { opacity: 0.55 },
  modalBackdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "rgba(12, 30, 22, 0.5)",
  },
  pickerModal: {
    width: "100%",
    maxWidth: 380,
    maxHeight: "85%",
    borderRadius: 23,
    padding: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.line,
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
    marginBottom: 12,
  },
  playerList: { flexGrow: 0, maxHeight: 260 },
  playerOption: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  playerOptionName: { color: COLORS.ink, fontSize: 14, fontWeight: "700" },
  playerOptionHint: {
    color: COLORS.green,
    fontSize: 8,
    letterSpacing: 0.5,
    fontWeight: "900",
  },
  playerOptionDisabled: { opacity: 0.4 },
  emptyMessage: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
});
