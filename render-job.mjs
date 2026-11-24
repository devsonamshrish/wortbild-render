// Reads job.json {entry, composition, flags[]} and renders it to out.mp4 with software GL on the 4-core runner.
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const job = JSON.parse(readFileSync('job.json', 'utf8'));
const args = ['remotion', 'render', job.entry, job.composition, 'out.mp4', ...job.flags, '--gl=swangle', '--concurrency=4'];
console.log('npx', args.join(' '));
const r = spawnSync('npx', args, { stdio: 'inherit' });
process.exit(r.status ?? 1);
