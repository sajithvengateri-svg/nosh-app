import React from "react";
import Svg, {
  Path, Rect, Defs, LinearGradient, Stop, G, ClipPath, Ellipse, Line,
} from "react-native-svg";

interface BunkaKnifeProps {
  width: number;
  height: number;
  edgeColor?: string;
  showEdgeGlow?: boolean;
  silhouette?: boolean;
}

/**
 * Japanese Bunka Aogami Super Kurouchi knife.
 * K-tip (reverse tanto), two-tone kurouchi/hagane finish, octagonal wa-handle.
 */
export default function BunkaKnifeSvg({
  width,
  height,
  edgeColor = "#059669",
  showEdgeGlow = false,
  silhouette = false,
}: BunkaKnifeProps) {
  if (silhouette) {
    return (
      <Svg width={width} height={height} viewBox="0 0 320 80">
        {/* Full knife silhouette — dark shape */}
        <Path
          d="M5,38 L10,35 L140,30 L180,24 L210,20 L230,22 L238,30
             L240,36 L240,38
             L242,38 L248,34 L250,34 L250,42 L248,42 L242,40 L240,40
             L240,42 L238,50 L200,55 L140,52 L10,44 L5,42 Z
             M250,34 L260,32 L270,32 Q275,32 278,34 L310,36 Q315,38 310,40
             L278,42 Q275,44 270,44 L260,44 L250,42 Z"
          fill="#111"
          opacity={0.9}
        />
      </Svg>
    );
  }

  return (
    <Svg width={width} height={height} viewBox="0 0 320 80">
      <Defs>
        {/* Kurouchi (dark forge scale) — upper blade */}
        <LinearGradient id="kurouchi" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#1a1a1a" />
          <Stop offset="40%" stopColor="#2d2d2d" />
          <Stop offset="70%" stopColor="#383838" />
          <Stop offset="100%" stopColor="#3d3d3d" />
        </LinearGradient>

        {/* Hagane (polished steel) — lower blade */}
        <LinearGradient id="hagane" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor="#e5e7eb" />
          <Stop offset="30%" stopColor="#d1d5db" />
          <Stop offset="60%" stopColor="#c4c8ce" />
          <Stop offset="100%" stopColor="#9ca3af" />
        </LinearGradient>

        {/* Cutting edge */}
        <LinearGradient id="cuttingEdge" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor={edgeColor} stopOpacity={showEdgeGlow ? "1" : "0.7"} />
          <Stop offset="50%" stopColor={edgeColor} stopOpacity={showEdgeGlow ? "0.9" : "0.5"} />
          <Stop offset="100%" stopColor={edgeColor} stopOpacity={showEdgeGlow ? "1" : "0.7"} />
        </LinearGradient>

        {/* Wa-handle — magnolia wood */}
        <LinearGradient id="waHandle" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#d4a574" />
          <Stop offset="30%" stopColor="#c4956a" />
          <Stop offset="70%" stopColor="#b88860" />
          <Stop offset="100%" stopColor="#a87a52" />
        </LinearGradient>

        {/* Buffalo horn ferrule */}
        <LinearGradient id="ferrule" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#2a2a2a" />
          <Stop offset="50%" stopColor="#1a1a1a" />
          <Stop offset="100%" stopColor="#111111" />
        </LinearGradient>

        {/* Clip for kurouchi upper region */}
        <ClipPath id="upperBlade">
          <Path d="M10,35 L140,28 L180,22 L210,18 L230,20 L238,28 L240,36 L240,38 L10,38 Z" />
        </ClipPath>

        {/* Clip for hagane lower region */}
        <ClipPath id="lowerBlade">
          <Path d="M10,38 L240,38 L240,40 L238,50 L200,55 L140,52 L10,44 Z" />
        </ClipPath>

        {/* Full blade outline for reference */}
        <ClipPath id="fullBlade">
          <Path d="M10,35 L140,28 L180,22 L210,18 L230,20 L238,28 L240,36 L240,40 L238,50 L200,55 L140,52 L10,44 Z" />
        </ClipPath>
      </Defs>

      {/* === BLADE === */}
      <G>
        {/* Kurouchi region (upper 55%) — dark forge scale */}
        <G clipPath="url(#upperBlade)">
          <Rect x="5" y="14" width="240" height="28" fill="url(#kurouchi)" />
          {/* Forge scale texture — small irregular marks */}
          <Ellipse cx="60" cy="33" rx="8" ry="1.5" fill="#252525" opacity={0.6} />
          <Ellipse cx="100" cy="30" rx="10" ry="1" fill="#222" opacity={0.5} />
          <Ellipse cx="150" cy="27" rx="7" ry="1.2" fill="#2a2a2a" opacity={0.4} />
          <Ellipse cx="190" cy="24" rx="6" ry="1" fill="#252525" opacity={0.5} />
          <Ellipse cx="80" cy="36" rx="12" ry="0.8" fill="#333" opacity={0.3} />
          <Ellipse cx="170" cy="30" rx="9" ry="0.7" fill="#303030" opacity={0.4} />
          <Ellipse cx="220" cy="26" rx="5" ry="0.8" fill="#2e2e2e" opacity={0.5} />
        </G>

        {/* Hagane region (lower 45%) — polished steel */}
        <G clipPath="url(#lowerBlade)">
          <Rect x="5" y="36" width="240" height="22" fill="url(#hagane)" />
          {/* Steel shine highlights */}
          <Line x1="30" y1="42" x2="180" y2="46" stroke="#f0f0f0" strokeWidth={0.5} opacity={0.3} />
          <Line x1="50" y1="44" x2="160" y2="48" stroke="#fff" strokeWidth={0.3} opacity={0.2} />
        </G>

        {/* Shinogi line — wavy boundary between kurouchi and hagane */}
        <Path
          d="M10,39 Q40,37 70,38.5 Q100,40 130,38 Q160,36 190,37.5 Q210,39 230,37 L238,36"
          stroke="#4b5563"
          strokeWidth={0.8}
          fill="none"
          opacity={0.6}
        />

        {/* Blade spine highlight */}
        <Path
          d="M10,35 L140,28 L180,22 L210,18 L230,20 L238,28"
          stroke="#555"
          strokeWidth={0.4}
          fill="none"
          opacity={0.4}
        />

        {/* K-tip (reverse tanto) — sharp angled tip */}
        <Path
          d="M230,20 L238,28 L240,36 L240,40 L238,50"
          stroke="#6b7280"
          strokeWidth={0.5}
          fill="none"
          opacity={0.5}
        />

        {/* Blade outline */}
        <Path
          d="M10,35 L140,28 L180,22 L210,18 L230,20 L238,28 L240,36 L240,40 L238,50 L200,55 L140,52 L10,44 Z"
          stroke="#555"
          strokeWidth={0.6}
          fill="none"
        />

        {/* Cutting edge — the sharp bottom edge */}
        <Path
          d="M10,44 L140,52 L200,55 L238,50 L240,42"
          stroke="url(#cuttingEdge)"
          strokeWidth={showEdgeGlow ? 2.5 : 1.2}
          fill="none"
          opacity={showEdgeGlow ? 1 : 0.8}
        />
        {/* Extra outer glow when sharpening in zone */}
        {showEdgeGlow && (
          <Path
            d="M10,44 L140,52 L200,55 L238,50 L240,42"
            stroke={edgeColor}
            strokeWidth={5}
            fill="none"
            opacity={0.2}
          />
        )}
      </G>

      {/* === TANG / BLADE-HANDLE JUNCTION === */}
      <Path
        d="M240,36 L242,36 L242,40 L240,40 Z"
        fill="#6b7280"
      />

      {/* === BUFFALO HORN FERRULE (machi) === */}
      <Rect x="242" y="32" width="10" height="16" rx={1} fill="url(#ferrule)" />
      {/* Ferrule ring detail */}
      <Line x1="244" y1="32" x2="244" y2="48" stroke="#333" strokeWidth={0.5} opacity={0.6} />
      <Line x1="250" y1="32" x2="250" y2="48" stroke="#333" strokeWidth={0.5} opacity={0.6} />

      {/* === WA-HANDLE (octagonal magnolia wood) === */}
      {/* Main handle body */}
      <Path
        d="M252,32 L300,34 Q308,36 308,40 Q308,44 300,46 L252,48 Z"
        fill="url(#waHandle)"
      />
      {/* Octagonal facet lines — subtle edges */}
      <Line x1="255" y1="33" x2="298" y2="35" stroke="#a07050" strokeWidth={0.4} opacity={0.5} />
      <Line x1="255" y1="47" x2="298" y2="45" stroke="#a07050" strokeWidth={0.4} opacity={0.5} />
      {/* Wood grain lines */}
      <Line x1="258" y1="36" x2="295" y2="37" stroke="#b08060" strokeWidth={0.3} opacity={0.25} />
      <Line x1="260" y1="39" x2="300" y2="39.5" stroke="#b08060" strokeWidth={0.3} opacity={0.2} />
      <Line x1="258" y1="42" x2="296" y2="42.5" stroke="#b08060" strokeWidth={0.3} opacity={0.25} />
      <Line x1="260" y1="44.5" x2="294" y2="44" stroke="#b08060" strokeWidth={0.3} opacity={0.2} />
      {/* Handle end cap */}
      <Path
        d="M300,34 Q310,36 310,40 Q310,44 300,46"
        fill="#c4956a"
        stroke="#a07050"
        strokeWidth={0.5}
      />
      {/* Handle outline */}
      <Path
        d="M252,32 L300,34 Q310,36 310,40 Q310,44 300,46 L252,48 Z"
        stroke="#8a6a4a"
        strokeWidth={0.6}
        fill="none"
      />
      {/* Wood shine highlight */}
      <Line x1="260" y1="35" x2="295" y2="36.5" stroke="#e0c0a0" strokeWidth={0.4} opacity={0.3} />
    </Svg>
  );
}
