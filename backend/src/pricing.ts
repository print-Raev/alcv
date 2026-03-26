export function buildPricing(params: {
  squareFootage?: number | null;
  mode?: 'rough' | 'final' | 'touchup';
  debrisLevel?: number;
  glassDetail?: number;
  urgency?: number;
  floors?: number;
  accessDifficulty?: number;
}) {
  const sqft = params.squareFootage || 0;
  const mode = params.mode || 'final';
  const baseRate = mode === 'rough' ? 0.22 : mode === 'touchup' ? 0.15 : 0.45;
  const modifier =
    1 +
    (params.debrisLevel || 0) * 0.06 +
    (params.glassDetail || 0) * 0.04 +
    (params.urgency || 0) * 0.08 +
    Math.max(0, (params.floors || 1) - 1) * 0.03 +
    (params.accessDifficulty || 0) * 0.05;

  const standardRate = Math.min(0.8, Math.max(0.1, baseRate * modifier));
  const competitiveRate = Math.max(0.1, standardRate * 0.9);
  const premiumRate = Math.min(0.8, standardRate * 1.18);

  return {
    competitivePrice: Math.round(competitiveRate * sqft),
    standardPrice: Math.round(standardRate * sqft),
    premiumPrice: Math.round(premiumRate * sqft)
  };
}
