import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type ButtonProps = {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
} & (
  | ({ href: string } & Omit<ComponentPropsWithoutRef<typeof Link>, "className">)
  | ({ href?: undefined } & ComponentPropsWithoutRef<"button">)
);

const variants = {
  primary:
    "bg-brand-red text-white shadow-[0_8px_20px_rgba(137,22,53,0.25)] hover:bg-[#70102b] hover:shadow-[0_10px_24px_rgba(137,22,53,0.3)] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none",
  secondary:
    "border border-border bg-white text-navy shadow-sm hover:border-brand-blue/30 hover:bg-brand-light/40 disabled:cursor-not-allowed disabled:opacity-60",
  ghost:
    "text-muted hover:bg-surface hover:text-navy disabled:cursor-not-allowed disabled:opacity-60",
};

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const classes = `inline-flex h-12 items-center justify-center rounded-[12px] px-5 text-sm font-semibold transition-all duration-200 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue ${variants[variant]} ${className}`;

  if ("href" in props && props.href) {
    const { href, ...linkProps } = props;
    return (
      <Link href={href} className={classes} {...linkProps}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...(props as ComponentPropsWithoutRef<"button">)}>
      {children}
    </button>
  );
}
