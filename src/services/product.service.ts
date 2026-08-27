import { createClient } from '@/lib/supabase/client'
import type { Product, InventoryMovement } from '@/types/database.types'
import type { ProductFormData, InventoryMovementFormData } from '@/schemas/product.schema'

const STORAGE_KEY_PRODUCTS = 'filmcontrol_products'
const STORAGE_KEY_MOVEMENTS = 'filmcontrol_movements'

const initialSeedProducts: Product[] = [
  {
    id: 'p1',
    company_id: 'comp1',
    name: 'Película G5 Premium 1.52m (Rolo 30m)',
    category: 'Película Automotiva',
    brand: 'Insulfilm Pro',
    unit: 'm',
    quantity: 45.0,
    min_quantity: 15.0,
    cost: 18.0,
    supplier: 'Distribuidora São Paulo',
    notes: 'Rolo principal para laterais e traseiro.',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'p2',
    company_id: 'comp1',
    name: 'Película Nano Cerâmica IR90 1.52m',
    category: 'Película Premium',
    brand: '3M Crystalline',
    unit: 'm',
    quantity: 18.5,
    min_quantity: 8.0,
    cost: 65.0,
    supplier: 'Distribuidora 3M Brasil',
    notes: 'Alta rejeição térmica, produto de alto valor agregado.',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'p3',
    company_id: 'comp1',
    name: 'Película Jateada Privacidade 1.20m',
    category: 'Película Arquitetura / Residencial',
    brand: 'Avery Dennison',
    unit: 'm',
    quantity: 28.0,
    min_quantity: 10.0,
    cost: 22.0,
    supplier: 'Suprimentos Glass',
    notes: 'Para banheiros, sacadas e divisórias residenciais.',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'p4',
    company_id: 'comp1',
    name: 'Película Carbon 70% 1.52m',
    category: 'Película Automotiva',
    brand: 'Llumar',
    unit: 'm',
    quantity: 6.0,
    min_quantity: 10.0, // Alerta de estoque baixo!
    cost: 38.0,
    supplier: 'Llumar Imports',
    notes: 'Estoque baixo - solicitar reposição com fornecedor.',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'p5',
    company_id: 'comp1',
    name: 'Solução Concentrada de Aplicação 1L',
    category: 'Insumos & Ferramentas',
    brand: 'FilmCleaner',
    unit: 'un',
    quantity: 14.0,
    min_quantity: 5.0,
    cost: 15.0,
    supplier: 'Distribuidora São Paulo',
    notes: 'Rende até 50 litros de solução diluída.',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'p6',
    company_id: 'comp1',
    name: 'Espátula Squeegee com Feltro Profissional',
    category: 'Insumos & Ferramentas',
    brand: 'ProTools',
    unit: 'un',
    quantity: 4.0,
    min_quantity: 5.0, // Estoque baixo
    cost: 25.0,
    supplier: 'Ferramentas Brasil',
    notes: 'Espátula para acabamento sem riscar películas.',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
]

function getLocalProducts(): Product[] {
  if (typeof window === 'undefined') return initialSeedProducts
  const data = localStorage.getItem(STORAGE_KEY_PRODUCTS)
  if (!data) {
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(initialSeedProducts))
    return initialSeedProducts
  }
  try {
    return JSON.parse(data)
  } catch {
    return initialSeedProducts
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

      if (error || !data || data.length === 0) {
        return getLocalProducts()
      }
      return data
    } catch {
      return getLocalProducts()
    }
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

        if (userProfile?.company_id) {
          const { data: newProd, error } = await supabase
            .from('products')
            .insert({
              company_id: userProfile.company_id,
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
