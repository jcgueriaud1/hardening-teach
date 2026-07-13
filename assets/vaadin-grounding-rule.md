<!--
  The intervention for Lesson 6: a grounding rule to raise expense-manager's
  grounded-rate above its 19% baseline. Paste the section below into your
  project's CLAUDE.md (Claude-specific) or AGENTS.md (cross-tool). Keep it near
  the top so it loads as high-signal context every session.

  Why a rule at all: an enabled MCP server does not earn its calls — the agent
  will write from memory unless instructed. This rule compels the doc lookup
  for framework code specifically, mirroring the eval's com.vaadin.flow signal
  (and deliberately NOT for backend/tests, so it doesn't add useless lookups).
-->

## Vaadin: ground before you build

Before writing or modifying any code that uses the **Vaadin Flow framework**
(anything importing `com.vaadin.flow.*` — views, layouts, components, routing,
data binding, theming), you **must first consult the official Vaadin docs**
via the Vaadin MCP server:

1. Call `search_vaadin_docs` for the component or API you intend to use.
2. If the exact API is unclear, call `get_full_document` for that page.
3. Only then write the code, using the real, version-correct API.

Do **not** write Vaadin Flow code from memory — the API changes across versions,
and hallucinated classes/methods are the most common failure mode. Prefer real
Vaadin components over hand-rolled HTML: use `Button`, `Grid`, `FormLayout`,
`Binder`, `VerticalLayout`, etc., not raw `<div>`/`<button>`.

**Applies to:** new views, component usage, layouts, theming (Lumo/Aura), form
and data binding with `Binder`.
**Does not apply to:** backend services, JPA entities, plain unit tests, and
configuration — no Vaadin API, no lookup needed.

<!--
  Stronger alternative / complement: install Vaadin's official plugin, which
  ships framework-aware skills that auto-activate and bundle the MCP server:
      /plugin marketplace add vaadin/agent-marketplace
      /plugin install vaadin-skills@vaadin-marketplace
  (Targets Vaadin 25; needs Claude Code >= 1.0.33.)

  Then re-measure: run comparable Vaadin tasks, re-run grounding_eval.ts, and
  compare the grounded-rate to the 19% baseline (learning-record 0009).
-->
