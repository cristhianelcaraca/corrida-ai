import { router, useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useState } from "react";

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

import ExerciseAvatar from "@/components/ExerciseAvatar";
import { SafeAreaView } from "react-native-safe-area-context";

/* =========================================================
   STORAGE
========================================================= */

const PROFILE_KEY = "corrida-ai.perfil.v1";
const INTERVIEW_KEY = "corrida-ai.entrevista.v1";
const WORKOUT_KEY = "corrida-ai.treino.v1";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL?.trim() || "";

/* =========================================================
   TYPES
========================================================= */

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
  todayReport: string;
};

type WorkoutStep = {
  name: string;
  duration: string;
  instructions: string;
  avatarExercise: string;
};

type Workout = {
  title: string;
  objective: string;
  duration: string;
  intensity: string;
  warmup: WorkoutStep[];
  mobility: WorkoutStep[];
  workout: WorkoutStep[];
  cooldown: WorkoutStep[];
  note: string;
  safetyNote?: string;
  source?: "ai" | "local";
};

type Question = {
  key: keyof Interview;
  title: string;
  description: string;
  type: "text" | "choice";
  options?: string[];
  placeholder?: string;
};

/* =========================================================
   EMPTY INTERVIEW
========================================================= */

const EMPTY_INTERVIEW: Interview = {
  maxDistance: "",
  runningTime: "",
  lastRun: "",
  hasRace: "",
  raceDate: "",
  feeling: "",
  todayReport: "",
};

/* =========================================================
   QUESTIONS
========================================================= */

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
      "Se tiveres uma data em mente, podemos considerar isso no plano.",
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
    description: "Isto ajuda o assistente a adaptar o treino do dia.",
    type: "choice",
    options: ["Com energia", "Normal", "Cansada"],
  },

  {
    key: "todayReport",
    title: "Há alguma coisa que eu deva saber antes de preparar o treino?",
    description:
      "Conta livremente como estás hoje. Podes falar de energia, sono, pernas pesadas, dificuldade, desconforto ou qualquer outra coisa importante.",
    type: "text",
    placeholder:
      "Ex.: Dormi mal e estou com as pernas pesadas. Sinto-me sem muita energia hoje...",
  },
];

/* =========================================================
   AVATAR EXERCISES
========================================================= */

const AVATAR_EXERCISES = {
  ankleCircles: "ankle_circles",
  hipMobility: "hip_mobility",
  legSwings: "leg_swings",
  squatToStand: "squat_to_stand",
  walkingLunge: "walking_lunge",
  calfRaise: "calf_raise",
  gluteBridge: "glute_bridge",
  easyWalk: "easy_walk",
  easyRun: "easy_run",
  runWalkIntervals: "run_walk_intervals",
  highKnees: "high_knees",
  buttKicks: "butt_kicks",
  breathing: "breathing",
  calfStretch: "calf_stretch",
  quadStretch: "quad_stretch",
  hipStretch: "hip_stretch",
} as const;

/* =========================================================
   DEFAULT STEP
========================================================= */

function defaultStep(
  name: string,
  duration: string,
  instructions: string,
  avatarExercise: string,
): WorkoutStep {
  return {
    name,
    duration,
    instructions,
    avatarExercise,
  };
}

/* =========================================================
   NORMALIZE WORKOUT STEP
========================================================= */

function normalizeWorkoutStep(
  item: unknown,
  fallbackAvatar: string,
): WorkoutStep {
  if (typeof item === "string") {
    return {
      name: item,
      duration: "",
      instructions: item,
      avatarExercise: fallbackAvatar,
    };
  }

  if (item && typeof item === "object") {
    const value = item as Partial<WorkoutStep>;

    return {
      name: typeof value.name === "string" ? value.name : "Exercício",

      duration: typeof value.duration === "string" ? value.duration : "",

      instructions:
        typeof value.instructions === "string"
          ? value.instructions
          : typeof value.name === "string"
            ? value.name
            : "",

      avatarExercise:
        typeof value.avatarExercise === "string"
          ? value.avatarExercise
          : fallbackAvatar,
    };
  }

  return {
    name: "Exercício",
    duration: "",
    instructions: "",
    avatarExercise: fallbackAvatar,
  };
}

/* =========================================================
   NORMALIZE WORKOUT
========================================================= */

