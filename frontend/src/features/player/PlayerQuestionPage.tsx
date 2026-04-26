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
import type { GameEndPayload, QuestionShowPayload, RoomState, RoundEndPayload } from "../../shared/types/game";
import { getPlayerSession } from "../../shared/utils/storage";

export function PlayerQuestionPage() {
  const navigate = useNavigate();
  const { roomPin = "" } = useParams();
  const [question, setQuestion] = useState<QuestionShowPayload | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [lockedIn, setLockedIn] = useState(false);
  const [roundEnd, setRoundEnd] = useState<RoundEndPayload | null>(null);
  const [pendingOptionId, setPendingOptionId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [themeId, setThemeId] = useState<string | undefined>();
  const session = getPlayerSession();
  const { enabled: soundEnabled, toggle: toggleSound } = useSoundPreference();

  useGameSounds({
    questionId: question?.question.id,
    lockedIn,
    roundEnded: Boolean(roundEnd),
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

      if (state.status !== "question" || !state.currentQuestion?.id || !state.timerEndsAt) {
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
    });

    const handleQuestionShow = (payload: QuestionShowPayload) => {
      if (payload.roomPin !== roomPin) {
        return;
      }
      setQuestion(payload);
      setSelectedOptionId(null);
      setLockedIn(false);
      setRoundEnd(null);
      setPendingOptionId(null);
      setError("");
    };

    const handleAnswerReceived = (payload: { optionId: string }) => {
      setSelectedOptionId(payload.optionId);
      setLockedIn(true);
      setPendingOptionId(null);
    };

    const handleQuestionEnd = (payload: RoundEndPayload) => {
      setRoundEnd(payload);
      setPendingOptionId(null);
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
    socket.on("question:end", handleQuestionEnd);
    socket.on("game:end", handleGameEnd);
    socket.on("error", handleSocketError);

    return () => {
      socket.off("question:show", handleQuestionShow);
      socket.off("answer:received", handleAnswerReceived);
      socket.off("question:end", handleQuestionEnd);
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
              <TimerRing endsAt={question?.timerEndsAt ?? null} totalSeconds={question?.question.timeLimitSeconds ?? 15} />
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

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {question?.question.options.map((option, index) => {
              const isSelected = selectedOptionId === option.id || pendingOptionId === option.id;
              const isCorrectReveal = roundEnd?.question.correctOptionId === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => submitAnswer(option.id)}
                  disabled={lockedIn || !!roundEnd || !!pendingOptionId}
                  className={`rounded-3xl border px-5 py-6 text-left transition ${
                    isCorrectReveal
                      ? "border-electric bg-electric/20"
                      : isSelected
                        ? "border-berry bg-berry/20"
                        : "border-white/10 bg-slate-950/60 hover:border-skyglow/60"
                  }`}
                >
                  <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Option {index + 1}</div>
                  <div className="mt-3 text-lg font-semibold">{option.text}</div>
                </button>
              );
            })}
          </div>
        </GlassPanel>
      </div>
    </AppShell>
  );
}
