import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, Info } from "lucide-react";

// Historical averages for AllClear projects (seeded from reference data)
const HISTORICAL_AVERAGES = {
  Retail:      { sqft: 28000, price_per_sqft: 0.25, total: 7000 },
  Restaurant:  { sqft: 5500,  price_per_sqft: 0.28, total: 1540 },
  Medical:     { sqft: 18000, price_per_sqft: 0.30, total: 5400 },
  Office:      { sqft: 22000, price_per_sqft: 0.25, total: 5500 },
  Residential: { sqft: 50000, price_per_sqft: 0.22, total: 11000 },
  Industrial:  { sqft: 80000, price_per_sqft: 0.18, total: 14400 },
  Education:   { sqft: 30000, price_per_sqft: 0.26, total: 7800 },
  Hospitality: { sqft: 35000, price_per_sqft: 0.27, total: 9450 },
};

const DEVIATION_THRESHOLD = 0.20; // 20%

function getDeviation(value, avg) {
  if (!avg || !value) return null;
  return (value - avg) / avg;
}

function FlagRow({ label, value, avg, unit = "", format }) {
  const dev = getDeviation(value, avg);
  if (dev === null) return null;

  const absDev = Math.abs(dev);
  const isFlagged = absDev > DEVIATION_THRESHOLD;
  const isHigh = dev > 0;
  const pct = Math.round(absDev * 100);

  const fmt = format || (v => `${unit}${Number(v).toLocaleString()}`);

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center justify-between p-2.5 rounded-lg border text-xs ${
        isFlagged
          ? isHigh
            ? "bg-red-500/8 border-red-500/25"
            : "bg-amber-500/8 border-amber-500/25"
          : "bg-emerald-500/5 border-emerald-500/15"
      }`}
    >
      <div className="flex items-center gap-2">
        {isFlagged ? (
          isHigh
            ? <TrendingUp className="w-3.5 h-3.5 text-red-400 shrink-0" />
            : <TrendingDown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        ) : (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        )}
        <span className={isFlagged ? (isHigh ? "text-red-300" : "text-amber-300") : "text-emerald-300"}>
          {label}
        </span>
      </div>
      <div className="flex items-center gap-2 text-right">
        <span className={`font-bold ${isFlagged ? (isHigh ? "text-red-400" : "text-amber-400") : "text-white"}`}>
          {fmt(value)}
        </span>
        {isFlagged && (
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
            isHigh ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
          }`}>
            {isHigh ? "+" : "-"}{pct}%
          </span>
        )}
      </div>
    </motion.div>
  );
}

export default function ConflictFlagPanel({ project }) {
  const avg = HISTORICAL_AVERAGES[project.project_type];
  if (!avg || !project.project_type) return null;

  const sqftDev = getDeviation(project.square_footage, avg.sqft);
  const priceDev = getDeviation(project.price_per_sqft, avg.price_per_sqft);
  const totalDev = getDeviation(project.total_price || (project.square_footage * project.price_per_sqft), avg.total);

  const hasFlags = [sqftDev, priceDev, totalDev].some(d => d !== null && Math.abs(d) > DEVIATION_THRESHOLD);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-4 ${hasFlags ? "border-red-500/25" : "border-emerald-500/20"}`}
      style={{ background: hasFlags ? "linear-gradient(135deg, rgba(239,68,68,0.04) 0%, rgba(20,20,20,1) 100%)" : "linear-gradient(135deg, rgba(16,185,129,0.04) 0%, rgba(20,20,20,1) 100%)" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${hasFlags ? "bg-red-500/10 border border-red-500/20" : "bg-emerald-500/10 border border-emerald-500/20"}`}>
          {hasFlags
            ? <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
        </div>
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-[#737373]">Conflict Flags</span>
          {hasFlags && (
            <span className="ml-2 text-[9px] bg-red-500/15 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded-full">
              Deviation &gt;20%
            </span>
          )}
        </div>
        <div className="ml-auto flex items-center gap-1 text-[10px] text-[#737373]">
          <Info className="w-3 h-3" />
          vs. {project.project_type} avg
        </div>
      </div>

      <div className="space-y-1.5">
        <FlagRow label="Square Footage" value={project.square_footage} avg={avg.sqft} format={v => `${Number(v).toLocaleString()} sqft`} />
        <FlagRow label="Rate / sqft" value={project.price_per_sqft} avg={avg.price_per_sqft} format={v => `$${Number(v).toFixed(2)}`} />
        <FlagRow
          label="Total Bid"
          value={(project.square_footage || 0) * (project.price_per_sqft || 0.25)}
          avg={avg.total}
          format={v => `$${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
        />
      </div>

      {!hasFlags && (
        <p className="text-[10px] text-emerald-400/60 mt-2 text-center">All values within normal range for {project.project_type} projects</p>
      )}
    </motion.div>
  );
}