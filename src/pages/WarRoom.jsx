import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Search, SlidersHorizontal } from "lucide-react";
import PipelineStats from "@/components/pipeline/PipelineStats";
import LeadCard from "@/components/pipeline/LeadCard";
import CsvImporter from "@/components/pipeline/CsvImporter";
import RevenueHorizon from "@/components/pipeline/RevenueHorizon";

const STATUS_FILTERS = ["All", "Unclaimed", "In Progress", "Bid Sent", "Won", "Lost"];
const TYPE_FILTERS = ["All Types", "Commercial", "Retail", "Medical", "Restaurant", "Office", "Industrial", "Education", "Hospitality", "Residential"];

export default function WarRoom() {
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [showImporter, setShowImporter] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: permits = [], isLoading, refetch } = useQuery({
    queryKey: ["permits"],
    queryFn: () => base44.entities.Permit.list("-created_date", 500),
  });

  useEffect(() => {
    const unsub = base44.entities.Permit.subscribe(() => refetch());
    return unsub;
  }, [refetch]);

  const filtered = permits.filter(p => {
    const matchSearch = !search || p.project_address?.toLowerCase().includes(search.toLowerCase()) || p.contractor_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || p.status === statusFilter;
    const matchType = typeFilter === "All Types" || p.work_class === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  return (
    <div className="min-h-screen pb-24" style={{
      background: "#000000",
      backgroundImage: `
        linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
      `,
      backgroundSize: "64px 64px",
      perspective: "2000px",
    }}>
      {/* Fonts */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');`}</style>

      {/* Top bar */}
      <div className="sticky top-0 z-20 px-6 py-4 flex items-center justify-between gap-4"
        style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(40px)", borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-4">
          <Link to={createPageUrl("Dashboard")} className="text-white/30 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-base font-black text-white tracking-tight uppercase"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "0.05em" }}>
              AllClear Vault
            </h1>
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/30 mt-0.5">
              v8.0 · {permits.length.toLocaleString()} permits
            </p>
          </div>
        </div>
        <button onClick={() => setShowImporter(!showImporter)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all"
          style={{ border: "0.5px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)", background: "transparent" }}>
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Data Bridge
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
        {/* CSV Importer */}
        <AnimatePresence>
          {showImporter && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-6">
              <div className="rounded-[32px] overflow-hidden" style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}>
                <CsvImporter permits={permits} onImportComplete={refetch} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <PipelineStats permits={permits} />

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(255,255,255,0.2)" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search address or contractor…"
            className="w-full pl-11 pr-4 py-3 text-sm outline-none"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "0.5px solid rgba(255,255,255,0.1)",
              borderRadius: 24,
              color: "#fff",
              caretColor: "#fff",
            }}
          />
        </div>

        {/* Status filters */}
        <div className="flex gap-2 flex-wrap mb-3">
          {STATUS_FILTERS.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] rounded-full transition-all"
              style={{
                background: statusFilter === s ? "#ffffff" : "transparent",
                color: statusFilter === s ? "#000" : "rgba(255,255,255,0.35)",
                border: statusFilter === s ? "none" : "0.5px solid rgba(255,255,255,0.1)",
              }}>
              {s}
            </button>
          ))}
        </div>

        {/* Type filters */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6" style={{ scrollbarWidth: "none" }}>
          {TYPE_FILTERS.map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full whitespace-nowrap transition-all"
              style={{
                background: typeFilter === t ? "rgba(255,255,255,0.12)" : "transparent",
                color: typeFilter === t ? "#fff" : "rgba(255,255,255,0.25)",
                border: "0.5px solid rgba(255,255,255,0.08)",
              }}>
              {t}
            </button>
          ))}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 rounded-[40px] animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">◻</div>
            <p className="text-white/40 font-bold uppercase tracking-widest text-sm">No permits found</p>
            <p className="text-white/20 text-xs mt-2 tracking-wider">Import a CSV to load your pipeline</p>
            <button onClick={() => setShowImporter(true)}
              className="mt-6 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest text-black bg-white">
              Import Permits
            </button>
          </div>
        ) : (
          <>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/20 mb-5">{filtered.length.toLocaleString()} leads</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" style={{ transformStyle: "preserve-3d" }}>
              <AnimatePresence>
                {filtered.map(permit => (
                  <LeadCard key={permit.id} permit={permit} user={user} onUpdate={refetch} />
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      {/* Revenue Horizon — fixed bottom bar */}
      <RevenueHorizon permits={permits} />
    </div>
  );
}