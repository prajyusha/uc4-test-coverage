const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const { createShop } = require('../server/shop');
const { createApp } = require('../server');
const { hash } = require('../server/auth');

async function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'common-ground-'));
  const filename = path.join(dir, 'shop.json');
  const shop = createShop(filename);
  const server = createApp(shop).listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => {
    await new Promise(resolve => {
      server.close(resolve);
      server.closeAllConnections();
    });
    fs.rmSync(dir, { recursive: true, force: true });
  });
  const base = `http://127.0.0.1:${server.address().port}/api`;
  function client() {
    let cookie = '';
    return async (route, method = 'GET', body) => {
      const response = await fetch(base + route, {
        method,
        headers: { ...(cookie ? { Cookie: cookie } : {}),
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      if (response.headers.has('set-cookie'))
        cookie = response.headers.get('set-cookie').split(';')[0];
      return {
        status: response.status,
        headers: response.headers,
        body: response.status === 204 ? null : await response.json(),
      };
    };
  }
  return { client, shop, filename };
}

const login = (request, admin = false) => request('/login', 'POST', {
  email: admin ? 'admin@example.com' : 'shopper@example.com',
  password: admin ? 'Admin123!' : 'Shopper123!',
});
const product = {
  name: 'Boundary item', description: 'Test stock for cart limits',
  category: 'Testing', emoji: '📦', priceCents: 1000, stock: 150,
};

test('shopper search, login, isolated persisted cart, discount, checkout and logout', async t => {
  const { client, filename } = await fixture(t);
  const customer = client();
  const admin = client();
  assert.equal((await customer('/cart')).status, 401);
  const search = await customer('/products?q=HEADPHONES');
  assert.equal(search.body.length, 1);
  assert.equal(search.body[0].name, 'Studio headphones');
  const signedIn = await login(customer);
  assert.equal(signedIn.status, 200);
  assert.equal(signedIn.body.password, undefined);
  assert.match(signedIn.headers.get('set-cookie'), /HttpOnly/i);
  assert.match(signedIn.headers.get('set-cookie'), /SameSite=Strict/i);
  assert.equal((await customer('/me')).body.id, 'shopper');
  assert.equal((await customer('/cart/product-1', 'PUT', { quantity: 2 })).status, 200);
  await login(admin, true);
  assert.equal((await admin('/cart')).body.items.length, 0);
  assert.equal(createShop(filename).cart('shopper').items[0].quantity, 2);
  const discounted = await customer('/cart?code=WELCOME10');
  assert.equal(discounted.body.subtotalCents, 5600);
  assert.equal(discounted.body.discountCents, 560);
  assert.equal(discounted.body.totalCents, 5040);
  assert.equal((await customer('/cart?code=INVALID')).status, 400);
  assert.equal((await customer('/checkout', 'POST', { name: '', address: 'Demo street' })).status, 400);
  assert.equal((await customer('/cart')).body.items.length, 1);
  const order = await customer('/checkout', 'POST', {
    name: 'Demo Shopper', address: 'Demo street', code: 'WELCOME10',
  });
  assert.equal(order.status, 201);
  assert.equal(order.body.totalCents, 5040);
  assert.equal((await customer('/cart')).body.items.length, 0);
  assert.equal((await customer('/products?q=tote')).body[0].stock, 18);
  const saved = JSON.parse(fs.readFileSync(filename, 'utf8'));
  assert.equal(saved.orders.length, 1);
  assert.equal(saved.orders[0].id, order.body.id);
  assert.equal((await customer('/checkout', 'POST', { name: 'Demo', address: 'Demo' })).status, 400);
  assert.equal((await customer('/logout', 'POST')).status, 204);
  assert.equal((await customer('/me')).status, 401);
});

test('admin CRUD and cart limits including 99 accepted, 100 rejected and zero removes', async t => {
  const { client } = await fixture(t);
  const customer = client();
  const admin = client();
  assert.equal((await admin('/admin/products', 'POST', product)).status, 401);
  await login(customer);
  assert.equal((await customer('/admin/products', 'POST', product)).status, 403);
  await login(admin, true);
  assert.equal((await admin('/admin/products', 'POST', { ...product, stock: -1 })).status, 400);
  const created = await admin('/admin/products', 'POST', product);
  assert.equal(created.status, 201);
  const id = created.body.id;
  assert.equal((await customer(`/cart/${id}`, 'PUT', { quantity: 99 })).body.items[0].quantity, 99);
  for (const quantity of [100, -1, 1.5, '2', null]) {
    assert.equal((await customer(`/cart/${id}`, 'PUT', { quantity })).status, 400);
    assert.equal((await customer('/cart')).body.items[0].quantity, 99);
  }
  assert.equal((await customer(`/cart/${id}`, 'PUT', { quantity: 0 })).body.items.length, 0);
  await customer(`/cart/${id}`, 'PUT', { quantity: 2 });
  assert.equal((await admin(`/admin/products/${id}`, 'PUT', { ...product, stock: 1, name: 'Updated item' })).status, 200);
  assert.equal((await customer('/products?q=Updated')).body[0].name, 'Updated item');
  assert.equal((await customer('/checkout', 'POST', { name: 'Demo', address: 'Demo' })).status, 409);
  assert.equal((await customer('/cart')).body.items[0].quantity, 2);
  assert.equal((await customer(`/cart/${id}`, 'PUT', { quantity: 2 })).status, 409);
  assert.equal((await customer(`/admin/products/${id}`, 'DELETE')).status, 403);
  assert.equal((await admin(`/admin/products/${id}`, 'DELETE')).status, 204);
  assert.equal((await customer('/cart')).body.items.length, 0);
  assert.equal((await admin(`/admin/products/${id}`, 'DELETE')).status, 404);
});

test('search validates raw length and rejects non-string query parameters', async t => {
  const { client } = await fixture(t);
  const request = client();
  for (const query of ['', 'x'.repeat(99), 'x'.repeat(100)])
    assert.equal((await request(`/products?q=${query}`)).status, 200);
  for (const query of ['x'.repeat(101), ' '.repeat(101)])
    assert.equal((await request(`/products?q=${encodeURIComponent(query)}`)).status, 400);
  assert.equal((await request('/products?q[]=a&q[]=b')).status, 400);
});

test('passwords accept 8 and 200 characters, reject 7 and 201, and preserve trimming', async t => {
  const { client, filename } = await fixture(t);
  const state = JSON.parse(fs.readFileSync(filename, 'utf8'));
  for (const length of [8, 200]) state.users.push({
    id: `length-${length}`, email: `length${length}@example.com`,
    password: hash('p'.repeat(length)), role: 'customer',
  });
  fs.writeFileSync(filename, JSON.stringify(state));
  const shop = createShop(filename);
  for (const length of [8, 200])
    assert.equal(shop.login(`length${length}@example.com`, 'p'.repeat(length), 'test').user.id, `length-${length}`);
  assert.equal(shop.login('shopper@example.com', ' Shopper123! ', 'test').user.id, 'shopper');
  const request = client();
  for (const password of ['p'.repeat(7), 'p'.repeat(201), ' '.repeat(8), ' ppppppp ', null, 12345678])
    assert.equal((await request('/login', 'POST', { email: 'shopper@example.com', password })).status, 400);
  for (const length of [8, 200])
    assert.equal((await request('/login', 'POST', { email: 'shopper@example.com', password: 'p'.repeat(length) })).status, 401);
  assert.equal((await login(request)).status, 200);
});
