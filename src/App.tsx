import { useEffect, useMemo, useState } from 'react';
import { deleteLead, fetchAnalytics, fetchLeads, generateProposal, importRows, intake, updateLead } from './api';
import type { Analytics, Lead, LeadStatus } from './types';
import './index.css';

const STAGES: LeadStatus[] = ['SittingOnData', 'NeedsEnrichment', 'ReadyToBid', 'Drafted', 'Sent', 'FollowUpDue', 'Replied', 'Won', 'Lost'];
const KANBAN: LeadStatus[] = ['SittingOnData', 'ReadyToBid', 'Drafted', 'Sent', 'FollowUpDue'];

function parseRowsFromText(text: string) {
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
    if (lines.length < 2 || !lines[0].includes(',')) return [];
    const headers = lines[0].split(',').map((h) => h.trim());
    return lines.slice(1).map((line) => {
      const parts = line.split(',').map((p) => p.trim());
      return headers.reduce<Record<string, string>>((acc, key, i) => {
        acc[key] = parts[i] || '';
        return acc;
      }, {});
    });
  }
}

export default function App() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [intakeText, setIntakeText] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<Lead | null>(null);
  const [busy, setBusy] = useState(false);

  const selected = useMemo(() => leads.find((l) => l.id === selectedId) ?? null, [leads, selectedId]);
  const counts = useMemo(() => {
    const active = leads.filter((l) => !l.isDeleted);
    return {
      SittingOnData: active.filter((l) => l.status === 'SittingOnData').length,
      ReadyToBid: active.filter((l) => l.status === 'ReadyToBid').length,
      Drafted: active.filter((l) => l.status === 'Drafted').length,
      Sent: active.filter((l) => l.status === 'Sent').length,
      FollowUpDue: active.filter((l) => l.status === 'FollowUpDue').length
    };
  }, [leads]);

  const refresh = async () => {
    const [leadData, analyticsData] = await Promise.all([fetchLeads(), fetchAnalytics()]);
    setLeads(leadData);
    setAnalytics(analyticsData);
    if (!selectedId && leadData[0]) setSelectedId(leadData[0].id);
  };

  useEffect(() => {
    refresh();
  }, []);

  const withBusy = async (task: () => Promise<void>) => {
    setBusy(true);
    try {
      await task();
    } finally {
      setBusy(false);
    }
  };

  const patchLeadLocal = (id: string, patch: Partial<Lead>) => {
    setLeads((prev) => prev.map((lead) => (lead.id === id ? { ...lead, ...patch } : lead)));
  };

  const handleIntake = async (file?: File) => withBusy(async () => {
    const fd = new FormData();
    if (intakeText) fd.append('rawText', intakeText);
    if (file) fd.append('file', file);
    const result = await intake(fd);
    setIntakeText('');
    const lead = result?.lead as Lead | undefined;
    if (lead) {
      setLeads((prev) => [lead, ...prev]);
      setSelectedId(lead.id);
    } else {
      await refresh();
    }
  });

  const commitImport = async () => withBusy(async () => {
    const rows = parseRowsFromText(intakeText);
    if (!rows.length) return;
    await importRows({ rows });
    setIntakeText('');
    await refresh();
  });

  const byStage = (stage: LeadStatus) => leads.filter((lead) => lead.status === stage && !lead.isDeleted);

  return (
    <div className="app">
      <header>
        <h1>ALLCLEAR</h1>
        <p>Money system for post-construction cleaning bids</p>
      </header>

      <section className="metrics">
        <div className="metric"><span>Sitting on Data</span><strong>{counts.SittingOnData}</strong></div>
        <div className="metric"><span>Drafted</span><strong>{counts.Drafted}</strong></div>
        <div className="metric"><span>Sent</span><strong>{counts.Sent}</strong></div>
        <div className="metric"><span>Follow-up Due</span><strong>{counts.FollowUpDue}</strong></div>
        {analytics && analytics.sentCount >= 3 ? (
          <>
            <div className="metric pulse"><span>Avg bid</span><strong>${Math.round(analytics.avgBid).toLocaleString()}</strong></div>
            <div className="metric pulse"><span>Pipeline value</span><strong>${Math.round(analytics.pipelineValue).toLocaleString()}</strong></div>
          </>
        ) : <div className="metric warning"><span>Revenue Locked</span><strong>{analytics?.sentCount ?? 0}/3 sent bids</strong></div>}
      </section>

      <section className="urgency">
        <h2>Operational Urgency</h2>
        <p>{counts.SittingOnData > 0 ? `${counts.SittingOnData} lead(s) are sitting without bid action.` : 'No leads are sitting idle.'}</p>
      </section>

      <section className="layout">
        <div className="panel intake" onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files[0]) void handleIntake(e.dataTransfer.files[0]); }} onDragOver={(e) => e.preventDefault()}>
          <h2>Universal Intake Terminal</h2>
          <textarea value={intakeText} onChange={(e) => setIntakeText(e.target.value)} placeholder="Paste messy bid text, JSON rows, or CSV." />
          <div className="row">
            <input type="file" onChange={(e) => e.target.files?.[0] && void handleIntake(e.target.files[0])} />
            <button disabled={busy} onClick={() => void handleIntake()}>{busy ? 'Processing…' : 'Create Lead From Intake'}</button>
            <button disabled={busy} onClick={() => void commitImport()}>Commit JSON/CSV Rows</button>
          </div>
          <small className="muted">Incomplete data is accepted. Weak imports are marked NeedsEnrichment.</small>
        </div>

        <div className="panel crm">
          <h2>Pipeline</h2>
          <div className="columns">
            {KANBAN.map((stage) => (
              <div key={stage} className="column">
                <h3>{stage} <span>{byStage(stage).length}</span></h3>
                {byStage(stage).map((lead) => (
                  <button key={lead.id} className={`card ${selectedId === lead.id ? 'active' : ''}`} onClick={() => setSelectedId(lead.id)}>
                    <strong title={lead.projectName}>{lead.projectName || 'Untitled project'}</strong>
                    <span>{lead.squareFootage ?? 'Unknown'} sqft</span>
                    <span>{lead.contractorName || 'Contractor missing'}</span>
                  </button>
                ))}
                {!byStage(stage).length && <p className="empty">No leads.</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="panel details">
          <h2>Lead Detail + Proposal</h2>
          {selected ? (
            <div className="split">
              <div className="preview">
                <h3>Proposal Preview</h3>
                <p><b>Summary:</b> {selected.scopeNotes || 'Post-construction clean with detailed final handoff standards and safety-compliant process.'}</p>
                <p><b>Project:</b> {selected.projectName} • {selected.address || 'Address TBD'}</p>
                <p><b>Scope of Work:</b> Debris sweep, surface wipe-down, window detailing, final polish, punch-list touch-up.</p>
                <p><b>Pricing Breakdown:</b></p>
                <ul>
                  <li>Competitive: ${selected.competitivePrice ?? 0}</li>
                  <li>Standard: ${selected.standardPrice ?? 0}</li>
                  <li>Premium: ${selected.premiumPrice ?? 0}</li>
                </ul>
                <p><b>Assumptions:</b> Utilities available, standard access windows, no hazardous waste remediation.</p>
                <p><b>Exclusions:</b> Paint removal, permanent stain restoration, major debris haul-off.</p>
                <p><b>Acceptance:</b> Signature confirms scope, terms, and schedule alignment.</p>
                <button onClick={() => window.print()}>Print Proposal</button>
              </div>
              <div className="controls">
                <div className="stateStrip">
                  <span className="tag">Generated: {selected.status === 'Drafted' ? 'Yes' : 'No'}</span>
                  <span className="tag">Sent: {selected.status === 'Sent' || selected.status === 'FollowUpDue' ? 'Yes' : 'No'}</span>
                </div>
                <label>Status
                  <select value={selected.status} onChange={async (e) => {
                    const status = e.target.value as LeadStatus;
                    patchLeadLocal(selected.id, { status });
                    await updateLead(selected.id, { status });
                    await refresh();
                  }}>
                    {STAGES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </label>
                <label>
                  <input type="checkbox" checked={selected.autoFollowupApproved} onChange={async (e) => {
                    patchLeadLocal(selected.id, { autoFollowupApproved: e.target.checked });
                    await updateLead(selected.id, { autoFollowupApproved: e.target.checked });
                  }} /> Auto follow-up approved
                </label>
                <button onClick={async () => {
                  patchLeadLocal(selected.id, { status: 'Drafted' });
                  await generateProposal(selected.id, { floors: 1, debrisLevel: 2, accessDifficulty: 1, glassDetail: 1, urgency: 1 });
                  await refresh();
                }}>Generate Draft (Not Sent)</button>
                <button className="accent" onClick={async () => {
                  patchLeadLocal(selected.id, { status: 'Sent' });
                  await updateLead(selected.id, { status: 'Sent' });
                  await refresh();
                }}>Send Bid</button>
                <button onClick={async () => {
                  patchLeadLocal(selected.id, { status: 'FollowUpDue' });
                  await updateLead(selected.id, { status: 'FollowUpDue' });
                  await refresh();
                }}>Mark Follow-up Due</button>
                <button className="danger" onClick={() => setConfirmDelete(selected)}>Delete Bid</button>

                <div>
                  <h4>Activity Timeline</h4>
                  {selected.timeline.length ? selected.timeline.map((item) => (
                    <p key={`${item.at}-${item.type}`} className="timeline"><b>{item.type}</b> · {new Date(item.at).toLocaleString()}<br />{item.note}</p>
                  )) : <p className="empty">No activity yet.</p>}
                </div>
              </div>
            </div>
          ) : <p>Select a lead.</p>}
        </div>
      </section>

      {confirmDelete && (
        <div className="modalWrap">
          <div className="modal">
            <h3>Delete bid?</h3>
            <p>This performs a soft delete and updates counts instantly.</p>
            <div className="row">
              <button onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="danger" onClick={async () => {
                await deleteLead(confirmDelete.id);
                setLeads((prev) => prev.filter((l) => l.id !== confirmDelete.id));
                if (selectedId === confirmDelete.id) setSelectedId('');
                setConfirmDelete(null);
                await refresh();
              }}>Confirm Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
