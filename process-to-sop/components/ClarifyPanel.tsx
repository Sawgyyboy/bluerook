"use client";

interface ClarifyPanelProps {
  questions: string[];
  answers: string[];
  onAnswerChange: (index: number, value: string) => void;
  onSubmit: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export default function ClarifyPanel({
  questions,
  answers,
  onAnswerChange,
  onSubmit,
  onSkip,
  onBack,
}: ClarifyPanelProps) {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <p className="eyebrow text-brass">Clarification</p>

      <h1 className="mt-6 font-display text-4xl leading-[1.1] font-medium tracking-tight text-paper sm:text-5xl">
        A few details are missing.
      </h1>
      <p className="mt-5 max-w-xl text-base leading-relaxed text-slate">
        Answer what you can — anything left blank will be marked as an
        assumption in the SOP, not stated as fact.
      </p>

      <form
        className="mt-10 space-y-8 border-l border-line pl-6 sm:pl-8"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        {questions.map((q, i) => (
          <div key={i}>
            <label htmlFor={`clarify-${i}`} className="block">
              <span className="eyebrow text-paper/50">{String(i + 1).padStart(2, "0")}</span>
              <span className="mt-1.5 block text-base leading-relaxed text-paper">{q}</span>
            </label>
            <input
              id={`clarify-${i}`}
              type="text"
              className="field-input mt-3"
              placeholder="Your answer — or leave blank"
              value={answers[i] ?? ""}
              autoComplete="off"
              onChange={(e) => onAnswerChange(i, e.target.value)}
            />
          </div>
        ))}

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button
            type="submit"
            className="focus-brass bg-brass px-7 py-3.5 font-mono text-xs font-medium tracking-[0.18em] text-midnight uppercase transition-opacity hover:opacity-85"
          >
            Generate the SOP
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="focus-brass border border-line px-5 py-3.5 font-mono text-xs tracking-[0.18em] text-slate uppercase transition-colors hover:border-slate hover:text-paper"
          >
            Skip — use assumptions
          </button>
          <button
            type="button"
            onClick={onBack}
            className="focus-brass font-mono text-xs tracking-[0.18em] text-slate uppercase underline-offset-4 transition-colors hover:text-paper hover:underline"
          >
            Back
          </button>
        </div>
      </form>
    </div>
  );
}
