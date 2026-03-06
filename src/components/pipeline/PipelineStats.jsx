import React from "react";

const REVENUE_GOAL = 200000;

const STAGE_COLORS = {
  Unclaimed: "#333",
  "In Progress": "#666",
  "Bid Sent": "#999",
  Won: "#fff",
  Lost: "#ef4444",
};

export default function PipelineStats({ permits }) {
  const total = permits.length;
  const totalBid = permits.reduce((s, p) => s + (p.calculated_bid || 0), 0);
  const wonBid = permits.filter(p => p.status === "Won").reduce((s, p) => s + (p.calculated_bid || 0), 0);
  const realized = wonBid * 0.1;
  const goalPct = Math.min((wonBid / REVENUE_GOAL) * 100, 100);

  const stages = ["Unclaimed", "In Progress", "Bid Sent", "Won", "Lost"];
  const counts = stages.map(s => ({ label: s, count: permits.filter(p => p.status === s).length }));

  const stats = [
    { label: "TOTAL PERMITS", value: total.toLocaleString() },
    { label: "PIPELINE VALUE", value: `$${totalBid.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
    { label: "WON REVENUE", value: `$${wonBid.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
    { label: "UNCLAIMED", value: counts[0].count.toLocaleString(), alert: true },
  ];

  return (
    <div className="mb-8">
      {/* Stat grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {stats.map((s, i) => (
          <div key={i} className="rounded-[28px] p-5"
            style={{
              background: s.alert ? "#111" : "#0a0a0a",
              border: s.alert ? "0.5px solid rgba(255,255,255,0.18)" : "0.5px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(40px)",
            }}>
            <div className="text-[9px] uppercase tracking-[0.25em] mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>{s.label}</div>
            <div className="text-2xl font-black tracking-tight text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Stage bar */}
      <div className="rounded-[28px] p-4" style={{ background: "#0a0a0a", border: "0.5px solid rgba(255,255,255,0.08)" }}>
        <div className="flex gap-0.5 h-2 rounded-full overflow-hidden mb-3">
          {counts.map(({ label, count }) => {
            const pct = total > 0 ? (count / total) * 100 : 0;
            return pct > 0 ? (
              <div key={label} className="h-full transition-all" style={{ width: `${pct}%`, background: STAGE_COLORS[label] }} title={`${label}: ${count}`} />
            ) : null;
          })}
        </div>
        <div className="flex flex-wrap gap-4">
          {counts.map(({ label, count }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: STAGE_COLORS[label] }} />
              <span className="text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>
                {label} <strong style={{ color: "#fff" }}>{count}</strong>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}