function normalizeWorkout(value: unknown): Workout {
  const workout = value as Partial<Workout>;

  const warmup = Array.isArray(workout?.warmup)
    ? workout.warmup.map((item) =>
        normalizeWorkoutStep(item, AVATAR_EXERCISES.easyWalk),
      )
    : [];

  const mobility = Array.isArray(workout?.mobility)
    ? workout.mobility.map((item) =>
        normalizeWorkoutStep(item, AVATAR_EXERCISES.hipMobility),
      )
    : [];

  const mainWorkout = Array.isArray(workout?.workout)
    ? workout.workout.map((item) =>
        normalizeWorkoutStep(item, AVATAR_EXERCISES.easyRun),
      )
    : [];

  const cooldown = Array.isArray(workout?.cooldown)
    ? workout.cooldown.map((item) =>
        normalizeWorkoutStep(item, AVATAR_EXERCISES.breathing),
      )
    : [];

  return {
    title:
      typeof workout?.title === "string"
        ? workout.title
        : "Treino personalizado",

    objective:
      typeof workout?.objective === "string"
        ? workout.objective
        : "Desenvolver resistência de forma progressiva.",

    duration:
      typeof workout?.duration === "string" ? workout.duration : "30 minutos",

    intensity:
      typeof workout?.intensity === "string"
        ? workout.intensity
        : "Leve a moderada",

    warmup,
    mobility,
    workout: mainWorkout,
    cooldown,

    note:
      typeof workout?.note === "string"
        ? workout.note
        : "Mantém um ritmo confortável.",

    safetyNote:
      typeof workout?.safetyNote === "string" ? workout.safetyNote : undefined,

    source: workout?.source === "ai" ? "ai" : "local",
  };
}

