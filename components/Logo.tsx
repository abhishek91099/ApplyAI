import Link from "next/link";

function Mark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-[10px] bg-[#2997ff] text-[15px] font-semibold text-white ${className}`}
      aria-hidden
    >
      A
    </span>
  );
}

export function Logo({
  size = "default",
  linkTo,
}: {
  size?: "small" | "default" | "large";
  linkTo?: string;
}) {
  const markSize =
    size === "small" ? "h-6 w-6 text-[13px]" : size === "large" ? "h-10 w-10 text-lg" : "h-8 w-8 text-[15px]";
  const textSize =
    size === "small"
      ? "text-[17px]"
      : size === "large"
        ? "text-[28px]"
        : "text-[21px]";

  const inner = (
    <>
      <Mark className={markSize} />
      <span className={`${textSize} font-semibold tracking-tight text-[#f5f5f7]`}>ApplyAI</span>
    </>
  );

  if (linkTo) {
    return (
      <Link href={linkTo} className="inline-flex items-center gap-2.5">
        {inner}
      </Link>
    );
  }

  return <span className="inline-flex items-center gap-2.5">{inner}</span>;
}

export function LogoIcon({ className = "h-8 w-8" }: { className?: string }) {
  return <Mark className={className} />;
}
