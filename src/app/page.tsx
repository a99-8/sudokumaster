"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import techniques from "../../Technologies/Technologies.json";
import { cellReference, digits, exercise, findHint, gameMove, initialBoard, newPuzzle, noteBlockers, peers, place, rowLetters, solve, toggleQuickNotes, type Difficulty, type Snapshot } from "./sudoku";
import { usePrefs } from "./prefs";

type IconName = "grid" | "book" | "target" | "arrow" | "pencil" | "spark" | "undo" | "erase" | "bulb" | "clock" | "pause" | "play" | "check" | "close" | "chevron" | "sun" | "expand" | "shrink";
function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    grid: <><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></>,
    book: <><path d="M12 5C8 2 4 3 3 4v15c4-2 7-1 9 1 2-2 5-3 9-1V4c-4-2-7-1-9 1Zm0 0v15"/></>,
    target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></>,
    arrow: <path d="M19 12H5m6-6-6 6 6 6"/>,
    pencil: <><path d="m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14Z"/></>,
    spark: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/><path d="m20 2 1 3 2 1"/></>,
    undo: <><path d="M8 4 3 9l5 5M3 9h11a6 6 0 0 1 0 12"/></>,
    erase: <><path d="m4 14 9-10a2 2 0 0 1 3 0l5 5a2 2 0 0 1 0 3l-8 9H9l-5-5a2 2 0 0 1 0-2ZM9 9l9 9M12 21h9"/></>,
    bulb: <><path d="M9 18h6m-5 3h4M8 14a7 7 0 1 1 8 0c-1 1-1 2-1 2H9s0-1-1-2Z"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    pause: <><path d="M9 5v14M15 5v14"/></>,
    play: <path d="m8 4 12 8-12 8Z"/>,
    check: <path d="m5 12 4 4L19 6"/>,
    close: <path d="m6 6 12 12M6 18 18 6"/>,
    chevron: <path d="m14 6-6 6 6 6"/>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/></>,
    expand: <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>,
    shrink: <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
function CoordinateBoard({ children, selected }: { children: ReactNode; selected?: number }) {
  return <div className="coordinate-board" dir="ltr">
    <span className="coordinate-corner" aria-hidden="true">{selected === undefined ? "" : cellReference(selected)}</span>
    <div className="column-labels" aria-hidden="true">{digits.map((n,i) => <span className={selected !== undefined && selected%9 === i ? "axis-active" : ""} key={n}>{n}</span>)}</div>
    <div className="row-labels" aria-hidden="true">{rowLetters.map((letter,i) => <span className={selected !== undefined && Math.floor(selected/9) === i ? "axis-active" : ""} key={letter}>{letter}</span>)}</div>
    <div className="coordinate-content">{children}</div>
  </div>;
}
function ExampleDiagram({ technique, wrong }: { technique: number; wrong?: boolean }) {
  const ex = exercise(technique, 0);
  return <div className="mini-board" dir="ltr" role="img" aria-label={wrong ? "لوحة توضح تطبيقًا غير صحيح" : "لوحة توضح تطبيقًا صحيحًا"}>{ex.values.map((v,i) => {
    const target = i === ex.target;
    return <span key={i} className={["mini-cell", ex.focus.includes(i) ? "training-focus" : "", target ? (wrong ? "mini-wrong" : "training-target") : "", i%9===2 || i%9===5 ? "box-right" : "", Math.floor(i/9)===2 || Math.floor(i/9)===5 ? "box-bottom" : ""].join(" ")}>{v || (wrong && target ? <b aria-hidden="true">✕</b> : <span className="mini-notes">{digits.map(d => <span key={d} className={target && !wrong && d === ex.digit ? "mini-highlight" : ""}>{ex.notes[i].includes(d) ? d : ""}</span>)}</span>)}</span>;
  })}</div>;
}
const emptyNotes = () => Array.from({ length: 81 }, () => [] as number[]);
const timeLabel = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
const levels: Difficulty[] = ["سهل", "متوسط", "صعب"];
type Saved = { state: Snapshot; given: number[]; difficulty: Difficulty; seconds: number; mistakes?: number; history?: Snapshot[] };
function validSave(data: Saved) {
  const boardOK = (v: number[]) => Array.isArray(v) && v.length === 81 && v.every(n => Number.isInteger(n) && n >= 0 && n <= 9);
  return data && boardOK(data.given) && boardOK(data.state?.board) && Array.isArray(data.state.notes) && data.state.notes.length === 81 && data.state.notes.every(a => Array.isArray(a) && a.every(n => digits.includes(n))) && levels.includes(data.difficulty) && Number.isFinite(data.seconds) && data.seconds >= 0;
}

