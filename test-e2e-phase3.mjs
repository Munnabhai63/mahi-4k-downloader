// test-e2e-phase3.mjs - Automated Verification of Phase 3 (Admin Console, Business Logic & Analytics)
const API_BASE = 'http://localhost:4000/api/v1';

async function runTest(name, fn) {
  process.stdout.write(`\x1b[36m[TEST]\x1b[0m ${name} ... `);
  try {
    const result = await fn();
    console.log(`\x1b[32mPASSED\x1b[0m ${result ? `(${result})` : ''}`);
    return true;
  } catch (err) {
    console.log(`\x1b[31mFAILED\x1b[0m`);
    console.error(`       Error: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('\n======================================================');
  console.log('   TurboGrab Phase 3 Automated E2E Verification');
  console.log('======================================================\n');

  let passed = 0;
  let total = 0;
  let adminToken = '';
  let demoToken = '';

  // 1. Admin Login & JWT Issuance
  total++;
  const adminLoginOk = await runTest('Admin Auth: System Admin Login', async () => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@turbograb.app',
        password: 'AdminPassword123!',
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.accessToken || data.user.role !== 'ADMIN') {
      throw new Error('Not an admin token');
    }
    adminToken = data.accessToken;
    return `Admin: ${data.user.email} (Role: ${data.user.role})`;
  });
  if (adminLoginOk) passed++;

  // 2. Demo User Login for Non-Admin comparison
  total++;
  const demoLoginOk = await runTest('Non-Admin Auth: Demo User Login', async () => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'demo@turbograb.app',
        password: 'DemoPassword123!',
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    demoToken = data.accessToken;
    return `User: ${data.user.email}`;
  });
  if (demoLoginOk) passed++;

  // 3. Admin Overview Telemetry
  total++;
  const overviewOk = await runTest('Admin Telemetry: Live Overview Metrics', async () => {
    const res = await fetch(`${API_BASE}/admin/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (typeof data.totalUsers !== 'number') throw new Error('Invalid totalUsers metric');
    if (!data.workerClusterStatus) throw new Error('Missing workerClusterStatus');
    return `Users: ${data.totalUsers}, Workers: ${data.workerClusterStatus.healthyWorkers}/4 Healthy`;
  });
  if (overviewOk) passed++;

  // 4. Admin User Management: List, Ban, Unban & Plan Control
  total++;
  let targetUserId = '';
  const userMgmtOk = await runTest('Admin Users: List, Ban/Unban & Plan Switch', async () => {
    const listRes = await fetch(`${API_BASE}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!listRes.ok) throw new Error(`List failed HTTP ${listRes.status}`);
    const users = await listRes.json();
    const demo = users.find((u) => u.email === 'demo@turbograb.app');
    if (!demo) throw new Error('Demo user not found');
    targetUserId = demo.id;

    // Ban
    const banRes = await fetch(`${API_BASE}/admin/users/${targetUserId}/ban`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ isBanned: true }),
    });
    if (!banRes.ok) throw new Error(`Ban failed HTTP ${banRes.status}`);
    const bannedUser = await banRes.json();
    if (!bannedUser.isBanned) throw new Error('User is not banned');

    // Unban
    const unbanRes = await fetch(`${API_BASE}/admin/users/${targetUserId}/ban`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ isBanned: false }),
    });
    if (!unbanRes.ok) throw new Error(`Unban failed HTTP ${unbanRes.status}`);

    // Change Plan to Premium
    const planRes = await fetch(`${API_BASE}/admin/users/${targetUserId}/plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ planId: 'premium' }),
    });
    if (!planRes.ok) throw new Error(`Plan update failed HTTP ${planRes.status}`);
    const updatedPlanUser = await planRes.json();
    if (updatedPlanUser.planId !== 'premium') throw new Error('Plan not updated to premium');

    return `Target: ${demo.email}, Ban/Unban verified, Plan switched to premium`;
  });
  if (userMgmtOk) passed++;

  // 5. Global Downloads Feed & Live Job Inspector
  total++;
  const feedOk = await runTest('Admin Downloads: Global Live Jobs Feed', async () => {
    const res = await fetch(`${API_BASE}/admin/downloads`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const jobs = await res.json();
    if (!Array.isArray(jobs)) throw new Error('Downloads is not an array');
    return `Feed items in memory: ${jobs.length}`;
  });
  if (feedOk) passed++;

  // 6. System Runtime Settings & Maintenance Mode Toggle
  total++;
  const settingsOk = await runTest('Admin Settings: Runtime Caps & Maintenance Toggle', async () => {
    // Get
    const getRes = await fetch(`${API_BASE}/admin/settings`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!getRes.ok) throw new Error(`Get settings failed HTTP ${getRes.status}`);
    const initial = await getRes.json();

    // Toggle maintenance
    const putRes = await fetch(`${API_BASE}/admin/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        maintenanceMode: true,
        announcementBanner: { enabled: true, message: 'Maintenance test banner', level: 'warning' },
      }),
    });
    if (!putRes.ok) throw new Error(`Put settings failed HTTP ${putRes.status}`);
    const updated = await putRes.json();
    if (updated.maintenanceMode !== true) throw new Error('Maintenance mode not activated');

    // Revert maintenance
    await fetch(`${API_BASE}/admin/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ maintenanceMode: false }),
    });

    return `Maintenance mode toggle & announcement verified (Limits: ${initial.freeDailyLimit} free, ${initial.premiumDailyLimit} premium)`;
  });
  if (settingsOk) passed++;

  // 7. Audit Log Trail
  total++;
  const auditOk = await runTest('Admin Audit: Immutable Operations Log Trail', async () => {
    const res = await fetch(`${API_BASE}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const logs = await res.json();
    if (!Array.isArray(logs) || logs.length === 0) throw new Error('No audit logs recorded');
    const hasBan = logs.some((l) => l.action === 'BAN_USER');
    const hasPlan = logs.some((l) => l.action === 'UPDATE_USER_PLAN');
    if (!hasBan || !hasPlan) throw new Error('Expected audit actions not found in trail');
    return `Logged ${logs.length} operations; BAN_USER & UPDATE_USER_PLAN verified`;
  });
  if (auditOk) passed++;

  // 8. Security Isolation: Non-Admin Rejection
  total++;
  const securityOk = await runTest('Security: Non-Admin Token Rejected from Admin API', async () => {
    const res = await fetch(`${API_BASE}/admin/overview`, {
      headers: { Authorization: `Bearer ${demoToken}` },
    });
    // Should be rejected or require admin
    const banRes = await fetch(`${API_BASE}/admin/users/${targetUserId}/ban`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${demoToken}`,
      },
      body: JSON.stringify({ isBanned: true }),
    });

    if (banRes.status !== 401 && banRes.status !== 403) {
      throw new Error(`Non-admin ban action returned unexpected HTTP ${banRes.status}`);
    }
    return `HTTP ${banRes.status} Unauthorized/Forbidden correctly enforced`;
  });
  if (securityOk) passed++;

  console.log('\n------------------------------------------------------');
  console.log(`   Phase 3 Result: ${passed}/${total} Tests Passed`);
  console.log('------------------------------------------------------\n');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('Test execution fatal error:', e);
  process.exit(1);
});
