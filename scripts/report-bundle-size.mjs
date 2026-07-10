import { gzipSync } from 'node:zlib';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const trackedExtensions = new Set(['.css', '.html', '.js', '.json']);

async function main() {
  const entries = await collectFiles(distDir);
  const reportRows = [];

  for (const filePath of entries) {
    const extension = path.extname(filePath);

    if (!trackedExtensions.has(extension)) {
      continue;
    }

    const content = await readFile(filePath);
    const relativePath = path.relative(distDir, filePath).replaceAll(path.sep, '/');

    reportRows.push({
      gzipBytes: gzipSync(content).byteLength,
      path: relativePath,
      rawBytes: content.byteLength,
    });
  }

  reportRows.sort((first, second) => second.rawBytes - first.rawBytes);

  if (reportRows.length === 0) {
    throw new Error('No bundle files found in dist. Run npm run build first.');
  }

  const totalRawBytes = reportRows.reduce((sum, row) => sum + row.rawBytes, 0);
  const totalGzipBytes = reportRows.reduce((sum, row) => sum + row.gzipBytes, 0);

  console.log('Bundle size report');
  console.log('==================');
  console.log(`Total raw:  ${formatBytes(totalRawBytes)}`);
  console.log(`Total gzip: ${formatBytes(totalGzipBytes)}`);
  console.log('');
  console.log(`${padRight('File', 34)} ${padLeft('Raw', 10)} ${padLeft('Gzip', 10)}`);
  console.log(`${'-'.repeat(34)} ${'-'.repeat(10)} ${'-'.repeat(10)}`);

  for (const row of reportRows) {
    console.log(
      `${padRight(row.path, 34)} ${padLeft(formatBytes(row.rawBytes), 10)} ${padLeft(
        formatBytes(row.gzipBytes),
        10,
      )}`,
    );
  }
}

async function collectFiles(directory) {
  const entries = await readdir(directory, {
    withFileTypes: true,
  });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(entryPath)));
      continue;
    }

    if (entry.isFile() && (await stat(entryPath)).size > 0) {
      files.push(entryPath);
    }
  }

  return files;
}

function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  return `${(bytes / 1024).toFixed(2)} kB`;
}

function padLeft(value, width) {
  return value.padStart(width, ' ');
}

function padRight(value, width) {
  if (value.length <= width) {
    return value.padEnd(width, ' ');
  }

  return `${value.slice(0, width - 3)}...`;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
