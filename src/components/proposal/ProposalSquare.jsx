import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Sparkles, Loader2 } from "lucide-react";
import ProposalPreview from "./ProposalPreview";

export default function ProposalSquare({ project, references, isReady, isMerging, mergePhase }) {
  const hasContent = project.project_name || project.square_footage;

  return (
    <div className="h-full flex flex-col">
      <div className="relative flex-1 flex flex-col">
        {/* Merge overlays */}
        <AnimatePresence>
          {mergePhase === "merging" && (
            <motion.div
              key="skeleton"
              className="absolute inset-0 z-30 rounded-2xl flex flex-col items-center justify-center gap-3 p-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ background: "rgba(10,10,10,0.92)" }}
            >
              {/* Blue fusion glow */}
              <motion.div
                className="absolute inset-0 rounded-2xl"
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 1, repeat: Infinity }}
                style={{ background: "radial-gradient(circle at center, rgba(59,130,246,0.25) 0%, transparent 70%)" }}
              />
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin relative z-10" />
              <p className="text-xs font-semibold text-blue-300 uppercase tracking-widest relative z-10">Processing…</p>
              <div className="space-y-2 w-full max-w-[160px] relative z-10">
                {[90, 70, 80, 55].map((w, i) => (
                  <motion.div
                    key={i}
                    className="h-2 rounded-full bg-blue-500/20"
                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                    transition={{ duration: 1, delay: i * 0.15, repeat: Infinity }}
                    style={{ width: `${w}%` }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {isMerging && mergePhase !== "merging" && (
            <motion.div
              className="absolute inset-0 z-30 rounded-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, times: [0, 0.5, 1] }}
              style={{ background: "radial-gradient(circle at center, rgba(59,130,246,0.2) 0%, rgba(249,115,22,0.08) 60%, transparent 100%)" }}
            />
          )}
        </AnimatePresence>

        <div
          className="flex-1 h-full rounded-2xl border-2 relative overflow-hidden"
          style={{
            borderColor: isReady ? "rgba(249,115,22,0.4)" : "rgba(255,255,255,0.08)",
            borderStyle: hasContent ? "solid" : "dashed",
            background: isReady
              ? "linear-gradient(135deg, rgba(249,115,22,0.04) 0%, rgba(10,10,10,0.85) 100%)"
              : "linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(10,10,10,0.8) 100%)",
          }}
        >
          <div className="absolute inset-0 rounded-2xl" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.025) 0%, transparent 60%)" }} />

          <AnimatePresence mode="wait">
            {!hasContent ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative z-10 h-full flex flex-col items-center justify-center p-8 text-center"
              >
                <div className="w-16 h-16 mx-auto rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center mb-4">
                  <FileText className="w-7 h-7 text-white/15" />
                </div>
                <p className="text-sm font-semibold text-white/30">Generated AllClear Proposal</p>
                <p className="text-xs text-white/15 mt-2">Upload a blueprint to generate</p>
                <div className="mt-4 space-y-2 w-full max-w-[180px]">
                  {[80, 60, 70, 50, 65].map((w, i) => (
                    <div key={i} className="h-1.5 rounded-full bg-white/5" style={{ width: `${w}%`, margin: "0 auto" }} />
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative z-10 h-full overflow-y-auto"
                style={{ padding: "8px" }}
              >
                {/* Scaled preview — shrinks to fit width, scrollable for full height */}
                <div style={{ transform: "scale(0.4)", transformOrigin: "top left", width: "250%", pointerEvents: "none" }}>
                  <ProposalPreview project={project} references={references} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-3 text-center">
        <span className="text-xs uppercase tracking-[0.2em] text-[#737373] font-semibold">AllClear Proposal</span>
        {isReady && (
          <motion.span
            initial={{ opacity: 0, x: 4 }}
            animate={{ opacity: 1, x: 0 }}
            className="ml-2 inline-flex items-center gap-1 text-[9px] uppercase tracking-wider text-orange-400"
          >
            <Sparkles className="w-2.5 h-2.5" /> Ready
          </motion.span>
        )}
      </div>
    </div>
  );
}