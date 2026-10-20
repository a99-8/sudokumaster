<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project verification

- Run `npm test` for Sudoku engine, candidate rules, puzzle uniqueness, technique data, and all 140 training variations. Tests use Node's test runner and the installed TypeScript compiler; no additional test dependency is needed.
- Run `npm run lint` and `npm run build` before completing changes.
- Training boards are local candidate diagrams, not complete playable puzzles. Their scoped units must remain logically consistent. Ten stages per technique vary candidate distributions, geometry, units, digits, and orientation; Swordfish includes six-, seven-, and nine-position patterns.
- Regular game entries accept incorrect numbers. Compare against the solution of the original givens, not the current board. Mistakes are cumulative attempts, persist with the game, and are not reversed by undo; pencil entries and hints do not increment them.
- `/settings` selects from 8 primary themes and 8 secondary accents through the shared ThemeProvider (`theme.tsx`, `palette.ts`). themeVariables returns resolved hex colors (no color-mix); tests check 4.5:1 contrast for all 64 combinations.
- Boards use A–I row letters and 1–9 column numbers (`cellReference`, `rowLetters` in `sudoku.ts`). `noteBlockers` returns cells that block a pencil candidate; the UI marks them and names their coordinates.
- A digit's number-pad button is disabled when it has been placed 9 times, unless the selected cell already has that note (so notes stay erasable).
- Puzzle difficulty currently uses clue-count targets, not a technique-based solving rating. Keep that distinction visible in the UI.
