import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

if (existsSync('.git')) {
  execFileSync('npx', ['husky'], {
    shell: process.platform === 'win32',
    stdio: 'inherit',
  });
}
