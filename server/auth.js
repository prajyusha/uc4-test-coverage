const { randomBytes, scryptSync, timingSafeEqual } = require('node:crypto');
const { fail, text, MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } = require('./validation');

function hash(password, salt = randomBytes(16).toString('hex')) {
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}
const publicUser = ({ id, email, role }) => ({ id, email, role });

function validatePassword(value) {
  if (typeof value !== 'string' || value.length > MAX_PASSWORD_LENGTH ||
      value.trim().length < MIN_PASSWORD_LENGTH)
    fail(400, `Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters.`);
  return value.trim();
}

function createAuth(store) {
  const sessions = new Map();
  const attempts = new Map();
  return {
    login(email, password, clientKey) {
      email = text(email, 'Email', 254).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(400, 'Enter a valid email address.');
      password = validatePassword(password);
      const now = Date.now();
      for (const [key, value] of attempts) if (value.until < now) attempts.delete(key);
      const key = `${clientKey}:${email}`;
      const attempt = attempts.get(key) || { count: 0, until: now + 900000 };
      if (attempt.count >= 10) fail(429, 'Too many login attempts. Try again in 15 minutes.');
      const user = store.read().users.find(u => u.email === email);
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
      return publicUser(store.read().users.find(u => u.id === session.userId));
    },
    logout(token) { sessions.delete(token); },
  };
}

module.exports = { createAuth, hash, validatePassword };
