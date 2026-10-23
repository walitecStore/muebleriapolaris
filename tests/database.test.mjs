import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import assert from 'node:assert/strict';
const container = `polaris-test-${process.pid}-${Date.now()}`;
const image =
  'postgres:17-alpine@sha256:eee6c6e1b0894fa4fe0075eb054af9fd1cf39a35321c2d4110626cfe506411fb';
const env = { ...process.env };
for (const k of [
  'DOCKER_HOST',
  'DOCKER_CONTEXT',
  'DOCKER_TLS',
  'DOCKER_TLS_VERIFY',
  'DOCKER_CERT_PATH',
])
  delete env[k];
const prefix = ['--host=unix:///var/run/docker.sock'];
function docker(args, input) {
  const r = spawnSync('docker', [...prefix, ...args], {
    input,
    encoding: 'utf8',
    env,
    maxBuffer: 4 * 1024 * 1024,
  });
  if (r.status !== 0) throw new Error(r.stderr || r.stdout || String(r.error));
  return r.stdout;
}
const sqlArgs = [
  'exec',
  '-i',
  container,
  'psql',
  '-h',
  '127.0.0.1',
  '-U',
  'postgres',
  '-v',
  'ON_ERROR_STOP=1',
];
function sql(text) {
  return docker(sqlArgs, text);
}
try {
  docker([
    'run',
    '-d',
    '--name',
    container,
    '--network',
    'none',
    '-e',
    'POSTGRES_HOST_AUTH_METHOD=trust',
    image,
  ]);
  let ready = false;
  for (let i = 0; i < 40; i++) {
    try {
      sql('SELECT 1');
      ready = true;
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  assert.ok(ready, 'Postgres did not become ready');
  sql(readFileSync(new URL('./database/bootstrap.sql', import.meta.url), 'utf8'));
  sql(readFileSync(new URL('./database/legacy-bootstrap.sql', import.meta.url), 'utf8'));
  const roleSQL = readFileSync(
    new URL('../src/lib/owner-bootstrap.ts', import.meta.url),
    'utf8'
  ).split('`')[1];
  assert.ok(
    readFileSync(
      new URL('../supabase/migrations/20261023200000_owner_role_bootstrap.sql', import.meta.url),
      'utf8'
    ).includes(roleSQL),
    'Bootstrap UI SQL differs from tested migration'
  );
  const migrations = readdirSync(new URL('../supabase/migrations/', import.meta.url))
    .filter((n) => n.endsWith('.sql'))
    .sort();
  for (const f of migrations) {
    const source = readFileSync(new URL('../supabase/migrations/' + f, import.meta.url), 'utf8');
    assert.ok(
      !source.includes('\uFEFF'),
      f + ' has a BOM unsupported by Supabase migration parsing'
    );
    sql(source);
  }
  sql(`DO $$ BEGIN
    ASSERT (SELECT full_name FROM public.profiles WHERE email='legacy@example.test')='Preserve existing name','Legacy profile was lost';
    ASSERT (SELECT telefono FROM public.profiles WHERE email='legacy@example.test')='999999999','Legacy phone was lost';
    ASSERT (SELECT role::text FROM public.profiles WHERE email='legacy@example.test')='user','Legacy role was lost';
    ASSERT (SELECT status::text FROM public.legacy_enum_preservation WHERE id=1)='confirmado','Order enum column was removed';
    ASSERT (SELECT kind::text FROM public.legacy_enum_preservation WHERE id=1)='general','Notification enum column was removed';
  END $$;`);
  console.info(`Applied ${migrations.length} migrations to disposable Postgres 17`);
  sql(readFileSync(new URL('./database/acceptance.sql', import.meta.url), 'utf8'));
  sql(readFileSync(new URL('./database/marketplace.sql', import.meta.url), 'utf8'));
  sql(readFileSync(new URL('./database/owner-bootstrap.sql', import.meta.url), 'utf8'));
  const checkout = (key) =>
    `BEGIN;SET LOCAL ROLE service_role;SELECT set_config('request.jwt.claim.role','service_role',true);SELECT * FROM public.create_server_validated_order('22222222-2222-4222-8222-222222222222','[{"productId":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","quantity":1}]','yape','{"latitude":-12,"longitude":-77,"district":"Comas","shippingType":"lima_delivery","quoteStatus":"calculated","distanceKm":10,"centerDistanceKm":10,"centerDeltaKm":0,"basePrice":70,"shippingAmount":70}','${key}');SELECT pg_sleep(0.15);COMMIT;`;
  function concurrent(text) {
    return new Promise((resolve) => {
      const p = spawn('docker', [...prefix, ...sqlArgs], { env, stdio: ['pipe', 'pipe', 'pipe'] });
      let out = '';
      p.stdout.on('data', (d) => (out += d));
      p.stderr.on('data', (d) => (out += d));
      p.on('close', (code) => resolve({ code, out }));
      p.stdin.end(text);
    });
  }
  const attempts = await Promise.all([
    concurrent(checkout('11111111-aaaa-4111-8111-111111111111')),
    concurrent(checkout('22222222-aaaa-4222-8222-222222222222')),
  ]);
  assert.equal(attempts.filter((r) => r.code === 0).length, 1, 'Two buyers obtained the last unit');
  assert.match(attempts.find((r) => r.code !== 0).out, /Stock insuficiente/);
  assert.match(sql("SELECT stock FROM public.products WHERE slug='last-item'"), /\b0\b/);
  console.info(
    'Passed: profile permissions, private costs, image upload permissions, settings, stock, retry idempotency, payment approval, return transitions, refunds, reporting and concurrent last-unit purchase.'
  );
} finally {
  spawnSync('docker', [...prefix, 'rm', '-f', container], { env, stdio: 'ignore' });
}
