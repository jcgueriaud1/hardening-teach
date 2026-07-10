# Notes

Working notes and user preferences for this teaching workspace.

## What I know so far
- User works on Vaadin (email @vaadin.com). Mission is both a *knowledge* goal
  (understand harnesses deeply) and a *product/DX* goal (make Vaadin agent-ready).
- Dogfooding: building a real Vaadin app with Claude Code, saving traces to Arize Phoenix.
- Chose goals 1+4 in the mission interview: "Understand harnesses deeply" AND
  "Make Vaadin agent-ready".

## Confirmed
- App is **Vaadin Flow (Java)**, not Hilla → emphasize Flow pain points (Grid, Binder, Lumo/Aura).
- Phoenix traces come from **Claude Code itself** (the agent's own loop), not an app-embedded LLM SDK.

## To confirm next session
- Exact experience level with agent internals (assumed "fuzzy on mechanics, wants depth").
- The exact Claude Code → Phoenix wiring (native OTel + collector? a proxy emitting OpenInference spans?)
  — determines whether they see a real span tree or flat telemetry. (Researching now.)
- Whether they want to join a community (see RESOURCES.md Wisdom section).

## Teaching preferences observed
- Terse replier; prefers to move fast. Keep questions few and high-leverage.
- The interactive AskUserQuestion tool was failing in this environment early on;
  fall back to plain-text questions if it errors again.

## Conventions for this workspace
- Every lesson & reference doc links `assets/course.css`.
- Cite sources inline (superscript) and list them at the foot of each lesson.
- Glossary is canonical (see `reference/glossary.html` once created) — reuse its terms.
