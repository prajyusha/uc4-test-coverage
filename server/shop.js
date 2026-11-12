<<<<<<< Updated upstream
const fs = require('node:fs');
const path = require('node:path');
const { randomBytes, randomUUID, scryptSync, timingSafeEqual } = require('node:crypto');

class ShopError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const fail = (status, message) => { throw new ShopError(status, message); };
function text(value, name, max = 120) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max)
    fail(400, `${name} is required and must be at most ${max} characters.`);
  return value.trim();
}
function integer(value, name, min, max) {
  if (!Number.isSafeInteger(value) || value < min || value > max)
    fail(400, `${name} must be an integer between ${min} and ${max}.`);
  return value;
}
function hash(password, salt = randomBytes(16).toString('hex')) {
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}
const publicUser = ({ id, email, role }) => ({ id, email, role });

function createShop(filename = path.join(__dirname, 'data', 'shop.json')) {
  const seed = () => ({
    users: [
      { id: 'shopper', email: 'shopper@example.com', password: hash('Shopper123!'), role: 'customer' },
      { id: 'admin', email: 'admin@example.com', password: hash('Admin123!'), role: 'admin' },
    ],
    products: [
      ['Everyday tote', 'A sturdy cotton companion for market days and everything in between.', 2800, 'Accessories', '👜'],
      ['Studio headphones', 'A little quiet, a lot of detail. Wireless sound for your daily rhythm.', 8900, 'Electronics', '🎧'],
      ['Pour-over set', 'Slow mornings start here. A ceramic dripper and matching cup.', 4600, 'Home', '☕'],
      ['Trail bottle', 'Keep your water cool and your adventures going.', 2400, 'Outdoors', '🥤'],
      ['Desk light', 'Warm, focused light for your most inspired hours.', 6500, 'Home', '💡'],
      ['Weekend backpack', 'Thoughtfully organized, ready for a change of scenery.', 7400, 'Accessories', '🎒'],
    ].map(([name, description, priceCents, category, emoji], i) => ({
      id: `product-${i + 1}`, name, description, priceCents, category, emoji, stock: 20,
    })),
    carts: {}, orders: [],
  });
  function persist(next) {
    fs.mkdirSync(path.dirname(filename), { recursive: true });
    const temporary = `${filename}.tmp`;
    fs.writeFileSync(temporary, JSON.stringify(next, null, 2), { mode: 0o600 });
    fs.renameSync(temporary, filename);
  }
  let state;
  if (fs.existsSync(filename)) state = JSON.parse(fs.readFileSync(filename, 'utf8'));
  else { state = seed(); persist(state); }
  const sessions = new Map();
  const attempts = new Map();
  function change(fn) {
    const next = structuredClone(state);
    const result = fn(next);
    persist(next);
    state = next;
    return result;
  }
  function product(data) {
    return {
      name: text(data.name, 'Name', 100),
      description: text(data.description, 'Description', 1000),
      category: text(data.category, 'Category', 40),
      emoji: text(data.emoji, 'Product symbol', 8),
      priceCents: integer(data.priceCents, 'Price in cents', 1, 10000000),
      stock: integer(data.stock, 'Stock', 0, 10000),
    };
  }
  function cartFor(s, userId, code = '') {
    if (typeof code !== 'string' || code.length > 40) fail(400, 'Invalid discount code.');
    code = code.trim().toUpperCase();
    if (code && code !== 'WELCOME10') fail(400, 'Discount code is not valid.');
    const items = (s.carts[userId] || []).map(item => {
      const p = s.products.find(p => p.id === item.productId);
      if (!p) fail(409, 'A product is no longer available. Please update your cart.');
      return { ...item, product: p, lineTotalCents: p.priceCents * item.quantity };
    });
    const subtotalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0);
    const discountCents = code ? Math.round(subtotalCents * 0.1) : 0;
    return { items, subtotalCents, discountCents, totalCents: subtotalCents - discountCents, code };
  }
  return {
    login(email, password, clientKey) {
      email = text(email, 'Email', 254).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(400, 'Enter a valid email address.');
      password = text(password, 'Password', 200);
      const now = Date.now();
      for (const [key, value] of attempts) if (value.until < now) attempts.delete(key);
      const key = `${clientKey}:${email}`;
      const attempt = attempts.get(key) || { count: 0, until: now + 900000 };
      if (attempt.count >= 10) fail(429, 'Too many login attempts. Try again in 15 minutes.');
      const user = state.users.find(u => u.email === email);
      const [salt, expected] = (user?.password || hash('dummy-password')).split(':');
      const actual = scryptSync(password, salt, 64);
      if (!user || !timingSafeEqual(actual, Buffer.from(expected, 'hex'))) {
        attempt.count++; attempts.set(key, attempt);
        fail(401, 'Email or password is incorrect.');
      }
      attempts.delete(key);
      for (const [token, session] of sessions) if (session.expires <= now) sessions.delete(token);
      const token = randomBytes(32).toString('hex');
      sessions.set(token, { userId: user.id, expires: now + 28800000 });
      return { token, user: publicUser(user) };
    },
    user(token) {
      const session = sessions.get(token);
      if (!session || session.expires <= Date.now()) {
        sessions.delete(token); fail(401, 'Please log in to continue.');
      }
      return publicUser(state.users.find(u => u.id === session.userId));
    },
    logout(token) { sessions.delete(token); },
    products(query = '') {
      if (typeof query !== 'string' || query.length > 100) fail(400, 'Search must be at most 100 characters.');
      const q = query.trim().toLowerCase();
      return state.products.filter(p => `${p.name} ${p.description} ${p.category}`.toLowerCase().includes(q));
    },
    cart(userId, code) { return cartFor(state, userId, code); },
    setQuantity(userId, productId, quantity) {
      integer(quantity, 'Quantity', 0, 99);
      return change(s => {
        const p = s.products.find(p => p.id === productId);
        if (!p) fail(404, 'Product not found.');
        if (quantity > p.stock) fail(409, `Only ${p.stock} available.`);
        const items = (s.carts[userId] || []).filter(i => i.productId !== productId);
        if (quantity) items.push({ productId, quantity });
        s.carts[userId] = items;
        return cartFor(s, userId);
      });
    },
    checkout(userId, data) {
      const name = text(data.name, 'Full name', 100);
      const address = text(data.address, 'Delivery address', 500);
      const code = data.code ?? '';
      return change(s => {
        const cart = cartFor(s, userId, code);
        if (!cart.items.length) fail(400, 'Your cart is empty.');
        for (const item of cart.items) {
          if (item.quantity > item.product.stock) fail(409, `${item.product.name} has insufficient stock.`);
        }
        for (const item of cart.items) item.product.stock -= item.quantity;
        const order = { id: randomUUID(), userId, name, address, ...structuredClone(cart), createdAt: new Date().toISOString() };
        s.orders.push(order);
        s.carts[userId] = [];
        return order;
      });
    },
    saveProduct(actor, id, data) {
      if (actor.role !== 'admin') fail(403, 'Administrator access required.');
      const fields = product(data);
      return change(s => {
        if (id) {
          const existing = s.products.find(p => p.id === id);
          if (!existing) fail(404, 'Product not found.');
          Object.assign(existing, fields);
          return existing;
        }
        const created = { id: randomUUID(), ...fields };
        s.products.push(created);
        return created;
      });
    },
    deleteProduct(actor, id) {
      if (actor.role !== 'admin') fail(403, 'Administrator access required.');
      return change(s => {
        if (!s.products.some(p => p.id === id)) fail(404, 'Product not found.');
        s.products = s.products.filter(p => p.id !== id);
        for (const key of Object.keys(s.carts))
          s.carts[key] = s.carts[key].filter(item => item.productId !== id);
      });
    },
  };
}
=======
const path = require('node:path');
const { ShopError } = require('./validation');
const { createStore } = require('./store');
const { createAuth } = require('./auth');
const { createProducts } = require('./products');
const { createCart } = require('./cart');
const { createCheckout } = require('./checkout');
const { createAdmin } = require('./admin');

function createShop(filename = path.join(__dirname, 'data', 'shop.json')) {
  const store = createStore(filename);
  return {
    ...createAuth(store),
    ...createProducts(store),
    ...createCart(store),
    ...createCheckout(store),
    ...createAdmin(store),
  };
}

>>>>>>> Stashed changes
module.exports = { createShop, ShopError };
