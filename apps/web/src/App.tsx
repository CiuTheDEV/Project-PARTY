import { Navigate, Route, Routes } from "react-router-dom";

import { ControllerRuntimePage } from "./pages/ControllerRuntimePage";
import { GameDetailsPage } from "./pages/GameDetailsPage";
import { GameLaunchPage } from "./pages/GameLaunchPage";
import { JoinPage } from "./pages/JoinPage";
import { LobbyPage } from "./pages/LobbyPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LobbyPage />} />
      <Route path="/join" element={<JoinPage />} />
      <Route
        path="/kalambury"
        element={<GameLaunchPage gameIdOverride="kalambury" />}
      />
      <Route
        path="/tajniacy"
        element={<GameLaunchPage gameIdOverride="tajniacy" />}
      />
      <Route path="/games/:gameId" element={<GameDetailsPage />} />
      <Route path="/games/:gameId/launch" element={<GameLaunchPage />} />
      <Route
        path="/games/:gameId/controller/:sessionCode"
        element={<ControllerRuntimePage />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
