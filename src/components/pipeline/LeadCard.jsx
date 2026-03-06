import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { MapPin, Loader2, Copy, MessageSquare, Lock, CheckCircle } from "lucide-react";

const STATUS_DOT = {
  Unclaimed: "#555",
  "In Progress": "#888",
  "Bid Sent": "#aaa",
  Won: "#fff",
  Lost: "#ef4444",
};

function sanitizePhone(raw) {
  return (raw || "").replace(/\D/g, "");
}

function CountUp({ target, duration = 1200 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setDisplay(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
      else setDisplay(target);
    };
    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return <>${display.toLocaleString()}</>;
}

export default function LeadCard({ permit, user, onUpdate }) {
  const [claiming, setClaiming] = useState(false);
  const [generatingBundle, setGeneratingBundle] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [bundleDone, setBundleDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPrice, setShowPrice] = useState(false);
  const cardRef = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-60, 60], [6, -6]);
  const rotateY = useTransform(mouseX, [-60, 60], [-6, 6]);

  const bid = permit.calculated_bid || 0;
  const isWhale = bid >= 5000;
  const isClaimed = permit.status !== "Unclaimed";
  const isMyLead = permit.claimed_by === user?.email;
  const canReveal = isMyLead || user?.role === "admin";
  const phone = sanitizePhone(permit.contractor_phone);

  useEffect(() => {
    const timer = setTimeout(() => setShowPrice(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleMouseMove = (e) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };
  const handleMouseLeave = () => { mouseX.set(0); mouseY.set(0); };

  const handleClaim = async () => {
    setClaiming(true);
    await base44.entities.Permit.update(permit.id, { status: "In Progress", claimed_by: user?.email });
    setClaiming(false);
    onUpdate();
  };

  const handleGenerateBundle = async () => {
    setGeneratingBundle(true);
    let bundle = permit.outreach_bundle;
    if (!bundle) {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Write a short professional cold-outreach email for AllClear Services (commercial post-construction cleaning).
Contractor: ${permit.contractor_name}
Project: ${permit.project_address}
Type: ${permit.work_class}
Sqft: ${permit.square_footage?.toLocaleString()}
Estimated Bid: $${bid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
Under 120 words. Subject line + body. Direct. No fluff.`,
      });
      bundle = res;
      await base44.entities.Permit.update(permit.id, { outreach_bundle: bundle, status: "Bid Sent" });
    }
    setGeneratingBundle(false);
    setBundleDone(true);
    setRevealed(true);
    onUpdate();
  };

  const handleCopyBundle = () => {
    navigator.clipboard.writeText(permit.outreach_bundle || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const bg = isWhale ? "#ffffff" : "#0a0a0a";
  const fg = isWhale ? "#000000" : "#ffffff";
  const borderColor = isWhale ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.1)";
  const mutedFg = isWhale ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.4)";
  const subBg = isWhale ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)";

  return (
    <motion.div
      ref={cardRef}
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX, rotateY,
        transformStyle: "preserve-3d",
        background: bg,
        borderRadius: "40px",
        border: `0.5px solid ${borderColor}`,
        backdropFilter: "blur(40px)",
        WebkitBackdropFilter: "blur(40px)",
        color: fg,
        translateZ: 0,
      }}
      whileHover={{ z: 20, scale: 1.012 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="p-6 overflow-hidden relative"
    >
      {/* Whale badge */}
      {isWhale && (
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute top-5 right-5 text-[10px] font-black tracking-widest px-2 py-1 rounded-full border border-black/10 bg-black text-white"
        >
          🐋 WHALE
        </motion.div>
      )}

      {/* Status dot + type */}
      <div className="flex items-center gap-2 mb-5">
        <span className="w-2 h-2 rounded-full" style={{ background: STATUS_DOT[permit.status || "Unclaimed"] }} />
        <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: mutedFg }}>{permit.status || "Unclaimed"}</span>
        {permit.work_class && (
          <>
            <span style={{ color: mutedFg }}>·</span>
            <span className="text-[10px] uppercase tracking-[0.15em]" style={{ color: mutedFg }}>{permit.work_class}</span>
          </>
        )}
      </div>

      {/* Address */}
      <div className="flex items-start gap-2 mb-5">
        <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: mutedFg }} />
        <span className="text-sm font-semibold leading-snug" style={{ color: fg }}>{permit.project_address}</span>
      </div>

      {/* Price — slit-scan reveal */}
      <div className="mb-6" style={{ minHeight: 64 }}>
        <div className="text-[10px] uppercase tracking-[0.25em] mb-1" style={{ color: mutedFg }}>Estimated Bid</div>
        <AnimatePresence mode="wait">
          {showPrice ? (
            <motion.div
              key="price"
              initial={{ clipPath: "inset(0 100% 0 0)", opacity: 0 }}
              animate={{ clipPath: "inset(0 0% 0 0)", opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="font-black leading-none"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(40px,7vw,72px)", color: isWhale ? "#000" : "#fff" }}
            >
              <CountUp target={bid} duration={900} />
            </motion.div>
          ) : (
            <motion.div key="blank" className="h-16 flex items-center">
              <div className="flex gap-1.5">
                {[...Array(4)].map((_, i) => (
                  <motion.div key={i} className="h-2 rounded-full" style={{ background: mutedFg, width: `${[48, 32, 40, 24][i]}px` }}
                    animate={{ opacity: [0.2, 0.6, 0.2] }} transition={{ duration: 1, delay: i * 0.15, repeat: Infinity }} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Specs */}
      <div className="rounded-2xl p-3 mb-5 text-xs space-y-1.5" style={{ background: subBg, border: `0.5px solid ${borderColor}` }}>
        {permit.square_footage && (
          <div className="flex justify-between">
            <span style={{ color: mutedFg }} className="uppercase tracking-widest text-[10px]">Area</span>
            <span className="font-mono font-semibold" style={{ color: fg }}>{permit.square_footage.toLocaleString()} sqft</span>
          </div>
        )}
        {permit.permit_id && (
          <div className="flex justify-between">
            <span style={{ color: mutedFg }} className="uppercase tracking-widest text-[10px]">Permit ID</span>
            <span className="font-mono text-[10px]" style={{ color: mutedFg }}>{permit.permit_id}</span>
          </div>
        )}
      </div>

      {/* Two-panel Strike Zone */}
      <div className="grid grid-cols-2 gap-3">
        {/* LEFT — Technical */}
        <div className="rounded-2xl p-3 text-xs" style={{ background: subBg, border: `0.5px solid ${borderColor}` }}>
          <div className="text-[9px] uppercase tracking-[0.2em] mb-2" style={{ color: mutedFg }}>Contact</div>
          {isClaimed && canReveal ? (
            <div className="space-y-1">
              <div className="font-semibold truncate" style={{ color: fg }}>{permit.contractor_name || "—"}</div>
              {phone ? (
                <a href={`tel:+1${phone}`} className="text-[10px] underline underline-offset-2" style={{ color: mutedFg }}>
                  {permit.contractor_phone}
                </a>
              ) : (
                <span style={{ color: mutedFg }} className="text-[10px]">No phone</span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5" style={{ color: mutedFg }}>
              <Lock className="w-3 h-3 shrink-0" />
              <span className="text-[10px] blur-[4px] select-none">555-555-0000</span>
            </div>
          )}
        </div>

        {/* RIGHT — Strike Zone */}
        <div className="flex flex-col gap-2">
          {!isClaimed ? (
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="flex-1 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] flex items-center justify-center gap-1.5 transition-all"
              style={{ background: fg, color: bg, border: `0.5px solid ${borderColor}`, minHeight: 36 }}
            >
              {claiming ? <Loader2 className="w-3 h-3 animate-spin" /> : "⚡ CLAIM"}
            </button>
          ) : isMyLead ? (
            <>
              {phone && (
                <a
                  href={`sms:+1${phone}`}
                  className="flex-1 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] flex items-center justify-center gap-1 transition-all"
                  style={{ background: fg, color: bg, minHeight: 32, textDecoration: "none" }}
                >
                  <MessageSquare className="w-3 h-3" /> SMS
                </a>
              )}
              <button
                onClick={bundleDone ? handleCopyBundle : handleGenerateBundle}
                disabled={generatingBundle}
                className="flex-1 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] flex items-center justify-center gap-1 transition-all"
                style={{ background: subBg, color: fg, border: `0.5px solid ${borderColor}`, minHeight: 32 }}
              >
                {generatingBundle ? <Loader2 className="w-3 h-3 animate-spin" /> : copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {generatingBundle ? "…" : bundleDone || permit.outreach_bundle ? (copied ? "COPIED" : "COPY") : "BUNDLE"}
              </button>
            </>
          ) : (
            <div className="text-[9px] text-center py-2" style={{ color: mutedFg }}>by {permit.claimed_by?.split("@")[0]}</div>
          )}
        </div>
      </div>

      {/* Bundle preview */}
      <AnimatePresence>
        {revealed && permit.outreach_bundle && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="mt-4 overflow-hidden"
          >
            <div className="rounded-2xl p-3 text-[11px] leading-relaxed whitespace-pre-wrap"
              style={{ background: subBg, border: `0.5px solid ${borderColor}`, color: mutedFg }}>
              {permit.outreach_bundle}
            </div>
            <button onClick={handleCopyBundle} className="mt-2 text-[10px] uppercase tracking-widest underline" style={{ color: mutedFg }}>
              {copied ? "Copied ✓" : "Copy bundle"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {bundleDone && permit.outreach_bundle && !revealed && (
        <button onClick={() => setRevealed(true)} className="mt-3 text-[10px] uppercase tracking-widest underline w-full text-center" style={{ color: mutedFg }}>
          View draft
        </button>
      )}
    </motion.div>
  );
}