import React from "react";
import { motion } from "framer-motion";

const REVENUE_GOAL = 200000;

export default function RevenueHorizon({ permits }) {
  const wonBid = permits.filter(p => p.status === "Won").reduce((s, p) => s + (p.calculated_bid || 0), 0);
  const totalBid = permits.reduce((s, p) => s + (p.calculated_bid || 0), 0);
  const realized = wonBid * 0.1;
  const goalPct = Math.min((wonBid / REVENUE_GOAL) * 100, 100);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 px-4 py-3"
      style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(24px)", borderTop: "0.5px solid rgba(255,255,255,0.08)" }}>
      <div className="max-w-7xl mx-auto flex items-center gap-6">
        {/* Metrics */}
        <div className="flex items-center gap-6 shrink-0">
          <div>
            <div className="text-[9px] uppercase tracking-[0.2em] text-white/30 mb-0.5">Pipeline</div>
            <div className="text-sm font-black text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              ${totalBid.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div>
            <div className="text-[9px] uppercase tracking-[0.2em] text-white/30 mb-0.5">Realized (10%)</div>
            <div className="text-sm font-black text-white/80" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              ${realized.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>

        {/* Progress track */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] uppercase tracking-[0.2em] text-white/30">Revenue Horizon</span>
            <span className="text-[9px] text-white/40 font-mono">{goalPct.toFixed(1)}% of $200k goal</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${goalPct}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              style={{ background: goalPct >= 100 ? "#fff" : "linear-gradient(90deg, #444 0%, #fff 100%)" }}
            />
          </div>
        </div>

        {goalPct >= 100 && (
          <div className="text-[10px] font-black tracking-widest text-white shrink-0">🎯 GOAL HIT</div>
        )}
      </div>
    </div>
  );
}