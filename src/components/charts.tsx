import { useState } from "react";
import { money, compact } from "../domain";
export function TrendChart({
  data,
  labels = ["Week 1", "Week 2", "Week 3", "Week 4"],
}: {
  data: { revenue: number; profit: number }[];
  labels?: string[];
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max =
    Math.max(...data.flatMap((x) => [x.revenue, Math.abs(x.profit)]), 1) * 1.2;
  const min = Math.min(...data.map((x) => x.profit), 0);
  const y = (n: number) => 185 - ((n - min) / (max - min)) * 160;
  const x = (i: number) => 65 + i * (530 / Math.max(data.length - 1, 1));
  const path = (key: "revenue" | "profit") =>
    data.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d[key])}`).join(" ");
  return (
    <div className="chart">
      <svg
        viewBox="0 0 650 240"
        role="img"
        aria-label="Weekly earned revenue and gross profit chart"
      >
        {Array.from({ length: 4 }, (_, i) => {
          const v = min + ((max - min) * i) / 3;
          return (
            <g key={i}>
              <line
                x1="65"
                x2="600"
                y1={y(v)}
                y2={y(v)}
                stroke="#eeede7"
                strokeDasharray="3 4"
              />
              <text x="0" y={y(v) + 4}>
                {compact(v)}
              </text>
            </g>
          );
        })}
        <path
          d={`${path("revenue")} L${x(data.length - 1)},${y(0)} L65,${y(0)} Z`}
          fill="#b3925a"
          opacity=".07"
        />
        <path
          d={path("revenue")}
          stroke="#b3925a"
          fill="none"
          strokeWidth="2.7"
          strokeLinejoin="round"
        />
        <path
          d={path("profit")}
          stroke="#476655"
          fill="none"
          strokeWidth="2.7"
          strokeLinejoin="round"
        />
        {data.map((d, i) => (
          <g
            key={i}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <rect
              x={x(i) - 35}
              y="20"
              width="70"
              height="180"
              fill="transparent"
            />
            <circle
              cx={x(i)}
              cy={y(d.revenue)}
              r="4"
              fill="#fff"
              stroke="#b3925a"
              strokeWidth="2"
            />
            <text x={x(i)} y="225" textAnchor="middle">
              {labels[i]}
            </text>
            <title>{`${labels[i]}: earned ${money(d.revenue)}, gross profit ${money(d.profit)}`}</title>
          </g>
        ))}
      </svg>
      {hover !== null && (
        <div className="chart-tip">
          <strong>{labels[hover]}</strong>
          <span>Revenue {money(data[hover].revenue)}</span>
          <span>Gross profit {money(data[hover].profit)}</span>
        </div>
      )}
      <div className="chart-legend">
        <span>
          <i style={{ background: "#b3925a" }} />
          Earned revenue
        </span>
        <span>
          <i style={{ background: "#476655" }} />
          Gross profit
        </span>
      </div>
    </div>
  );
}
export function CompareBars({
  rows,
  onRow,
}: {
  rows: { label: string; revenue: number; profit: number }[];
  onRow?: (i: number) => void;
}) {
  const max = Math.max(...rows.map((r) => r.revenue), 1);
  return (
    <div className="compare-bars">
      {rows.map((r, i) => (
        <button key={r.label} onClick={() => onRow?.(i)} disabled={!onRow}>
          <div>
            <strong>{r.label}</strong>
            <span>{money(r.profit)} contribution</span>
          </div>
          <div className="bar-track">
            <span
              className="bar-revenue"
              style={{ width: `${(r.revenue / max) * 100}%` }}
            />
            <span
              className={`bar-profit ${r.profit < 0 ? "negative" : ""}`}
              style={{
                width: `${Math.max((Math.abs(r.profit) / max) * 100, 1)}%`,
              }}
            />
          </div>
        </button>
      ))}
      <div className="chart-legend">
        <span>
          <i style={{ background: "#e4ded1" }} />
          Revenue
        </span>
        <span>
          <i style={{ background: "#476655" }} />
          Contribution
        </span>
      </div>
    </div>
  );
}
