const { spawnSync } = require('child_process');

const remoteCommand = process.argv.slice(2).join(' ');
if (!remoteCommand) {
  console.error('Usage: node scripts/ssh_runner.js "<remote_command>"');
  process.exit(1);
}

const vpsHost = process.env.VPS_HOST || 'srv1814872.hstgr.cloud';
const vpsUser = process.env.VPS_USER || 'root';
const vpsPort = process.env.VPS_PORT || '2222';

const res = spawnSync('ssh', [
  '-o', 'BatchMode=yes',
  '-p', vpsPort,
  `${vpsUser}@${vpsHost}`,
  remoteCommand
], {
  encoding: 'utf8',
  maxBuffer: 20 * 1024 * 1024
});

if (res.stdout) process.stdout.write(res.stdout);
if (res.stderr) process.stderr.write(res.stderr);
process.exit(res.status ?? 0);
