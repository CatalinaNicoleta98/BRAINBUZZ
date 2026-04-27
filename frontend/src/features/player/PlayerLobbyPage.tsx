import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppShell } from "../../shared/components/AppShell";
import { AvatarBadge } from "../../shared/components/AvatarBadge";
import { GlassPanel } from "../../shared/components/GlassPanel";
import { SectionHeading } from "../../shared/components/SectionHeading";
import { StatCard } from "../../shared/components/StatCard";
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
      if (state.status === "question_live") {
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
    <AppShell themeId={room?.quiz.themeId}>
      <div className="ui-page grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <GlassPanel themeId={room?.quiz.themeId}>
          <div className="space-y-6">
            <SectionHeading
              eyebrow="Waiting Room"
              title={room ? `You joined room ${room.roomPin}` : "Connecting..."}
              description="You are in. The host controls when the game goes live, and your screen will jump automatically when the question starts."
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Room PIN" value={room?.roomPin ?? "..."} />
              <StatCard label="Players" value={room?.players.length ?? 0} />
              <StatCard label="Status">
                <div className="text-xl font-bold text-white">Ready</div>
              </StatCard>
            </div>
          </div>
        </GlassPanel>
        <GlassPanel themeId={room?.quiz.themeId}>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Players in the Room</h2>
          <div className="mt-5 grid gap-3">
            {room?.players.map((player) => (
              <div key={player.id} className="flex flex-col gap-3 rounded-[1.5rem] bg-slate-950/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <AvatarBadge avatarId={player.avatarId} size="sm" />
                  <div>
                    <div className="font-semibold text-white">{player.displayName}</div>
                    <div className="text-sm text-slate-400">Ready for the first question</div>
                  </div>
                </div>
                <div className={`text-sm sm:text-right ${player.connected ? "text-electric" : "text-amber-300"}`}>
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
