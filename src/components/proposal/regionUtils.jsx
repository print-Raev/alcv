// Detect state from address string
export function detectState(address) {
  if (!address) return null;
  const addr = address.toUpperCase();
  if (/\b(CA|CALIFORNIA)\b/.test(addr)) return "CA";
  if (/\b(TX|TEXAS)\b/.test(addr)) return "TX";
  if (/\b(NV|NEVADA|LAS VEGAS|HENDERSON|NORTH LAS VEGAS)\b/.test(addr)) return "NV";
  if (/\b(AZ|ARIZONA|CHANDLER|SCOTTSDALE|TEMPE|MESA|PHOENIX|TUCSON|GILBERT)\b/.test(addr)) return "AZ";
  return null;
}

// Regional surcharge based on state (replaces flat $250 local fee)
export function getRegionalSurcharge(address, distanceMiles) {
  const state = detectState(address);
  if (!state || state === "AZ") return 0;
  const dist = distanceMiles || 0;
  if (state === "CA") {
    if (dist > 600) return 1500;
    if (dist > 400) return 1000;
    return 500;
  }
  if (state === "TX") {
    if (dist > 800) return 1500;
    if (dist > 500) return 1000;
    return 750;
  }
  if (state === "NV") {
    if (dist > 300) return 1000;
    if (dist > 200) return 750;
    return 500;
  }
  return 0;
}

// State flag emoji
export const STATE_FLAGS = {
  AZ: "🌵",
  CA: "🌴",
  TX: "⭐",
  NV: "🎰",
};

// High-growth hub cities that get +2 heat score bonus
export function getRegionalHeatBonus(address) {
  if (!address) return 0;
  const addr = address.toUpperCase();
  if (/\bAUSTIN\b/.test(addr)) return 2;
  if (/\bLAS VEGAS\b/.test(addr)) return 2;
  return 0;
}