import { createClient } from '@/lib/supabase/client'
import type { Product, InventoryMovement } from '@/types/database.types'
import type { ProductFormData, InventoryMovementFormData } from '@/schemas/product.schema'

const STORAGE_KEY_PRODUCTS = 'filmcontrol_products'

function getLocalProducts(): Product[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(STORAGE_KEY_PRODUCTS)
  if (!data) return []
  try {
    return JSON.parse(data)
  } catch {
    return []
  }
}

function saveLocalProducts(products: Product[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products))
  }
}

export const productService = {
  async list(): Promise<Product[]> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true })

      if (!error && data) {
        return data
      }
    } catch {
      // Fallback
    }

    return getLocalProducts()
  },

  async create(data: ProductFormData): Promise<Product> {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: userProfile } = await supabase
          .from('users')
          .select('company_id')
          .eq('id', user.id)
          .single()

        let companyId = userProfile?.company_id
        if (!companyId) {
          const { data: comp } = await supabase.from('companies').select('id').limit(1).single()
          companyId = comp?.id
        }

        if (companyId) {
          const { data: newProd, error } = await supabase
            .from('products')
            .insert({
              company_id: companyId,
              name: data.name,
              category: data.category || null,
              brand: data.brand || null,
              unit: data.unit,
              quantity: data.quantity,
              min_quantity: data.min_quantity,
              cost: data.cost,
              supplier: data.supplier || null,
              notes: data.notes || null,
            })
            .select()
            .single()

          if (!error && newProd) return newProd
        }
      }
    } catch {
      // Fallback
    }

    const newProd: Product = {
      id: 'p_' + Date.now(),
      company_id: 'comp1',
      name: data.name,
      category: data.category || null,
      brand: data.brand || null,
      unit: data.unit,
      quantity: data.quantity,
      min_quantity: data.min_quantity,
      cost: data.cost,
      supplier: data.supplier || null,
      notes: data.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const currentList = getLocalProducts()
    saveLocalProducts([...currentList, newProd])
    return newProd
  },

  async update(id: string, data: Partial<ProductFormData>): Promise<Product> {
    try {
      const supabase = createClient()
      const { data: updated, error } = await supabase
        .from('products')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (!error && updated) return updated
    } catch {
      // Fallback
    }

    const currentList = getLocalProducts()
    const index = currentList.findIndex((p) => p.id === id)
    if (index !== -1) {
      currentList[index] = {
        ...currentList[index],
        ...data,
        updated_at: new Date().toISOString(),
      }
      saveLocalProducts(currentList)
      return currentList[index]
    }

    throw new Error('Produto não encontrado')
  },

  async recordMovement(data: InventoryMovementFormData): Promise<Product> {
    const currentList = getLocalProducts()
    const index = currentList.findIndex((p) => p.id === data.product_id)
    if (index === -1) throw new Error('Produto não encontrado')

    const product = currentList[index]
    let newQty = Number(product.quantity)

    if (data.type === 'ENTRADA') {
      newQty += Number(data.quantity)
    } else if (data.type === 'SAIDA') {
      newQty = Math.max(0, newQty - Number(data.quantity))
    } else if (data.type === 'AJUSTE') {
      newQty = Number(data.quantity)
    }

    product.quantity = Number(newQty.toFixed(2))
    product.updated_at = new Date().toISOString()
    saveLocalProducts(currentList)

    return product
  },

  async delete(id: string): Promise<void> {
    try {
      const supabase = createClient()
      await supabase.from('products').delete().eq('id', id)
    } catch {
      // Fallback
    }

    const currentList = getLocalProducts()
    saveLocalProducts(currentList.filter((p) => p.id !== id))
  },
}
