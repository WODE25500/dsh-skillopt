# dsh-skillopt

**Microsoft SkillOpt-Sleep integration for DeepSeek Harness (dsh)** — give your
dsh agent a *sleep cycle*: review past sessions, mine recurring tasks, replay
them on your own API budget, and consolidate what it learns into **validated**
skills/memory behind a held-out gate. Synthesizes SkillOpt (validation-gated
bounded text edits), Claude Dreams (offline consolidation), and agent-sleep
(periodic background replay). **No weight training**, zero extra inference cost
at deployment.

> Independent community project, not official. The engine comes from Microsoft's
> [microsoft/SkillOpt](https://github.com/microsoft/SkillOpt) (MIT License); this
> plugin only wires its `skillopt_sleep` CLI into dsh's tool/skill system.
> Microsoft ships integrations for Claude Code / Codex / Cursor / Copilot /
> Devin / OpenClaw — this is the **first DeepSeek Harness integration**.

## Features

- 7 native dsh tools: `skillopt_status` / `skillopt_dry_run` / `skillopt_run` /
  `skillopt_adopt` / `skillopt_harvest` / `skillopt_schedule` / `skillopt_unschedule`
- Bundled `SKILL.md` teaching the agent when and how to use them
- Schemastery config (backend / project / preferences / source …)
- Bundle patch layer (`cordis.patch.yml`) — drop into any profile
- Default `mock` backend = zero API spend for plumbing checks
- Strict data boundary: read-only harvest, `mock`/`handoff` no-network, adopt backs up first

## Prerequisites

- DeepSeek Harness (dsh) installed
- Python 3.10+ with the SkillOpt-Sleep engine:

```bash
pip install skillopt          # or clone https://github.com/microsoft/SkillOpt
```

## Install

### As a bundle in a profile

Add `dsh-skillopt` to the profile's bundles, or in the profile `cordis.patch.yml`:

```yaml
- insert:
    - id: skillopt
      name: './src/index.js'
      config:
        backend: mock          # or codex / claude / cursor …
        project: /path/to/project
        preferences: 'Always use async/await'
```

### Local patch overlay (dev)

```bash
pnpm dsh web --patch ./dsh-skillopt/cordis.patch.yml
```

Then ask the agent: "Use skillopt_status to check the sleep cycle state."

## Usage

| Tool | Behavior |
|---|---|
| `skillopt_status` | state, engine availability, latest staged proposal & report |
| `skillopt_dry_run` | full preview (harvest+mine+replay), stages nothing |
| `skillopt_run` | full cycle, stages a proposal (live files unchanged) |
| `skillopt_adopt` | apply latest staged proposal (with backup) — the live-change boundary |
| `skillopt_harvest` | read-only show/export of mined tasks |
| `skillopt_schedule` / `skillopt_unschedule` | install/remove the nightly cron entry |

Typical flow:

```text
skillopt_status
skillopt_dry_run project=<dir> source=<claude|codex|…>
skillopt_run project=<dir> backend=<codex|claude|…> preferences="…"
# review the report, then:
skillopt_adopt project=<dir>
# or schedule:
skillopt_schedule project=<dir> hour=3 minute=17 backend=<codex>
```

## Config (Schemastery)

| Key | Default | Purpose |
|---|---|---|
| `pythonCmd` | `python` | Python interpreter for the engine |
| `module` | `skillopt_sleep` | engine Python module |
| `project` | — | default project directory |
| `backend` | — | `mock\|claude\|codex\|copilot\|cursor\|pi\|opencode\|handoff\|azure_openai` |
| `source` | — | `claude\|codex\|copilot\|cursor\|pi\|opencode\|auto` |
| `model` | — | backend model override |
| `maxTasks` / `maxSessions` | — | mine/harvest caps |
| `editBudget` | — | bounded edits per cycle |
| `preferences` | — | house rules for the reflection prior |
| `jsonOutput` | `false` | machine-readable JSON output |

Advanced engine keys (`gate_mode`, `gate_metric`, `gate_no_regression`,
`dream_rollouts`, `recall_k`, `evolve_memory`/`evolve_skill`) go in
`~/.skillopt-sleep/config.json`.

## Data boundary & safety

- Harvest is read-only; `mock`/`handoff` make no network calls.
- `run` stages proposals; `adopt` is the normal live-change boundary and backs up first.
- Real backends send truncated transcript excerpts and derived tasks to the
  selected provider. For sensitive sessions, export tasks first, redact, set
  `"reviewed": true`, then replay — real backends refuse unreviewed task files.
- Outbound prompts are not guaranteed secret-free; review source & provider policy.

## Validate (no API spend)

```bash
pip install skillopt
python -m skillopt_sleep.experiments.run_experiment --persona researcher --assert-improves
```

## Layout

```
dsh-skillopt/
  src/index.js            # plugin entry: 7 tools + Schemastery config
  skills/skillopt-sleep/SKILL.md
  scripts/sleep.py        # engine bootstrap / self-check
  docs/                   # Chinese & English docs
  cordis.patch.yml        # bundle patch layer
```

## License

MIT. Engine copyright Microsoft SkillOpt (MIT).
