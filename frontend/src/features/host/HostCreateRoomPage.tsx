import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../app/AuthProvider";
import { fetchQuizzes } from "../../shared/api/quizzes";
import { AppShell } from "../../shared/components/AppShell";
import { GlassPanel } from "../../shared/components/GlassPanel";
import { QuizCard } from "../../shared/components/QuizCard";
import { SectionHeading } from "../../shared/components/SectionHeading";
import { ThemePreviewCard } from "../../shared/components/ThemePreviewCard";
import { socket } from "../../shared/socket/socketClient";
import type { QuizSummary } from "../../shared/types/game";
import { saveHostRoom } from "../../shared/utils/storage";
import { themeOptions } from "../../shared/utils/themes";

export function HostCreateRoomPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token, user } = useAuth();
  const [hostName, setHostName] = useState("");
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState(searchParams.get("quizId") ?? "");
  const [themeId, setThemeId] = useState(themeOptions[0].id);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const data = await fetchQuizzes(token ?? undefined);
        setQuizzes(data);
        const queryQuizId = searchParams.get("quizId");
        const initialQuiz = data.find((quiz) => quiz._id === queryQuizId) ?? data[0];
        if (initialQuiz?._id) {
          setSelectedQuizId(initialQuiz._id);
          setThemeId(initialQuiz.themeId);
        }
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Failed to load quizzes.");
      }
    })();
  }, [searchParams, token]);

  const selectedQuiz = useMemo(
    () => quizzes.find((quiz) => quiz._id === selectedQuizId) ?? null,
    [quizzes, selectedQuizId],
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const trimmedHostName = hostName.trim();
    if (!selectedQuizId) {
      setError("Choose a quiz from the host library first.");
      setLoading(false);
      return;
    }

    const handleSocketError = (payload: { message: string }) => {
      setError(payload.message);
      setLoading(false);
      socket.off("error", handleSocketError);
    };

    socket.on("error", handleSocketError);

    try {
      socket.emit("room:create", { quizId: selectedQuizId, hostName: trimmedHostName, themeId }, (response: { roomPin: string }) => {
        socket.off("error", handleSocketError);
        saveHostRoom(response.roomPin);
        navigate(`/host/lobby/${response.roomPin}`);
        setLoading(false);
      });
    } catch (submitError) {
      socket.off("error", handleSocketError);
      setError(submitError instanceof Error ? submitError.message : "Unable to create room.");
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <SectionHeading
          eyebrow="Host Setup"
          title="Spin up a live room in seconds."
          description="Choose a quiz from the library, set the room vibe, then launch the lobby and bring players in."
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
              <div className="mb-3 flex items-center justify-between gap-4">
                <label className="block text-sm font-semibold text-slate-200">Selected quiz</label>
                <Link to="/host/library" className="text-sm font-semibold text-electric transition hover:text-skyglow">
                  Browse library
                </Link>
              </div>
              {selectedQuiz ? (
                <QuizCard quiz={selectedQuiz} selected actionLabel="Ready for this room" />
              ) : (
                <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-5 text-slate-300">
                  Choose a quiz from the library before creating the room.
                </div>
              )}
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
              disabled={loading || !selectedQuiz}
              className="w-full rounded-2xl bg-electric px-5 py-4 font-bold text-slate-950 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating room..." : "Create BrainBuzz Room"}
            </button>
            {!user ? (
              <p className="text-sm text-slate-400">
                Want private quizzes in this host library? Create a creator account and save them in your studio first.
              </p>
            ) : null}
          </form>
        </GlassPanel>
      </div>
    </AppShell>
  );
}
