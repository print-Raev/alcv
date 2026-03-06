import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarClock, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addMonths, format, parseISO, isValid } from "date-fns";

const isTenantImprovement = (project) => {
  const text = [project.project_name, project.notes, project.ai_extracted_detail, project.address]
    .filter(Boolean).join(" ").toLowerCase();
  return text.includes("tenant improvement") || text.includes("t.i.") || text.includes("ti ") || text.includes(" ti,");
};

export default function TimelinePredictor({ project }) {
  const [permitDate, setPermitDate] = useState("");
  const [expanded, setExpanded] = useState(true);

  const isTI = isTenantImprovement(project);

  let roughDate = null;
  let finalDate = null;
  let validDate = false;

  if (permitDate) {
    const parsed = parseISO(permitDate);
    if (isValid(parsed)) {
      validDate = true;
      roughDate = addMonths(parsed, isTI ? 3 : 2);
      finalDate = addMonths(parsed, isTI ? 5 : 4);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-2xl border border-[#1f1f1f] overflow-hidden"
      style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.05) 0%, rgba(20,20,20,1) 100%)" }}
    >
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-2 px-5 py-4">
        <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
          <CalendarClock className="w-4 h-4 text-blue-400" />
        </div>
        <span className="text-xs uppercase tracking-wider text-[#737373] font-semibold flex-1 text-left">
          Window of Opportunity
        </span>
        {isTI && (
          <span className="text-[9px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-semibold mr-1">TI Detected</span>
        )}
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
            <div className="px-5 pb-5 space-y-4">
              {isTI && (
                <div className="text-[10px] text-blue-300/80 bg-blue-500/5 border border-blue-500/15 rounded-lg px-3 py-2">
                  Tenant Improvement detected — using +3mo / +5mo alert windows from permit date.
                </div>
              )}

              <div>
                <Label className="text-[10px] text-[#737373] uppercase tracking-wider">Permit Pull Date</Label>
                <Input
                  type="date"
                  value={permitDate}
                  onChange={e => setPermitDate(e.target.value)}
                  className="mt-1 bg-[#0a0a0a] border-[#1f1f1f] text-white text-sm focus:border-blue-500/50"
                />
              </div>

              {validDate && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                  <TimelineRow
                    label="Rough Clean Alert"
                    date={roughDate}
                    offset={isTI ? "+3 months" : "+2 months"}
                    color="amber"
                  />
                  <TimelineRow
                    label="Final Clean Alert"
                    date={finalDate}
                    offset={isTI ? "+5 months" : "+4 months"}
                    color="emerald"
                  />
                  <p className="text-[10px] text-[#737373] pt-1">
                    Reach out 2 weeks before each window for best CO timing.
                  </p>
                </motion.div>
              )}

              {!permitDate && (
                <p className="text-[10px] text-[#737373]">Enter the permit date to calculate your outreach windows.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function TimelineRow({ label, date, offset, color }) {
  const colors = {
    amber: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", dot: "bg-amber-400" },
    emerald: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", dot: "bg-emerald-400" },
  };
  const c = colors[color];
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${c.bg} ${c.border}`}>
      <div className={`w-2 h-2 rounded-full shrink-0 ${c.dot}`} />
      <div className="flex-1">
        <p className={`text-xs font-semibold ${c.text}`}>{label}</p>
        <p className="text-[10px] text-[#737373]">{offset} from permit</p>
      </div>
      <span className={`text-xs font-bold ${c.text}`}>{format(date, "MMM d, yyyy")}</span>
    </div>
  );
}