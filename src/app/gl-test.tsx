import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import { GLView } from "expo-gl";
import { useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import * as THREE from "three";
import { GLTFLoader } from "three-stdlib";

export default function GLTest() {
  const animationRef = useRef<number | null>(null);

  async function handleContextCreate(gl: any) {
    console.log("================================");
    console.log("YBOT TESTE INICIADO");
    console.log("THREE VERSION:", THREE.REVISION);
    console.log("================================");

    try {
      // --------------------------------------------------
      // 1. Fake canvas
      // --------------------------------------------------

      const fakeCanvas = {
        width: gl.drawingBufferWidth,
        height: gl.drawingBufferHeight,
        clientHeight: gl.drawingBufferHeight,
        style: {},
        addEventListener: () => {},
        removeEventListener: () => {},
      };

      // --------------------------------------------------
      // 2. Renderer
      // --------------------------------------------------

      const renderer = new THREE.WebGLRenderer({
        canvas: fakeCanvas as unknown as HTMLCanvasElement,
        context: gl as unknown as WebGLRenderingContext,
        antialias: true,
      });

      renderer.setPixelRatio(1);

      renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight, false);

      console.log("RENDERER CRIADO");

      // --------------------------------------------------
      // 3. Scene
      // --------------------------------------------------

      const scene = new THREE.Scene();

      scene.background = new THREE.Color(0x0b0f0d);

      // --------------------------------------------------
      // 4. Camera
      // --------------------------------------------------

      const camera = new THREE.PerspectiveCamera(
        35,
        gl.drawingBufferWidth / gl.drawingBufferHeight,
        0.1,
        100,
      );

      camera.position.set(0, 1.2, 4);

      // --------------------------------------------------
      // 5. Lights
      // --------------------------------------------------

      const ambientLight = new THREE.AmbientLight(0xffffff, 2);

      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 3);

      directionalLight.position.set(2, 4, 3);

      scene.add(directionalLight);

      // --------------------------------------------------
      // 6. Localizar o YBot
      // --------------------------------------------------

      console.log("LOCALIZANDO YBOT...");

      const asset = Asset.fromModule(require("../../assets/avatars/ybot.glb"));

      await asset.downloadAsync();

      console.log("ASSET LOCALIZADO:");
      console.log(asset.localUri);

      if (!asset.localUri) {
        throw new Error("Não foi possível obter o localUri do YBot.");
      }

      // --------------------------------------------------
      // 7. Ler o GLB como ArrayBuffer
      // --------------------------------------------------

      console.log("LENDO GLB COMO ARRAYBUFFER...");

      const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log("BASE64 RECEBIDO:", base64.length);

      // --------------------------------------------------
      // 8. Converter Base64 → ArrayBuffer
      // --------------------------------------------------

      function base64ToArrayBuffer(base64String: string): ArrayBuffer {
        const chars =
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

        let bufferLength = base64String.length * 0.75;

        if (base64String.endsWith("==")) {
          bufferLength -= 2;
        } else if (base64String.endsWith("=")) {
          bufferLength -= 1;
        }

        const bytes = new Uint8Array(bufferLength);

        let p = 0;

        for (let i = 0; i < base64String.length; i += 4) {
          const encoded1 = chars.indexOf(base64String[i]);

          const encoded2 = chars.indexOf(base64String[i + 1]);

          const encoded3 = chars.indexOf(base64String[i + 2]);

          const encoded4 = chars.indexOf(base64String[i + 3]);

          bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);

          if (encoded3 !== -1) {
            bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
          }

          if (encoded4 !== -1) {
            bytes[p++] = ((encoded3 & 3) << 6) | encoded4;
          }
        }

        return bytes.buffer;
      }

      const arrayBuffer = base64ToArrayBuffer(base64);

      console.log("ARRAYBUFFER CRIADO:", arrayBuffer.byteLength);

      // --------------------------------------------------
      // 9. GLTF Loader
      // --------------------------------------------------

      const loader = new GLTFLoader();

      console.log("INICIANDO PARSE DO YBOT...");

      loader.parse(
        arrayBuffer,
        "",
        (gltf) => {
          console.log("================================");
          console.log("YBOT CARREGADO!");
          console.log("================================");

          const model = gltf.scene;

          // ------------------------------------------------
          // Centralizar modelo
          // ------------------------------------------------

          const box = new THREE.Box3().setFromObject(model);

          const center = box.getCenter(new THREE.Vector3());

          const size = box.getSize(new THREE.Vector3());

          model.position.x -= center.x;
          model.position.y -= box.min.y;
          model.position.z -= center.z;

          // ------------------------------------------------
          // Ajustar tamanho
          // ------------------------------------------------

          const maxDimension = Math.max(size.x, size.y, size.z);

          const targetHeight = 2.5;

          const scale = targetHeight / maxDimension;

          model.scale.setScalar(scale);

          // ------------------------------------------------
          // Adicionar modelo
          // ------------------------------------------------

          scene.add(model);

          console.log("MODELO ADICIONADO À CENA");

          console.log("ESCALA:", scale);

          console.log("TAMANHO:", size);

          // ------------------------------------------------
          // Render
          // ------------------------------------------------

          function render() {
            renderer.render(scene, camera);

            gl.endFrameEXP();

            animationRef.current = requestAnimationFrame(render);
          }

          render();

          console.log("================================");
          console.log("YBOT RENDERIZANDO!");
          console.log("================================");
        },

        (error) => {
          console.error("ERRO NO PARSE DO YBOT:", error);
        },
      );
    } catch (error) {
      console.error("================================");

      console.error("ERRO THREE/YBOT:", error);

      console.error("================================");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>TESTE YBOT</Text>

      <GLView style={styles.gl} onContextCreate={handleContextCreate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F0D",
  },

  title: {
    color: "#D0FF57",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 60,
    marginBottom: 20,
  },

  gl: {
    flex: 1,
    width: "100%",
  },
});
