import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";

import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

const PROFILE_KEY = "corrida-ai.perfil.v1";
const INTERVIEW_KEY = "corrida-ai.entrevista.v1";
const WORKOUT_KEY = "corrida-ai.treino.v1";

type Profile = {
  name: string;
  goal: string;
  level: string;
  routine: string;
  days: string[];
  duration: string;
  limitations: string;
};

type Interview = {
  maxDistance: string;
  runningTime: string;
  lastRun: string;
  hasRace: string;
  raceDate: string;
  feeling: string;
};

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

type Question = {
  key: keyof Interview;
  title: string;
  description: string;
  type: "text" | "choice";
  options?: string[];
  placeholder?: string;
};

const EMPTY_INTERVIEW: Interview = {
  maxDistance: "",
  runningTime: "",
  lastRun: "",
  hasRace: "",
  raceDate: "",
  feeling: "",
};

const questions: Question[] = [
  {
    key: "maxDistance",
    title: "Qual é a maior distância que consegues correr atualmente?",
    description:
      "Pode ser uma estimativa. Se ainda não consegues correr continuamente, escreve 0.",
    type: "text",
    placeholder: "Ex.: 3 km",
  },
  {
    key: "runningTime",
    title: "Quanto tempo consegues correr sem parar?",
    description:
      "Não precisa ser um número exato. Queremos perceber o teu ponto de partida.",
    type: "text",
    placeholder: "Ex.: 20 minutos",
  },
  {
    key: "lastRun",
    title: "Quando foi a tua última corrida?",
    description: "Pode ser hoje, ontem, há uma semana, há um mês, etc.",
    type: "text",
    placeholder: "Ex.: há 3 dias",
  },
  {
    key: "hasRace",
    title: "Tens alguma prova ou data específica como objetivo?",
    description:
      "Se tiveres uma data em mente, podemos considerar isso no futuro plano.",
    type: "choice",
    options: ["Sim", "Não"],
  },
  {
    key: "raceDate",
    title: "Qual é a data ou prova que tens em mente?",
    description: "Pode ser o nome da prova, a data ou ambos.",
    type: "text",
    placeholder: "Ex.: Corrida de 5 km em novembro",
  },
  {
    key: "feeling",
    title: "Como te sentes hoje?",
    description: "Isto vai ajudar o assistente a adaptar o treino do dia.",
    type: "choice",
    options: ["Com energia", "Normal", "Cansada"],
  },
];

