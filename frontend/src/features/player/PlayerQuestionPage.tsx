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
import type { GameEndPayload, LeaderboardPayload, PlayerRevealPayload, QuestionRevealPayload, QuestionShowPayload, RoomState } from "../../shared/types/game";
import { getPlayerSession } from "../../shared/utils/storage";

const waitingQuotes = [
  "Final answer energy activated.",
  "Bold choice. Future you is judging quietly.",
  "Confidence level: suspiciously high.",
  "The quiz gods are reviewing your bravery.",
  "That answer is marinating nicely.",
  "Tiny drumroll. Massive consequences.",
];

export function PlayerQuestionPage() {
  const navigate = useNavigate();
  const { roomPin = "" } = useParams();
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
  const session = getPlayerSession();
  const { enabled: soundEnabled, toggle: toggleSound } = useSoundPreference();

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
      setThemeId(state.quiz.themeId);
      if (state.status === "finished") {
        navigate(`/results/${roomPin}`);
        return;
      }

      if ((state.status === "reveal" || state.status === "leaderboard") && state.currentQuestion?.id) {
        setQuestion({
          roomPin,
          questionIndex: state.currentQuestionIndex,
          totalQuestions: state.quiz.questionCount,
          timerEndsAt: state.timerEndsAt ?? Date.now(),
          question: {
            id: state.currentQuestion.id,
            prompt: state.currentQuestion.prompt ?? "",
            options: state.currentQuestion.options,
            timeLimitSeconds: state.currentQuestion.timeLimitSeconds ?? 0,
            points: state.currentQuestion.points ?? 0,
          },
        });
        setPlayerReveal(state.viewerState?.latestQuestionResult ?? null);
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
        setLockedIn(state.viewerState?.roundState === "answer_locked" || state.status === "reveal");
        setPendingOptionId(null);
        return;
      }

      if (state.status !== "question_live" || !state.currentQuestion?.id || !state.timerEndsAt) {
        return;
      }

      setQuestion({
        roomPin,
        questionIndex: state.currentQuestionIndex,
        totalQuestions: state.quiz.questionCount,
        timerEndsAt: state.timerEndsAt,
        question: {
          id: state.currentQuestion.id,
          prompt: state.currentQuestion.prompt ?? "",
          options: state.currentQuestion.options,
          timeLimitSeconds: state.currentQuestion.timeLimitSeconds ?? 0,
          points: state.currentQuestion.points ?? 0,
        },
      });
      setLockedIn(state.viewerState?.roundState === "answer_locked");
      setSelectedOptionId(state.viewerState?.selectedOptionId ?? null);
      setReveal(null);
      setPlayerReveal(null);
      setLeaderboard([]);
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
    };

    const handlePlayerReveal = (payload: PlayerRevealPayload) => {
      setPlayerReveal(payload);
      setLockedIn(false);
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

  function submitAnswer(optionId: string) {
    if (!question || lockedIn || pendingOptionId) {
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

  return (
    <AppShell themeId={themeId}>
      <div className="mx-auto grid w-full max-w-4xl gap-6">
        <GlassPanel themeId={themeId}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-berry">Question Live</p>
              <h1 className="mt-3 font-display text-4xl font-bold">{question?.question.prompt ?? "Waiting for the host..."}</h1>
              <p className="mt-3 text-slate-300">
                {lockedIn
                  ? "Answer locked in. Hold tight for the reveal."
                  : pendingOptionId
                    ? "Sending your answer..."
                    : "Choose quickly. Faster correct answers score higher."}
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
                    className={`rounded-3xl border px-5 py-6 text-left transition ${
                      isSelected ? "border-berry bg-berry/20" : "border-white/10 bg-slate-950/60 hover:border-skyglow/60"
                    }`}
                  >
                    <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Option {index + 1}</div>
                    <div className="mt-3 text-lg font-semibold">{option.text}</div>
                  </button>
                );
              })}
            </div>
          ) : null}

          {lockedIn && !reveal ? (
            <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <div className="text-sm uppercase tracking-[0.3em] text-electric">Answer Locked</div>
              <h2 className="mt-3 font-display text-3xl font-bold">Waiting for the rest of the room...</h2>
              <p className="mt-3 text-slate-300">{waitingQuote}</p>
              <div className="mt-6 rounded-2xl border border-berry/30 bg-berry/10 p-4">
                <div className="text-sm text-slate-300">Your timer is stopped. We’ll reveal the standings when the question closes.</div>
              </div>
            </div>
          ) : null}

          {reveal ? (
            <div className="mt-8 space-y-6">
              <div className="rounded-[2rem] border border-electric/25 bg-electric/10 p-6">
                <div className="text-sm uppercase tracking-[0.3em] text-electric">Round Complete</div>
                <h2 className="mt-3 font-display text-3xl font-bold">Leaderboard update</h2>
                <p className="mt-3 text-slate-300">
                  Correct answer:{" "}
                  <span className="font-semibold text-white">
                    {playerReveal?.correctOptionText ?? reveal.question.correctOptionText}
                  </span>
                </p>
              </div>

              <div className="grid gap-3">
                {leaderboard.map((entry) => (
                  <div key={entry.playerId} className="flex items-center justify-between rounded-2xl bg-slate-950/60 px-4 py-4">
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
          ) : null}
        </GlassPanel>
      </div>
    </AppShell>
  );
}
