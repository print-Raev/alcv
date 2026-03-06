import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { TrendingUp, Loader2, Plus, Check, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

// Known scope keywords — if absent from blueprint text, flag as upsell
const UPSELL_CHECKS = [
  { key: "exterior_glass", label: "Exterior Glass Cleaning", trigger: ["exterior glass", "curtain wall", "storefront"], description: "Water-fed pole system for exterior glass — often missed in bid scope." },
  { key: "pressure_washing", label: "Pressure Washing", trigger: ["pressure wash", "power wash", "exterior concrete"], description: "Sidewalks, loading docks, and building exterior." },
  { key: "floor_seal", label: "Floor Sealing / Waxing", trigger: ["floor seal", "wax", "vct strip", "burnish"], description: "VCT/LVT strip & 3-coat wax protects new flooring investment." },
  { key: "hdpe", label: "High-Dusting (Above 14ft)", trigger: ["high-dust", "high dust", "scissor lift", "high ceiling clean"], description: "Exposed trusses and ductwork need extended-reach equipment." },
  { key: "carpet_protect", label: "Carpet Protection Film Removal", trigger: ["carpet film", "carpet protector", "carpet protection"], description: "Removal and disposal of contractor-installed protective film." },
  { key: "construction_clean", label: "Post-Paint Detail Clean", trigger: ["post-paint", "paint overspray", "overspray"], description: "Paint spatter, caulk bleed, and drywall texture overspray removal." },
];

function detectMissingUpsells(project) {
  const text = [
    project.ai_extracted_detail,
    project.cleaning_challenge,
    project.notes,
    project.project_name,
    ...(project.scope_custom_items || []),
  ].filter(Boolean).join(" ").toLowerCase();

  return UPSELL_CHECKS.filter(u => !u.trigger.some(t => text.includes(t)));
}

export default function UpsellOpportunities({ project, onAddUpsell }) {
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState([]);
  const [expanded, setExpanded] = useState(true);
  const [ran, setRan] = useState(false);

  const missing = detectMissingUpsells(project);

  const runAudit = async () => {
    setLoading(true);
    setRan(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert post-construction cleaning estimator reviewing a project for AllClear Services.

Project details:
- Name: ${project.project_name || "N/A"}
- Type: ${project.project_type || "N/A"}
- Sqft: ${project.square_footage || 0}
- AI detail: ${project.ai_extracted_detail || "N/A"}
- Notes: ${project.notes || "N/A"}
- Cleaning challenge: ${project.cleaning_challenge || "N/A"}

Based on the project type and details, suggest up to 3 ADDITIONAL upsell services that are likely NOT included in a standard 3-phase scope (Rough, Final, Touch-up). These should be real services AllClear could charge for. Focus on services with high margin potential.

Return ONLY services that are genuinely relevant to this specific project type. Do not invent generic services.`,
      response_json_schema: {
        type: "object",
        properties: {
          upsells: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                reason: { type: "string" }
              }
            }
          }
        }
      }
    });
    setAiSuggestions(result.upsells || []);
    setLoading(false);
  };

  const handleAdd = (label) => {
    onAddUpsell?.(label);
    setAdded(prev => [...prev, label]);
  };

  const totalItems = missing.length + aiSuggestions.length;
  if (!project.project_type && !project.ai_extracted_detail) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-emerald-500/20 overflow-hidden"
      style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.05) 0%, rgba(20,20,20,1) 100%)" }}
    >
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-2 px-5 py-4">
        <div className="w-7 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <span className="text-xs uppercase tracking-wider text-[#737373] font-semibold flex-1 text-left">
          Upsell Opportunities
        </span>
        {totalItems > 0 && (
          <span className="text-[9px] bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-semibold mr-1">
            {totalItems} found
          </span>
        )}
        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-[#737373]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#737373]" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-5 pb-5 space-y-3">
              {/* Missing keyword flags */}
              {missing.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] text-[#737373] uppercase tracking-wider font-semibold">Missing from Blueprint</p>
                  {missing.map((item) => {
                    const isAdded = added.includes(item.label);
                    return (
                      <motion.div
                        key={item.key}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-start gap-3 p-3 rounded-xl border bg-emerald-500/5 border-emerald-500/15"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-emerald-300">{item.label}</p>
                          <p className="text-[10px] text-[#737373] mt-0.5 leading-relaxed">{item.description}</p>
                        </div>
                        <Button
                          size="sm"
                          disabled={isAdded}
                          onClick={() => handleAdd(item.label)}
                          className={`shrink-0 h-7 text-[10px] px-2.5 gap-1 border ${isAdded ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" : "bg-[#0a0a0a] text-[#737373] border-[#1f1f1f] hover:text-white"}`}
                        >
                          {isAdded ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                          {isAdded ? "Added" : "Add"}
                        </Button>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* AI Audit button */}
              {!ran ? (
                <Button
                  size="sm"
                  onClick={runAudit}
                  disabled={loading}
                  className="w-full bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 text-xs h-8"
                >
                  {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <TrendingUp className="w-3 h-3 mr-1" />}
                  {loading ? "Auditing..." : "Run AI Upsell Audit"}
                </Button>
              ) : loading ? (
                <div className="flex items-center justify-center gap-2 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  <span className="text-xs text-[#737373]">Scanning for upsells...</span>
                </div>
              ) : aiSuggestions.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[10px] text-[#737373] uppercase tracking-wider font-semibold">AI Suggested</p>
                  {aiSuggestions.map((s, i) => {
                    const isAdded = added.includes(s.label);
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className="flex items-start gap-3 p-3 rounded-xl border bg-blue-500/5 border-blue-500/15"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-blue-300">{s.label}</p>
                          <p className="text-[10px] text-[#737373] mt-0.5 leading-relaxed">{s.reason}</p>
                        </div>
                        <Button
                          size="sm"
                          disabled={isAdded}
                          onClick={() => handleAdd(s.label)}
                          className={`shrink-0 h-7 text-[10px] px-2.5 gap-1 border ${isAdded ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" : "bg-[#0a0a0a] text-[#737373] border-[#1f1f1f] hover:text-white"}`}
                        >
                          {isAdded ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                          {isAdded ? "Added" : "Add"}
                        </Button>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[10px] text-[#737373] text-center py-2">No additional AI upsells found for this project type.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}