/* =========================================================
   MAIN SCREEN
========================================================= */

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
  const [aiError, setAiError] = useState<string | null>(null);

  /* =========================================================
     LOAD DATA
  ========================================================= */

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
            try {
              setProfile(JSON.parse(savedProfile));
            } catch (error) {
              console.log("Erro ao interpretar perfil:", error);
            }
          }

          if (savedWorkout) {
            try {
              const parsedWorkout = JSON.parse(savedWorkout);

              setWorkout(normalizeWorkout(parsedWorkout));
            } catch (error) {
              console.log("Erro ao interpretar treino:", error);
            }
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

  /* =========================================================
     SAVE INTERVIEW
  ========================================================= */

  async function saveInterview(data: Interview) {
    try {
      await SecureStore.setItemAsync(INTERVIEW_KEY, JSON.stringify(data));
    } catch (error) {
      console.log("Erro ao guardar entrevista:", error);
    }
  }

  /* =========================================================
     SAVE WORKOUT
  ========================================================= */

  async function saveWorkout(data: Workout) {
    try {
      await SecureStore.setItemAsync(WORKOUT_KEY, JSON.stringify(data));
    } catch (error) {
      console.log("Erro ao guardar treino:", error);
    }
  }

  /* =========================================================
     UPDATE ANSWER
  ========================================================= */

  function updateAnswer(key: keyof Interview, value: string) {
    const updatedInterview = {
      ...interview,
      [key]: value,
    };

    setInterview(updatedInterview);

    void saveInterview(updatedInterview);
  }

  /* =========================================================
     VALIDATION
  ========================================================= */

  function isCurrentQuestionAnswered() {
    const question = questions[currentQuestion];

    if (question.key === "raceDate") {
      return (
        interview.hasRace === "Não" || interview.raceDate.trim().length > 0
      );
    }

    return String(interview[question.key]).trim().length > 0;
  }

  /* =========================================================
     NEXT
  ========================================================= */

  function nextQuestion() {
    if (!isCurrentQuestionAnswered()) {
      return;
    }

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

  /* =========================================================
     PREVIOUS
  ========================================================= */

  function previousQuestion() {
    if (currentQuestion === 0) {
      setStarted(false);
      return;
    }

    if (
      questions[currentQuestion].key === "feeling" &&
      interview.hasRace === "Não"
    ) {
      setCurrentQuestion(currentQuestion - 2);
      return;
    }

    setCurrentQuestion(currentQuestion - 1);
  }

  /* =========================================================
     START
  ========================================================= */

  function startInterview() {
    setInterview({
      ...EMPTY_INTERVIEW,
    });

    setStarted(true);
    setCompleted(false);
    setWorkoutCreated(false);
    setWorkout(null);
    setAiError(null);
    setCurrentQuestion(0);
  }

  /* =========================================================
     FINISH
  ========================================================= */

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

  /* =========================================================
     LOCAL WORKOUT
  ========================================================= */

  function createFirstWorkout(): Workout {
    const goal = profile?.goal?.toLowerCase() || "";

    const level = profile?.level?.toLowerCase() || "";

    const limitations = profile?.limitations?.toLowerCase() || "";

    const maxDistanceText = interview.maxDistance.toLowerCase();

    const runningTimeText = interview.runningTime.toLowerCase();

    const distanceMatch = maxDistanceText.match(/(\d+(?:[.,]\d+)?)/);

    const timeMatch = runningTimeText.match(/(\d+(?:[.,]\d+)?)/);

    const maxDistance = distanceMatch
      ? Number(distanceMatch[1].replace(",", "."))
      : 0;

    const runningTime = timeMatch ? Number(timeMatch[1].replace(",", ".")) : 0;

    const feeling = interview.feeling;

    let intensity = "Leve a moderada";

    if (feeling === "Cansada") {
      intensity = "Leve";
    } else if (level.includes("iniciante")) {
      intensity = "Leve";
    } else if (level.includes("avançado") || level.includes("avancado")) {
      intensity = "Moderada";
    }

    let workoutDuration = profile?.duration || "30 minutos";

    if (feeling === "Cansada") {
      workoutDuration = "25 minutos";
    }

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

    let workout: WorkoutStep[] = [];

    if (maxDistance <= 2 || runningTime <= 15 || level.includes("iniciante")) {
      workout = [
        defaultStep(
          "Corrida muito leve",
          "3 min",
          "Corre num ritmo muito confortável, sem tentar ganhar velocidade.",
          AVATAR_EXERCISES.easyRun,
        ),

        defaultStep(
          "Caminhada",
          "2 min",
          "Caminha tranquilamente para recuperar.",
          AVATAR_EXERCISES.easyWalk,
        ),

        defaultStep(
          "Corrida leve",
          "4 min",
          "Mantém um ritmo em que ainda consegues falar.",
          AVATAR_EXERCISES.easyRun,
        ),

        defaultStep(
          "Caminhada",
          "2 min",
          "Recupera com caminhada confortável.",
          AVATAR_EXERCISES.easyWalk,
        ),

        defaultStep(
          "Corrida leve",
          "4 min",
          "Mantém esforço confortável e controlado.",
          AVATAR_EXERCISES.easyRun,
        ),

        defaultStep(
          "Caminhada",
          "2 min",
          "Recupera antes do último bloco.",
          AVATAR_EXERCISES.easyWalk,
        ),

        defaultStep(
          "Corrida muito leve",
          "3 min",
          "Termina sem aumentar a velocidade.",
          AVATAR_EXERCISES.easyRun,
        ),
      ];
    } else if (maxDistance <= 5 || runningTime <= 35) {
      workout = [
        defaultStep(
          "Corrida leve",
          "5 min",
          "Começa progressivamente e encontra um ritmo confortável.",
          AVATAR_EXERCISES.easyRun,
        ),

        defaultStep(
          "Caminhada",
          "2 min",
          "Recupera sem parar completamente.",
          AVATAR_EXERCISES.easyWalk,
        ),

        defaultStep(
          "Corrida confortável",
          "6 min",
          "Mantém um esforço sustentável.",
          AVATAR_EXERCISES.easyRun,
        ),

        defaultStep(
          "Caminhada",
          "2 min",
          "Recuperação tranquila.",
          AVATAR_EXERCISES.easyWalk,
        ),

        defaultStep(
          "Corrida confortável",
          "6 min",
          "Mantém a respiração controlada.",
          AVATAR_EXERCISES.easyRun,
        ),

        defaultStep(
          "Caminhada",
          "2 min",
          "Recupera antes do último bloco.",
          AVATAR_EXERCISES.easyWalk,
        ),

        defaultStep(
          "Corrida leve",
          "5 min",
          "Termina de forma confortável.",
          AVATAR_EXERCISES.easyRun,
        ),
      ];
    } else {
      workout = [
        defaultStep(
          "Corrida confortável",
          "8 min",
          "Corre num ritmo estável e confortável.",
          AVATAR_EXERCISES.easyRun,
        ),

        defaultStep(
          "Recuperação",
          "2 min",
          "Caminha ou faz trote muito leve.",
          AVATAR_EXERCISES.easyWalk,
        ),

        defaultStep(
          "Corrida confortável",
          "8 min",
          "Mantém o esforço controlado.",
          AVATAR_EXERCISES.easyRun,
        ),

        defaultStep(
          "Recuperação",
          "2 min",
          "Recupera antes do último bloco.",
          AVATAR_EXERCISES.easyWalk,
        ),

        defaultStep(
          "Corrida confortável",
          "8 min",
          "Termina sem sprintar.",
          AVATAR_EXERCISES.easyRun,
        ),
      ];
    }

    if (feeling === "Cansada") {
      workout = [
        defaultStep(
          "Corrida muito leve",
          "5 min",
          "Mantém uma intensidade muito confortável.",
          AVATAR_EXERCISES.easyRun,
        ),

        defaultStep(
          "Caminhada",
          "2 min",
          "Recupera caminhando.",
          AVATAR_EXERCISES.easyWalk,
        ),

        defaultStep(
          "Corrida leve",
          "5 min",
          "Não aumentes a velocidade.",
          AVATAR_EXERCISES.easyRun,
        ),

        defaultStep(
          "Caminhada",
          "2 min",
          "Recupera tranquilamente.",
          AVATAR_EXERCISES.easyWalk,
        ),

        defaultStep(
          "Corrida muito leve",
          "5 min",
          "Finaliza sem acumular fadiga.",
          AVATAR_EXERCISES.easyRun,
        ),
      ];
    }

    const warmup: WorkoutStep[] = [
      defaultStep(
        "Caminhada rápida",
        "5 min",
        "Começa a elevar gradualmente a temperatura corporal.",
        AVATAR_EXERCISES.easyWalk,
      ),

      defaultStep(
        "Círculos de tornozelo",
        "30 s",
        "Faz movimentos circulares controlados com cada tornozelo.",
        AVATAR_EXERCISES.ankleCircles,
      ),

      defaultStep(
        "Mobilidade da anca",
        "1 min",
        "Movimenta a anca de forma lenta e controlada.",
        AVATAR_EXERCISES.hipMobility,
      ),

      defaultStep(
        "Balanços de perna",
        "1 min",
        "Faz movimentos controlados, sem forçar a amplitude.",
        AVATAR_EXERCISES.legSwings,
      ),

      defaultStep(
        "Caminhada progressiva",
        "2 min",
        "Aumenta gradualmente o ritmo da caminhada.",
        AVATAR_EXERCISES.easyWalk,
      ),
    ];

    const mobility: WorkoutStep[] = [
      defaultStep(
        "Agachamento até à extensão",
        "8 repetições",
        "Desce de forma confortável e regressa à posição inicial com controlo.",
        AVATAR_EXERCISES.squatToStand,
      ),

      defaultStep(
        "Elevação dos gémeos",
        "10 repetições",
        "Eleva os calcanhares lentamente e regressa ao chão com controlo.",
        AVATAR_EXERCISES.calfRaise,
      ),

      defaultStep(
        "Mobilidade da anca",
        "30 s por lado",
        "Faz movimentos suaves, sem forçar amplitude.",
        AVATAR_EXERCISES.hipMobility,
      ),
    ];

    const cooldown: WorkoutStep[] = [
      defaultStep(
        "Caminhada tranquila",
        "5 min",
        "Reduz progressivamente o ritmo.",
        AVATAR_EXERCISES.easyWalk,
      ),

      defaultStep(
        "Respiração",
        "1–2 min",
        "Respira lentamente até a frequência cardíaca começar a normalizar.",
        AVATAR_EXERCISES.breathing,
      ),

      defaultStep(
        "Alongamento dos gémeos",
        "30 s por lado",
        "Alongamento suave, sem provocar dor.",
        AVATAR_EXERCISES.calfStretch,
      ),

      defaultStep(
        "Alongamento da parte da frente da coxa",
        "30 s por lado",
        "Mantém o alongamento suave.",
        AVATAR_EXERCISES.quadStretch,
      ),

      defaultStep(
        "Mobilidade suave da anca",
        "30 s por lado",
        "Movimentos lentos e confortáveis.",
        AVATAR_EXERCISES.hipStretch,
      ),
    ];

    let note =
      "Mantém um ritmo confortável. Deves conseguir falar durante a maior parte da corrida.";

    if (limitations.trim().length > 0) {
      note =
        "O treino foi pensado tendo em conta a limitação indicada. Mantém a intensidade confortável e interrompe o exercício se aparecer dor.";
    }

    if (feeling === "Cansada") {
      note =
        "Hoje o objetivo é movimentar o corpo sem acumular fadiga. Mantém um ritmo muito confortável e não tentes compensar o cansaço aumentando a velocidade.";
    }

    if (interview.hasRace === "Sim") {
      note +=
        " Como tens uma prova como objetivo, a carga deverá aumentar progressivamente ao longo das próximas sessões.";
    }

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
      mobility,
      workout,
      cooldown,
      note,
      safetyNote: "Treino local de fallback. A IA não esteve disponível.",
      source: "local",
    };
  }

  /* =========================================================
     AI WORKOUT
  ========================================================= */

  async function createWorkoutWithAI(): Promise<Workout> {
    if (!API_BASE_URL) {
      throw new Error("EXPO_PUBLIC_API_URL não está configurada.");
    }

    const endpoint = `${API_BASE_URL.replace(/\/$/, "")}/api/workout`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        profile,
        interview,
        userMessage: interview.todayReport,
      }),
    });

    let data: any = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new Error(data?.error || `Erro da API (${response.status})`);
    }

    const rawWorkout = data?.workout ?? data;

    return {
      ...normalizeWorkout(rawWorkout),
      source: "ai",
    };
  }

  /* =========================================================
     CREATE WORKOUT
  ========================================================= */

  async function handleCreateWorkout() {
    try {
      setSaving(true);
      setAiError(null);

      let newWorkout: Workout;

      try {
        newWorkout = await createWorkoutWithAI();
      } catch (error) {
        console.log("IA indisponível. Usando fallback local:", error);

        const errorMessage =
          error instanceof Error
            ? error.message
            : "Não foi possível contactar a IA.";

        setAiError(errorMessage);

        newWorkout = createFirstWorkout();
      }

      await saveWorkout(newWorkout);

      setWorkout(newWorkout);
      setWorkoutCreated(true);
    } catch (error) {
      console.log("Erro ao criar treino:", error);
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     LOADING
  ========================================================= */

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

  /* =========================================================
     NO PROFILE
  ========================================================= */

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

  /* =========================================================
     WORKOUT CREATED
  ========================================================= */

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
            <Text style={styles.messageTitle}>
              {workout.source === "ai"
                ? "Treino personalizado criado!"
                : "Treino criado!"}
            </Text>

            <Text style={styles.messageText}>
              {workout.source === "ai"
                ? "Analisei o teu perfil, as respostas da entrevista e o teu relato de hoje para preparar esta sessão."
                : "Preparei uma sessão local de segurança porque a API da IA ainda não está disponível."}
            </Text>
          </View>

          {aiError && (
            <View style={styles.warningCard}>
              <Text style={styles.warningTitle}>IA não disponível</Text>

              <Text style={styles.warningText}>{aiError}</Text>

              <Text style={styles.warningText}>
                O treino apresentado é o fallback local. Depois de configurarmos
                o backend, este botão passará a gerar os treinos através da IA.
              </Text>
            </View>
          )}

          <View style={styles.workoutHeaderCard}>
            <Text style={styles.nextLabel}>TREINO PERSONALIZADO</Text>

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

          {workout.mobility.length > 0 && (
            <WorkoutSection title="Mobilidade" items={workout.mobility} />
          )}

          <WorkoutSection title="Treino principal" items={workout.workout} />

          <WorkoutSection title="Volta à calma" items={workout.cooldown} />

          {workout.safetyNote && (
            <View style={styles.safetyCard}>
              <Text style={styles.safetyTitle}>SEGURANÇA</Text>

              <Text style={styles.safetyText}>{workout.safetyNote}</Text>
            </View>
          )}

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

  /* =========================================================
     INTERVIEW COMPLETED
  ========================================================= */

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
              Agora podemos preparar o teu primeiro treino personalizado com a
              IA.
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

            {interview.todayReport.trim().length > 0 && (
              <InfoRow label="Relato de hoje" value={interview.todayReport} />
            )}
          </View>

          <View style={styles.nextCard}>
            <Text style={styles.nextLabel}>PRÓXIMA ETAPA</Text>

            <Text style={styles.nextTitle}>Criar o teu primeiro treino</Text>

            <Text style={styles.nextDescription}>
              A IA vai analisar o teu perfil, experiência, objetivo,
              disponibilidade e o relato de hoje para montar uma sessão
              personalizada.
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

  /* =========================================================
     INITIAL SCREEN
  ========================================================= */

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
              {"\n\n"}
              Também podes contar livremente como estás hoje.
            </Text>
          </View>

          <View style={styles.profileCard}>
            <Text style={styles.sectionTitle}>O que já sei sobre ti</Text>

            <InfoRow label="Objetivo" value={profile.goal} />

            <InfoRow label="Nível" value={profile.level} />

            <InfoRow
              label="Dias disponíveis"
              value={
                Array.isArray(profile.days) ? profile.days.join(" · ") : ""
              }
            />

            <InfoRow label="Tempo por sessão" value={profile.duration} />
          </View>

          <View style={styles.nextCard}>
            <Text style={styles.nextLabel}>VAMOS COMEÇAR</Text>

            <Text style={styles.nextTitle}>
              Tenho algumas perguntas para ti
            </Text>

            <Text style={styles.nextDescription}>
              São algumas perguntas para perceber o teu momento atual e preparar
              o teu próximo treino.
            </Text>

            <Pressable style={styles.primaryButton} onPress={startInterview}>
              <Text style={styles.primaryButtonText}>Começar →</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  /* =========================================================
     INTERVIEW
  ========================================================= */

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
                multiline={
                  question.key === "raceDate" || question.key === "todayReport"
                }
                textAlignVertical={
                  question.key === "raceDate" || question.key === "todayReport"
                    ? "top"
                    : "center"
                }
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

/* =========================================================
   INFO ROW
========================================================= */

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>

      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

/* =========================================================
   WORKOUT SECTION
========================================================= */

function WorkoutSection({
  title,
  items,
}: {
  title: string;
  items: WorkoutStep[];
}) {
  return (
    <View style={styles.workoutSection}>
      <Text style={styles.sectionTitle}>{title}</Text>

      {items.map((item, index) => (
        <View key={`${item.name}-${index}`} style={styles.workoutItem}>
          <View style={styles.stepCircle}>
            <Text style={styles.stepNumber}>{index + 1}</Text>
          </View>

          <View style={styles.workoutItemContent}>
            <View style={styles.exerciseRow}>
              <View style={styles.exerciseText}>
                <Text style={styles.workoutItemTitle}>{item.name}</Text>

                {item.duration.trim().length > 0 && (
                  <Text style={styles.workoutItemDuration}>
                    {item.duration}
                  </Text>
                )}

                {item.instructions.trim().length > 0 && (
                  <Text style={styles.workoutItemText}>
                    {item.instructions}
                  </Text>
                )}

                <Pressable
                  style={styles.demoButton}
                  onPress={() =>
                    router.push(`/mobilidade?exercise=${item.avatarExercise}`)
                  }
                >
                  <Text style={styles.demoButtonText}>Ver demonstração →</Text>
                </Pressable>
              </View>

              {/* =================================================
                  AVATAR 3D
              ================================================= */}

              <ExerciseAvatar exerciseId={item.avatarExercise} size="small" />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

/* =========================================================
   COLORS
========================================================= */

const colors = {
  background: "#0B0F0D",
  card: "#151A17",
  lime: "#D0FF57",
  text: "#F5F7F3",
  muted: "#A4ADA6",
  border: "#2A332D",
  placeholder: "#68736C",
  warningBackground: "#332B16",
  warningBorder: "#5D5028",
  safetyBackground: "#19221B",
};

/* =========================================================
   STYLES
========================================================= */

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
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  workoutItemContent: {
    flex: 1,
    gap: 4,
  },

  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  exerciseText: {
    flex: 1,
    gap: 4,
  },

  demoButton: {
    alignSelf: "flex-start",
    marginTop: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  demoButtonText: {
    color: colors.lime,
    fontSize: 11,
    fontWeight: "700",
  },

  workoutItemTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },

  workoutItemDuration: {
    color: colors.lime,
    fontSize: 13,
    fontWeight: "700",
  },

  workoutItemText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
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

  safetyCard: {
    backgroundColor: colors.safetyBackground,
    borderRadius: 24,
    padding: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },

  safetyTitle: {
    color: colors.lime,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
  },

  safetyText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
  },

  warningCard: {
    backgroundColor: colors.warningBackground,
    borderRadius: 20,
    padding: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },

  warningTitle: {
    color: colors.lime,
    fontSize: 16,
    fontWeight: "800",
  },

  warningText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
  },
});
