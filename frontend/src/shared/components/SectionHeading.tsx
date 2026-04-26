interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function SectionHeading({ eyebrow, title, description }: SectionHeadingProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold uppercase tracking-[0.4em] text-electric">{eyebrow}</p>
      <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">{title}</h1>
      <p className="max-w-2xl text-base text-slate-300 sm:text-lg">{description}</p>
    </div>
  );
}
