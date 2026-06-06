const { spawn } = require('child_process');
const fs = require('fs/promises');
const path = require('path');

const root = path.resolve(__dirname, '..');
const exportDir = path.join(root, '.next', 'export');
const prismaCli = path.join(root, 'node_modules', 'prisma', 'build', 'index.js');
const nextCli = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next');

function run(command, args) {
  return new Promise((resolve) => {
    let output = '';
    const child = spawn(command, args, {
      cwd: root,
      shell: false,
      env: process.env,
    });

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      output += text;
      process.stdout.write(text);
    });

    child.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      output += text;
      process.stderr.write(text);
    });

    child.on('close', (code) => resolve({ code, output }));
  });
}

async function removeExportDir() {
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    try {
      await fs.rm(exportDir, { recursive: true, force: true });
      return true;
    } catch (error) {
      if (attempt === 6) return false;
      await new Promise((resolve) => setTimeout(resolve, attempt * 250));
    }
  }
  return false;
}

function isLockedExportCleanup(output) {
  return (
    output.includes('EBUSY') &&
    output.includes('.next') &&
    output.includes('export') &&
    output.includes('Compiled successfully') &&
    output.includes('Generating static pages')
  );
}

async function main() {
  const prisma = await run(process.execPath, [prismaCli, 'generate']);
  if (prisma.code !== 0) process.exit(prisma.code || 1);

  await removeExportDir();

  const next = await run(process.execPath, [nextCli, 'build']);
  if (next.code === 0) {
    await removeExportDir();
    return;
  }

  if (isLockedExportCleanup(next.output)) {
    const removed = await removeExportDir();
    if (removed) {
      console.warn('\nWindows locked .next/export during final cleanup; build artifacts were generated and the stale export folder was removed.');
      return;
    }
  }

  process.exit(next.code || 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
