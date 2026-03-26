import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import crypto from 'node:crypto';
import { parse } from 'csv-parse/sync';
import { z } from 'zod';
import { extractFromPayload, fuzzyMapRow } from './extraction.js';
import { buildPricing } from './pricing.js';
import { getLocalStore } from './db.js';
import { STATUSES } from './types.js';

const app = express();
const upload = multer();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const leadPatchSchema = z.object({
  projectName: z.string().optional(),
  squareFootage: z.number().nullable().optional(),
  contractorName: z.string().nullable().optional(),
  status: z.enum(STATUSES).optional(),
  autoFollowupApproved: z.boolean().optional()
}).passthrough();

const localStore = getLocalStore();

function seedLeads() {
  if (localStore.length) return;
  const now = new Date().toISOString();
  const make = (data: Record<string, unknown>) => ({
    id: crypto.randomUUID(),
    project_name: 'Untitled opportunity',
    status: 'SittingOnData',
    is_deleted: false,
    competitive_price: null,
    standard_price: null,
    premium_price: null,
    sent_at: null,
    auto_followup_approved: false,
    timeline: [{ at: now, type: 'Seed', note: 'Seed lead for launch hardening pass.' }],
    notes: [],
    ...data
  });

  localStore.push(
    make({ project_name: 'Alta Ridge Mixed-Use Tower', address: '2200 W 7th St, Austin, TX', square_footage: 18000, contractor_name: 'Pinnacle General', contact_name: 'Laura Kim', contact_email: 'laura.kim@pinnaclegc.com', contact_phone: '512-555-0187', bid_due_date: '2026-04-02', scope_notes: 'Final clean before owner walk-through.', status: 'ReadyToBid' }),
    make({ project_name: 'Creekside Medical Shell', address: '401 State St, Nashville, TN', square_footage: 9800, contractor_name: 'Orchard Build Group', contact_name: null, contact_email: null, contact_phone: null, scope_notes: 'Need contact confirmation from estimator.', status: 'NeedsEnrichment' }),
    make({ project_name: 'Bayfront Retail Retrofit', address: '17 Marina Blvd, Tampa, FL', square_footage: null, contractor_name: 'Merit Contracting', contact_name: 'James Patel', contact_email: 'james@meritco.com', contact_phone: '813-555-0021', scope_notes: 'Square footage missing. Bid requested by PM.', status: 'SittingOnData' }),
    make({ project_name: 'Northline Warehouse TI', address: '7800 Airport Rd, Dallas, TX', square_footage: 35000, contractor_name: null, contact_name: 'Amber Cole', contact_email: 'amber.cole@northline.dev', contact_phone: '214-555-8472', scope_notes: 'Contractor not supplied in invite.', status: 'SittingOnData' }),
    make({ project_name: 'Messy text intake lead', address: null, square_footage: null, contractor_name: null, contact_name: null, contact_email: null, contact_phone: null, scope_notes: 'Raw paste: permit approved, 11k sf maybe, final clean + windows, due Friday.', status: 'SittingOnData' })
  );
}

seedLeads();

const mapLead = (lead: any) => ({
  id: lead.id,
  projectName: lead.project_name,
  address: lead.address,
  squareFootage: lead.square_footage,
  contractorName: lead.contractor_name,
  contactName: lead.contact_name,
  contactEmail: lead.contact_email,
  contactPhone: lead.contact_phone,
  bidDueDate: lead.bid_due_date,
  scopeNotes: lead.scope_notes,
  status: lead.status,
  isDeleted: !!lead.is_deleted,
  competitivePrice: lead.competitive_price,
  standardPrice: lead.standard_price,
  premiumPrice: lead.premium_price,
  sentAt: lead.sent_at,
  autoFollowupApproved: !!lead.auto_followup_approved,
  timeline: lead.timeline || [],
  notes: lead.notes || []
});

app.get('/api/leads', (_req, res) => {
  res.json(localStore.filter((l) => !l.is_deleted).map(mapLead));
});

app.post('/api/intake', upload.single('file'), (req, res) => {
  let rawText = req.body.rawText || '';
  if (req.file) rawText += `\n${req.file.originalname}\n${req.file.buffer.toString('utf-8')}`;
  const extraction = extractFromPayload({ rawText });
  const lead = {
    id: crypto.randomUUID(),
    project_name: String(extraction.projectName.value || 'Untitled opportunity'),
    address: extraction.address.value,
    square_footage: extraction.squareFootage.value,
    contractor_name: extraction.contractorName.value,
    contact_name: extraction.contactName.value,
    contact_email: extraction.contactEmail.value,
    contact_phone: extraction.contactPhone.value,
    bid_due_date: extraction.bidDueDate.value,
    scope_notes: extraction.scopeNotes.value,
    status: 'SittingOnData',
    is_deleted: false,
    competitive_price: null,
    standard_price: null,
    premium_price: null,
    sent_at: null,
    auto_followup_approved: false,
    timeline: [{ at: new Date().toISOString(), type: 'Intake', note: 'Lead created from universal intake terminal' }],
    notes: []
  };
  localStore.unshift(lead);
  res.json({ lead: mapLead(lead), extraction });
});

