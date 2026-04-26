import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppShell } from "../../shared/components/AppShell";
import { GlassPanel } from "../../shared/components/GlassPanel";
import { TimerRing } from "../../shared/components/TimerRing";
import { socket } from "../../shared/socket/socketClient";
import type { AnswerDistribution, GameEndPayload, QuestionShowPayload, RoomState, RoundEndPayload } from "../../shared/types/game";

export function HostGamePage() {
  const navigate = useNavigate();
  const { roomPin = "" } = useParams();
  const [room, setRoom] = useState<RoomState | null>(null);
  const [question, setQuestion] = useState<QuestionShowPayload | null>(null);
  const [distribution, setDistribution] = useState<AnswerDistribution[]>([]);
  const [leaderboard, setLeaderboard] = useState<RoundEndPayload["leaderboard"]>([]);
  const [roundEnded, setRoundEnded] = useState(false);
  const [lastResult, setLastResult] = useState<GameEndPayload | null>(null);
  const [tick, setTick] = useState(Date.now());
  const [timeoutSentFor, setTimeoutSentFor] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTick(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    socket.emit("state:sync", { roomPin, role: "host" }, (state: RoomState) => {
      setRoom(state);
    });

    const handleStateSync = (state: RoomState) => {
      if (state.roomPin === roomPin) {
        setRoom(state);
      }
    };

    const handleQuestionShow = (payload: QuestionShowPayload) => {
      if (payload.roomPin !== roomPin) {
        return;
      }
      setQuestion(payload);
      setDistribution([]);
      setRoundEnded(false);
      setTimeoutSentFor(null);
    };

    const handleStats = (payload: { distribution: AnswerDistribution[] }) => {
      setDistribution(payload.distribution);
    };

    const handleQuestionEnd = (payload: RoundEndPayload) => {
      setDistribution(payload.distribution);
      setLeaderboard(payload.leaderboard);
      setRoundEnded(true);
    };

    const handleGameEnd = (payload: GameEndPayload) => {
      setLastResult(payload);
      navigate(`/results/${payload.roomPin}`);
    };

    socket.on("state:sync", handleStateSync);
    socket.on("question:show", handleQuestionShow);
    socket.on("stats:update", handleStats);
    socket.on("question:end", handleQuestionEnd);
    socket.on("game:end", handleGameEnd);

    return () => {
      socket.off("state:sync", handleStateSync);
      socket.off("question:show", handleQuestionShow);
      socket.off("stats:update", handleStats);
      socket.off("question:end", handleQuestionEnd);
      socket.off("game:end", handleGameEnd);
    };
  }, [navigate, roomPin]);

  useEffect(() => {
    if (!question || roundEnded) {
      return;
    }

    if (tick >= question.timerEndsAt && timeoutSentFor !== question.question.id) {
      setTimeoutSentFor(question.question.id);
      socket.emit("question:timeout", roomPin);
    }
  }, [question, roundEnded, roomPin, tick, timeoutSentFor]);

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

  function showNextQuestion() {
    if (!room) {
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
    <AppShell>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <GlassPanel>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-skyglow">Host Control</p>
              <h1 className="font-display text-4xl font-bold">{question?.question.prompt ?? "Waiting for question..."}</h1>
              <p className="text-slate-300">
                Question {(question?.questionIndex ?? 0) + 1} of {question?.totalQuestions ?? room?.quiz.questionCount ?? 0}
              </p>
            </div>
            <TimerRing endsAt={question?.timerEndsAt ?? null} />
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

          {roundEnded ? (
            <button
              type="button"
              onClick={showNextQuestion}
              className="mt-8 rounded-2xl bg-electric px-6 py-4 font-bold text-slate-950 transition hover:scale-[1.01]"
            >
              {room && room.currentQuestionIndex >= room.quiz.questionCount - 1 ? "View Final Results" : "Next Question"}
            </button>
          ) : null}
        </GlassPanel>

        <GlassPanel>
          <h2 className="font-display text-2xl font-bold">Live Leaderboard</h2>
          <div className="mt-5 space-y-3">
            {(leaderboard.length ? leaderboard : room?.players ?? []).map((entry, index) => (
              <div key={"playerId" in entry ? entry.playerId : entry.id} className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                <div>
                  <div className="text-sm uppercase tracking-[0.2em] text-slate-400">#{"rank" in entry ? entry.rank : index + 1}</div>
                  <div className="font-semibold">{entry.displayName}</div>
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
