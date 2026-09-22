import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";

const WORKOUT_KEY = "corrida-ai.treino.v1";

type Workout = {
  title: string;
  objective: string;
  duration: string;
  intensity: string;
  warmup: string[];
  workout: string[];
  cooldown: string[];
  note: string;
};

const colors = {
  background: "#0B0F0D",
  card: "#151A17",
  lime: "#D0FF57",
  text: "#F5F7F3",
  muted: "#A4ADA6",
  border: "#2A332D",
};

function WorkoutSection({ title, items }: { title: string; items: string[] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>

      {items.map((item, index) => (
        <View key={`${item}-${index}`} style={styles.step}>
          <View style={styles.numberCircle}>
            <Text style={styles.number}>{index + 1}</Text>
          </View>

          <Text style={styles.stepText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export default function PlanoScreen() {
  const router = useRouter();

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);

  const loadWorkout = useCallback(async () => {
    try {
      setLoading(true);

      const savedWorkout = await SecureStore.getItemAsync(WORKOUT_KEY);

      if (savedWorkout) {
        setWorkout(JSON.parse(savedWorkout));
      } else {
        setWorkout(null);
      }
    } catch (error) {
      console.log("Erro ao carregar treino:", error);
      setWorkout(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadWorkout();
    }, [loadWorkout]),
  );

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={colors.lime} />

        <Text style={styles.loadingText}>A carregar o teu plano...</Text>
      </View>
    );
  }

  if (!workout) {
    return (
      <View style={styles.emptyScreen}>
        <Text style={styles.robot}>🤖</Text>

        <Text style={styles.emptyTitle}>O teu plano ainda está vazio</Text>

        <Text style={styles.emptyDescription}>
          Primeiro precisamos de criar o teu treino personalizado no Assistente.
        </Text>

        <Pressable
          style={styles.button}
          onPress={() => router.push("/assistente")}
        >
          <Text style={styles.buttonText}>Criar primeiro treino →</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.pageTitle}>O teu plano</Text>

      <View style={styles.robotCard}>
        <Text style={styles.robot}>🤖</Text>

        <View style={styles.robotTextContainer}>
          <Text style={styles.robotTitle}>Treino preparado</Text>

          <Text style={styles.robotDescription}>
            O teu primeiro treino está pronto.
          </Text>
        </View>
      </View>

      <View style={styles.workoutCard}>
        <Text style={styles.workoutTitle}>{workout.title}</Text>

        <Text style={styles.objective}>{workout.objective}</Text>

        <View style={styles.infoRow}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>DURAÇÃO</Text>
            <Text style={styles.infoValue}>{workout.duration}</Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>INTENSIDADE</Text>
            <Text style={styles.infoValue}>{workout.intensity}</Text>
          </View>
        </View>

        <WorkoutSection title="Aquecimento" items={workout.warmup} />

        <WorkoutSection title="Treino principal" items={workout.workout} />

        <WorkoutSection title="Volta à calma" items={workout.cooldown} />

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>🤖 Nota do assistente</Text>

          <Text style={styles.noteText}>{workout.note}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    padding: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },

  pageTitle: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 20,
  },

  robotCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
  },

  robot: {
    fontSize: 40,
    marginRight: 14,
  },

  robotTextContainer: {
    flex: 1,
  },

  robotTitle: {
    color: colors.lime,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },

  robotDescription: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },

  workoutCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 20,
  },

  workoutTitle: {
    color: colors.text,
    fontSize: 25,
    fontWeight: "700",
    marginBottom: 8,
  },

  objective: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },

  infoRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },

  infoBox: {
    flex: 1,
    backgroundColor: "#101512",
    borderRadius: 12,
    padding: 14,
  },

  infoLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 6,
  },

  infoValue: {
    color: colors.lime,
    fontSize: 15,
    fontWeight: "700",
  },

  section: {
    marginBottom: 24,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "700",
    marginBottom: 14,
  },

  step: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  numberCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#27351B",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  number: {
    color: colors.lime,
    fontSize: 13,
    fontWeight: "700",
  },

  stepText: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    lineHeight: 21,
  },

  noteCard: {
    backgroundColor: "#101512",
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: colors.lime,
  },

  noteTitle: {
    color: colors.lime,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
  },

  noteText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: colors.muted,
    marginTop: 12,
    fontSize: 15,
  },

  emptyScreen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },

  emptyTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },

  emptyDescription: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 24,
  },

  button: {
    backgroundColor: colors.lime,
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 22,
  },

  buttonText: {
    color: "#0B0F0D",
    fontSize: 15,
    fontWeight: "700",
  },
});
