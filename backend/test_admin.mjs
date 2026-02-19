import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'staticlaunch-secret';
const p = new PrismaClient();

async function test() {
    console.log('🔐 Logging in as superadmin...');
    const admin = await p.user.findUnique({ where: { email: 'admin@staticlaunch.com' } });
    if (!admin) { console.log('❌ Superadmin not found'); return; }
    const token = jwt.sign({ id: admin.id, email: admin.email, role: admin.role }, JWT_SECRET, { expiresIn: '1h' });
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    const BASE = 'http://localhost:3001/api/admin';

    // 1. Test GET /users
    console.log('\n📋 GET /users...');
    let res = await fetch(`${BASE}/users`, { headers });
    let data = await res.json();
    console.log(`   Status: ${res.status} | Users: ${data.users?.length}`);

    // 2. Test GET /plans (should be empty)
    console.log('\n📋 GET /plans...');
    res = await fetch(`${BASE}/plans`, { headers });
    data = await res.json();
    console.log(`   Status: ${res.status} | Plans: ${data.plans?.length}`);

    // 3. Create a Plan
    console.log('\n➕ POST /plans (Starter)...');
    res = await fetch(`${BASE}/plans`, { method: 'POST', headers, body: JSON.stringify({ name: 'Starter', price: 9.99, maxProjects: 3, maxLeads: 100 }) });
    data = await res.json();
    console.log(`   Status: ${res.status} | Plan: ${data.plan?.name} #${data.plan?.id}`);
    const starterPlanId = data.plan?.id;

    // 4. Create another Plan
    console.log('\n➕ POST /plans (Pro)...');
    res = await fetch(`${BASE}/plans`, { method: 'POST', headers, body: JSON.stringify({ name: 'Pro', price: 29.99, maxProjects: 20, maxLeads: 5000 }) });
    data = await res.json();
    console.log(`   Status: ${res.status} | Plan: ${data.plan?.name} #${data.plan?.id}`);

    // 5. Test GET /memberships (should be empty)
    console.log('\n📋 GET /memberships...');
    res = await fetch(`${BASE}/memberships`, { headers });
    data = await res.json();
    console.log(`   Status: ${res.status} | Memberships: ${data.memberships?.length}`);

    // 6. Assign plan to a user
    console.log('\n➕ POST /memberships (user 1 → Starter)...');
    res = await fetch(`${BASE}/memberships`, { method: 'POST', headers, body: JSON.stringify({ userId: 1, planId: starterPlanId }) });
    data = await res.json();
    console.log(`   Status: ${res.status} | Membership: ${data.membership?.plan?.name} → ${data.membership?.user?.email}`);

    // 7. Test GET /licenses
    console.log('\n📋 GET /licenses...');
    res = await fetch(`${BASE}/licenses`, { headers });
    data = await res.json();
    console.log(`   Status: ${res.status} | Licenses: ${data.licenses?.length}`);
    if (data.licenses?.length > 0) {
        console.log(`   First license: ${data.licenses[0].key} (user: ${data.licenses[0].user?.email})`);
    }

    // 8. Test GET /stats
    console.log('\n📊 GET /stats...');
    res = await fetch(`${BASE}/stats`, { headers });
    data = await res.json();
    console.log(`   Status: ${res.status}`);
    console.log(`   Users: ${data.totalUsers} | Projects: ${data.totalProjects} | Licenses: ${data.activeLicenses} | Memberships: ${data.activeMemberships} | Plans: ${data.totalPlans}`);

    console.log('\n✅ All tests passed!');
    await p.$disconnect();
}

test().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
