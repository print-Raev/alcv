import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Plus, Check, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// High-value keyword → surcharge config
const SURCHARGE_RULES = [
  {
    keywords: ["polished concrete", "concrete polish", "burnished concrete"],
    label: "Polished Concrete Treatment",
    description: "Diamond-pad polishing, densifier application, guard coat",
    surcharge: 0.08,
    unit: "per sqft",
    color: "amber",
  },
  {
    keywords: ["epoxy", "epoxy flooring", "epoxy coating", "epoxy resin"],
    label: "Epoxy Floor Care",
    description: "Chemical-safe scrubbing, non-abrasive polish, grout line detail",
    surcharge: 0.06,
    unit: "per sqft",
    color: "purple",
  },
  {
    keywords: ["high-dusting", "high dusting", "high ceiling", "tall ceiling", "warehouse ceiling", "open ceiling", "exposed truss", "lobby", "atrium", "high ceilings", "12ft", "12 ft", "15ft", "20ft", "vaulted"],
    label: "High-Reach Equipment (Scissor Lift)",
    description: "12ft Rule triggered — lobby/atrium/high-ceiling detected. Scissor lift rental + certified operator required.",
    surcharge: 850,
    unit: "flat",
    color: "blue",
  },
  {
    keywords: ["curtain wall", "glass curtain", "exterior glass", "floor-to-ceiling glass", "storefront glass"],
    label: "Curtain Wall / Exterior Glass",
    description: "Water-fed pole system, streak-free exterior glass clean",
    surcharge: 0.05,
    unit: "per sqft",
    color: "cyan",
  },
  {
    keywords: ["vct", "vinyl tile", "luxury vinyl", "lvt", "lvp"],
    label: "VCT / LVT Strip & Wax",
    description: "Floor stripping, 3-coat finish wax, burnish",
    surcharge: 0.04,
    unit: "per sqft",
    color: "emerald",
  },
  {
    keywords: ["terrazzo", "marble", "travertine", "natural stone"],
    label: "Natural Stone Restoration",
    description: "pH-neutral clean, stone sealer application",
    surcharge: 0.09,
    unit: "per sqft",
    color: "rose",
  },
];

const colorMap = {
  amber:   { bg: "bg-amber-500/8",  border: "border-amber-500/20",  text: "text-amber-400",  badge: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  purple:  { bg: "bg-purple-500/8", border: "border-purple-500/20", text: "text-purple-400", badge: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  blue:    { bg: "bg-blue-500/8",   border: "border-blue-500/20",   text: "text-blue-400",   badge: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  cyan:    { bg: "bg-cyan-500/8",   border: "border-cyan-500/20",   text: "text-cyan-400",   badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
  emerald: { bg: "bg-emerald-500/8",border: "border-emerald-500/20",text: "text-emerald-400",badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  rose:    { bg: "bg-rose-500/8",   border: "border-rose-500/20",   text: "text-rose-400",   badge: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
};

function detectSurcharges(text) {
  if (!text) return [];
  const lower = text.toLowerCase();
  return SURCHARGE_RULES.filter(rule =>
    rule.keywords.some(kw => lower.includes(kw))
  );
}

export default function SurchargeDetector({ project, onAddSurcharge }) {
  const [added, setAdded] = useState([]);
  const [expanded, setExpanded] = useState(true);

  const detectionText = [
    project.ai_extracted_detail,
    project.cleaning_challenge,
    project.notes,
    project.project_name,
    project.address,
  ].filter(Boolean).join(" ");

  const detected = detectSurcharges(detectionText);

  const handleAdd = (rule) => {
    const value = rule.unit === "flat"
      ? rule.surcharge
      : (project.square_footage || 0) * rule.surcharge;

    onAddSurcharge?.(rule.label, value);
    setAdded(prev => [...prev, rule.label]);
  };

  if (detected.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-orange-500/20 overflow-hidden"
      style={{ background: "linear-gradient(135deg, rgba(249,115,22,0.05) 0%, rgba(20,20,20,1) 100%)" }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-5 py-4"
      >
        <div className="w-7 h-7 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-orange-400" />
        </div>
        <span className="text-xs uppercase tracking-wider text-[#737373] font-semibold flex-1 text-left">
          Surcharge Suggestions
        </span>
        <Badge className="bg-orange-500/15 text-orange-400 border-orange-500/20 text-[9px] mr-2">
          {detected.length} detected
        </Badge>
        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-[#737373]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#737373]" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 space-y-2">
              <p className="text-[10px] text-[#737373] mb-3">
                AI detected high-value keywords in your blueprint. These specialized services command premium rates.
              </p>
              {detected.map((rule, i) => {
                const c = colorMap[rule.color];
                const isAdded = added.includes(rule.label);
                const value = rule.unit === "flat"
                  ? rule.surcharge
                  : (project.square_footage || 0) * rule.surcharge;

                return (
                  <motion.div
                    key={rule.label}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className={`flex items-start gap-3 p-3 rounded-xl border ${c.bg} ${c.border}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-xs font-semibold ${c.text}`}>{rule.label}</span>
                        <Badge className={`text-[9px] ${c.badge}`}>
                          {rule.unit === "flat"
                            ? `+$${rule.surcharge.toLocaleString()} flat`
                            : `+$${rule.surcharge}/sqft`}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-[#737373] leading-relaxed">{rule.description}</p>
                      {rule.unit !== "flat" && project.square_footage > 0 && (
                        <p className={`text-[10px] font-bold ${c.text} mt-1`}>
                          = +${value.toLocaleString(undefined, { minimumFractionDigits: 2 })} on this project
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      disabled={isAdded}
                      onClick={() => handleAdd(rule)}
                      className={`shrink-0 h-7 text-[10px] px-2.5 gap-1 ${
                        isAdded
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                          : `${c.bg} ${c.text} border ${c.border} hover:opacity-80`
                      }`}
                    >
                      {isAdded ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                      {isAdded ? "Added" : "Add"}
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}