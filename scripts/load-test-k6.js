// scripts/load-test-k6.js - High-Concurrency Load Test (500 Virtual Users)
// Simulates concurrent video discovery, telemetry polling, and rate-limit compliance

export const options = {
  stages: [
    { duration: '10s', target: 50 },   // Ramp-up to 50 users
    { duration: '30s', target: 250 },  // Scale to 250 users
    { duration: '20s', target: 500 },  // Peak 500 concurrent users (§19.4)
    { duration: '10s', target: 0 },    // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<400'], // 95% of requests must complete below 400ms
    http_req_failed: ['rate<0.02'],   // Error rate must stay below 2%
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:4000';

export default function () {
  // 1. Service Health Probe
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'Health status 200': (r) => r.status === 200,
    'Uptime present': (r) => r.json('status') === 'ok',
  });

  // 2. SSRF Protection Probe
  const ssrfPayload = JSON.stringify({ url: 'http://169.254.169.254/latest/meta-data' });
  const ssrfRes = http.post(`${BASE_URL}/api/v1/analyze`, ssrfPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  check(ssrfRes, {
    'SSRF blocked with 400': (r) => r.status === 400,
  });

  // 3. DRM Compliance Blocker Probe
  const drmPayload = JSON.stringify({ url: 'https://www.netflix.com/watch/80057281' });
  const drmRes = http.post(`${BASE_URL}/api/v1/analyze`, drmPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  check(drmRes, {
    'DRM platform blocked with 400': (r) => r.status === 400,
  });

  sleep(0.5);
}
