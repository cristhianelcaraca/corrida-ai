import "dotenv/config";
import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json({ limit: "64kb" }));

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const AVATAR_IDS = [
  "ankle_circles","hip_mobility","leg_swings","squat_to_stand",
  "walking_lunge","calf_raise","glute_bridge","easy_walk","easy_run",
  "run_walk_intervals","high_knees","butt_kicks","breathing",
  "calf_stretch","quad_stretch","hip_stretch"
];

const stepSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: { type: "string" },
    duration: { type: "string" },
    instructions: { type: "string" },
    avatarExercise: { type: "string", enum: AVATAR_IDS }
  },
  required: ["name","duration","instructions","avatarExercise"]
};

const workoutSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    objective: { type: "string" },
    duration: { type: "string" },
    intensity: { type: "string" },
    warmup: { type: "array", items: stepSchema },
    mobility: { type: "array", items: stepSchema },
    workout: { type: "array", items: stepSchema },
    cooldown: { type: "array", items: stepSchema },
    note: { type: "string" },
    safetyNote: { type: "string" }
  },
  required: ["title","objective","duration","intensity","warmup","mobility","workout","cooldown","note","safetyNote"]
};

app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/api/workout", async (req, res) => {
  try {
    const { profile, interview, userMessage } = req.body ?? {};
    if (!profile || !interview) {
      return res.status(400).json({ error: "Perfil e entrevista são obrigatórios." });
    }

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
      store: false,
      instructions: [
        "És um assistente de treino de corrida.",
        "Cria uma única sessão personalizada com progressão conservadora.",
        "Não diagnostiques nem trates doenças ou lesões.",
        "Respeita limitações indicadas pelo utilizador.",
        "Não prescrevas exercícios incompatíveis com uma limitação explícita.",
        "Se houver dor, tontura, falta de ar fora do habitual ou outro sinal de alerta no relato, reduz a carga e orienta a interromper a sessão e procurar avaliação adequada.",
        "Usa português de Portugal.",
        "Os IDs avatarExercise devem ser escolhidos exclusivamente da lista fornecida no schema.",
        "Inclui aquecimento, mobilidade, treino principal e volta à calma.",
        "Alongamentos devem ser suaves e nunca até à dor."
      ].join("\n"),
      input: JSON.stringify({ profile, interview, userMessage: userMessage || "" }),
      text: {
        format: {
          type: "json_schema",
          name: "running_workout",
          strict: true,
          schema: workoutSchema
        }
      }
    });

    const workout = JSON.parse(response.output_text);
    return res.json({ workout });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Não foi possível gerar o treino com a IA." });
  }
});

const port = Number(process.env.PORT || 3000);
app.listen(port, "0.0.0.0", () => {
  console.log(`Corrida AI backend: http://0.0.0.0:${port}`);
});
