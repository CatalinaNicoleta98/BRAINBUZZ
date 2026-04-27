import { FormEvent, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../app/AuthProvider";
import { createQuiz } from "../../shared/api/createQuiz";
import { fetchMyQuizzes } from "../../shared/api/quizzes";
import { AppShell } from "../../shared/components/AppShell";
import { GlassPanel } from "../../shared/components/GlassPanel";
import { QuizCard } from "../../shared/components/QuizCard";
import { SectionHeading } from "../../shared/components/SectionHeading";
import { ThemePreviewCard } from "../../shared/components/ThemePreviewCard";
import type { QuizSummary } from "../../shared/types/game";
import { themeOptions } from "../../shared/utils/themes";

const emojiChoices = ["🧠", "🚀", "🎯", "🌈", "🎮", "⚡"];

export function CreatorStudioPage() {
  const { token, user, logout, loading } = useAuth();
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverEmoji, setCoverEmoji] = useState("🧠");
  const [themeId, setThemeId] = useState(themeOptions[0].id);
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [questions, setQuestions] = useState([
    {
      prompt: "",
      options: ["", "", "", ""],
      correctOptionIndex: 0,
      timeLimitSeconds: 15,
      points: 1000,
    },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      return;
    }

    void (async () => {
      try {
        setQuizzes(await fetchMyQuizzes(token));
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Failed to load your quiz library.");
      }
    })();
  }, [token]);

  if (!loading && !user) {
    return <Navigate to="/creator/auth" replace />;
  }

  if (!token || !user) {
    return null;
  }

  const currentUser = user;
  const currentToken = token;

  function updateQuestion(index: number, updater: (question: (typeof questions)[number]) => (typeof questions)[number]) {
    setQuestions((current) => current.map((question, questionIndex) => (questionIndex === index ? updater(question) : question)));
  }

  function addQuestion() {
    setQuestions((current) => [
      ...current,
      {
        prompt: "",
        options: ["", "", "", ""],
        correctOptionIndex: 0,
        timeLimitSeconds: 15,
        points: 1000,
      },
    ]);
  }

  function removeQuestion(index: number) {
    setQuestions((current) => current.filter((_, questionIndex) => questionIndex !== index));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await createQuiz(
        {
          title,
          description,
          createdBy: currentUser.displayName,
          themeId,
          coverEmoji,
          visibility,
          questions,
        },
        currentToken,
      );

      setQuizzes(await fetchMyQuizzes(currentToken));
      setTitle("");
      setDescription("");
      setCoverEmoji("🧠");
      setThemeId(themeOptions[0].id);
      setVisibility("private");
      setQuestions([
        {
          prompt: "",
          options: ["", "", "", ""],
          correctOptionIndex: 0,
          timeLimitSeconds: 15,
          points: 1000,
        },
      ]);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save quiz.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Creator Studio"
            title={`Welcome back, ${currentUser.displayName}.`}
            description="Build custom games, store them in your library, and launch themed quiz rooms whenever you want."
          />
          <button
            type="button"
            onClick={logout}
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition hover:border-white/25"
          >
            Log out
          </button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <GlassPanel>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-[1fr_140px]">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-200">Quiz title</label>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-electric"
                    placeholder="WebSocket Showdown"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-200">Cover</label>
                  <select
                    value={coverEmoji}
                    onChange={(event) => setCoverEmoji(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-electric"
                  >
                    {emojiChoices.map((emoji) => (
                      <option key={emoji} value={emoji}>
                        {emoji}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-200">Description</label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-electric"
                  placeholder="A fast, competitive quiz about modern web technology."
                  required
                />
              </div>

              <div>
                <label className="mb-3 block text-sm font-semibold text-slate-200">Theme</label>
                <div className="grid gap-4 md:grid-cols-3">
                  {themeOptions.map((theme) => (
                    <ThemePreviewCard key={theme.id} themeId={theme.id} selected={themeId === theme.id} onClick={() => setThemeId(theme.id)} />
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-200">Visibility</label>
                <select
                  value={visibility}
                  onChange={(event) => setVisibility(event.target.value as "private" | "public")}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-electric"
                >
                  <option value="private">Private to my account</option>
                  <option value="public">Public in game library</option>
                </select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-2xl">Questions</h2>
                  <button type="button" onClick={addQuestion} className="rounded-2xl border border-white/10 px-4 py-2 font-semibold text-white">
                    Add question
                  </button>
                </div>

                {questions.map((question, index) => (
                  <div key={`question-${index}`} className="space-y-4 rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="font-display text-xl">Question {index + 1}</h3>
                      <button
                        type="button"
                        onClick={() => removeQuestion(index)}
                        disabled={questions.length === 1}
                        className="rounded-2xl border border-rose-400/35 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:border-rose-300 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Delete question
                      </button>
                    </div>
                    <input
                      value={question.prompt}
                      onChange={(event) => updateQuestion(index, (current) => ({ ...current, prompt: event.target.value }))}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-electric"
                      placeholder={`Question ${index + 1} prompt`}
                      required
                    />
                    <div className="grid gap-3 md:grid-cols-2">
                      {question.options.map((option, optionIndex) => (
                        <input
                          key={`question-${index}-option-${optionIndex}`}
                          value={option}
                          onChange={(event) =>
                            updateQuestion(index, (current) => ({
                              ...current,
                              options: current.options.map((value, currentIndex) => (currentIndex === optionIndex ? event.target.value : value)),
                            }))
                          }
                          className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-electric"
                          placeholder={`Option ${optionIndex + 1}`}
                          required
                        />
                      ))}
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      <select
                        value={question.correctOptionIndex}
                        onChange={(event) => updateQuestion(index, (current) => ({ ...current, correctOptionIndex: Number(event.target.value) }))}
                        className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-electric"
                      >
                        {question.options.map((_option, optionIndex) => (
                          <option key={optionIndex} value={optionIndex}>
                            Correct option: {optionIndex + 1}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={5}
                        max={60}
                        value={question.timeLimitSeconds}
                        onChange={(event) => updateQuestion(index, (current) => ({ ...current, timeLimitSeconds: Number(event.target.value) }))}
                        className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-electric"
                      />
                      <input
                        type="number"
                        min={100}
                        max={5000}
                        step={100}
                        value={question.points}
                        onChange={(event) => updateQuestion(index, (current) => ({ ...current, points: Number(event.target.value) }))}
                        className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-electric"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {error ? <p className="text-sm text-rose-300">{error}</p> : null}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-electric px-5 py-4 font-bold text-slate-950 transition hover:scale-[1.01] disabled:opacity-60"
              >
                {submitting ? "Saving quiz..." : "Save to my library"}
              </button>
            </form>
          </GlassPanel>

          <GlassPanel>
            <h2 className="font-display text-3xl font-bold">My Library</h2>
            <div className="mt-5 space-y-4">
              {quizzes.map((quiz) => (
                <QuizCard key={quiz._id} quiz={quiz} />
              ))}
              {!quizzes.length ? <div className="rounded-2xl bg-white/5 p-4 text-slate-400">No saved quizzes yet. Build your first one here.</div> : null}
            </div>
          </GlassPanel>
        </div>
      </div>
    </AppShell>
  );
}
