import type { Analytics, Lead } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export async function fetchLeads(): Promise<Lead[]> {
  const res = await fetch(`${API_URL}/leads`);
  return res.json();
}

export async function intake(formData: FormData) {
  const res = await fetch(`${API_URL}/intake`, { method: 'POST', body: formData });
  return res.json();
}

export async function importRows(payload: { rows: unknown[] }) {
  const res = await fetch(`${API_URL}/imports/commit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function updateLead(id: string, payload: Partial<Lead>) {
  const res = await fetch(`${API_URL}/leads/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function deleteLead(id: string) {
  const res = await fetch(`${API_URL}/leads/${id}`, { method: 'DELETE' });
  return res.json();
}

export async function generateProposal(id: string, payload: Record<string, unknown>) {
  const res = await fetch(`${API_URL}/leads/${id}/proposal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function fetchAnalytics(): Promise<Analytics> {
  const res = await fetch(`${API_URL}/analytics`);
  return res.json();
}
