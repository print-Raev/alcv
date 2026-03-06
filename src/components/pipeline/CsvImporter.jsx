import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Download, Loader2, CheckCircle } from "lucide-react";

const PRICE_PER_SQFT = 0.5;

function parseCsvRow(cells, headers) {
  const obj = {};
  headers.forEach((h, i) => { obj[h.trim()] = cells[i]?.trim() || ""; });
  return obj;
}

function generatePermitCsv(permits) {
  const headers = ["Permit_ID", "Contractor_Name", "Project_Address", "Square_Footage", "Work_Class", "Calculated_Bid_v8"];
  const rows = permits.map(p => [
    p.permit_id || p.id || "",
    p.contractor_name || "",
    `"${(p.project_address || "").replace(/"/g, '""')}"`,
    p.square_footage || 0,
    p.work_class || "",
    (p.calculated_bid || 0).toFixed(2),
  ]);
  return [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
}

export default function CsvImporter({ permits, onImportComplete }) {
  const fileRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [progress, setProgress] = useState(0);

  const handleExport = () => {
    const csv = generatePermitCsv(permits);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `AllClear_Permits_v8_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    setProgress(0);

    const text = await file.text();
    const lines = text.trim().split("\n");
    const headers = lines[0].split(",");
    const rows = lines.slice(1);

    let created = 0, failed = 0;
    const BATCH = 20;

    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      const records = batch.map(row => {
        const cells = row.match(/(".*?"|[^,]+)(?=,|$)/g) || row.split(",");
        const clean = cells.map(c => c.replace(/^"|"$/g, "").trim());
        const obj = parseCsvRow(clean, headers);
        const sqft = parseFloat(obj["Square_Footage"] || obj["square_footage"] || "0") || 0;
        return {
          permit_id: obj["Permit_ID"] || obj["permit_id"],
          contractor_name: obj["Contractor_Name"] || obj["contractor_name"],
          contractor_phone: obj["Contractor_Phone"] || obj["contractor_phone"],
          project_address: obj["Project_Address"] || obj["project_address"],
          square_footage: sqft,
          work_class: obj["Work_Class"] || obj["work_class"] || "Commercial",
          calculated_bid: parseFloat(obj["Calculated_Bid_v8"] || obj["calculated_bid"] || "0") || sqft * PRICE_PER_SQFT,
          status: "Unclaimed",
        };
      });

      await Promise.allSettled(records.map(r =>
        base44.entities.Permit.create(r).then(() => created++).catch(() => failed++)
      ));
      setProgress(Math.round(((i + BATCH) / rows.length) * 100));
    }

    setImporting(false);
    setImportResult({ created, failed });
    onImportComplete?.();
    e.target.value = "";
  };

  return (
    <div className="p-6" style={{ background: "#0a0a0a" }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-[0.15em]">Data Bridge</h3>
          <p className="text-[10px] uppercase tracking-widest text-white/30 mt-0.5">Import permits · Export Base44 CSV</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
        <button onClick={() => fileRef.current?.click()} disabled={importing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
          style={{ border: "0.5px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)", background: "transparent" }}>
          {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {importing ? `Importing… ${progress}%` : "Import CSV"}
        </button>
        <button onClick={handleExport} disabled={permits.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
          style={{ border: "0.5px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)", background: "transparent" }}>
          <Download className="w-3.5 h-3.5" />
          Export ({permits.length})
        </button>
      </div>

      {importing && (
        <div className="mt-4">
          <div className="h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <motion.div className="h-full bg-white rounded-full" animate={{ width: `${progress}%` }} transition={{ ease: "linear" }} />
          </div>
          <p className="text-[10px] text-white/30 mt-1 uppercase tracking-widest">{progress}% processed</p>
        </div>
      )}

      <AnimatePresence>
        {importResult && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mt-4 flex items-center gap-2 text-[10px] uppercase tracking-widest"
            style={{ color: "rgba(255,255,255,0.5)" }}>
            <CheckCircle className="w-3.5 h-3.5 text-white" />
            {importResult.created} permits loaded · {importResult.failed > 0 ? `${importResult.failed} failed` : "all clean"}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}