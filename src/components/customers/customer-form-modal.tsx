'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Search, MapPin, Building, Phone, User, FileText } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { customerSchema, type CustomerFormData } from '@/schemas/customer.schema'
import { customerService, type CustomerWithRelations } from '@/services/customer.service'
import { toast } from '@/hooks/use-toast'

interface CustomerFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerToEdit?: CustomerWithRelations | null
  onSuccess: (customer: CustomerWithRelations) => void
}

export function CustomerFormModal({
  open,
  onOpenChange,
  customerToEdit,
  onSuccess,
}: CustomerFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [searchingCep, setSearchingCep] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      document: '',
      phone: '',
      whatsapp: '',
      email: '',
      zip_code: '',
      address: '',
      address_number: '',
      address_complement: '',
      neighborhood: '',
      city: '',
      state: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (customerToEdit) {
      reset({
        name: customerToEdit.name || '',
        document: customerToEdit.document || '',
        phone: customerToEdit.phone || '',
        whatsapp: customerToEdit.whatsapp || '',
        email: customerToEdit.email || '',
        zip_code: customerToEdit.zip_code || '',
        address: customerToEdit.address || '',
        address_number: customerToEdit.address_number || '',
        address_complement: customerToEdit.address_complement || '',
        neighborhood: customerToEdit.neighborhood || '',
        city: customerToEdit.city || '',
        state: customerToEdit.state || '',
        notes: customerToEdit.notes || '',
      })
    } else {
      reset({
        name: '',
        document: '',
        phone: '',
        whatsapp: '',
        email: '',
        zip_code: '',
        address: '',
        address_number: '',
        address_complement: '',
        neighborhood: '',
        city: '',
        state: '',
        notes: '',
      })
    }
  }, [customerToEdit, reset, open])

  // ViaCEP integration for automatic address completion
  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const rawCep = e.target.value.replace(/\D/g, '')
    if (rawCep.length === 8) {
      setSearchingCep(true)
      try {
        const response = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`)
        const data = await response.json()
        if (!data.erro) {
          setValue('address', data.logradouro || '', { shouldValidate: true })
          setValue('neighborhood', data.bairro || '', { shouldValidate: true })
          setValue('city', data.localidade || '', { shouldValidate: true })
          setValue('state', data.uf || '', { shouldValidate: true })
          toast({
            title: 'Endereço encontrado!',
            description: `${data.logradouro}, ${data.bairro} - ${data.localidade}/${data.uf}`,
          })
        } else {
          toast({
            title: 'CEP não localizado',
            description: 'Preencha o endereço manualmente.',
            variant: 'destructive',
          })
        }
      } catch {
        // Silently ignore or alert
      } finally {
        setSearchingCep(false)
      }
    }
  }

  const onSubmit = async (data: CustomerFormData) => {
    setLoading(true)
    try {
      if (customerToEdit) {
        const updated = await customerService.update(customerToEdit.id, data)
        toast({
          title: 'Cliente atualizado!',
          description: `Os dados de ${updated.name} foram salvos com sucesso.`,
          variant: 'success' as 'default',
        })
        onSuccess(updated)
      } else {
        const created = await customerService.create(data)
        toast({
          title: 'Cliente cadastrado!',
          description: `${created.name} foi adicionado à sua base.`,
          variant: 'success' as 'default',
        })
        onSuccess(created)
      }
      onOpenChange(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar cliente'
      toast({
        title: 'Erro ao salvar',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {customerToEdit ? 'Editar Cliente' : 'Novo Cliente'}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados do cliente e endereço para atendimento automotivo, residencial ou comercial.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Seção 1: Dados Pessoais / Contato */}
          <div className="space-y-4">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground border-b pb-2">
              <User className="h-4 w-4 text-primary" /> Dados Principais
            </h4>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">
                  Nome Completo / Razão Social <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Ex: João da Silva / Loja XYZ"
                  {...register('name')}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="document">CPF ou CNPJ</Label>
                <Input
                  id="document"
                  placeholder="000.000.000-00"
                  {...register('document')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp">
                  WhatsApp Principal <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="whatsapp"
                  placeholder="(11) 99999-9999"
                  {...register('whatsapp')}
                  className={errors.whatsapp ? 'border-destructive' : ''}
                />
                {errors.whatsapp && (
                  <p className="text-xs text-destructive">{errors.whatsapp.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone Secundário</Label>
                <Input
                  id="phone"
                  placeholder="(11) 3333-3333"
                  {...register('phone')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="cliente@email.com"
                  {...register('email')}
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Seção 2: Endereço para Aplicação Residencial / Comercial */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <MapPin className="h-4 w-4 text-primary" /> Endereço de Instalação (Residencial / Comercial)
              </h4>
              <span className="text-xs text-muted-foreground">Busca rápida por CEP</span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="zip_code">CEP</Label>
                <div className="relative">
                  <Input
                    id="zip_code"
                    placeholder="00000-000"
                    {...register('zip_code')}
                    onBlur={handleCepBlur}
                  />
                  {searchingCep && (
                    <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Rua / Avenida</Label>
                <Input
                  id="address"
                  placeholder="Ex: Rua Harmonia"
                  {...register('address')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address_number">Número</Label>
                <Input
                  id="address_number"
                  placeholder="Ex: 120"
                  {...register('address_number')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address_complement">Complemento</Label>
                <Input
                  id="address_complement"
                  placeholder="Apto 42, Bloco B, Casa..."
                  {...register('address_complement')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  placeholder="Ex: Vila Madalena"
                  {...register('neighborhood')}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  placeholder="Ex: São Paulo"
                  {...register('city')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">Estado (UF)</Label>
                <Input
                  id="state"
                  placeholder="SP"
                  maxLength={2}
                  {...register('state')}
                />
              </div>
            </div>
          </div>

          {/* Seção 3: Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações / Preferências</Label>
            <textarea
              id="notes"
              rows={3}
              placeholder="Ex: Cliente tem cachorro grande na residência; prefere película com alta rejeição de calor na sala de estar..."
              {...register('notes')}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : customerToEdit ? (
                'Salvar Alterações'
              ) : (
                'Cadastrar Cliente'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
