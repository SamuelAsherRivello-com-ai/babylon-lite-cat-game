[Overview](overview.md) · [Standardization analysis](standardization-analysis.md) · [Architecture analysis](architecture-analysis.md) · Verification baseline · [Back](overview.md)

# Verification baseline

| # | Check or scenario | Source and scope | State | Result or limitation |
| --- | --- | --- | --- | --- |
| VERI01 | `npm run check:typescript-source` | `package.json`; first-party compiler source coverage. | run | Passed for 38 source files during this delivery. |
| VERI02 | `npm run typecheck` | `package.json`; strict app and Node TypeScript. | run | Passed after recovery-client changes. |
| VERI03 | `npm test` | `package.json`; unit and integration-style Node tests. | run | Passed: 40 tests, including recovery lifecycle states. |
| VERI04 | `npm run build` | `package.json`; coverage, typecheck, tests, Vite production build. | run | Passed before the final recovery-test expansion; rerun is required before public push. |
| VERI05 | GitHub Pages workflow | `.github/workflows/deploy-pages.yml`; clean install through deployed site. | discovered | Must run after the final `main` push. |
| VERI06 | Two independent browser clients with latency/jitter | OpenSpec task 4.3; live server and Pages integration. | not run | Requires stable v0.9.17 server promotion and final Pages deployment. |
