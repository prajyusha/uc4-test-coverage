const { fail, integer, MAX_CART_QUANTITY } = require('./validation');

function cartFor(state, userId, code = '') {
  if (typeof code !== 'string' || code.length > 40) fail(400, 'Invalid discount code.');
  code = code.trim().toUpperCase();
  if (code && code !== 'WELCOME10') fail(400, 'Discount code is not valid.');
  const items = (state.carts[userId] || []).map(item => {
    const product = state.products.find(p => p.id === item.productId);
    if (!product) fail(409, 'A product is no longer available. Please update your cart.');
    return { ...item, product, lineTotalCents: product.priceCents * item.quantity };
  });
  const subtotalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0);
  const discountCents = code ? Math.round(subtotalCents * 0.1) : 0;
  return { items, subtotalCents, discountCents, totalCents: subtotalCents - discountCents, code };
}

function createCart(store) {
  return {
    cart(userId, code) { return cartFor(store.read(), userId, code); },
    setQuantity(userId, productId, quantity) {
      integer(quantity, 'Quantity', 0, MAX_CART_QUANTITY);
      return store.change(state => {
        const product = state.products.find(p => p.id === productId);
        if (!product) fail(404, 'Product not found.');
        if (quantity > product.stock) fail(409, `Only ${product.stock} available.`);
        const items = (state.carts[userId] || []).filter(i => i.productId !== productId);
        if (quantity) items.push({ productId, quantity });
        state.carts[userId] = items;
        return cartFor(state, userId);
      });
    },
  };
}

module.exports = { createCart, cartFor };
