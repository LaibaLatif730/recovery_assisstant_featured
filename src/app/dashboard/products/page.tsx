'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { formatDate } from '@/lib/utils'
import { FieldError } from '@/components/FieldError'
import { productSchema } from '@/lib/validators'
import { useZodForm } from '@/hooks/useZodForm'

interface Product {
  id: string
  name: string
  category: string
  manufacturer: string | null
  description: string | null
  batches: { id: string; batchNumber: string; expiryDate: string; quantity: number | null }[]
  _count: { treatments: number }
}

const CATEGORIES = [
  { value: 'NEUROMODULATOR', label: 'Neuromodulator' },
  { value: 'HYALURONIC_ACID_FILLER', label: 'HA Filler' },
  { value: 'CALCIUM_HYDROXYLAPATITE_FILLER', label: 'CaHA Filler' },
  { value: 'POLY_L_LACTIC_FILLER', label: 'PLLA Filler' },
  { value: 'BIOSTIMULATOR', label: 'Biostimulator' },
  { value: 'REGENERATIVE', label: 'Regenerative' },
  { value: 'SKIN_BOOSTER', label: 'Skin Booster' },
  { value: 'THREAD', label: 'Thread' },
  { value: 'FAT_DISSOLVING', label: 'Fat Dissolving' },
  { value: 'OTHER', label: 'Other' },
]

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showBatchForm, setShowBatchForm] = useState<string | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState({ name: '', category: 'NEUROMODULATOR', manufacturer: '', description: '' })
  const [editForm, setEditForm] = useState({ name: '', category: '', manufacturer: '', description: '' })
  const [batchForm, setBatchForm] = useState({ batchNumber: '', expiryDate: '', quantity: '' })
  const [error, setError] = useState('')
  const productForm = useZodForm(productSchema)

  useEffect(() => { fetchProducts() }, [])

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      setProducts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!productForm.validate(form)) {
      return
    }
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setShowForm(false)
        setForm({ name: '', category: 'NEUROMODULATOR', manufacturer: '', description: '' })
        fetchProducts()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to create product')
      }
    } catch {
      setError('Failed to create product')
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setEditForm({
      name: product.name,
      category: product.category,
      manufacturer: product.manufacturer || '',
      description: product.description || '',
    })
  }

  const handleUpdate = async () => {
    setError('')
    try {
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingProduct?.id, ...editForm }),
      })
      if (res.ok) {
        setEditingProduct(null)
        fetchProducts()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to update product')
      }
    } catch {
      setError('Failed to update product')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    setError('')
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' })
      if (res.ok) fetchProducts()
      else setError('Failed to delete product')
    } catch {
      setError('Failed to delete product')
    }
  }

  const isExpiringSoon = (date: string) => {
    const expiry = new Date(date)
    const now = new Date()
    const daysUntil = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    return daysUntil < 90
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Products & Inventory</h1>
          <p className="text-muted-foreground">Manage products, batches, and inventory</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ Add Product'}</Button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      {showForm && (
        <Card>
          <CardHeader><CardTitle>New Product</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Product Name *</label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g., Botox 100u" maxLength={100} />
                  <FieldError error={productForm.getFieldError('name')} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category *</label>
                  <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Manufacturer</label>
                  <Input value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} placeholder="e.g., Allergan" maxLength={100} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Product description" maxLength={500} />
                </div>
              </div>
              <Button type="submit">Create Product</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Edit Product</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setEditingProduct(null)}>Cancel</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Product Name</label>
                <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Manufacturer</label>
                <Input value={editForm.manufacturer} onChange={(e) => setEditForm({ ...editForm, manufacturer: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
              </div>
            </div>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Product Catalog</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
          ) : products.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No products configured</p>
          ) : (
            <div className="space-y-4">
              {products.map(product => (
                <div key={product.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">{product.category.replace(/_/g, ' ')} {product.manufacturer && `• ${product.manufacturer}`}</p>
                      {product.description && <p className="text-sm text-muted-foreground mt-1">{product.description}</p>}
                      <p className="text-sm text-muted-foreground">Used in {product._count.treatments} treatments</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(product)}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(product.id)}>Delete</Button>
                      <Button size="sm" variant="outline" onClick={() => setShowBatchForm(showBatchForm === product.id ? null : product.id)}>
                        {showBatchForm === product.id ? 'Close' : '+ Batch'}
                      </Button>
                    </div>
                  </div>

                  {product.batches.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {product.batches.map(batch => (
                        <div key={batch.id} className="flex items-center justify-between p-2 bg-white/5 rounded text-sm">
                          <div className="flex items-center gap-3">
                            <span>Lot: {batch.batchNumber}</span>
                            {batch.quantity && <span>Qty: {batch.quantity}</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={isExpiringSoon(batch.expiryDate) ? 'text-orange-400' : 'text-muted-foreground'}>
                              Exp: {formatDate(batch.expiryDate)}
                            </span>
                            {isExpiringSoon(batch.expiryDate) && <Badge variant="secondary">Expiring Soon</Badge>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {showBatchForm === product.id && (
                    <div className="mt-3 p-3 border rounded bg-white/5">
                      <div className="flex gap-4 items-end">
                        <Input placeholder="Batch Number" value={batchForm.batchNumber} onChange={(e) => setBatchForm({ ...batchForm, batchNumber: e.target.value })} />
                        <Input type="date" placeholder="Expiry Date" value={batchForm.expiryDate} onChange={(e) => setBatchForm({ ...batchForm, expiryDate: e.target.value })} />
                        <Input type="number" placeholder="Quantity" value={batchForm.quantity} onChange={(e) => setBatchForm({ ...batchForm, quantity: e.target.value })} />
                        <Button size="sm" onClick={async () => {
                          await fetch('/api/products', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: product.id, batch: batchForm }),
                          })
                          setBatchForm({ batchNumber: '', expiryDate: '', quantity: '' })
                          setShowBatchForm(null)
                          fetchProducts()
                        }}>Save</Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
