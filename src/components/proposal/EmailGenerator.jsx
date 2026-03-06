import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Loader2, Sparkles, Send, Copy, Check } from "lucide-react";

export default function EmailGenerator({ project }) {
  const [email, setEmail] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const generateEmail = async () => {
    setGenerating(true);
    const totalPrice = ((project.square_footage || 0) * (project.price_per_sqft ?? 0.25)) + (project.mobilization_fee || 0);

    // Detect high-value keywords for surcharge callouts
    const detectionText = [project.ai_extracted_detail, project.cleaning_challenge, project.notes].filter(Boolean).join(" ").toLowerCase();
    const PREMIUM_KEYWORDS = [
      { kw: "polished concrete", line: "polished concrete treatment" },
      { kw: "epoxy", line: "epoxy floor care" },
      { kw: "high-dusting", line: "high-dusting above 14ft" },
      { kw: "curtain wall", line: "exterior curtain wall glass" },
      { kw: "terrazzo", line: "terrazzo restoration" },
      { kw: "marble", line: "natural stone care" },
    ];
    const matchedPremium = PREMIUM_KEYWORDS.filter(p => detectionText.includes(p.kw)).map(p => p.line);

    const isTraveling = (project.mobilization_fee || 0) > 0;
    const hasHighCeiling = /lobby|atrium|track.?light|12ft|15ft|20ft|high.?ceil/i.test(detectionText);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are writing a professional outreach email for AllClear Services, a post-construction cleaning company in Chandler, AZ.

Write a short, compelling email to ${project.client_name || "the project manager"} at ${project.client_company || "the company"} about the cleaning proposal for "${project.project_name || "their project"}".

CRITICAL PATTERN INTERRUPT: Use this unique detail found in their blueprint to prove this is NOT a generic template: "${project.ai_extracted_detail || "a well-designed commercial space"}"

${matchedPremium.length > 0 ? `PREMIUM UPSELL: Naturally mention our specialization in: ${matchedPremium.join(", ")}. Weave as expertise, not a pitch.` : ""}

Details:
- Project: ${project.project_name}
- Location: ${project.address}
- Square footage: ${(project.square_footage || 0).toLocaleString()}
- Project type: ${project.project_type}
- Total bid: $${totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}

CO ANGLE: Frame around their upcoming Certificate of Occupancy inspection. Use language like "CO-ready clean," "inspection-grade detail," or "pass your final walkthrough." This is the #1 pain point.

DUST FALLOUT OBJECTION-HANDLER (Pattern Interruption v3): Include a brief, specific mention that after trades complete, fine dust continues to settle for 24–72 hours — especially from ${hasHighCeiling ? "high-ceiling track lighting and open-plenum ductwork" : "HVAC registers and overhead fixtures"}. Position AllClear's 3-phase protocol (including a 24hr pre-walkthrough touch-up) as the solution that prevents inventory damage and failed CO inspections. This is a specific pain point most GCs don't think about until it's too late.

${isTraveling ? `TRAVEL MENTION: Naturally suggest a site walk — something like "We're in the area this week — would a Thursday site walk work?" to make it feel personal and low-barrier.` : ""}

Guidelines:
- Subject line first, then body
- Conversational, direct — not corporate fluff
- Under 175 words total
- End with a specific CTA (e.g., "Can we get 15 minutes this week?")
- Sign off as the AllClear Services team`,
      response_json_schema: {
        type: "object",
        properties: {
          subject: { type: "string" },
          body: { type: "string" }
        }
      }
    });

    setEmail(`Subject: ${result.subject}\n\n${result.body}`);
    setGenerating(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendEmail = async () => {
    if (!project.client_email) return;
    setSending(true);
    const lines = email.split("\n");
    const subject = lines[0].replace("Subject: ", "");
    const body = lines.slice(2).join("\n");
    await base44.integrations.Core.SendEmail({
      to: project.client_email,
      subject,
      body,
      from_name: "AllClear Services"
    });
    setSending(false);
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-[0.15em] text-[#737373] font-semibold flex items-center gap-2">
          <Mail className="w-3.5 h-3.5" />
          Pattern Interruption Email
        </h3>
        <Button size="sm" onClick={generateEmail} disabled={generating}
          className="bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20 text-xs h-8">
          {generating ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
          {generating ? "Writing..." : "Generate"}
        </Button>
      </div>

      {email && (
        <div className="space-y-3">
          <Textarea value={email} onChange={e => setEmail(e.target.value)}
            className="bg-[#141414] border-[#1f1f1f] text-white min-h-[200px] text-sm focus:border-orange-500/50 focus:ring-orange-500/20 font-mono" />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={copyToClipboard}
              className="flex-1 border-[#1f1f1f] text-white hover:bg-[#1a1a1a] text-xs h-9">
              {copied ? <Check className="w-3 h-3 mr-1 text-emerald-400" /> : <Copy className="w-3 h-3 mr-1" />}
              {copied ? "Copied!" : "Copy"}
            </Button>
            {project.client_email && (
              <Button size="sm" onClick={sendEmail} disabled={sending || sent}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-xs h-9">
                {sending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : sent ? <Check className="w-3 h-3 mr-1" /> : <Send className="w-3 h-3 mr-1" />}
                {sending ? "Sending..." : sent ? "Sent!" : "Send Email"}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}