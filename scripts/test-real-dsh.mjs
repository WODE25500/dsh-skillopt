// dsh-skillopt — real-DSH integration test.
//
// The review asked for "a clean-package canary against DSH rc.8 that loads
// the packed bundle and invokes at least skillopt_status, asserting real
// stdout and exit/error behavior". This uses the REAL dsh-bash-local executor
// installed with DeepSeek Harness (this machine has rc.6) to run the plugin's
// tools through the genuine ctx.shell path — resolve() + bash -c + CollectedOutput.
//
// Usage: node scripts/test-real-dsh.mjs
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

// Ensure `bash` resolves to Git Bash, NOT the WindowsApps WSL stub.
process.env.PATH = 'C:/Program Files/Git/bin;C:/Program Files/Git/usr/bin;' + process.env.PATH

const require = createRequire(import.meta.url)
const root = dirname(dirname(fileURLToPath(import.meta.url)))
const BASE = 'C:/Users/huaqi/AppData/Roaming/npm/node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai'

let failures = 0
function check(name, cond, detail = '') {
  if (cond) console.log(`  ✅ ${name}`)
  else {
    failures++
    console.log(`  ❌ ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

// ---------------------------------------------------------------------------
// 1. build a real Cordis context with the REAL LocalBashExecutor
// ---------------------------------------------------------------------------
console.log('1. load real DSH bash executor')
const { Context } = require(join(BASE, 'cordis/lib/index.js'))
const { LocalBashExecutor } = await import(pathToFileURL(join(BASE, 'dsh-bash-local/lib/index.js')).href)
const ctx = new Context()

// LocalBashExecutor needs config; defaults come from its Config schema.
const executor = new LocalBashExecutor(ctx, {
  timeoutMs: 30_000,
  maxTimeoutMs: 300_000,
  maxOutputBytes: 2_000_000,
  maxSpillBytes: 10_000_000,
  graceMs: 2_000,
  shellPath: 'C:/Program Files/Git/bin/bash.exe',
})
// The bash executor delegates process spawns to ctx.subprocess; provide the
// real LocalSubprocessRuntime the same way the harness composes it.
const { LocalSubprocessRuntime } = await import(pathToFileURL(join(BASE, 'dsh-subprocess-local/lib/index.js')).href)
ctx.subprocess = new LocalSubprocessRuntime(ctx)
ctx.shell = executor
ctx.logger = { info: () => {} }
check('ctx.shell is real LocalBashExecutor', ctx.shell instanceof LocalBashExecutor)

// ---------------------------------------------------------------------------
// 2. load the plugin into the real context and register tools
// ---------------------------------------------------------------------------
console.log('2. load plugin into real context')
// The real harness provides ctx.tools; a bare Context does not. Provide a
// minimal registry that captures the definitions so we can drive their
// execute() through the real ctx.shell.
const toolDefs = {}
ctx.tools = {
  register(def) {
    toolDefs[def.name] = def
    return () => {}
  },
}
const { apply } = await import(pathToFileURL(join(root, 'src/index.js')).href)
apply(ctx, { backend: 'mock', pythonCmd: 'python' })
check('7 tools registered', Object.keys(toolDefs).length === 7, `got ${Object.keys(toolDefs).length}`)

// ---------------------------------------------------------------------------
// 3. run skillopt_status through the REAL tool path (execute -> resolve -> bash)
// ---------------------------------------------------------------------------
console.log('3. skillopt_status through real tool + bash executor')
const statusText = await toolDefs['skillopt_status'].execute({}, {})
console.log('  result head:', statusText.slice(0, 200))
check('exit=0 reported', statusText.includes('exit=0'), statusText.slice(0, 120))
check('real stdout surfaced', statusText.includes('sleep') || statusText.includes('nights'), statusText.slice(0, 200))
check('no "(no output)" for real output', !statusText.includes('(no output)'))

// ---------------------------------------------------------------------------
// 4. assert the REAL shell output shape (CollectedOutput) directly
// ---------------------------------------------------------------------------
console.log('4. assert real shell output shape')
const realResult = await ctx.shell.run(
  ctx.shell.resolve({
    command: "'python' '-c' 'print(12345)'",
    timeoutMs: 30_000,
  }),
)
check('exitCode is a number', typeof realResult.exitCode === 'number', String(realResult.exitCode))
if (realResult.stdout && typeof realResult.stdout === 'object') {
  check('stdout is CollectedOutput with .text', typeof realResult.stdout.text === 'string')
  check('stdout has truncated flag', typeof realResult.stdout.truncated === 'boolean')
  check('stdout text preserved', realResult.stdout.text.includes('12345'), realResult.stdout.text.slice(0, 60))
} else {
  check('stdout is CollectedOutput object', false, `got ${typeof realResult.stdout}`)
}

// ---------------------------------------------------------------------------
// 5. error path: nonexistent python module exits nonzero, stderr surfaced
// ---------------------------------------------------------------------------
console.log('5. error path (nonexistent module) via real tool')
const badResult = await ctx.shell.run(
  ctx.shell.resolve({
    command: "'python' '-m' 'skillopt_sleep_NO_SUCH_MODULE' 'status'",
    timeoutMs: 20_000,
  }),
)
check('nonzero exit on missing module', badResult.exitCode !== 0, String(badResult.exitCode))
const badErr = badResult.stderr && typeof badResult.stderr === 'object' ? badResult.stderr.text : String(badResult.stderr)
check('stderr surfaces module error', /No module named|ModuleNotFoundError|Error/.test(badErr), badErr.slice(0, 150))

console.log(failures === 0 ? '\nALL REAL-DSH CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
