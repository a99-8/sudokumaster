"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { accents, accentPalettes, basePalettes, themes } from "../palette";
import { useTheme } from "../theme";

export default function Settings() {
  const { theme, accent, setTheme, setAccent, storageAvailable } = useTheme();
  return <div className="app-shell">
    <header className="site-header"><div className="header-inner"><Link className="brand" href="/" aria-label="سودوكو الرئيسية"><span className="brand-mark">9</span><span>سودوكو<span className="brand-accent">ماستر</span><small>SUDOKU MASTER</small></span></Link><nav aria-label="التنقل الرئيسي"><Link className="nav-item" href="/">العودة إلى اللعبة</Link><Link className="nav-item active" href="/settings" aria-current="page">الإعدادات</Link></nav></div></header>
    <main className="main-wrap settings-page">
      <section className="page-heading"><div><div className="eyebrow"><span/>مساحتك، على ذوقك</div><h1>اختر مظهرك. <span>واستمتع بالتركيز.</span></h1><p>ثمانية ألوان أساسية وثمانية ألوان ثانوية. نسّق الخلفية مع لون أدواتك دون فقدان لعبتك.</p></div></section>
      <section className="settings-card" aria-labelledby="theme-title"><div className="settings-section-heading"><div><h2 id="theme-title">اللون الأساسي</h2><p>لون الخلفيات والبطاقات واللوحة. الأنماط الداكنة تستخدم درجات أوضح للأرقام والمسودات والحدود.</p></div><span className="badge">8 أنماط</span></div>
        <div className="theme-options" role="group" aria-label="لون النمط الأساسي">{themes.map(value => {
          const base = basePalettes[value];
          const color = accentPalettes[accent][base.dark ? "dark" : "light"];
          const preview = { "--preview-bg": base.bg, "--preview-ink": base.ink, "--preview-border": base.border, "--preview-paper": base.paper, "--preview-accent": color } as CSSProperties;
          return <button key={value} className={`theme-option ${theme === value ? "chosen" : ""}`} aria-label={`اللون الأساسي: ${base.title}`} aria-pressed={theme === value} onClick={() => setTheme(value)}>
            <span className="theme-preview" style={preview} aria-hidden="true"><span className="preview-top"/><span className="preview-content"><span className="preview-board">{[1,2,3,4,5,6,7,8,9].map(n => <span key={n}>{n}</span>)}</span><span className="preview-tools"><i/><i/><i/></span></span></span>
            <span className="theme-option-title">{base.title}<span className="theme-radio" aria-hidden="true">{theme === value ? "✓" : ""}</span></span><span className="theme-description">{base.description}</span>
          </button>;
        })}</div>
      </section>
      <section className="settings-card" aria-labelledby="accent-title"><div className="settings-section-heading"><div><h2 id="accent-title">اللون الثانوي</h2><p>يُطبّق على الأزرار والأرقام المدخلة والتحديد والمسودات المميّزة. يبقى لون الأخطاء منفصلًا وواضحًا.</p></div><span className="badge">8 ألوان</span></div>
        <div className="accent-options" role="group" aria-label="اللون الثانوي">{accents.map(value => <button className={`accent-option ${accent === value ? "chosen" : ""}`} aria-label={`اللون الثانوي: ${accentPalettes[value].title}`} aria-pressed={accent === value} key={value} onClick={() => setAccent(value)}>
          <span className="accent-swatch" style={{ background: accentPalettes[value][basePalettes[theme].dark ? "dark" : "light"] }} aria-hidden="true"/><span>{accentPalettes[value].title}</span><span className="theme-radio" aria-hidden="true">{accent === value ? "✓" : ""}</span>
        </button>)}</div>
        <p className="settings-status" role="status">{storageAvailable ? `اختيارك: ${basePalettes[theme].title} مع ${accentPalettes[accent].title}. يُحفظ اللونان تلقائيًا على هذا الجهاز.` : "تُطبّق الألوان خلال الجلسة، لكن التخزين المحلي غير متاح لحفظ الاختيار."}</p>
      </section>
      <section className="settings-card settings-help"><h2>لوحة أوضح وشرح أسهل</h2><p>الأعمدة مرقمة من 1 إلى 9، والصفوف بالحروف الإنجليزية A إلى I. مثلًا A1 تعني الصف A والعمود 1. تُستخدم الإحداثيات نفسها في التلميحات وخطوات التدريب.</p><p>عند رفض مسودة متعارضة، تظهر علامة على الأرقام التي تمنعها في الصف أو العمود أو المربع، مع ذكر إحداثياتها. اختيار رقم ثابت يميّز الرقم نفسه في المسودات.</p><p>القلم السريع يملأ المرشحات، و«مسح المسودات» يزيلها جميعًا. يمكن إدخال أي رقم في خلية غير ثابتة، لكن المخالف للحل يظهر بالأحمر ويزيد عدّاد الأخطاء التراكمي.</p><Link className="primary" href="/">العودة للّعب</Link></section>
    </main>
  </div>;
}
