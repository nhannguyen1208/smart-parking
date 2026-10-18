export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}) {
  const styles = {
    primary:
      "bg-brand-red text-white shadow-[0_8px_20px_rgba(137,22,53,0.28)] hover:bg-[#6f122b]",
    secondary:
      "border border-border bg-white text-navy shadow-sm hover:bg-surface",
    danger: "bg-brand-red text-white hover:bg-[#6f122b]",
    ghost: "bg-transparent text-brand-blue",
  };

  return (
    <button
      className={`inline-flex h-12 items-center justify-center rounded-[12px] px-4 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
