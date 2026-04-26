import { Navigate, Route, Routes } from "react-router-dom";
import { CreatorAuthPage } from "../features/creator/CreatorAuthPage";
import { CreatorStudioPage } from "../features/creator/CreatorStudioPage";
import { HomePage } from "../features/quiz/HomePage";
import { HostCreateRoomPage } from "../features/host/HostCreateRoomPage";
import { HostLobbyPage } from "../features/host/HostLobbyPage";
import { HostGamePage } from "../features/host/HostGamePage";
import { PlayerJoinPage } from "../features/player/PlayerJoinPage";
import { PlayerLobbyPage } from "../features/player/PlayerLobbyPage";
import { PlayerQuestionPage } from "../features/player/PlayerQuestionPage";
import { ResultsPage } from "../features/game/ResultsPage";
import { ProtectedRoute } from "../shared/components/ProtectedRoute";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/creator/auth" element={<CreatorAuthPage />} />
      <Route
        path="/creator/studio"
        element={
          <ProtectedRoute>
            <CreatorStudioPage />
          </ProtectedRoute>
        }
      />
      <Route path="/host/create" element={<HostCreateRoomPage />} />
      <Route path="/host/lobby/:roomPin" element={<HostLobbyPage />} />
      <Route path="/host/game/:roomPin" element={<HostGamePage />} />
      <Route path="/player/join" element={<PlayerJoinPage />} />
      <Route path="/player/lobby/:roomPin" element={<PlayerLobbyPage />} />
      <Route path="/player/question/:roomPin" element={<PlayerQuestionPage />} />
      <Route path="/results/:roomPin" element={<ResultsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
