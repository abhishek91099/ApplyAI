import Link from "next/link";

function LogoIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#logo-grad)" />
      <path
        d="M12 28L20 10L28 28"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="20" cy="22" r="2" fill="white" />
      <path
        d="M15.5 22H24.5"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M28 14L31 11M31 11V15M31 11H27"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
    </svg>
  );
}

export function Logo({
  size = "default",
  linkTo,
}: {
  size?: "small" | "default" | "large";
  linkTo?: string;
}) {
  const iconSize =
    size === "small" ? "h-6 w-6" : size === "large" ? "h-10 w-10" : "h-8 w-8";
  const textSize =
    size === "small"
      ? "text-base"
      : size === "large"
        ? "text-2xl"
        : "text-lg";

  const inner = (
    <>
      <LogoIcon className={iconSize} />
      <span className={`${textSize} font-bold text-gradient`}>ApplyAI</span>
    </>
  );

  if (linkTo) {
    return (
      <Link
        href={linkTo}
        className="inline-flex items-center gap-2.5 group transition-transform hover:scale-[1.02]"
      >
        {inner}
      </Link>
    );
  }

  return <span className="inline-flex items-center gap-2.5">{inner}</span>;
}

export { LogoIcon };
