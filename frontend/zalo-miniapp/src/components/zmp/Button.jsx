export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}) {
  const styles = {
    primary:
      "bg-brand-red text-white shadow-[0_8px_18px_rgba(137,22,53,0.22)] hover:bg-[#6f122b]",
    secondary: "border border-border bg-card text-navy shadow-none hover:bg-surface",
    danger:
      "bg-brand-red text-white shadow-[0_8px_18px_rgba(137,22,53,0.22)] hover:bg-[#6f122b]",
    ghost: "bg-transparent text-brand-blue shadow-none",
  };

  return (
    <button
      className={`inline-flex h-12 items-center justify-center rounded-[14px] px-4 text-[14px] font-semibold transition active:scale-[0.98] disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
