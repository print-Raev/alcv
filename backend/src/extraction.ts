import { z } from 'zod';

const weakSchema = z.object({
  rawText: z.string().optional(),
  rows: z.array(z.record(z.any())).optional()
});

const patterns = {
  email: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  phone: /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
  sqft: /(\d[\d,]*)\s?(sf|sq\.?\s?ft|square\s?feet)/i,
  value: /\$\s?([\d,]+(?:\.\d+)?)/,
  due: /(due|bid date)[:\s]+([\w\-/, ]{4,20})/i
};

export function extractFromPayload(payload: unknown) {
  const parsed = weakSchema.safeParse(payload);
  const text = parsed.success ? parsed.data.rawText || JSON.stringify(parsed.data.rows || []) : '';

  const pick = (value: string | number | null, confidenceScore: number) => ({ value, confidenceScore });

  const fields = {
    projectName: pick((text.match(/project[:\s]+([^\n,]+)/i)?.[1] || '').trim() || null, 0.62),
    address: pick((text.match(/\d+\s+[^\n,]+(?:street|st|ave|road|rd|blvd|lane|ln)/i)?.[0] || '').trim() || null, 0.56),
    squareFootage: pick(Number((text.match(patterns.sqft)?.[1] || '0').replace(/,/g, '')) || null, 0.72),
    projectValue: pick(Number((text.match(patterns.value)?.[1] || '0').replace(/,/g, '')) || null, 0.63),
    permitStatus: pick(text.match(/permit[:\s]+([^\n,]+)/i)?.[1] || null, 0.45),
    contractorName: pick(text.match(/contractor[:\s]+([^\n,]+)/i)?.[1] || null, 0.61),
    contactName: pick(text.match(/contact[:\s]+([^\n,]+)/i)?.[1] || null, 0.58),
    contactEmail: pick(text.match(patterns.email)?.[0] || null, 0.84),
    contactPhone: pick(text.match(patterns.phone)?.[0] || null, 0.77),
    bidDueDate: pick(text.match(patterns.due)?.[2] || null, 0.43),
    scopeNotes: pick(text.slice(0, 280) || null, 0.51)
  };

  return fields;
}

const aliases: Record<string, string[]> = {
  projectName: ['project', 'job name', 'site'],
  address: ['address', 'location', 'site address'],
  squareFootage: ['sqft', 'sf', 'square footage'],
  contractorName: ['contractor', 'gc', 'builder'],
  contactName: ['contact', 'pm', 'superintendent'],
  contactEmail: ['email', 'e-mail'],
  contactPhone: ['phone', 'mobile', 'cell'],
  bidDueDate: ['due date', 'bid due', 'deadline'],
  scopeNotes: ['scope', 'notes', 'description']
};

export function fuzzyMapRow(row: Record<string, unknown>) {
  const normalized = Object.keys(row).reduce<Record<string, unknown>>((acc, k) => {
    const lower = k.toLowerCase();
    const matched = Object.entries(aliases).find(([, options]) => options.some((o) => lower.includes(o)));
    acc[matched?.[0] || k] = row[k];
    return acc;
  }, {});

  return {
    ...normalized,
    weakData: !normalized.projectName || !normalized.squareFootage
  };
}