export default function AssistenteScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);

  const [interview, setInterview] = useState<Interview>(EMPTY_INTERVIEW);

  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [workoutCreated, setWorkoutCreated] = useState(false);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [saving, setSaving] = useState(false);

  const [workout, setWorkout] = useState<Workout | null>(null);

  /*
   * CARREGAR APENAS O PERFIL E O TREINO
   *
   * A entrevista NÃO é carregada aqui.
   * Isso permite começar uma nova entrevista
   * sempre que entramos no Assistente.
   */
  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadData() {
        try {
          setLoading(true);

          const savedProfile = await SecureStore.getItemAsync(PROFILE_KEY);

          const savedWorkout = await SecureStore.getItemAsync(WORKOUT_KEY);

          if (!active) return;

          if (savedProfile) {
            setProfile(JSON.parse(savedProfile));
          }

          if (savedWorkout) {
            setWorkout(JSON.parse(savedWorkout));
          }
        } catch (error) {
          console.log("Erro ao carregar dados:", error);
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      }

      void loadData();

      return () => {
        active = false;
      };
    }, []),
  );

  /*
   * GUARDAR ENTREVISTA
   */
  async function saveInterview(data: Interview) {
    try {
      await SecureStore.setItemAsync(INTERVIEW_KEY, JSON.stringify(data));
    } catch (error) {
      console.log("Erro ao guardar entrevista:", error);
    }
  }

  /*
   * GUARDAR TREINO
   */
  async function saveWorkout(data: Workout) {
    try {
      await SecureStore.setItemAsync(WORKOUT_KEY, JSON.stringify(data));
    } catch (error) {
      console.log("Erro ao guardar treino:", error);
    }
  }

  /*
   * ATUALIZAR RESPOSTA
   */
  function updateAnswer(key: keyof Interview, value: string) {
    const updatedInterview = {
      ...interview,
      [key]: value,
    };

    setInterview(updatedInterview);

    void saveInterview(updatedInterview);
  }

  /*
   * VERIFICAR SE A PERGUNTA FOI RESPONDIDA
   */
  function isCurrentQuestionAnswered() {
    const question = questions[currentQuestion];

    if (question.key === "raceDate") {
      return (
        interview.hasRace === "Não" || interview.raceDate.trim().length > 0
      );
    }

    return String(interview[question.key]).trim().length > 0;
  }

  /*
   * PRÓXIMA PERGUNTA
   */
  function nextQuestion() {
    if (!isCurrentQuestionAnswered()) {
      return;
    }

    /*
     * Se não tem prova,
     * pula a pergunta da data/prova.
     */
    if (
      questions[currentQuestion].key === "hasRace" &&
      interview.hasRace === "Não"
    ) {
      setCurrentQuestion(currentQuestion + 2);
      return;
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  }

  /*
   * PERGUNTA ANTERIOR
   */
  function previousQuestion() {
    if (currentQuestion === 0) {
      setStarted(false);
      return;
    }

    /*
     * Se a pessoa respondeu "Não" à prova,
     * volta diretamente para essa pergunta.
     */
    if (
      questions[currentQuestion].key === "feeling" &&
      interview.hasRace === "Não"
    ) {
      setCurrentQuestion(currentQuestion - 2);
      return;
    }

    setCurrentQuestion(currentQuestion - 1);
  }

  /*
   * COMEÇAR NOVA ENTREVISTA
   *
   * IMPORTANTE:
   * Aqui limpamos completamente
   * as respostas anteriores.
   */
  function startInterview() {
    setInterview({
      ...EMPTY_INTERVIEW,
    });

    setStarted(true);
    setCompleted(false);
    setWorkoutCreated(false);
    setWorkout(null);
    setCurrentQuestion(0);
  }

  /*
   * CONCLUIR ENTREVISTA
   */
  async function finishInterview() {
    try {
      setSaving(true);

      await saveInterview(interview);

      setCompleted(true);
    } catch (error) {
      console.log("Erro ao concluir entrevista:", error);
    } finally {
      setSaving(false);
    }
  }

  /*
   * MOTOR DO PRIMEIRO TREINO
   */
  function createFirstWorkout(): Workout {
    const goal = profile?.goal?.toLowerCase() || "";

    const level = profile?.level?.toLowerCase() || "";

    const limitations = profile?.limitations?.toLowerCase() || "";

    const maxDistanceText = interview.maxDistance.toLowerCase();

    const runningTimeText = interview.runningTime.toLowerCase();

    /*
     * Extrair primeiro número
     */
    const distanceMatch = maxDistanceText.match(/(\d+(?:[.,]\d+)?)/);

    const timeMatch = runningTimeText.match(/(\d+(?:[.,]\d+)?)/);

    const maxDistance = distanceMatch
      ? Number(distanceMatch[1].replace(",", "."))
      : 0;

    const runningTime = timeMatch ? Number(timeMatch[1].replace(",", ".")) : 0;

    const feeling = interview.feeling;

    /*
     * 1. INTENSIDADE
     */
    let intensity = "Leve a moderada";

    if (feeling === "Cansada") {
      intensity = "Leve";
    } else if (level.includes("iniciante")) {
      intensity = "Leve";
    } else if (level.includes("avançado") || level.includes("avancado")) {
      intensity = "Moderada";
    }

    /*
     * 2. DURAÇÃO
     */
    let workoutDuration = profile?.duration || "30 minutos";

    if (feeling === "Cansada") {
      workoutDuration = "25 minutos";
    }

    /*
     * 3. OBJETIVO
     */
    let objective = "Construir resistência e criar consistência na corrida.";

    if (
      goal.includes("5 km") ||
      goal.includes("5km") ||
      goal.includes("prova")
    ) {
      objective =
        "Construir resistência para evoluir progressivamente até aos 5 km.";
    } else if (goal.includes("emag") || goal.includes("peso")) {
      objective =
        "Aumentar o gasto energético através de uma corrida confortável e sustentável.";
    } else if (goal.includes("resist") || goal.includes("correr mais")) {
      objective =
        "Aumentar gradualmente o tempo de corrida e desenvolver resistência.";
    }

    /*
     * 4. TREINO PRINCIPAL
     */
    let workout: string[] = [];

    /*
     * Iniciante / pouca distância
     */
    if (maxDistance <= 2 || runningTime <= 15 || level.includes("iniciante")) {
      workout = [
        "3 min de corrida muito leve",
        "2 min de caminhada",
        "4 min de corrida leve",
        "2 min de caminhada",
        "4 min de corrida leve",
        "2 min de caminhada",
        "3 min de corrida muito leve",
      ];
    } else if (maxDistance <= 5 || runningTime <= 35) {
      /*
       * Alguma experiência
       */
      workout = [
        "5 min de corrida leve",
        "2 min de caminhada",
        "6 min de corrida confortável",
        "2 min de caminhada",
        "6 min de corrida confortável",
        "2 min de caminhada",
        "5 min de corrida leve",
      ];
    } else {
      /*
       * Maior experiência
       */
      workout = [
        "8 min de corrida confortável",
        "2 min de recuperação",
        "8 min de corrida confortável",
        "2 min de recuperação",
        "8 min de corrida confortável",
      ];
    }

    /*
     * Se estiver cansada,
     * reduzir carga.
     */
    if (feeling === "Cansada") {
      workout = [
        "5 min de corrida muito leve",
        "2 min de caminhada",
        "5 min de corrida leve",
        "2 min de caminhada",
        "5 min de corrida muito leve",
      ];
    }

    /*
     * 5. AQUECIMENTO
     */
    const warmup = [
      "5 min de caminhada rápida",
      "10 círculos de tornozelo para cada lado",
      "10 movimentos de mobilidade da anca",
      "10 balanços de perna para cada lado",
      "2 min de caminhada progressivamente mais rápida",
    ];

    /*
     * 6. VOLTA À CALMA
     */
    const cooldown = [
      "5 min de caminhada tranquila",
      "Respiração lenta até normalizar",
      "Alongamento suave dos gémeos",
      "Alongamento suave da parte da frente das coxas",
      "Mobilidade suave da anca",
    ];

    /*
     * 7. NOTA
     */
    let note =
      "Mantém um ritmo confortável. Deves conseguir falar durante a maior parte da corrida.";

    if (limitations.trim().length > 0) {
      note =
        "O treino foi pensado tendo em conta a limitação que indicaste. Mantém a intensidade confortável e interrompe o exercício se aparecer dor.";
    }

    if (feeling === "Cansada") {
      note =
        "Hoje o objetivo é movimentar o corpo sem acumular fadiga. Mantém um ritmo muito confortável e não tentes compensar o cansaço aumentando a velocidade.";
    }

    if (interview.hasRace === "Sim") {
      note +=
        " Como tens uma prova como objetivo, vamos aumentar a carga progressivamente ao longo das próximas sessões.";
    }

    /*
     * 8. TÍTULO
     */
    let title = "Corrida fácil + caminhada";

    if (level.includes("iniciante") || maxDistance <= 2) {
      title = "Corrida inicial + caminhada";
    } else if (maxDistance > 5 || runningTime > 35) {
      title = "Corrida contínua confortável";
    }

    return {
      title,
      objective,
      duration: workoutDuration,
      intensity,
      warmup,
      workout,
      cooldown,
      note,
    };
  }

  /*
   * CRIAR TREINO
   */
  async function handleCreateWorkout() {
    try {
      setSaving(true);

      const newWorkout = createFirstWorkout();

      /*
       * O novo treino substitui
       * automaticamente o anterior.
       */
      await saveWorkout(newWorkout);

      setWorkout(newWorkout);
      setWorkoutCreated(true);
    } catch (error) {
      console.log("Erro ao criar treino:", error);
    } finally {
      setSaving(false);
    }
  }

  /*
   * LOADING
   */
  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.lime} />

          <Text style={styles.loadingText}>A carregar o teu perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  /*
   * SEM PERFIL
   */
  if (!profile) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.emptyContainer}>
          <Text style={styles.title}>Perfil não encontrado</Text>

          <Text style={styles.description}>
            Primeiro precisamos dos teus dados de perfil.
          </Text>

          <Pressable
            style={styles.primaryButton}
            onPress={() => router.push("/treino")}
          >
            <Text style={styles.primaryButtonText}>Preencher perfil →</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  /*
   * TREINO CRIADO
   */
  if (workoutCreated && workout) {
    return (
      <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Pressable
              onPress={() => setWorkoutCreated(false)}
              style={styles.backButton}
            >
              <Text style={styles.backText}>←</Text>
            </Pressable>

            <Text style={styles.headerTitle}>O teu treino</Text>
          </View>

          <View style={styles.robotContainer}>
            <View style={styles.robotCircle}>
              <Text style={styles.robot}>🤖</Text>
            </View>
          </View>

          <View style={styles.messageCard}>
            <Text style={styles.messageTitle}>Primeiro treino criado!</Text>

            <Text style={styles.messageText}>
              Preparei este treino com base nas informações que me deste.
            </Text>
          </View>

          <View style={styles.workoutHeaderCard}>
            <Text style={styles.nextLabel}>PRIMEIRO TREINO</Text>

            <Text style={styles.workoutTitle}>{workout.title}</Text>

            <Text style={styles.workoutObjective}>{workout.objective}</Text>

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>DURAÇÃO</Text>

                <Text style={styles.statValue}>{workout.duration}</Text>
              </View>

              <View style={styles.stat}>
                <Text style={styles.statLabel}>INTENSIDADE</Text>

                <Text style={styles.statValue}>{workout.intensity}</Text>
              </View>
            </View>
          </View>

          <WorkoutSection title="Aquecimento" items={workout.warmup} />

          <WorkoutSection title="Treino principal" items={workout.workout} />

          <WorkoutSection title="Volta à calma" items={workout.cooldown} />

          <View style={styles.noteCard}>
            <Text style={styles.noteTitle}>NOTA DO ASSISTENTE</Text>

            <Text style={styles.noteText}>{workout.note}</Text>
          </View>

          <Pressable
            style={styles.primaryButton}
            onPress={() => router.push("/plano")}
          >
            <Text style={styles.primaryButtonText}>Ver no meu plano →</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  /*
   * ENTREVISTA CONCLUÍDA
   */
  if (completed) {
    return (
      <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Pressable
              onPress={() => setCompleted(false)}
              style={styles.backButton}
            >
              <Text style={styles.backText}>←</Text>
            </Pressable>

            <Text style={styles.headerTitle}>Perfil de corrida</Text>
          </View>

          <View style={styles.robotContainer}>
            <View style={styles.robotCircle}>
              <Text style={styles.robot}>🤖</Text>
            </View>
          </View>

          <View style={styles.messageCard}>
            <Text style={styles.messageTitle}>Perfeito, {profile.name}!</Text>

            <Text style={styles.messageText}>
              Já tenho as informações necessárias para conhecer melhor o teu
              ponto de partida.
              {"\n\n"}
              Agora podemos preparar o teu primeiro treino personalizado.
            </Text>
          </View>

          <View style={styles.profileCard}>
            <Text style={styles.sectionTitle}>O que me disseste</Text>

            <InfoRow label="Maior distância" value={interview.maxDistance} />

            <InfoRow
              label="Tempo a correr sem parar"
              value={interview.runningTime}
            />

            <InfoRow label="Última corrida" value={interview.lastRun} />

            <InfoRow label="Tem uma prova" value={interview.hasRace} />

            {interview.hasRace === "Sim" && (
              <InfoRow label="Prova / data" value={interview.raceDate} />
            )}

            <InfoRow label="Como te sentes hoje" value={interview.feeling} />
          </View>

          <View style={styles.nextCard}>
            <Text style={styles.nextLabel}>PRÓXIMA ETAPA</Text>

            <Text style={styles.nextTitle}>Criar o teu primeiro treino</Text>

            <Text style={styles.nextDescription}>
              Agora vamos transformar estas informações num treino adaptado ao
              teu nível, objetivo e disponibilidade.
            </Text>

            <Pressable
              style={styles.primaryButton}
              onPress={handleCreateWorkout}
              disabled={saving}
            >
              <Text style={styles.primaryButtonText}>
                {saving ? "A criar treino..." : "Criar treino →"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  /*
   * TELA INICIAL
   */
  if (!started) {
    return (
      <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backText}>←</Text>
            </Pressable>

            <Text style={styles.headerTitle}>Assistente</Text>
          </View>

          <View style={styles.robotContainer}>
            <View style={styles.robotCircle}>
              <Text style={styles.robot}>🤖</Text>
            </View>
          </View>

          <View style={styles.messageCard}>
            <Text style={styles.messageTitle}>Olá, {profile.name}!</Text>

            <Text style={styles.messageText}>
              Já conheço o teu perfil.
              {"\n\n"}
              Agora quero conhecer melhor a tua corrida para conseguir preparar
              treinos adequados ao teu ponto de partida.
            </Text>
          </View>

          <View style={styles.profileCard}>
            <Text style={styles.sectionTitle}>O que já sei sobre ti</Text>

            <InfoRow label="Objetivo" value={profile.goal} />

            <InfoRow label="Nível" value={profile.level} />

            <InfoRow
              label="Dias disponíveis"
              value={profile.days.join(" · ")}
            />

            <InfoRow label="Tempo por sessão" value={profile.duration} />
          </View>

          <View style={styles.nextCard}>
            <Text style={styles.nextLabel}>VAMOS COMEÇAR</Text>

            <Text style={styles.nextTitle}>
              Tenho algumas perguntas para ti
            </Text>

            <Text style={styles.nextDescription}>
              São apenas algumas perguntas para perceber o teu momento atual e
              preparar o teu próximo plano.
            </Text>

            <Pressable style={styles.primaryButton} onPress={startInterview}>
              <Text style={styles.primaryButtonText}>Começar →</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  /*
   * ENTREVISTA
   */
  const question = questions[currentQuestion];

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const isLastQuestion = currentQuestion === questions.length - 1;

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Pressable onPress={previousQuestion} style={styles.backButton}>
              <Text style={styles.backText}>←</Text>
            </Pressable>

            <Text style={styles.headerTitle}>Vamos conversar</Text>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBackground}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progress}%`,
                  },
                ]}
              />
            </View>

            <Text style={styles.progressText}>
              {currentQuestion + 1} de {questions.length}
            </Text>
          </View>

          <View style={styles.smallRobotContainer}>
            <View style={styles.smallRobotCircle}>
              <Text style={styles.smallRobot}>🤖</Text>
            </View>
          </View>

          <View style={styles.questionCard}>
            <Text style={styles.questionTitle}>{question.title}</Text>

            <Text style={styles.questionDescription}>
              {question.description}
            </Text>

            {question.type === "text" && (
              <TextInput
                value={interview[question.key] as string}
                onChangeText={(value) => updateAnswer(question.key, value)}
                placeholder={question.placeholder}
                placeholderTextColor={colors.placeholder}
                selectionColor={colors.lime}
                style={styles.input}
                multiline={question.key === "raceDate"}
              />
            )}

            {question.type === "choice" &&
              question.options?.map((option) => {
                const selected = interview[question.key] === option;

                return (
                  <Pressable
                    key={option}
                    onPress={() => updateAnswer(question.key, option)}
                    style={[styles.option, selected && styles.optionSelected]}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selected && styles.optionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
          </View>

          <View style={styles.navigation}>
            {currentQuestion > 0 && (
              <Pressable
                style={styles.secondaryButton}
                onPress={previousQuestion}
              >
                <Text style={styles.secondaryButtonText}>Voltar</Text>
              </Pressable>
            )}

            <Pressable
              disabled={!isCurrentQuestionAnswered() || saving}
              style={[
                styles.primaryButton,
                !isCurrentQuestionAnswered() && styles.disabledButton,
              ]}
              onPress={isLastQuestion ? finishInterview : nextQuestion}
            >
              <Text style={styles.primaryButtonText}>
                {saving
                  ? "A guardar..."
                  : isLastQuestion
                    ? "Concluir →"
                    : "Continuar →"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/*
 * INFO ROW
 */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>

      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

/*
 * WORKOUT SECTION
 */
function WorkoutSection({ title, items }: { title: string; items: string[] }) {
  return (
    <View style={styles.workoutSection}>
      <Text style={styles.sectionTitle}>{title}</Text>

      {items.map((item, index) => (
        <View key={`${item}-${index}`} style={styles.workoutItem}>
          <View style={styles.stepCircle}>
            <Text style={styles.stepNumber}>{index + 1}</Text>
          </View>

          <Text style={styles.workoutItemText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const colors = {
  background: "#0B0F0D",
  card: "#151A17",
  lime: "#D0FF57",
  text: "#F5F7F3",
  muted: "#A4ADA6",
  border: "#2A332D",
  placeholder: "#68736C",
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    padding: 20,
    paddingBottom: 120,
    gap: 20,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },

  loadingText: {
    color: colors.muted,
    fontSize: 15,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    gap: 16,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  backText: {
    color: colors.text,
    fontSize: 24,
  },

  headerTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
  },

  robotContainer: {
    alignItems: "center",
    marginTop: 8,
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
  },

  robot: {
    fontSize: 82,
  },

  smallRobotContainer: {
    alignItems: "center",
    marginTop: 4,
  },

  smallRobotCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "#27351B",
    borderWidth: 1,
    borderColor: "#526B2B",
    alignItems: "center",
    justifyContent: "center",
  },

  smallRobot: {
    fontSize: 45,
  },

  messageCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 12,
  },

  messageTitle: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "800",
  },

  messageText: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 25,
  },

  profileCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 21,
    fontWeight: "700",
    marginBottom: 8,
  },

  infoRow: {
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 4,
  },

  infoLabel: {
    color: colors.muted,
    fontSize: 13,
  },

  infoValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
  },

  nextCard: {
    backgroundColor: "#27351B",
    borderRadius: 24,
    padding: 20,
    gap: 12,
  },

  nextLabel: {
    color: colors.lime,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
  },

  nextTitle: {
    color: colors.text,
    fontSize: 23,
    fontWeight: "800",
  },

  nextDescription: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 23,
  },

  primaryButton: {
    flex: 1,
    backgroundColor: colors.lime,
    borderRadius: 28,
    paddingVertical: 17,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: "700",
  },

  progressContainer: {
    gap: 8,
  },

  progressBackground: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: colors.lime,
    borderRadius: 3,
  },

  progressText: {
    color: colors.muted,
    fontSize: 12,
    textAlign: "right",
  },

  questionCard: {
    backgroundColor: colors.card,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 22,
    gap: 16,
  },

  questionTitle: {
    color: colors.text,
    fontSize: 27,
    lineHeight: 34,
    fontWeight: "800",
  },

  questionDescription: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 23,
  },

  input: {
    backgroundColor: colors.background,
    color: colors.text,
    borderWidth: 1,
    borderColor: "#3B473E",
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    minHeight: 54,
  },

  option: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#3B473E",
    justifyContent: "center",
    paddingHorizontal: 18,
  },

  optionSelected: {
    backgroundColor: colors.lime,
    borderColor: colors.lime,
  },

  optionText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },

  optionTextSelected: {
    color: colors.background,
    fontWeight: "700",
  },

  navigation: {
    flexDirection: "row",
    gap: 10,
  },

  secondaryButton: {
    paddingHorizontal: 22,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  secondaryButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
  },

  disabledButton: {
    opacity: 0.4,
  },

  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "700",
  },

  description: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
  },

  workoutHeaderCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 10,
  },

  workoutTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
  },

  workoutObjective: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
  },

  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },

  stat: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 14,
    gap: 5,
  },

  statLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },

  statValue: {
    color: colors.lime,
    fontSize: 15,
    fontWeight: "700",
  },

  workoutSection: {
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
  },

  workoutItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#27351B",
    alignItems: "center",
    justifyContent: "center",
  },

  stepNumber: {
    color: colors.lime,
    fontWeight: "800",
    fontSize: 13,
  },

  workoutItemText: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    lineHeight: 21,
  },

  noteCard: {
    backgroundColor: "#27351B",
    borderRadius: 24,
    padding: 20,
    gap: 10,
  },

  noteTitle: {
    color: colors.lime,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
  },

  noteText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 23,
  },
});
