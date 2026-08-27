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
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

export default function ConfiguracoesPage() {
  const [companyName, setCompanyName] = useState('FILMCONTROL — Instalação Profissional de Películas')
  const [document, setDocument] = useState('12.345.678/0001-90')
  const [phone, setPhone] = useState('(11) 3456-7890')
  const [whatsapp, setWhatsapp] = useState('(11) 99999-8888')
  const [email, setEmail] = useState('contato@filmcontrol.com.br')
  const [address, setAddress] = useState('Av. das Nações Unidas, 14200 - São Paulo/SP')

  // Film pricing per m²
  const [filmPrices, setFilmPrices] = useState<Record<string, FilmPriceConfig>>(DEFAULT_FILM_PRICES)

  // Warranty and terms
  const [warrantyTerms, setWarrantyTerms] = useState(
    `1. GARANTIA: Garantia de 3 a 5 anos contra bolhas, descolamento e desbotamento para películas da linha Premium e Carbon.
2. CUIDADOS PÓS-INSTALAÇÃO: Não abrir os vidros laterais e traseiro por no mínimo 72 horas para cura total da película. Não utilizar produtos abrasivos ou álcool na limpeza interna.
3. FORMAS DE PAGAMENTO: Pagamento via PIX com desconto à vista ou parcelado em até 3x no cartão sem juros.`
  )

  const [saving, setSaving] = useState(false)

  // Modal para Adicionar / Editar Película
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [modalName, setModalName] = useState('')
  const [modalBadge, setModalBadge] = useState('Profissional')
  const [modalCategory, setModalCategory] = useState<'AUTOMOTIVO' | 'RESIDENCIAL' | 'COMERCIAL' | 'TODOS'>('TODOS')
  const [modalDesc, setModalDesc] = useState('')
  const [modalCost, setModalCost] = useState<number>(30)
  const [modalPrice, setModalPrice] = useState<number>(100)

  useEffect(() => {
    const loaded = filmPricingService.getPricing()
    setFilmPrices(loaded)
  }, [])

  const handlePriceChange = (key: string, field: 'pricePerM2' | 'costPerM2', value: number) => {
    setFilmPrices((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }))
  }

  const handleOpenAddModal = () => {
    setEditingKey(null)
    setModalName('')
    setModalBadge('Profissional')
    setModalCategory('TODOS')
    setModalDesc('')
    setModalCost(35)
    setModalPrice(120)
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
    setModalCost(config.costPerM2 || 0)
    setModalPrice(config.pricePerM2 || 0)
    setIsModalOpen(true)
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
      costPerM2: Number(modalCost) || 0,
      pricePerM2: Number(modalPrice) || 0,
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

    setTimeout(() => {
      setSaving(false)
      toast({
        title: 'Configurações salvas com sucesso!',
        description: 'Tabela de preços por m² e dados da empresa atualizados.',
        variant: 'success' as 'default',
      })
    }, 500)
  }

  const filmList = Object.entries(filmPrices)

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Configurações da Empresa & Tabela de Preços
        </h1>
        <p className="text-sm text-muted-foreground">
          Cadastre todos os tipos de películas que você trabalha, personalize valores por m², dados fiscais e termos de garantia.
        </p>
      </div>

      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* Tabela de Preços por m² das Películas */}
        <Card className="border-primary/30 shadow-sm">
          <CardHeader className="bg-primary/5 rounded-t-xl pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2 text-foreground">
                  <Film className="h-5 w-5 text-primary" /> Tabela de Preços por Metro Quadrado (m²)
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Estes valores são carregados automaticamente na Calculadora Inteligente e nos novos Orçamentos.
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
                  <Plus className="h-4 w-4" /> Cadastrar Película
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 gap-3.5">
              {filmList.map(([key, config]) => {
                const profit = (config.pricePerM2 || 0) - (config.costPerM2 || 0)
                const margin = config.pricePerM2 > 0 ? (profit / config.pricePerM2) * 100 : 0

                return (
                  <div
                    key={key}
                    className="rounded-xl border bg-card p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-primary/40 transition-all shadow-xs group"
                  >
                    <div className="space-y-1 max-w-sm">
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
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* Custo m² */}
                      <div className="space-y-1">
                        <Label htmlFor={`cost-${key}`} className="text-[11px] text-muted-foreground">
                          Custo (R$/m²)
                        </Label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                          <Input
                            id={`cost-${key}`}
                            type="number"
                            step="1"
                            value={config.costPerM2}
                            onChange={(e) =>
                              handlePriceChange(key, 'costPerM2', Number(e.target.value))
                            }
                            className="w-24 pl-8 font-mono text-xs h-8"
                          />
                        </div>
                      </div>

                      {/* Venda m² */}
                      <div className="space-y-1">
                        <Label htmlFor={`price-${key}`} className="text-[11px] text-primary font-bold">
                          Preço Venda (R$/m²)
                        </Label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-primary">R$</span>
                          <Input
                            id={`price-${key}`}
                            type="number"
                            step="5"
                            value={config.pricePerM2}
                            onChange={(e) =>
                              handlePriceChange(key, 'pricePerM2', Number(e.target.value))
                            }
                            className="w-28 pl-8 font-mono font-bold text-xs text-primary border-primary/40 h-8"
                          />
                        </div>
                      </div>

                      {/* Lucro e Margem Estimada */}
                      <div className="hidden lg:flex flex-col text-right pl-2 min-w-[90px]">
                        <span className="text-[10px] text-muted-foreground">Lucro m²</span>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(profit)} ({margin.toFixed(0)}%)
                        </span>
                      </div>

                      {/* Ações: Editar e Excluir */}
                      <div className="flex items-center gap-1 pl-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEditModal(key)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Editar detalhes"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteFilm(key)}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          title="Excluir película"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Dados da Empresa */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" /> Dados da Loja / Empresa
            </CardTitle>
            <CardDescription>
              Essas informações serão exibidas nos orçamentos em PDF e mensagens do WhatsApp.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cfg-name">Nome Fantasia / Razão Social</Label>
              <Input
                id="cfg-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cfg-doc">CNPJ ou CPF</Label>
                <Input
                  id="cfg-doc"
                  value={document}
                  onChange={(e) => setDocument(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cfg-mail">E-mail Comercial</Label>
                <Input
                  id="cfg-mail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cfg-phone">Telefone Fixo</Label>
                <Input
                  id="cfg-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cfg-whats">WhatsApp da Empresa</Label>
                <Input
                  id="cfg-whats"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="cfg-addr">Endereço Completo da Loja</Label>
                <Input
                  id="cfg-addr"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Termos de Garantia Padrão */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Termos de Garantia & Cuidados Padrão
            </CardTitle>
            <CardDescription>
              Texto padrão inserido automaticamente no rodapé de todos os orçamentos e ordens de serviço.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              rows={5}
              value={warrantyTerms}
              onChange={(e) => setWarrantyTerms(e.target.value)}
              className="w-full rounded-lg border bg-background p-3 text-xs leading-relaxed font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </CardContent>
        </Card>

        {/* Save button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={saving} className="gap-2 font-bold">
            <Save className="h-4 w-4" />
            {saving ? 'Salvando Alterações...' : 'Salvar Todas as Configurações'}
          </Button>
        </div>
      </form>

      {/* Modal para Cadastrar / Editar Tipo de Película */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Film className="h-5 w-5 text-primary" />
              {editingKey ? 'Editar Tipo de Película' : 'Cadastrar Novo Tipo de Película'}
            </DialogTitle>
            <DialogDescription>
              Adicione as características e valores por m² para usar na calculadora e orçamentos.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveModal} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Nome da Película *</Label>
              <Input
                placeholder="Ex: Película Carbon 70%, Película Antivandalismo PS8..."
                value={modalName}
                onChange={(e) => setModalName(e.target.value)}
                required
                className="h-9 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Selo / Linha</Label>
                <Input
                  placeholder="Ex: Premium, Térmica, Segurança..."
                  value={modalBadge}
                  onChange={(e) => setModalBadge(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Categoria Principal</Label>
                <select
                  value={modalCategory}
                  onChange={(e) =>
                    setModalCategory(
                      e.target.value as 'AUTOMOTIVO' | 'RESIDENCIAL' | 'COMERCIAL' | 'TODOS'
                    )
                  }
                  className="w-full rounded-lg border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring h-9"
                >
                  <option value="TODOS">Todos (Auto & Residencial)</option>
                  <option value="AUTOMOTIVO">🚗 Automotivo</option>
                  <option value="RESIDENCIAL">🏠 Residencial / Arquitetura</option>
                  <option value="COMERCIAL">🏢 Comercial / Vitrines</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Custo do Material (R$/m²)</Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="35"
                    value={modalCost}
                    onChange={(e) => setModalCost(Number(e.target.value))}
                    className="pl-8 font-mono h-9 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-primary">Preço de Venda Padrão (R$/m²)</Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-primary">R$</span>
                  <Input
                    type="number"
                    step="5"
                    min="0"
                    placeholder="120"
                    value={modalPrice}
                    onChange={(e) => setModalPrice(Number(e.target.value))}
                    className="pl-8 font-mono font-bold text-sm text-primary border-primary/40 h-9"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Descrição / Benefícios</Label>
              <textarea
                rows={2}
                placeholder="Ex: Alta proteção solar, 99% UV, garantia de 5 anos..."
                value={modalDesc}
                onChange={(e) => setModalDesc(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="h-9"
              >
                Cancelar
              </Button>
              <Button type="submit" className="gap-1.5 font-bold h-9">
                <Save className="h-4 w-4" />
                {editingKey ? 'Salvar Alterações' : 'Cadastrar Película'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
