const { randomUUID } = require('node:crypto');
const { fail, text } = require('./validation');
const { cartFor } = require('./cart');

function createCheckout(store) {
  return {
    checkout(userId, data) {
      const name = text(data.name, 'Full name', 100);
      const address = text(data.address, 'Delivery address', 500);
      const code = data.code ?? '';
      return store.change(state => {
        const cart = cartFor(state, userId, code);
        if (!cart.items.length) fail(400, 'Your cart is empty.');
        for (const item of cart.items) {
          if (item.quantity > item.product.stock)
            fail(409, `${item.product.name} has insufficient stock.`);
        }
        for (const item of cart.items) item.product.stock -= item.quantity;
        const order = {
          id: randomUUID(), userId, name, address, ...structuredClone(cart),
          createdAt: new Date().toISOString(),
        };
        state.orders.push(order);
        state.carts[userId] = [];
        return order;
      });
    },
  };
}

module.exports = { createCheckout };
