import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../app/AuthProvider";
import { fetchQuizzes } from "../../shared/api/quizzes";
import { createQuiz } from "../../shared/api/createQuiz";
import { AppShell } from "../../shared/components/AppShell";
import { GlassPanel } from "../../shared/components/GlassPanel";
import { QuizCard } from "../../shared/components/QuizCard";
import { SectionHeading } from "../../shared/components/SectionHeading";
import { ThemePreviewCard } from "../../shared/components/ThemePreviewCard";
import { socket } from "../../shared/socket/socketClient";
import type { QuizSummary } from "../../shared/types/game";
import { demoQuiz } from "../../shared/utils/demoQuiz";
import { saveHostRoom } from "../../shared/utils/storage";
import { getThemeById, themeOptions } from "../../shared/utils/themes";

export function HostCreateRoomPage() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [hostName, setHostName] = useState("");
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState("");
  const [themeId, setThemeId] = useState(themeOptions[0].id);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const data = await fetchQuizzes();
        setQuizzes(data);
        if (data[0]?._id) {
          setSelectedQuizId(data[0]._id);
          setThemeId(data[0].themeId);
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

    if (!token || !user) {
      throw new Error("Pick a library quiz or sign in to save a custom one.");
    }

    const quiz = await createQuiz(
      {
        ...demoQuiz,
        createdBy: user.displayName,
      },
      token,
    );
    return quiz._id;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const quizId = await ensureQuizId();
      socket.emit("room:create", { quizId, hostName, themeId }, (response: { roomPin: string }) => {
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
          description="Pick from the live public library or your own creator collection, choose a room theme, then open the lobby and start the show."
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
              <label className="mb-3 block text-sm font-semibold text-slate-200">Quiz library</label>
              <div className="grid gap-4">
                {quizzes.map((quiz) => (
                  <QuizCard
                    key={quiz._id}
                    quiz={quiz}
                    selected={selectedQuizId === quiz._id}
                    onClick={() => {
                      setSelectedQuizId(quiz._id);
                      setThemeId(quiz.themeId);
                    }}
                    actionLabel="Use this quiz"
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="mb-3 block text-sm font-semibold text-slate-200">Room theme</label>
              <div className="grid gap-4 md:grid-cols-3">
                {themeOptions.map((theme) => (
                  <ThemePreviewCard key={theme.id} themeId={theme.id} selected={theme.id === themeId} onClick={() => setThemeId(theme.id)} />
                ))}
              </div>
            </div>

            {error ? <p className="text-sm text-rose-300">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-electric px-5 py-4 font-bold text-slate-950 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating room..." : "Create BrainBuzz Room"}
            </button>
            {!user ? (
              <p className="text-sm text-slate-400">
                Want to build and store your own quizzes? Create a creator account from the home page.
              </p>
            ) : null}
          </form>
        </GlassPanel>
      </div>
    </AppShell>
  );
}
