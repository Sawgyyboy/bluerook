"use client";

import { placeholderDescription } from "@/lib/examples";

export interface FormState {
  processName: string;
  industry: string;
  description: string;
}

interface InputFormProps {
  form: FormState;
  onChange: (form: FormState) => void;
  onSubmit: () => void;
  onLoadExample: () => void;
  exampleLabel: string;
  error: string | null;
}

export default function InputForm({
  form,
  onChange,
  onSubmit,
  onLoadExample,
  exampleLabel,
  error,
}: InputFormProps) {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <p className="eyebrow text-brass">Field Tool / Process Design</p>

      <h1 className="mt-6 font-display text-5xl leading-[1.05] font-medium tracking-tight text-paper sm:text-6xl">
        Turn the process <em className="italic">in your head</em> into an SOP
        your team can follow.
      </h1>

      <p className="mt-6 max-w-xl text-base leading-relaxed text-slate">
        Describe how the work currently gets done. We&rsquo;ll structure the
        steps, ownership, decisions, controls and automation opportunities.
      </p>

      <form
        className="mt-12 space-y-7"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <div className="grid gap-7 sm:grid-cols-2">
          <div>
            <label htmlFor="processName" className="eyebrow block text-paper/70">
              Process name{" "}
              <span className="text-paper/40 normal-case tracking-normal">— optional</span>
            </label>
            <input
              id="processName"
              type="text"
              className="field-input mt-2.5"
              placeholder="e.g. Lead follow-up"
              value={form.processName}
              autoComplete="off"
              onChange={(e) => onChange({ ...form, processName: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="industry" className="eyebrow block text-paper/70">
              Business or industry{" "}
              <span className="text-paper/40 normal-case tracking-normal">— optional</span>
            </label>
            <input
              id="industry"
              type="text"
              className="field-input mt-2.5"
              placeholder="e.g. Interior design studio"
              value={form.industry}
              autoComplete="off"
              onChange={(e) => onChange({ ...form, industry: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label htmlFor="description" className="eyebrow block text-paper/70">
            How the process works today
          </label>
          <p className="mt-1.5 text-sm text-slate">
            Write it the way you&rsquo;d explain it to a new hire — names, tools,
            what usually goes wrong. Messy is fine.
          </p>
          <textarea
            id="description"
            className="field-input mt-2.5 min-h-56 resize-y"
            rows={10}
            placeholder={placeholderDescription}
            value={form.description}
            aria-required="true"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "description-error" : undefined}
            onChange={(e) => onChange({ ...form, description: e.target.value })}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                onSubmit();
              }
            }}
          />
          {error && (
            <p id="description-error" role="alert" className="mt-2.5 text-sm text-brass">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-1">
          <button
            type="submit"
            className="focus-brass bg-brass px-7 py-3.5 font-mono text-xs font-medium tracking-[0.18em] text-midnight uppercase transition-opacity hover:opacity-85"
          >
            Structure this process
          </button>
          <button
            type="button"
            onClick={onLoadExample}
            className="focus-brass border border-line px-5 py-3.5 font-mono text-xs tracking-[0.18em] text-slate uppercase transition-colors hover:border-slate hover:text-paper"
          >
            Load an example · {exampleLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
