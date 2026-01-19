interface LogoProps {
  height?: number;
  className?: string;
  variant?: "dark" | "light";
}

// Color schemes for each variant
const COLORS = {
  dark: {
    background: "#07140a",
    shadow: "#0b3d19",
    glyph: "#39ff73",
  },
  light: {
    background: "#f0f5f1",
    shadow: "#b8d4be",
    glyph: "#0d7a2e",
  },
};

export function Logo({ height = 28, className, variant = "dark" }: LogoProps) {
  // Original viewBox is 31x9, calculate width to maintain aspect ratio
  const aspectRatio = 31 / 9;
  const width = height * aspectRatio;
  const colors = COLORS[variant];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 31 9"
      shapeRendering="crispEdges"
      className={className}
      style={{ display: 'block' }}
    >
      {/* background */}
      <rect x="0" y="0" width="31" height="9" fill={colors.background} />

      {/* shadow (offset by 1px in grid space) */}
      <g fill={colors.shadow}>
        {/* a (shadow) */}
        <rect x="3" y="2" width="3" height="1" />
        <rect x="2" y="3" width="1" height="1" />
        <rect x="6" y="3" width="1" height="1" />
        <rect x="2" y="4" width="5" height="1" />
        <rect x="2" y="5" width="1" height="1" />
        <rect x="6" y="5" width="1" height="1" />
        <rect x="2" y="6" width="1" height="1" />
        <rect x="6" y="6" width="1" height="1" />
        <rect x="2" y="7" width="1" height="1" />
        <rect x="6" y="7" width="1" height="1" />

        {/* n (shadow) */}
        <rect x="8" y="2" width="4" height="1" />
        <rect x="8" y="3" width="1" height="1" />
        <rect x="12" y="3" width="1" height="1" />
        <rect x="8" y="4" width="1" height="1" />
        <rect x="12" y="4" width="1" height="1" />
        <rect x="8" y="5" width="1" height="1" />
        <rect x="12" y="5" width="1" height="1" />
        <rect x="8" y="6" width="1" height="1" />
        <rect x="12" y="6" width="1" height="1" />
        <rect x="8" y="7" width="1" height="1" />
        <rect x="12" y="7" width="1" height="1" />

        {/* a (shadow) */}
        <rect x="15" y="2" width="3" height="1" />
        <rect x="14" y="3" width="1" height="1" />
        <rect x="18" y="3" width="1" height="1" />
        <rect x="14" y="4" width="5" height="1" />
        <rect x="14" y="5" width="1" height="1" />
        <rect x="18" y="5" width="1" height="1" />
        <rect x="14" y="6" width="1" height="1" />
        <rect x="18" y="6" width="1" height="1" />
        <rect x="14" y="7" width="1" height="1" />
        <rect x="18" y="7" width="1" height="1" />

        {/* m (shadow) */}
        <rect x="20" y="2" width="5" height="1" />
        <rect x="20" y="3" width="1" height="1" />
        <rect x="22" y="3" width="1" height="1" />
        <rect x="24" y="3" width="1" height="1" />
        <rect x="20" y="4" width="1" height="1" />
        <rect x="22" y="4" width="1" height="1" />
        <rect x="24" y="4" width="1" height="1" />
        <rect x="20" y="5" width="1" height="1" />
        <rect x="22" y="5" width="1" height="1" />
        <rect x="24" y="5" width="1" height="1" />
        <rect x="20" y="6" width="1" height="1" />
        <rect x="22" y="6" width="1" height="1" />
        <rect x="24" y="6" width="1" height="1" />
        <rect x="20" y="7" width="1" height="1" />
        <rect x="22" y="7" width="1" height="1" />
        <rect x="24" y="7" width="1" height="1" />

        {/* n (shadow) */}
        <rect x="26" y="2" width="4" height="1" />
        <rect x="26" y="3" width="1" height="1" />
        <rect x="30" y="3" width="1" height="1" />
        <rect x="26" y="4" width="1" height="1" />
        <rect x="30" y="4" width="1" height="1" />
        <rect x="26" y="5" width="1" height="1" />
        <rect x="30" y="5" width="1" height="1" />
        <rect x="26" y="6" width="1" height="1" />
        <rect x="30" y="6" width="1" height="1" />
        <rect x="26" y="7" width="1" height="1" />
        <rect x="30" y="7" width="1" height="1" />
      </g>

      {/* main glyph */}
      <g fill={colors.glyph}>
        {/* a */}
        <rect x="2" y="1" width="3" height="1" />
        <rect x="1" y="2" width="1" height="1" />
        <rect x="5" y="2" width="1" height="1" />
        <rect x="1" y="3" width="5" height="1" />
        <rect x="1" y="4" width="1" height="1" />
        <rect x="5" y="4" width="1" height="1" />
        <rect x="1" y="5" width="1" height="1" />
        <rect x="5" y="5" width="1" height="1" />
        <rect x="1" y="6" width="1" height="1" />
        <rect x="5" y="6" width="1" height="1" />

        {/* n */}
        <rect x="7" y="1" width="4" height="1" />
        <rect x="7" y="2" width="1" height="1" />
        <rect x="11" y="2" width="1" height="1" />
        <rect x="7" y="3" width="1" height="1" />
        <rect x="11" y="3" width="1" height="1" />
        <rect x="7" y="4" width="1" height="1" />
        <rect x="11" y="4" width="1" height="1" />
        <rect x="7" y="5" width="1" height="1" />
        <rect x="11" y="5" width="1" height="1" />
        <rect x="7" y="6" width="1" height="1" />
        <rect x="11" y="6" width="1" height="1" />

        {/* a */}
        <rect x="14" y="1" width="3" height="1" />
        <rect x="13" y="2" width="1" height="1" />
        <rect x="17" y="2" width="1" height="1" />
        <rect x="13" y="3" width="5" height="1" />
        <rect x="13" y="4" width="1" height="1" />
        <rect x="17" y="4" width="1" height="1" />
        <rect x="13" y="5" width="1" height="1" />
        <rect x="17" y="5" width="1" height="1" />
        <rect x="13" y="6" width="1" height="1" />
        <rect x="17" y="6" width="1" height="1" />

        {/* m */}
        <rect x="19" y="1" width="5" height="1" />
        <rect x="19" y="2" width="1" height="1" />
        <rect x="21" y="2" width="1" height="1" />
        <rect x="23" y="2" width="1" height="1" />
        <rect x="19" y="3" width="1" height="1" />
        <rect x="21" y="3" width="1" height="1" />
        <rect x="23" y="3" width="1" height="1" />
        <rect x="19" y="4" width="1" height="1" />
        <rect x="21" y="4" width="1" height="1" />
        <rect x="23" y="4" width="1" height="1" />
        <rect x="19" y="5" width="1" height="1" />
        <rect x="21" y="5" width="1" height="1" />
        <rect x="23" y="5" width="1" height="1" />
        <rect x="19" y="6" width="1" height="1" />
        <rect x="21" y="6" width="1" height="1" />
        <rect x="23" y="6" width="1" height="1" />

        {/* n */}
        <rect x="25" y="1" width="4" height="1" />
        <rect x="25" y="2" width="1" height="1" />
        <rect x="29" y="2" width="1" height="1" />
        <rect x="25" y="3" width="1" height="1" />
        <rect x="29" y="3" width="1" height="1" />
        <rect x="25" y="4" width="1" height="1" />
        <rect x="29" y="4" width="1" height="1" />
        <rect x="25" y="5" width="1" height="1" />
        <rect x="29" y="5" width="1" height="1" />
        <rect x="25" y="6" width="1" height="1" />
        <rect x="29" y="6" width="1" height="1" />
      </g>
    </svg>
  );
}
