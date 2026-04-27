import { PropsWithChildren, useState } from "react";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const navItems = [
    { to: "/host/library", label: "Host Game", emphasis: true },
    { to: "/player/join", label: "Join Game", emphasis: true },
    { to: user ? "/creator/studio" : "/creator/auth", label: user ? "Studio" : "Creator", emphasis: false },
  ];

  function resetLiveState() {
    clearHostRoom();
    clearPlayerSession();
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div className={`min-h-screen overflow-hidden px-4 py-4 text-slate-100 sm:px-6 lg:px-8 ${theme.shellClassName}`}>
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col">
        <header className="sticky top-4 z-20 mb-6 rounded-[1.75rem] border border-white/10 bg-slate-950/70 px-4 py-4 shadow-neon backdrop-blur-xl">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <Link to="/" className="font-display text-2xl font-bold tracking-tight text-white">
                BrainBuzz
              </Link>
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-yellow-200">
                  Live Quiz
                </div>
                <button
                  type="button"
                  onClick={() => setMenuOpen((current) => !current)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-lg font-bold text-white transition hover:border-white/20 hover:bg-white/10 lg:hidden"
                  aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
                >
                  {menuOpen ? "×" : "≡"}
                </button>
              </div>
            </div>

            <div className={`${menuOpen ? "flex" : "hidden"} flex-col gap-2 border-t border-white/10 pt-4 lg:flex lg:flex-row lg:flex-wrap lg:items-center lg:gap-2 lg:border-t-0 lg:pt-0`}>
              {location.pathname !== "/" ? (
                <button
                  type="button"
                  onClick={() => {
                    closeMenu();
                    navigate(-1);
                  }}
                  className="ui-button-secondary text-sm"
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
                    onClick={closeMenu}
                    className={`text-sm ${
                      active
                        ? "ui-button-primary"
                        : item.emphasis
                          ? "ui-button-accent"
                          : "ui-button-secondary"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  resetLiveState();
                  closeMenu();
                }}
                className="ui-button-secondary text-sm"
              >
                Reset Session
              </button>
              {user ? (
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                  {user.displayName}
                </div>
              ) : (
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">Guest</div>
              )}
              {user ? (
                <button
                  type="button"
                  onClick={() => {
                    closeMenu();
                    navigate("/creator/studio");
                  }}
                  className="ui-button-secondary text-sm"
                >
                  My Studio
                </button>
              ) : null}
              {user ? (
                <button
                  type="button"
                  onClick={() => {
                    resetLiveState();
                    closeMenu();
                    logout();
                    navigate("/");
                  }}
                  className="ui-button-danger text-sm"
                >
                  Log out
                </button>
              ) : (
                <Link
                  to="/creator/auth"
                  onClick={closeMenu}
                  className="ui-button-secondary text-sm"
                >
                  Creator Login
                </Link>
              )}
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
