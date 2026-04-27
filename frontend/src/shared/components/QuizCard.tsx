import type { QuizSummary } from "../types/game";
import { getThemeById } from "../utils/themes";

interface QuizCardProps {
  quiz: QuizSummary;
  selected?: boolean;
  onClick?: () => void;
  actionLabel?: string;
}

export function QuizCard({ quiz, selected = false, onClick, actionLabel }: QuizCardProps) {
  const theme = getThemeById(quiz.themeId);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-[1.9rem] border p-5 text-left transition ${
        selected
          ? "border-yellow-300 bg-yellow-300/12"
          : "border-white/10 bg-black/20 hover:-translate-y-1 hover:border-cyan-300/60 hover:bg-white/10"
      }`}
    >
      <div className={`flex min-h-24 items-center justify-between rounded-[1.5rem] p-4 ${theme.shellClassName}`}>
        <div className="text-4xl">{quiz.coverEmoji}</div>
        <div className="rounded-full bg-black/35 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-white/85">
          {quiz.questions.length} Qs
        </div>
      </div>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <div className="font-display text-2xl text-white">{quiz.title}</div>
          <div className="mt-2 line-clamp-3 text-sm text-slate-200">{quiz.description}</div>
        </div>
        <div className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-slate-200">
          {quiz.visibility}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm text-slate-300">
        <span>by {quiz.createdBy}</span>
        <span className="font-semibold text-cyan-200">{quiz.themeId}</span>
      </div>
      {actionLabel ? <div className="mt-4 font-bold text-yellow-200">{actionLabel}</div> : null}
    </button>
  );
}
