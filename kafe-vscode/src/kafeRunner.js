const { spawn } = require('node:child_process');
const { StringDecoder } = require('node:string_decoder');

const MAX_EVIDENCE_BYTES = 1024 * 1024;

function startKafeFile({ filePath, runtimeRoot, runtimeMode, uvPath, env, spawnProcess = spawn,
  onStdout = () => {}, onStderr = () => {} }) {
  if (runtimeMode !== 'contributor' && runtimeMode !== 'managed') {
    throw new Error('Invalid KAFE runtime mode.');
  }
  const args = ['run', '--locked'];
  if (runtimeMode === 'managed') args.push('--no-dev');
  args.push('python', 'src/Kafe.py', filePath);
  const spawnOptions = { cwd: runtimeRoot, shell: false, stdio: ['pipe', 'pipe', 'pipe'] };
  if (env) spawnOptions.env = { ...process.env, ...env };
  const child = spawnProcess(uvPath, args, spawnOptions);
  const evidence = { stdout: [], stderr: [] };
  let retainedBytes = 0;
  let outputTruncated = false;
  let finished = false;
  let cancelled = false;
  let inputClosed = false;
  const decoders = { stdout: new StringDecoder('utf8'), stderr: new StringDecoder('utf8') };
  let finish;
  const completion = new Promise(resolve => { finish = resolve; });

  function retain(channel, chunk) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    const room = MAX_EVIDENCE_BYTES - retainedBytes;
    if (room > 0) {
      const kept = buffer.subarray(0, room);
      evidence[channel].push(kept);
      retainedBytes += kept.length;
    }
    if (buffer.length > room) outputTruncated = true;
    const rendered = decoders[channel].write(buffer);
    if (rendered) (channel === 'stdout' ? onStdout : onStderr)(rendered);
  }

  child.stdout.on('data', chunk => retain('stdout', chunk));
  child.stderr.on('data', chunk => retain('stderr', chunk));
  function handleInputError(error) {
    if (inputClosed) return;
    inputClosed = true;
    if (!finished) retain('stderr', Buffer.from(`KAFE input is unavailable: ${error.message}\n`));
  }
  child.stdin.on('error', handleInputError);
  function settle(exitCode) {
    if (finished) return;
    finished = true;
    for (const channel of ['stdout', 'stderr']) {
      const tail = decoders[channel].end();
      if (tail) (channel === 'stdout' ? onStdout : onStderr)(tail);
    }
    finish({
      stdout: Buffer.concat(evidence.stdout).toString('utf8'),
      stderr: Buffer.concat(evidence.stderr).toString('utf8'),
      exitCode: typeof exitCode === 'number' ? exitCode : null,
      outputTruncated,
    });
  }
  child.on('error', error => {
    retain('stderr', Buffer.from(`Unable to launch KAFE: ${error.message}\n`));
    settle(null);
  });
  child.on('close', settle);

  return {
    completion,
    sendInput(text) {
      if (!finished && !cancelled && !inputClosed && child.stdin.writable !== false) {
        try {
          child.stdin.write(text);
        } catch (error) {
          handleInputError(error);
        }
      }
    },
    cancel() {
      if (finished || cancelled) return;
      cancelled = true;
      child.kill('SIGTERM');
    },
  };
}

module.exports = { startKafeFile, MAX_EVIDENCE_BYTES };