export default function Home() {
  const [view, setView] = useState<"game" | "learn" | "training">("game");
  const [state, setState] = useState<Snapshot>({ board: initialBoard, notes: emptyNotes() });
  const [given, setGiven] = useState(initialBoard);
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>("سهل");
  const [selected, setSelected] = useState(2);
  const [pencil, setPencil] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const solution = useMemo(() => solve(given)[0] || [], [given]);
  const hasNotes = state.notes.some(list => list.length > 0);
  const [paused, setPaused] = useState(false);
  const [notice, setNotice] = useState("");
  const [conflict, setConflict] = useState<{ target: number; digit: number; blockers: number[] } | null>(null);
  const [dialog, setDialog] = useState(false);
  const [nextLevel, setNextLevel] = useState<Difficulty>("سهل");
  const [detail, setDetail] = useState<number | null>(null);
  const [filter, setFilter] = useState("الكل");
  const [search, setSearch] = useState("");
  const [training, setTraining] = useState<number | null>(null);
  const [stage, setStage] = useState(0);
  const [trainSelected, setTrainSelected] = useState<number | null>(null);
  const [step, setStep] = useState(0);
  const [solvedStage, setSolvedStage] = useState(false);
  const [progress, setProgress] = useState<Record<string, number[]>>({});
  const [ready, setReady] = useState(false);
  const { prefs } = usePrefs();
  const [focusMode, setFocusMode] = useState(false);
  const [endClosed, setEndClosed] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const complete = solution.length === 81 && state.board.every((n,i) => n === solution[i]);
  const filled = state.board.filter(Boolean).length;
  const currentExercise = training === null ? null : exercise(training, stage);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw = localStorage.getItem("sudoku-game-v1");
        if (raw) {
          const saved: Saved = JSON.parse(raw);
          if (validSave(saved)) {
            setState(saved.state); setGiven(saved.given); setDifficulty(saved.difficulty); setSeconds(saved.seconds);
            setMistakes(typeof saved.mistakes === "number" && Number.isSafeInteger(saved.mistakes) && saved.mistakes >= 0 ? saved.mistakes : 0);
            if (Array.isArray(saved.history)) setHistory(saved.history.filter(entry => validSave({ ...saved, state: entry })).slice(-200));
          }
        }
        const stored = JSON.parse(localStorage.getItem("sudoku-progress-v1") || "{}");
        if (stored && typeof stored === "object" && !Array.isArray(stored)) {
          const cleaned: Record<string, number[]> = {};
          for (const [key, value] of Object.entries(stored)) if (Array.isArray(value)) cleaned[key] = [...new Set(value.filter(n => Number.isInteger(n) && n >= 0 && n < 10))];
          setProgress(cleaned);
        }
      } catch { setNotice("تعذّر استعادة الحفظ السابق. يمكنك بدء لعبة جديدة."); }
      setReady(true);
    });
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem("sudoku-game-v1", JSON.stringify({ state, given, difficulty, seconds, mistakes, history })); localStorage.setItem("sudoku-progress-v1", JSON.stringify(progress)); }
    catch { queueMicrotask(() => setNotice("التخزين المحلي غير متاح؛ سيُحفظ التقدم خلال هذه الجلسة فقط.")); }
  }, [state, given, difficulty, seconds, mistakes, history, progress, ready]);
  useEffect(() => {
    if (paused || complete || view !== "game" || !ready) return;
    const timer = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, [paused, complete, view, ready]);

  useEffect(() => {
    if (!dialog && detail === null) return;
    const previous = document.activeElement as HTMLElement | null;
    const modal = document.querySelector<HTMLElement>('[role="dialog"]');
    const controls = () => Array.from(modal?.querySelectorAll<HTMLElement>('button:not(:disabled), input, [tabindex="0"]') || []);
    controls()[0]?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setDialog(false); setDetail(null); }
      if (event.key !== "Tab") return;
      const items = controls();
      const first = items[0], last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", handleKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handleKey); document.body.style.overflow = overflow; previous?.focus(); };
  }, [dialog, detail]);

  useEffect(() => {
    const sync = () => { if (!document.fullscreenElement) setFocusMode(false); };
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  async function toggleFocus() {
    if (focusMode) {
      try { if (document.fullscreenElement) await document.exitFullscreen(); } catch { /* fullscreen unsupported */ }
      setFocusMode(false);
    } else {
      try { await document.documentElement.requestFullscreen(); } catch { /* fullscreen unsupported */ }
      setFocusMode(true);
      setView("game");
    }
  }

  function commit(next: Snapshot) {
    setHistory(h => [...h, state].slice(-200));
    let finished = false;
    if (prefs.autoFinish && solution.length) {
      const remaining = next.board.reduce((count, n, i) => count + (n !== solution[i] ? 1 : 0), 0);
      if (remaining > 0 && remaining <= 10) { next = { board: [...solution], notes: emptyNotes() }; finished = true; }
    }
    setState(next); setConflict(null);
    setNotice(finished ? "الإكمال التلقائي: بقي 10 مواضع أو أقل، فوُضعت الأرقام الصحيحة في أماكنها." : "");
  }
  function input(n: number) {
    if (paused || complete) return;
    setConflict(null);
    if (given[selected]) { setNotice("هذا رقم ثابت من اللغز، اختر خلية فارغة."); return; }
    const next = gameMove(state, given, solution, selected, n, pencil && n !== 0);
    if (next) {
      if (next.mistake && prefs.hardMode && mistakes + 1 >= 3) {
        setState({ board: [...given], notes: emptyNotes() }); setHistory([]); setMistakes(0); setSeconds(0); setConflict(null); setPaused(false);
        setSelected(given.findIndex(v => !v));
        setNotice("النمط الصعب: ثلاثة أخطاء تعيد المرحلة من البداية. حاول مجددًا بتركيز أعمق.");
        return;
      }
      commit(next.state);
      if (next.mistake) { setMistakes(count => count + 1); setNotice("الرقم لا يطابق الحل النهائي. يمكنك مسحه أو استبداله أو التراجع عنه. عدّاد الأخطاء تراكمي ولا ينقص بالتراجع."); }
    } else if (pencil && n !== 0) {
      const blockers = noteBlockers(state.board,selected,n);
      if (blockers.length && !state.board[selected]) {
        setConflict({ target: selected, digit: n, blockers });
        const locations = blockers.map(i => `${cellReference(i)} (${given[i] ? "ثابت" : state.board[i] === solution[i] ? "إدخال صحيح" : "إدخال خاطئ"})`).join("، ");
        setNotice(`لا يمكن إضافة المسودة ${n} إلى ${cellReference(selected)}. الرقم موجود في خلايا مشتركة بالصف أو العمود أو المربع: ${locations}. وُضعت علامات على الخلايا المانعة.`);
      } else setNotice("الخلية ممتلئة؛ امسح الرقم أولًا لإضافة مسودة.");
    }
  }
  function quickPencil() {
    if (paused || complete) return;
    commit(toggleQuickNotes(state));
    setNotice(hasNotes ? "مُسحت جميع المسودات دون تغيير الأرقام. يمكنك استعادتها بالتراجع." : "أُضيفت جميع المرشحات القانونية. عدّلها بقلم الرصاص، أو اضغط مسح المسودات لإزالتها جميعًا.");
  }
  function hint() {
    if (paused || complete || !solution.length) return;
    const info = findHint(state.board, solution, given[selected] ? -1 : selected);
    if (!info) return;
    const next = place(state, info.index, info.digit, false);
    if (next) { commit(next); setSelected(info.index); setNotice(`${cellReference(info.index)} ← الرقم ${info.digit}. التقنية المستخدمة: «${info.technique}». ${info.detail}`); }
  }
  function startGame(level: Difficulty = nextLevel) {
    const board = newPuzzle(level);
    setState({ board, notes: emptyNotes() }); setGiven(board); setHistory([]); setDifficulty(level); setSeconds(0); setMistakes(0); setSelected(board.findIndex(n => !n)); setPaused(false); setPencil(false); setDialog(false); setNotice(""); setConflict(null); setEndClosed(false);
  }
  function openTraining(i: number, s = 0) { setTraining(i); setStage(s); setStep(0); setSolvedStage(false); setTrainSelected(null); setAttempts(0); setNotice(""); setView("training"); }
  function answer(n: number) {
    if (!currentExercise || solvedStage || training === null) return;
    if (trainSelected !== currentExercise.target || n !== currentExercise.digit) {
      const next = attempts + 1;
      if (prefs.hardMode && next >= 3) { openTraining(training, stage); setNotice("النمط الصعب: ثلاث محاولات خاطئة — أُعيدت المرحلة من البداية."); return; }
      setAttempts(next);
      setNotice(prefs.hardMode ? `ليست هذه الخطوة المطلوبة. محاولات خاطئة: ${next}/3 — عند الثالثة تُعاد المرحلة.` : "ليست هذه الخطوة المطلوبة. راجع الخلايا الملوّنة وشروط التقنية، أو اطلب خطوة توضيحية.");
      return;
    }
    setSolvedStage(true); setNotice("أحسنت! طبّقت التقنية في الموضع الصحيح.");
    setProgress(p => ({ ...p, [training]: [...new Set([...(p[training] || []), stage])] }));
  }
  const listed = techniques.map((t,i) => ({ ...t, i })).filter(t => (filter === "الكل" || t.difficulty === filter) && `${t.name} ${t.title}`.toLowerCase().includes(search.toLowerCase()));
  const totalProgress = Object.values(progress).reduce((sum, a) => sum + a.length, 0);

  return (
    <div className={focusMode ? "app-shell focus-mode" : "app-shell"}>
      <header className="site-header">
        <div className="header-inner">
          <button className="brand" onClick={() => setView("game")} aria-label="سودوكو الرئيسية"><span className="brand-mark"><Image src="/icon.svg" alt="" width={46} height={46} priority/></span><span>سودوكو<span className="brand-accent">ماستر</span><small>SUDOKU MASTER</small></span></button>
          <nav aria-label="التنقل الرئيسي">
            <button className={view === "game" ? "nav-item active" : "nav-item"} onClick={() => { setView("game"); setNotice(""); }}><Icon name="grid" size={19}/>العب الآن</button>
            <button className={view === "learn" ? "nav-item active" : "nav-item"} onClick={() => { setView("learn"); setNotice(""); }}><Icon name="book" size={19}/>دليل التقنيات</button>
            <button className={view === "training" ? "nav-item active" : "nav-item"} onClick={() => { setView("training"); setNotice(""); }}><Icon name="target" size={19}/>ساحة التدريب</button>
            <Link className="nav-item settings-link" href="/settings"><Icon name="sun" size={19}/>الإعدادات</Link>
          </nav>
          <span className="header-note"><span className="online-dot"/>مساحة صغيرة لتفكير أعمق</span>
        </div>
      </header>

      <main className="main-wrap">
        <section className="page-heading">
          <div><div className="eyebrow"><span/> {view === "game" ? "تحدٍ جديد، وعقل أكثر صفاءً" : view === "learn" ? "افهم المنطق وراء كل خطوة" : "من المعرفة إلى المهارة"}</div><h1>{view === "game" ? <>خذ نفسًا. <span>وفكّر بالرقم التالي.</span></> : view === "learn" ? <>كل لغز له مفتاح. <span>تعلّم تقنياته.</span></> : <>تمرّن بذكاء. <span>خطوة بعد خطوة.</span></>}</h1><p>{view === "game" ? "قليل من التركيز، وكثير من المتعة. اختر مستواك وابدأ رحلتك مع سودوكو." : view === "learn" ? "14 تقنية، من أول خلية إلى أصعب الأنماط. تعلّم، شاهد المثال، ثم جرّب بنفسك." : "تمارين مرشحات تفاعلية مصممة لكل تقنية. عشر مراحل لكل مهارة، بلا استعجال."}</p></div>
          <div className="heading-decoration" aria-hidden="true"><span>1</span><span>9</span><span>4</span><span>6</span><span className="decor-special">?</span><span>2</span><span>8</span><span>3</span><span>7</span></div>
        </section>

        {view === "game" && <div className="game-layout">
          <section className="game-panel">
            <div className="game-topline"><div className="level-switch" aria-label="مستوى الصعوبة">{levels.map(l => <button key={l} className={difficulty === l ? "selected" : ""} onClick={() => { if (l !== difficulty) { setNextLevel(l); setDialog(true); } }}>{l}</button>)}</div><div className="game-counters"><span className="mistake-counter" aria-live="polite" title={prefs.hardMode ? "النمط الصعب: عند ثلاثة أخطاء تُعاد المرحلة" : "إجمالي الإدخالات الخاطئة؛ لا ينقص بالتراجع"}>الأخطاء <strong>{prefs.hardMode ? `${mistakes}/3` : mistakes}</strong></span><div className="timer"><Icon name="clock" size={17}/><span dir="ltr">{timeLabel(seconds)}</span><button className="icon-button" aria-label={paused ? "متابعة اللعبة" : "إيقاف مؤقت"} onClick={() => setPaused(v => !v)}><Icon name={paused ? "play" : "pause"} size={16}/></button></div><button className="icon-button focus-toggle" aria-label={focusMode ? "الخروج من وضع التركيز" : "وضع التركيز: تكبير لوحة اللعب"} aria-pressed={focusMode} title={focusMode ? "الخروج من وضع التركيز" : "وضع التركيز"} onClick={toggleFocus}><Icon name={focusMode ? "shrink" : "expand"} size={17}/></button></div></div>
            <CoordinateBoard selected={selected}><div className="board-container">
              <div className="sudoku-board" dir="ltr" role="group" aria-label="لوحة سودوكو" onKeyDown={e => {
                if (/^[1-9]$/.test(e.key)) { e.preventDefault(); input(Number(e.key)); }
                if (["Backspace", "Delete"].includes(e.key)) { e.preventDefault(); input(0); }
                const shifts: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowUp: -9, ArrowDown: 9 };
                if (e.key in shifts) { e.preventDefault(); setSelected(s => Math.max(0, Math.min(80, s + shifts[e.key]))); setConflict(null); if (conflict) setNotice(""); }
              }}>
                {state.board.map((n,i) => <button key={i} title={conflict?.target === selected && conflict.blockers.includes(i) ? `${cellReference(i)}: الرقم ${conflict.digit} يمنع هذه المسودة` : cellReference(i)} tabIndex={selected === i ? 0 : -1} aria-label={`صف ${rowLetters[Math.floor(i/9)]} عمود ${i%9+1} (${cellReference(i)})${n ? `، الرقم ${n}${!given[i] && n !== solution[i] ? "، إدخال خاطئ" : ""}` : `، فارغ، مرشحات ${state.notes[i].join("،")}`}`} aria-pressed={selected === i} onClick={() => { if (!paused) { setSelected(i); setConflict(null); if (conflict) setNotice(""); } }} className={["cell", given[i] ? "given" : "entered", n && !given[i] && n !== solution[i] ? "cell-error" : "", selected === i ? "cell-selected" : "", peers(selected,i) ? "related" : "", n && n === state.board[selected] ? "same-number" : "", !paused && conflict?.target === selected && conflict.blockers.includes(i) ? "note-blocker" : "", !paused && conflict?.target === i ? "note-rejected" : "", i%9 === 2 || i%9 === 5 ? "box-right" : "", Math.floor(i/9) === 2 || Math.floor(i/9) === 5 ? "box-bottom" : ""].join(" ")}>{!paused && (n || <span className="notes-grid">{digits.map(d => <span key={d} className={state.board[selected] === d && state.notes[i].includes(d) ? "note-highlight" : ""}>{state.notes[i].includes(d) ? d : ""}</span>)}</span>)}</button>)}
              </div>
              {paused && <div className="pause-overlay"><span className="round-icon"><Icon name="pause" size={30}/></span><h3>لحظة من الهدوء</h3><p>لوحتك بانتظارك عندما تكون مستعدًا.</p><button className="primary" onClick={() => setPaused(false)}>متابعة اللعب <Icon name="play" size={17}/></button></div>}
            </div></CoordinateBoard>
            <div className="selected-reference">الخلية المحددة <bdi>{cellReference(selected)}</bdi><span>الصفوف A–I · الأعمدة 1–9</span></div>
            <div className="board-bottom"><span><span className="tiny-dot"/> {complete ? "اكتملت اللوحة، أحسنت!" : "كل رقم في مكانه، خطوة نحو الحل"}</span><span dir="ltr">{filled}<span className="muted"> / 81</span></span></div>
            <div className="progress-track"><span style={{ width: `${filled / 81 * 100}%` }}/></div>
          </section>

          <aside className="game-sidebar">
            <section className="control-card">
              <div className="card-title"><div><h2>مساحتك للتفكير</h2><p>اختر خلية، ثم أضف رقمك.</p></div><span className="small-grid"><Icon name="grid" size={20}/></span></div>
              <div className="number-pad" dir="ltr">{digits.map(n => {
                const remaining = 9 - state.board.filter(v => v === n).length;
                const exhausted = remaining <= 0 && !state.notes[selected]?.includes(n);
                return <button key={n} disabled={paused || complete || exhausted} title={exhausted ? "اكتمل استخدام هذا الرقم تسع مرات" : `الرقم ${n}`} aria-label={exhausted ? `الرقم ${n}، اكتمل` : `الرقم ${n}، ${remaining} متبقٍ`} onClick={() => input(n)}><strong>{n}</strong><small>{Math.max(0, remaining)} متبقٍ</small></button>;
              })}</div>
              <div className="tools-grid">
                <button disabled={!history.length || paused} onClick={() => { const prev = history.at(-1); if (prev) { setState(prev); setHistory(h => h.slice(0,-1)); setNotice(""); setConflict(null); } }}><Icon name="undo"/><span>تراجع</span></button>
                <button disabled={paused || complete} onClick={() => input(0)}><Icon name="erase"/><span>مسح</span></button>
                <button className={pencil ? "tool-active" : ""} disabled={paused || complete} aria-pressed={pencil} onClick={() => setPencil(v => !v)}><span className="tool-status">{pencil ? "ON" : "OFF"}</span><Icon name="pencil"/><span>قلم رصاص</span></button>
                <button className={hasNotes ? "tool-active" : ""} disabled={paused || complete} onClick={quickPencil} aria-label={hasNotes ? "مسح جميع المسودات" : "إضافة المسودات بالقلم السريع"}><Icon name={hasNotes ? "erase" : "spark"}/><span>{hasNotes ? "مسح المسودات" : "قلم سريع"}</span></button>
              </div>
              <button className="hint-button" disabled={paused || complete} onClick={hint}><span><Icon name="bulb" size={20}/>قليل من الإلهام؟</span><span>تلميح <Icon name="chevron" size={15}/></span></button>
              <button className="primary new-game" onClick={() => { setNextLevel(difficulty); setDialog(true); }}><Icon name="grid" size={19}/>لعبة جديدة<Icon name="arrow" size={18}/></button>
              <p className="save-note"><Icon name="check" size={13}/> يُحفظ تقدمك تلقائيًا على هذا الجهاز</p>
            </section>
            <section className="daily-tip"><div className="tip-label"><Icon name="bulb" size={18}/>فكرة تُضيء الطريق</div><h3>لا تخمّن. ابحث عن الاحتمال الوحيد.</h3><p>ابدأ بالصف أو العمود الأكثر امتلاءً. أحيانًا تكون الخطوة التالية أقرب مما تظن.</p><button onClick={() => { setView("learn"); setDetail(3); }}>اكتشف تقنية المرشح الوحيد <Icon name="arrow" size={17}/></button><span className="tip-art" aria-hidden="true"><Icon name="spark" size={110}/></span></section>
          </aside>
        </div>}

        {view === "learn" && <>
          <div className="library-toolbar"><div className="filter-tabs">{["الكل",...levels].map(l => <button key={l} className={filter === l ? "selected" : ""} onClick={() => setFilter(l)}>{l === "الكل" ? "جميع التقنيات" : l}</button>)}</div><input className="search" placeholder="ابحث عن تقنية…" aria-label="بحث التقنيات" value={search} onChange={e => setSearch(e.target.value)}/></div>
          <div className="technique-grid">{listed.map(t => <article className="technique-card" key={t.name}><div className="technique-top"><span className="technique-symbol">{String(t.i+1).padStart(2,"0")}</span><span className={`badge difficulty-${levels.indexOf(t.difficulty as Difficulty)}`}>{t.difficulty}</span></div><span className="english-name">{t.name}</span><h2>{t.title}</h2><p>{t.dis}</p><button onClick={() => setDetail(t.i)}>اكتشف التقنية <Icon name="arrow" size={17}/></button></article>)}</div>{!listed.length && <p className="empty-state">لم نعثر على تقنية بهذا الاسم.</p>}
        </>}

        {view === "training" && training === null && <><div className="training-summary"><span className="round-icon"><Icon name="target" size={28}/></span><div><h2>رحلتك نحو الإتقان</h2><p>أكملت {totalProgress} من 140 مرحلة. كل خطوة تصنع فرقًا.</p></div><div className="summary-progress"><span style={{width:`${totalProgress/140*100}%`}}/></div></div><div className="technique-grid">{techniques.map((t,i) => <article className="technique-card" key={t.name}><div className="technique-top"><span className="technique-symbol"><Icon name="target"/></span><span className={`badge difficulty-${levels.indexOf(t.difficulty as Difficulty)}`}>{t.difficulty}</span></div><h2>{t.title}</h2><p>10 مراحل متنوعة · مواضع وأنماط وتوزيعات مرشحات مختلفة</p><div className="stage-dots">{Array.from({length:10},(_,s) => <span key={s} className={progress[i]?.includes(s) ? "done" : ""}/>)}</div><button onClick={() => openTraining(i, Array.from({length:10},(_,s) => s).find(s => !progress[i]?.includes(s)) ?? 0)}>ابدأ التدريب <span>{progress[i]?.length || 0} / 10</span><Icon name="arrow" size={17}/></button></article>)}</div></>}

        {view === "training" && training !== null && currentExercise && <>
          <button className="back-link" onClick={() => { setTraining(null); setNotice(""); }}><Icon name="arrow" size={17}/> جميع التدريبات</button>
          <div className="game-layout training-layout"><section className="game-panel"><div className="exercise-title"><h2>{techniques[training].title}</h2><span className="badge">المرحلة {stage+1} من 10</span></div><p className="exercise-variant">{currentExercise.variant}</p><p className="exercise-description">مخطط تعليمي محلي، وليس لغزًا كاملًا. القوائم المعروضة كاملة في الوحدات اللازمة للتقنية؛ الخلايا الرمادية خارج نطاق التمرين.</p><CoordinateBoard selected={trainSelected ?? undefined}><div className="sudoku-board training-board" dir="ltr" role="group" aria-label="مخطط التدريب">{currentExercise.values.map((v,i) => {
            const target = i === currentExercise.target;
            const active = currentExercise.focus.includes(i) || target || v || currentExercise.notes[i].length;
            return <button key={i} aria-label={`صف ${rowLetters[Math.floor(i/9)]} عمود ${i%9+1} (${cellReference(i)})${target ? "، الهدف" : ""}، ${v ? `رقم ${v}` : `مرشحات ${currentExercise.notes[i].join("،")}`}`} disabled={!active || solvedStage} onClick={() => setTrainSelected(i)} className={["cell", !active ? "out-of-scope" : "", currentExercise.focus.includes(i) ? "training-focus" : "", target ? "training-target" : "", trainSelected === i ? "cell-selected" : "", i%9===2 || i%9===5 ? "box-right" : "", Math.floor(i/9)===2 || Math.floor(i/9)===5 ? "box-bottom" : ""].join(" ")}>{v || (solvedStage && target && currentExercise.action === "place" ? currentExercise.digit : <span className="notes-grid">{digits.map(n => <span className={solvedStage && target && n===currentExercise.digit ? "removed-note" : ""} key={n}>{currentExercise.notes[i].includes(n) ? n : ""}</span>)}</span>)}</button>;
          })}</div></CoordinateBoard><div className="board-legend"><span><i className="legend-focus"/>خلايا النمط</span><span><i className="legend-target"/>الخلية الهدف</span></div></section>
          <aside className="game-sidebar"><section className="control-card training-controls"><span className="eyebrow">حان دورك</span><h2>{currentExercise.action === "place" ? "ما الرقم الذي يمكن تثبيته؟" : "أي مرشح يمكن استبعاده؟"}</h2><p>اختر الخلية الهدف ذات الإطار المنقّط، ثم اضغط الرقم {currentExercise.action === "place" ? "لتثبيته" : "لحذفه من مرشحاتها"}.</p><div className="compact-pad" dir="ltr">{digits.map(n => <button key={n} disabled={solvedStage} onClick={() => answer(n)}>{n}</button>)}</div>{prefs.hardMode && <p className="hard-mode-note" role="status">النمط الصعب مفعّل: {attempts}/3 محاولات خاطئة — الثالثة تعيد المرحلة.</p>}<button className="hint-button" disabled={step>=3} onClick={() => setStep(s => Math.min(3,s+1))}><span><Icon name="bulb" size={19}/>أحتاج خطوة توضيحية</span><span>{step}/3</span></button><ol className="steps">{currentExercise.steps.slice(0,step).map((s,i) => <li key={i}>{s}</li>)}</ol>{solvedStage && <div className="success-box"><Icon name="check"/>تطبيق صحيح! {stage === 9 ? "أكملت المرحلة الأخيرة لهذه التقنية." : "مستعد للمرحلة التالية؟"}<button className="primary" onClick={() => stage < 9 ? openTraining(training,stage+1) : setTraining(null)}>{stage < 9 ? "المرحلة التالية" : "العودة للتدريبات"}<Icon name="arrow" size={17}/></button></div>}<button className="text-button" onClick={() => setDetail(training)}>راجع شرح التقنية</button></section><div className="stage-picker">{Array.from({length:10},(_,s) => <button aria-label={`المرحلة ${s+1}`} className={stage===s ? "current" : progress[training]?.includes(s) ? "done" : ""} key={s} onClick={() => openTraining(training,s)}>{s+1}</button>)}</div></aside></div>
        </>}

        {notice && <div className="notice" role="status"><Icon name="bulb" size={19}/><span>{notice}</span><button className="icon-button" onClick={() => { setNotice(""); setConflict(null); }} aria-label="إغلاق التنبيه"><Icon name="close" size={16}/></button></div>}
        {view === "game" && complete && !endClosed && <div className="modal-backdrop" onClick={() => setEndClosed(true)}><section role="dialog" aria-modal="true" aria-labelledby="end-title" className="modal end-modal" onClick={e => e.stopPropagation()}><button className="modal-close icon-button" aria-label="إغلاق" onClick={() => setEndClosed(true)}><Icon name="close"/></button><span className="round-icon"><Icon name="check" size={30}/></span><h2 id="end-title">كل الأرقام وجدت مكانها!</h2><p>أنهيت اللغز. إليك حصيلة جولتك:</p><div className="end-stats"><div><small>الوقت</small><strong dir="ltr">{timeLabel(seconds)}</strong></div><div><small>الأخطاء</small><strong>{mistakes}</strong></div><div><small>المستوى</small><strong>{difficulty}</strong></div></div><button className="primary" onClick={() => startGame(difficulty)}>إعادة اللعب <Icon name="arrow" size={18}/></button><button className="text-button" onClick={() => { setEndClosed(true); setNextLevel(difficulty); setDialog(true); }}>لعبة جديدة بمستوى آخر</button></section></div>}

        {view === "game" && <section className="learning-banner"><div className="banner-icon"><Icon name="book" size={28}/></div><div><span className="eyebrow">اللعب أجمل عندما تفهمه</span><h2>خطوتك التالية… أن تصبح أفضل.</h2><p>تعلّم 14 تقنية لحل سودوكو، وطبّقها في 140 مرحلة تدريبية.</p></div><button onClick={() => { setView("training"); setTraining(null); }}>اكتشف ساحة التدريب <Icon name="arrow" size={18}/></button><div className="banner-pattern" aria-hidden="true">1 2 3<br/>4 5 6<br/>7 8 9</div></section>}
        <footer><span className="footer-brand"><Icon name="grid" size={16}/>سودوكو ماستر</span><span>صُمّم لشغفك بالتفكير. بدون تشتت.</span><span>المنطق أولًا، ثم الأرقام.</span><span className="icon-credit">Sudoku Icon by Jeremiah on <a href="https://icon-icons.com/authors/602-jeremiah" target="_blank" rel="noopener noreferrer">Icon-Icons.com</a></span></footer>
      </main>

      {dialog && <div className="modal-backdrop" onClick={() => setDialog(false)}><section role="dialog" aria-modal="true" aria-labelledby="new-game-title" className="modal" onClick={e => e.stopPropagation()}><button className="modal-close icon-button" aria-label="إغلاق" onClick={() => setDialog(false)}><Icon name="close"/></button><span className="round-icon"><Icon name="grid" size={30}/></span><h2 id="new-game-title">بداية جديدة، تحدٍ جديد</h2><p>اختر مساحة التحدي المناسبة لك. بدء لعبة جديدة يستبدل اللعبة الحالية وحركاتها.</p><div className="level-options">{levels.map((l,i) => <button className={nextLevel===l ? "selected" : ""} key={l} onClick={() => setNextLevel(l)}><strong>{l}</strong><small>{["بداية هادئة","تركيز أعمق","تحدٍ أكبر"][i]}</small></button>)}</div><p className="fine-print">الألغاز ذات حل وحيد. التصنيف هنا حسب عدد المعطيات، وليس تقييمًا مضمونًا لتعقيد تقنيات الحل.</p><button className="primary" onClick={() => startGame()}>ابدأ اللعب <Icon name="arrow" size={18}/></button><button className="text-button" onClick={() => setDialog(false)}>العودة للغز الحالي</button></section></div>}
      {detail !== null && <div className="modal-backdrop" onClick={() => setDetail(null)}><section role="dialog" aria-modal="true" aria-labelledby="technique-title" className="modal technique-modal" onClick={e => e.stopPropagation()}><button className="modal-close icon-button" onClick={() => setDetail(null)} aria-label="إغلاق"><Icon name="close"/></button><span className="badge">{techniques[detail].difficulty}</span><span className="english-name">{techniques[detail].name}</span><h2 id="technique-title">{techniques[detail].title}</h2><p>{techniques[detail].dis}</p><div className="example correct-example"><h3><Icon name="check" size={18}/>تطبيق صحيح</h3><ExampleDiagram technique={detail}/><p>{techniques[detail].correct}</p></div><div className="example incorrect-example"><h3><Icon name="close" size={18}/>تطبيق غير صحيح</h3><ExampleDiagram technique={detail} wrong/><p>{techniques[detail].incorrect}</p></div><p className="fine-print">في تقنيات المرشحات، ابدأ بقائمة كاملة ولا تحذف أي مرشح دون سبب منطقي.</p><button className="primary" onClick={() => { openTraining(detail); setDetail(null); }}>جرّب التقنية · 10 مراحل <Icon name="arrow" size={18}/></button></section></div>}
    </div>
  );
}
