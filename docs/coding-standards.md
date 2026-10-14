# Lightweight coding standards

Keep the starter easy to extend:

- Put reusable React components, layout logic, and styles in `src/ui/`.
- Put project content and future canvas or renderer integration in `src/content/`.
- Use one component per file, name React components in PascalCase, and name helpers by the behavior they provide.
- Keep imports within a layer when possible; UI may receive content through props, while content should not own the UI shell.
- Keep renderer implementation and lifecycle within `src/content/`. Babylon Lite is the recommended starting point for games that need an engine; projects may replace it with another engine or remove it for an app.
- Prefer small focused changes and update the focused tests when a source boundary or layout contract changes.

## Strict TypeScript coverage

All application code, React components, tests, executable configuration and tools
must use `.ts`/`.tsx`. Validate `unknown` input; do not add blanket `any`,
`@ts-nocheck`, permissive module stubs or disable strict flags to pass checks.
Narrow assertions document the pinned Babylon runtime and render-surface adapter.

`tsconfig.base.json` enables `strict`, `noUncheckedIndexedAccess`,
`exactOptionalPropertyTypes`, `noImplicitOverride`, `verbatimModuleSyntax` and
consistent filename casing. `tsconfig.app.json` owns browser source with Vite and
WebGPU types. `tsconfig.node.json` owns tests, `scripts/` and `vite.config.ts`.
`tsx` executes TypeScript but does not replace compiler checks.

Run `npm ci`, `npm run check:typescript-source`, `npm run typecheck`, `npm test`,
and `npm run build` from the repository root. Build blocks on all three gates.
The source guard compares tracked plus nonignored untracked files with compiler
programs, rejects authored JS and orphan TS, and excludes generated `dist/`,
dependencies, coverage and browser-test outputs. No first-party tests or tools
are exempt, and there are no external JavaScript fixtures.

When renaming `project-name/` in a consumer, update both tsconfig include lists,
npm test paths, Vite root, documentation, workflows and ignore rules together.
Browser automation must be headless/no-window. If a required capability needs
a headed browser, launch it minimized without taking focus; never open a normal
foreground test window on the user's desktop.

## Required language for every template use

Every use of this template, including local copies, generated repositories, apps, games and later updates, MUST use strict TypeScript for all authored source, tests, executable configuration and tooling. Human contributors and AI agents must preserve this policy. Generated JavaScript output, third-party dependencies and native shell scripts remain permitted; do not replace authored TypeScript with JavaScript or weaken compiler/source-coverage gates.
