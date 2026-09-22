import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
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
import * as SecureStore from "expo-secure-store";

const STORAGE_KEY = "corrida-ai.perfil.v1";

const GOALS = ["Começar a correr", "Correr 5 km", "Correr 10 km"];
const LEVELS = ["Nunca corri", "Estou a começar", "Corro regularmente"];
const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const DURATIONS = ["20 min", "30 min", "45 min", "60 min"];

type Profile = {
  name: string;
  goal: string;
  level: string;
  routine: string;
  days: string[];
  duration: string;
  limitations: string;
};

const EMPTY_PROFILE: Profile = {
  name: "",
  goal: "",
  level: "",
  routine: "",
  days: [],
  duration: "",
  limitations: "",
};

// Confirma a estrutura antes de carregar dados guardados.
function isProfile(value: unknown): value is Profile {
  if (!value || typeof value !== "object") return false;

  const p = value as Record<string, unknown>;

  return (
    typeof p.name === "string" &&
    typeof p.goal === "string" &&
    GOALS.includes(p.goal) &&
    typeof p.level === "string" &&
    LEVELS.includes(p.level) &&
    typeof p.routine === "string" &&
    Array.isArray(p.days) &&
    p.days.every(
      (day: unknown) => typeof day === "string" && DAYS.includes(day),
    ) &&
    typeof p.duration === "string" &&
    DURATIONS.includes(p.duration) &&
    typeof p.limitations === "string"
  );
}

