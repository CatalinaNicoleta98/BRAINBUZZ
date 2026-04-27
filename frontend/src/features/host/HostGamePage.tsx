import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppShell } from "../../shared/components/AppShell";
import { AvatarBadge } from "../../shared/components/AvatarBadge";
import { GlassPanel } from "../../shared/components/GlassPanel";
import { StatCard } from "../../shared/components/StatCard";
import { SoundToggle } from "../../shared/components/SoundToggle";
import { TimerRing } from "../../shared/components/TimerRing";
import { useGameSounds } from "../../shared/hooks/useGameSounds";
import { useSoundPreference } from "../../shared/hooks/useSoundPreference";
import { socket } from "../../shared/socket/socketClient";
import type {
  AnswerDistribution,
  GameEndPayload,
  LeaderboardPayload,
  QuestionRevealPayload,
  QuestionShowPayload,
  RoomState,
} from "../../shared/types/game";

export function HostGamePage() {
  const navigate = useNavigate();
  const { roomPin = "" } = useParams();
  const { enabled: soundEnabled, toggle: toggleSound } = useSoundPreference();
  const [room, setRoom] = useState<RoomState | null>(null);
  const [question, setQuestion] = useState<QuestionShowPayload | null>(null);
  const [distribution, setDistribution] = useState<AnswerDistribution[]>([]);
  const [reveal, setReveal] = useState<QuestionRevealPayload | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardPayload["leaderboard"]>([]);
  const [lastResult, setLastResult] = useState<GameEndPayload | null>(null);
  const [error, setError] = useState("");

  useGameSounds({
    questionId: question?.question.id,
    roundEnded: Boolean(reveal),
    enabled: soundEnabled,
  });

  useEffect(() => {
    socket.emit("state:sync", { roomPin, role: "host" }, (state: RoomState) => {
      hydrateFromState(state);
    });

    const handleStateSync = (state: RoomState) => {
      if (state.roomPin === roomPin) {
        hydrateFromState(state);
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
      setError("");
    };

    const handleStats = (payload: { distribution: AnswerDistribution[] }) => {
      setDistribution(payload.distribution);
    };

    const handleQuestionReveal = (payload: QuestionRevealPayload) => {
      setDistribution(payload.distribution);
      setReveal(payload);
      setLeaderboard([]);
    };

    const handleLeaderboard = (payload: LeaderboardPayload) => {
      setLeaderboard(payload.leaderboard);
    };

    const handleGameEnd = (payload: GameEndPayload) => {
      setLastResult(payload);
      navigate(`/results/${payload.roomPin}`);
    };

    const handleSocketError = (payload: { message: string }) => {
      setError(payload.message);
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

  function hydrateFromState(state: RoomState) {
    setRoom(state);
    if (state.status === "finished") {
      navigate(`/results/${roomPin}`);
      return;
    }

    if (!state.currentQuestion?.id) {
      return;
    }

    const currentQuestion = state.currentQuestion;

    setQuestion({
      roomPin,
      questionIndex: state.currentQuestionIndex,
      totalQuestions: state.quiz.questionCount,
      timerEndsAt: state.timerEndsAt ?? Date.now(),
      question: {
        id: currentQuestion.id ?? "",
        prompt: currentQuestion.prompt ?? "",
        options: currentQuestion.options,
        timeLimitSeconds: currentQuestion.timeLimitSeconds ?? 0,
        points: currentQuestion.points ?? 0,
      },
    });

    if (state.status === "question_live") {
      setReveal(null);
      setLeaderboard([]);
      return;
    }

    if (state.status === "reveal") {
      setReveal({
        roomPin,
        questionIndex: state.currentQuestionIndex,
        totalQuestions: state.quiz.questionCount,
        question: {
          id: currentQuestion.id ?? "",
          prompt: currentQuestion.prompt ?? "",
          correctOptionId: currentQuestion.correctOptionId ?? "",
          correctOptionText:
            currentQuestion.options.find((option) => option.id === currentQuestion.correctOptionId)?.text ?? "",
        },
        distribution,
        nextStage: "leaderboard",
      });
      setLeaderboard([]);
      return;
    }

    if (state.status === "leaderboard") {
      setReveal((currentReveal) =>
        currentReveal ??
        (currentQuestion.id
          ? {
              roomPin,
              questionIndex: state.currentQuestionIndex,
              totalQuestions: state.quiz.questionCount,
              question: {
                id: currentQuestion.id ?? "",
                prompt: currentQuestion.prompt ?? "",
                correctOptionId: currentQuestion.correctOptionId ?? "",
                correctOptionText:
                  currentQuestion.options.find((option) => option.id === currentQuestion.correctOptionId)?.text ?? "",
              },
              distribution,
              nextStage: "leaderboard",
            }
          : null),
      );
      setLeaderboard(
        state.players.map((player, index) => ({
          rank: index + 1,
          playerId: player.id,
          displayName: player.displayName,
          avatarId: player.avatarId,
          score: player.score,
          correctAnswers: player.correctAnswers,
          connected: player.connected,
        })),
      );
    }
  }

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

  const answersReceived = useMemo(() => distribution.reduce((sum, item) => sum + item.count, 0), [distribution]);
  const totalPlayers = room?.players.length ?? 0;
  const liveOptions = distribution.length > 0 ? distribution : question?.question.options.map((option) => ({
    optionId: option.id,
    text: option.text,
    count: 0,
    isCorrect: false,
  })) ?? [];

  return (
    <AppShell themeId={room?.quiz.themeId}>
      <div className="ui-page grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <GlassPanel themeId={room?.quiz.themeId}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-skyglow">
                {room?.status === "leaderboard" ? "Leaderboard Live" : room?.status === "reveal" ? "Answer Reveal" : "Question Live"}
              </p>
              <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">{question?.question.prompt ?? "Waiting for question..."}</h1>
              <p className="mt-3 text-slate-300">
                Question {(question?.questionIndex ?? 0) + 1} of {question?.totalQuestions ?? room?.quiz.questionCount ?? 0}
              </p>
            </div>
            <div className="flex flex-row items-center justify-between gap-3 lg:flex-col lg:items-end">
              <SoundToggle enabled={soundEnabled} onToggle={toggleSound} />
              <TimerRing
                endsAt={room?.status === "question_live" ? (question?.timerEndsAt ?? null) : null}
                totalSeconds={question?.question.timeLimitSeconds ?? 15}
              />
            </div>
          </div>

          {room?.status === "question_live" ? (
            <>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <StatCard label="Answers in" value={answersReceived} />
                <StatCard label="Players" value={totalPlayers} />
                <StatCard label="Status">
                  <div className="text-xl font-bold text-white">Collecting answers</div>
                </StatCard>
              </div>

              <div className="mt-8 grid gap-4">
                {liveOptions.map((option, index) => {
                  const total = answersReceived || 1;
                  const percentage = Math.round((option.count / total) * 100);

                  return (
                    <div key={option.optionId} className="rounded-[1.75rem] border border-white/10 bg-slate-950/65 p-4 sm:p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="text-xs uppercase tracking-[0.25em] text-slate-400">Option {index + 1}</div>
                          <div className="mt-2 text-xl font-semibold text-white sm:text-2xl">{option.text}</div>
                        </div>
                        <div className="text-left sm:text-right">
                          <div className="font-display text-3xl text-white">{option.count}</div>
                          <div className="text-sm text-slate-300">answers</div>
                        </div>
                      </div>
                      <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-yellow-300 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}

          {room?.status === "reveal" && reveal ? (
            <div className="mt-8 space-y-6">
              <div className="rounded-[2rem] border border-yellow-300/30 bg-yellow-300/12 p-6">
                <div className="text-sm uppercase tracking-[0.3em] text-yellow-200">Reveal ready</div>
                <h2 className="mt-3 font-display text-4xl font-bold text-white">{reveal.question.correctOptionText}</h2>
                <p className="mt-3 text-slate-200">This is the correct answer. Review the room distribution, then show the updated leaderboard.</p>
              </div>

              <div className="grid gap-4">
                {distribution.map((option, index) => {
                  const total = answersReceived || 1;
                  const percentage = Math.round((option.count / total) * 100);

                  return (
                    <div
                      key={option.optionId}
                      className={`rounded-[1.75rem] border p-4 sm:p-5 ${option.isCorrect ? "border-emerald-300/40 bg-emerald-400/15" : "border-white/10 bg-slate-950/65"}`}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="text-xs uppercase tracking-[0.25em] text-slate-300">Option {index + 1}</div>
                          <div className="mt-2 text-xl font-semibold text-white sm:text-2xl">{option.text}</div>
                        </div>
                        <div className="text-left sm:text-right">
                          <div className="font-display text-3xl text-white">{option.count}</div>
                          <div className="text-sm text-slate-300">answers</div>
                        </div>
                      </div>
                      <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                        <div
                          className={`h-full rounded-full transition-all ${option.isCorrect ? "bg-emerald-300" : "bg-gradient-to-r from-cyan-300 to-fuchsia-400"}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {room?.status === "leaderboard" ? (
            <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <div className="text-sm uppercase tracking-[0.3em] text-yellow-200">Leaderboard ready</div>
              <h2 className="mt-3 font-display text-4xl font-bold text-white">Room rankings updated</h2>
              <p className="mt-3 text-slate-200">
                {room.currentQuestionIndex >= room.quiz.questionCount - 1
                  ? "The final question is complete. Open the podium when you are ready."
                  : "Take a beat, then move everyone into the next question."}
              </p>
            </div>
          ) : null}

          {room?.status === "reveal" || room?.status === "leaderboard" ? (
            <div className="mt-8">
              <button
                type="button"
                onClick={advanceRound}
                className="ui-button-primary w-full rounded-[1.75rem] px-6 py-5 text-base sm:text-lg"
              >
                {room?.status === "reveal"
                  ? room.currentQuestionIndex >= room.quiz.questionCount - 1
                    ? "View Final Podium"
                    : "Show Leaderboard"
                  : room.currentQuestionIndex >= room.quiz.questionCount - 1
                    ? "View Final Results"
                    : "Next Question"}
              </button>
              {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
            </div>
          ) : null}
        </GlassPanel>

        <GlassPanel themeId={room?.quiz.themeId}>
          <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
            {room?.status === "leaderboard" ? "Updated Rankings" : "Players"}
          </h2>
          <div className="mt-5 space-y-3">
            {(leaderboard.length ? leaderboard : room?.players ?? []).map((entry, index) => (
              <div key={"playerId" in entry ? entry.playerId : entry.id} className="flex flex-col gap-3 rounded-2xl bg-slate-950/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <AvatarBadge avatarId={"avatarId" in entry && entry.avatarId ? entry.avatarId : "spark"} size="sm" />
                  <div>
                    <div className="text-sm uppercase tracking-[0.2em] text-slate-400">#{"rank" in entry ? entry.rank : index + 1}</div>
                    <div className="font-semibold text-white">{entry.displayName}</div>
                    {"connected" in entry ? (
                      <div className="text-sm text-slate-400">{entry.connected ? "Connected" : "Reconnecting"}</div>
                    ) : null}
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="font-display text-2xl text-white">{entry.score}</div>
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
