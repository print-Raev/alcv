import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { X, Copy, Check, Loader2, Mail, Search } from "lucide-react";

export default function ActionSidebar({ project, isOpen, onClose }) {
  const [email, setEmail] = useState("");
  const [pm, setPm] = useState("");
  const [generatingEmail, setGeneratingEmail] = useState(false);
  const [findingPm, setFindingPm] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPm, setCopiedPm] = useState(false);

  const generateEmail = async () => {
    setGeneratingEmail(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Write a short, punchy "Pattern Interruption" cold outreach email for AllClear Services (post-construction cleaning).
Project: ${project.project_name || "the project"} at ${project.address || "the site"}
GC/Client: ${project.client_company || "the contractor"}
Square footage: ${project.square_footage?.toLocaleString() || "unknown"}
${project.ai_extracted_detail ? `Unique detail from blueprint: ${project.ai_extracted_detail}` : ""}

Rules:
- Subject line must reference something specific from the job site (dust fallout, high shelves, CO inspection, etc.)
- 3-4 sentences max
- End with a single soft CTA (e.g. "Is Tuesday a good day to connect?")
- Tone: confident, concise, professional — not salesy

Format: Subject: [subject]\n\n[body]`,
    });
    setEmail(res);
    setGeneratingEmail(false);
  };

  const findPM = async () => {
    setFindingPm(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Search for the current Project Manager or Superintendent at ${project.client_company || "the general contractor"} specifically for the ${project.project_name || "project"} in ${project.address || "Arizona"}. Find their name and any public office contact info or LinkedIn profile URL.`,
      add_context_from_internet: true,
    });
    setPm(res);
    setFindingPm(false);
  };

  const copy = (text, setter) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-full w-full max-w-sm bg-[#0d0d0d] border-l border-[#1f1f1f] z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#1f1f1f]">
              <div>
                <h2 className="text-sm font-bold text-white">Action Center</h2>
                <p className="text-[10px] text-[#737373] mt-0.5 truncate max-w-[200px]">{project.project_name || "No project loaded"}</p>
              </div>
              <button onClick={onClose} className="text-[#737373] hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">

              {/* PM Sniper */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <Search className="w-3 h-3 text-blue-400" />
                  </div>
                  <span className="text-xs font-semibold text-white uppercase tracking-wider">PM Sniper</span>
                </div>
                <button
                  onClick={findPM}
                  disabled={findingPm || !project.client_company}
                  className="w-full px-4 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold hover:bg-blue-500/20 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {findingPm ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching...</> : "Locate Project Manager"}
                </button>
                {pm && (
                  <div className="mt-2 rounded-xl bg-[#141414] border border-[#1f1f1f] p-3 relative">
                    <p className="text-xs text-[#c0c0c0] leading-relaxed whitespace-pre-wrap">{pm}</p>
                    <button
                      onClick={() => copy(pm, setCopiedPm)}
                      className="absolute top-2 right-2 text-[#737373] hover:text-white transition-colors"
                    >
                      {copiedPm ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
              </div>

              {/* Pattern Interrupter Email */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                    <Mail className="w-3 h-3 text-orange-400" />
                  </div>
                  <span className="text-xs font-semibold text-white uppercase tracking-wider">Pattern Interrupter</span>
                </div>
                <button
                  onClick={generateEmail}
                  disabled={generatingEmail}
                  className="w-full px-4 py-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold hover:bg-orange-500/20 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {generatingEmail ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</> : "Generate Gmail Draft"}
                </button>
                {email && (
                  <div className="mt-2 rounded-xl bg-[#141414] border border-[#1f1f1f] p-3 relative">
                    <p className="text-xs text-[#c0c0c0] leading-relaxed whitespace-pre-wrap">{email}</p>
                    <button
                      onClick={() => copy(email, setCopiedEmail)}
                      className="absolute top-2 right-2 text-[#737373] hover:text-white transition-colors"
                    >
                      {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}