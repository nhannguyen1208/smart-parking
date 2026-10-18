import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  /** Optional — omit when the parent already provides a visible label. */
  label?: string;
};

export function Input({ label, className = "", id, ...props }: InputProps) {
  const inputId =
    id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="w-full rounded-[14px] border border-border bg-white p-3.5 transition-all duration-200 focus-within:border-brand-blue focus-within:shadow-[0_0_0_3px_rgba(0,93,170,0.12)]">
      {label ? (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-xs font-semibold tracking-wide text-muted"
        >
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className={`relative z-10 block h-7 w-full bg-transparent text-[15px] leading-7 text-navy outline-none placeholder:text-muted/60 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
        {...props}
      />
    </div>
  );
}
