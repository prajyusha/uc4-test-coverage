import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { createAuth, hash } = require('../../server/auth')
const { createProducts } = require('../../server/products')

const tote = {
  id: 'tote', name: 'Everyday tote', description: 'A cotton bag for market days',
  category: 'Accessories', emoji: '👜', priceCents: 2800, stock: 20,
}
function storeFor(state) {
  return { read: () => state, change: operation => operation(state) }
}

describe('shop service', () => {
  it('signs in an existing customer', () => {
    const auth = createAuth(storeFor({
      users: [{ id: 'shopper', email: 'shopper@example.com', role: 'customer', password: hash('Shopper123!') }],
    }))
    const result = auth.login('shopper@example.com', 'Shopper123!', 'local')
    expect(result.user).toEqual({ id: 'shopper', email: 'shopper@example.com', role: 'customer' })
    expect(result.token).toBeTruthy()
  })

  it('lists products and finds a product by name', () => {
    const catalogue = createProducts(storeFor({ products: [tote] }))
    expect(catalogue.products()).toEqual([tote])
    expect(catalogue.products('tote')).toEqual([tote])
  })
})
