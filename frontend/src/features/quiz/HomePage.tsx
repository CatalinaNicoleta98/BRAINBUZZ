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
      <div className="ui-page flex min-h-[70vh] flex-col items-center justify-center gap-6 sm:gap-8">
        <div className="w-full max-w-3xl text-center">
          <div className="ui-chip bg-yellow-300 text-slate-950">
            Join fast. Host faster.
          </div>
          <h1 className="mt-5 font-display text-4xl font-bold tracking-tight text-white sm:text-6xl">
            Live quiz play starts with a PIN.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-200 sm:text-lg">
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
                  className="ui-input min-h-16 flex-1 px-4 text-center font-display text-2xl tracking-[0.3em] sm:px-6 sm:text-3xl sm:tracking-[0.35em]"
                  placeholder="123456"
                />
                <button
                  type="submit"
                  className="ui-button-accent min-h-16 px-8 text-lg"
                >
                  Join Game
                </button>
              </div>
            </form>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link
                to="/host/library"
                className="ui-button-primary min-h-16 rounded-[1.75rem] px-6 py-5 text-lg"
              >
                Host Game
              </Link>
              <Link
                to="/player/join"
                className="ui-button-secondary min-h-16 rounded-[1.75rem] border-2 px-6 py-5 text-lg"
              >
                Full Join Setup
              </Link>
            </div>
          </div>
        </GlassPanel>

        <div className="grid w-full max-w-4xl gap-3 sm:grid-cols-3">
          <div className="ui-stat-card p-4 text-center">
            <div className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-200">1</div>
            <div className="mt-2 font-semibold text-white">Enter PIN</div>
          </div>
          <div className="ui-stat-card p-4 text-center">
            <div className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-200">2</div>
            <div className="mt-2 font-semibold text-white">Pick a name</div>
          </div>
          <div className="ui-stat-card p-4 text-center">
            <div className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-200">3</div>
            <div className="mt-2 font-semibold text-white">Answer live</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {user ? (
            <Link
              to="/creator/studio"
              className="ui-button-secondary"
            >
              Open Creator Studio
            </Link>
          ) : (
            <Link
              to="/creator/auth"
              className="ui-button-secondary"
            >
              Creator Login
            </Link>
          )}
        </div>
      </div>
    </AppShell>
  );
}