app.post('/api/imports/commit', (req, res) => {
  const rows = z.array(z.record(z.any())).parse(req.body.rows || []);
  const preview = rows.map((r) => fuzzyMapRow(r));
  preview.forEach((row: any) => {
    localStore.unshift({
      id: crypto.randomUUID(),
      project_name: String(row.projectName || row.project || 'Imported opportunity'),
      address: (row.address as string) || null,
      square_footage: Number(row.squareFootage || row.sqft || 0) || null,
      contractor_name: (row.contractorName as string) || null,
      contact_name: (row.contactName as string) || null,
      contact_email: (row.contactEmail as string) || null,
      contact_phone: (row.contactPhone as string) || null,
      bid_due_date: (row.bidDueDate as string) || null,
      scope_notes: (row.scopeNotes as string) || null,
      status: row.weakData ? 'NeedsEnrichment' : 'ReadyToBid',
      is_deleted: false,
      competitive_price: null,
      standard_price: null,
      premium_price: null,
      sent_at: null,
      auto_followup_approved: false,
      timeline: [{ at: new Date().toISOString(), type: 'Import', note: row.weakData ? 'Weak data - needs enrichment' : 'Imported and ready' }],
      notes: []
    });
  });
  res.json({ imported: preview.length, preview });
});

app.patch('/api/leads/:id', (req, res) => {
  const payload = leadPatchSchema.parse(req.body);
  const lead = localStore.find((item) => item.id === req.params.id && !item.is_deleted);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const previousStatus = String(lead.status);
  Object.assign(lead, {
    project_name: payload.projectName ?? lead.project_name,
    square_footage: payload.squareFootage ?? lead.square_footage,
    contractor_name: payload.contractorName ?? lead.contractor_name,
    status: payload.status ?? lead.status,
    auto_followup_approved: payload.autoFollowupApproved ?? lead.auto_followup_approved
  });

  if (payload.status === 'Sent' && previousStatus !== 'Sent') {
    lead.sent_at = new Date().toISOString();
    lead.timeline = [...(lead.timeline as any[]), { at: new Date().toISOString(), type: 'Sent', note: 'Bid sent to buyer.' }];
    if (!['Replied', 'Won', 'Lost'].includes(String(lead.status))) {
      lead.timeline = [...(lead.timeline as any[]), { at: new Date().toISOString(), type: 'FollowUpDue', note: 'Follow-up cycle created (D+2, D+5, D+9).' }];
    }
  }

  if (payload.status === 'FollowUpDue') {
    lead.timeline = [...(lead.timeline as any[]), { at: new Date().toISOString(), type: 'FollowUpDue', note: 'Follow-up is now due.' }];
  }

  res.json(mapLead(lead));
});

app.post('/api/leads/:id/proposal', (req, res) => {
  const lead = localStore.find((item) => item.id === req.params.id && !item.is_deleted);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const pricing = buildPricing({
    squareFootage: Number(lead.square_footage || 0),
    debrisLevel: Number(req.body.debrisLevel || 0),
    glassDetail: Number(req.body.glassDetail || 0),
    urgency: Number(req.body.urgency || 0),
    floors: Number(req.body.floors || 1),
    accessDifficulty: Number(req.body.accessDifficulty || 0)
  });

  Object.assign(lead, {
    ...pricing,
    status: 'Drafted',
    timeline: [...(lead.timeline as any[]), { at: new Date().toISOString(), type: 'ProposalGenerated', note: 'Draft generated. Not sent yet.' }]
  });

  res.json(mapLead(lead));
});

app.delete('/api/leads/:id', (req, res) => {
  const lead = localStore.find((item) => item.id === req.params.id && !item.is_deleted);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  lead.is_deleted = true;
  res.json({ ok: true });
});

app.get('/api/imports/preview', upload.single('file'), (req, res) => {
  const raw = req.body.rawText || (req.file?.buffer?.toString('utf-8') ?? '');
  let rows: Record<string, unknown>[] = [];
  if (!raw.trim()) return res.json({ count: 0, preview: [] });
  if (raw.trim().startsWith('{') || raw.trim().startsWith('[')) {
    const parsed = JSON.parse(raw);
    rows = Array.isArray(parsed) ? parsed : [parsed];
  } else {
    rows = parse(raw, { columns: true, skip_empty_lines: true });
  }
  const preview = rows.map((row) => fuzzyMapRow(row));
  res.json({ count: preview.length, preview });
});

app.get('/api/analytics', (_req, res) => {
  const active = localStore.filter((l) => !l.is_deleted);
  const sent = active.filter((l) => l.status === 'Sent' || l.status === 'FollowUpDue' || l.sent_at);
  const allBids = active.filter((l) => l.standard_price).map((l) => Number(l.standard_price || 0));
  const avgBid = allBids.length ? allBids.reduce((a, b) => a + b, 0) / allBids.length : 0;
  const pipelineValue = active.filter((l) => !['Lost'].includes(String(l.status))).reduce((sum, l) => sum + Number(l.standard_price || 0), 0);
  const projectedEarnings = pipelineValue * 0.36;
  const idleCount = active.filter((l) => l.status === 'SittingOnData').length;
  const unlocked = sent.length >= 3;

  res.json({
    sentCount: sent.length,
    avgBid: unlocked ? avgBid : 0,
    pipelineValue: unlocked ? pipelineValue : 0,
    projectedEarnings: unlocked ? projectedEarnings : 0,
    idleCount,
    unlocked
  });
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`ALLCLEAR API running on ${port}`));
