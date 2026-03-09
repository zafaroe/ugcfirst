'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import { Package, Link2, PenLine, Trash2, ExternalLink, Video } from 'lucide-react'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Modal, ConfirmModal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { StaggerContainer, StaggerItem, EASINGS, GlassCard, GradientCard } from '@/components/ui'
import { ManualProductForm, isManualProductValid, ProductPreview, EmptyState, emptyStatePresets } from '@/components/composed'
import type { ManualProductData } from '@/components/composed'
import type { FetchedProduct } from '@/types/generation'
import { getBrowserClient } from '@/lib/supabase'
import { cn, formatRelativeTime } from '@/lib/utils'

// Saved product from database
interface SavedProduct {
  id: string
  name: string
  description: string | null
  image_url: string
  images: string[]
  price: string | null
  features: string[]
  source: 'url' | 'manual'
  source_url: string | null
  generation_count: number
  last_used_at: string | null
  created_at: string
}

type InputMode = 'url' | 'manual'

// Animation variants
const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: EASINGS.easeOut,
    },
  },
}

const filtersVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.2,
      duration: 0.4,
      ease: EASINGS.easeOut,
    },
  },
}

export default function ProductsPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [products, setProducts] = useState<SavedProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SavedProduct | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Add product modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [inputMode, setInputMode] = useState<InputMode>('url')
  const [productUrl, setProductUrl] = useState('')
  const [manualProduct, setManualProduct] = useState<ManualProductData | null>(null)
  const [isFetching, setIsFetching] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [router])

  const fetchProducts = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const supabase = getBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/products', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        cache: 'no-store',
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        throw new Error(data.error || `Failed to fetch products (${response.status})`)
      }
      setProducts(data.products || [])
    } catch (err) {
      console.error('Error fetching products:', err)
      setError(err instanceof Error ? err.message : 'Failed to load products')
    } finally {
      setIsLoading(false)
    }
  }

  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const canStartManual = manualProduct ? isManualProductValid(manualProduct) : false

  // Save product to library
  const saveProduct = async (product: FetchedProduct, source: 'url' | 'manual', sourceUrl?: string) => {
    try {
      const supabase = getBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: product.name,
          description: product.description,
          imageUrl: product.image,
          images: product.images || [],
          price: product.price,
          features: product.features,
          source,
          sourceUrl,
        }),
      })

      if (response.ok) {
        addToast({ variant: 'success', title: 'Product added to library' })
        await fetchProducts()
        resetAddModal()
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save product')
      }
    } catch (e) {
      addToast({
        variant: 'error',
        title: e instanceof Error ? e.message : 'Failed to save product',
      })
    }
  }

  const fetchProductFromUrl = async () => {
    if (!isValidUrl(productUrl)) return
    setIsFetching(true)
    setFetchError(null)

    try {
      const response = await fetch('/api/product/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: productUrl }),
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error || 'Failed to extract product')

      await saveProduct(data.product, 'url', productUrl)
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : 'Failed to fetch product')
    } finally {
      setIsFetching(false)
    }
  }

  const handleManualSubmit = async () => {
    if (!manualProduct || !isManualProductValid(manualProduct)) return

    setIsFetching(true)
    const product: FetchedProduct = {
      name: manualProduct.name,
      description: manualProduct.description || '',
      price: manualProduct.price || '',
      image: manualProduct.imagePreview || '',
      features: manualProduct.features.filter((f: string) => f.trim()),
      source: 'manual',
    }
    await saveProduct(product, 'manual')
    setIsFetching(false)
  }

  const resetAddModal = () => {
    setIsAddModalOpen(false)
    setInputMode('url')
    setProductUrl('')
    setManualProduct(null)
    setFetchError(null)
  }

  const handleDelete = (product: SavedProduct) => {
    setDeleteTarget(product)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return

    setIsDeleting(true)
    try {
      const supabase = getBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        router.push('/login')
        return
      }

      const response = await fetch(`/api/products/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete product')
      }

      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      addToast({
        variant: 'success',
        title: 'Product deleted successfully',
      })
    } catch (err) {
      console.error('Error deleting product:', err)
      addToast({
        variant: 'error',
        title: err instanceof Error ? err.message : 'Failed to delete product',
      })
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const renderProductGrid = () => {
    if (isLoading) {
      return (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[4/5] skeleton rounded-xl" />
          ))}
        </div>
      )
    }

    if (error) {
      return (
        <div className="text-center py-8">
          <p className="text-status-error mb-4">{error}</p>
          <Button variant="secondary" onClick={() => fetchProducts()}>
            Try Again
          </Button>
        </div>
      )
    }

    if (filteredProducts.length === 0) {
      const isSearching = searchQuery.length > 0
      const hasAnyProducts = products.length > 0

      if (isSearching) {
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <EmptyState
              {...emptyStatePresets.noSearchResults}
              action={{
                label: 'Clear Search',
                onClick: () => setSearchQuery(''),
                variant: 'secondary',
              }}
              size="md"
            />
          </motion.div>
        )
      }

      if (!hasAnyProducts) {
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <EmptyState
              icon={<Package className="w-12 h-12" />}
              title="No products yet"
              description="Add your first product to start creating videos"
              action={{
                label: 'Add Product',
                onClick: () => setIsAddModalOpen(true),
                icon: <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />,
              }}
              size="md"
            />
          </motion.div>
        )
      }
    }

    return (
      <StaggerContainer
        className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        staggerDelay={0.08}
        initialDelay={0.1}
      >
        <AnimatePresence mode="popLayout">
          {filteredProducts.map((product) => (
            <StaggerItem key={product.id}>
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <ProductCard
                  product={product}
                  onDelete={() => handleDelete(product)}
                />
              </motion.div>
            </StaggerItem>
          ))}
        </AnimatePresence>
      </StaggerContainer>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          variants={headerVariants}
          initial="hidden"
          animate="visible"
        >
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Products</h1>
            <p className="text-text-muted mt-1">
              Manage your product library for video creation
            </p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <FontAwesomeIcon icon={faPlus} className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </motion.div>

        {/* Search */}
        <motion.div
          variants={filtersVariants}
          initial="hidden"
          animate="visible"
        >
          <GlassCard padding="sm">
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<FontAwesomeIcon icon={faMagnifyingGlass} className="w-4 h-4" />}
              className="focus:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-shadow"
            />
          </GlassCard>
        </motion.div>

        {/* Product Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4, ease: EASINGS.easeOut }}
        >
          {renderProductGrid()}
        </motion.div>
      </div>

      {/* Add Product Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={resetAddModal}
        title="Add Product"
        size="lg"
      >
        <div className="space-y-6">
          {/* Mode Toggle */}
          <div className="flex items-center justify-center gap-1 p-1 bg-cream rounded-lg w-fit mx-auto">
            <button
              onClick={() => setInputMode('url')}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2',
                inputMode === 'url'
                  ? 'bg-surface text-text-primary shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              <Link2 className="w-4 h-4" />
              Paste URL
            </button>
            <button
              onClick={() => setInputMode('manual')}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2',
                inputMode === 'manual'
                  ? 'bg-surface text-text-primary shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              <PenLine className="w-4 h-4" />
              Manual Entry
            </button>
          </div>

          {/* URL Input Mode */}
          {inputMode === 'url' && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <Input
                  placeholder="https://your-store.com/product/awesome-product"
                  value={productUrl}
                  onChange={(e) => {
                    setProductUrl(e.target.value)
                    setFetchError(null)
                  }}
                  className="flex-1"
                />
                <Button
                  onClick={fetchProductFromUrl}
                  disabled={!isValidUrl(productUrl) || isFetching}
                  isLoading={isFetching}
                >
                  Extract
                </Button>
              </div>
              {fetchError && (
                <p className="text-sm text-status-error">{fetchError}</p>
              )}
              <p className="text-xs text-text-muted">
                Paste any product URL from Shopify, Amazon, AliExpress, or any other store
              </p>
            </div>
          )}

          {/* Manual Entry Mode */}
          {inputMode === 'manual' && (
            <div className="space-y-4">
              <ManualProductForm onChange={setManualProduct} />
              <Button
                onClick={handleManualSubmit}
                disabled={!canStartManual || isFetching}
                isLoading={isFetching}
                className="w-full"
              >
                Add Product
              </Button>
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Product"
        description={`Are you sure you want to delete "${deleteTarget?.name || 'this product'}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={isDeleting}
      />
    </DashboardLayout>
  )
}

