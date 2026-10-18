export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}) {
  const styles = {
    primary: "bg-[#0068ff] text-white hover:bg-[#0052cc]",
    secondary: "bg-[#eef2f8] text-[#0b2e59] hover:bg-[#e2e8f2]",
    danger: "bg-[#891635] text-white hover:bg-[#6f122b]",
    ghost: "bg-transparent text-[#0068ff]",
  };

  return (
    <button
      className={`inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold transition disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
