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
  const [error, setError] = useState("");
  const joinUrl = typeof window !== "undefined" ? `${window.location.origin}/player/join?pin=${roomPin}` : "";
  const qrCodeUrl = joinUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(joinUrl)}`
    : "";

  useEffect(() => {
    const localRoom = getHostRoom();
    if (!localRoom || localRoom !== roomPin) {
      navigate("/host/library");
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

    const handleSocketError = (payload: { message: string }) => {
      setError(payload.message);
    };

    socket.on("state:sync", handleStateSync);
    socket.on("question:show", handleQuestionShow);
    socket.on("error", handleSocketError);

    return () => {
      socket.off("state:sync", handleStateSync);
      socket.off("question:show", handleQuestionShow);
      socket.off("error", handleSocketError);
    };
  }, [navigate, roomPin]);

  function startGame() {
    setError("");
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
          {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
        </GlassPanel>

        <GlassPanel themeId={room?.quiz.themeId}>
          <div className="mb-6 rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
            <div className="grid gap-5 md:grid-cols-[0.9fr_1.1fr] md:items-center">
              <div className="flex justify-center">
                {qrCodeUrl ? <img src={qrCodeUrl} alt={`QR code to join room ${roomPin}`} className="h-44 w-44 rounded-2xl bg-white p-3" /> : null}
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-sm uppercase tracking-[0.25em] text-slate-400">Quick Join</div>
                  <div className="mt-2 font-display text-3xl font-bold">{roomPin}</div>
                </div>
                <p className="text-sm text-slate-300">Players can scan this QR code on their phone or use the room PIN to land straight on the join page.</p>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(joinUrl);
                  }}
                  className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-electric/60"
                >
                  Copy join link
                </button>
              </div>
            </div>
          </div>
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
