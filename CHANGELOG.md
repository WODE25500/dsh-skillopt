# Changelog

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
