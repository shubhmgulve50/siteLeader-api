# CLAUDE.md — Project Intelligence Hub

This file is the single source of truth for Claude Code in this project.
It lists every README path that must be kept in sync with the actual code.
Whenever code, logic, or flow changes — update the relevant README(s) listed below **in the same operation**.

---

## Project type

**Framework:** `nodejs`
**Package manager:** `npm`

---

## README registry

All READMEs live in the `readme/` directory at the project root.
These files focus on system-wide patterns and end-to-end flows rather than individual directory logic.

### Core Documentation

| Path | Covers |
|---|---|
| `AGENTS.md` | Agent registry and deployment info |
| `PROJECT_STRUCTURE.md` | Project structure for this framework |
| `README.md` | General project overview |
| `readme/ARCHITECTURE.md` | High-level system architecture and data flow |
| `readme/FLOWS.md` | End-to-end feature flows and data pathways |
| `readme/UI.md` | REST API surface — routes, request/response shapes |
| `readme/THEMING.md` | N/A for backend — reserved for future use |
| `readme/METHODS.md` | Shared utility methods and helpers reference |
| `readme/AUTH_AND_ROUTING.md` | JWT auth, role middleware, builder scope, RBAC |
| `readme/API_INTEGRATION.md` | Multi-tenant scoping, route organisation, validation |
| `readme/FILE_UPLOAD_AND_S3.md` | Multer → S3 upload pipeline and presigned URL flow |
| `readme/DEPLOYMENT.md` | Lambda handler, GitHub Actions CI/CD, serverless deploy |

---

## Sync rules for Claude

1. **Before editing any file** — read the relevant flow-specific README in the `readme/` directory (e.g., `readme/FLOWS.md` for logic changes).
2. **After editing any file** — update the relevant flow-specific README in the `readme/` directory to reflect the change.
3. **After adding a new feature or flow** — update `readme/FLOWS.md` or create a new flow-specific document in `readme/` and register it above.
4. **After changing an end-to-end flow** — update `readme/FLOWS.md`.
5. **Never leave a README out of date** — a stale README is treated as a bug.
6. **No per-directory READMEs** — do not create `README.md` files in inner folders or for individual modules. Documentation must focus on flows and patterns in `readme/`.

---

## Skills

See `.claude/skills/` for reusable task instructions.

| Skill file | Purpose |
|---|---|
| `.claude/skills/new-feature.md` | How to scaffold a new feature |
| `.claude/skills/pr-workflow.md` | Branch → commit → PR steps |
| `.claude/skills/readme-sync.md` | README update checklist |
| `.claude/skills/code-review.md` | PR review with risk scoring |
| `.claude/skills/ticket.md` | Creating and linking GitHub issues |

---

## Rules reference

All standing instructions live in `.claude/RULES.md`.
Read it at the start of every session.
