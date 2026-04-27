import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../app/AuthProvider";
import { fetchQuizzes } from "../../shared/api/quizzes";
import { AppShell } from "../../shared/components/AppShell";
import { GlassPanel } from "../../shared/components/GlassPanel";
import { QuizCard } from "../../shared/components/QuizCard";
import type { QuizSummary } from "../../shared/types/game";

export function HostQuizLibraryPage() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        setError("");
        setQuizzes(await fetchQuizzes(token ?? undefined));
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Failed to load the quiz library.");
      }
    })();
  }, [token]);

  const filteredQuizzes = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return quizzes;
    }

    return quizzes.filter((quiz) =>
      [quiz.title, quiz.description, quiz.createdBy].some((value) => value.toLowerCase().includes(query)),
    );
  }, [quizzes, search]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex rounded-full bg-yellow-300 px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-slate-950">
              Host Game
            </div>
            <h1 className="mt-4 font-display text-4xl font-bold text-white sm:text-5xl">Pick a quiz and open the room.</h1>
            <p className="mt-3 max-w-2xl text-slate-200">
              {user
                ? "Public BrainBuzz quizzes and your private creator quizzes are all ready to host."
                : "Choose a premade quiz and start a live game in a few taps."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/"
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-center font-semibold text-white transition hover:border-white/20 hover:bg-white/10"
            >
              Home
            </Link>
            <Link
              to="/player/join"
              className="rounded-2xl bg-fuchsia-500 px-5 py-3 text-center font-bold text-white transition hover:bg-fuchsia-400"
            >
              Join Game
            </Link>
          </div>
        </div>

        <GlassPanel>
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <label className="mb-2 block text-sm font-bold uppercase tracking-[0.26em] text-yellow-200">Search quiz library</label>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="min-h-14 w-full rounded-[1.5rem] border-2 border-white/15 bg-slate-950/80 px-5 text-white outline-none transition focus:border-yellow-300"
                placeholder="React, TypeScript, Git, API..."
              />
            </div>
            <div className="rounded-[1.5rem] bg-yellow-300 px-5 py-4 text-sm font-bold uppercase tracking-[0.24em] text-slate-950">
              {filteredQuizzes.length} quiz{filteredQuizzes.length === 1 ? "" : "zes"} ready to host
            </div>
          </div>
        </GlassPanel>

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredQuizzes.map((quiz) => (
            <QuizCard
              key={quiz._id}
              quiz={quiz}
              onClick={() => navigate(`/host/create?quizId=${quiz._id}`)}
              actionLabel="Choose for hosting"
            />
          ))}
        </div>

        {!filteredQuizzes.length ? (
          <GlassPanel>
            <p className="text-slate-200">
              No quizzes matched that search. {user ? "Try another keyword or build one in Creator Studio." : "Sign in as a creator to build your own private set."}
            </p>
          </GlassPanel>
        ) : null}
      </div>
    </AppShell>
  );
}