// Product Card Component
function ProductCard({
  product,
  onDelete,
}: {
  product: SavedProduct
  onDelete: () => void
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      className="relative rounded-xl border border-border-default bg-surface overflow-hidden group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      {/* Image */}
      <div className="aspect-square bg-cream overflow-hidden relative">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Source badge */}
        <div className="absolute top-2 left-2">
          <span className={cn(
            'inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full',
            product.source === 'url'
              ? 'bg-blue-500/10 text-blue-500'
              : 'bg-purple-500/10 text-purple-500'
          )}>
            {product.source === 'url' ? (
              <>
                <Link2 className="w-3 h-3" />
                Imported
              </>
            ) : (
              <>
                <PenLine className="w-3 h-3" />
                Manual
              </>
            )}
          </span>
        </div>

        {/* Delete button (on hover) */}
        <AnimatePresence>
          {isHovered && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-status-error/90 text-white flex items-center justify-center shadow-lg hover:bg-status-error transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Info */}
      <div className="p-4 space-y-2">
        <h4 className="font-medium text-text-primary truncate">
          {product.name}
        </h4>

        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Video className="w-3.5 h-3.5" />
          <span>
            {product.generation_count > 0
              ? `${product.generation_count} video${product.generation_count > 1 ? 's' : ''} created`
              : 'No videos yet'}
          </span>
        </div>

        {product.last_used_at && (
          <p className="text-xs text-text-muted">
            Last used {formatRelativeTime(product.last_used_at)}
          </p>
        )}

        {product.source_url && (
          <a
            href={product.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-mint hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-3 h-3" />
            View original
          </a>
        )}
      </div>
    </motion.div>
  )
}
