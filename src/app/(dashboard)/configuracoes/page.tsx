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
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    // Save film prices
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

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Configurações da Empresa & Tabela de Preços
        </h1>
        <p className="text-sm text-muted-foreground">
          Defina os valores padrão por metro quadrado (m²) das películas, dados fiscais e termos de garantia.
        </p>
      </div>

      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* Tabela de Preços por m² das Películas */}
        <Card className="border-primary/30 shadow-sm">
          <CardHeader className="bg-primary/5 rounded-t-xl pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2 text-foreground">
                  <Film className="h-5 w-5 text-primary" /> Tabela de Preços por Metro Quadrado (m²)
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Estes valores são carregados automaticamente na Calculadora Inteligente e nos novos Orçamentos.
                </CardDescription>
              </div>
              <Badge variant="default" className="text-xs">
                5 Linhas Configuradas
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {[
                {
                  key: 'comum',
                  title: 'Película Comum (Tintada / Standard)',
                  badge: 'Econômica',
                  desc: 'Película fumê padrão para escurecimento e privacidade básica.',
                },
                {
                  key: 'poliester',
                  title: 'Película Poliéster Profissional',
                  badge: 'Profissional',
                  desc: 'Película de poliéster com proteção UV, não desbota fácil e excelente acabamento.',
                },
                {
                  key: 'nano_ceramica',
                  title: 'Película Nano Cerâmica Alta Performance',
                  badge: 'Térmica / Premium',
                  desc: 'Alta tecnologia com até 90% de rejeição de calor infravermelho.',
                },
                {
                  key: 'jateado',
                  title: 'Película Jateada (Fosca / Privacidade)',
                  badge: 'Residencial / Comercial',
                  desc: 'Efeito jateado para banheiros, portas, sacadas, consultórios e divisórias.',
                },
                {
                  key: 'blackout',
                  title: 'Película Blackout (Bloqueio Total 100%)',
                  badge: 'Privacidade Total',
                  desc: 'Bloqueio 100% de passagem de luz para quartos, estúdios e vitrines.',
                },
              ].map((item) => {
                const config = filmPrices[item.key] || DEFAULT_FILM_PRICES[item.key]
                const profit = config.pricePerM2 - config.costPerM2
                const margin = config.pricePerM2 > 0 ? (profit / config.pricePerM2) * 100 : 0

                return (
                  <div
                    key={item.key}
                    className="rounded-xl border bg-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-primary/40 transition-colors"
                  >
                    <div className="space-y-1 max-w-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">
                          {item.title}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {item.badge}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {item.desc}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      {/* Custo m² */}
                      <div className="space-y-1">
                        <Label htmlFor={`cost-${item.key}`} className="text-[11px] text-muted-foreground">
                          Custo Material (R$/m²)
                        </Label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                          <Input
                            id={`cost-${item.key}`}
                            type="number"
                            step="1"
                            value={config.costPerM2}
                            onChange={(e) =>
                              handlePriceChange(item.key, 'costPerM2', Number(e.target.value))
                            }
                            className="w-28 pl-8 font-mono text-xs"
                          />
                        </div>
                      </div>

                      {/* Venda m² */}
                      <div className="space-y-1">
                        <Label htmlFor={`price-${item.key}`} className="text-[11px] text-primary font-bold">
                          Preço de Venda (R$/m²)
                        </Label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-primary">R$</span>
                          <Input
                            id={`price-${item.key}`}
                            type="number"
                            step="5"
                            value={config.pricePerM2}
                            onChange={(e) =>
                              handlePriceChange(item.key, 'pricePerM2', Number(e.target.value))
                            }
                            className="w-32 pl-8 font-mono font-bold text-sm text-primary border-primary/40"
                          />
                        </div>
                      </div>

                      {/* Lucro e Margem Estimada */}
                      <div className="hidden lg:flex flex-col text-right pl-2 min-w-[100px]">
                        <span className="text-[11px] text-muted-foreground">Lucro p/ m²</span>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(profit)} ({margin.toFixed(0)}%)
                        </span>
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
          <Button type="submit" disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Salvando Alterações...' : 'Salvar Todas as Configurações'}
          </Button>
        </div>
      </form>
    </div>
  )
}
