import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppShell } from "../../shared/components/AppShell";
import { AvatarBadge } from "../../shared/components/AvatarBadge";
import { GlassPanel } from "../../shared/components/GlassPanel";
import { SoundToggle } from "../../shared/components/SoundToggle";
import { TimerRing } from "../../shared/components/TimerRing";
import { useGameSounds } from "../../shared/hooks/useGameSounds";
import { useSoundPreference } from "../../shared/hooks/useSoundPreference";
import { socket } from "../../shared/socket/socketClient";
import type { AnswerDistribution, GameEndPayload, LeaderboardPayload, QuestionRevealPayload, QuestionShowPayload, RoomState } from "../../shared/types/game";

export function HostGamePage() {
  const navigate = useNavigate();
  const { roomPin = "" } = useParams();
  const [room, setRoom] = useState<RoomState | null>(null);
  const [question, setQuestion] = useState<QuestionShowPayload | null>(null);
  const [distribution, setDistribution] = useState<AnswerDistribution[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardPayload["leaderboard"]>([]);
  const [reveal, setReveal] = useState<QuestionRevealPayload | null>(null);
  const [lastResult, setLastResult] = useState<GameEndPayload | null>(null);
  const [error, setError] = useState("");
  const { enabled: soundEnabled, toggle: toggleSound } = useSoundPreference();

  useGameSounds({
    questionId: question?.question.id,
    roundEnded: Boolean(reveal),
    enabled: soundEnabled,
  });

  useEffect(() => {
    socket.emit("state:sync", { roomPin, role: "host" }, (state: RoomState) => {
      setRoom(state);
      if (state.status === "finished") {
        navigate(`/results/${roomPin}`);
      }
      if (state.status === "question_live" && state.currentQuestion?.id && state.timerEndsAt) {
        setQuestion({
          roomPin,
          questionIndex: state.currentQuestionIndex,
          totalQuestions: state.quiz.questionCount,
          timerEndsAt: state.timerEndsAt,
          question: {
            id: state.currentQuestion.id,
            prompt: state.currentQuestion.prompt ?? "",
            options: state.currentQuestion.options,
            timeLimitSeconds: state.currentQuestion.timeLimitSeconds ?? 15,
            points: state.currentQuestion.points ?? 0,
          },
        });
      }
    });

    const handleStateSync = (state: RoomState) => {
      if (state.roomPin === roomPin) {
        setRoom(state);
        if (state.status === "finished") {
          navigate(`/results/${roomPin}`);
        }
      }
    };

    const handleQuestionShow = (payload: QuestionShowPayload) => {
      if (payload.roomPin !== roomPin) {
        return;
      }
      setQuestion(payload);
      setDistribution([]);
      setReveal(null);
      setLeaderboard([]);
    };

    const handleStats = (payload: { distribution: AnswerDistribution[] }) => {
      setDistribution(payload.distribution);
    };

    const handleQuestionReveal = (payload: QuestionRevealPayload) => {
      setDistribution(payload.distribution);
      setReveal(payload);
    };

    const handleLeaderboard = (payload: LeaderboardPayload) => {
      setLeaderboard(payload.leaderboard);
    };

    const handleSocketError = (payload: { message: string }) => {
      setError(payload.message);
    };

    const handleGameEnd = (payload: GameEndPayload) => {
      setLastResult(payload);
      navigate(`/results/${payload.roomPin}`);
    };

    socket.on("state:sync", handleStateSync);
    socket.on("question:show", handleQuestionShow);
    socket.on("stats:update", handleStats);
    socket.on("question:reveal", handleQuestionReveal);
    socket.on("leaderboard:update", handleLeaderboard);
    socket.on("game:end", handleGameEnd);
    socket.on("error", handleSocketError);

    return () => {
      socket.off("state:sync", handleStateSync);
      socket.off("question:show", handleQuestionShow);
      socket.off("stats:update", handleStats);
      socket.off("question:reveal", handleQuestionReveal);
      socket.off("leaderboard:update", handleLeaderboard);
      socket.off("game:end", handleGameEnd);
      socket.off("error", handleSocketError);
    };
  }, [navigate, roomPin]);

  const answersReceived = useMemo(
    () => distribution.reduce((sum, item) => sum + item.count, 0),
    [distribution],
  );

  const chartRows = useMemo(() => {
    if (distribution.length > 0) {
      return distribution.map((option) => ({
        key: option.optionId,
        text: option.text,
        count: option.count,
      }));
    }

    return (question?.question.options ?? []).map((option) => ({
      key: option.id,
      text: option.text,
      count: 0,
    }));
  }, [distribution, question]);

  function advanceRound() {
    if (!room) {
      return;
    }

    setError("");
    if (room.status === "reveal") {
      socket.emit("game:showLeaderboard", roomPin);
      return;
    }

    if (room.currentQuestionIndex >= room.quiz.questionCount - 1) {
      if (lastResult) {
        navigate(`/results/${lastResult.roomPin}`);
      }
      return;
    }

    socket.emit("game:next", roomPin);
  }

  return (
    <AppShell themeId={room?.quiz.themeId}>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <GlassPanel themeId={room?.quiz.themeId}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-skyglow">Host Control</p>
              <h1 className="font-display text-4xl font-bold">{question?.question.prompt ?? "Waiting for question..."}</h1>
              <p className="text-slate-300">
                Question {(question?.questionIndex ?? 0) + 1} of {question?.totalQuestions ?? room?.quiz.questionCount ?? 0}
              </p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <SoundToggle enabled={soundEnabled} onToggle={toggleSound} />
              <TimerRing
                endsAt={room?.status === "question_live" ? (question?.timerEndsAt ?? null) : null}
                totalSeconds={question?.question.timeLimitSeconds ?? 15}
              />
            </div>
          </div>

          <div className="mt-8 grid gap-4">
            {chartRows.map((option) => {
              const count = option.count;
              const total = answersReceived || 1;
              const percentage = Math.round((count / total) * 100);

              return (
                <div key={option.key} className="rounded-3xl border border-white/10 bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="font-semibold">{option.text}</div>
                    <div className="text-sm text-slate-300">{count} answers</div>
                  </div>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-skyglow to-electric transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {room?.status === "reveal" || room?.status === "leaderboard" ? (
            <>
              <button
                type="button"
                onClick={advanceRound}
                className="mt-8 rounded-2xl bg-electric px-6 py-4 font-bold text-slate-950 transition hover:scale-[1.01]"
              >
                {room?.status === "reveal"
                  ? room.currentQuestionIndex >= room.quiz.questionCount - 1
                    ? "View Final Podium"
                    : "Show Leaderboard"
                  : room && room.currentQuestionIndex >= room.quiz.questionCount - 1
                    ? "View Final Results"
                    : "Next Question"}
              </button>
              {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
            </>
          ) : null}
        </GlassPanel>

        <GlassPanel themeId={room?.quiz.themeId}>
          <h2 className="font-display text-2xl font-bold">
            {room?.status === "reveal" ? "Reveal" : "Leaderboard"}
          </h2>
          <div className="mt-5 space-y-3">
            {(leaderboard.length ? leaderboard : room?.players ?? []).map((entry, index) => (
              <div key={"playerId" in entry ? entry.playerId : entry.id} className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                <div className="flex items-center gap-3">
                  <AvatarBadge avatarId={"avatarId" in entry && entry.avatarId ? entry.avatarId : "spark"} size="sm" />
                  <div>
                    <div className="text-sm uppercase tracking-[0.2em] text-slate-400">#{"rank" in entry ? entry.rank : index + 1}</div>
                    <div className="font-semibold">{entry.displayName}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-2xl">{entry.score}</div>
                  <div className="text-sm text-slate-400">{entry.correctAnswers} correct</div>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>
    </AppShell>
  );
}
