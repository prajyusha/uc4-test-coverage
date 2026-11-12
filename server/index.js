const express = require('express');
const path = require('node:path');
const { createShop, ShopError } = require('./shop');

function createApp(shop = createShop()) {
  const app = express();
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
    if (req.path.startsWith('/api/')) res.set('Cache-Control', 'no-store');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.headers.origin) {
      try {
        if (new URL(req.headers.origin).host !== req.headers.host)
          throw new ShopError(403, 'Cross-origin requests are not allowed.');
      } catch (error) { return next(error instanceof ShopError ? error : new ShopError(403, 'Invalid origin.')); }
    }
    next();
  });
  app.use(express.json({ limit: '16kb' }));
  const token = req => {
    const match = (req.headers.cookie || '').match(/(?:^|;\s*)shop_session=([a-f0-9]{64})(?:;|$)/);
    return match?.[1];
  };
  const authenticated = (req, res, next) => {
    try { req.user = shop.user(token(req)); next(); } catch (error) { next(error); }
  };
  app.get('/api/health', (req, res) => res.json({ ok: true }));
  app.get('/api/products', (req, res) => res.json(shop.products(req.query.q)));
  app.post('/api/login', (req, res) => {
    const result = shop.login(req.body?.email, req.body?.password, req.ip);
    res.cookie('shop_session', result.token, {
      httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production',
      maxAge: 28800000, path: '/',
    });
    res.json(result.user);
  });
  app.post('/api/logout', (req, res) => {
    shop.logout(token(req)); res.clearCookie('shop_session', { path: '/' }); res.sendStatus(204);
  });
  app.get('/api/me', authenticated, (req, res) => res.json(req.user));
  app.get('/api/cart', authenticated, (req, res) => res.json(shop.cart(req.user.id, req.query.code)));
  app.put('/api/cart/:id', authenticated, (req, res) =>
    res.json(shop.setQuantity(req.user.id, req.params.id, req.body?.quantity)));
  app.post('/api/checkout', authenticated, (req, res) =>
    res.status(201).json(shop.checkout(req.user.id, req.body || {})));
  app.post('/api/admin/products', authenticated, (req, res) =>
    res.status(201).json(shop.saveProduct(req.user, null, req.body || {})));
  app.put('/api/admin/products/:id', authenticated, (req, res) =>
    res.json(shop.saveProduct(req.user, req.params.id, req.body || {})));
  app.delete('/api/admin/products/:id', authenticated, (req, res) => {
    shop.deleteProduct(req.user, req.params.id); res.sendStatus(204);
  });
  app.use('/api', (req, res) => res.status(404).json({ error: 'API endpoint not found.' }));
  const dist = path.join(__dirname, '../client/dist');
  app.use(express.static(dist));
  app.get('*', (req, res, next) => res.sendFile(path.join(dist, 'index.html'), error => error && next(error)));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const status = error instanceof ShopError ? error.status :
      error.type === 'entity.parse.failed' ? 400 : error.type === 'entity.too.large' ? 413 : 500;
    if (status === 500) console.error(error);
    res.status(status).json({ error: status === 500 ? 'Something went wrong. Please try again.' :
      status === 400 && !(error instanceof ShopError) ? 'Invalid JSON request.' :
      status === 413 ? 'Request is too large.' : error.message });
  });
  return app;
}
if (require.main === module) createApp().listen(process.env.PORT || 3001, '0.0.0.0', () => console.log('Shop server ready'));
module.exports = { createApp };
