const MAX_CART_QUANTITY = 99;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 200;
const MAX_SEARCH_LENGTH = 100;

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

module.exports = {
  ShopError, fail, text, integer, MAX_CART_QUANTITY,
  MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH, MAX_SEARCH_LENGTH,
};
