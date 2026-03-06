import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import BlueprintDropZone from "@/components/proposal/BlueprintDropZone";
import ProposalSquare from "@/components/proposal/ProposalSquare";
import BentoCards from "@/components/proposal/BentoCards";
import QuickPasteBar from "@/components/proposal/QuickPasteBar";
import ActionSidebar from "@/components/proposal/ActionSidebar";
import EmailGenerator from "@/components/proposal/EmailGenerator";
import IntakeForm from "@/components/proposal/IntakeForm";
import ConflictFlagPanel from "@/components/audit/ConflictFlagPanel";
import VersionComparison from "@/components/audit/VersionComparison";
import SurchargeDetector from "@/components/audit/SurchargeDetector";
import ProposalAuditor from "@/components/audit/ProposalAuditor";
import TimelinePredictor from "@/components/intelligence/TimelinePredictor";
import ProposalPreview from "@/components/proposal/ProposalPreview";
import { ArrowLeft, Zap, ChevronDown, ChevronUp, Settings2, Download, Loader2, AlertTriangle } from "lucide-react";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ReactDOM from "react-dom/client";

const DEFAULT_PROJECT = {
  project_name: "",
  address: "",
  square_footage: 0,
  project_type: "",
  price_per_sqft: 0.50,
  total_price: 0,
  mobilization_fee: 0,
  scope_rough_clean: true,
  scope_final_clean: true,
  scope_touchup: true,
  scope_custom_items: [],
  client_name: "",
  client_email: "",
  client_company: "",
  status: "Draft",
  notes: ""
};

function useMergeAnimation() {
  const leftControls = useAnimation();
  const rightControls = useAnimation();
  const [phase, setPhase] = useState("idle");

  const runMerge = async () => {
    setPhase("squeezing");
    await Promise.all([
      leftControls.start({ x: "35%", scale: 0.9, transition: { type: "spring", stiffness: 200, damping: 28 } }),
      rightControls.start({ x: "-35%", scale: 0.9, transition: { type: "spring", stiffness: 200, damping: 28 } }),
    ]);
    setPhase("merging");
    await new Promise(r => setTimeout(r, 600));
    setPhase("expanding");
    await Promise.all([
      leftControls.start({ x: 0, scale: 1, transition: { type: "spring", stiffness: 160, damping: 22 } }),
      rightControls.start({ x: 0, scale: 1, transition: { type: "spring", stiffness: 160, damping: 22 } }),
    ]);
    setPhase("done");
  };

  return { leftControls, rightControls, phase, runMerge };
}

