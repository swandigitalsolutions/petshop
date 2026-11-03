// Builds the static Vercel demo: storefront at / and admin portal at /admin/,
// both running the in-browser demo backend (no database needed).
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const run = (cmd, cwd, env = {}) => execSync(cmd, { cwd: path.join(root, cwd), stdio: 'inherit', env: { ...process.env, ...env } });

run('npm run build', 'client', { VITE_DEMO: 'true' });
run('npm run build', 'admin', { VITE_DEMO: 'true', ADMIN_BASE: '/admin/' });

const out = path.join(root, 'dist');
fs.rmSync(out, { recursive: true, force: true });
fs.cpSync(path.join(root, 'client', 'dist'), out, { recursive: true });
fs.cpSync(path.join(root, 'admin', 'dist', 'admin'), path.join(out, 'admin'), { recursive: true });
console.log('\nDemo built in ./dist  (store: /   admin: /admin)');
