import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";

import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

const feelings = ["Com energia", "Normal", "Cansada"];

export default function HomeScreen() {
  const [userName, setUserName] = useState("");
  const [feeling, setFeeling] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadName() {
        try {
          const saved = await SecureStore.getItemAsync("corrida-ai.perfil.v1");

          const profile = saved ? JSON.parse(saved) : null;

          const name =
            typeof profile?.name === "string" ? profile.name.trim() : "";

          if (active) {
            setUserName(name);
          }
        } catch {
          if (active) {
            setUserName("");
          }
        }
      }

      void loadName();

      return () => {
        active = false;
      };
    }, []),
  );

  function openAssistant() {
    router.push("/assistente");
  }

  function openWorkout() {
    router.push("/plano");
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            {userName ? `Olá, ${userName}` : "Olá!"}
          </Text>

          <Text style={styles.brand}>CORRIDA AI</Text>
        </View>

        {/* ASSISTENTE */}
        <View style={styles.assistantCard}>
          <View style={styles.robotCircle}>
            <Text style={styles.robot}>🤖</Text>
          </View>

          <Text style={styles.subtitle}>O teu assistente de corrida</Text>

          <Text style={styles.title}>Como te sentes hoje?</Text>

          <Text style={styles.description}>
            Vamos preparar o teu próximo treino.
          </Text>

          {/* ESTADO FÍSICO */}
          <View style={styles.feelings}>
            {feelings.map((item) => (
              <Pressable
                key={item}
                accessibilityRole="button"
                accessibilityState={{
                  selected: feeling === item,
                }}
                onPress={() => setFeeling(item)}
                style={[
                  styles.feeling,
                  feeling === item && styles.feelingSelected,
                ]}
              >
                <Text
                  style={[
                    styles.feelingText,
                    feeling === item && styles.feelingTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* BOTÃO ASSISTENTE */}
          <Pressable
            accessibilityRole="button"
            onPress={openAssistant}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>
              Falar com o assistente →
            </Text>
          </Pressable>
        </View>

        {/* TREINO */}
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>O teu treino</Text>

          <Text style={styles.muted}>Exemplo de plano</Text>
        </View>

        <View style={styles.workoutCard}>
          <Text style={styles.label}>TREINO DE HOJE</Text>

          <Text style={styles.workoutTitle}>Corrida leve</Text>

          <Text style={styles.description}>25 min · Esforço confortável</Text>

          <Pressable
            accessibilityRole="button"
            style={styles.workoutButton}
            onPress={openWorkout}
          >
            <Text style={styles.primaryButtonText}>Ver treino →</Text>
          </Pressable>
        </View>

        {/* PREPARAÇÃO DO CORPO */}
        <Text style={styles.sectionTitle}>Prepara o corpo</Text>

        <View style={styles.exercises}>
          {[
            {
              icon: "↗",
              name: "Aquecimento",
            },
            {
              icon: "◎",
              name: "Mobilidade",
            },
            {
              icon: "↔",
              name: "Alongamento",
            },
          ].map((exercise) => (
            <Pressable
              key={exercise.name}
              accessibilityRole="button"
              style={styles.exerciseCard}
              onPress={() =>
                Alert.alert(
                  exercise.name,
                  "Vamos adicionar os exercícios e as instruções nesta área.",
                )
              }
            >
              <Text style={styles.exerciseIcon}>{exercise.icon}</Text>

              <Text style={styles.exerciseName}>{exercise.name}</Text>

              <Text style={styles.exerciseArrow}>→</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const colors = {
  background: "#0B0F0D",
  card: "#151A17",
  lime: "#D0FF57",
  text: "#F5F7F3",
  muted: "#A4ADA6",
  border: "#2A332D",
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    padding: 20,
    paddingBottom: 36,
    gap: 20,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 4,
  },

  greeting: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "700",
  },

  brand: {
    color: colors.lime,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
  },

  assistantCard: {
    backgroundColor: colors.card,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    alignItems: "center",
    gap: 14,
  },

  robotCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#27351B",
    borderWidth: 1,
    borderColor: "#526B2B",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
  },

  robot: {
    fontSize: 82,
  },

  subtitle: {
    color: colors.muted,
    fontSize: 15,
    textAlign: "center",
  },

  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
  },

  description: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
  },

  feelings: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginVertical: 6,
  },

  feeling: {
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
  },

  feelingSelected: {
    backgroundColor: colors.lime,
    borderColor: colors.lime,
  },

  feelingText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "600",
  },

  feelingTextSelected: {
    color: colors.background,
  },

  primaryButton: {
    width: "100%",
    backgroundColor: colors.lime,
    borderRadius: 28,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: "center",
  },

  primaryButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: "700",
  },

  pressed: {
    opacity: 0.8,
  },

  sectionHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
  },

  muted: {
    color: colors.muted,
    fontSize: 12,
  },

  workoutCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 22,
    gap: 12,
  },

  label: {
    color: colors.lime,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
  },

  workoutTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "700",
  },

  workoutButton: {
    alignSelf: "flex-start",
    backgroundColor: colors.lime,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginTop: 6,
  },

  exercises: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  exerciseCard: {
    flexGrow: 1,
    flexBasis: 95,
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 12,
  },

  exerciseIcon: {
    color: colors.lime,
    fontSize: 30,
  },

  exerciseName: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "600",
  },

  exerciseArrow: {
    color: colors.muted,
    fontSize: 18,
  },
});
