import React from "react";
import { format } from "date-fns";
import { detectState } from "@/components/proposal/regionUtils";

function buildAutoUpsells(project) {
  const text = [project.ai_extracted_detail, project.notes, project.project_name, project.address].filter(Boolean).join(" ").toLowerCase();
  const upsells = [];
  if (/exterior glass|curtain wall|exterior window/.test(text)) {
    upsells.push({ label: "Exterior Glass & Window Frame Cleaning", price: Math.max(150, (project.square_footage || 0) * 0.04) });
  } else if (/window frame/.test(text)) {
    upsells.push({ label: "Window Frame Detail Cleaning", price: Math.max(95, (project.square_footage || 0) * 0.02) });
  }
  if (/vct|luxury vinyl|lvt|lvp/.test(text)) {
    upsells.push({ label: "VCT/LVP Strip, Scrub & Finish", price: Math.max(200, (project.square_footage || 0) * 0.06) });
  }
  return upsells;
}

const NAVY = "#1a2d5a";

export default function ProposalPreview({ project, references }) {
  const detectedState = detectState(project.address);
  const basePrice = (project.square_footage || 0) * (project.price_per_sqft ?? 0.25);
  const autoUpsells = buildAutoUpsells(project);
  const autoUpsellTotal = autoUpsells.reduce((sum, u) => sum + u.price, 0);
  const totalPrice = basePrice + (project.mobilization_fee || 0) + autoUpsellTotal;
  const today = format(new Date(), "MMMM d, yyyy");
  const customItems = project.scope_custom_items || [];
  const matchedRefs = (references || []).filter(r => r.project_type === project.project_type).slice(0, 2);

  return (
    <div
      id="proposal-preview"
      style={{
        fontFamily: "'Arial', 'Helvetica Neue', sans-serif",
        background: "#f0f0ee",
        color: "#1a1a1a",
        width: "816px",
        margin: "0 auto",
        padding: "0",
      }}
    >
      {/* Top accent bar */}
      <div style={{ height: 6, background: `linear-gradient(90deg, ${NAVY} 70%, #c8a85a 100%)` }} />

      {/* Header */}
      <div style={{ background: "#fff", padding: "28px 48px 20px", textAlign: "center", borderBottom: `1px solid #ddd` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 4 }}>
          <svg viewBox="0 0 44 44" width="44" height="44" fill="none">
            <path d="M22 3 L41 14 L41 30 L22 41 L3 30 L3 14 Z" fill="none" stroke={NAVY} strokeWidth="2" />
            <path d="M22 10 L34 17 L34 27 L22 34 L10 27 L10 17 Z" fill={NAVY} opacity="0.12" />
            <path d="M14 22 L22 11 L30 22" stroke={NAVY} strokeWidth="2.5" fill="none" strokeLinejoin="round" />
            <path d="M14 28 L22 17 L30 28" stroke={NAVY} strokeWidth="2.5" fill="none" strokeLinejoin="round" />
          </svg>
          <div style={{ textAlign: "left" }}>
            <div style={{
              fontSize: 26, fontWeight: 800, letterSpacing: "0.14em",
              textTransform: "uppercase", color: NAVY,
              fontFamily: "'Georgia', serif", lineHeight: 1
            }}>
              AllClear Services
            </div>
          </div>
        </div>
        <p style={{ fontSize: 11, letterSpacing: "0.12em", color: "#888", textTransform: "uppercase", margin: "6px 0 4px" }}>
          Post-Construction &amp; Commercial Turnover Specialists
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 10, color: "#aaa", letterSpacing: "0.18em", textTransform: "uppercase" }}>
          <span style={{ height: 1, width: 36, background: "#ccc", display: "inline-block" }} />
          Licensed &nbsp;|&nbsp; Bonded &nbsp;|&nbsp; Insured
          <span style={{ height: 1, width: 36, background: "#ccc", display: "inline-block" }} />
        </div>
      </div>

      {/* Title bar */}
      <div style={{ background: "#fff", padding: "14px 48px", borderBottom: `2.5px solid ${NAVY}`, textAlign: "center" }}>
        <h1 style={{ fontSize: 15, fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: NAVY, margin: 0 }}>
          Final Turnover Cleaning Proposal
        </h1>
      </div>

      {/* Body */}
      <div style={{ background: "#fff", padding: "0 48px 0" }}>

        {/* Section 1 — Project Information */}
        <SectionBlock number="1" title="Project Information">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 32px", fontSize: 13 }}>
            <div>
              <strong>Attention:</strong> {project.client_name || "—"}
              {project.client_title && <span style={{ color: "#666" }}> · {project.client_title}</span>}
            </div>
            <div><strong>Project Name:</strong> {project.project_name || "—"}</div>
            {project.client_company && (
              <div><strong>Company:</strong> {project.client_company}</div>
            )}
            <div><strong>Project Address:</strong> {project.address || "—"}</div>
            <div>
              <strong>Total Square Footage:</strong>{" "}
              {project.square_footage ? `${Number(project.square_footage).toLocaleString()} SQ FT` : "—"}
            </div>
            {project.client_email && (
              <div><strong>Email:</strong> {project.client_email}</div>
            )}
            {project.client_phone && (
              <div><strong>Phone:</strong> {project.client_phone}</div>
            )}
            {project.client_website && (
              <div><strong>Website:</strong> {project.client_website}</div>
            )}
            <div><strong>Proposal Date:</strong> {today}</div>
          </div>
        </SectionBlock>

        {/* Section 2 — Company Overview */}
        <SectionBlock number="2" title="Company Overview">
          <p style={{ fontSize: 13, lineHeight: 1.65, color: "#333", margin: "0 0 8px" }}>
            <strong>ALLCLEAR SERVICES</strong> delivers precision post-construction cleaning for commercial, healthcare,
            and high-standard environments. We operate under structured turnover protocols designed to support
            general contractors, developers, and project managers in achieving seamless project delivery.
          </p>
          <p style={{ fontSize: 13, lineHeight: 1.65, color: "#333", margin: 0 }}>
            Our crews are trained in post-construction site procedures and execute services with efficiency,
            safety, and attention to detail.
          </p>
        </SectionBlock>

        {/* Section 3 — Scope of Work */}
        <SectionBlock number="3" title="Scope of Work – Turnover Standard">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px" }}>
            <div>
              <SubSection label="3.1 Interior Surfaces">
                <Bullet text="Clean cabinets (interior & exterior)" />
                <Bullet text="Clean countertops, edges & backsplash" />
                <Bullet text="Clean sinks & plumbing fixtures" />
                <Bullet text="Clean mirrors & glass surfaces" />
              </SubSection>
              <SubSection label="3.3 Detail Finishing">
                <Bullet text="Remove debris from all surfaces" />
                <Bullet text="Collect packaging, labels & manuals (left as directed)" />
                <Bullet text="Dispose of plastic & jobsite debris properly" />
              </SubSection>
            </div>
            <div>
              <SubSection label="3.2 Restroom Fixtures">
                <Bullet text="Clean toilets (remove stickers/labels)" />
                <Bullet text="Clean urinals" />
                <Bullet text="Clean showers" />
                <Bullet text="Remove adhesive residue & excess caulking" />
              </SubSection>
              <SubSection label="4. Site Execution Protocol">
                <Bullet text="Cleaning performed up to 12 ft. above finished floor" />
                <Bullet text="Access credentials provided prior to mobilization" />
                <Bullet text="Controlled barriers used when necessary" />
                <Bullet text="All equipment & materials supplied by ALL CLEARSTIES" />
                <Bullet text="Final walkthrough available upon request" />
              </SubSection>
            </div>
          </div>

          {customItems.length > 0 && (
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #eee" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 4 }}>Additional Services</p>
              {customItems.map((item, i) => <Bullet key={i} text={item} />)}
            </div>
          )}
        </SectionBlock>

        {/* Section 5 — Investment Summary */}
        <SectionBlock number="5" title="Investment Summary">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px", alignItems: "start" }}>
            <div style={{ fontSize: 13 }}>
              <div style={{ marginBottom: 6 }}>
                <strong>Project Size:</strong>{" "}
                {project.square_footage ? `${Number(project.square_footage).toLocaleString()} SQ FT` : "—"}
              </div>
              <div style={{ marginBottom: 6 }}>
                <strong>Rate:</strong> ${project.price_per_sqft ?? 0.25} / SQ FT
              </div>
              {(project.mobilization_fee || 0) > 0 && (
                <div style={{ marginBottom: 6 }}>
                  <strong>Fuel / Travel Surcharge:</strong> ${Number(project.mobilization_fee).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              )}
              {autoUpsells.map((u, i) => (
                <div key={i} style={{ marginBottom: 6, color: NAVY }}>
                  <strong>{u.label}:</strong> ${u.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              ))}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#555", marginBottom: 6 }}>
                Total Contract Value:
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: NAVY, letterSpacing: "0.04em" }}>
                ${totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </SectionBlock>

        {/* Section 6 — Terms & Conditions */}
        <SectionBlock number="6" title="Terms &amp; Conditions">
          <div style={{ fontSize: 12, color: "#444", lineHeight: 1.65, display: "grid", gap: 8 }}>
            <div><strong>Site Readiness:</strong> Client must provide 100% access to all areas, including functional water and power.</div>
            <div><strong>Hidden Conditions:</strong> Bid excludes removal of hazardous materials or excessive debris hidden under protective trade coverings unless specified in writing prior to mobilization.</div>
            <div><strong>Cancellation:</strong> 48-hour notice required for rescheduling. Failure to provide notice will result in a <strong>$250 Dry Run fee</strong> to cover crew deployment costs.</div>
            <div><strong>Payment Terms:</strong> Due <strong>Net-15</strong> upon Certificate of Occupancy issuance or final project walkthrough, whichever occurs first.</div>
            {detectedState === "CA" && (
              <div style={{ marginTop: 8, padding: "10px 14px", background: "#f0f4ff", border: "1px solid #b0bfdf", borderRadius: 6 }}>
                <strong>California Preliminary Notice (20-Day Notice):</strong> Pursuant to California Civil Code §8200 et seq., AllClear Services shall serve a California Preliminary Notice within 20 days of first furnishing labor or materials. This notice is required to preserve lien rights under California law and does not constitute a claim or indication of any dispute. Client acknowledges receipt of this disclosure.
              </div>
            )}
          </div>
        </SectionBlock>

        {/* References */}
        {matchedRefs.length > 0 && (
          <div style={{ padding: "14px 0", borderTop: "1px solid #eee" }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", marginBottom: 10 }}>
              {project.project_type} References
            </p>
            {matchedRefs.map((ref, idx) => (
              <div key={idx} style={{ display: "flex", gap: 10, marginBottom: 8, fontSize: 13 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 4, background: NAVY,
                  color: "#fff", fontSize: 10, fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1
                }}>{idx + 1}</div>
                <div>
                  <strong style={{ color: "#222" }}>{ref.project_name}</strong>
                  <span style={{ color: "#777" }}> · {ref.client_company}{ref.location ? ` · ${ref.location}` : ""}{ref.square_footage ? ` · ${Number(ref.square_footage).toLocaleString()} sqft` : ""}</span>
                  {ref.testimonial && (
                    <p style={{ fontSize: 11, color: "#777", fontStyle: "italic", margin: "2px 0 0" }}>
                      "{ref.testimonial}" — {ref.client_name}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Why Choose Value Block */}
        <div style={{ padding: "18px 0 16px", borderTop: "1px solid #eee", textAlign: "center", background: "#fafaf9" }}>
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "#999", margin: "0 0 10px" }}>
            Why Choose AllClear Services?
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
            {["✓ Proven Post-Construction Protocols", "✓ Licensed, Bonded & Insured", "✓ CO-Ready Clean Guarantee"].map((item, i) => (
              <span key={i} style={{
                fontSize: 11, color: "#222", fontWeight: 600,
                padding: "5px 14px", borderRadius: 20,
                border: `1px solid ${NAVY}40`, background: `${NAVY}0a`,
              }}>{item}</span>
            ))}
          </div>
        </div>

      </div>

      {/* Footer */}
      <div style={{ background: NAVY, padding: "16px 48px", textAlign: "center", color: "#fff" }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", margin: 0 }}>
          AllClear Services &nbsp;|&nbsp; Licensed &nbsp;|&nbsp; Bonded &nbsp;|&nbsp; Insured
        </p>
      </div>
    </div>
  );
}

function SectionBlock({ number, title, children }) {
  return (
    <div style={{ padding: "18px 0", borderBottom: "1px solid #eee" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 4, background: NAVY,
          color: "#fff", fontSize: 13, fontWeight: 800,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
        }}>
          {number}
        </div>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>{title}</h2>
      </div>
      <div style={{ paddingLeft: 36 }}>{children}</div>
    </div>
  );
}

function SubSection({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: "#1a1a1a", marginBottom: 5, marginTop: 0 }}>{label}</p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>{children}</ul>
    </div>
  );
}

function Bullet({ text }) {
  return (
    <li style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 12, color: "#444", marginBottom: 3, lineHeight: 1.5 }}>
      <span style={{ marginTop: 5, width: 5, height: 5, borderRadius: "50%", background: "#555", flexShrink: 0, display: "inline-block" }} />
      {text}
    </li>
  );
}