import { PropsWithChildren } from "react";

interface StatCardProps extends PropsWithChildren {
  label: string;
  value?: string | number;
  align?: "left" | "center";
}

export function StatCard({ label, value, align = "left", children }: StatCardProps) {
  return (
    <div className={`ui-stat-card p-4 sm:p-5 ${align === "center" ? "text-center" : ""}`}>
      <div className="text-xs font-bold uppercase tracking-[0.28em] text-yellow-200">{label}</div>
      {value !== undefined ? (
        <div className={`mt-3 font-display text-3xl text-white sm:text-4xl ${align === "center" ? "break-all" : ""}`}>{value}</div>
      ) : null}
      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}
