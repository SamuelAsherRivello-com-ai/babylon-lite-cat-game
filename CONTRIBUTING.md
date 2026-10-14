# Contributing

Thank you for improving this project.

## Before changing code

Review `README.md`, `AGENTS.md`, and the project's actual configuration first.
For the baseline, the repository root holds the npm dependencies and project
commands; application files live in `cat-hangout/`. Keep repository metadata
at the root.

For a substantial feature or behavior change that requires OpenSpec, use the
available global skills in this order: Explore, Propose, optional Update, then
Apply. Do not install or generate repository-local OpenSpec skills. If the
needed global skills are unavailable, ask the user before using another
workflow. Keep proposals, design decisions, tasks, implementation, and
verification evidence consistent with one another.

## Quality expectations

- Keep changes scoped to the stated outcome.
- Run the relevant automated checks and record manual verification when needed.
- Verify browser-visible changes in a real browser or runtime.
- Update README commands, screenshots, and release instructions only from
  verified project behavior.
- Do not commit generated output, local configuration, credentials, recovery
  material, or other secrets.

## Pull requests

Describe the user-visible outcome, the checks performed, any manual evidence,
documentation changes, and an OpenSpec change identifier when the workflow
produces one. Call out new dependencies, configuration changes, and release
implications.
