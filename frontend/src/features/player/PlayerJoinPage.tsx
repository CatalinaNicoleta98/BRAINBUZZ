import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppShell } from "../../shared/components/AppShell";
import { AvatarPicker } from "../../shared/components/AvatarPicker";
import { GlassPanel } from "../../shared/components/GlassPanel";
import { socket } from "../../shared/socket/socketClient";
import { savePlayerSession } from "../../shared/utils/storage";
import { avatarOptions } from "../../shared/utils/avatars";

export function PlayerJoinPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [roomPin, setRoomPin] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarId, setAvatarId] = useState(avatarOptions[0].id);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const pinFromQuery = searchParams.get("pin");
    if (pinFromQuery) {
      setRoomPin(pinFromQuery);
    }
  }, [searchParams]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const normalizedRoomPin = roomPin.trim();
    const normalizedDisplayName = displayName.trim();

    const handleSocketError = (payload: { message: string }) => {
      setError(payload.message);
      setLoading(false);
      socket.off("error", handleSocketError);
    };

    socket.on("error", handleSocketError);
    socket.emit("room:join", { roomPin: normalizedRoomPin, displayName: normalizedDisplayName, avatarId }, (response: { playerId: string; room: { roomPin: string } }) => {
      socket.off("error", handleSocketError);
      savePlayerSession({
        roomPin: response.room.roomPin,
        playerId: response.playerId,
        displayName: normalizedDisplayName,
        avatarId,
      });
      navigate(`/player/lobby/${response.room.roomPin}`);
      setLoading(false);
    });
  }

  return (
    <AppShell>
      <div className="ui-page flex min-h-[72vh] items-center justify-center">
        <GlassPanel>
          <div className="mx-auto max-w-2xl text-center">
            <div className="ui-chip bg-cyan-300 text-slate-950">
              Join Game
            </div>
            <h1 className="mt-5 font-display text-3xl font-bold text-white sm:text-5xl">Enter PIN. Pick a name. Play live.</h1>
            <p className="mt-3 text-sm text-slate-200 sm:text-base">Fast join on mobile or desktop, with just enough setup to get you in the room.</p>
          </div>

          <form className="mx-auto mt-8 max-w-2xl space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 sm:grid-cols-[1.1fr_0.9fr]">
              <div>
                <label className="mb-2 block text-sm font-bold uppercase tracking-[0.26em] text-yellow-200">Game PIN</label>
                <input
                  value={roomPin}
                  onChange={(event) => setRoomPin(event.target.value)}
                  inputMode="numeric"
                  className="ui-input min-h-16 px-4 text-center font-display text-2xl tracking-[0.3em] sm:text-3xl sm:tracking-[0.35em]"
                  placeholder="123456"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold uppercase tracking-[0.26em] text-yellow-200">Nickname</label>
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className="ui-input min-h-16 text-lg font-semibold focus:border-cyan-300"
                  placeholder="Catalina"
                  required
                />
              </div>
            </div>

            <div className="ui-stat-card">
              <label className="mb-3 block text-sm font-bold uppercase tracking-[0.26em] text-yellow-200">Choose avatar</label>
              <AvatarPicker selectedAvatarId={avatarId} onSelect={setAvatarId} />
            </div>

            {error ? <p className="text-sm text-rose-300">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="ui-button-accent min-h-16 w-full rounded-[1.75rem] px-5 text-lg"
            >
              {loading ? "Joining..." : "Join Game"}
            </button>

            <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
              <Link
                to="/"
                className="ui-button-secondary"
              >
                Back to Home
              </Link>
              <Link
                to="/host/library"
                className="ui-button-secondary"
              >
                Host Instead
              </Link>
            </div>
          </form>
        </GlassPanel>
      </div>
    </AppShell>
  );
}
