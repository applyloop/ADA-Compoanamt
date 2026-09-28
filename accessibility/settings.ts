export type Settings = {
  motion: boolean; contrast: boolean; theme: string; saturation: string;
  scale: number; fontSize: number; lineHeight: number; spacing: number;
  readable: boolean; titles: boolean; links: boolean; magnifier: boolean;
  align: string; textColor: string; titleColor: string; background: string;
  mute: boolean; images: boolean; read: boolean; guide: boolean; mask: boolean;
  hover: boolean; focus: boolean; cursor: string;
};
export const defaults: Settings = {
  motion: false, contrast: false, theme: "", saturation: "", scale: 100,
  fontSize: 100, lineHeight: 0, spacing: 0, readable: false, titles: false,
  links: false, magnifier: false, align: "", textColor: "", titleColor: "",
  background: "", mute: false, images: false, read: false, guide: false,
  mask: false, hover: false, focus: false, cursor: "",
};
export const profiles: { name: string; description: string; values: Partial<Settings> }[] = [
  { name: "Seizure Safety", description: "Stop animations, mute media and reduce saturation. This cannot guarantee seizure prevention.", values: { motion: true, saturation: "low", mute: true } },
  { name: "Low Vision Support", description: "Larger text, high contrast and emphasized links.", values: { fontSize: 125, contrast: true, theme: "high", links: true } },
  { name: "ADHD Friendly", description: "Reduce motion and distractions with a reading mask.", values: { motion: true, mask: true, mute: true } },
  { name: "Reading & Cognitive Support", description: "Readable font, generous spacing and a reading guide.", values: { readable: true, lineHeight: 1.8, spacing: 0.04, guide: true } },
  { name: "Keyboard Navigation", description: "Emphasize focus and links. Keyboard access is always available.", values: { focus: true, links: true } },
  { name: "Screen Reader Compatibility", description: "Reduce motion and mute competing audio. Screen-reader support is always available.", values: { motion: true, mute: true } },
  { name: "Older Adults", description: "Larger, readable text with clear links and stronger focus.", values: { fontSize: 125, readable: true, links: true, focus: true } },
];
export function parseSettings(raw: string): Settings {
  let value: Record<string, unknown> = {};
  try { const parsed = JSON.parse(raw); if (parsed && typeof parsed === "object") value = parsed; } catch { /* Use defaults. */ }
  const result = { ...defaults };
  for (const key of Object.keys(defaults) as (keyof Settings)[]) {
    if (typeof defaults[key] === "boolean" && typeof value[key] === "boolean") Object.assign(result, { [key]: value[key] });
  }
  for (const [key, allowed] of Object.entries({ theme: ["", "dark", "light", "high"], saturation: ["", "high", "low", "mono"], align: ["", "left", "center", "right"], cursor: ["", "black", "white"] })) {
    if (allowed.includes(String(value[key]))) Object.assign(result, { [key]: value[key] });
  }
  for (const key of ["textColor", "titleColor", "background"] as const) {
    if (typeof value[key] === "string" && /^#[0-9a-f]{6}$/i.test(value[key])) result[key] = value[key];
  }
  for (const [key, allowed] of Object.entries({ scale: [100, 110, 125, 150], fontSize: [100, 110, 125, 150], lineHeight: [0, 1.5, 1.8, 2], spacing: [0, 0.02, 0.04, 0.08] })) {
    if (allowed.includes(Number(value[key]))) Object.assign(result, { [key]: Number(value[key]) });
  }
  if (result.contrast && !result.theme) result.theme = "high";
  return result;
}
