import { AppShell } from "../../shared/components/AppShell";
import { GlassPanel } from "../../shared/components/GlassPanel";

export function PlayerQuestionPage() {
  return (
    <AppShell>
      <GlassPanel>
        <h1 className="font-display text-3xl font-bold">Question Screen</h1>
        <p className="mt-3 text-slate-300">Live answer interactions will appear here.</p>
      </GlassPanel>
    </AppShell>
  );
}
