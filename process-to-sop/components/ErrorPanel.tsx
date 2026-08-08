"use client";

interface ErrorPanelProps {
  message: string;
  onRetry: () => void;
  onBack: () => void;
}

export default function ErrorPanel({ message, onRetry, onBack }: ErrorPanelProps) {
  return (
    <div
      className="mx-auto flex min-h-[40vh] w-full max-w-2xl flex-col items-start justify-center"
      role="alert"
    >
      <p className="eyebrow text-brass">Generation failed</p>
      <h1 className="mt-5 font-display text-4xl leading-[1.1] font-medium tracking-tight text-paper">
        That didn&rsquo;t go through.
      </h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-slate">{message}</p>
      <div className="mt-8 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={onRetry}
          className="focus-brass bg-brass px-7 py-3.5 font-mono text-xs font-medium tracking-[0.18em] text-midnight uppercase transition-opacity hover:opacity-85"
        >
          Retry
        </button>
        <button
          type="button"
          onClick={onBack}
          className="focus-brass border border-line px-5 py-3.5 font-mono text-xs tracking-[0.18em] text-slate uppercase transition-colors hover:border-slate hover:text-paper"
        >
          Back to editing
        </button>
      </div>
    </div>
  );
}
