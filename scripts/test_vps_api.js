const { spawnSync } = require('child_process');

const testScript = `
import urllib.request
import json
import time

req = urllib.request.Request(
    'http://127.0.0.1:4080/api/v1/downloads',
    data=json.dumps({
        'url': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'quality': '360p',
        'format': 'mp4'
    }).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
try:
    with urllib.request.urlopen(req, timeout=30) as res:
        print("POST DOWNLOADS STATUS:", res.status)
        resp_data = json.loads(res.read().decode('utf-8'))
        print("DOWNLOAD JOB:", resp_data)
        job_id = resp_data.get('id')
        
        # Poll status for 15 seconds
        for _ in range(15):
            time.sleep(2)
            poll_req = urllib.request.Request(f'http://127.0.0.1:4080/api/v1/downloads/{job_id}')
            with urllib.request.urlopen(poll_req, timeout=10) as poll_res:
                job = json.loads(poll_res.read().decode('utf-8'))
                print("POLL STATUS:", job.get('status'), f"progress: {job.get('progress')}%", f"file: {job.get('fileName')}")
                if job.get('status') in ['COMPLETED', 'FAILED']:
                    break
except Exception as e:
    print("ERROR:", e)
    if hasattr(e, 'read'):
        print(e.read().decode('utf-8'))
`;

const vpsHost = process.env.VPS_HOST || 'srv1814872.hstgr.cloud';
const vpsUser = process.env.VPS_USER || 'root';
const vpsPort = process.env.VPS_PORT || '2222';

const res = spawnSync('ssh', [
  '-o', 'BatchMode=yes',
  '-p', vpsPort,
  `${vpsUser}@${vpsHost}`,
  'python3'
], {
  input: testScript,
  encoding: 'utf8'
});

if (res.stdout) console.log(res.stdout);
if (res.stderr) console.error(res.stderr);
