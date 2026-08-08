"use client";

import { useEffect, useRef } from "react";

interface EditableProps {
  value: string;
  onCommit: (value: string) => void;
  /** Accessible name, e.g. "Step 3 action". */
  label: string;
  as?: "span" | "div" | "p" | "h1" | "h2" | "h3";
  multiline?: boolean;
  className?: string;
}

/** Inline-editable text. Commits on blur; Enter commits (single-line),
 *  Escape reverts. Renders as plain document text until focused. */
export default function Editable({
  value,
  onCommit,
  label,
  as: Tag = "span",
  multiline = false,
  className,
}: EditableProps) {
  const ref = useRef<HTMLElement | null>(null);

  // Sync external value changes into the DOM, but never while the user
  // is typing in this element.
  useEffect(() => {
    const el = ref.current;
    if (el && document.activeElement !== el && el.textContent !== value) {
      el.textContent = value;
    }
  }, [value]);

  const handleBlur = () => {
    const text = ref.current?.textContent?.replace(/\s+/g, " ").trim() ?? "";
    if (text !== value) onCommit(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      e.currentTarget.blur();
    }
    if (e.key === "Escape") {
      if (ref.current) ref.current.textContent = value;
      e.currentTarget.blur();
    }
  };

  return (
    <Tag
      ref={ref as React.Ref<never>}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      role="textbox"
      aria-label={label}
      aria-multiline={multiline}
      className={className}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    >
      {value}
    </Tag>
  );
}
