# Próxima etapa — Corrida AI

1. Frontend: `npm install`
2. Backend:
   - `cd server`
   - `npm install`
   - copie `.env.example` para `.env`
   - coloque a `OPENAI_API_KEY` no `.env`
   - `npm start`
3. No frontend, crie `.env` com:
   `EXPO_PUBLIC_API_URL=http://IP_DO_SEU_PC:3000`
4. Reinicie o Expo depois de alterar `.env`.
5. O `Assistente.tsx` já chama `/api/workout` e usa fallback local se a API falhar.
6. A tab `Mobilidade` já está criada e os treinos têm `avatarExercise` para ligar cada movimento ao avatar.

## Avatar 3D

O ZIP enviado não contém um arquivo de modelo 3D (GLB/GLTF) nem o asset visual do robô/avatar. Por isso o componente `ExerciseAvatar` está preparado como ponto único de integração, sem inventar um arquivo que não existe.

Quando o modelo/asset estiver disponível, substitui-se apenas o conteúdo de `src/components/ExerciseAvatar.tsx`; o catálogo e os IDs dos exercícios já estão preparados.
