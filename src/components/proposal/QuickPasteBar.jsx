import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Loader2, Zap, X } from "lucide-react";

export default function QuickPasteBar({ onLeadParsed }) {
  const [text, setText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const handlePaste = async (e) => {
    const pasted = e.clipboardData.getData("text");
    if (!pasted.trim()) return;
    setText(pasted);
    setAnalyzing(true);
    setResult(null);

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Extract project details from this construction permit text and calculate distance from Chandler, AZ 85225.
Text: "${pasted}"

Return JSON with:
- project_name: string
- address: string
- client_company: string (general contractor)
- square_footage: number (estimate 2500 if not found)
- distance_miles: number (approximate driving miles from Chandler AZ 85225)
- mobilization_fee: number (250 if distance_miles > 50, else 0)`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          project_name: { type: "string" },
          address: { type: "string" },
          client_company: { type: "string" },
          square_footage: { type: "number" },
          distance_miles: { type: "number" },
          mobilization_fee: { type: "number" },
        },
      },
    });

    setResult(res);
    setAnalyzing(false);
  };

  const [handshake, setHandshake] = useState(false);
  const barRef = useRef(null);

  const handleApply = () => {
    if (result) {
      setHandshake(true);
      setTimeout(() => setHandshake(false), 700);
      onLeadParsed(result);
      setText("");
      setResult(null);
    }
  };

  return (
    <div className="mb-4" ref={barRef}>
      <div className="relative">
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border bg-[#0d0d0d] focus-within:border-orange-500/40 transition-all duration-200 ${handshake ? "liquid-handshake border-blue-500/50" : "border-[#1f1f1f]"}`}>
          <Zap className="w-4 h-4 text-orange-400 shrink-0" />
          <input
            value={text}
            onPaste={handlePaste}
            onChange={(e) => setText(e.target.value)}
            placeholder="Quick-Paste permit row here (Ctrl+V)  —  Project Name, Address, GC..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-[#404040] outline-none mono-data"
          />
          {analyzing && <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" />}
          {text && !analyzing && (
            <button onClick={() => { setText(""); setResult(null); }} className="text-[#737373] hover:text-white transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {result && !analyzing && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="mt-2 rounded-xl border border-blue-500/25 bg-blue-500/5 p-3 flex items-center justify-between gap-3"
            style={{ backdropFilter: "blur(12px)" }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{result.project_name || "Untitled Project"}</p>
              <p className="text-xs text-[#737373] truncate">{result.address} · {result.client_company}</p>
              <div className="flex gap-3 mt-1">
                <span className="text-[10px] text-blue-400 mono-data field-high-confidence rounded px-1">{result.square_footage?.toLocaleString()} sqft</span>
                <span className={`text-[10px] font-semibold mono-data ${result.mobilization_fee > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                  {result.distance_miles?.toFixed(0)} mi · {result.mobilization_fee > 0 ? "+$250 mobilization" : "No surcharge"}
                </span>
              </div>
            </div>
            <button
              onClick={handleApply}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors shadow-lg shadow-blue-500/25"
            >
              Inject Lead ⚡
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}