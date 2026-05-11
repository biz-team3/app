const UNITS = {
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
  w: 7 * 24 * 60 * 60 * 1000,
};

export function relativeCreatedAt(value = "now") {
  if (value === "now") return new Date().toISOString();

  const match = String(value).match(/^(\d+)([mhdw])$/);
  if (!match) return new Date().toISOString();

  const amount = Number(match[1]);
  const unit = UNITS[match[2]];
  return new Date(Date.now() - amount * unit).toISOString();
}
