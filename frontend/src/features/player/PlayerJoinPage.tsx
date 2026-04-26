import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../../shared/components/AppShell";
import { AvatarPicker } from "../../shared/components/AvatarPicker";
import { GlassPanel } from "../../shared/components/GlassPanel";
import { SectionHeading } from "../../shared/components/SectionHeading";
import { socket } from "../../shared/socket/socketClient";
import { savePlayerSession } from "../../shared/utils/storage";
import { avatarOptions } from "../../shared/utils/avatars";

export function PlayerJoinPage() {
  const navigate = useNavigate();
  const [roomPin, setRoomPin] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarId, setAvatarId] = useState(avatarOptions[0].id);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const handleSocketError = (payload: { message: string }) => {
      setError(payload.message);
      setLoading(false);
      socket.off("error", handleSocketError);
    };

    socket.on("error", handleSocketError);
    socket.emit("room:join", { roomPin, displayName, avatarId }, (response: { playerId: string; room: { roomPin: string } }) => {
      socket.off("error", handleSocketError);
      savePlayerSession({
        roomPin: response.room.roomPin,
        playerId: response.playerId,
        displayName,
        avatarId,
      });
      navigate(`/player/lobby/${response.room.roomPin}`);
      setLoading(false);
    });
  }

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <SectionHeading
          eyebrow="Player Entry"
          title="Jump in with a PIN and make every answer count."
          description="BrainBuzz keeps the room synced in real time, so you can join fast and focus on the next question."
        />
        <GlassPanel>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-200">Room PIN</label>
              <input
                value={roomPin}
                onChange={(event) => setRoomPin(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-electric"
                placeholder="123456"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-200">Display name</label>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-electric"
                placeholder="Team Rocket"
                required
              />
            </div>
            <div>
              <label className="mb-3 block text-sm font-semibold text-slate-200">Pick an avatar</label>
              <AvatarPicker selectedAvatarId={avatarId} onSelect={setAvatarId} />
            </div>
            {error ? <p className="text-sm text-rose-300">{error}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-electric px-5 py-4 font-bold text-slate-950 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Joining..." : "Join Room"}
            </button>
          </form>
        </GlassPanel>
      </div>
    </AppShell>
  );
}
