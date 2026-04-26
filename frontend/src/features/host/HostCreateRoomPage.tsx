import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchQuizzes } from "../../shared/api/quizzes";
import { createQuiz } from "../../shared/api/createQuiz";
import { AppShell } from "../../shared/components/AppShell";
import { GlassPanel } from "../../shared/components/GlassPanel";
import { SectionHeading } from "../../shared/components/SectionHeading";
import { socket } from "../../shared/socket/socketClient";
import type { QuizSummary } from "../../shared/types/game";
import { demoQuiz } from "../../shared/utils/demoQuiz";
import { saveHostRoom } from "../../shared/utils/storage";

export function HostCreateRoomPage() {
  const navigate = useNavigate();
  const [hostName, setHostName] = useState("");
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const data = await fetchQuizzes();
        setQuizzes(data);
        if (data[0]?._id) {
          setSelectedQuizId(data[0]._id);
        }
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Failed to load quizzes.");
      }
    })();
  }, []);

  async function ensureQuizId() {
    if (selectedQuizId) {
      return selectedQuizId;
    }

    const quiz = await createQuiz({
      ...demoQuiz,
      createdBy: hostName || "BrainBuzz Host",
    });
    return quiz._id;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const quizId = await ensureQuizId();
      socket.emit("room:create", { quizId, hostName }, (response: { roomPin: string }) => {
        saveHostRoom(response.roomPin);
        navigate(`/host/lobby/${response.roomPin}`);
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create room.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <SectionHeading
          eyebrow="Host Setup"
          title="Spin up a live room in seconds."
          description="Pick a saved quiz or let BrainBuzz generate the demo quiz automatically, then open the lobby and start building tension."
        />
        <GlassPanel>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-200">Host display name</label>
              <input
                value={hostName}
                onChange={(event) => setHostName(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none ring-0 transition focus:border-electric"
                placeholder="Quiz Master Kate"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-200">Quiz selection</label>
              <select
                value={selectedQuizId}
                onChange={(event) => setSelectedQuizId(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-electric"
              >
                <option value="">Create and use built-in demo quiz</option>
                {quizzes.map((quiz) => (
                  <option key={quiz._id} value={quiz._id}>
                    {quiz.title}
                  </option>
                ))}
              </select>
            </div>

            {error ? <p className="text-sm text-rose-300">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-electric px-5 py-4 font-bold text-slate-950 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating room..." : "Create BrainBuzz Room"}
            </button>
          </form>
        </GlassPanel>
      </div>
    </AppShell>
  );
}
