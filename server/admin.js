const { randomUUID } = require('node:crypto');
const { fail } = require('./validation');
const { validateProduct } = require('./products');

function createAdmin(store) {
  return {
    saveProduct(actor, id, data) {
      if (actor.role !== 'admin') fail(403, 'Administrator access required.');
      const fields = validateProduct(data);
      return store.change(state => {
        if (id) {
          const existing = state.products.find(p => p.id === id);
          if (!existing) fail(404, 'Product not found.');
          Object.assign(existing, fields);
          return existing;
        }
        const created = { id: randomUUID(), ...fields };
        state.products.push(created);
        return created;
      });
    },
    deleteProduct(actor, id) {
      if (actor.role !== 'admin') fail(403, 'Administrator access required.');
      return store.change(state => {
        if (!state.products.some(p => p.id === id)) fail(404, 'Product not found.');
        state.products = state.products.filter(p => p.id !== id);
        for (const key of Object.keys(state.carts))
          state.carts[key] = state.carts[key].filter(item => item.productId !== id);
      });
    },
  };
}

module.exports = { createAdmin };
