import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("./sudoku.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { candidates, cellReference, digits, exercise, gameMove, initialBoard, newPuzzle, noteBlockers, peers, place, rowLetters, solve, toggleQuickNotes } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
const paletteSource = readFileSync(new URL("./palette.ts", import.meta.url), "utf8");
const paletteCompiled = ts.transpileModule(paletteSource, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { accents, basePalettes, themes, themeVariables } = await import(`data:text/javascript;base64,${Buffer.from(paletteCompiled).toString("base64")}`);
const techniques = JSON.parse(readFileSync(new URL("../../Technologies/Technologies.json", import.meta.url), "utf8"));
const blank = () => ({ board: Array(81).fill(0), notes: Array.from({ length: 81 }, () => []) });
const rowOf = i => Math.floor(i/9);
const colOf = i => i%9;
const boxOf = i => Math.floor(i/27)*3+Math.floor(i%9/3);
function assignments(e, indices) {
  let count = 0;
  function visit(k, used) {
    if (k === indices.length) { count++; return; }
    const i = indices[k];
    for (const n of e.values[i] ? [e.values[i]] : e.notes[i]) if (!used.has(n)) visit(k+1, new Set([...used,n]));
  }
  visit(0,new Set());
  return count;
}

test("all 64 primary and secondary combinations retain readable text and action colors", () => {
  const luminance = hex => {
    const c = hex.slice(1).match(/../g).map(v => parseInt(v,16)/255).map(v => v<=.04045 ? v/12.92 : ((v+.055)/1.055)**2.4);
    return c[0]*.2126+c[1]*.7152+c[2]*.0722;
  };
  const contrast = (a,b) => { const l = [luminance(a),luminance(b)].sort((a,b) => b-a); return (l[0]+.05)/(l[1]+.05); };
  assert.equal(themes.length,8); assert.equal(accents.length,8);
  for (const theme of themes) for (const accent of accents) {
    const vars = themeVariables(theme,accent), base = basePalettes[theme];
    for (const fg of ["--ink","--muted"]) for (const bg of ["--paper","--bg"]) assert.ok(contrast(vars[fg],vars[bg])>=4.5, `${theme}/${accent} ${fg} on ${bg}`);
    assert.ok(contrast(vars["--on-accent"],vars["--green"])>=4.5,`${theme}/${accent} action contrast`);
    assert.ok(contrast(vars["--green"],base.paper)>=4.5,`${theme}/${accent} accent text contrast`);
    assert.ok(contrast(vars["--error"],vars["--error-bg"])>=4.5);
    assert.ok(contrast(vars["--note-ink"],vars["--note-bg"])>=4.5,`${theme}/${accent} note highlight`);
    assert.ok(contrast(vars["--cell-ink"],vars["--selected"])>=4.5,`${theme}/${accent} selected cell`);
    assert.ok(contrast(vars["--cell-ink"],vars["--same"])>=4.5,`${theme}/${accent} same-number cell`);
    assert.ok(contrast(vars["--cell-ink"],vars["--related"])>=3,`${theme}/${accent} related cell`);
    assert.ok(contrast(vars["--green"],vars["--light"])>=3,`${theme}/${accent} accent on light surface`);
  }
});

test("coordinates use A-I rows and 1-9 columns consistently", () => {
  assert.deepEqual(rowLetters,["A","B","C","D","E","F","G","H","I"]);
  assert.equal(cellReference(0),"A1");
  assert.equal(cellReference(8),"A9");
  assert.equal(cellReference(40),"E5");
  assert.equal(cellReference(80),"I9");
  assert.equal(new Set(Array.from({length:81},(_,i) => cellReference(i))).size,81);
  for (let t=0;t<14;t++) for (let s=0;s<10;s++) {
    const e = exercise(t,s);
    assert.ok(e.steps[2].includes(cellReference(e.target)));
  }
});
test("pencil blockers identify all row, column and box matches, not unrelated cells", () => {
  const board = Array(81).fill(0);
  for (const i of [1,9,10,40]) board[i] = 5;
  board[2] = 4;
  assert.deepEqual(noteBlockers(board,0,5),[1,9,10]);
  assert.deepEqual(noteBlockers(board,0,4),[2]);
  assert.deepEqual(noteBlockers(board,0,3),[]);
  assert.deepEqual(noteBlockers(board,40,5),[]);
  assert.deepEqual(board.filter(Boolean),[5,4,5,5,5]);
});

test("initial puzzle is valid and uniquely solvable", () => {
  assert.equal(solve(initialBoard,2).length,1);
  assert.equal(solve(Array(81).fill(1)).length,0);
});
test("pencil rejects new conflicts but existing notes can always be erased", () => {
  for (const index of [1,9,10]) {
    const state = blank(); state.board[0] = 5;
    assert.equal(place(state,index,5,true),null);
    assert.ok(!candidates(state.board,index).includes(5));
    state.notes[index] = [5];
    assert.deepEqual(place(state,index,5,true).notes[index],[]);
  }
  const state = blank(); state.board[0] = 5;
  assert.equal(place(state,0,3,true),null);
  assert.ok(place(state,40,5,true));
});
test("pencil toggles without mutation, placing prunes peers, snapshots allow undo", () => {
  const original = blank();
  const noted = place(original,1,5,true);
  assert.deepEqual(original.notes[1],[]);
  assert.deepEqual(noted.notes[1],[5]);
  assert.deepEqual(place(noted,1,5,true).notes[1],[]);
  const placed = place(noted,0,5,false);
  assert.deepEqual(placed.notes[1],[]);
  assert.deepEqual(noted.notes[1],[5]);
  assert.equal(place(placed,9,5,false).board[9],5);
  assert.equal(place(placed,0,0,false).board[0],0);
});
test("all numbers including conflicting and nonconflicting wrong answers are accepted and counted", () => {
  const solution = solve(initialBoard)[0];
  const state = { board: [...initialBoard], notes: blank().notes };
  for (const n of digits) {
    const result = gameMove(state,initialBoard,solution,2,n,false);
    assert.equal(result.state.board[2],n);
    assert.equal(result.mistake,n!==solution[2]);
    assert.equal(result.mistake ? 1 : 0,n!==solution[2] ? 1 : 0);
  }
  assert.equal(gameMove(state,initialBoard,solution,0,1,false),null);
  const wrong = gameMove(state,initialBoard,solution,2,5,false);
  assert.equal(gameMove(wrong.state,initialBoard,solution,2,5,false),null);
  assert.equal(gameMove(wrong.state,initialBoard,solution,2,0,false).mistake,false);
  assert.equal(gameMove(state,initialBoard,solution,2,solution[2],true).mistake,false);
  assert.equal(gameMove(state,initialBoard,solution,2,5,true),null);
});
test("wrong placements preserve peer notes, corrections prune notes and erase is reversible", () => {
  const solution = solve(initialBoard)[0];
  const state = { board: [...initialBoard], notes: blank().notes };
  state.notes[3] = [4,6];
  const wrong = gameMove(state,initialBoard,solution,2,6,false);
  assert.equal(wrong.mistake,true);
  assert.deepEqual(wrong.state.notes[3],[4,6]);
  const correct = gameMove(wrong.state,initialBoard,solution,2,4,false);
  assert.equal(correct.mistake,false);
  assert.deepEqual(correct.state.notes[3],[6]);
  assert.deepEqual(state.notes[3],[4,6]);
});
test("quick pencil fills legal notes and clears all notes without changing numbers", () => {
  const original = { board: [...initialBoard], notes: blank().notes };
  const filled = toggleQuickNotes(original);
  assert.ok(filled.notes.some(a => a.length>0));
  filled.notes.forEach((a,i) => assert.deepEqual(a,candidates(original.board,i)));
  const cleared = toggleQuickNotes(filled);
  assert.ok(cleared.notes.every(a => !a.length));
  assert.deepEqual(cleared.board,original.board);
  assert.deepEqual(original.notes,blank().notes);
  assert.ok(filled.notes.some(a => a.length>0));
  const i = filled.notes.findIndex(a => a.length);
  assert.deepEqual(place(filled,i,0,false).notes[i],[]);
});
test("all difficulties generate unique puzzles", () => {
  for (const level of ["سهل","متوسط","صعب"]) for (let k=0;k<3;k++) {
    const board = newPuzzle(level);
    assert.equal(board.length,81);
    assert.equal(solve(board,2).length,1);
    assert.ok(board.filter(Boolean).length >= {"سهل":43,"متوسط":34,"صعب":27}[level]);
    assert.ok(board.includes(0));
  }
});
test("14 techniques include difficulty and correct and incorrect examples", () => {
  assert.equal(techniques.length,14);
  for (const t of techniques) {
    assert.ok(["سهل","متوسط","صعب"].includes(t.difficulty));
    assert.ok(t.correct && t.incorrect && t.title && t.dis);
  }
});
test("140 distinct exercises have consistent units, valid values and explicit steps", () => {
  for (let technique=0;technique<14;technique++) {
    const variations = new Set();
    for (let stage=0;stage<10;stage++) {
      const e = exercise(technique,stage);
      variations.add(JSON.stringify(e));
      assert.equal(e.values.length,81);
      assert.equal(e.notes.length,81);
      assert.equal(e.steps.length,3);
      assert.ok(e.variant);
      assert.ok(digits.includes(e.digit));
      assert.equal(e.values[e.target],0);
      assert.ok(!e.values.some((v,i) => v && e.values.some((n,j) => n===v && peers(i,j))));
      if (e.action === "remove") assert.ok(e.notes[e.target].includes(e.digit));
      else assert.ok(candidates(e.values,e.target).includes(e.digit));
      for (const u of e.units) {
        assert.equal(new Set(u).size,9);
        assert.ok([rowOf,colOf,boxOf].some(axis => u.every(i => axis(i)===axis(u[0]))));
        if ([4,5,6,7,8,9,10,11,13].includes(technique)) assert.ok(assignments(e,u)>0, `no assignment for technique ${technique}, stage ${stage}`);
      }
    }
    assert.equal(variations.size,10);
  }
});
test("single placements are justified by their unit, blockers or complete candidates", () => {
  for (let stage=0;stage<10;stage++) {
    const free = exercise(0,stage);
    const fixed = free.units[0].filter(i => free.values[i]);
    assert.equal(fixed.length,8);
    assert.ok(!fixed.some(i => free.values[i]===free.digit));
    const last = exercise(1,stage);
    assert.deepEqual(last.units[0].filter(i => candidates(last.values,i).includes(last.digit)),[last.target]);
    const number = exercise(2,stage);
    assert.deepEqual(candidates(number.values,number.target),[number.digit]);
    const single = exercise(3,stage);
    assert.deepEqual(single.notes[single.target],[single.digit]);
    const hidden = exercise(6,stage);
    assert.deepEqual(hidden.units[0].filter(i => hidden.notes[i].includes(hidden.digit)),[hidden.target]);
  }
});
test("every elimination follows the technique regardless of layout or candidate distribution", () => {
  for (let stage=0;stage<10;stage++) {
    for (const t of [4,5]) {
      const e = exercise(t,stage);
      const reserved = new Set(e.focus.flatMap(i => e.notes[i]));
      assert.equal(reserved.size,e.focus.length);
      assert.ok(reserved.has(e.digit));
      assert.ok(!e.focus.includes(e.target));
      assert.ok(e.focus.every(i => e.units[0].includes(i)) && e.units[0].includes(e.target));
    }
    for (const t of [7,8]) {
      const e = exercise(t,stage);
      assert.ok(!e.reserved.includes(e.digit));
      assert.equal(e.reserved.length,e.focus.length);
      for (const n of e.reserved) {
        const locations = e.units[0].filter(i => e.notes[i].includes(n));
        assert.ok(locations.length>0 && locations.every(i => e.focus.includes(i)));
      }
    }
    for (const t of [9,10]) {
      const e = exercise(t,stage);
      const positions = e.units[0].filter(i => e.notes[i].includes(e.digit));
      assert.deepEqual(new Set(positions),new Set(e.focus));
      assert.equal(positions.length,t===9 ? 2 : 3);
      assert.ok(!e.units[0].includes(e.target));
      assert.ok([rowOf,colOf].some(axis => positions.every(i => axis(i)===axis(e.target))));
    }
    const y = exercise(12,stage);
    const [pivot,a,b] = y.focus;
    assert.ok(peers(pivot,a) && peers(pivot,b) && peers(y.target,a) && peers(y.target,b));
    assert.ok(y.focus.every(i => y.notes[i].length===2));
    assert.ok(!y.notes[pivot].includes(y.digit) && y.notes[a].includes(y.digit) && y.notes[b].includes(y.digit));
    const pivotNumbers = new Set(y.notes[pivot]);
    assert.equal(y.notes[a].filter(n => pivotNumbers.has(n)).length,1);
    assert.equal(y.notes[b].filter(n => pivotNumbers.has(n)).length,1);
    assert.notEqual(y.notes[a].find(n => pivotNumbers.has(n)),y.notes[b].find(n => pivotNumbers.has(n)));
    for (const t of [11,13]) {
      const e = exercise(t,stage);
      const coverAxis = e.units[0].every(i => rowOf(i)===rowOf(e.units[0][0])) ? colOf : rowOf;
      const covers = new Set();
      for (const u of e.units) {
        const positions = u.filter(i => e.notes[i].includes(e.digit));
        assert.ok(positions.length>=2 && positions.length<=e.units.length);
        positions.forEach(i => covers.add(coverAxis(i)));
      }
      assert.equal(covers.size,e.units.length);
      assert.ok(covers.has(coverAxis(e.target)));
      assert.ok(!e.units.flat().includes(e.target));
    }
  }
});
test("training varies structures, units and wing geometry, not only digits", () => {
  const stages = t => Array.from({length:10},(_,s) => exercise(t,s));
  assert.deepEqual(new Set(stages(13).map(e => e.focus.length)),new Set([6,7,9]));
  assert.ok(new Set(stages(5).map(e => e.focus.map(i => e.notes[i].length).join(","))).size>=3);
  for (const t of [0,4,5,6,7,8]) {
    const types = new Set(stages(t).map(e => e.units[0].every(i => rowOf(i)===rowOf(e.units[0][0])) ? "row" : e.units[0].every(i => colOf(i)===colOf(e.units[0][0])) ? "column" : "box"));
    assert.deepEqual(types,new Set(["row","column","box"]));
  }
  assert.ok(stages(12).some(e => { const [p,a,b] = e.focus; return boxOf(p)===boxOf(a) || boxOf(p)===boxOf(b); }));
});
