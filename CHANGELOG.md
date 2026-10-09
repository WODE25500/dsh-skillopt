# Changelog

## 0.2.1 (2026-10-09)

- Support the dsh 0.2 line: the `@deepseek-ai/dsh-tools` range now covers
  `0.2.0-rc.1`-`<0.3.0` in addition to the previous `0.1.1-rc.2`-`<0.2.0`.
  The tool surface is unchanged (`defineTool` is identical in both lines); the
  packed canary (40 checks) passes against `dsh-tools` 0.2.0-rc.2, the version
  `@deepseek-ai/dsh` 0.2.0-rc.2 ships. `0.2.1-alpha.*` stays out of range: that
  line pairs with a prerelease `cordis`, which the plugin does not claim yet.

## 0.2.0 (2026-08-21)

- Security: per-tool parameter whitelist (undeclared args cannot reach the engine).
- Security: path value-domain guard (shell metacharacters, absolute/traversal output paths rejected).
- Security: schedule clock range guard (hour 0-23, minute 0-59).
- Security: unschedule `--all` is operator-config-only (`unscheduleAll`).
- Security: dependency ranges pinned (schemastery ^3.18.1, cordis ^4.0.1, dsh-tools ^0.1.0-rc.8); peers marked optional via peerDependenciesMeta.
- Canary now loads the actual packed bundle (npm pack + extract), 40 checks.
- Added audit-control-chars.mjs (7 control-char payloads) and portable BASH_PATH support.
- Docs: SKILL.md param name fix (maxTasks), README config table completed, both patch-invocation forms documented (source checkout `pnpm dsh web --patch` and global `dsh web --patch`), English README.zh.md moved to repo root.
- CI: GitHub Actions (canary, quoting + injection audits, engine smoke).

## 0.1.0 (2026-08-19)

- Initial release: dsh-skillopt for DeepSeek Harness.
