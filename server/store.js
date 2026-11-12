const fs = require('node:fs');
const path = require('node:path');
const { hash } = require('./auth');

function seed() {
  return {
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
  };
}

function createStore(filename) {
  function persist(next) {
    fs.mkdirSync(path.dirname(filename), { recursive: true });
    const temporary = `${filename}.tmp`;
    fs.writeFileSync(temporary, JSON.stringify(next, null, 2), { mode: 0o600 });
    fs.renameSync(temporary, filename);
  }
  let state;
  if (fs.existsSync(filename)) state = JSON.parse(fs.readFileSync(filename, 'utf8'));
  else { state = seed(); persist(state); }
  return {
    read: () => state,
    change(fn) {
      const next = structuredClone(state);
      const result = fn(next);
      persist(next);
      state = next;
      return result;
    },
  };
}

module.exports = { createStore };
