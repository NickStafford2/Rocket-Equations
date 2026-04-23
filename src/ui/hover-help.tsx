type HoverHelpProps = {
  description: string;
  className?: string;
};

export function HoverHelp({ description, className }: HoverHelpProps) {
  return (
    <span
      className={`inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/12 bg-white/8 text-[0.6rem] font-semibold text-slate-300 ${className ?? ""}`}
      title={description}
      aria-label={description}
    >
      ?
    </span>
  );
}
