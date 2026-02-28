export function SectionDivider({ from = "#FBF6F8", to = "#FBF6F8", flip = false }: {
  from?: string; to?: string; flip?: boolean;
}) {
  return (
    <div className="relative w-full h-16 md:h-24 overflow-hidden" style={{ background: from }}>
      <svg
        viewBox="0 0 1440 100"
        fill="none"
        preserveAspectRatio="none"
        className="absolute bottom-0 w-full h-full"
        style={{ transform: flip ? "scaleY(-1)" : undefined }}
      >
        <path
          d="M0 40C240 80 480 0 720 40C960 80 1200 0 1440 40V100H0V40Z"
          fill={to}
        />
      </svg>
    </div>
  );
}
