import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const envFile = readFileSync('.env.local', 'utf-8')
for (const line of envFile.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx > 0) {
        process.env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim()
    }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) { console.error('Missing env vars'); process.exit(1) }

const sql = `ALTER TABLE brand_identities
  ADD COLUMN IF NOT EXISTS services jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS faqs jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS testimonials jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS stats jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS team_members jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS differentiators text DEFAULT '';`

// Execute via PostgREST pg_catalog trick — use service role to call raw SQL via pg_net or similar
// Actually, use the Supabase SQL API endpoint (only works with service_role key)
const resp = await fetch(`${url}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
    },
    body: JSON.stringify({}),
})

// The above won't work for raw SQL. Let's try via pg_graphql or just verify after manual execution.
// For now, output instructions:
console.log('=== Run this SQL in Supabase Dashboard (SQL Editor) ===')
console.log(`URL: ${url.replace('https://', 'https://supabase.com/dashboard/project/').replace('.supabase.co', '')}/sql/new`)
console.log()
console.log(sql)
console.log()

// Verify after
const supabase = createClient(url, key, { auth: { persistSession: false } })
const { data, error } = await supabase.from('brand_identities').select('services').limit(1)
if (error) {
    console.log('STATUS: Columns NOT yet created. Run the SQL above.')
} else {
    console.log('STATUS: Columns exist! Migration complete.')
}
