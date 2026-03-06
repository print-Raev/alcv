import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Upload, Loader2, Sparkles, X, Plus } from "lucide-react";

const PROJECT_TYPES = ["Retail", "Restaurant", "Medical", "Office", "Residential", "Industrial", "Education", "Hospitality"];

export default function IntakeForm({ project, setProject, onSave, saving }) {
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [customItem, setCustomItem] = useState("");
  const fileRef = useRef(null);

  const update = (field, value) => {
    setProject(prev => {
      const updated = { ...prev, [field]: value };
      // Recalculate price
      if (field === "square_footage" || field === "price_per_sqft") {
        const sqft = field === "square_footage" ? value : (prev.square_footage || 0);
        const rate = field === "price_per_sqft" ? value : (prev.price_per_sqft || 0.50);
        updated.total_price = sqft * rate;
      }
      return updated;
    });
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    update("blueprint_url", file_url);
    setUploading(false);

    // AI extraction
    setExtracting(true);
    const extracted = await base44.integrations.Core.InvokeLLM({
      prompt: `You are analyzing a construction blueprint/document. Extract the following information if available:
- Project Name
- Project Address
- Total Square Footage (number only)
- One unique architectural or design detail (e.g., "polished concrete floors", "15-foot lobby ceilings", "exposed steel beams")

Be precise. If you cannot find a value, return null for that field.`,
      file_urls: [file_url],
      response_json_schema: {
        type: "object",
        properties: {
          project_name: { type: "string" },
          address: { type: "string" },
          square_footage: { type: "number" },
          unique_detail: { type: "string" }
        }
      }
    });

    setProject(prev => {
      const updated = { ...prev };
      if (extracted.project_name) updated.project_name = extracted.project_name;
      if (extracted.address) updated.address = extracted.address;
      if (extracted.square_footage) {
        updated.square_footage = extracted.square_footage;
        updated.total_price = extracted.square_footage * (prev.price_per_sqft || 0.50);
      }
      if (extracted.unique_detail) updated.ai_extracted_detail = extracted.unique_detail;
      return updated;
    });
    setExtracting(false);
  };

  const addCustomItem = () => {
    if (!customItem.trim()) return;
    const items = [...(project.scope_custom_items || []), customItem.trim()];
    update("scope_custom_items", items);
    setCustomItem("");
  };

  const removeCustomItem = (idx) => {
    const items = (project.scope_custom_items || []).filter((_, i) => i !== idx);
    update("scope_custom_items", items);
  };

  return (
    <div className="space-y-6">
      {/* Blueprint Upload */}
      <div className="border border-dashed border-[#2a2a2a] rounded-xl p-6 text-center hover:border-orange-500/40 transition-colors">
        <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={handleUpload} />
        {uploading || extracting ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
            <p className="text-sm text-[#737373]">{uploading ? "Uploading blueprint..." : "AI extracting project details..."}</p>
          </div>
        ) : project.blueprint_url ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20">PDF Uploaded</Badge>
              {project.ai_extracted_detail && (
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                  <Sparkles className="w-3 h-3 mr-1" />AI Extracted
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" className="text-[#737373] hover:text-white" onClick={() => fileRef.current?.click()}>
              Replace
            </Button>
          </div>
        ) : (
          <button onClick={() => fileRef.current?.click()} className="w-full py-4">
            <Upload className="w-8 h-8 mx-auto text-[#737373] mb-2" />
            <p className="text-sm font-medium text-white">Upload Blueprint</p>
            <p className="text-xs text-[#737373] mt-1">PDF, PNG, or JPG</p>
          </button>
        )}
      </div>

      {/* Project Info */}
      <div className="space-y-4">
        <h3 className="text-xs uppercase tracking-[0.15em] text-[#737373] font-semibold">Project Details</h3>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-[#737373]">Project Name</Label>
            <Input value={project.project_name || ""} onChange={e => update("project_name", e.target.value)}
              className="bg-[#141414] border-[#1f1f1f] text-white mt-1 focus:border-orange-500/50 focus:ring-orange-500/20" />
          </div>
          <div>
            <Label className="text-xs text-[#737373]">Address</Label>
            <Input value={project.address || ""} onChange={e => update("address", e.target.value)}
              className="bg-[#141414] border-[#1f1f1f] text-white mt-1 focus:border-orange-500/50 focus:ring-orange-500/20" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-[#737373]">Square Footage</Label>
              <Input type="number" value={project.square_footage || ""} onChange={e => update("square_footage", parseFloat(e.target.value) || 0)}
                className="bg-[#141414] border-[#1f1f1f] text-white mt-1 focus:border-orange-500/50 focus:ring-orange-500/20" />
            </div>
            <div>
              <Label className="text-xs text-[#737373]">Project Type</Label>
              <Select value={project.project_type || ""} onValueChange={v => update("project_type", v)}>
                <SelectTrigger className="bg-[#141414] border-[#1f1f1f] text-white mt-1">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-[#141414] border-[#1f1f1f]">
                  {PROJECT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Client Info */}
      <div className="space-y-4">
        <h3 className="text-xs uppercase tracking-[0.15em] text-[#737373] font-semibold">Client Info</h3>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-[#737373]">Client Name</Label>
            <Input value={project.client_name || ""} onChange={e => update("client_name", e.target.value)}
              className="bg-[#141414] border-[#1f1f1f] text-white mt-1 focus:border-orange-500/50 focus:ring-orange-500/20" />
          </div>
          <div>
            <Label className="text-xs text-[#737373]">Title / Role</Label>
            <Input value={project.client_title || ""} onChange={e => update("client_title", e.target.value)}
              placeholder="e.g. Assistant Project Manager"
              className="bg-[#141414] border-[#1f1f1f] text-white mt-1 focus:border-orange-500/50 focus:ring-orange-500/20" />
          </div>
          <div>
            <Label className="text-xs text-[#737373]">Company</Label>
            <Input value={project.client_company || ""} onChange={e => update("client_company", e.target.value)}
              className="bg-[#141414] border-[#1f1f1f] text-white mt-1 focus:border-orange-500/50 focus:ring-orange-500/20" />
          </div>
          <div>
            <Label className="text-xs text-[#737373]">Client Email</Label>
            <Input type="email" value={project.client_email || ""} onChange={e => update("client_email", e.target.value)}
              className="bg-[#141414] border-[#1f1f1f] text-white mt-1 focus:border-orange-500/50 focus:ring-orange-500/20" />
          </div>
          <div>
            <Label className="text-xs text-[#737373]">Phone</Label>
            <Input type="tel" value={project.client_phone || ""} onChange={e => update("client_phone", e.target.value)}
              placeholder="e.g. 928-963-3353"
              className="bg-[#141414] border-[#1f1f1f] text-white mt-1 focus:border-orange-500/50 focus:ring-orange-500/20" />
          </div>
          <div>
            <Label className="text-xs text-[#737373]">Website</Label>
            <Input value={project.client_website || ""} onChange={e => update("client_website", e.target.value)}
              placeholder="e.g. www.elderjones.com"
              className="bg-[#141414] border-[#1f1f1f] text-white mt-1 focus:border-orange-500/50 focus:ring-orange-500/20" />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-4">
        <h3 className="text-xs uppercase tracking-[0.15em] text-[#737373] font-semibold">Pricing</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-[#737373]">Rate / sqft</Label>
            <Input type="number" step="0.01" value={project.price_per_sqft ?? 0.25} onChange={e => update("price_per_sqft", parseFloat(e.target.value) || 0)}
              className="bg-[#141414] border-[#1f1f1f] text-white mt-1 focus:border-orange-500/50 focus:ring-orange-500/20" />
          </div>
          <div>
            <Label className="text-xs text-[#737373]">Mobilization Fee</Label>
            <Input type="number" value={project.mobilization_fee || 0} onChange={e => update("mobilization_fee", parseFloat(e.target.value) || 0)}
              className="bg-[#141414] border-[#1f1f1f] text-white mt-1 focus:border-orange-500/50 focus:ring-orange-500/20" />
          </div>
        </div>
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-lg p-4">
          <div className="flex justify-between text-sm">
            <span className="text-[#737373]">Base ({(project.square_footage || 0).toLocaleString()} sqft × ${project.price_per_sqft ?? 0.25})</span>
            <span className="font-semibold">${((project.square_footage || 0) * (project.price_per_sqft ?? 0.25)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          {(project.mobilization_fee || 0) > 0 && (
            <div className="flex justify-between text-sm mt-2">
              <span className="text-[#737373]">Mobilization Fee</span>
              <span className="font-semibold">${(project.mobilization_fee || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          <div className="border-t border-[#1f1f1f] mt-3 pt-3 flex justify-between">
            <span className="font-semibold text-orange-400">Total</span>
            <span className="text-lg font-bold text-orange-400">
              ${(((project.square_footage || 0) * (project.price_per_sqft ?? 0.25)) + (project.mobilization_fee || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Scope */}
      <div className="space-y-4">
        <h3 className="text-xs uppercase tracking-[0.15em] text-[#737373] font-semibold">Scope of Work</h3>
        <div className="space-y-3">
          {[
            { key: "scope_rough_clean", label: "Rough Clean" },
            { key: "scope_final_clean", label: "Final Clean" },
            { key: "scope_touchup", label: "Touch-up Clean" },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between bg-[#141414] border border-[#1f1f1f] rounded-lg px-4 py-3">
              <span className="text-sm font-medium">{item.label}</span>
              <Switch checked={project[item.key] !== false} onCheckedChange={v => update(item.key, v)}
                className="data-[state=checked]:bg-orange-500" />
            </div>
          ))}
        </div>
        {/* Custom items */}
        <div className="space-y-2">
          {(project.scope_custom_items || []).map((item, idx) => (
            <div key={idx} className="flex items-center justify-between bg-[#141414] border border-[#1f1f1f] rounded-lg px-4 py-2.5 text-sm">
              <span>{item}</span>
              <button onClick={() => removeCustomItem(idx)} className="text-[#737373] hover:text-red-400">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input value={customItem} onChange={e => setCustomItem(e.target.value)} placeholder="Add custom scope item..."
              className="bg-[#141414] border-[#1f1f1f] text-white text-sm focus:border-orange-500/50 focus:ring-orange-500/20"
              onKeyDown={e => e.key === "Enter" && addCustomItem()} />
            <Button size="sm" onClick={addCustomItem} className="bg-[#1f1f1f] hover:bg-[#2a2a2a] text-white border-0 shrink-0">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <Label className="text-xs text-[#737373]">Notes</Label>
        <Textarea value={project.notes || ""} onChange={e => update("notes", e.target.value)}
          className="bg-[#141414] border-[#1f1f1f] text-white mt-1 focus:border-orange-500/50 focus:ring-orange-500/20 min-h-[80px]" />
      </div>

      {/* Save */}
      <Button onClick={onSave} disabled={saving} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold h-11">
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        {project.id ? "Update Proposal" : "Create Proposal"}
      </Button>
    </div>
  );
}