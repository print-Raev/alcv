import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { GitCompare, Upload, Loader2, TrendingUp, TrendingDown, Minus, ArrowRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function VersionComparison({ project, onApplyUpdate }) {
  const [v2, setV2] = useState(null); // { sqft, project_name, address }
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(false);
  const fileRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setApplied(false);

    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const extracted = await base44.integrations.Core.InvokeLLM({
      prompt: `Extract from this construction document:
- Total Square Footage (number only)
- Project Name
- Project Address
Return null for anything not found.`,
      file_urls: [file_url],
      response_json_schema: {
        type: "object",
        properties: {
          square_footage: { type: "number" },
          project_name: { type: "string" },
          address: { type: "string" }
        }
      }
    });

    setV2({ ...extracted, file_url });
    setLoading(false);
  };

  const sqftDiff = v2?.square_footage && project.square_footage
    ? v2.square_footage - project.square_footage
    : null;
  const bidDiff = sqftDiff !== null ? sqftDiff * (project.price_per_sqft || 0.25) : null;
  const newTotal = v2?.square_footage
    ? (v2.square_footage * (project.price_per_sqft || 0.25)) + (project.mobilization_fee || 0)
    : null;

  const handleApply = () => {
    if (!v2?.square_footage) return;
    onApplyUpdate({
      square_footage: v2.square_footage,
      total_price: newTotal,
      ...(v2.address && { address: v2.address }),
    });
    setApplied(true);
  };

  return (
    <div className="rounded-2xl border border-[#1f1f1f] p-5 space-y-4"
      style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.05) 0%, rgba(20,20,20,1) 100%)" }}>
      <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={handleFile} />

      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
          <GitCompare className="w-4 h-4 text-indigo-400" />
        </div>
        <span className="text-xs uppercase tracking-wider text-[#737373] font-semibold">Version Comparison</span>
        <Badge className="ml-auto bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[9px]">V2 Upload</Badge>
      </div>

      {/* V1 row */}
      <div className="space-y-2">
        <div className="flex items-center gap-3 p-3 bg-[#0a0a0a] rounded-xl border border-[#1f1f1f]">
          <FileText className="w-4 h-4 text-[#737373] shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-[#737373] uppercase tracking-wider">Version 1 (Current)</p>
            <p className="text-sm font-semibold text-white">{(project.square_footage || 0).toLocaleString()} sqft</p>
          </div>
          <span className="text-sm font-bold text-orange-400">
            ${((project.square_footage || 0) * (project.price_per_sqft || 0.25)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Upload V2 or show comparison */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/20">
              <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
              <p className="text-xs text-indigo-300">Extracting V2 data...</p>
            </motion.div>
          ) : v2 ? (
            <motion.div key="v2" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-3 p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/20">
                <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-indigo-400 uppercase tracking-wider">Version 2 (New)</p>
                  <p className="text-sm font-semibold text-white">{(v2.square_footage || 0).toLocaleString()} sqft</p>
                </div>
                <span className="text-sm font-bold text-indigo-400">
                  ${(newTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Diff row */}
              {sqftDiff !== null && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
                  className={`flex items-center justify-between mt-2 px-3 py-2 rounded-lg border text-xs ${
                    sqftDiff > 0 ? "bg-red-500/8 border-red-500/20" : sqftDiff < 0 ? "bg-emerald-500/8 border-emerald-500/20" : "bg-[#1a1a1a] border-[#2a2a2a]"
                  }`}>
                  <div className="flex items-center gap-1.5">
                    {sqftDiff > 0 ? <TrendingUp className="w-3.5 h-3.5 text-red-400" /> :
                      sqftDiff < 0 ? <TrendingDown className="w-3.5 h-3.5 text-emerald-400" /> :
                      <Minus className="w-3.5 h-3.5 text-[#737373]" />}
                    <span className={sqftDiff > 0 ? "text-red-300" : sqftDiff < 0 ? "text-emerald-300" : "text-[#737373]"}>
                      {sqftDiff > 0 ? "+" : ""}{sqftDiff.toLocaleString()} sqft
                    </span>
                  </div>
                  <span className={`font-bold ${sqftDiff > 0 ? "text-red-400" : sqftDiff < 0 ? "text-emerald-400" : "text-[#737373]"}`}>
                    {bidDiff > 0 ? "+" : ""}{bidDiff !== null ? `$${bidDiff.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "—"}
                  </span>
                </motion.div>
              )}

              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline"
                  className="flex-1 border-[#1f1f1f] text-[#737373] hover:text-white hover:bg-[#1a1a1a] text-xs h-8"
                  onClick={() => { setV2(null); setApplied(false); fileRef.current.value = ""; }}>
                  Clear
                </Button>
                <Button size="sm"
                  disabled={applied}
                  className={`flex-1 text-xs h-8 gap-1.5 ${applied ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" : "bg-indigo-500 hover:bg-indigo-600 text-white"}`}
                  onClick={handleApply}>
                  <ArrowRight className="w-3 h-3" />
                  {applied ? "Applied!" : "Apply V2 Changes"}
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.button key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => fileRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-indigo-500/20 text-xs text-indigo-400/60 hover:border-indigo-500/40 hover:text-indigo-400 transition-all">
              <Upload className="w-3.5 h-3.5" />
              Upload Revised Blueprint (V2)
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}