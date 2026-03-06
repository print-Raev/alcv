import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DollarSign, Clock, AlertTriangle, Zap } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { detectState, STATE_FLAGS } from "@/components/proposal/regionUtils";

function detectNightShiftRisk(project) {
  const text = [project.project_name, project.notes, project.address, project.ai_extracted_detail].filter(Boolean).join(" ").toLowerCase();
  return /mall|shopping center|high.?traffic|anchor store|retail center|plaza|lifestyle center/.test(text);
}

function getContractStatus(status) {
  const map = {
    Draft: { label: "In Preparation", color: "text-[#737373]", bg: "bg-[#1a1a1a]", border: "border-[#1f1f1f]", dot: "bg-[#737373]" },
    Sent: { label: "Awaiting Signature", color: "text-amber-400", bg: "bg-amber-500/5", border: "border-amber-500/20", dot: "bg-amber-400" },
    Accepted: { label: "Contract Signed", color: "text-emerald-400", bg: "bg-emerald-500/5", border: "border-emerald-500/20", dot: "bg-emerald-400" },
    Declined: { label: "Declined", color: "text-rose-400", bg: "bg-rose-500/5", border: "border-rose-500/20", dot: "bg-rose-400" },
  };
  return map[status] || map.Draft;
}

function getProfitGlow(project, total) {
  const outOfRadius = (project.mobilization_fee || 0) > 0 && (project.distance_from_base || 0) > 100;
  if (outOfRadius) return { shadow: "0 0 24px 4px rgba(239,68,68,0.18)", border: "rgba(239,68,68,0.35)" };
  const highMarginTypes = ["Medical", "Retail", "Hospitality"];
  if (highMarginTypes.includes(project.project_type)) return { shadow: "0 0 24px 4px rgba(234,179,8,0.18)", border: "rgba(234,179,8,0.35)" };
  if (total > 2000) return { shadow: "0 0 24px 4px rgba(34,197,94,0.18)", border: "rgba(34,197,94,0.35)" };
  return { shadow: "none", border: "rgba(249,115,22,0.15)" };
}

export default function BentoCards({ project, onMobilizationToggle }) {
  const [driveTimeEnabled, setDriveTimeEnabled] = useState(project.mobilization_fee > 0);
  const detectedState = detectState(project.address);
  const stateFlag = detectedState ? STATE_FLAGS[detectedState] : null;
  const isOutOfState = detectedState && detectedState !== "AZ";
  const basePrice = (project.square_footage || 0) * (project.price_per_sqft || 0.25);
  const nightShiftFlag = detectNightShiftRisk(project);
  const nightShiftSurcharge = nightShiftFlag ? basePrice * 0.15 : 0;
  const total = basePrice + (project.mobilization_fee || 0) + nightShiftSurcharge;
  const contractStatus = getContractStatus(project.status);
  const profitGlow = getProfitGlow(project, total);

  const handleDriveToggle = (val) => {
    setDriveTimeEnabled(val);
    onMobilizationToggle?.(val ? 250 : 0);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

      {/* Pricing Logic Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`bento-card rounded-2xl border p-5 relative overflow-hidden transition-all duration-700 ${["Medical","Retail"].includes(project.project_type) ? "bento-card-gold-glow" : ""}`}
        style={{
          borderColor: profitGlow.border,
          boxShadow: ["Medical","Retail"].includes(project.project_type) ? undefined : profitGlow.shadow,
        }}
      >
        <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-orange-500/5 -translate-y-4 translate-x-4" />
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-orange-400" />
          </div>
          <span className="text-xs uppercase tracking-wider text-[#737373] font-semibold">Pricing Logic</span>
        </div>
        <div className="space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-xs text-[#737373]">Rate / sqft</span>
            <span className="text-sm font-bold text-white mono-data">${project.price_per_sqft ?? 0.25}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-[#737373]">Area</span>
            <span className="text-sm font-bold text-white mono-data">{(project.square_footage || 0).toLocaleString()} sqft</span>
          </div>
          {(project.mobilization_fee || 0) > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-[#737373]">Fuel/Travel Surcharge</span>
              <span className="text-sm font-bold text-amber-400">+${(project.mobilization_fee || 0).toLocaleString()}</span>
            </div>
          )}
          {nightShiftFlag && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-rose-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Night-Shift Labor</span>
              <span className="text-sm font-bold text-rose-400">+${nightShiftSurcharge.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          <div className="border-t border-white/5 pt-2.5 mt-2.5 flex justify-between items-center">
            <span className="text-xs font-semibold text-white">Total Bid</span>
            <span className="text-lg font-black text-orange-400 mono-data">${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </motion.div>

      {/* Drive-Time / Mobilization Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bento-card rounded-2xl border p-5 relative overflow-hidden"
        style={{}}
      >
        <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-blue-500/5 -translate-y-4 translate-x-4" />
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-xs uppercase tracking-wider text-[#737373] font-semibold">Mobilization</span>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-[#737373]">Base location</p>
            <p className="text-sm font-semibold text-white mt-0.5">Chandler, AZ 85225</p>
          </div>
          <div className="flex items-center justify-between bg-[#0a0a0a] rounded-xl px-4 py-3 border border-[#1f1f1f]">
            <div>
              <p className="text-xs font-semibold text-white">
                {isOutOfState ? `${detectedState} Regional Surcharge` : ">50 Miles from Chandler"}
              </p>
              <p className="text-[10px] text-[#737373] mt-0.5">
                {isOutOfState ? `$500–$1,500 based on mileage from HQ` : "Adds $250 Fuel/Travel Surcharge"}
              </p>
            </div>
            <Switch
              checked={driveTimeEnabled}
              onCheckedChange={handleDriveToggle}
              className="data-[state=checked]:bg-blue-500"
            />
          </div>
          <AnimatePresence>
            {driveTimeEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 text-xs text-amber-400"
              >
                <Zap className="w-3 h-3 shrink-0" />
                <span>$250 fuel/travel surcharge applied</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Contract Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`bento-card rounded-2xl border p-5 relative overflow-hidden`}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${contractStatus.border}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${contractStatus.dot} animate-pulse`} />
          </div>
          <span className="text-xs uppercase tracking-wider text-[#737373] font-semibold">Contract Status</span>
          {stateFlag && (
            <span className="ml-auto text-base" title={`Detected state: ${detectedState}`}>{stateFlag}</span>
          )}
        </div>
        <div className="space-y-3">
          <div>
            <p className={`text-lg font-black ${contractStatus.color}`}>{contractStatus.label}</p>
            <p className="text-[10px] text-[#737373] mt-0.5 uppercase tracking-widest">{project.status || "Draft"}</p>
          </div>

          {nightShiftFlag && (
            <div className="p-2.5 rounded-lg border bg-rose-500/8 border-rose-500/25 flex items-start gap-2">
              <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-rose-300">Mall / High-Traffic — +15% Night-Shift surcharge active</p>
            </div>
          )}

          <div className="pt-2 border-t border-[#1f1f1f] space-y-2">
            <div className="flex items-center justify-between bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-2">
              <span className="text-[10px] text-emerald-300 font-semibold">💳 Payment Terms</span>
              <span className="text-[10px] text-emerald-400 font-bold">Net-15 / CO</span>
            </div>
            <div className="flex items-center justify-between bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2">
              <span className="text-[10px] text-amber-300 font-semibold">⚠️ Dry Run Fee</span>
              <span className="text-[10px] text-amber-400 font-bold">$250 · 48hr Notice</span>
            </div>
          </div>
        </div>
      </motion.div>

    </div>
  );
}