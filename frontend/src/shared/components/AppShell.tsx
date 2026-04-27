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
    { to: "/host/library", label: "Host Game", emphasis: true },
    { to: "/player/join", label: "Join Game", emphasis: true },
    { to: user ? "/creator/studio" : "/creator/auth", label: user ? "Studio" : "Creator", emphasis: false },
  ];

  function resetLiveState() {
    clearHostRoom();
    clearPlayerSession();
  }

  return (
    <div className={`min-h-screen overflow-hidden px-4 py-4 text-slate-100 sm:px-6 lg:px-8 ${theme.shellClassName}`}>
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col">
        <header className="sticky top-4 z-20 mb-6 rounded-[1.75rem] border border-white/10 bg-slate-950/70 px-4 py-4 shadow-neon backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center justify-between gap-3">
              <Link to="/" className="font-display text-2xl font-bold tracking-tight text-white">
                BrainBuzz
              </Link>
              <div className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-yellow-200">
                Live Quiz
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {location.pathname !== "/" ? (
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-yellow-300/70 hover:bg-white/10"
                >
                  Back
                </button>
              ) : null}
              {navItems.map((item) => {
                const active = location.pathname === item.to || (item.to !== "/" && location.pathname.startsWith(item.to));
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`rounded-2xl px-4 py-3 text-sm font-bold transition ${
                      active
                        ? "bg-yellow-300 text-slate-950"
                        : item.emphasis
                          ? "bg-fuchsia-500 text-white hover:bg-fuchsia-400"
                          : "border border-white/10 bg-white/5 text-slate-100 hover:border-white/20 hover:bg-white/10"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={resetLiveState}
                className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-300/70 hover:bg-white/10"
              >
                Reset Session
              </button>
              {user ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                  {user.displayName}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">Guest</div>
              )}
              {user ? (
                <>
                  <button
                    type="button"
                    onClick={() => navigate("/creator/studio")}
                    className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/20 hover:bg-white/10"
                  >
                    My Studio
                  </button>
                </>
              ) : null}
              {user ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      resetLiveState();
                      logout();
                      navigate("/");
                    }}
                    className="rounded-2xl border border-rose-400/30 px-4 py-3 text-sm font-semibold text-rose-100 transition hover:border-rose-300"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <Link
                  to="/creator/auth"
                  className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/20 hover:bg-white/10"
                >
                  Creator Login
                </Link>
              )}
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
