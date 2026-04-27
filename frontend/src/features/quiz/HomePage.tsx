import { Link } from "react-router-dom";
import { FormEvent, useState } from "react";
import { useAuth } from "../../app/AuthProvider";
import { AppShell } from "../../shared/components/AppShell";
import { GlassPanel } from "../../shared/components/GlassPanel";
import { useNavigate } from "react-router-dom";

export function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [roomPin, setRoomPin] = useState("");

  function handleQuickJoin(event: FormEvent) {
    event.preventDefault();
    const normalizedPin = roomPin.trim();
    if (!normalizedPin) {
      return;
    }

    navigate(`/player/join?pin=${encodeURIComponent(normalizedPin)}`);
  }

  return (
    <AppShell>
      <div className="mx-auto flex min-h-[70vh] max-w-5xl flex-col items-center justify-center gap-8">
        <div className="w-full max-w-3xl text-center">
          <div className="inline-flex rounded-full bg-yellow-300 px-4 py-2 text-xs font-bold uppercase tracking-[0.32em] text-slate-950">
            Join fast. Host faster.
          </div>
          <h1 className="mt-5 font-display text-5xl font-bold tracking-tight text-white sm:text-6xl">
            Live quiz play starts with a PIN.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-200">
            Enter the game in seconds, or open a room and start hosting right away.
          </p>
        </div>

        <GlassPanel>
          <div className="mx-auto w-full max-w-2xl">
            <form className="space-y-4" onSubmit={handleQuickJoin}>
              <label className="block text-sm font-bold uppercase tracking-[0.28em] text-yellow-200">Join with PIN</label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={roomPin}
                  onChange={(event) => setRoomPin(event.target.value)}
                  inputMode="numeric"
                  className="min-h-16 flex-1 rounded-[1.75rem] border-2 border-white/15 bg-slate-950/80 px-6 text-center font-display text-3xl tracking-[0.35em] text-white outline-none transition focus:border-yellow-300"
                  placeholder="123456"
                />
                <button
                  type="submit"
                  className="min-h-16 rounded-[1.75rem] bg-fuchsia-500 px-8 text-lg font-bold text-white transition hover:bg-fuchsia-400"
                >
                  Join Game
                </button>
              </div>
            </form>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link
                to="/host/library"
                className="rounded-[1.75rem] bg-yellow-300 px-6 py-5 text-center text-lg font-bold text-slate-950 transition hover:bg-yellow-200"
              >
                Host Game
              </Link>
              <Link
                to="/player/join"
                className="rounded-[1.75rem] border-2 border-white/15 bg-white/5 px-6 py-5 text-center text-lg font-bold text-white transition hover:border-cyan-300/70 hover:bg-white/10"
              >
                Full Join Setup
              </Link>
            </div>
          </div>
        </GlassPanel>

        <div className="grid w-full max-w-4xl gap-3 sm:grid-cols-3">
          <div className="rounded-[1.75rem] border border-white/10 bg-black/20 p-4 text-center">
            <div className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-200">1</div>
            <div className="mt-2 font-semibold text-white">Enter PIN</div>
          </div>
          <div className="rounded-[1.75rem] border border-white/10 bg-black/20 p-4 text-center">
            <div className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-200">2</div>
            <div className="mt-2 font-semibold text-white">Pick a name</div>
          </div>
          <div className="rounded-[1.75rem] border border-white/10 bg-black/20 p-4 text-center">
            <div className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-200">3</div>
            <div className="mt-2 font-semibold text-white">Answer live</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {user ? (
            <Link
              to="/creator/studio"
              className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-center font-semibold text-white transition hover:border-white/25 hover:bg-white/10"
            >
              Open Creator Studio
            </Link>
          ) : (
            <Link
              to="/creator/auth"
              className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-center font-semibold text-white transition hover:border-white/25 hover:bg-white/10"
            >
              Creator Login
            </Link>
          )}
        </div>
      </div>
    </AppShell>
  );
}
