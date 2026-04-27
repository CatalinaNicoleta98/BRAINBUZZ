import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../app/AuthProvider";
import { fetchQuizzes } from "../../shared/api/quizzes";
import { AppShell } from "../../shared/components/AppShell";
import { GlassPanel } from "../../shared/components/GlassPanel";
import { QuizCard } from "../../shared/components/QuizCard";
import { SectionHeading } from "../../shared/components/SectionHeading";
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
      <div className="space-y-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Host Library"
            title="Choose the quiz before you open the room."
            description={
              user
                ? "Your hosting library now includes public BrainBuzz quizzes plus your own creator collection, including private drafts."
                : "Browse the premade development quiz collection, then continue to room setup and go live."
            }
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/player/join"
              className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-center font-semibold transition hover:border-electric/60"
            >
              Join a Room
            </Link>
            <Link
              to={user ? "/creator/studio" : "/creator/auth"}
              className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-center font-semibold transition hover:border-skyglow/60"
            >
              {user ? "Creator Studio" : "Creator Login"}
            </Link>
          </div>
        </div>

        <GlassPanel>
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-200">Search quizzes</label>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-electric"
                placeholder="React, TypeScript, Git, API..."
              />
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-slate-300">
              {filteredQuizzes.length} quiz{filteredQuizzes.length === 1 ? "" : "zes"} ready to host
            </div>
          </div>
        </GlassPanel>

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
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
            <p className="text-slate-300">
              No quizzes matched that search. {user ? "Try another keyword or build one in Creator Studio." : "Sign in as a creator to build your own private set."}
            </p>
          </GlassPanel>
        ) : null}
      </div>
    </AppShell>
  );
}
