import { StyleSheet, Text, View } from "react-native";

type Props = {
  exerciseId: string;
  size?: "small" | "large";
};

export default function ExerciseAvatar({ exerciseId, size = "large" }: Props) {
  /*
   * O asset/modelo do avatar 3D ainda não está dentro do ZIP enviado.
   * Este componente já é o ponto único de integração:
   * quando o modelo 3D for colocado no projeto, substituímos apenas
   * o conteúdo desta View pelo renderer do avatar.
   */
  return (
    <View style={[styles.avatar, size === "small" ? styles.small : styles.large]}>
      <View style={styles.inner}>
        <Text style={styles.label}>AVATAR</Text>
        <Text style={styles.exerciseId}>{exerciseId.replaceAll("_", " ")}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: "#27351B",
    borderWidth: 1,
    borderColor: "#526B2B",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  small: { width: 64, height: 64, borderRadius: 32 },
  large: { width: 180, height: 180, borderRadius: 90 },
  inner: { alignItems: "center", paddingHorizontal: 12 },
  label: { color: "#D0FF57", fontSize: 10, fontWeight: "800", letterSpacing: 1.5 },
  exerciseId: { color: "#F5F7F3", fontSize: 11, textAlign: "center", marginTop: 5 },
});
