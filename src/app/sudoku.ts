export type Difficulty = "سهل" | "متوسط" | "صعب";
export type Snapshot = { board: number[]; notes: number[][] };
export const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
export const rowLetters = "ABCDEFGHI".split("");
export const cellReference = (index: number) => `${rowLetters[Math.floor(index / 9)]}${index % 9 + 1}`;
export const initialBoard = "530070000600195000098000060800060003400803001700020006060000280000419005000080079".split("").map(Number);
export const peers = (a: number, b: number) => a !== b && (Math.floor(a / 9) === Math.floor(b / 9) || a % 9 === b % 9 || (Math.floor(a / 27) === Math.floor(b / 27) && Math.floor((a % 9) / 3) === Math.floor((b % 9) / 3)));
export function noteBlockers(board: number[], index: number, n: number): number[] {
  return board.flatMap((value,i) => value === n && peers(index,i) ? [i] : []);
}
export function candidates(board: number[], index: number): number[] {
  return board[index] ? [] : digits.filter(n => !board.some((v, i) => v === n && peers(index, i)));
}
export function solve(board: number[], limit = 1): number[][] {
  const work = [...board];
  const results: number[][] = [];
  if (work.some((n, i) => n && work.some((v, j) => v === n && peers(i, j)))) return results;
  function visit() {
    if (results.length >= limit) return;
    let index = -1;
    let options = digits;
    for (let i = 0; i < 81; i++) {
      if (work[i]) continue;
      const possible = candidates(work, i);
      if (!possible.length) return;
      if (index === -1 || possible.length < options.length) { index = i; options = possible; }
    }
    if (index === -1) { results.push([...work]); return; }
    for (const n of options) { work[index] = n; visit(); if (results.length >= limit) break; }
    work[index] = 0;
  }
  visit();
  return results;
}
function shuffled<T>(list: T[]): T[] {
  const result = [...list];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function newPuzzle(level: Difficulty): number[] {
  const numbers = shuffled(digits);
  const rows = shuffled([0, 1, 2]).flatMap(b => shuffled([0, 1, 2]).map(r => b * 3 + r));
  const cols = shuffled([0, 1, 2]).flatMap(b => shuffled([0, 1, 2]).map(c => b * 3 + c));
  const board = rows.flatMap(r => cols.map(c => numbers[(r * 3 + Math.floor(r / 3) + c) % 9]));
  const clues = { "سهل": 43, "متوسط": 34, "صعب": 27 }[level];
  let remaining = 81;
  for (const i of shuffled(Array.from({ length: 81 }, (_, k) => k))) {
    const n = board[i];
    board[i] = 0;
    if (solve(board, 2).length !== 1) board[i] = n;
    else remaining--;
    if (remaining <= clues) break;
  }
  return board;
}
export function place(state: Snapshot, index: number, n: number, pencil: boolean): Snapshot | null {
  if (!Number.isInteger(index) || index < 0 || index > 80 || !Number.isInteger(n) || n < 0 || n > 9) return null;
  const notes = state.notes.map(v => [...v]);
  const board = [...state.board];
  if (pencil) {
    if (board[index] || (!notes[index].includes(n) && !candidates(board, index).includes(n))) return null;
    notes[index] = notes[index].includes(n) ? notes[index].filter(v => v !== n) : [...notes[index], n].sort();
  } else {
    board[index] = n;
    notes[index] = [];
    if (n) notes.forEach((list, i) => { if (peers(index, i)) notes[i] = list.filter(v => v !== n); });
  }
  return { board, notes };
}
export function gameMove(state: Snapshot, given: number[], solution: number[], index: number, n: number, pencil: boolean): { state: Snapshot; mistake: boolean } | null {
  if (given[index] || (!pencil && n !== 0 && state.board[index] === n)) return null;
  const next = place(state, index, n, pencil && n !== 0);
  if (!next) return null;
  const mistake = !pencil && n !== 0 && n !== solution[index];
  if (mistake) next.notes = state.notes.map((list,i) => i === index ? [] : [...list]);
  return { state: next, mistake };
}
export function toggleQuickNotes(state: Snapshot): Snapshot {
  const clear = state.notes.some(list => list.length > 0);
  return { board: [...state.board], notes: state.board.map((_,i) => clear ? [] : candidates(state.board,i)) };
}
export type Exercise = { values: number[]; notes: number[][]; focus: number[]; target: number; digit: number; action: "place" | "remove"; steps: string[]; units: number[][]; reserved: number[]; variant: string };
export function exercise(technique: number, stage: number): Exercise {
  const values = Array(81).fill(0) as number[];
  const notes: number[][] = Array.from({ length: 81 }, () => []);
  let focus: number[] = [], target = 0, digit = 9;
  let action: "place" | "remove" = "remove";
  let steps: string[] = [];
  const row = (entries: number[][]) => entries.forEach((v, i) => { notes[i] = v; });
  if (technique === 0) {
    digits.slice(0,8).forEach((n,i) => { values[i] = n; });
    target = 8; focus = [0,1,2,3,4,5,6,7]; action = "place";
  } else if (technique === 1 || technique === 6) {
    target = 8; focus = [0,1,2,3,4,5,6,7,8]; action = "place";
    if (technique === 6) row([[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[1,8],[2,9]]);
    else for (let r = 1; r < 9; r++) {
      const c = (8 - (r*3 + Math.floor(r/3))%9 + 9)%9;
      values[r*9+c] = 9;
    }
  } else if (technique === 2 || technique === 3) {
    if (technique === 2) { [1,2,3,4].forEach((n,i) => { values[i+1] = n; }); [5,6,7,8].forEach((n,i) => { values[(i+1)*9] = n; }); }
    else notes[0] = [9];
    focus = technique === 2 ? [1,2,3,4,9,18,27,36] : [0]; action = "place";
  } else if (technique === 4 || technique === 5) {
    row([[1,2],[1,2],[1,2,3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[4,9]]);
    focus = [0,1]; target = 2; digit = 1;
    if (technique === 5) { row([[1,2],[2,3],[1,3],[1,4],[4,5],[5,6],[6,7],[7,8],[8,9]]); focus = [0,1,2]; target = 3; }
  } else if (technique === 7 || technique === 8) {
    row([[1,2,4],[1,2,5],[3,4],[3,5],[5,6],[6,7],[7,8],[8,9],[3,9]]);
    focus = [0,1]; digit = 4;
    if (technique === 8) { row([[1,2,4],[2,3,5],[1,3,6],[4,5],[5,6],[6,7],[7,8],[8,9],[4,9]]); focus = [0,1,2]; }
  } else digit = technique === 9 || technique === 10 ? 5 : technique === 12 ? 3 : 7;
  const variant = stage % 3;
  const baseRow = Array.from({ length: 9 }, (_, i) => i);
  const baseBox = [0,1,2,9,10,11,18,19,20];
  let units: number[][] = [baseRow];
  let reserved: number[] = [];
  const boxMode = variant === 2 && [0,4,5,6,7,8].includes(technique);
  let variantLabel = boxMode ? "داخل مربع" : stage % 2 ? "عبر عمود" : "عبر صف";
  if (technique === 1 && variant === 2) { units = [[6,7,8,15,16,17,24,25,26]]; focus = [...units[0]]; variantLabel = "آخر موضع في مربع"; }
  if (technique === 2 && variant > 0) {
    values.fill(0);
    [3,4,9,18,10,11,19,20].forEach((i,k) => { values[i] = k+1; });
    focus = [3,4,9,18,10,11,19,20]; variantLabel = "استبعاد موزع بين الوحدات";
  }
  if (technique === 3 && variant > 0) { notes[1] = [1,2,3]; notes[9] = [4,5,6]; notes[10] = variant === 1 ? [2,7,8] : [1,3,7,8]; variantLabel = "مرشح وحيد وسط مرشحات مشتتة"; }
  if (technique === 4) {
    reserved = [1,2];
    if (variant === 1) { [notes[1],notes[4]] = [notes[4],notes[1]]; focus = [0,4]; digit = 2; variantLabel = "زوج متباعد"; }
  }
  if (technique === 5) {
    reserved = [1,2,3];
    if (variant === 1) { notes[0] = [1,2,3]; notes[1] = [1,2]; notes[2] = [2,3]; variantLabel = "ثلاثي مختلط"; }
    if (variant === 2) { [0,1,2].forEach(i => { notes[i] = [1,2,3]; }); variantLabel = "ثلاثي متطابق داخل مربع"; }
  }
  if (technique === 6 && variant > 0) { notes[8] = variant === 1 ? [2,4,6,9] : [1,3,5,9]; variantLabel = boxMode ? "وحيد مخفي في مربع" : "وحيد مخفي بين مرشحات متعددة"; }
  if (technique === 7 || technique === 8) {
    reserved = technique === 7 ? [1,2] : [1,2,3];
    if (variant === 1) {
      target = 1; digit = 5;
      notes[0] = technique === 7 ? [1,2,4,6] : [1,2,3,4];
      notes[1] = [1,2,5,7];
      variantLabel = technique === 7 ? "زوج مع مرشحات إضافية" : "ثلاثي بتوزيع غير متطابق";
    }
    if (variant === 2 && technique === 8) { notes[0] = [1,2,3,4]; notes[1] = [1,2,3,5]; notes[2] = [1,2,3,6]; }
  }
  if (technique === 9 || technique === 10) {
    units = [baseBox];
    baseBox.forEach(i => { notes[i] = digits.filter(n => n !== 5); });
    focus = technique === 9 ? [[0,1],[0,2],[1,2]][variant] : [0,1,2];
    focus.forEach((i,k) => { notes[i] = technique === 9 ? [2,5] : variant === 0 ? [1,2,5] : [[1,3,5],[2,4,5],[1,4,5]][k]; });
    notes[5] = [];
    target = variant === 1 ? 7 : variant === 2 ? 8 : 5;
    notes[target] = variant === 2 ? [3,5,7,9] : [5,7];
    variantLabel = technique === 9 ? "زوج موجّه بمواضع متباعدة" : variant ? "ثلاثي موجّه بمرشحات مختلفة" : "ثلاثي موجّه";
  }
  if (technique === 11 || technique === 13) {
    for (let i = 0; i < 81; i++) notes[i] = digits.filter(n => n !== 7);
    const rows = technique === 11 ? [0,3] : [0,3,6];
    const columns = technique === 11 ? [1,7] : [1,4,7];
    units = rows.map(r => baseRow.map(c => r*9+c));
    focus = rows.flatMap((r,k) => columns.filter((_,j) => technique === 11 || variant === 0 || (variant === 1 ? j !== [2,0,1][k] : !(k===0 && j===2) && !(k===2 && j===0))).map(c => r*9+c));
    focus.forEach(i => { notes[i] = technique === 11 ? variant === 0 ? [2,7] : [1,3,5,7] : [1,2,7]; });
    target = (variant === 1 ? 4 : 2)*9 + columns[variant % columns.length];
    notes[target] = [3,7];
    variantLabel = technique === 11 ? variant ? "جناح X وسط مرشحات متعددة" : "جناح X بسيط" : ["سمكة سيف بتسعة مواضع","سمكة سيف بستة مواضع","سمكة سيف بسبعة مواضع"][variant];
  }
  if (technique === 12) {
    notes.forEach((_,i) => { notes[i] = []; });
    const layouts = [[0,4,36,40],[0,10,4,13],[40,30,44,35]];
    const [pivot,a,b,t] = layouts[variant];
    notes[pivot] = [1,2]; notes[a] = [1,3]; notes[b] = [2,3]; notes[t] = variant ? [3,4,5] : [3,4];
    focus = [pivot,a,b]; target = t; units = [];
    variantLabel = variant ? "جناح Y برؤية عبر مربع وخط" : "جناح Y عبر صف وعمود";
  }
  if (technique === 2 || technique === 3) units = [];
  const shift = stage % 9;
  const mapDigit = (n: number) => n ? (n - 1 + shift) % 9 + 1 : 0;
  const mapIndex = (i: number) => {
    let r = Math.floor(i/9), c = i%9;
    if (boxMode) [r,c] = [Math.floor(r/3)*3+Math.floor(c/3), (r%3)*3+c%3];
    r = ((Math.floor(r/3)+stage%3)%3)*3 + (r%3+Math.floor(stage/3)%3)%3;
    c = ((Math.floor(c/3)+Math.floor(stage/2)%3)%3)*3 + (c%3+stage%3)%3;
    return stage%2 ? c*9+r : r*9+c;
  };
  const result: Exercise = { values: Array(81).fill(0), notes: Array.from({ length: 81 }, () => []), focus: focus.map(mapIndex), target: mapIndex(target), digit: mapDigit(digit), action, steps: [], units: units.map(u => u.map(mapIndex)), reserved: reserved.map(mapDigit), variant: variantLabel };
  values.forEach((v,i) => { result.values[mapIndex(i)] = mapDigit(v); result.notes[mapIndex(i)] = notes[i].map(mapDigit).sort(); });
  const coordinate = (i: number) => `${cellReference(i)} (الصف ${rowLetters[Math.floor(i/9)]}، العمود ${i%9+1})`;
  const members = result.focus.map(coordinate).join("؛ ");
  const numbers = result.reserved.join("، ");
  if (technique === 0) steps = ["افحص الوحدة التي تحتوي الخلايا الملوّنة والهدف.", "ثمانية أرقام ثابتة مختلفة؛ الرقم الناقص هو " + result.digit + "."];
  else if (technique === 1) steps = [`تتبّع مواضع الرقم ${result.digit} في الوحدة الملوّنة.`, "الأرقام الثابتة في الوحدات المتقاطعة تستبعد جميع المواضع إلا الهدف."];
  else if (technique === 2 || technique === 3) steps = [technique === 2 ? "اجمع الأرقام الثابتة التي يراها الهدف عبر صفه وعموده ومربعه." : "افحص قائمة المرشحات الكاملة للهدف؛ لا تنشغل بالقوائم المجاورة.", `لا يبقى للهدف إلا الرقم ${result.digit}.`];
  else if (technique === 4 || technique === 5) steps = [`قارن مرشحات المجموعة: ${members}.`, `اتحاد المرشحات {${numbers}} يساوي عدد خلايا المجموعة؛ استبعد هذه الأرقام من بقية الوحدة، دون تثبيت أرقام المجموعة.`];
  else if (technique === 6) steps = [`ابحث عن الرقم ${result.digit} في الوحدة الملوّنة كاملة.`, "لا يظهر هذا المرشح إلا في الهدف، رغم وجود مرشحات أخرى فيه."];
  else if (technique === 7 || technique === 8) steps = [`تتبّع الأرقام {${numbers}} في الوحدة كاملة.`, `هذه الأرقام محصورة في ${result.focus.length} خلايا؛ احذف المرشحات الأخرى من هذه الخلايا فقط.`];
  else if (technique === 9 || technique === 10) steps = [`ابحث عن جميع مواضع ${result.digit} داخل المربع الملوّن.`, `المواضع كلها على خط واحد: ${members}. احذف الرقم من ذلك الخط خارج المربع.`];
  else if (technique === 11 || technique === 13) steps = [`تتبّع الرقم ${result.digit} في كل وحدة أساس كاملة؛ عدد وحدات الأساس ${result.units.length}.`, `كل المواضع محصورة في ${result.units.length} خطوط تغطية مقابلة. احذف الرقم من خطوط التغطية خارج وحدات الأساس؛ لا يلزم امتلاء كل التقاطعات.`];
  else steps = [`المحور (${coordinate(result.focus[0])}) يرى الجناحين، وكل خلية من الثلاث ثنائية المرشح.`, `أيًا كان حل المحور، يحمل أحد الجناحين ${result.digit}. الهدف يرى الجناحين معًا، فاستبعد هذا الرقم منه.`];
  result.steps = [...steps, `${action === "place" ? "ثبّت الرقم" : "احذف المرشح"} ${result.digit} في الخلية الهدف: ${coordinate(result.target)}.`];
  return result;
}
