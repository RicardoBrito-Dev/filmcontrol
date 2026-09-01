'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, MapPin, User, Car, Building2, Check, Sparkles } from 'lucide-react'
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
import { customerService, type CustomerWithRelations, type QuickVehicleInput } from '@/services/customer.service'
import type { VehicleType } from '@/types/database.types'
import { toast } from '@/hooks/use-toast'

interface CustomerFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerToEdit?: CustomerWithRelations | null
  onSuccess: (customer: CustomerWithRelations) => void
}

const commonBrands = [
  'Chevrolet',
  'Volkswagen',
  'Fiat',
  'Toyota',
  'Honda',
  'Hyundai',
  'Jeep',
  'Ford',
  'Renault',
  'Nissan',
  'BMW',
  'Mercedes-Benz',
  'Audi',
  'BYD',
  'GWM',
  'Outra',
]

export function CustomerFormModal({
  open,
  onOpenChange,
  customerToEdit,
  onSuccess,
}: CustomerFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [searchingCep, setSearchingCep] = useState(false)

  // Tipo de Atendimento: 'AUTOMOTIVO' | 'RESIDENCIAL'
  const [serviceType, setServiceType] = useState<'AUTOMOTIVO' | 'RESIDENCIAL'>('AUTOMOTIVO')

  // VeÃ­culo Express
  const [vBrand, setVBrand] = useState('')
  const [vModel, setVModel] = useState('')
  const [vPlate, setVPlate] = useState('')
  const [vColor, setVColor] = useState('')
  const [vYear, setVYear] = useState('')
  const [vType, setVType] = useState<VehicleType>('CARRO')

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
      if (customerToEdit.vehicles && customerToEdit.vehicles.length > 0) {
        setServiceType('AUTOMOTIVO')
      } else if (customerToEdit.address) {
        setServiceType('RESIDENCIAL')
      }
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
      setServiceType('AUTOMOTIVO')
      setVBrand('')
      setVModel('')
      setVPlate('')
      setVColor('')
      setVYear('')
      setVType('CARRO')
    }
  }, [customerToEdit, reset, open])

  // ViaCEP integration
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
            title: 'EndereÃ§o encontrado!',
            description: `${data.logradouro}, ${data.bairro} - ${data.localidade}/${data.uf}`,
          })
        }
      } catch {
        // Silently continue
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
          description: `Os dados de ${updated.name} foram salvos.`,
          variant: 'success' as 'default',
        })
        onSuccess(updated)
      } else {
        const vehiclePayload: QuickVehicleInput | null =
          serviceType === 'AUTOMOTIVO' && vBrand.trim() && vModel.trim()
            ? {
                brand: vBrand.trim(),
                model: vModel.trim(),
                plate: vPlate.trim() ? vPlate.trim().toUpperCase() : null,
                color: vColor.trim() || null,
                year: vYear ? Number(vYear) : null,
                type: vType,
              }
            : null

        const created = await customerService.create(data, vehiclePayload)

        toast({
          title: vehiclePayload
            ? 'Cliente e VeÃ­culo cadastrados!'
            : 'Cliente cadastrado com sucesso!',
          description: vehiclePayload
            ? `${created.name} e o veÃ­culo ${vBrand} ${vModel} foram cadastrados juntos.`
            : `${created.name} foi cadastrado para atendimento residencial/comercial.`,
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
      <DialogContent className="max-h-[92dvh] overflow-y-auto w-full sm:max-w-2xl p-4 sm:p-6 gap-4 rounded-t-2xl sm:rounded-2xl top-auto bottom-0 sm:top-1/2 sm:bottom-auto translate-y-0 sm:-translate-y-1/2">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <User className="h-5 w-5 text-primary" />
            {customerToEdit ? 'Editar Cliente' : 'Novo Cliente'}
          </DialogTitle>
          <DialogDescription>
            Escolha o tipo de atendimento para preencher apenas o que interessa de forma ultra-rÃ¡pida.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Seletor Segmentado: Automotivo vs Residencial */}
          {!customerToEdit && (
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-muted/60 rounded-xl border">
              <button
                type="button"
                onClick={() => setServiceType('AUTOMOTIVO')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                  serviceType === 'AUTOMOTIVO'
                    ? 'bg-card text-primary shadow-sm border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Car className="h-4 w-4 text-primary" />
                <span>ðŸš— Automotivo (VeÃ­culo)</span>
              </button>

              <button
                type="button"
                onClick={() => setServiceType('RESIDENCIAL')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                  serviceType === 'RESIDENCIAL'
                    ? 'bg-card text-blue-600 dark:text-blue-400 shadow-sm border border-blue-500/20'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Building2 className="h-4 w-4 text-blue-500" />
                <span>ðŸ  Residencial / Comercial</span>
              </button>
            </div>
          )}

          {/* Dados Principais do Cliente */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-primary" /> Dados do Cliente
              </span>
              <span className="text-[11px] text-muted-foreground">* ObrigatÃ³rios</span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="name" className="text-xs font-semibold">
                  Nome Completo / RazÃ£o Social *
                </Label>
                <Input
                  id="name"
                  placeholder="Ex: JoÃ£o da Silva / Loja XYZ"
                  {...register('name')}
                  className={`h-9 text-sm ${errors.name ? 'border-destructive' : ''}`}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="whatsapp" className="text-xs font-semibold">
                  WhatsApp Principal *
                </Label>
                <Input
                  id="whatsapp"
                  placeholder="(11) 99999-9999"
                  {...register('whatsapp')}
                  className={`h-9 text-sm ${errors.whatsapp ? 'border-destructive' : ''}`}
                />
                {errors.whatsapp && (
                  <p className="text-xs text-destructive">{errors.whatsapp.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="document" className="text-xs font-semibold">
                  CPF ou CNPJ (Opcional)
                </Label>
                <Input
                  id="document"
                  placeholder="000.000.000-00"
                  {...register('document')}
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Se AUTOMOTIVO: Exibe Campos do VeÃ­culo Diretamente */}
          {serviceType === 'AUTOMOTIVO' && !customerToEdit && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-primary/10 pb-1.5">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Car className="h-4 w-4 text-primary" /> Dados do VeÃ­culo (Cadastrado Junto)
                </span>
                <span className="text-[10px] bg-primary/15 text-primary font-mono px-2 py-0.5 rounded-full font-semibold">
                  1-Click
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor="vBrand" className="text-xs font-semibold">
                    Marca *
                  </Label>
                  <Input
                    id="vBrand"
                    list="brand-suggestions"
                    placeholder="Ex: Honda, Toyota"
                    value={vBrand}
                    onChange={(e) => setVBrand(e.target.value)}
                    className="h-9 text-sm bg-background"
                  />
                  <datalist id="brand-suggestions">
                    {commonBrands.map((b) => (
                      <option key={b} value={b} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="vModel" className="text-xs font-semibold">
                    Modelo *
                  </Label>
                  <Input
                    id="vModel"
                    placeholder="Ex: Civic, Corolla"
                    value={vModel}
                    onChange={(e) => setVModel(e.target.value)}
                    className="h-9 text-sm bg-background"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="vPlate" className="text-xs font-semibold">
                    Placa
                  </Label>
                  <Input
                    id="vPlate"
                    placeholder="Ex: BRA-2E19"
                    value={vPlate}
                    onChange={(e) => setVPlate(e.target.value.toUpperCase())}
                    className="h-9 text-sm bg-background font-mono uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="vColor" className="text-xs font-semibold">
                    Cor
                  </Label>
                  <Input
                    id="vColor"
                    placeholder="Ex: Preto, Prata"
                    value={vColor}
                    onChange={(e) => setVColor(e.target.value)}
                    className="h-9 text-sm bg-background"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="vYear" className="text-xs font-semibold">
                    Ano
                  </Label>
                  <Input
                    id="vYear"
                    type="number"
                    placeholder="Ex: 2023"
                    value={vYear}
                    onChange={(e) => setVYear(e.target.value)}
                    className="h-9 text-sm bg-background font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="vType" className="text-xs font-semibold">
                    Categoria
                  </Label>
                  <select
                    id="vType"
                    value={vType}
                    onChange={(e) => setVType(e.target.value as VehicleType)}
                    className="h-9 w-full rounded-lg border bg-background px-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="CARRO">Carro / Sedan / Hatch</option>
                    <option value="SUV">SUV / Crossover</option>
                    <option value="PICKUP">Pickup / Caminhonete</option>
                    <option value="MOTO">Moto</option>
                    <option value="CAMINHAO">CaminhÃ£o / Van</option>
                    <option value="OUTRO">Outro</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Se RESIDENCIAL ou Editando: Exibe Campos de EndereÃ§o */}
          {(serviceType === 'RESIDENCIAL' || customerToEdit) && (
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-blue-500/10 pb-1.5">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-blue-500" /> EndereÃ§o do ImÃ³vel (Para AplicaÃ§Ã£o no Local)
                </span>
                <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                  Busca por CEP
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor="zip_code" className="text-xs font-semibold">
                    CEP
                  </Label>
                  <div className="relative">
                    <Input
                      id="zip_code"
                      placeholder="00000-000"
                      {...register('zip_code')}
                      onBlur={handleCepBlur}
                      className="h-9 text-sm font-mono bg-background"
                    />
                    {searchingCep && (
                      <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-primary" />
                    )}
                  </div>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="address" className="text-xs font-semibold">
                    Rua / Avenida
                  </Label>
                  <Input
                    id="address"
                    placeholder="Ex: Alameda Lorena"
                    {...register('address')}
                    className="h-9 text-sm bg-background"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="address_number" className="text-xs font-semibold">
                    NÃºmero
                  </Label>
                  <Input
                    id="address_number"
                    placeholder="Ex: 550"
                    {...register('address_number')}
                    className="h-9 text-sm bg-background"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="address_complement" className="text-xs font-semibold">
                    Complemento
                  </Label>
                  <Input
                    id="address_complement"
                    placeholder="Casa, Apto 42, Sacada..."
                    {...register('address_complement')}
                    className="h-9 text-sm bg-background"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="neighborhood" className="text-xs font-semibold">
                    Bairro
                  </Label>
                  <Input
                    id="neighborhood"
                    placeholder="Ex: Jardins"
                    {...register('neighborhood')}
                    className="h-9 text-sm bg-background"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="city" className="text-xs font-semibold">
                    Cidade
                  </Label>
                  <Input
                    id="city"
                    placeholder="Ex: SÃ£o Paulo"
                    {...register('city')}
                    className="h-9 text-sm bg-background"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="state" className="text-xs font-semibold">
                    UF
                  </Label>
                  <Input
                    id="state"
                    placeholder="SP"
                    maxLength={2}
                    {...register('state')}
                    className="h-9 text-sm uppercase bg-background"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="h-9"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="h-9 gap-1.5 font-bold">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : customerToEdit ? (
                'Salvar AlteraÃ§Ãµes'
              ) : (
                <>
                  <Check className="h-4 w-4" /> Cadastrar Cliente
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

