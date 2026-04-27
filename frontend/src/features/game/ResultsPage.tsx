import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppShell } from "../../shared/components/AppShell";
import { AvatarBadge } from "../../shared/components/AvatarBadge";
import { GlassPanel } from "../../shared/components/GlassPanel";
import { StatCard } from "../../shared/components/StatCard";
import { socket } from "../../shared/socket/socketClient";
import type { RoomState } from "../../shared/types/game";
import { getHostRoom, getPlayerSession } from "../../shared/utils/storage";

export function ResultsPage() {
  const navigate = useNavigate();
  const { roomPin = "" } = useParams();
  const [room, setRoom] = useState<RoomState | null>(null);
  const hostRoom = getHostRoom();
  const isHostView = hostRoom === roomPin;

  useEffect(() => {
    const playerSession = getPlayerSession();
    const role = isHostView ? "host" : "player";
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
  }, [isHostView, roomPin]);

  const podium = useMemo(() => room?.players.slice(0, 3) ?? [], [room]);
  const podiumSlots = useMemo(() => {
    if (!podium.length) {
      return [];
    }

    return [podium[1], podium[0], podium[2]].filter(Boolean);
  }, [podium]);

  return (
    <AppShell themeId={room?.quiz.themeId}>
      <div className="ui-page space-y-6">
        <GlassPanel themeId={room?.quiz.themeId}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="ui-chip bg-yellow-300 text-slate-950">
                Final Podium
              </div>
              <h1 className="mt-4 font-display text-4xl font-bold text-white sm:text-6xl">
                {room ? `${room.quiz.title} is complete.` : "Loading final scores..."}
              </h1>
              <p className="mt-3 max-w-2xl text-base text-slate-200 sm:text-lg">
                The server locked every score. Here is the final BrainBuzz podium and full ranking.
              </p>
            </div>

            {isHostView ? (
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate(`/host/create?quizId=${room?.quiz.id ?? ""}`)}
                  className="ui-button-primary"
                >
                  Restart Quiz
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/host/lobby/${roomPin}`)}
                  className="ui-button-secondary"
                >
                  Return to Lobby
                </button>
                <Link
                  to="/host/library"
                  className="ui-button-secondary"
                >
                  Create Another Game
                </Link>
              </div>
            ) : null}
          </div>
        </GlassPanel>

        <GlassPanel themeId={room?.quiz.themeId}>
          <div className="grid gap-4 md:grid-cols-3 md:items-end">
            {podiumSlots.map((player, index) => {
              const actualRank = player?.id === podium[0]?.id ? 1 : player?.id === podium[1]?.id ? 2 : 3;
              const isWinner = actualRank === 1;

              return (
                <div
                  key={player?.id}
                  className={`rounded-[2.25rem] border px-6 py-8 text-center ${
                    isWinner
                      ? "border-yellow-300/40 bg-yellow-300/15 md:-translate-y-6"
                      : actualRank === 2
                        ? "border-cyan-300/30 bg-cyan-300/10"
                        : "border-fuchsia-300/30 bg-fuchsia-500/10"
                  }`}
                >
                  <div className="text-sm font-bold uppercase tracking-[0.32em] text-slate-200">#{actualRank}</div>
                  <div className="mt-5 flex justify-center">
                    <AvatarBadge avatarId={player?.avatarId ?? "spark"} size="lg" />
                  </div>
                  <div className="mt-5 break-words font-display text-2xl font-bold text-white sm:text-3xl">{player?.displayName}</div>
                  <div className="mt-3 font-display text-4xl font-bold text-white sm:text-5xl">{player?.score ?? 0}</div>
                  <div className="mt-2 text-sm text-slate-200">{player?.correctAnswers ?? 0} correct answers</div>
                  <div className={`mx-auto mt-6 h-5 rounded-full ${isWinner ? "w-28 bg-yellow-300" : actualRank === 2 ? "w-24 bg-cyan-300" : "w-20 bg-fuchsia-300"}`} />
                </div>
              );
            })}
          </div>
        </GlassPanel>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <GlassPanel themeId={room?.quiz.themeId}>
            <h2 className="font-display text-3xl font-bold text-white">Top Finish</h2>
            <div className="mt-5 space-y-4">
              <div className="rounded-[1.75rem] border border-yellow-300/30 bg-yellow-300/10 p-5">
                <div className="text-xs font-bold uppercase tracking-[0.3em] text-yellow-200">Champion</div>
                <div className="mt-3 text-3xl font-bold text-white">{podium[0]?.displayName ?? "..."}</div>
                <div className="mt-2 text-lg text-slate-200">{podium[0]?.score ?? 0} points</div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <StatCard label="Players" value={room?.players.length ?? 0} />
                <StatCard label="Questions" value={room?.quiz.questionCount ?? 0} />
              </div>
            </div>
          </GlassPanel>

          <GlassPanel themeId={room?.quiz.themeId}>
            <h2 className="font-display text-3xl font-bold text-white">Final Leaderboard</h2>
            <div className="mt-5 space-y-3">
              {room?.players.map((player, index) => (
                <div key={player.id} className="flex flex-col gap-3 rounded-2xl bg-slate-950/65 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <AvatarBadge avatarId={player.avatarId} size="sm" />
                    <div>
                      <div className="text-sm uppercase tracking-[0.25em] text-slate-400">#{index + 1}</div>
                      <div className="font-semibold text-white">{player.displayName}</div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="font-display text-2xl text-white">{player.score}</div>
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
