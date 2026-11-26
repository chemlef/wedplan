// Syntax-checks every JavaScript file (no dependencies needed): `npm run check`
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const files = [];
const walk = (d) => readdirSync(d).forEach((f) => {
  const p = join(d, f);
  if (statSync(p).isDirectory()) { if (!['node_modules', '.git', 'data'].includes(f)) walk(p); } else if (p.endsWith('.js')) files.push(p);
});
['api', 'lib', 'public', 'scripts'].forEach(walk);
files.push('server.js');
let failed = 0;
for (const f of files) {
  try { execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' }); } catch (e) { failed++; console.error(`✗ ${f}\n${e.stderr}`); }
}
console.log(failed ? `${failed} file(s) failed` : `✓ ${files.length} files OK`);
process.exit(failed ? 1 : 0);
