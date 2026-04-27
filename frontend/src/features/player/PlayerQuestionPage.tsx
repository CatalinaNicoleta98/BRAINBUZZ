import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppShell } from "../../shared/components/AppShell";
import { AvatarBadge } from "../../shared/components/AvatarBadge";
import { GlassPanel } from "../../shared/components/GlassPanel";
import { SoundToggle } from "../../shared/components/SoundToggle";
import { TimerRing } from "../../shared/components/TimerRing";
import { useGameSounds } from "../../shared/hooks/useGameSounds";
import { useSoundPreference } from "../../shared/hooks/useSoundPreference";
import { socket } from "../../shared/socket/socketClient";
import type {
  GameEndPayload,
  LeaderboardPayload,
  PlayerRevealPayload,
  QuestionRevealPayload,
  QuestionShowPayload,
  RoomState,
} from "../../shared/types/game";
import { getPlayerSession } from "../../shared/utils/storage";

const waitingQuotes = [
  "Answer locked in.",
  "Waiting for the reveal.",
  "Did you make the right move?",
  "The host is getting the results ready.",
  "Big quiz energy. Tiny bit of suspense.",
  "The leaderboard is warming up backstage.",
];

export function PlayerQuestionPage() {
  const navigate = useNavigate();
  const { roomPin = "" } = useParams();
  const session = getPlayerSession();
  const { enabled: soundEnabled, toggle: toggleSound } = useSoundPreference();
  const [question, setQuestion] = useState<QuestionShowPayload | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [lockedIn, setLockedIn] = useState(false);
  const [reveal, setReveal] = useState<QuestionRevealPayload | null>(null);
  const [playerReveal, setPlayerReveal] = useState<PlayerRevealPayload | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardPayload["leaderboard"]>([]);
  const [pendingOptionId, setPendingOptionId] = useState<string | null>(null);
  const [waitingQuote, setWaitingQuote] = useState(waitingQuotes[0]);
  const [error, setError] = useState("");
  const [themeId, setThemeId] = useState<string | undefined>();

  useGameSounds({
    questionId: question?.question.id,
    lockedIn,
    roundEnded: Boolean(reveal),
    enabled: soundEnabled,
  });

  useEffect(() => {
    if (!session || session.roomPin !== roomPin) {
      navigate("/player/join");
      return;
    }

    socket.emit("state:sync", { roomPin, role: "player", participantId: session.playerId }, (state: RoomState) => {
      hydrateFromState(state);
    });

    const handleQuestionShow = (payload: QuestionShowPayload) => {
      if (payload.roomPin !== roomPin) {
        return;
      }

      setQuestion(payload);
      setSelectedOptionId(null);
      setLockedIn(false);
      setReveal(null);
      setPlayerReveal(null);
      setLeaderboard([]);
      setPendingOptionId(null);
      setError("");
      setWaitingQuote(waitingQuotes[Math.floor(Math.random() * waitingQuotes.length)] ?? waitingQuotes[0]);
    };

    const handleAnswerReceived = (payload: { optionId: string }) => {
      setSelectedOptionId(payload.optionId);
      setLockedIn(true);
      setPendingOptionId(null);
      setWaitingQuote(waitingQuotes[Math.floor(Math.random() * waitingQuotes.length)] ?? waitingQuotes[0]);
    };

    const handleQuestionReveal = (payload: QuestionRevealPayload) => {
      setReveal(payload);
      setPendingOptionId(null);
      setLockedIn(false);
    };

    const handlePlayerReveal = (payload: PlayerRevealPayload) => {
      setPlayerReveal(payload);
    };

    const handleLeaderboard = (payload: LeaderboardPayload) => {
      setLeaderboard(payload.leaderboard);
    };

    const handleGameEnd = (payload: GameEndPayload) => {
      navigate(`/results/${payload.roomPin}`);
    };

    const handleSocketError = (payload: { message: string }) => {
      setError(payload.message);
      setPendingOptionId(null);
    };

    socket.on("question:show", handleQuestionShow);
    socket.on("answer:received", handleAnswerReceived);
    socket.on("question:reveal", handleQuestionReveal);
    socket.on("player:reveal", handlePlayerReveal);
    socket.on("leaderboard:update", handleLeaderboard);
    socket.on("game:end", handleGameEnd);
    socket.on("error", handleSocketError);

    return () => {
      socket.off("question:show", handleQuestionShow);
      socket.off("answer:received", handleAnswerReceived);
      socket.off("question:reveal", handleQuestionReveal);
      socket.off("player:reveal", handlePlayerReveal);
      socket.off("leaderboard:update", handleLeaderboard);
      socket.off("game:end", handleGameEnd);
      socket.off("error", handleSocketError);
    };
  }, [navigate, roomPin, session]);

  function hydrateFromState(state: RoomState) {
    setThemeId(state.quiz.themeId);

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
      setSelectedOptionId(state.viewerState?.selectedOptionId ?? null);
      setLockedIn(state.viewerState?.roundState === "answer_locked");
      setReveal(null);
      setPlayerReveal(null);
      setLeaderboard([]);
      return;
    }

    if (state.status === "reveal" || state.status === "leaderboard") {
      setLockedIn(false);
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
        distribution: [],
        nextStage: state.status === "leaderboard" ? "leaderboard" : "finished",
      });
      setPlayerReveal(state.viewerState?.latestQuestionResult ?? null);
      setLeaderboard(
        state.status === "leaderboard"
          ? state.players.map((player, index) => ({
              rank: index + 1,
              playerId: player.id,
              displayName: player.displayName,
              avatarId: player.avatarId,
              score: player.score,
              correctAnswers: player.correctAnswers,
              connected: player.connected,
            }))
          : [],
      );
    }
  }

  function submitAnswer(optionId: string) {
    if (!question || lockedIn || pendingOptionId || reveal) {
      return;
    }

    setError("");
    setPendingOptionId(optionId);
    socket.emit("answer:submit", {
      roomPin,
      questionId: question.question.id,
      optionId,
    });
  }

  const selectedAnswerText =
    playerReveal?.selectedOptionText ??
    question?.question.options.find((option) => option.id === selectedOptionId)?.text;
  const showLeaderboard = leaderboard.length > 0;
  const revealToneClass = playerReveal?.isCorrect
    ? "border-emerald-300/40 bg-emerald-400/15"
    : "border-rose-300/35 bg-rose-500/15";
  const revealTitle = playerReveal
    ? playerReveal.selectedOptionId
      ? playerReveal.isCorrect
        ? "Correct answer"
        : "Wrong answer"
      : "No answer submitted"
    : "Reveal incoming";

  return (
    <AppShell themeId={themeId}>
      <div className="mx-auto grid w-full max-w-5xl gap-6">
        <GlassPanel themeId={themeId}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-berry">
                {showLeaderboard ? "Leaderboard" : reveal ? "Answer Reveal" : lockedIn ? "Answer Submitted" : "Question Live"}
              </p>
              <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">{question?.question.prompt ?? "Waiting for the host..."}</h1>
              <p className="mt-3 text-slate-300">
                {showLeaderboard
                  ? "Standings are updated. Get ready for the next question."
                  : reveal
                    ? "Your result is locked in. The host controls when the leaderboard appears."
                    : lockedIn
                      ? "Your answer is hidden and secure until the reveal."
                      : pendingOptionId
                        ? "Sending your answer..."
                        : "Pick one answer before the timer runs out."}
              </p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <SoundToggle enabled={soundEnabled} onToggle={toggleSound} />
              <TimerRing
                endsAt={lockedIn || reveal ? null : (question?.timerEndsAt ?? null)}
                totalSeconds={question?.question.timeLimitSeconds ?? 15}
              />
            </div>
          </div>

          {session ? (
            <div className="mt-6 flex items-center gap-3 rounded-3xl border border-white/10 bg-white/5 p-4">
              <AvatarBadge avatarId={session.avatarId} />
              <div>
                <div className="text-sm uppercase tracking-[0.25em] text-slate-400">Playing as</div>
                <div className="font-semibold text-white">{session.displayName}</div>
              </div>
            </div>
          ) : null}

          {error ? <div className="mt-5 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div> : null}

          {!lockedIn && !reveal ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {question?.question.options.map((option, index) => {
                const isSelected = pendingOptionId === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => submitAnswer(option.id)}
                    disabled={!!pendingOptionId}
                    className={`rounded-[2rem] border px-6 py-8 text-left transition ${
                      isSelected
                        ? "border-fuchsia-300 bg-fuchsia-500/20"
                        : "border-white/10 bg-slate-950/70 hover:-translate-y-1 hover:border-cyan-300/60"
                    }`}
                  >
                    <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Option {index + 1}</div>
                    <div className="mt-4 text-2xl font-semibold">{option.text}</div>
                  </button>
                );
              })}
            </div>
          ) : null}

          {lockedIn && !reveal ? (
            <div className="mt-10 flex flex-col items-center justify-center rounded-[2.25rem] border border-white/10 bg-white/5 px-6 py-10 text-center">
              {session ? <AvatarBadge avatarId={session.avatarId} size="lg" /> : null}
              <div className="mt-5 text-sm font-bold uppercase tracking-[0.32em] text-yellow-200">Answer locked in</div>
              <h2 className="mt-4 font-display text-4xl font-bold text-white">Waiting for the reveal</h2>
              <p className="mt-4 max-w-xl text-lg text-slate-200">{waitingQuote}</p>
              <div className="mt-6 rounded-2xl border border-fuchsia-300/25 bg-fuchsia-500/10 px-5 py-4 text-sm text-slate-200">
                {selectedAnswerText ? `You submitted: ${selectedAnswerText}` : "Your answer is safe and hidden until the reveal."}
              </div>
              <div className="mt-4 text-sm text-slate-400">The host is getting the results ready.</div>
            </div>
          ) : null}

          {reveal ? (
            <div className="mt-8 space-y-6">
              <div className={`rounded-[2.25rem] border px-6 py-8 ${revealToneClass}`}>
                <div className="text-sm uppercase tracking-[0.3em] text-white/80">Round reveal</div>
                <h2 className="mt-4 font-display text-4xl font-bold">{revealTitle}</h2>
                <p className="mt-3 text-lg text-slate-100">
                  {playerReveal?.isCorrect
                    ? `You nailed it with ${playerReveal.selectedOptionText ?? "the correct answer"}.`
                    : playerReveal?.selectedOptionText
                      ? `You picked ${playerReveal.selectedOptionText}.`
                      : "You did not lock in an answer before time ran out."}
                </p>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="text-xs uppercase tracking-[0.26em] text-slate-300">Result</div>
                    <div className="mt-3 text-2xl font-bold text-white">
                      {playerReveal?.isCorrect ? "Correct" : playerReveal?.selectedOptionId ? "Wrong" : "No Answer"}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="text-xs uppercase tracking-[0.26em] text-slate-300">Points gained</div>
                    <div className="mt-3 text-2xl font-bold text-white">+{playerReveal?.scoreAwarded ?? 0}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="text-xs uppercase tracking-[0.26em] text-slate-300">Total score</div>
                    <div className="mt-3 text-2xl font-bold text-white">{playerReveal?.totalScore ?? 0}</div>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
                  <div className="text-xs uppercase tracking-[0.26em] text-slate-300">Correct answer</div>
                  <div className="mt-3 text-2xl font-semibold text-white">{playerReveal?.correctOptionText ?? reveal.question.correctOptionText}</div>
                  {!playerReveal?.isCorrect && playerReveal?.selectedOptionText ? (
                    <div className="mt-2 text-sm text-slate-200">Your answer: {playerReveal.selectedOptionText}</div>
                  ) : null}
                </div>
              </div>

              {showLeaderboard ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-200">Leaderboard</div>
                    <h3 className="mt-2 font-display text-3xl font-bold text-white">Current standings</h3>
                  </div>
                  <div className="grid gap-3">
                    {leaderboard.map((entry) => (
                      <div key={entry.playerId} className="flex items-center justify-between rounded-2xl bg-slate-950/70 px-4 py-4">
                        <div className="flex items-center gap-3">
                          <AvatarBadge avatarId={entry.avatarId ?? "spark"} size="sm" />
                          <div>
                            <div className="text-sm uppercase tracking-[0.25em] text-slate-400">#{entry.rank}</div>
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
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-center text-sm text-slate-200">
                  The host will show the leaderboard next.
                </div>
              )}
            </div>
          ) : null}
        </GlassPanel>
      </div>
    </AppShell>
  );
}
