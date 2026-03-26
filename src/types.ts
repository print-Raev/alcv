export type LeadStatus =
  | 'SittingOnData'
  | 'NeedsEnrichment'
  | 'ReadyToBid'
  | 'Drafted'
  | 'Sent'
  | 'FollowUpDue'
  | 'Replied'
  | 'Won'
  | 'Lost';

export type FieldExtraction = {
  value: string | number | null;
  confidenceScore: number;
};

export type ExtractionFields = {
  projectName?: FieldExtraction;
  address?: FieldExtraction;
  squareFootage?: FieldExtraction;
  projectValue?: FieldExtraction;
  permitStatus?: FieldExtraction;
  contractorName?: FieldExtraction;
  contactName?: FieldExtraction;
  contactEmail?: FieldExtraction;
  contactPhone?: FieldExtraction;
  bidDueDate?: FieldExtraction;
  scopeNotes?: FieldExtraction;
};

export type Lead = {
  id: string;
  projectName: string;
  address?: string | null;
  squareFootage?: number | null;
  contractorName?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  bidDueDate?: string | null;
  scopeNotes?: string | null;
  status: LeadStatus;
  isDeleted: boolean;
  competitivePrice?: number | null;
  standardPrice?: number | null;
  premiumPrice?: number | null;
  sentAt?: string | null;
  autoFollowupApproved: boolean;
  timeline: Array<{ at: string; type: string; note: string }>;
  notes: Array<{ at: string; body: string }>;
};

export type Analytics = {
  sentCount: number;
  avgBid: number;
  pipelineValue: number;
  projectedEarnings: number;
  idleCount: number;
  unlocked?: boolean;
};
