# dsh-skillopt

**Microsoft SkillOpt-Sleep 的 DeepSeek Harness (dsh) 插件** —— 让你的 dsh 智能体拥有"睡眠循环"：
回顾过去的会话、挖掘重复任务、用你自己的 API 预算重放、并在留出验证门之后把学到的内容沉淀为
受验证的技能/记忆。合成 SkillOpt（验证门控的有界文本编辑）、Claude Dreams（离线记忆整合）
与 agent-sleep（周期性后台把经验变成长期能力）三种思想。**零权重训练**，部署期零额外推理调用。

> 独立社区项目，非官方。引擎本体来自微软 [microsoft/SkillOpt](https://github.com/microsoft/SkillOpt)
> （MIT License），本插件只负责把它的 `skillopt_sleep` CLI 接入 dsh 的工具/技能体系。
> 微软官方已提供 Claude Code / Codex / Cursor / Copilot / Devin / OpenClaw 集成，本插件是
> **首个 DeepSeek Harness 集成**。

## 特性

- 7 个原生 dsh 工具：`skillopt_status` / `skillopt_dry_run` / `skillopt_run` /
  `skillopt_adopt` / `skillopt_harvest` / `skillopt_schedule` / `skillopt_unschedule`
- 附带 `SKILL.md` 技能文件，指导 agent 何时、如何使用
- Schemastery 配置（backend / project / preferences / source …）
- bundle patch 层（`cordis.patch.yml`），可一键加入任意 profile
- 默认 `mock` 后端零 API 花费，可先验证链路
- 严格的数据边界：harvest 只读、`mock`/`handoff` 零网络、adopt 前先备份

## 前置要求

- DeepSeek Harness（dsh）已安装
- Python 3.10+ 与 SkillOpt-Sleep 引擎：

```bash
pip install skillopt          # 或克隆 https://github.com/microsoft/SkillOpt 源码
```

## 安装

### 方式一：作为 bundle 加入 profile

把 `dsh-skillopt` 加入 profile 的 bundles，或在 profile 的 `cordis.patch.yml` 中：

```yaml
- insert:
    - id: skillopt
      name: './src/index.js'
      config:
        backend: mock          # 或 codex / claude / cursor …
        project: /path/to/project
        preferences: 'Always use async/await'
```

### 方式二：本地 patch 临时加载（开发时）

```bash
# 在 dsh 仓库检出根目录，用 patch 覆盖加载
pnpm dsh web --patch ./dsh-skillopt/cordis.patch.yml
```

启动后向 agent 提问："用 skillopt_status 看一下睡眠循环状态"。

## 用法

| 工具 | 行为 |
|---|---|
| `skillopt_status` | 状态、引擎可用性、最新暂存提案与报告 |
| `skillopt_dry_run` | 完整预览（harvest+mine+replay），不暂存 |
| `skillopt_run` | 完整循环并暂存提案（不改变线上文件） |
| `skillopt_adopt` | 应用最新暂存提案（先备份）——线上变更边界 |
| `skillopt_harvest` | 只读查看/导出挖掘出的任务 |
| `skillopt_schedule` / `skillopt_unschedule` | 安装/移除夜间 cron 条目 |

典型流程：

```text
skillopt_status
skillopt_dry_run project=<dir> source=<claude|codex|…>
skillopt_run project=<dir> backend=<codex|claude|…> preferences="…"
# 审阅报告后：
skillopt_adopt project=<dir>
# 或定时：
skillopt_schedule project=<dir> hour=3 minute=17 backend=<codex>
```

## 配置项（Schemastery）

| 键 | 默认 | 说明 |
|---|---|---|
| `pythonCmd` | `python` | 运行引擎的 Python 解释器 |
| `module` | `skillopt_sleep` | 引擎 Python 模块 |
| `project` | — | 默认项目目录 |
| `backend` | — | `mock\|claude\|codex\|copilot\|cursor\|pi\|opencode\|handoff\|azure_openai` |
| `source` | — | `claude\|codex\|copilot\|cursor\|pi\|opencode\|auto` |
| `model` | — | 后端模型覆盖 |
| `maxTasks` / `maxSessions` | — | 挖掘/收获上限 |
| `editBudget` | — | 每周期有界编辑数上限 |
| `preferences` | — | 反思先验"家规" |
| `jsonOutput` | `false` | 机器可读 JSON 输出 |

高级引擎配置（`gate_mode`、`gate_metric`、`gate_no_regression`、`dream_rollouts`、
`recall_k`、`evolve_memory`/`evolve_skill`）放 `~/.skillopt-sleep/config.json`。

## 数据边界与安全

- Harvest 只读；`mock`/`handoff` 后端不联网。
- `run` 只暂存提案；`adopt` 是正常的线上变更边界，且先备份。
- 真实后端会把截断的会话摘录与派生任务发给所选提供方。敏感会话请先导出任务文件、
  人工审查脱敏（置 `"reviewed": true`）再重放；真实后端拒绝未审阅的任务文件。
- 出站提示词目前不保证完全无密文，请先审阅会话来源与提供方留存政策。

## 验证（无 API 花费）

```bash
pip install skillopt
python -m skillopt_sleep.experiments.run_experiment --persona researcher --assert-improves
```

## 目录结构

```
dsh-skillopt/
  src/index.js            # 插件入口：7 个工具 + Schemastery 配置
  skills/skillopt-sleep/SKILL.md
  scripts/sleep.py        # 引擎引导/自检脚本
  docs/                   # 中文与英文文档
  cordis.patch.yml        # bundle patch 层
```

## 许可

MIT。引擎本体版权归微软 SkillOpt 项目（MIT）。
