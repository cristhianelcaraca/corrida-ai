import React from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";

export default function Treino() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.eyebrow}>SEU TREINO</Text>

        <Text style={styles.title}>Corrida leve</Text>

        <Text style={styles.subtitle}>
          Um treino pensado para desenvolver sua resistência de forma gradual.
        </Text>
      </View>

      {/* Resumo */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>30</Text>
          <Text style={styles.summaryLabel}>MIN</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>4 km</Text>
          <Text style={styles.summaryLabel}>DISTÂNCIA</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>Leve</Text>
          <Text style={styles.summaryLabel}>INTENSIDADE</Text>
        </View>
      </View>

      {/* Objetivo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Objetivo</Text>

        <View style={styles.card}>
          <Text style={styles.cardText}>
            Desenvolver resistência aeróbica mantendo uma intensidade
            confortável e controlada.
          </Text>
        </View>
      </View>

      {/* Aquecimento */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Aquecimento</Text>

        <View style={styles.card}>
          <WorkoutStep
            number="1"
            title="Caminhada"
            description="5 minutos em ritmo confortável"
          />

          <WorkoutStep
            number="2"
            title="Mobilidade"
            description="2 minutos de mobilidade para quadril e tornozelos"
          />

          <WorkoutStep
            number="3"
            title="Trote leve"
            description="3 minutos aumentando gradualmente o ritmo"
            last
          />
        </View>
      </View>

      {/* Treino principal */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Treino principal</Text>

        <View style={styles.card}>
          <WorkoutStep
            number="1"
            title="Corrida leve"
            description="20 minutos em ritmo confortável"
          />

          <WorkoutStep
            number="2"
            title="Controle da respiração"
            description="Mantenha um ritmo em que consiga falar frases curtas"
            last
          />
        </View>
      </View>

      {/* Desaquecimento */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Desaquecimento</Text>

        <View style={styles.card}>
          <WorkoutStep
            number="1"
            title="Caminhada"
            description="5 minutos em ritmo muito leve"
          />

          <WorkoutStep
            number="2"
            title="Alongamento"
            description="Quadríceps, posterior da coxa, gémeos e glúteos"
            last
          />
        </View>
      </View>

      {/* Botão */}
      <Pressable
        style={({ pressed }) => [
          styles.startButton,
          pressed && styles.startButtonPressed,
        ]}
        onPress={() => {
          console.log("Iniciar treino");
        }}
      >
        <Text style={styles.startButtonText}>Iniciar treino</Text>
      </Pressable>

      <Text style={styles.footerText}>
        Ouça o seu corpo e ajuste a intensidade quando necessário.
      </Text>
    </ScrollView>
  );
}

type WorkoutStepProps = {
  number: string;
  title: string;
  description: string;
  last?: boolean;
};

function WorkoutStep({
  number,
  title,
  description,
  last = false,
}: WorkoutStepProps) {
  return (
    <View style={[styles.step, !last && styles.stepBorder]}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{number}</Text>
      </View>

      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>{title}</Text>

        <Text style={styles.stepDescription}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F0D",
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },

  header: {
    marginBottom: 24,
  },

  eyebrow: {
    color: "#D0FF57",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 8,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 8,
  },

  subtitle: {
    color: "#9AA39D",
    fontSize: 15,
    lineHeight: 22,
  },

  summaryCard: {
    backgroundColor: "#151B17",
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "#222A24",
  },

  summaryItem: {
    flex: 1,
    alignItems: "center",
  },

  summaryValue: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 5,
  },

  summaryLabel: {
    color: "#7E8881",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },

  divider: {
    width: 1,
    height: 35,
    backgroundColor: "#2A322C",
  },

  section: {
    marginBottom: 26,
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },

  card: {
    backgroundColor: "#151B17",
    borderRadius: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#222A24",
  },

  cardText: {
    color: "#B7BEB9",
    fontSize: 15,
    lineHeight: 22,
    paddingVertical: 17,
  },

  step: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 17,
  },

  stepBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#252D27",
  },

  stepNumber: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#27351B",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  stepNumberText: {
    color: "#D0FF57",
    fontSize: 14,
    fontWeight: "800",
  },

  stepContent: {
    flex: 1,
  },

  stepTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },

  stepDescription: {
    color: "#8F9892",
    fontSize: 13,
    lineHeight: 19,
  },

  startButton: {
    height: 56,
    borderRadius: 18,
    backgroundColor: "#D0FF57",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },

  startButtonPressed: {
    opacity: 0.75,
  },

  startButtonText: {
    color: "#0B0F0D",
    fontSize: 16,
    fontWeight: "800",
  },

  footerText: {
    color: "#69726C",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 16,
    paddingHorizontal: 20,
  },
});
