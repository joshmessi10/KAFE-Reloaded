const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const path = require('node:path');
const test = require('node:test');

function fakeChild() {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.stdin = new EventEmitter();
  child.stdin.writable = true;
  child.stdin.writes = [];
  child.stdin.write = function (value) { this.writes.push(value); return true; };
  child.kills = [];
  child.kill = function (signal) { this.kills.push(signal); return true; };
  return child;
}

test('Run evidence stays within UTF-8 byte budget at multibyte and invalid-byte boundaries', async () => {
  const { startKafeFile, MAX_EVIDENCE_BYTES } = require('../../src/kafeRunner');
  for (const ending of [Buffer.from('界'), Buffer.from([255, 255])]) {
    const child = fakeChild(), run = startKafeFile({ filePath: 'original.kf', runtimeRoot: '.', runtimeMode: 'managed', uvPath: 'uv', spawnProcess: () => child });
    child.stdout.emit('data', Buffer.alloc(MAX_EVIDENCE_BYTES - 1, 'a')); child.stderr.emit('data', ending); child.emit('close', null);
    const result = await run.completion;
    assert.ok(Buffer.byteLength(result.stdout) + Buffer.byteLength(result.stderr) <= MAX_EVIDENCE_BYTES);
    assert.equal(result.outputTruncated, true); assert.equal(result.exitCode, null);
  }
});

test('runner passes tricky absolute file path as one argument, with no shell', async () => {
  const { startKafeFile } = require('../../src/kafeRunner');
  const child = fakeChild();
  const calls = [];
  const filePath = path.resolve("C:/KAFE learner's/ñ $HOME & (draft).kf");
  const run = startKafeFile({
    filePath, runtimeRoot: 'C:/runtime with spaces', runtimeMode: 'contributor', uvPath: 'C:/uv tool/uv.exe',
    spawnProcess: (...args) => { calls.push(args); return child; },
  });
  assert.deepEqual(calls, [['C:/uv tool/uv.exe', ['run', '--locked', 'python', 'src/Kafe.py', filePath],
    { cwd: 'C:/runtime with spaces', shell: false, stdio: ['pipe', 'pipe', 'pipe'] }]]);
  child.emit('close', 7);
  assert.equal((await run.completion).exitCode, 7);
});

test('managed runner adds --no-dev and streams stdout and stderr separately', async () => {
  const { startKafeFile } = require('../../src/kafeRunner');
  const child = fakeChild();
  const stdout = [];
  const stderr = [];
  const calls = [];
  const run = startKafeFile({
    filePath: path.resolve('example.kf'), runtimeRoot: 'C:/managed', runtimeMode: 'managed', uvPath: 'uv',
    spawnProcess: (...args) => { calls.push(args); return child; },
    onStdout: text => stdout.push(text), onStderr: text => stderr.push(text),
  });
  assert.deepEqual(calls[0][1].slice(0, 4), ['run', '--locked', '--no-dev', 'python']);
  child.stdout.emit('data', Buffer.from('hello'));
  child.stderr.emit('data', Buffer.from('error'));
  child.emit('close', 0);
  assert.deepEqual(stdout, ['hello']);
  assert.deepEqual(stderr, ['error']);
  assert.deepEqual(await run.completion, { stdout: 'hello', stderr: 'error', exitCode: 0, outputTruncated: false });
});

test('runner scopes managed uv environment while preserving the no-shell argument-array contract', async () => {
  const { startKafeFile } = require('../../src/kafeRunner');
  const child = fakeChild();
  const calls = [];
  const run = startKafeFile({
    filePath: path.resolve('example.kf'), runtimeRoot: 'C:/managed', runtimeMode: 'managed', uvPath: 'C:/storage/uv.exe',
    env: { UV_PROJECT_ENVIRONMENT: 'C:/storage/python/env', UV_CACHE_DIR: 'C:/storage/cache' },
    spawnProcess: (...args) => { calls.push(args); return child; },
  });
  const [executable, args, options] = calls[0];
  assert.equal(executable, 'C:/storage/uv.exe');
  assert.deepEqual(args.slice(0, 4), ['run', '--locked', '--no-dev', 'python']);
  assert.equal(options.shell, false);
  assert.equal(options.cwd, 'C:/managed');
  assert.equal(options.env.UV_PROJECT_ENVIRONMENT, 'C:/storage/python/env');
  assert.equal(options.env.UV_CACHE_DIR, 'C:/storage/cache');
  child.emit('close', 0);
  await run.completion;
});

test('runner caps combined evidence at 1 MiB and marks truncation while streaming all output', async () => {
  const { startKafeFile } = require('../../src/kafeRunner');
  const child = fakeChild();
  let streamed = 0;
  const run = startKafeFile({
    filePath: path.resolve('example.kf'), runtimeRoot: '.', runtimeMode: 'contributor', uvPath: 'uv',
    spawnProcess: () => child, onStdout: text => { streamed += Buffer.byteLength(text); },
    onStderr: text => { streamed += Buffer.byteLength(text); },
  });
  child.stdout.emit('data', Buffer.alloc(1024 * 1024, 'a'));
  child.stderr.emit('data', Buffer.from('dropped'));
  child.emit('close', null);
  const result = await run.completion;
  assert.equal(Buffer.byteLength(result.stdout) + Buffer.byteLength(result.stderr), 1024 * 1024);
  assert.equal(streamed, 1024 * 1024 + 7);
  assert.equal(result.outputTruncated, true);
  assert.equal(result.exitCode, null);
});

test('runner forwards stdin and cancellation terminates child once', async () => {
  const { startKafeFile } = require('../../src/kafeRunner');
  const child = fakeChild();
  const run = startKafeFile({
    filePath: path.resolve('example.kf'), runtimeRoot: '.', runtimeMode: 'contributor', uvPath: 'uv',
    spawnProcess: () => child,
  });
  run.sendInput('42\n');
  assert.deepEqual(child.stdin.writes, ['42\n']);
  run.cancel();
  run.cancel();
  assert.deepEqual(child.kills, ['SIGTERM']);
  child.emit('close', null);
  assert.equal((await run.completion).exitCode, null);
});

test('runner handles stdin errors during child shutdown and stops forwarding input', async () => {
  const { startKafeFile } = require('../../src/kafeRunner');
  const child = fakeChild();
  const run = startKafeFile({
    filePath: path.resolve('example.kf'), runtimeRoot: '.', runtimeMode: 'contributor', uvPath: 'uv',
    spawnProcess: () => child,
  });
  run.sendInput('before close\n');
  child.stdin.writable = false;
  const error = Object.assign(new Error('broken pipe'), { code: 'EPIPE' });
  assert.doesNotThrow(() => child.stdin.emit('error', error));
  run.sendInput('after close\n');
  assert.deepEqual(child.stdin.writes, ['before close\n']);
  child.emit('close', null);
  const result = await run.completion;
  assert.match(result.stderr, /KAFE input is unavailable: broken pipe/);
});
