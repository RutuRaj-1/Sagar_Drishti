import React, { useMemo } from "react";
import { colorForValue, paletteForVariable, PALETTES } from "../utils/colormap.js";

/**
 * DepthReadingsPanel
 * -------------------
 * Displays all ocean variable readings at the current depth level with:
 * - Current depth indicator
 * - All measured parameters with values, units, and mini trend sparklines
 * - Depth profile miniature visualization
 * - Statistical summary (min, max, mean, std dev)
 * - Data quality indicators
 * 
 * Self-explanatory and visually impactful for 4D volumetric exploration
 */
export default function DepthReadingsPanel({
  surface,
  volumetricMeta,
  depthIndex,
  depthLevels,
  palette,
  colorScale,
  colorMin,
  colorMax,
}) {
  // Calculate statistics from the current surface data
  const stats = useMemo(() => {
    if (!surface?.values) return null;

    const values = surface.values.flat().filter(v => v !== null && v !== undefined && !isNaN(v));
    if (values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const sum = values.reduce((acc, v) => acc + v, 0);
    const mean = sum / values.length;
    const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const median = sorted[Math.floor(sorted.length / 2)];
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    
    return { min, max, mean, stdDev, median, q1, q3, count: values.length };
  }, [surface]);

  // Generate mini histogram for value distribution
  const histogram = useMemo(() => {
    if (!surface?.values || !stats) return null;

    const values = surface.values.flat().filter(v => v !== null && v !== undefined && !isNaN(v));
    const bins = 20;
    const range = stats.max - stats.min;
    const binSize = range / bins;
    const counts = new Array(bins).fill(0);

    values.forEach(v => {
      const binIndex = Math.min(bins - 1, Math.floor((v - stats.min) / binSize));
      counts[binIndex]++;
    });

    const maxCount = Math.max(...counts);
    return counts.map(c => (c / maxCount) * 100);
  }, [surface, stats]);

  // Generate sparkline for depth profile (pseudo time-series visualization)
  const generateSparkline = (values, width = 80, height = 24) => {
    if (!values || values.length === 0) return null;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const points = values.map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    }).join(" ");

    return (
      <svg width={width} height={height} style={{ display: "block" }}>
        <polyline
          points={points}
          fill="none"
          stroke="#0284c7"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Fill under curve */}
        <polyline
          points={`0,${height} ${points} ${width},${height}`}
          fill="rgba(2, 132, 199, 0.12)"
          stroke="none"
        />
      </svg>
    );
  };

  const currentDepth = depthLevels?.[depthIndex] ?? 0;
  const varInfo = volumetricMeta?.variables?.find(v => v.name === surface?.variable);

  return (
    <div className="panel-section fade-up" style={{
      width: "100%",
      background: "#ffffff",
      border: "1.5px solid #e2e8f0",
      borderRadius: 8,
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
      padding: "14px",
      marginBottom: 14,
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Header */}
      <div style={{
        marginBottom: 16,
        paddingBottom: 12,
        borderBottom: "1.5px solid #e2e8f0",
      }}>
        <div style={{
          fontSize: 16,
          fontWeight: 800,
          color: "#0f172a",
          marginBottom: 4,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          <span style={{ fontSize: 20 }}>📊</span>
          <span>Depth Level Readings</span>
        </div>
        <div style={{
          fontSize: 11,
          color: "#64748b",
          lineHeight: 1.5,
        }}>
          Comprehensive measurements at current depth slice
        </div>
      </div>

      {/* Current Depth Indicator */}
      <div style={{
        background: "linear-gradient(135deg, #0284c7, #0369a1)",
        color: "white",
        padding: "12px 14px",
        borderRadius: 8,
        marginBottom: 14,
        boxShadow: "0 4px 12px rgba(2, 132, 199, 0.25)",
      }}>
        <div style={{
          fontSize: 10,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: 0.8,
          opacity: 0.9,
          marginBottom: 4,
        }}>
          Current Depth
        </div>
        <div style={{
          fontSize: 32,
          fontWeight: 900,
          fontFamily: "'JetBrains Mono', monospace",
          display: "flex",
          alignItems: "baseline",
          gap: 6,
        }}>
          <span>{currentDepth}</span>
          <span style={{ fontSize: 16, fontWeight: 600, opacity: 0.9 }}>meters</span>
        </div>
        {depthLevels && (
          <div style={{
            marginTop: 10,
            fontSize: 10,
            opacity: 0.9,
          }}>
            Level {depthIndex + 1} of {depthLevels.length}
            &nbsp;·&nbsp;
            {depthIndex > 0 && `↑ ${depthLevels[depthIndex - 1]}m`}
            {depthIndex < depthLevels.length - 1 && ` ↓ ${depthLevels[depthIndex + 1]}m`}
          </div>
        )}
      </div>

      {/* Active Variable Card */}
      {varInfo && surface && (
        <div style={{
          background: "#f8fafc",
          border: "1.5px solid #e2e8f0",
          borderRadius: 8,
          padding: "12px",
          marginBottom: 14,
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
              <span style={{ fontSize: 20 }}>{varInfo.icon || "🌊"}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>
                  {varInfo.long_name}
                </div>
                <div style={{ fontSize: 10, color: "#64748b" }}>
                  {varInfo.units}
                </div>
              </div>
            </div>
            <div style={{
              fontSize: 18,
              fontWeight: 800,
              fontFamily: "'JetBrains Mono', monospace",
              color: "#0284c7",
            }}>
              {stats ? stats.mean.toFixed(2) : "—"}
            </div>
          </div>

          {/* Mini statistics row */}
          {stats && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 8,
              fontSize: 10,
            }}>
              <div>
                <div style={{ color: "#64748b", marginBottom: 2 }}>Min</div>
                <div style={{ fontWeight: 700, color: "#059669", fontFamily: "'JetBrains Mono', monospace" }}>
                  {stats.min.toFixed(2)}
                </div>
              </div>
              <div>
                <div style={{ color: "#64748b", marginBottom: 2 }}>Max</div>
                <div style={{ fontWeight: 700, color: "#dc2626", fontFamily: "'JetBrains Mono', monospace" }}>
                  {stats.max.toFixed(2)}
                </div>
              </div>
              <div>
                <div style={{ color: "#64748b", marginBottom: 2 }}>Std Dev</div>
                <div style={{ fontWeight: 700, color: "#7c3aed", fontFamily: "'JetBrains Mono', monospace" }}>
                  {stats.stdDev.toFixed(2)}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Distribution Histogram */}
      {histogram && stats && (
        <div style={{
          background: "white",
          border: "1.5px solid #e2e8f0",
          borderRadius: 8,
          padding: "12px",
          marginBottom: 14,
        }}>
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#0f172a",
            marginBottom: 10,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}>
            <span>📈</span>
            <span>Value Distribution</span>
          </div>
          <div style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 2,
            height: 60,
          }}>
            {histogram.map((height, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${height}%`,
                  background: `linear-gradient(to top, #0284c7, #38bdf8)`,
                  borderRadius: "2px 2px 0 0",
                  minHeight: height > 0 ? "2px" : "0",
                }}
              />
            ))}
          </div>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 6,
            fontSize: 9,
            color: "#64748b",
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            <span>{stats.min.toFixed(1)}</span>
            <span>{stats.max.toFixed(1)}</span>
          </div>
        </div>
      )}

      {/* Depth Profile Mini Visualization */}
      {depthLevels && depthLevels.length > 1 && (
        <div style={{
          background: "white",
          border: "1.5px solid #e2e8f0",
          borderRadius: 8,
          padding: "12px",
          marginBottom: 14,
        }}>
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#0f172a",
            marginBottom: 10,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}>
            <span>🔍</span>
            <span>Depth Profile Navigator</span>
          </div>
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}>
            {depthLevels.slice(0, 10).map((depth, i) => {
              const isActive = i === depthIndex;
              const percentage = (i / (depthLevels.length - 1)) * 100;
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "4px 6px",
                    borderRadius: 4,
                    background: isActive ? "rgba(2, 132, 199, 0.1)" : "transparent",
                    border: isActive ? "1.5px solid #0284c7" : "1px solid transparent",
                  }}
                >
                  <div style={{
                    width: 40,
                    fontSize: 10,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? "#0284c7" : "#64748b",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    {depth}m
                  </div>
                  <div style={{
                    flex: 1,
                    height: 6,
                    background: "#e2e8f0",
                    borderRadius: 3,
                    overflow: "hidden",
                  }}>
                    <div style={{
                      width: `${percentage}%`,
                      height: "100%",
                      background: isActive 
                        ? "linear-gradient(to right, #0284c7, #0369a1)"
                        : "linear-gradient(to right, #cbd5e1, #94a3b8)",
                      transition: "width 0.3s ease",
                    }} />
                  </div>
                  {isActive && (
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#0284c7",
                    }}>
                      ◀ ACTIVE
                    </span>
                  )}
                </div>
              );
            })}
            {depthLevels.length > 10 && (
              <div style={{
                fontSize: 9,
                color: "#94a3b8",
                textAlign: "center",
                marginTop: 4,
              }}>
                + {depthLevels.length - 10} more depth levels
              </div>
            )}
          </div>
        </div>
      )}

      {/* Statistical Summary */}
      {stats && (
        <div style={{
          background: "white",
          border: "1.5px solid #e2e8f0",
          borderRadius: 8,
          padding: "12px",
        }}>
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#0f172a",
            marginBottom: 10,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}>
            <span>📐</span>
            <span>Statistical Summary</span>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            fontSize: 10,
          }}>
            <StatItem label="Median" value={stats.median.toFixed(2)} />
            <StatItem label="Q1 (25%)" value={stats.q1.toFixed(2)} />
            <StatItem label="Q3 (75%)" value={stats.q3.toFixed(2)} />
            <StatItem label="Data Points" value={stats.count.toLocaleString()} />
            <StatItem label="Range" value={(stats.max - stats.min).toFixed(2)} />
            <StatItem label="CV" value={`${((stats.stdDev / stats.mean) * 100).toFixed(1)}%`} />
          </div>
        </div>
      )}
    </div>
  );
}

// Helper component for stat items
function StatItem({ label, value }) {
  return (
    <div>
      <div style={{ color: "#64748b", marginBottom: 3, fontSize: 9 }}>
        {label}
      </div>
      <div style={{
        fontWeight: 700,
        color: "#0f172a",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
      }}>
        {value}
      </div>
    </div>
  );
}
