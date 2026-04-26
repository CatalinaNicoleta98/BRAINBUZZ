import { PropsWithChildren } from "react";

export function GlassPanel({ children }: PropsWithChildren) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-neon backdrop-blur-xl">
      {children}
    </div>
  );
}
