export type Exercise = {
  id: string;
  name: string;
  category: "Mobilidade" | "Aquecimento" | "Alongamento" | "Respiração";
  description: string;
};

export const EXERCISES: Exercise[] = [
  { id: "ankle_circles", name: "Círculos de tornozelo", category: "Mobilidade", description: "Movimentos circulares controlados de cada tornozelo." },
  { id: "hip_mobility", name: "Mobilidade da anca", category: "Mobilidade", description: "Movimentos suaves da anca, sem forçar a amplitude." },
  { id: "leg_swings", name: "Balanços de perna", category: "Aquecimento", description: "Balanços controlados, aumentando gradualmente a amplitude." },
  { id: "squat_to_stand", name: "Agachamento até à extensão", category: "Mobilidade", description: "Desce confortavelmente e regressa à posição inicial com controlo." },
  { id: "calf_raise", name: "Elevação dos gémeos", category: "Aquecimento", description: "Eleva os calcanhares lentamente e regressa ao chão com controlo." },
  { id: "easy_walk", name: "Caminhada", category: "Aquecimento", description: "Caminhada confortável para preparar o corpo." },
  { id: "easy_run", name: "Corrida leve", category: "Aquecimento", description: "Corrida muito confortável e progressiva." },
  { id: "breathing", name: "Respiração", category: "Respiração", description: "Respiração lenta e confortável durante a recuperação." },
  { id: "calf_stretch", name: "Alongamento dos gémeos", category: "Alongamento", description: "Alongamento suave, sem dor." },
  { id: "quad_stretch", name: "Alongamento da parte da frente da coxa", category: "Alongamento", description: "Alongamento suave do quadríceps." },
  { id: "hip_stretch", name: "Alongamento da anca", category: "Alongamento", description: "Alongamento confortável da região da anca." },
];
