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

module.exports = { createShop, ShopError };
