import { AppShell } from "../../shared/components/AppShell";
import { GlassPanel } from "../../shared/components/GlassPanel";

export function HostCreateRoomPage() {
  return (
    <AppShell>
      <GlassPanel>
        <h1 className="font-display text-3xl font-bold">Create Room</h1>
        <p className="mt-3 text-slate-300">Quiz selection and host setup will appear here.</p>
      </GlassPanel>
    </AppShell>
  );
}
