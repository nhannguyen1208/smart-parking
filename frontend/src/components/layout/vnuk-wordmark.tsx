type VNUKWordmarkProps = {
  size?: "sm" | "lg";
  onDark?: boolean;
};

export function VNUKWordmark({ size = "sm", onDark = false }: VNUKWordmarkProps) {
  const isLarge = size === "lg";

  return (
    <div
      className={`flex items-start gap-1 font-semibold tracking-tight ${
        isLarge ? "text-[46px] leading-none" : "text-[28px] leading-none"
      }`}
    >
      <span className={onDark ? "text-[#ff6b8a]" : "text-brand-red"}>VN</span>
      <span
        className={`${onDark ? "text-white/85" : "text-navy-dark"} ${
          isLarge ? "text-[30px]" : "text-lg"
        }`}
      >
        ▸
      </span>
      <span className={onDark ? "text-white" : "text-navy-dark"}>UK</span>
    </div>
  );
}
