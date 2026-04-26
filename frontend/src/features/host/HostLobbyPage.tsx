import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppShell } from "../../shared/components/AppShell";
import { AvatarBadge } from "../../shared/components/AvatarBadge";
import { GlassPanel } from "../../shared/components/GlassPanel";
import { SectionHeading } from "../../shared/components/SectionHeading";
import { socket } from "../../shared/socket/socketClient";
import type { RoomState } from "../../shared/types/game";
import { getHostRoom } from "../../shared/utils/storage";

export function HostLobbyPage() {
  const navigate = useNavigate();
  const { roomPin = "" } = useParams();
  const [room, setRoom] = useState<RoomState | null>(null);

  useEffect(() => {
    const localRoom = getHostRoom();
    if (!localRoom || localRoom !== roomPin) {
      return;
    }

    socket.emit("state:sync", { roomPin, role: "host" }, (state: RoomState) => {
      setRoom(state);
    });

    const handleStateSync = (state: RoomState) => {
      if (state.roomPin === roomPin) {
        setRoom(state);
      }
    };

    const handleQuestionShow = () => {
      navigate(`/host/game/${roomPin}`);
    };

    socket.on("state:sync", handleStateSync);
    socket.on("question:show", handleQuestionShow);

    return () => {
      socket.off("state:sync", handleStateSync);
      socket.off("question:show", handleQuestionShow);
    };
  }, [navigate, roomPin]);

  function startGame() {
    socket.emit("game:start", roomPin);
  }

  return (
    <AppShell themeId={room?.quiz.themeId}>
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <GlassPanel themeId={room?.quiz.themeId}>
          <SectionHeading
            eyebrow="Lobby"
            title={room ? `Room ${room.roomPin}` : "Connecting to room..."}
            description="Watch players arrive live. The backend will keep this lobby synced for every connected client."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl bg-white/5 p-5">
              <div className="text-sm uppercase tracking-[0.25em] text-slate-400">Quiz</div>
              <div className="mt-2 font-display text-2xl">{room?.quiz.title ?? "..."}</div>
            </div>
            <div className="rounded-3xl bg-white/5 p-5">
              <div className="text-sm uppercase tracking-[0.25em] text-slate-400">Players</div>
              <div className="mt-2 font-display text-2xl">{room?.players.length ?? 0}</div>
            </div>
            <div className="rounded-3xl bg-white/5 p-5">
              <div className="text-sm uppercase tracking-[0.25em] text-slate-400">Questions</div>
              <div className="mt-2 font-display text-2xl">{room?.quiz.questionCount ?? 0}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={startGame}
            disabled={!room || room.players.length === 0}
            className="mt-8 rounded-2xl bg-berry px-6 py-4 font-bold text-white transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Start Live Game
          </button>
        </GlassPanel>

        <GlassPanel themeId={room?.quiz.themeId}>
          <h2 className="font-display text-2xl font-bold">Players in the Lobby</h2>
          <div className="mt-5 grid gap-3">
            {room?.players.map((player) => (
              <div key={player.id} className="flex items-center justify-between rounded-2xl bg-slate-950/60 px-4 py-3">
                <div className="flex items-center gap-3">
                  <AvatarBadge avatarId={player.avatarId} size="sm" />
                  <div>
                    <div className="font-semibold">{player.displayName}</div>
                    <div className="text-sm text-slate-400">{player.connected ? "Connected" : "Reconnecting"}</div>
                  </div>
                </div>
                <div className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-electric">
                  Ready
                </div>
              </div>
            ))}
            {!room?.players.length ? <div className="rounded-2xl bg-white/5 p-4 text-slate-400">Waiting for players to join...</div> : null}
          </div>
        </GlassPanel>
      </div>
    </AppShell>
  );
}
