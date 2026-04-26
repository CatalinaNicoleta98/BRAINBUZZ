import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { AppShell } from "../../shared/components/AppShell";
import { AvatarBadge } from "../../shared/components/AvatarBadge";
import { GlassPanel } from "../../shared/components/GlassPanel";
import { SectionHeading } from "../../shared/components/SectionHeading";
import { socket } from "../../shared/socket/socketClient";
import type { RoomState } from "../../shared/types/game";
import { getHostRoom, getPlayerSession } from "../../shared/utils/storage";

export function ResultsPage() {
  const { roomPin = "" } = useParams();
  const [room, setRoom] = useState<RoomState | null>(null);

  useEffect(() => {
    const playerSession = getPlayerSession();
    const hostRoom = getHostRoom();
    const role = hostRoom === roomPin ? "host" : "player";
    const participantId = role === "player" ? playerSession?.playerId : undefined;

    socket.emit("state:sync", { roomPin, role, participantId }, (state: RoomState) => {
      setRoom(state);
    });

    const handleStateSync = (state: RoomState) => {
      if (state.roomPin === roomPin) {
        setRoom(state);
      }
    };

    socket.on("state:sync", handleStateSync);

    return () => {
      socket.off("state:sync", handleStateSync);
    };
  }, [roomPin]);

  const podium = useMemo(() => room?.players.slice(0, 3) ?? [], [room]);

  return (
    <AppShell themeId={room?.quiz.themeId}>
      <div className="grid gap-6">
        <GlassPanel themeId={room?.quiz.themeId}>
          <SectionHeading
            eyebrow="Final Results"
            title={room ? `${room.quiz.title} is complete.` : "Loading results..."}
            description="The server locked in the scores. Here’s the final BrainBuzz podium and full leaderboard."
          />
        </GlassPanel>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <GlassPanel themeId={room?.quiz.themeId}>
            <h2 className="font-display text-3xl font-bold">Podium</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {podium.map((player, index) => (
                <div
                  key={player.id}
                  className={`rounded-[2rem] border p-5 text-center ${
                    index === 0
                      ? "border-gold/60 bg-gold/10"
                      : index === 1
                        ? "border-skyglow/40 bg-skyglow/10"
                        : "border-berry/40 bg-berry/10"
                  }`}
                >
                  <div className="text-sm uppercase tracking-[0.3em] text-slate-300">Place {index + 1}</div>
                  <div className="mt-4 flex justify-center">
                    <AvatarBadge avatarId={player.avatarId} size="lg" />
                  </div>
                  <div className="mt-4 font-display text-3xl font-bold">{player.displayName}</div>
                  <div className="mt-2 text-2xl font-bold text-white">{player.score}</div>
                  <div className="text-sm text-slate-300">{player.correctAnswers} correct answers</div>
                </div>
              ))}
            </div>
          </GlassPanel>

          <GlassPanel themeId={room?.quiz.themeId}>
            <h2 className="font-display text-3xl font-bold">Leaderboard</h2>
            <div className="mt-5 space-y-3">
              {room?.players.map((player, index) => (
                <div key={player.id} className="flex items-center justify-between rounded-2xl bg-slate-950/55 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <AvatarBadge avatarId={player.avatarId} size="sm" />
                    <div>
                      <div className="text-sm uppercase tracking-[0.25em] text-slate-400">#{index + 1}</div>
                      <div className="font-semibold">{player.displayName}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-2xl">{player.score}</div>
                    <div className="text-sm text-slate-400">{player.correctAnswers} correct</div>
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      </div>
    </AppShell>
  );
}
