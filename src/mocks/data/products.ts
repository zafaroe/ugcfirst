import type { Product } from '@/types'

export const mockProducts: Product[] = [
  {
    id: 'prod_1',
    name: 'Nike Air Max 90',
    image: '/images/products/nike-shoe.svg',
    source: 'url',
    url: 'https://example.com/products/nike-air-max',
    description: 'Classic sneaker with visible Air cushioning that revolutionized the sneaker industry.',
    features: ['Visible Air unit for cushioning', 'Leather and mesh upper', 'Rubber outsole for durability', 'Iconic design since 1990'],
    price: 129.99,
  },
  {
    id: 'prod_2',
    name: 'Smart Watch Pro',
    image: '/images/products/smart-watch.svg',
    source: 'url',
    url: 'https://example.com/products/smart-watch-pro',
    description: 'Advanced fitness tracking smartwatch with health monitoring features.',
    features: ['Heart rate monitor', 'GPS tracking', '7-day battery life', 'Water resistant 50m', 'Sleep tracking'],
    price: 199.99,
  },
  {
    id: 'prod_3',
    name: 'Wireless Headphones',
    image: '/images/products/headphones.svg',
    source: 'url',
    url: 'https://example.com/products/headphones',
    description: 'Premium noise-canceling headphones with studio-quality sound.',
    features: ['Active noise cancellation', '30hr battery life', 'Premium audio drivers', 'Comfortable over-ear design', 'Bluetooth 5.0'],
    price: 299.99,
  },
  {
    id: 'prod_4',
    name: 'Phone Mount Ultra',
    image: '/images/products/phone-mount.svg',
    source: 'manual',
    description: 'Universal car phone mount with strong magnetic hold.',
    features: ['360° rotation', 'One-hand operation', 'Strong magnetic grip', 'Universal compatibility', 'Easy installation'],
    price: 24.99,
  },
  {
    id: 'prod_5',
    name: 'Fitness Tracker Band',
    image: '/images/products/fitness-band.svg',
    source: 'url',
    url: 'https://example.com/products/fitness-tracker',
    description: 'Slim fitness tracker with comprehensive health monitoring.',
    features: ['24/7 heart rate', 'Step counter', 'Sleep analysis', 'Water resistant', '14-day battery'],
    price: 49.99,
  },
  {
    id: 'prod_6',
    name: 'Portable Blender',
    image: '/images/products/blender.svg',
    source: 'url',
    url: 'https://example.com/products/blender',
    description: 'Compact portable blender for smoothies on the go.',
    features: ['USB rechargeable', '6 blades', 'BPA-free', '380ml capacity', 'Self-cleaning'],
    price: 34.99,
  },
]

export function getProductById(id: string): Product | undefined {
  return mockProducts.find((p) => p.id === id)
}

export function getProductsBySource(source: Product['source']): Product[] {
  return mockProducts.filter((p) => p.source === source)
}

export function searchProducts(query: string): Product[] {
  const lowercaseQuery = query.toLowerCase()
  return mockProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(lowercaseQuery) ||
      p.description?.toLowerCase().includes(lowercaseQuery)
  )
}
