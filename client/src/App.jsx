import { useEffect, useState } from 'react'
import './App.css'

const money = cents => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
async function api(path, method = 'GET', body) {
  const response = await fetch(`/api${path}`, {
    method, credentials: 'same-origin',
    ...(body !== undefined ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
  })
  const data = response.status === 204 ? null : await response.json()
  if (!response.ok) {
    const error = new Error(data?.error || 'Unable to complete your request.')
    error.status = response.status
    throw error
  }
  return data
}
const blankProduct = { name: '', description: '', category: 'Home', emoji: '📦', price: '', stock: '10' }

export default function App() {
  const [user, setUser] = useState(null)
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [view, setView] = useState('shop')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [code, setCode] = useState('')
  const [order, setOrder] = useState(null)
  const [editing, setEditing] = useState(null)
  const [draft, setDraft] = useState(blankProduct)

  useEffect(() => {
    let active = true
    Promise.all([
      api('/products'),
      api('/me').catch(e => { if (e.status === 401) return null; throw e }),
    ]).then(async ([items, account]) => {
      const currentCart = account ? await api('/cart') : null
      if (active) { setProducts(items); setUser(account); setCart(currentCart) }
    }).catch(e => active && setError(e.message))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  async function perform(action) {
    if (busy) return
    setBusy(true); setError(''); setNotice('')
    try { await action() }
    catch (e) {
      setError(e.message || 'Connection failed. Please try again.')
      if (e.status === 401) { setUser(null); setCart(null); setView('login') }
    } finally { setBusy(false) }
  }
  function navigate(next) { setView(next); setError(''); setNotice('') }
  async function quantity(id, amount) {
    await api(`/cart/${id}`, 'PUT', { quantity: amount })
    setCart(await api(`/cart${cart?.code ? `?code=${encodeURIComponent(cart.code)}` : ''}`))
  }
  const count = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0
  const categories = ['All', ...new Set(products.map(p => p.category))]
  const visible = products.filter(p =>
    (category === 'All' || p.category === category) &&
    `${p.name} ${p.description} ${p.category}`.toLowerCase().includes(query.toLowerCase().trim()))
  function field(name, value) { setDraft(current => ({ ...current, [name]: value })) }

  return <div className="app">
    <div className="announcement">Thoughtfully chosen. Made for everyday. <span>Free delivery on every order.</span></div>
    <header>
      <button className="brand" onClick={() => navigate('shop')} aria-label="Common Ground home">common<span>ground</span><i>✳</i></button>
      <nav aria-label="Main navigation">
        <button className={view === 'shop' ? 'active' : ''} onClick={() => navigate('shop')}>Shop collection</button>
        {user?.role === 'admin' && <button className={view === 'admin' ? 'active' : ''} onClick={() => navigate('admin')}>Manage products</button>}
      </nav>
      <div className="account">
        {user ? <><span className="identity">{user.email}</span><button disabled={busy} onClick={() => perform(async () => {
          await api('/logout', 'POST'); setUser(null); setCart(null); setOrder(null); setCode(''); navigate('shop')
        })}>Log out</button></> : <button onClick={() => navigate('login')}>Log in ↗</button>}
        <button className="bag" onClick={() => navigate(user ? 'cart' : 'login')}>Bag <span>{count}</span></button>
      </div>
    </header>
    <main>
      {error && <div className="alert error" role="alert">{error}<button onClick={() => setError('')} aria-label="Dismiss error">×</button></div>}
      {notice && <div className="alert success" role="status">{notice}</div>}
      {loading ? <div className="empty" role="status">Opening the shop…</div> : <>
        {view === 'shop' && <>
          <section className="hero">
            <div><div className="eyebrow">THE EVERYDAY COLLECTION / 01</div><h1>Good things.<br />For your <em>everyday.</em></h1><p>Less, but better. Discover considered essentials<br className="desktop" /> that make the ordinary a little extraordinary.</p>
              <a className="primary link" href="#collection">Explore the collection <span>↗</span></a>
              <div className="hero-note"><span>✳</span> Small details. A big difference.</div>
            </div>
            <div className="hero-art" aria-hidden="true"><span className="art-label">Objects worth keeping.</span><div className="orb orb-one">🎧</div><div className="orb orb-two">☕</div><div className="orb orb-three">👜</div><span className="art-footer">CURATED WITH CARE <b>↗</b></span></div>
          </section>
          <section id="collection">
            <div className="section-heading"><div><div className="eyebrow">FIND YOUR NEXT FAVORITE</div><h2>The collection <sup>{products.length}</sup></h2></div>
              <label className="search"><span aria-hidden="true">⌕</span><input aria-label="Search products" placeholder="Search everyday essentials…" value={query} maxLength={100} onChange={e => setQuery(e.target.value)} /></label>
            </div>
            <div className="collection-tools"><div className="tabs">{categories.map(c => <button key={c} className={category === c ? 'selected' : ''} onClick={() => setCategory(c)}>{c}</button>)}</div><span>{visible.length} essentials</span></div>
            {visible.length ? <div className="grid">{visible.map((p, i) => <article className="product" key={p.id}>
              <div className={`product-image tone-${i % 4}`}><span className="product-category">{p.category}</span><span className="product-emoji" aria-hidden="true">{p.emoji}</span><span className="stock-tag">{p.stock ? `${p.stock} in stock` : 'Sold out'}</span></div>
              <div className="product-title"><h3>{p.name}</h3><strong>{money(p.priceCents)}</strong></div><p>{p.description}</p>
              <button className="add-button" disabled={busy || !p.stock} onClick={() => {
                if (!user) { navigate('login'); return }
                perform(async () => {
                  const current = cart?.items.find(item => item.productId === p.id)?.quantity || 0
                  await quantity(p.id, current + 1); setNotice(`${p.name} added to your bag.`)
                })
              }}>{p.stock ? 'Add to bag' : 'Out of stock'} <span>＋</span></button>
            </article>)}</div> : <div className="empty"><h3>No products found</h3><p>Try another search or category.</p><button onClick={() => { setQuery(''); setCategory('All') }}>Clear filters</button></div>}
          </section>
          <section className="values"><div><b>◈</b><h3>Considered essentials</h3><p>Useful things, thoughtfully selected.</p></div><div><b>↗</b><h3>On the house</h3><p>Complimentary delivery, every time.</p></div><div><b>✳</b><h3>A warm welcome</h3><p>Take 10% off with WELCOME10.</p></div></section>
        </>}
        {view === 'login' && <section className="form-panel"><div className="eyebrow">MAKE YOURSELF AT HOME</div><h1>Welcome back.</h1><p>Log in to save your bag and place an order.</p>
          <form onSubmit={e => { e.preventDefault(); const form = new FormData(e.currentTarget); perform(async () => {
            const account = await api('/login', 'POST', Object.fromEntries(form))
            setUser(account); setCart(await api('/cart')); setOrder(null); setCode(''); navigate('shop')
          }) }}>
            <label>Email<input name="email" type="email" autoComplete="username" required maxLength={254} /></label>
            <label>Password<input name="password" type="password" autoComplete="current-password" required maxLength={200} /></label>
            <button className="primary" disabled={busy}>{busy ? 'Logging in…' : 'Log in →'}</button>
          </form>
          <aside className="demo"><b>Try the demo</b><p>Shopper: shopper@example.com / Shopper123!</p><p>Admin: admin@example.com / Admin123!</p><small>Demo accounts only. Do not enter real personal or payment information.</small></aside>
        </section>}
        {view === 'cart' && user && <section className="page-section"><div className="eyebrow">YOUR EVERYDAY FAVORITES</div><h1>Your bag.</h1>
          {order && <div className="confirmation" role="status"><h2>Thanks, {order.name}!</h2><p>Order {order.id.slice(0, 8)} is confirmed. Total: {money(order.totalCents)}.</p><p>This is a demo order. No payment was taken.</p><button onClick={() => navigate('shop')}>Continue shopping ↗</button></div>}
          {!cart?.items.length ? !order && <div className="empty"><h2>A little room for something good.</h2><p>Your bag is empty.</p><button className="primary" onClick={() => navigate('shop')}>Explore the collection</button></div> : <div className="checkout-layout"><div>
            {cart.items.map(item => <article className="cart-item" key={item.productId}><span className="cart-symbol" aria-hidden="true">{item.product.emoji}</span><div><h3>{item.product.name}</h3><p>{money(item.product.priceCents)} each · {item.product.stock} available</p>
              <div className="quantity"><button aria-label={`Decrease ${item.product.name}`} disabled={busy} onClick={() => perform(() => quantity(item.productId, item.quantity - 1))}>−</button><span>{item.quantity}</span><button aria-label={`Increase ${item.product.name}`} disabled={busy || item.quantity >= item.product.stock || item.quantity >= 99} onClick={() => perform(() => quantity(item.productId, item.quantity + 1))}>＋</button><button className="text-button" disabled={busy} onClick={() => perform(() => quantity(item.productId, 0))}>Remove</button></div></div><strong>{money(item.lineTotalCents)}</strong></article>)}
            <button className="text-button" onClick={() => navigate('shop')}>← Continue shopping</button>
          </div><aside className="summary"><h2>Order summary</h2><div className="total-row"><span>Subtotal</span><b>{money(cart.subtotalCents)}</b></div><div className="total-row"><span>Delivery</span><b>Free</b></div>
            <form className="discount" onSubmit={e => { e.preventDefault(); perform(async () => {
              setCart(await api(`/cart?code=${encodeURIComponent(code)}`)); setNotice(code.trim() ? 'Discount applied.' : 'Discount removed.')
            }) }}><label>Discount code<input value={code} maxLength={40} placeholder="WELCOME10" onChange={e => setCode(e.target.value)} /></label><button disabled={busy}>Apply</button></form>
            {cart.code && <div className="total-row discount-row"><span>{cart.code}</span><b>−{money(cart.discountCents)}</b></div>}
            <div className="total-row grand-total"><span>Total</span><b>{money(cart.totalCents)}</b></div>
            <form onSubmit={e => { e.preventDefault(); const data = Object.fromEntries(new FormData(e.currentTarget)); perform(async () => {
              const placed = await api('/checkout', 'POST', { ...data, code: cart.code })
              setOrder(placed); setCart(await api('/cart')); setProducts(await api('/products')); setCode('')
            }) }}>
              <label>Full name<input name="name" autoComplete="name" required maxLength={100} /></label>
              <label>Delivery address<textarea name="address" autoComplete="street-address" required maxLength={500} /></label>
              <button className="primary" disabled={busy}>{busy ? 'Placing order…' : 'Place demo order →'}</button><small>No payment required. This is a demo checkout.</small>
            </form>
          </aside></div>}
        </section>}
        {view === 'admin' && user?.role === 'admin' && <section className="page-section"><div className="eyebrow">ADMINISTRATION</div><h1>Product studio.</h1><p>Keep the collection fresh. Changes are saved to the shop.</p>
          <div className="admin-layout"><form className="summary" onSubmit={e => { e.preventDefault(); perform(async () => {
            const price = Number(draft.price)
            if (!Number.isFinite(price) || price <= 0 || !/^\d+(\.\d{1,2})?$/.test(draft.price)) throw new Error('Enter a positive price with at most two decimal places.')
            await api(`/admin/products${editing ? `/${editing}` : ''}`, editing ? 'PUT' : 'POST', {
              name: draft.name, description: draft.description, category: draft.category,
              emoji: draft.emoji, priceCents: Math.round(price * 100), stock: Number(draft.stock),
            })
            setProducts(await api('/products')); setEditing(null); setDraft(blankProduct); setNotice('Product saved.')
          }) }}>
            <h2>{editing ? 'Edit product' : 'Add a product'}</h2>
            {[['name', 'Product name', 'text', 100], ['category', 'Category', 'text', 40], ['emoji', 'Product symbol', 'text', 8]].map(([key, label, type, max]) => <label key={key}>{label}<input type={type} value={draft[key]} required maxLength={max} onChange={e => field(key, e.target.value)} /></label>)}
            <label>Description<textarea value={draft.description} required maxLength={1000} onChange={e => field('description', e.target.value)} /></label>
            <div className="form-row"><label>Price (USD)<input type="number" min="0.01" max="100000" step="0.01" required value={draft.price} onChange={e => field('price', e.target.value)} /></label><label>Stock<input type="number" min="0" max="10000" step="1" required value={draft.stock} onChange={e => field('stock', e.target.value)} /></label></div>
            <button className="primary" disabled={busy}>{busy ? 'Saving…' : 'Save product'}</button>{editing && <button type="button" onClick={() => { setEditing(null); setDraft(blankProduct) }}>Cancel editing</button>}
          </form><div className="admin-products">{products.map(p => <article className="admin-item" key={p.id}><span aria-hidden="true">{p.emoji}</span><div><h3>{p.name}</h3><p>{money(p.priceCents)} · {p.stock} in stock</p></div><button disabled={busy} onClick={() => { setEditing(p.id); setDraft({ ...p, price: (p.priceCents / 100).toFixed(2), stock: String(p.stock) }) }}>Edit</button><button className="danger" disabled={busy} onClick={() => {
            if (window.confirm(`Delete ${p.name}? It will also be removed from all bags.`)) perform(async () => {
              await api(`/admin/products/${p.id}`, 'DELETE'); setProducts(await api('/products')); setCart(await api('/cart'))
              if (editing === p.id) { setEditing(null); setDraft(blankProduct) }
              setNotice('Product deleted.')
            })
          }}>Delete</button></article>)}</div></div>
        </section>}
      </>}
    </main>
    <footer><div className="footer-brand">common ground ✳<p>Good things. For the way you live.</p></div><p>A considered collection of everyday essentials.</p><span>© {new Date().getFullYear()} Common Ground · Demo shop</span></footer>
  </div>
}
