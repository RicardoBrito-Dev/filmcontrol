'use client'

import { useState, useEffect } from 'react'
import {
  Building2,
  Save,
  Shield,
  Phone,
  Mail,
  MapPin,
  FileText,
  DollarSign,
  Film,
  Layers,
  Sparkles,
  CheckCircle2,
  Plus,
  Trash2,
  Edit2,
  Percent,
  Ruler,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  filmPricingService,
  DEFAULT_FILM_PRICES,
  type FilmPriceConfig,
} from '@/services/film-pricing.service'
import {
  storeSettingsService,
  DEFAULT_STORE_SETTINGS,
} from '@/services/store-settings.service'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

export default function ConfiguracoesPage() {
  const [companyName, setCompanyName] = useState('Minha Loja de Películas')
  const [document, setDocument] = useState('')
  const [phone, setPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [pixKey, setPixKey] = useState('')

  // Film pricing per m² and linear meter
  const [filmPrices, setFilmPrices] = useState<Record<string, FilmPriceConfig>>(DEFAULT_FILM_PRICES)

  // Warranty and terms
  const [warrantyTerms, setWarrantyTerms] = useState(DEFAULT_STORE_SETTINGS.warrantyTerms || '')

  const [saving, setSaving] = useState(false)

  // Modal para Adicionar / Editar Película
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [modalName, setModalName] = useState('')
  const [modalBadge, setModalBadge] = useState('Profissional')
  const [modalCategory, setModalCategory] = useState<'AUTOMOTIVO' | 'RESIDENCIAL' | 'COMERCIAL' | 'TODOS'>('TODOS')
  const [modalDesc, setModalDesc] = useState('')
  const [modalRollWidth, setModalRollWidth] = useState<number>(1.52)
  const [modalCostLinear, setModalCostLinear] = useState<number>(53)
  const [modalCostM2, setModalCostM2] = useState<number>(35)
  const [modalPriceM2, setModalPriceM2] = useState<number>(120)

  useEffect(() => {
    const loadedPricing = filmPricingService.getPricing()
    setFilmPrices(loadedPricing)

    const store = storeSettingsService.getSettings()
    setCompanyName(store.name || '')
    setDocument(store.document || '')
    setPhone(store.phone || '')
    setWhatsapp(store.whatsapp || '')
    setEmail(store.email || '')
    setAddress(store.address || '')
    setPixKey(store.pixKey || '')
    if (store.warrantyTerms) {
      setWarrantyTerms(store.warrantyTerms)
    }
  }, [])

  const handlePriceChange = (key: string, field: 'pricePerM2' | 'costPerM2' | 'costPerLinearMeter' | 'rollWidth', value: number) => {
    setFilmPrices((prev) => {
      const current = prev[key]
      if (!current) return prev

      const rollWidth = field === 'rollWidth' ? value : current.rollWidth || 1.52
      let costPerM2 = current.costPerM2
      let costPerLinearMeter = current.costPerLinearMeter || Number((costPerM2 * rollWidth).toFixed(2))

      if (field === 'costPerLinearMeter') {
        costPerLinearMeter = value
        costPerM2 = Number((value / rollWidth).toFixed(2))
      } else if (field === 'costPerM2') {
        costPerM2 = value
        costPerLinearMeter = Number((value * rollWidth).toFixed(2))
      }

      return {
        ...prev,
        [key]: {
          ...current,
          rollWidth,
          costPerM2,
          costPerLinearMeter,
          pricePerM2: field === 'pricePerM2' ? value : current.pricePerM2,
        },
      }
    })
  }

  const handleOpenAddModal = () => {
    setEditingKey(null)
    setModalName('')
    setModalBadge('Profissional')
    setModalCategory('TODOS')
    setModalDesc('')
    setModalRollWidth(1.52)
    setModalCostLinear(53)
    setModalCostM2(35)
    setModalPriceM2(120)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (key: string) => {
    const config = filmPrices[key]
    if (!config) return
    setEditingKey(key)
    setModalName(config.name)
    setModalBadge(config.badge || 'Profissional')
    setModalCategory(config.category || 'TODOS')
    setModalDesc(config.description || '')
    const rollWidth = config.rollWidth || 1.52
    setModalRollWidth(rollWidth)
    const costLinear = config.costPerLinearMeter || Number(((config.costPerM2 || 35) * rollWidth).toFixed(2))
    setModalCostLinear(costLinear)
    setModalCostM2(config.costPerM2 || Number((costLinear / rollWidth).toFixed(2)))
    setModalPriceM2(config.pricePerM2 || 120)
    setIsModalOpen(true)
  }

  // Sincronizar custo linear -> custo m² no modal
  const handleModalLinearCostChange = (linearVal: number, widthVal = modalRollWidth) => {
    setModalCostLinear(linearVal)
    if (widthVal > 0) {
      setModalCostM2(Number((linearVal / widthVal).toFixed(2)))
    }
  }

  // Sincronizar custo m² -> custo linear no modal
  const handleModalM2CostChange = (m2Val: number, widthVal = modalRollWidth) => {
    setModalCostM2(m2Val)
    if (widthVal > 0) {
      setModalCostLinear(Number((m2Val * widthVal).toFixed(2)))
    }
  }

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault()
    if (!modalName.trim()) {
      toast({ title: 'Informe o nome da película', variant: 'destructive' })
      return
    }

    const key = editingKey || 'film_' + Date.now()
    const newConfig: FilmPriceConfig = {
      id: key,
      name: modalName.trim(),
      badge: modalBadge.trim() || 'Personalizada',
      category: modalCategory,
      description: modalDesc.trim() || 'Película configurada pela loja.',
      rollWidth: Number(modalRollWidth) || 1.52,
      costPerLinearMeter: Number(modalCostLinear) || 0,
      costPerM2: Number(modalCostM2) || 0,
      pricePerM2: Number(modalPriceM2) || 0,
    }

    const updated = filmPricingService.updatePricing(key, newConfig)
    setFilmPrices({ ...updated })
    setIsModalOpen(false)

    toast({
      title: editingKey ? 'Película atualizada!' : 'Nova película cadastrada!',
      description: `${newConfig.name} disponível para orçamentos e calculadora.`,
      variant: 'success' as 'default',
    })
  }

  const handleDeleteFilm = (key: string) => {
    if (Object.keys(filmPrices).length <= 1) {
      toast({ title: 'Você precisa manter pelo menos 1 película cadastrada', variant: 'destructive' })
      return
    }
    const updated = filmPricingService.deletePricing(key)
    setFilmPrices({ ...updated })
    toast({
      title: 'Película removida',
      description: 'A película foi removida da tabela.',
    })
  }

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    filmPricingService.saveAllPricing(filmPrices)

    storeSettingsService.saveSettings({
      name: companyName,
      document,
      phone,
      whatsapp,
      email,
      address,
      pixKey,
      warrantyTerms,
    })

    setTimeout(() => {
      setSaving(false)
      toast({
        title: 'Configurações salvas com sucesso!',
        description: 'Dados da sua loja, chave PIX, garantia e tabela de películas atualizados.',
        variant: 'success' as 'default',
      })
    }, 400)
  }

  const filmList = Object.entries(filmPrices)

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Configurações da Empresa & Catálogo de Películas
        </h1>
        <p className="text-sm text-muted-foreground">
          Configure a compra por metro corrido de bobina (1,52m), venda por m², dados fiscais e termos de garantia.
        </p>
      </div>

      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* Tabela de Preços & Bobinas das Películas */}
        <Card className="border-primary/30 shadow-sm">
          <CardHeader className="bg-primary/5 rounded-t-xl pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2 text-foreground">
                  <Film className="h-5 w-5 text-primary" /> Tabela de Preços & Custo por Metro Corrido / m²
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Você compra o rolo por <strong>Metro Corrido</strong> e o sistema converte o custo para <strong>Metro Quadrado (m²)</strong> automaticamente.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-xs">
                  {filmList.length} {filmList.length === 1 ? 'Tipo Cadastrado' : 'Tipos Cadastrados'}
                </Badge>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleOpenAddModal}
                  className="gap-1.5 text-xs font-bold shadow-sm"
                >
                  <Plus className="h-4 w-4" /> + Cadastrar Película
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 gap-3.5">
              {filmList.map(([key, config]) => {
                const rollWidth = config.rollWidth || 1.52
                const linearCost = config.costPerLinearMeter || Number(((config.costPerM2 || 0) * rollWidth).toFixed(2))
                const profit = (config.pricePerM2 || 0) - (config.costPerM2 || 0)
                const margin = config.pricePerM2 > 0 ? (profit / config.pricePerM2) * 100 : 0

                return (
                  <div
                    key={key}
                    className="rounded-xl border bg-card p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:border-primary/40 transition-all shadow-xs group"
                  >
                    <div className="space-y-1.5 max-w-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">
                          {config.name}
                        </span>
                        {config.badge && (
                          <Badge variant="outline" className="text-[10px] font-semibold">
                            {config.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {config.description}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-0.5">
                        <span className="flex items-center gap-1 font-mono text-primary">
                          <Ruler className="h-3 w-3" /> Bobina: {rollWidth}m
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3.5">
                      {/* Custo Metro Corrido */}
                      <div className="space-y-1">
                        <Label htmlFor={`linear-${key}`} className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                          Compra (R$/metro)
                        </Label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                          <Input
                            id={`linear-${key}`}
                            type="number"
                            step="0.5"
                            value={linearCost}
                            onChange={(e) =>
                              handlePriceChange(key, 'costPerLinearMeter', Number(e.target.value))
                            }
                            className="w-24 pl-8 font-mono text-xs h-8"
                            title="Preço pago no metro corrido do rolo"
                          />
                        </div>
                      </div>

                      {/* Custo m² Convertido */}
                      <div className="space-y-1">
                        <Label htmlFor={`cost-${key}`} className="text-[11px] text-muted-foreground">
                          Custo (R$/m²)
                        </Label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                          <Input
                            id={`cost-${key}`}
                            type="number"
                            step="0.5"
                            value={config.costPerM2}
                            onChange={(e) =>
                              handlePriceChange(key, 'costPerM2', Number(e.target.value))
                            }
                            className="w-24 pl-8 font-mono text-xs h-8 bg-muted/20"
                            title="Custo equivalente por m²"
                          />
                        </div>
                      </div>

                      {/* Venda m² */}
                      <div className="space-y-1">
                        <Label htmlFor={`price-${key}`} className="text-[11px] font-semibold text-primary">
                          Venda (R$/m²)
                        </Label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                          <Input
                            id={`price-${key}`}
                            type="number"
                            step="5"
                            value={config.pricePerM2}
                            onChange={(e) =>
                              handlePriceChange(key, 'pricePerM2', Number(e.target.value))
                            }
                            className="w-24 pl-8 font-mono text-xs h-8 font-bold border-primary/50 text-foreground"
                          />
                        </div>
                      </div>

                      {/* Lucro e Margem */}
                      <div className="flex flex-col items-end justify-center min-w-[90px] text-right">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold">Lucro m²</span>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(profit)}
                        </span>
                        <Badge
                          variant={margin >= 50 ? 'success' : margin >= 30 ? 'warning' : 'destructive'}
                          className="text-[10px] px-1.5 py-0 h-4 mt-0.5"
                        >
                          {margin.toFixed(0)}%
                        </Badge>
                      </div>

                      {/* Botões de Ação */}
                      <div className="flex items-center gap-1 border-l pl-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEditModal(key)}
                          className="h-8 w-8 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                          title="Editar detalhes da película"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteFilm(key)}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          title="Excluir película"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Dados da Empresa & Termos */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Informações da Loja */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" /> Dados Comerciais da Loja
              </CardTitle>
              <CardDescription className="text-xs">
                Informações impressas no cabeçalho dos orçamentos e ordens de serviço.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="comp-name" className="text-xs">Razão Social / Nome Fantasia</Label>
                <Input
                  id="comp-name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="text-sm h-9"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="comp-doc" className="text-xs">CNPJ / CPF</Label>
                  <Input
                    id="comp-doc"
                    value={document}
                    onChange={(e) => setDocument(e.target.value)}
                    className="text-sm h-9 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="comp-phone" className="text-xs">Telefone Fixo</Label>
                  <Input
                    id="comp-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="text-sm h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="comp-wpp" className="text-xs">WhatsApp Comercial</Label>
                  <Input
                    id="comp-wpp"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="text-sm h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="comp-email" className="text-xs">E-mail</Label>
                  <Input
                    id="comp-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="text-sm h-9"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="comp-addr" className="text-xs">Endereço Completo da Loja / Oficina</Label>
                <Input
                  id="comp-addr"
                  placeholder="Ex: Av. Paulista, 1000 - Centro - São Paulo/SP"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="text-sm h-9"
                />
              </div>

              <div className="space-y-1 pt-1 border-t">
                <Label htmlFor="comp-pix" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Chave PIX da Loja (Para Recebimento nos Orçamentos)
                </Label>
                <Input
                  id="comp-pix"
                  placeholder="Ex: pix@sualoja.com.br ou 11999998888 ou CNPJ"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  className="text-sm h-9 font-mono border-emerald-500/30 focus:border-emerald-500"
                />
                <p className="text-[11px] text-muted-foreground">
                  Se preenchida, sua chave PIX será adicionada automaticamente nos orçamentos em PDF e mensagens de WhatsApp.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Termos de Garantia Padrão */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-500" /> Termos de Garantia & Cuidados
              </CardTitle>
              <CardDescription className="text-xs">
                Texto padrão anexado nos orçamentos, PDFs e mensagens enviadas aos clientes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="warranty-terms" className="text-xs font-semibold">
                  Cláusulas de Garantia e Instruções Pós-Instalação
                </Label>
                <textarea
                  id="warranty-terms"
                  rows={8}
                  value={warrantyTerms}
                  onChange={(e) => setWarrantyTerms(e.target.value)}
                  className="w-full rounded-xl border bg-background p-3 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring font-sans"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Botão Salvar Todas as Configurações */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="submit" disabled={saving} className="gap-2 px-6 font-bold shadow-md">
            <Save className="h-4 w-4" />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>

      {/* Modal para Adicionar / Editar Tipo de Película */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Film className="h-5 w-5 text-primary" />
              {editingKey ? 'Editar Película' : 'Cadastrar Nova Película'}
            </DialogTitle>
            <DialogDescription>
              Informe o custo do metro corrido da bobina (1,52m) e o preço de venda por m².
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveModal} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="m-name" className="text-xs font-semibold">Nome da Película *</Label>
              <Input
                id="m-name"
                placeholder="Ex: Película Carbon 70%, Fumê G20, Antivandalismo PS8..."
                value={modalName}
                onChange={(e) => setModalName(e.target.value)}
                required
                className="text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="m-badge" className="text-xs">Selo / Linha</Label>
                <Input
                  id="m-badge"
                  placeholder="Ex: Premium, Térmica, Arquitetura..."
                  value={modalBadge}
                  onChange={(e) => setModalBadge(e.target.value)}
                  className="text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="m-cat" className="text-xs">Categoria</Label>
                <select
                  id="m-cat"
                  value={modalCategory}
                  onChange={(e) => setModalCategory(e.target.value as typeof modalCategory)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="TODOS">Todos os Serviços</option>
                  <option value="AUTOMOTIVO">Automotivo</option>
                  <option value="RESIDENCIAL">Residencial / Comercial</option>
                </select>
              </div>
            </div>

            {/* Medidas de Bobina e Conversão Metro Corrido -> m² */}
            <div className="rounded-xl border bg-muted/30 p-3.5 space-y-3">
              <h5 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Ruler className="h-4 w-4 text-primary" /> Compra por Metro Corrido da Bobina
              </h5>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="space-y-1">
                  <Label htmlFor="m-roll-width" className="text-[11px] font-semibold">
                    Largura Bobina (m)
                  </Label>
                  <Input
                    id="m-roll-width"
                    type="number"
                    step="0.01"
                    min="0.5"
                    value={modalRollWidth}
                    onChange={(e) => {
                      const w = Number(e.target.value) || 1.52
                      setModalRollWidth(w)
                      handleModalLinearCostChange(modalCostLinear, w)
                    }}
                    className="text-xs font-mono h-8"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="m-cost-linear" className="text-[11px] font-semibold text-primary">
                    Metro Corrido (R$/m)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">R$</span>
                    <Input
                      id="m-cost-linear"
                      type="number"
                      step="0.5"
                      value={modalCostLinear}
                      onChange={(e) => handleModalLinearCostChange(Number(e.target.value))}
                      className="pl-6 text-xs font-mono font-bold h-8"
                      title="Quanto você paga no metro corrido do rolo"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="m-cost-m2" className="text-[11px] text-muted-foreground">
                    Custo por m²
                  </Label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">R$</span>
                    <Input
                      id="m-cost-m2"
                      type="number"
                      step="0.5"
                      value={modalCostM2}
                      onChange={(e) => handleModalM2CostChange(Number(e.target.value))}
                      className="pl-6 text-xs font-mono h-8 bg-background"
                      title="Custo equivalente por m² (Metro Corrido ÷ Largura da Bobina)"
                    />
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-muted-foreground bg-background/80 p-2 rounded-lg border border-border/50">
                💡 1 metro corrido de bobina de <strong>{modalRollWidth}m</strong> custa <strong>{formatCurrency(modalCostLinear)}</strong> e rende <strong>{modalRollWidth} m²</strong> (equivalente a <strong>{formatCurrency(modalCostM2)}/m²</strong>).
              </div>
            </div>

            {/* Preço de Venda por m² */}
            <div className="space-y-1">
              <Label htmlFor="m-price" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Preço de Venda Padrão (R$/m²) *
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                <Input
                  id="m-price"
                  type="number"
                  step="5"
                  value={modalPriceM2}
                  onChange={(e) => setModalPriceM2(Number(e.target.value))}
                  required
                  className="pl-9 text-base font-bold font-mono h-10 border-emerald-500/40"
                />
              </div>
            </div>

            {/* Margem Preview */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">Lucro Bruto por m²:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {formatCurrency(Math.max(0, modalPriceM2 - modalCostM2))} / m²
                </span>
              </div>
              <div className="text-right">
                <span className="text-muted-foreground block text-[11px]">Margem Estimada:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {modalPriceM2 > 0 ? (((modalPriceM2 - modalCostM2) / modalPriceM2) * 100).toFixed(0) : 0}%
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="m-desc" className="text-xs">Descrição / Benefícios</Label>
              <textarea
                id="m-desc"
                rows={2}
                placeholder="Ex: Rejeição de 80% do calor, proteção UV 99%, garantia 5 anos..."
                value={modalDesc}
                onChange={(e) => setModalDesc(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="gap-1 font-bold">
                <CheckCircle2 className="h-4 w-4" /> {editingKey ? 'Salvar Alterações' : 'Cadastrar Película'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
