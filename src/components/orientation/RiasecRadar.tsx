"use client";
import { useMemo } from "react";
import {
  RIASEC_DIMENSIONS,
  RIASEC_ORDER,
  type RiasecDimension,
} from "@/lib/orientation/riasec-constants";

interface Props {
  scores: Record<RiasecDimension, number>;
  size?: number;
  maxScore?: number;
  showLabels?: boolean;
  highlight?: RiasecDimension | null;
  /** Affiche les valeurs chiffrées à chaque sommet */
  showValues?: boolean;
  className?: string;
}

/**
 * Radar hexagonal RIASEC — visualisation en toile des 6 dimensions.
 * Composant SVG pur, sans dépendance externe.
 */
export function RiasecRadar({
  scores,
  size = 220,
  maxScore = 20,
  showLabels = true,
  highlight = null,
  showValues = false,
  className = "",
}: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - (showLabels ? 38 : 12);
  const levels = 4; // nombre de cercles concentriques

  // Coordonnées des 6 sommets (60° entre chaque, départ en haut)
  const points = useMemo(() => {
    return RIASEC_ORDER.map((dim, i) => {
      const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      const labelX = cx + Math.cos(angle) * (radius + 22);
      const labelY = cy + Math.sin(angle) * (radius + 22);
      return { dim, x, y, labelX, labelY, angle };
    });
  }, [cx, cy, radius]);

  // Polygone des scores utilisateur
  const scorePoints = points.map((p) => {
    const val = Math.max(0, Math.min(scores[p.dim] ?? 0, maxScore));
    const r = (val / maxScore) * radius;
    return {
      ...p,
      x: cx + Math.cos(p.angle) * r,
      y: cy + Math.sin(p.angle) * r,
    };
  });

  const polyPointsStr = scorePoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      role="img"
      aria-label="Radar RIASEC des scores"
    >
      <defs>
        <radialGradient id="riasecRadarFill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.45" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.25" />
        </radialGradient>
      </defs>

      {/* Grille concentrique */}
      {Array.from({ length: levels }, (_, i) => {
        const r = (radius * (i + 1)) / levels;
        const gridPoints = RIASEC_ORDER.map((_, j) => {
          const angle = (Math.PI * 2 * j) / 6 - Math.PI / 2;
          return `${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`;
        }).join(" ");
        return (
          <polygon
            key={i}
            points={gridPoints}
            fill="none"
            stroke="var(--border)"
            strokeWidth={1}
            strokeOpacity={0.6}
          />
        );
      })}

      {/* Axes radiaux */}
      {points.map((p) => (
        <line
          key={`axis-${p.dim}`}
          x1={cx}
          y1={cy}
          x2={p.x}
          y2={p.y}
          stroke="var(--border)"
          strokeWidth={1}
          strokeOpacity={0.5}
        />
      ))}

      {/* Polygone des scores */}
      <polygon
        points={polyPointsStr}
        fill="url(#riasecRadarFill)"
        stroke="var(--primary)"
        strokeWidth={2}
        strokeLinejoin="round"
        style={{ transition: "all 0.6s cubic-bezier(0.22,1,0.36,1)" }}
      />

      {/* Points sur les sommets */}
      {scorePoints.map((p) => {
        const dim = RIASEC_DIMENSIONS[p.dim];
        const isHi = highlight === p.dim;
        return (
          <g key={`pt-${p.dim}`}>
            <circle
              cx={p.x}
              cy={p.y}
              r={isHi ? 6 : 4}
              fill={dim.couleur}
              stroke="var(--background)"
              strokeWidth={2}
              style={{ transition: "r 0.3s ease" }}
            />
            {showValues && (
              <text
                x={p.x}
                y={p.y - 10}
                textAnchor="middle"
                fontSize={10}
                fontWeight={700}
                fill={dim.couleur}
              >
                {scores[p.dim] ?? 0}
              </text>
            )}
          </g>
        );
      })}

      {/* Étiquettes des dimensions */}
      {showLabels &&
        points.map((p) => {
          const dim = RIASEC_DIMENSIONS[p.dim];
          const isHi = highlight === p.dim;
          return (
            <g key={`label-${p.dim}`}>
              <circle
                cx={p.labelX}
                cy={p.labelY}
                r={11}
                fill={isHi ? dim.couleur : "var(--background)"}
                stroke={dim.couleur}
                strokeWidth={isHi ? 2 : 1.5}
                style={{ transition: "all 0.3s ease" }}
              />
              <text
                x={p.labelX}
                y={p.labelY + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={11}
                fontWeight={800}
                fill={isHi ? "#fff" : dim.couleur}
                style={{ fontFamily: "var(--font-geist-mono, monospace)" }}
              >
                {p.dim}
              </text>
              <text
                x={p.labelX}
                y={p.labelY + 22}
                textAnchor="middle"
                fontSize={9}
                fontWeight={600}
                fill="var(--muted-foreground)"
              >
                {dim.label}
              </text>
            </g>
          );
        })}
    </svg>
  );
}
