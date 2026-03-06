import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { ShieldCheck, ShieldAlert, Loader2, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProposalAuditor({ project }) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [expanded, setExpanded] = useState(true);

  const runAudit = async () => {
    setLoading(true);
    setReport(null);

    const basePrice = (project.square_footage || 0) * (project.price_per_sqft ?? 0.25);
    const totalPrice = basePrice + (project.mobilization_fee || 0);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a proposal quality auditor for a post-construction cleaning company.

Analyze this project data and identify any issues:

PROJECT DATA:
- Project Name: ${project.project_name || "MISSING"}
- Client Name: ${project.client_name || "MISSING"}
- Client Email: ${project.client_email || "MISSING"}
- Client Company: ${project.client_company || "MISSING"}
- Address: ${project.address || "MISSING"}
- Square Footage: ${project.square_footage || "MISSING"}
- Project Type: ${project.project_type || "MISSING"}
- Price per Sqft: $${project.price_per_sqft ?? 0.25}
- Mobilization Fee: $${project.mobilization_fee || 0}
- Base Price Calculation: ${project.square_footage || 0} sqft × $${project.price_per_sqft ?? 0.25} = $${basePrice.toFixed(2)}
- Total Price on Proposal: $${totalPrice.toFixed(2)}

CHECK FOR:
1. Missing or incomplete critical fields (project name, client name, square footage, address are most important)
2. Calculation errors: does basePrice (sqft × rate) + mobilization = total correctly?
3. Data inconsistencies (e.g., price per sqft below market range $0.25–$2.50, suspiciously large/small square footage for the project type)
4. Any red flags a salesperson should address before sending

Return a structured audit report.`,
      response_json_schema: {
        type: "object",
        properties: {
          overall_status: { type: "string", enum: ["pass", "warning", "fail"] },
          summary: { type: "string" },
          issues: {
            type: "array",
            items: {
              type: "object",
              properties: {
                severity: { type: "string", enum: ["error", "warning", "info"] },
                field: { type: "string" },
                message: { type: "string" }
              }
            }
          }
        }
      }
    });

    setReport(result);
    setLoading(false);
    setExpanded(true);
  };

  const severityConfig = {
    error: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
    warning: { icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
    info: { icon: CheckCircle2, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  };

  const statusConfig = {
    pass: { icon: ShieldCheck, color: "text-emerald-400", label: "Proposal Looks Good", bg: "bg-emerald-500/10 border-emerald-500/20" },
    warning: { icon: ShieldAlert, color: "text-yellow-400", label: "Review Recommended", bg: "bg-yellow-500/10 border-yellow-500/20" },
    fail: { icon: ShieldAlert, color: "text-red-400", label: "Issues Detected", bg: "bg-red-500/10 border-red-500/20" },
  };

  return (
    <div className="border border-[#1f1f1f] rounded-2xl overflow-hidden bg-[#0d0d0d]/80 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1f1f1f]">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#0070F3]" />
          <span className="text-xs uppercase tracking-[0.18em] text-[#737373] font-semibold">AI Proposal Audit</span>
        </div>
        <div className="flex items-center gap-2">
          {report && (
            <button onClick={() => setExpanded(!expanded)} className="text-[#737373] hover:text-white transition-colors">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
          <Button
            size="sm"
            onClick={runAudit}
            disabled={loading}
            className="text-xs h-7 px-3 bg-[#0070F3] hover:bg-[#0061d5] text-white border-0 gap-1.5"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
            {loading ? "Auditing..." : "Run Audit"}
          </Button>
        </div>
      </div>

      {/* Report */}
      <AnimatePresence>
        {report && expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-5 space-y-3">
              {/* Overall status */}
              {(() => {
                const cfg = statusConfig[report.overall_status] || statusConfig.warning;
                const Icon = cfg.icon;
                return (
                  <div className={`flex items-start gap-3 p-3 rounded-xl border ${cfg.bg}`}>
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.color}`} />
                    <div>
                      <p className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</p>
                      <p className="text-xs text-[#a0a0a0] mt-0.5 leading-relaxed">{report.summary}</p>
                    </div>
                  </div>
                );
              })()}

              {/* Individual issues */}
              {report.issues?.length > 0 && (
                <div className="space-y-2">
                  {report.issues.map((issue, i) => {
                    const cfg = severityConfig[issue.severity] || severityConfig.info;
                    const Icon = cfg.icon;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className={`flex items-start gap-2.5 p-3 rounded-xl border ${cfg.bg}`}
                      >
                        <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${cfg.color}`} />
                        <div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.color}`}>{issue.field}</span>
                          <p className="text-xs text-[#a0a0a0] mt-0.5 leading-relaxed">{issue.message}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {report.issues?.length === 0 && (
                <p className="text-xs text-emerald-400/70 text-center py-2">No issues found — proposal is ready to send!</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!report && !loading && (
        <div className="px-5 py-4 text-xs text-[#444] text-center">
          Run the audit to check for missing fields, calculation errors &amp; inconsistencies.
        </div>
      )}
    </div>
  );
}