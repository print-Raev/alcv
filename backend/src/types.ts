export const STATUSES = [
  'SittingOnData',
  'NeedsEnrichment',
  'ReadyToBid',
  'Drafted',
  'Sent',
  'FollowUpDue',
  'Replied',
  'Won',
  'Lost'
] as const;

export type LeadStatus = (typeof STATUSES)[number];

export type Lead = {
  id: string;
  project_name: string;
  address: string | null;
  square_footage: number | null;
  contractor_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  bid_due_date: string | null;
  scope_notes: string | null;
  status: LeadStatus;
  is_deleted: boolean;
  competitive_price: number | null;
  standard_price: number | null;
  premium_price: number | null;
  sent_at: string | null;
  auto_followup_approved: boolean;
};