// Componente reutilizável para as opções do formulário.
function Choice({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.choice, selected && styles.choiceSelected]}
    >
      <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function PerfilScreen() {
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const saved = await SecureStore.getItemAsync(STORAGE_KEY);

        if (saved) {
          const parsed: unknown = JSON.parse(saved);

          if (!isProfile(parsed)) {
            throw new Error("Perfil inválido");
          }

          if (active) setProfile(parsed);
        }
      } catch {
        if (active) setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  function updateField<K extends keyof Profile>(field: K, value: Profile[K]) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  function toggleDay(day: string) {
    setProfile((current) => ({
      ...current,
      days: current.days.includes(day)
        ? current.days.filter((item) => item !== day)
        : [...current.days, day],
    }));
  }

  async function saveProfile() {
    if (busy) return;

    if (
      !profile.name.trim() ||
      !profile.goal ||
      !profile.level ||
      !profile.routine.trim() ||
      !profile.days.length ||
      !profile.duration
    ) {
      Alert.alert(
        "Faltam alguns dados",
        "Preenche o nome, objetivo, experiência, rotina, dias e duração.",
      );
      return;
    }

    Keyboard.dismiss();
    setBusy(true);

    try {
      const cleanProfile: Profile = {
        ...profile,
        name: profile.name.trim(),
        routine: profile.routine.trim(),
        limitations: profile.limitations.trim(),
        days: DAYS.filter((day) => profile.days.includes(day)),
      };

      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(cleanProfile));

      setProfile(cleanProfile);

      Alert.alert(
        "Perfil guardado",
        "Os teus dados foram guardados neste dispositivo.",
      );
    } catch {
      Alert.alert(
        "Não foi possível guardar",
        "Os dados continuam no formulário. Tenta novamente.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function deleteProfile() {
    setBusy(true);

    try {
      await SecureStore.deleteItemAsync(STORAGE_KEY);
      setProfile({ ...EMPTY_PROFILE, days: [] });
      setLoadError(false);
      Alert.alert("Perfil apagado", "Os dados locais foram removidos.");
    } catch {
      Alert.alert("Erro", "Não foi possível apagar os dados.");
    } finally {
      setBusy(false);
    }
  }

  function confirmDelete() {
    Alert.alert(
      "Apagar o perfil?",
      "Os dados guardados e o formulário serão limpos.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Apagar",
          style: "destructive",
          onPress: () => void deleteProfile(),
        },
      ],
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#D0FF57" size="large" />
        <Text style={styles.description}>A carregar o perfil…</Text>
      </View>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.center}>
          <Text style={styles.title}>Não foi possível ler o perfil</Text>
          <Text style={styles.description}>
            Reabre a aplicação para tentar novamente. Também podes apagar os
            dados locais e começar de novo.
          </Text>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={confirmDelete}
            style={styles.deleteButton}
          >
            <Text style={styles.deleteText}>Apagar dados locais</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <Text style={styles.eyebrow}>O TEU PONTO DE PARTIDA</Text>
          <Text style={styles.title}>O teu perfil</Text>
          <Text style={styles.description}>
            Conta-nos um pouco sobre ti e sobre a tua rotina.
          </Text>

          <View style={styles.form} pointerEvents={busy ? "none" : "auto"}>
            <View style={styles.card}>
              <Text style={styles.label}>Como te chamas?</Text>
              <TextInput
                accessibilityLabel="Nome"
                value={profile.name}
                onChangeText={(value) => updateField("name", value)}
                placeholder="O teu nome"
                placeholderTextColor="#89948D"
                selectionColor="#D0FF57"
                autoCapitalize="words"
                maxLength={50}
                style={styles.input}
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>Qual é o teu objetivo?</Text>
              <View style={styles.options}>
                {GOALS.map((goal) => (
                  <Choice
                    key={goal}
                    label={goal}
                    selected={profile.goal === goal}
                    onPress={() => updateField("goal", goal)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>Qual é a tua experiência?</Text>
              <View style={styles.options}>
                {LEVELS.map((level) => (
                  <Choice
                    key={level}
                    label={level}
                    selected={profile.level === level}
                    onPress={() => updateField("level", level)}
                  />
                ))}
              </View>

              <Text style={styles.label}>Como treinas atualmente?</Text>
              <TextInput
                accessibilityLabel="Rotina atual"
                value={profile.routine}
                onChangeText={(value) => updateField("routine", value)}
                placeholder="Ex.: caminho 3 vezes por semana, 30 minutos. Ainda não corro."
                placeholderTextColor="#89948D"
                selectionColor="#D0FF57"
                multiline
                maxLength={160}
                style={[styles.input, styles.textArea]}
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>Em que dias estás disponível?</Text>
              <Text style={styles.description}>
                Marca os dias possíveis. Não significa que vais treinar em
                todos.
              </Text>
              <View style={styles.options}>
                {DAYS.map((day) => (
                  <Choice
                    key={day}
                    label={day}
                    selected={profile.days.includes(day)}
                    onPress={() => toggleDay(day)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>Tempo por sessão</Text>
              <View style={styles.options}>
                {DURATIONS.map((duration) => (
                  <Choice
                    key={duration}
                    label={duration}
                    selected={profile.duration === duration}
                    onPress={() => updateField("duration", duration)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>
                Limitações ou indicações a respeitar
              </Text>
              <Text style={styles.description}>
                Opcional. Inclui apenas o que for relevante para a prática.
              </Text>
              <TextInput
                accessibilityLabel="Limitações, opcional"
                value={profile.limitations}
                onChangeText={(value) => updateField("limitations", value)}
                placeholder="Ex.: evitar saltos por indicação profissional."
                placeholderTextColor="#89948D"
                selectionColor="#D0FF57"
                multiline
                maxLength={160}
                style={[styles.input, styles.textArea]}
              />
            </View>
          </View>

          <Text style={styles.note}>
            Estes dados ficam neste dispositivo. Podes editá-los ou apagá-los
            quando quiseres.
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: busy }}
            disabled={busy}
            onPress={saveProfile}
            style={[styles.saveButton, busy && styles.disabled]}
          >
            <Text style={styles.saveText}>
              {busy ? "A processar…" : "Guardar perfil"}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={confirmDelete}
            style={styles.deleteButton}
          >
            <Text style={styles.deleteText}>Apagar perfil</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0B0F0D",
  },
  center: {
    flex: 1,
    backgroundColor: "#0B0F0D",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 16,
  },
  content: {
    padding: 20,
    paddingBottom: 120,
    gap: 16,
  },
  eyebrow: {
    color: "#D0FF57",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
  },
  title: {
    color: "#F5F7F3",
    fontSize: 30,
    fontWeight: "800",
  },
  description: {
    color: "#A4ADA6",
    fontSize: 14,
    lineHeight: 22,
  },
  form: {
    gap: 16,
  },
  card: {
    backgroundColor: "#151A17",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#2A332D",
    padding: 18,
    gap: 14,
  },
  label: {
    color: "#F5F7F3",
    fontSize: 16,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#0B0F0D",
    color: "#F5F7F3",
    borderWidth: 1,
    borderColor: "#3B473E",
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    minHeight: 50,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  choice: {
    borderWidth: 1,
    borderColor: "#465148",
    borderRadius: 22,
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: "center",
  },
  choiceSelected: {
    backgroundColor: "#D0FF57",
    borderColor: "#D0FF57",
  },
  choiceText: {
    color: "#F5F7F3",
    fontSize: 14,
    fontWeight: "500",
  },
  choiceTextSelected: {
    color: "#0B0F0D",
    fontWeight: "700",
  },
  note: {
    color: "#A4ADA6",
    fontSize: 12,
    lineHeight: 19,
  },
  saveButton: {
    backgroundColor: "#D0FF57",
    borderRadius: 28,
    alignItems: "center",
    padding: 18,
  },
  saveText: {
    color: "#0B0F0D",
    fontSize: 17,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.6,
  },
  deleteButton: {
    padding: 16,
    alignItems: "center",
  },
  deleteText: {
    color: "#FFAAA5",
    fontSize: 14,
  },
});