export default function NewProposal() {
  const params = new URLSearchParams(window.location.search);
  const editId = params.get("id");

  const [project, setProject] = useState(DEFAULT_PROJECT);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [creditSaver, setCreditSaver] = useState(false);
  const [downloadError, setDownloadError] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { leftControls, rightControls, phase, runMerge } = useMergeAnimation();

  const { data: references = [] } = useQuery({
    queryKey: ["references"],
    queryFn: () => base44.entities.Reference.list(),
  });

  useEffect(() => {
    if (editId) {
      base44.entities.Project.list().then(projects => {
        const found = projects.find(p => p.id === editId);
        if (found) { setProject(found); setIsReady(true); }
      });
    }
  }, [editId]);

  const handleLeadParsed = (lead) => {
    setProject(prev => ({
      ...prev,
      project_name: lead.project_name || prev.project_name,
      address: lead.address || prev.address,
      client_company: lead.client_company || prev.client_company,
      square_footage: lead.square_footage || prev.square_footage,
      mobilization_fee: lead.mobilization_fee ?? prev.mobilization_fee,
    }));
  };

  const handleExtractionComplete = async (extracted) => {
    await runMerge();
    setIsReady(true);
    setSidebarOpen(true);
  };

  const handleGenerate = async () => {
    await runMerge();
    setIsReady(true);
    setSidebarOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const totalPrice = (project.square_footage || 0) * (project.price_per_sqft || 0.25) + (project.mobilization_fee || 0);
    const data = { ...project, total_price: totalPrice };
    delete data.id; delete data.created_date; delete data.updated_date; delete data.created_by;

    if (editId || project.id) {
      await base44.entities.Project.update(editId || project.id, data);
    } else {
      const created = await base44.entities.Project.create(data);
      setProject(prev => ({ ...prev, id: created.id }));
    }
    setSaving(false);
  };

  const handleDownloadPDF = async () => {
    // Auto-fill any missing required fields with sensible defaults
    const filledProject = {
      ...project,
      project_name: project.project_name?.trim() || "Commercial Project",
      client_name: project.client_name?.trim() || "Valued Client",
      square_footage: project.square_footage || 2500,
    };
    if (filledProject.project_name !== project.project_name ||
        filledProject.client_name !== project.client_name ||
        filledProject.square_footage !== project.square_footage) {
      setProject(filledProject);
      // Small delay to let state update propagate
      await new Promise(r => setTimeout(r, 50));
    }

    setExporting(true);

    // Render ProposalPreview off-screen at exactly 816px (no scaling artifacts)
    const container = document.createElement("div");
    container.style.cssText = "position:fixed;left:-9999px;top:0;width:816px;background:#f0f0ee;z-index:-9999;";
    document.body.appendChild(container);

    const root = ReactDOM.createRoot(container);
    await new Promise(resolve => {
      root.render(<ProposalPreview project={filledProject} references={references} />);
      setTimeout(resolve, 400);
    });

    const el = container.querySelector("#proposal-preview");

    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#f0f0ee",
      logging: false,
      width: 816,
      windowWidth: 816,
      height: el.scrollHeight,
      windowHeight: el.scrollHeight,
    });

    root.unmount();
    document.body.removeChild(container);

    // Save as a single PNG image — mobile-safe download
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `AllClear_Proposal_${(filledProject.project_name || "Draft").replace(/\s+/g, "_")}.png`;
    link.href = dataUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExporting(false);
  };

  const handleMobilizationToggle = (fee) => {
    setProject(prev => ({ ...prev, mobilization_fee: fee }));
  };

  const handleVersionApply = (updates) => {
    setProject(prev => ({ ...prev, ...updates }));
  };

  const handleSurchargeAdd = (label, value) => {
    setProject(prev => ({
      ...prev,
      scope_custom_items: [...(prev.scope_custom_items || []), `${label} (+$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })})`],
      mobilization_fee: (prev.mobilization_fee || 0) + value,
    }));
  };

  const isMerging = phase === "merging";
  const canDownload = !!(project.project_name?.trim() && project.square_footage);

  return (
    <div className="min-h-screen p-4 lg:p-6">
      <ActionSidebar project={project} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to={createPageUrl("Dashboard")} className="text-[#737373] hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white">{editId ? "Edit Proposal" : "New Proposal"}</h1>
            <p className="text-xs text-[#737373]">Parallel document workspace</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="border-[#1f1f1f] bg-[#141414] text-[#737373] hover:text-white text-xs gap-1.5"
          >
            <Settings2 className="w-3.5 h-3.5" />
            Details
            {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            size="sm"
            variant="outline"
            className="border-[#1f1f1f] bg-[#141414] text-[#737373] hover:text-white text-xs gap-1.5"
          >
            {saving ? "Saving..." : "Save"}
          </Button>
          <div className="relative group">
            <Button
              onClick={canDownload ? handleDownloadPDF : () => setDownloadError(true)}
              disabled={exporting}
              size="sm"
              className={`font-semibold text-xs gap-1.5 shadow-lg transition-all duration-300 ${
                !canDownload
                  ? "bg-[#1f1f1f] text-[#737373] cursor-not-allowed opacity-60 shadow-none"
                  : "btn-download-electric"
              }`}
            >
              {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              {exporting ? "Exporting..." : "Download Image"}
            </Button>
            {downloadError && !canDownload && (
              <div className="absolute right-0 top-10 bg-red-900 border border-red-700 text-red-200 text-xs px-3 py-2 rounded-lg whitespace-nowrap z-50 shadow-xl">
                Fill in: Project Name &amp; Square Footage
              </div>
            )}
          </div>
        </div>
      </div>

      <QuickPasteBar onLeadParsed={handleLeadParsed} />

      {/* ═══ PARALLEL SQUARES ═══ */}
      <div className="relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ minHeight: "460px" }}>
          <motion.div animate={leftControls} className="h-[460px] pane-workbench">
            <BlueprintDropZone
              project={project}
              setProject={setProject}
              onExtractionComplete={handleExtractionComplete}
              creditSaver={creditSaver}
            />
          </motion.div>

          <motion.div animate={rightControls} className={`h-[460px] pane-artifact ${isMerging ? "scanline-active" : ""}`}>
            <ProposalSquare
              project={project}
              references={references}
              isReady={isReady}
              isMerging={isMerging}
              mergePhase={phase}
            />
          </motion.div>
        </div>

        {project.blueprint_url && !isReady && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20"
          >
            <Button
              onClick={handleGenerate}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold gap-2 px-8 shadow-xl shadow-orange-500/25 rounded-full h-11"
            >
              <Zap className="w-4 h-4" />
              Generate Bid
            </Button>
          </motion.div>
        )}
      </div>

      {/* ═══ BENTO CARDS ═══ */}
      <div className="mt-4">
        <BentoCards
          project={project}
          onMobilizationToggle={handleMobilizationToggle}
          creditSaver={creditSaver}
          onCreditSaverToggle={setCreditSaver}
        />
      </div>

      {/* ═══ AI AUDIT LAYER ═══ */}
      {project.project_type && (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ConflictFlagPanel project={project} />
          <VersionComparison project={project} onApplyUpdate={handleVersionApply} />
          <SurchargeDetector project={project} onAddSurcharge={handleSurchargeAdd} />
        </div>
      )}

      {/* ═══ AI PROPOSAL AUDITOR ═══ */}
      {isReady && (
        <div className="mt-4">
          <ProposalAuditor project={project} />
        </div>
      )}

      {/* ═══ PROACTIVE INTELLIGENCE LAYER ═══ */}
      {(project.project_type || project.ai_extracted_detail) && (
        <div className="mt-4">
          <TimelinePredictor project={project} />
        </div>
      )}

      {/* ═══ EMAIL + DETAILS (collapsible) ═══ */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mt-4"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-8">
              <div className="border border-[#1f1f1f] rounded-2xl p-6 bg-[#0d0d0d]">
                <h3 className="text-xs uppercase tracking-[0.15em] text-[#737373] font-semibold mb-4">Project Details</h3>
                <IntakeForm project={project} setProject={setProject} onSave={handleSave} saving={saving} />
              </div>
              <div className="border border-[#1f1f1f] rounded-2xl p-6 bg-[#0d0d0d]">
                <EmailGenerator project={project} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}