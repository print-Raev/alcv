import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Upload, FileText, Sparkles, Loader2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function BlueprintDropZone({ project, setProject, onExtractionStart, onExtractionComplete, creditSaver }) {
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const processFile = async (file) => {
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setProject(prev => ({ ...prev, blueprint_url: file_url }));
    setUploading(false);

    setExtracting(true);
    onExtractionStart?.();

    // Credit Saver: skip file vision, use text-only prompt
    const llmPayload = {
      prompt: `You are analyzing a construction blueprint/document. Extract the following:
- Project Name
- Project Address  
- Total Square Footage (number only)
- One unique architectural or design detail (e.g., "polished concrete floors", "15-foot lobby ceilings", "exposed steel beams")
- Any specific cleaning challenges noted (e.g., "exterior glass curtain wall", "epoxy flooring", "high-gloss surfaces")
- Look specifically for these high-value keywords: polished concrete, epoxy, high-dusting, curtain wall, VCT, terrazzo, marble, natural stone. Mention any found in unique_detail or cleaning_challenge.

Return null for fields you cannot find.`,
      response_json_schema: {
        type: "object",
        properties: {
          project_name: { type: "string" },
          address: { type: "string" },
          square_footage: { type: "number" },
          unique_detail: { type: "string" },
          cleaning_challenge: { type: "string" }
        }
      }
    };
    if (!creditSaver) llmPayload.file_urls = [file_url];

    const extracted = await base44.integrations.Core.InvokeLLM(llmPayload);

    setProject(prev => {
      const updated = { ...prev };
      if (extracted.project_name) updated.project_name = extracted.project_name;
      if (extracted.address) updated.address = extracted.address;
      if (extracted.square_footage) {
        updated.square_footage = extracted.square_footage;
        updated.total_price = extracted.square_footage * (prev.price_per_sqft || 0.25);
      }
      if (extracted.unique_detail) updated.ai_extracted_detail = extracted.unique_detail;
      if (extracted.cleaning_challenge) updated.cleaning_challenge = extracted.cleaning_challenge;
      return updated;
    });

    setExtracting(false);
    onExtractionComplete?.(extracted);
  };

  const handleFile = (e) => processFile(e.target.files?.[0]);
  const [ripple, setRipple] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    setRipple(true);
    setTimeout(() => setRipple(false), 700);
    processFile(e.dataTransfer.files?.[0]);
  };

  const isProcessing = uploading || extracting;

  return (
    <div className="h-full flex flex-col">
      <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={handleFile} />

      {/* Breathing glow ring */}
      <div className="relative flex-1 flex flex-col">
        <AnimatePresence>
          {!project.blueprint_url && (
            <motion.div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              animate={{ boxShadow: ["0 0 0px 0px rgba(59,130,246,0)", "0 0 40px 8px rgba(59,130,246,0.18)", "0 0 0px 0px rgba(59,130,246,0)"] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </AnimatePresence>

        <motion.div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          animate={{
            borderColor: dragOver ? "rgba(59,130,246,0.7)" : project.blueprint_url ? "rgba(249,115,22,0.3)" : "rgba(59,130,246,0.25)",
            scale: ripple ? [1, 1.025, 0.995, 1] : dragOver ? 1.012 : 1,
          }}
          transition={{ duration: ripple ? 0.55 : 0.2, ease: "easeOut" }}
          className="flex-1 h-full rounded-2xl border-2 border-dashed backdrop-blur-xl relative overflow-hidden cursor-pointer"
          style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.06) 0%, rgba(10,10,10,0.75) 100%)" }}
          onClick={() => !isProcessing && fileRef.current?.click()}
        >
          {/* Ripple ring on drop */}
          {ripple && (
            <motion.div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              initial={{ boxShadow: "0 0 0px 0px rgba(59,130,246,0.6)" }}
              animate={{ boxShadow: "0 0 0px 40px rgba(59,130,246,0)" }}
              transition={{ duration: 0.65, ease: "easeOut" }}
            />
          )}
          {/* Inner glass shimmer */}
          <div className="absolute inset-0 rounded-2xl" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 60%)" }} />

          <div className="relative z-10 h-full flex flex-col items-center justify-center p-8 text-center">
            {isProcessing ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="relative w-16 h-16 mx-auto">
                  <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-blue-400 border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <FileText className="absolute inset-0 m-auto w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{uploading ? "Uploading Blueprint..." : "AI Reading Blueprint..."}</p>
                  <p className="text-xs text-blue-400/70 mt-1">{extracting ? "Extracting project details" : "Preparing file"}</p>
                </div>
                <div className="flex gap-1.5 justify-center">
                  {["Rough Clean", "Final Clean", "Window Polish"].map((label, i) => (
                    <motion.div
                      key={label}
                      className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-blue-500/10 border border-blue-500/20 text-blue-400"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.45 }}
                    >
                      {label}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : project.blueprint_url ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4 w-full">
                <div className="w-14 h-14 mx-auto bg-orange-500/10 rounded-2xl border border-orange-500/20 flex items-center justify-center">
                  <FileText className="w-7 h-7 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Blueprint Loaded</p>
                  {project.project_name && (
                    <p className="text-xs text-[#737373] mt-1 truncate px-4">{project.project_name}</p>
                  )}
                </div>
                {project.ai_extracted_detail && (
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 text-left">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-semibold">AI Found</span>
                    </div>
                    <p className="text-xs text-emerald-300/80 leading-relaxed">{project.ai_extracted_detail}</p>
                  </div>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                  className="flex items-center gap-1.5 text-xs text-[#737373] hover:text-white transition-colors mx-auto"
                >
                  <RefreshCw className="w-3 h-3" /> Replace file
                </button>
              </motion.div>
            ) : (
              <motion.div
                animate={{ y: dragOver ? -4 : 0 }}
                className="space-y-4"
              >
                <motion.div
                  className="w-16 h-16 mx-auto rounded-2xl border-2 border-blue-500/30 bg-blue-500/5 flex items-center justify-center"
                  animate={{ scale: [1, 1.04, 1] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Upload className="w-7 h-7 text-blue-400" />
                </motion.div>
                <div>
                  <p className="text-base font-bold text-white">Drop Blueprint Here</p>
                  <p className="text-xs text-[#737373] mt-1">PDF, PNG, or JPG · AI extracts immediately</p>
                </div>
                <div className="flex gap-1.5 justify-center flex-wrap">
                  {["Project Name", "Address", "Sqft"].map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded-full text-[9px] bg-blue-500/8 border border-blue-500/20 text-blue-400/70">{tag}</span>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Label */}
      <div className="mt-3 text-center">
        <span className="text-xs uppercase tracking-[0.2em] text-[#737373] font-semibold">Blueprint Intake</span>
      </div>
    </div>
  );
}