const { fail, text, integer, MAX_SEARCH_LENGTH } = require('./validation');

function validateProduct(data) {
  return {
    name: text(data.name, 'Name', 100),
    description: text(data.description, 'Description', 1000),
    category: text(data.category, 'Category', 40),
    emoji: text(data.emoji, 'Product symbol', 8),
    priceCents: integer(data.priceCents, 'Price in cents', 1, 10000000),
    stock: integer(data.stock, 'Stock', 0, 10000),
  };
}

function createProducts(store) {
  return {
    products(query = '') {
      if (typeof query !== 'string' || query.length > MAX_SEARCH_LENGTH)
        fail(400, `Search must be at most ${MAX_SEARCH_LENGTH} characters.`);
      const q = query.trim().toLowerCase();
      return store.read().products.filter(p =>
        `${p.name} ${p.description} ${p.category}`.toLowerCase().includes(q));
    },
  };
}

module.exports = { createProducts, validateProduct };
