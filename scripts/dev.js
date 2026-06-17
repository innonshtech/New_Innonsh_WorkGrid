#!/usr/bin/env node
'use strict';

const path = require('path');
const { spawn } = require('child_process');

function parseArgs(argv) {
  const args = {
    passThrough: [],
    port: undefined,
    hostname: undefined,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--port' || arg === '-p') {
      args.port = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg.startsWith('--port=')) {
      args.port = arg.slice('--port='.length);
      continue;
    }
    if (arg === '--hostname' || arg === '-H') {
      args.hostname = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg.startsWith('--hostname=')) {
      args.hostname = arg.slice('--hostname='.length);
      continue;
    }

    args.passThrough.push(arg);
  }

  return args;
}

function checkIpcSupport() {
  return new Promise((resolve) => {
    let child;
    try {
      child = spawn(process.execPath, ['-e', 'process.exit(0)'], {
        stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
      });
    } catch (_) {
      resolve(false);
      return;
    }

    const finish = (ok) => resolve(ok);
    child.once('error', () => finish(false));
    child.once('exit', (code) => finish(code === 0));
  });
}

async function runNextDev(args) {
  const nextBin = path.join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');
  const child = spawn(process.execPath, [nextBin, 'dev', ...args], { stdio: 'inherit' });

  child.once('exit', (code) => {
    process.exitCode = code ?? 1;
  });
  child.once('error', (err) => {
    console.error(err);
    process.exitCode = 1;
  });
}

async function runDevSingleProcess({ port, hostname }) {
  process.env.NODE_ENV = process.env.NODE_ENV || 'development';
  process.env.__NEXT_DEV_SERVER = process.env.__NEXT_DEV_SERVER || '1';
  delete process.env.NEXT_PRIVATE_WORKER;

  const { startServer } = require('next/dist/server/lib/start-server');
  const resolvedPort = Number(port || process.env.PORT || 3000);
  if (!Number.isFinite(resolvedPort) || resolvedPort <= 0) {
    throw new Error(`Invalid port: ${port}`);
  }

  if (hostname) process.env.HOSTNAME = hostname;
  await startServer({
    dir: process.cwd(),
    port: resolvedPort,
    allowRetry: true,
    isDev: true,
    hostname: hostname || undefined,
    minimalMode: false,
    keepAliveTimeout: undefined,
    selfSignedCertificate: undefined,
    serverFastRefresh: undefined,
    quiet: false,
  });
}

async function main() {
  const argv = process.argv.slice(2);
  const parsed = parseArgs(argv);

  const ipcOk = await checkIpcSupport();
  if (ipcOk) {
    await runNextDev(argv);
    return;
  }

  console.warn(
    [
      'Note: IPC process spawning is blocked in this environment.',
      'Falling back to a single-process Next dev server (no fork()).',
    ].join(' ')
  );
  await runDevSingleProcess({ port: parsed.port, hostname: parsed.hostname });
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
