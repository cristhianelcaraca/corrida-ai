import { GLView } from "expo-gl";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  exerciseId: string;
  size?: "small" | "large";
};

export default function ExerciseAvatar({ exerciseId, size = "large" }: Props) {
  const onContextCreate = (gl: any) => {
    console.log("================================");
    console.log("GLVIEW FUNCIONANDO!");
    console.log("EXERCISE:", exerciseId);
    console.log("WIDTH:", gl.drawingBufferWidth);
    console.log("HEIGHT:", gl.drawingBufferHeight);
    console.log("================================");

    gl.clearColor(0.1, 0.15, 0.05, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.endFrameEXP();
  };

  return (
    <View
      style={[styles.avatar, size === "small" ? styles.small : styles.large]}
    >
      <GLView
        style={StyleSheet.absoluteFill}
        onContextCreate={onContextCreate}
      />

      <View pointerEvents="none" style={styles.label}>
        <Text style={styles.text}>{exerciseId}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: "#27351B",
    borderWidth: 1,
    borderColor: "#526B2B",
    overflow: "hidden",
  },

  small: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },

  large: {
    width: 220,
    height: 220,
    borderRadius: 110,
  },

  label: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 8,
    alignItems: "center",
  },

  text: {
    color: "#D0FF57",
    fontSize: 9,
  },
});
