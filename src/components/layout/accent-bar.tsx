export function AccentBar() {
  return (
    <div className="relative h-[5px] w-full overflow-hidden bg-brand-red">
      <div className="absolute left-[18%] top-0 h-full w-[14%] bg-navy-dark md:left-[270px] md:w-[190px]" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}
