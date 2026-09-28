import ExerciseAvatar from "@/components/ExerciseAvatar";
import { EXERCISES, Exercise } from "@/data/exercises";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const colors = {
  background: "#0B0F0D",
  card: "#151A17",
  lime: "#D0FF57",
  text: "#F5F7F3",
  muted: "#A4ADA6",
  border: "#2A332D",
};

export default function MobilidadeScreen() {
  const [selected, setSelected] = useState<Exercise | null>(null);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>MOVIMENTO</Text>
      <Text style={styles.title}>Mobilidade & alongamentos</Text>
      <Text style={styles.subtitle}>
        Demonstrações para preparar o corpo antes da corrida e recuperar depois.
      </Text>

      <View style={styles.hero}>
        <ExerciseAvatar exerciseId="hip_mobility" />
        <Text style={styles.heroTitle}>O teu avatar de movimento</Text>
        <Text style={styles.heroText}>
          Escolhe um exercício para abrir a demonstração.
        </Text>
      </View>

      {EXERCISES.map((exercise) => (
        <Pressable
          key={exercise.id}
          style={styles.card}
          onPress={() => setSelected(exercise)}
        >
          <ExerciseAvatar exerciseId={exercise.id} size="small" />
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>{exercise.name}</Text>
            <Text style={styles.category}>{exercise.category}</Text>
            <Text style={styles.description}>{exercise.description}</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
      ))}

      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            {selected && (
              <>
                <ExerciseAvatar exerciseId={selected.id} />
                <Text style={styles.modalTitle}>{selected.name}</Text>
                <Text style={styles.description}>{selected.description}</Text>
                <Pressable
                  style={styles.button}
                  onPress={() => setSelected(null)}
                >
                  <Text style={styles.buttonText}>Fechar</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 120, gap: 14 },
  eyebrow: {
    color: colors.lime,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
  },
  title: { color: colors.text, fontSize: 30, fontWeight: "800", marginTop: 2 },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 8,
  },
  hero: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  heroTitle: { color: colors.text, fontSize: 20, fontWeight: "800" },
  heroText: { color: colors.muted, textAlign: "center", lineHeight: 20 },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardText: { flex: 1, gap: 3 },
  cardTitle: { color: colors.text, fontSize: 15, fontWeight: "700" },
  category: { color: colors.lime, fontSize: 11, fontWeight: "700" },
  description: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  arrow: { color: colors.muted, fontSize: 26 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 23,
    fontWeight: "800",
    textAlign: "center",
  },
  button: {
    backgroundColor: colors.lime,
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginTop: 6,
  },
  buttonText: { color: colors.background, fontWeight: "800" },
});
