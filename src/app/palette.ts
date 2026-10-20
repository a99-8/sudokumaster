export const themes = ["white", "black", "gray", "navy", "charcoal", "cream", "lavender", "forest"] as const;
export const accents = ["green", "blue", "purple", "teal", "amber", "rose", "orange", "indigo"] as const;
export type Theme = typeof themes[number];
export type Accent = typeof accents[number];
type BasePalette = { title: string; description: string; dark: boolean; bg: string; paper: string; surface: string; ink: string; muted: string; border: string; line: string; box: string };
export const basePalettes: Record<Theme, BasePalette> = {
  white: { title: "أبيض", description: "سطح مضيء وواضح بألوان محايدة.", dark: false, bg: "#f7f9fb", paper: "#ffffff", surface: "#edf1f5", ink: "#243442", muted: "#566575", border: "#ced7e0", line: "#d5dee6", box: "#8292a4" },
  black: { title: "أسود", description: "أسود محايد مع أرقام وحدود أوضح.", dark: true, bg: "#101215", paper: "#1b2027", surface: "#272f39", ink: "#edf3fa", muted: "#b5c2d1", border: "#475566", line: "#3e4d5e", box: "#8ea3bc" },
  gray: { title: "رمادي", description: "درجات متوازنة وإضاءة أقل.", dark: false, bg: "#cdd1d5", paper: "#e6e9ed", surface: "#d6dce3", ink: "#263340", muted: "#455363", border: "#a1adbb", line: "#b0bcc9", box: "#64788f" },
  navy: { title: "كحلي", description: "درجات ليلية زرقاء عميقة.", dark: true, bg: "#0e1628", paper: "#19253b", surface: "#24344d", ink: "#edf3ff", muted: "#b4c4df", border: "#465d7d", line: "#3a5070", box: "#8faace" },
  charcoal: { title: "فحمي", description: "رمادي داكن محايد ومريح.", dark: true, bg: "#222429", paper: "#2d3037", surface: "#3a3e47", ink: "#f0f2f7", muted: "#c1c7d3", border: "#5b626f", line: "#505866", box: "#a1acbd" },
  cream: { title: "كريمي", description: "إضاءة دافئة مستوحاة من الورق.", dark: false, bg: "#f5efdf", paper: "#fffaf0", surface: "#ede5d4", ink: "#3f372b", muted: "#6e614f", border: "#cfc0a5", line: "#dbceb8", box: "#968365" },
  lavender: { title: "لافندر", description: "خلفية بنفسجية فاتحة وهادئة.", dark: false, bg: "#efecf8", paper: "#faf8ff", surface: "#e6e0f2", ink: "#373047", muted: "#655b77", border: "#c9bddc", line: "#d5cbe6", box: "#9180ab" },
  forest: { title: "غابي", description: "خضرة داكنة مستوحاة من الطبيعة.", dark: true, bg: "#101d19", paper: "#1c2d27", surface: "#2b3e35", ink: "#edf8f0", muted: "#b4cfbe", border: "#496658", line: "#3d5b4c", box: "#91b69f" },
};
export const accentPalettes: Record<Accent, { title: string; light: string; dark: string }> = {
  green: { title: "أخضر", light: "#20734f", dark: "#75d4a6" },
  blue: { title: "أزرق", light: "#225fc5", dark: "#8ab9ff" },
  purple: { title: "بنفسجي", light: "#7443bc", dark: "#c6a0ff" },
  teal: { title: "فيروزي", light: "#08766f", dark: "#70d4cb" },
  amber: { title: "ذهبي", light: "#8a5d12", dark: "#efd08a" },
  rose: { title: "وردي", light: "#ac3567", dark: "#f2a4c3" },
  orange: { title: "برتقالي", light: "#9c4a13", dark: "#ffb782" },
  indigo: { title: "نيلي", light: "#4c50bd", dark: "#aeb2ff" },
};
function mixHex(a: string, weight: number, b: string): string {
  const pa = a.slice(1).match(/../g)!.map(v => parseInt(v,16));
  const pb = b.slice(1).match(/../g)!.map(v => parseInt(v,16));
  return "#" + pa.map((v,i) => Math.round(v*weight + pb[i]*(1-weight)).toString(16).padStart(2,"0")).join("");
}
export function themeVariables(theme: Theme, accent: Accent): Record<string, string> {
  const base = basePalettes[theme], color = accentPalettes[accent];
  const green = base.dark ? color.dark : color.light;
  const mix = (amount: number) => mixHex(green, amount/100, base.paper);
  return {
    "--bg": base.bg, "--paper": base.paper, "--surface": base.surface, "--ink": base.ink, "--muted": base.muted,
    "--border": base.border, "--line": base.line, "--box-line": base.box, "--board-line": base.box,
    "--green": green, "--green-dark": green,
    "--on-accent": base.dark ? "#101820" : "#ffffff", "--cell-ink": base.ink,
    "--light": mix(base.dark ? 14 : 9), "--related": mix(base.dark ? 7 : 4), "--same": mix(base.dark ? 20 : 12),
    "--selected": mix(base.dark ? 29 : 19), "--selected-border": "var(--green)",
    "--note-ink": base.ink, "--note-bg": mix(base.dark ? 30 : 18),
    "--error": base.dark ? "#ffa5ac" : "#ad293c", "--error-bg": base.dark ? "#492b36" : "#fce9ed",
    "--warm": base.dark ? "#3b3424" : "#faf0dc", "--warm-ink": base.dark ? "#f5d89a" : "#775419",
    "--tip-bg": mix(base.dark ? 10 : 6), "--tip-ink": base.ink,
    "--focus-bg": mix(base.dark ? 17 : 12), "--target-bg": base.dark ? "#433923" : "#fff0c9",
    "--scope-a": base.bg, "--scope-b": base.surface,
  };
}
