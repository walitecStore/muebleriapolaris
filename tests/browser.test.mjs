// Browser acceptance uses synthetic Supabase responses. Real SQL authorization and
// concurrency are tested independently by database.test.mjs against Postgres.
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { createHmac } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { emptyStore } from '../src/lib/store-profile.ts';
const adminId = '11111111-1111-4111-8111-111111111111',
  buyerId = '22222222-2222-4222-8222-222222222222';
const product = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  name: 'Sofá de prueba',
  slug: 'sofa-prueba',
  description: 'Producto sintético para comprobar la interfaz.',
  price: 250,
  stock: 8,
  image_url: '/assets/images/app_logo.png',
  images: [],
  is_active: true,
  is_featured: true,
  promotion_eligible: true,
  delivery_vehicle: 'truck',
  delivery_partner: 'polaris',
  category_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  created_at: '2026-01-01T00:00:00Z',
  variants: [],
  sale_price: null,
  sku: null,
  color: '',
  material: '',
  shipping_factor: 1,
  updated_at: '2026-01-01T00:00:00.000Z',
};
const cheapProduct = {
  ...product,
  id: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
  name: 'Accesorio de prueba',
  slug: 'accesorio-prueba',
  price: 50,
};
const category = { id: product.category_id, name: 'Salas', slug: 'salas' };
let lastProductUpdate = null;
let lastProfileUpdate = null;
const profileData = new Map();
let membershipPayments = [];
let store = { id: 1, ...emptyStore, name: 'Tienda de prueba', whatsapp: '51999999999' };
function token(id) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: id,
    role: 'authenticated',
    aud: 'authenticated',
    exp: now + 3600,
    iat: now,
    email: id === adminId ? 'admin@example.test' : 'buyer@example.test',
  };
  const prefix =
    Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url') +
    '.' +
    Buffer.from(JSON.stringify(payload)).toString('base64url');
  return (
    prefix +
    '.' +
    createHmac('sha256', 'synthetic-browser-test-only-not-a-real-credential')
      .update(prefix)
      .digest('base64url')
  );
}
const tokens = new Map([
  [token(adminId), adminId],
  [token(buyerId), buyerId],
]);
const mock = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1'),
    auth = req.headers.authorization?.replace(/^Bearer /, '');
  const user = tokens.get(auth),
    role = user === adminId ? 'admin' : 'user';
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    req.headers['access-control-request-headers'] ||
      'apikey,authorization,content-type,x-client-info,prefer,accept,range,x-supabase-api-version'
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  let text = '';
  for await (const chunk of req) text += chunk;
  const body = text ? JSON.parse(text) : {};
  let result;
  let status = 200;
  if (url.pathname === '/auth/v1/user') {
    if (!user) {
      status = 401;
      result = { message: 'Synthetic session missing' };
    } else
      result = {
        id: user,
        email: user === adminId ? 'admin@example.test' : 'buyer@example.test',
        role: 'authenticated',
        app_metadata: {},
        user_metadata: {},
      };
  } else if (url.pathname === '/auth/v1/logout') {
    status = 204;
    result = null;
  } else if (url.pathname === '/rest/v1/profiles') {
    if (
      req.method === 'POST' ||
      (req.method === 'PATCH' &&
        Object.keys(body).some((k) => !['full_name', 'phone', 'avatar_url'].includes(k)))
    ) {
      status = 403;
      result = { message: 'permission denied for table profiles' };
    } else {
      if (req.method === 'PATCH') {
        lastProfileUpdate = { method: req.method, body };
        profileData.set(user, { ...profileData.get(user), ...body });
      }
      result = {
        id: user,
        role,
        full_name: 'Test User',
        phone: '',
        email: 'user@example.test',
        ...profileData.get(user),
      };
    }
  } else if (url.pathname === '/rest/v1/store_settings') {
    if (req.method === 'PATCH') {
      if (role !== 'admin') {
        status = 403;
        result = { message: 'Denied' };
      } else store = { ...store, ...body };
    }
    result = store;
  } else if (url.pathname === '/rest/v1/rpc/admin_sales_report') {
    if (role !== 'admin') {
      status = 403;
      result = { message: 'Denied' };
    } else {
      const days = (new Date(body.p_end) - new Date(body.p_start)) / 86400_000,
        count = days <= 1 ? 24 : days > 32 ? 12 : days;
      result = {
        gross: 2450,
        refunds: 150,
        net: 2300,
        paidOrders: 7,
        average: 350,
        pendingOrders: 2,
        activeProducts: 12,
        lowStock: 3,
        customers: 20,
        expiredReservations: 0,
        series: Array.from({ length: count }, (_, i) => ({
          date: `2026-10-${String(i + 1).padStart(2, '0')} 00:00`,
          amount: i === 1 ? 2450 : 0,
          orders: i === 1 ? 7 : 0,
        })),
        topProducts: [{ product_id: product.id, name: product.name, quantity: 7, amount: 2450 }],
      };
    }
  } else if (url.pathname === '/rest/v1/categories') result = [category];
  else if (url.pathname === '/rest/v1/products') {
    if (req.method === 'PATCH') {
      lastProductUpdate = { body, version: url.searchParams.get('updated_at') };
      result = { id: product.id };
    } else {
      result = [product, cheapProduct];
      const ids = url.searchParams.get('id');
      if (ids?.startsWith('eq.')) result = result.filter((p) => p.id === ids.slice(3));
      else if (ids?.startsWith('in.(')) result = result.filter((p) => ids.includes(p.id));
      if (url.searchParams.has('or'))
        result = result.filter((p) => (p.sale_price ?? p.price) <= 60 && p.promotion_eligible);
      if (url.searchParams.get('sale_price') === 'not.is.null')
        result = result.filter((p) => p.sale_price !== null);
    }
    res.setHeader('Content-Range', '0-1/2');
  } else if (url.pathname === '/rest/v1/payment_methods')
    result = [{ code: 'yape', label: 'Yape', metadata: {}, is_active: false }];
  else if (url.pathname === '/rest/v1/seller_membership_payments') {
    if (req.method === 'POST') {
      const entry = {
        id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
        user_id: user,
        reference: body.reference,
        amount: 50,
        status: 'pending',
        review_note: '',
        created_at: '2026-10-23T10:00:00Z',
      };
      membershipPayments.push(entry);
      result = entry;
    } else result = membershipPayments;
  } else if (url.pathname === '/rest/v1/rpc/admin_membership_report')
    result = {
      active: 1,
      pending: membershipPayments.filter((p) => p.status === 'pending').length,
      collected: 0,
    };
  else if (url.pathname === '/rest/v1/seller_profiles')
    result = [
      {
        user_id: buyerId,
        display_name: 'Vendedor de prueba',
        phone: '999999999',
        approved_until: '2099-01-01T00:00:00Z',
        suspended: false,
        delivery_vehicle: 'motorcycle',
        delivery_partner: 'polaris',
      },
    ];
  else if (url.pathname === '/rest/v1/rpc/claim_daily_coupon')
    result = {
      id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      user_id: buyerId,
      amount: 10,
      minimum_subtotal: 150,
      expires_at: '2099-01-01T00:00:00Z',
      used_order_id: null,
    };
  else if (url.pathname === '/rest/v1/rpc/seller_sales_report')
    result = { gross: 150, discount: 10, refunds: 0, net: 140, orders: 1, units: 3 };
  else if (url.pathname.startsWith('/rest/v1/')) result = [];
  else {
    status = 404;
    result = { message: 'Unmocked path' };
  }
  if (req.headers.accept?.includes('vnd.pgrst.object') && Array.isArray(result))
    result = result[0] || null;
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(result));
});
await new Promise((resolve) => mock.listen(0, '127.0.0.1', resolve));
const supabaseURL = `http://127.0.0.1:${mock.address().port}`;
const env = {
  ...process.env,
  NEXT_PUBLIC_SUPABASE_URL: supabaseURL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'synthetic-public-test-key',
  SUPABASE_SERVICE_ROLE_KEY: 'synthetic-server-test-key',
  NEXT_TELEMETRY_DISABLED: '1',
  DIST_DIR: '.next/browser-test',
};
let server, browser;
const backups = new Map(['tsconfig.json', 'next-env.d.ts'].map((p) => [p, readFileSync(p)]));
const artifacts = process.env.POLARIS_SCREENSHOT_DIR || '/tmp/polaris-browser-tests';
mkdirSync(artifacts, { recursive: true });
async function command(args) {
  return new Promise((resolve, reject) => {
    const p = spawn(process.execPath, ['node_modules/next/dist/bin/next', ...args], {
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let log = '';
    p.stdout.on('data', (d) => (log += d));
    p.stderr.on('data', (d) => (log += d));
    p.on('error', reject);
    p.on('close', (code) => {
      writeFileSync(join(artifacts, 'build.log'), log);
      if (code === 0) resolve();
      else reject(new Error(log));
    });
  });
}
try {
  await command(['build']);
  console.info('Browser-test production build passed.');
  server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', '4032'], {
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let log = '';
  server.stdout.on('data', (d) => (log += d));
  server.stderr.on('data', (d) => (log += d));
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch('http://127.0.0.1:4032/login');
      if (r.ok) {
        ready = true;
        break;
      }
    } catch {
      /* Server may still be starting. */
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  assert.ok(ready, log);
  browser = await chromium.launch({
    headless: true,
    ...(existsSync('/usr/bin/chromium') ? { executablePath: '/usr/bin/chromium' } : {}),
    args: ['--no-sandbox'],
  });
  const anonymous = await browser.newContext();
  const publicPage = await anonymous.newPage();
  await publicPage.goto('http://127.0.0.1:4032/admin');
  assert.match(publicPage.url(), /\/login\?next=/);
  const denied = await publicPage.request.get('http://127.0.0.1:4032/api/admin/report');
  assert.equal(denied.status(), 401);
  const callback = await publicPage.request.get(
    'http://127.0.0.1:4032/auth/callback?next=//attacker.test',
    { maxRedirects: 0 }
  );
  assert.equal(callback.status(), 307);
  assert.match(callback.headers().location, /\/login\?error=confirmation$/);
  await publicPage.getByRole('link', { name: 'Panel del dueño', exact: true }).first().waitFor();
  const release = await publicPage.request.get('http://127.0.0.1:4032/api/release');
  assert.equal(release.status(), 200);
  assert.equal((await release.json()).canonicalUrl, 'https://muebleriapolaris.vercel.app');
  await publicPage.goto('http://127.0.0.1:4032/catalogo');
  await publicPage.getByRole('link', { name: product.name, exact: true }).first().waitFor();
  await publicPage.getByRole('link', { name: 'Ver detalles', exact: true }).first().waitFor();
  await publicPage
    .getByRole('button', { name: 'Guardar en favoritos: ' + product.name, exact: true })
    .click();
  await publicPage.reload();
  await publicPage
    .getByRole('button', { name: 'Quitar de favoritos: ' + product.name, exact: true })
    .waitFor();
  await publicPage.setViewportSize({ width: 1440, height: 1000 });
  await publicPage.screenshot({
    path: join(artifacts, 'polaris-catalog-desktop.png'),
    fullPage: true,
  });
  await publicPage.setViewportSize({ width: 390, height: 844 });
  assert.ok(
    await publicPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    'Catalog header overflows on mobile'
  );
  await publicPage.screenshot({
    path: join(artifacts, 'polaris-catalog-mobile.png'),
    fullPage: true,
  });
  await publicPage.goto('http://127.0.0.1:4032/favoritos');
  await publicPage.getByRole('link', { name: 'Ver detalles', exact: true }).first().waitFor();
  await publicPage.goto('http://127.0.0.1:4032/productos/' + product.id);
  await publicPage.getByRole('heading', { name: product.name, exact: true }).waitFor();
  await publicPage.goto('http://127.0.0.1:4032/instalar');
  await publicPage.getByRole('heading', { name: 'Instala Polaris', exact: true }).waitFor();
  assert.equal(
    (await publicPage.request.get('http://127.0.0.1:4032/manifest.webmanifest')).status(),
    200
  );
  await publicPage.goto('http://127.0.0.1:4032/catalogo');
  await publicPage.getByRole('button', { name: 'Agregar al carrito', exact: true }).first().click();
  await publicPage.getByRole('dialog', { name: 'Carrito de compras' }).waitFor();
  const pricingResponse = await publicPage.request.post('http://127.0.0.1:4032/api/cart-pricing', {
    data: { items: [{ productId: cheapProduct.id, quantity: 3 }] },
  });
  assert.equal(pricingResponse.status(), 200);
  assert.equal((await pricingResponse.json()).discount, 10);
  await publicPage.goto('http://127.0.0.1:4032/ofertas');
  await publicPage.getByRole('link', { name: cheapProduct.name, exact: true }).waitFor();
  assert.equal(
    await publicPage.getByRole('link', { name: product.name, exact: true }).count(),
    0,
    'S/250 product leaked into offer selection'
  );
  await anonymous.close();
  async function signedContext(id) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
    const jwt = [...tokens].find(([, uid]) => uid === id)[0];
    const session = {
      access_token: jwt,
      refresh_token: 'synthetic-refresh-token',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id, email: 'user@example.test', app_metadata: {}, user_metadata: {} },
    };
    await context.addCookies([
      {
        name: 'sb-127-auth-token',
        value: 'base64-' + Buffer.from(JSON.stringify(session)).toString('base64url'),
        domain: '127.0.0.1',
        path: '/',
      },
    ]);
    return context;
  }
  const customer = await signedContext(buyerId);
  const customerPage = await customer.newPage();
  await customerPage.goto('http://127.0.0.1:4032/admin');
  assert.match(customerPage.url(), /\/acceso\/dueno/);
  await customerPage
    .getByRole('heading', { name: 'Tu cuenta aún no está autorizada como dueña', exact: true })
    .waitFor();
  await customerPage.getByText('Soy el propietario: autorizar mi cuenta', { exact: true }).click();
  assert.ok(
    (await customerPage.locator('code').textContent()).includes(buyerId),
    'Owner bootstrap targeted another account'
  );
  const forbidden = await customerPage.request.get('http://127.0.0.1:4032/api/admin/report');
  assert.equal(forbidden.status(), 403);
  await customerPage.goto('http://127.0.0.1:4032/perfil');
  await customerPage.getByLabel('Nombre completo', { exact: true }).fill('Cliente actualizado');
  await customerPage.getByLabel('Teléfono', { exact: true }).fill('916832791');
  await customerPage.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
  await customerPage
    .getByRole('status')
    .filter({ hasText: 'Perfil guardado correctamente.' })
    .waitFor();
  assert.equal(lastProfileUpdate.method, 'PATCH');
  assert.deepEqual(lastProfileUpdate.body, {
    full_name: 'Cliente actualizado',
    phone: '916832791',
  });
  await customerPage.getByRole('link', { name: 'Panel del dueño', exact: true }).first().waitFor();
  await customerPage.screenshot({ path: join(artifacts, 'profile-fixed.png'), fullPage: true });
  await customerPage.goto('http://127.0.0.1:4032/vender');
  await customerPage.getByRole('heading', { name: 'Tu negocio en Polaris', exact: true }).waitFor();
  await customerPage.getByText('Membresía mensual · S/50', { exact: true }).waitFor();
  await customerPage
    .getByLabel('Número de operación de Yape', { exact: true })
    .fill('TEST-REAL-REFERENCE-ONLY');
  await customerPage.getByRole('button', { name: 'Enviar para verificar', exact: true }).click();
  await customerPage
    .getByRole('status')
    .filter({ hasText: 'Pago enviado para revisión' })
    .waitFor();
  assert.equal(membershipPayments[0].amount, 50);
  assert.equal(membershipPayments[0].status, 'pending');
  await customerPage.goto('http://127.0.0.1:4032/vender/anuncios');
  await customerPage.getByRole('heading', { name: 'Estudio de anuncios', exact: true }).waitFor();
  const adDownload = customerPage.waitForEvent('download');
  await customerPage.getByRole('button', { name: 'Descargar imagen', exact: true }).click();
  const ad = await adDownload;
  assert.equal(ad.suggestedFilename(), 'polaris-anuncio.png');
  await ad.saveAs(join(artifacts, 'generated-ad.png'));
  await customerPage.goto('http://127.0.0.1:4032/#ruleta');
  const closePromotion = customerPage.getByRole('button', {
    name: 'Cerrar promoción',
    exact: true,
  });
  await closePromotion.waitFor();
  await closePromotion.click();
  await customerPage.getByRole('button', { name: 'Girar mi ruleta', exact: true }).click();
  await customerPage.getByRole('status').filter({ hasText: 'Tu cupón de hoy: S/10' }).waitFor();
  assert.equal(
    await customerPage.evaluate(() => JSON.parse(localStorage.getItem('polaris_coupon')).amount),
    10
  );
  await customerPage.goto('http://127.0.0.1:4032/vender/estadisticas');
  await customerPage
    .getByRole('heading', { name: 'Estadísticas de mi tienda', exact: true })
    .waitFor();
  const sellerReport = await customerPage.request.get('http://127.0.0.1:4032/api/seller/report');
  assert.equal(sellerReport.status(), 200);
  assert.equal((await sellerReport.json()).net, 140);
  await customer.close();
  const admin = await signedContext(adminId);
  const page = await admin.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://127.0.0.1:4032/admin');
  await page.getByRole('heading', { name: 'Tu tienda, bajo control' }).waitFor();
  await page.getByRole('heading', { name: 'Cobros aprobados', exact: true }).waitFor();
  await page.screenshot({ path: join(artifacts, 'dashboard-desktop.png'), fullPage: true });
  for (const name of ['Semana', 'Mes', 'Año', 'Día']) {
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/admin/report?')),
      page.getByRole('button', { name, exact: true }).click(),
    ]);
    await page.getByRole('heading', { name: 'Cobros aprobados', exact: true }).waitFor();
  }
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar CSV' }).click();
  const download = await downloadPromise;
  assert.match(download.suggestedFilename(), /^ventas-day-/);
  await download.saveAs(join(artifacts, download.suggestedFilename()));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: join(artifacts, 'dashboard-mobile.png'), fullPage: true });
  assert.ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    'Mobile page overflows'
  );
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto('http://127.0.0.1:4032/admin/configuracion');
  await page.getByLabel('Nombre de la tienda', { exact: true }).fill('Nombre actualizado');
  assert.equal(
    await page.getByRole('alert').filter({ hasText: 'No se pudo cargar el perfil' }).count(),
    0,
    'Store profile did not load'
  );
  await page.getByRole('button', { name: 'Guardar perfil', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Perfil guardado' }).waitFor();
  assert.equal(store.name, 'Nombre actualizado');
  await page.goto('http://127.0.0.1:4032/admin/productos/nuevo');
  await page.getByLabel('Nombre del producto', { exact: true }).waitFor();
  await page.goto('http://127.0.0.1:4032/admin/productos/' + product.id);
  await page.getByLabel('Nombre del producto', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Guardar producto', exact: true }).click();
  await page.waitForURL('**/admin/productos');
  assert.equal(
    lastProductUpdate?.version,
    'eq.' + product.updated_at,
    'Editor did not protect concurrent inventory changes'
  );
  assert.equal(
    lastProductUpdate?.body.image_url,
    product.image_url,
    'Editing discarded the cover image'
  );
  assert.deepEqual(errors, [], 'Client-side rendering errors');
  console.info(
    'Passed browser acceptance: anonymous/customer/admin access, auth callback, live catalog/cart, report periods, CSV, mobile layout, profile save and product editor (synthetic backend).'
  );
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
  await page.waitForURL('**/login');
  await admin.close();
} catch (error) {
  if (browser)
    for (const context of browser.contexts())
      for (const page of context.pages()) {
        try {
          await page.screenshot({ path: join(artifacts, 'failure.png'), fullPage: true });
        } catch {
          /* A page may have closed already. */
        }
      }
  throw error;
} finally {
  if (browser) await browser.close();
  if (server) {
    server.kill('SIGTERM');
    await new Promise((resolve) => server.once('exit', resolve));
  }
  await new Promise((resolve) => mock.close(resolve));
  for (const [path, data] of backups) writeFileSync(path, data);
}
