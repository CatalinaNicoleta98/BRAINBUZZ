import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppShell } from "../../shared/components/AppShell";
import { GlassPanel } from "../../shared/components/GlassPanel";
import { SectionHeading } from "../../shared/components/SectionHeading";
import { socket } from "../../shared/socket/socketClient";
import type { RoomState } from "../../shared/types/game";
import { getPlayerSession } from "../../shared/utils/storage";

export function PlayerLobbyPage() {
  const navigate = useNavigate();
  const { roomPin = "" } = useParams();
  const [room, setRoom] = useState<RoomState | null>(null);

  useEffect(() => {
    const session = getPlayerSession();
    if (!session || session.roomPin !== roomPin) {
      navigate("/player/join");
      return;
    }

    socket.emit("state:sync", { roomPin, role: "player", participantId: session.playerId }, (state: RoomState) => {
      setRoom(state);
      if (state.status === "question") {
        navigate(`/player/question/${roomPin}`);
      }
    });

    const handleStateSync = (state: RoomState) => {
      if (state.roomPin === roomPin) {
        setRoom(state);
      }
    };

    const handleQuestionShow = () => {
      navigate(`/player/question/${roomPin}`);
    };

    socket.on("state:sync", handleStateSync);
    socket.on("question:show", handleQuestionShow);

    return () => {
      socket.off("state:sync", handleStateSync);
      socket.off("question:show", handleQuestionShow);
    };
  }, [navigate, roomPin]);

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <GlassPanel>
          <SectionHeading
            eyebrow="Waiting Room"
            title={room ? `You joined room ${room.roomPin}` : "Connecting..."}
            description="Stay ready. The host can launch the game at any moment, and the next screen will sync automatically."
          />
        </GlassPanel>
        <GlassPanel>
          <h2 className="font-display text-2xl font-bold">Players in the Room</h2>
          <div className="mt-5 grid gap-3">
            {room?.players.map((player) => (
              <div key={player.id} className="flex items-center justify-between rounded-2xl bg-slate-950/60 px-4 py-3">
                <div className="font-semibold">{player.displayName}</div>
                <div className={`text-sm ${player.connected ? "text-electric" : "text-amber-300"}`}>
                  {player.connected ? "Connected" : "Reconnecting"}
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>
    </AppShell>
  );
}
