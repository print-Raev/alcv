import React from "react";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { getRegionalHeatBonus } from "@/components/proposal/regionUtils";

const HEAT_SCORES = {
  Medical: 9,
  Retail: 9,
  Restaurant: 8,
  Hospitality: 8,
  Office: 7,
  Education: 7,
  Residential: 5,
  Industrial: 4,
};

const HEAT_LABELS = {
  9: { label: "🔥 Hot Lead", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", bar: "from-red-500 to-orange-500" },
  8: { label: "🌡 High Priority", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", bar: "from-orange-400 to-amber-400" },
  7: { label: "✅ Qualified", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", bar: "from-amber-400 to-yellow-400" },
  5: { label: "⚠️ Low Margin", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", bar: "from-yellow-400 to-lime-400" },
  4: { label: "🧊 Low Priority", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", bar: "from-blue-400 to-cyan-400" },
};

export default function LeadScoreCard({ project }) {
  const baseScore = HEAT_SCORES[project.project_type] ?? null;
  const bonus = getRegionalHeatBonus(project.address);
  const score = baseScore !== null ? Math.min(10, baseScore + bonus) : null;
  const meta = score ? (HEAT_LABELS[score] ?? HEAT_LABELS[score >= 9 ? 9 : score >= 8 ? 8 : score >= 7 ? 7 : score >= 5 ? 5 : 4]) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="rounded-2xl border border-[#1f1f1f] p-5 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.05) 0%, rgba(20,20,20,1) 100%)" }}
    >
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-red-500/5 -translate-y-4 translate-x-4" />
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <Flame className="w-4 h-4 text-red-400" />
        </div>
        <span className="text-xs uppercase tracking-wider text-[#737373] font-semibold">Lead Heat Score</span>
      </div>

      {!project.project_type ? (
        <p className="text-xs text-[#737373]">Select a project type to generate heat score.</p>
      ) : (
        <div className="space-y-3">
          {/* Big score */}
          <div className="flex items-end gap-2">
            <span className={`text-5xl font-black ${meta.color}`}>{score}</span>
            <span className="text-[#737373] text-sm mb-1.5">/10</span>
          </div>

          {/* Bar */}
          <div className="w-full h-1.5 bg-[#1f1f1f] rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full bg-gradient-to-r ${meta.bar}`}
              initial={{ width: 0 }}
              animate={{ width: `${score * 10}%` }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
            />
          </div>

          {/* Label badge */}
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${meta.bg} ${meta.border} ${meta.color}`}>
            {meta.label}
          </div>

          {bonus > 0 && (
            <div className="text-[10px] text-orange-400 font-semibold">
              +{bonus} Regional Hub Bonus (Austin / Las Vegas)
            </div>
          )}
          <p className="text-[10px] text-[#737373] leading-relaxed">
            {project.project_type} projects typically have {score >= 8 ? "high margins and fast close rates" : score >= 6 ? "moderate margins worth pursuing" : "lower margins — weigh mobilization costs carefully"}.
          </p>
        </div>
      )}
    </motion.div>
  );
}