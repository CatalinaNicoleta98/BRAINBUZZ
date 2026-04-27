import { PropsWithChildren } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../app/AuthProvider";
import { getThemeById } from "../utils/themes";
import { clearHostRoom, clearPlayerSession } from "../utils/storage";

interface AppShellProps extends PropsWithChildren {
  themeId?: string;
}

export function AppShell({ children, themeId }: AppShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const theme = getThemeById(themeId);
  const navItems = [
    { to: "/", label: "Home" },
    { to: "/host/library", label: "Host" },
    { to: "/player/join", label: "Play" },
    { to: user ? "/creator/studio" : "/creator/auth", label: user ? "Studio" : "Creator" },
  ];

  function resetLiveState() {
    clearHostRoom();
    clearPlayerSession();
  }

  return (
    <div className={`min-h-screen overflow-hidden px-4 py-6 text-slate-100 sm:px-6 lg:px-8 ${theme.shellClassName}`}>
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl flex-col gap-6 lg:flex-row">
        <aside className="w-full rounded-[2rem] border border-white/10 bg-slate-950/45 p-4 shadow-neon backdrop-blur-xl lg:sticky lg:top-6 lg:w-72 lg:self-start">
          <div className="flex items-center justify-between gap-3 lg:block">
            <div>
              <Link to="/" className="font-display text-2xl font-bold tracking-tight text-white">
                BrainBuzz
              </Link>
              <p className="mt-1 text-sm text-slate-400">Live quiz hosting and play, without getting trapped on one page.</p>
            </div>
            {location.pathname !== "/" ? (
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-electric/60"
              >
                Back
              </button>
            ) : null}
          </div>

          <nav className="mt-5 grid gap-2 sm:grid-cols-4 lg:grid-cols-1">
            {navItems.map((item) => {
              const active = location.pathname === item.to || (item.to !== "/" && location.pathname.startsWith(item.to));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    active ? "bg-electric text-slate-950" : "border border-white/10 bg-white/5 text-slate-200 hover:border-white/20"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Session</div>
            <div className="text-sm text-slate-200">{user ? `Signed in as ${user.displayName}` : "Guest mode active"}</div>
            <button
              type="button"
              onClick={resetLiveState}
              className="w-full rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-skyglow/60"
            >
              Clear room memory
            </button>
            {user ? (
              <button
                type="button"
                onClick={() => {
                  resetLiveState();
                  logout();
                  navigate("/");
                }}
                className="w-full rounded-2xl border border-rose-400/25 px-4 py-3 text-sm font-semibold text-rose-200 transition hover:border-rose-300"
              >
                Log out
              </button>
            ) : null}
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
