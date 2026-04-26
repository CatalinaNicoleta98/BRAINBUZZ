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
      className={`w-full rounded-[2rem] border p-5 text-left transition ${
        selected ? "border-electric bg-electric/10" : "border-white/10 bg-white/5 hover:border-white/20"
      }`}
    >
      <div className={`flex min-h-28 items-end rounded-[1.5rem] p-4 ${theme.shellClassName}`}>
        <div className="text-4xl">{quiz.coverEmoji}</div>
      </div>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <div className="font-display text-2xl text-white">{quiz.title}</div>
          <div className="mt-1 text-sm text-slate-300">{quiz.description}</div>
        </div>
        <div className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-slate-300">
          {quiz.visibility}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
        <span>{quiz.questions.length} questions</span>
        <span>by {quiz.createdBy}</span>
      </div>
      {actionLabel ? <div className="mt-4 font-semibold text-electric">{actionLabel}</div> : null}
    </button>
  );
}
