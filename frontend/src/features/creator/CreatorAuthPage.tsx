import { FormEvent, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../app/AuthProvider";
import { AppShell } from "../../shared/components/AppShell";
import { GlassPanel } from "../../shared/components/GlassPanel";
import { SectionHeading } from "../../shared/components/SectionHeading";

export function CreatorAuthPage() {
  const { user, loginWithPassword, registerWithPassword } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/creator/studio" replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "register") {
        await registerWithPassword({ displayName, email, password });
      } else {
        await loginWithPassword({ email, password });
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to continue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <SectionHeading
          eyebrow="Creator Access"
          title="Create an account to build and store your own quiz library."
          description="Players can stay guests, but creators get a persistent studio for custom games, themes, and reusable question sets."
        />
        <GlassPanel>
          <div className="mb-6 flex gap-2 rounded-2xl bg-white/5 p-2">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 rounded-xl px-4 py-3 font-semibold transition ${mode === "login" ? "bg-electric text-slate-950" : "text-slate-300"}`}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 rounded-xl px-4 py-3 font-semibold transition ${mode === "register" ? "bg-electric text-slate-950" : "text-slate-300"}`}
            >
              Create account
            </button>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {mode === "register" ? (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-200">Display name</label>
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-electric"
                  placeholder="Catalina"
                  required
                />
              </div>
            ) : null}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-200">Email</label>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-electric"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-200">Password</label>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-electric"
                placeholder="At least 8 characters"
                required
              />
            </div>
            {error ? <p className="text-sm text-rose-300">{error}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-electric px-5 py-4 font-bold text-slate-950 transition hover:scale-[1.01] disabled:opacity-60"
            >
              {loading ? "Please wait..." : mode === "register" ? "Create Creator Account" : "Log In"}
            </button>
          </form>
        </GlassPanel>
      </div>
    </AppShell>
  );
}
