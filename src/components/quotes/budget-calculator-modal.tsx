'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  Calculator,
  Plus,
  ArrowRight,
  Copy,
  Check,
  Sparkles,
  Layers,
  Film,
  Tag,
  Ruler,
  Scissors,
  DollarSign,
} from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import {
  filmPricingService,
  DEFAULT_FILM_PRICES,
  type FilmPriceConfig,
} from '@/services/film-pricing.service'
import { toast } from '@/hooks/use-toast'

interface BudgetCalculatorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onApplyCalculation?: (item: {
    description: string
    quantity: number
    width: number
    height: number
    area: number
    unitPrice: number
    totalPrice: number
  }) => void
}

export function BudgetCalculatorModal({
  open,
  onOpenChange,
  onApplyCalculation,
}: BudgetCalculatorModalProps) {
  const [pricingConfig, setPricingConfig] = useState<Record<string, FilmPriceConfig>>(DEFAULT_FILM_PRICES)
  const [selectedFilmKey, setSelectedFilmKey] = useState<string>('poliester')

  // Inputs dos Vidros
  const [description, setDescription] = useState('Vidros / Janelas Sacada')
  const [quantity, setQuantity] = useState<number>(4)
  const [width, setWidth] = useState<number>(1.9)
  const [height, setHeight] = useState<number>(0.5)

  // Bobina & Metro Corrido
  const [rollWidth, setRollWidth] = useState<number>(1.52)
  const [costPerLinearMeter, setCostPerLinearMeter] = useState<number>(53.0)
  const [wasteMarginPercent, setWasteMarginPercent] = useState<number>(10) // 10% de folga/refile

  // PreÃ§o de venda cobrado do cliente por mÂ²
  const [salePricePerM2, setSalePricePerM2] = useState<number>(120.0)
  const [laborCost, setLaborCost] = useState<number>(0) // MÃ£o de obra / instalaÃ§Ã£o adicional se houver
  const [discount, setDiscount] = useState<number>(0)
  const [copied, setCopied] = useState(false)

  // Load configured prices from service
  useEffect(() => {
    if (open) {
      const config = filmPricingService.getPricing()
      setPricingConfig(config)
      const current = config[selectedFilmKey] || config.poliester
      if (current) {
        const rw = current.rollWidth || 1.52
        setRollWidth(rw)
        const costLinear = current.costPerLinearMeter || Number(((current.costPerM2 || 35) * rw).toFixed(2))
        setCostPerLinearMeter(costLinear)
        setSalePricePerM2(current.pricePerM2)
      }
    }
  }, [open, selectedFilmKey])

  // Handle film type change
  const handleFilmChange = (key: string) => {
    setSelectedFilmKey(key)
    const film = pricingConfig[key]
    if (film) {
      const rw = film.rollWidth || 1.52
      setRollWidth(rw)
      const costLinear = film.costPerLinearMeter || Number(((film.costPerM2 || 35) * rw).toFixed(2))
      setCostPerLinearMeter(costLinear)
      setSalePricePerM2(film.pricePerM2)
    }
  }

  // Calculations
  const calc = useMemo(() => {
    const individualArea = (width || 0) * (height || 0)
    const totalGlassArea = individualArea * (quantity || 1)

    // Custo convertido por mÂ² da bobina
    const actualCostPerM2 = rollWidth > 0 ? costPerLinearMeter / rollWidth : 0

    // Ãrea total com folga/refile para corte
    const areaWithWaste = totalGlassArea * (1 + (wasteMarginPercent || 0) / 100)

    // Metros corridos desenrolados da bobina
    const linearMetersNeeded = rollWidth > 0 ? areaWithWaste / rollWidth : 0

    // Custo real do material = Metros corridos desenrolados Ã— Custo do metro corrido
    const materialCostTotal = linearMetersNeeded * (costPerLinearMeter || 0)
    const totalCost = materialCostTotal + (laborCost || 0)

    // PreÃ§o de venda cobrado por mÂ² dos vidros + mÃ£o de obra se houver
    const rawSalePrice = totalGlassArea * (salePricePerM2 || 0) + (laborCost || 0)
    const finalPrice = Math.max(0, rawSalePrice - (discount || 0))
    const profit = finalPrice - totalCost
    const margin = finalPrice > 0 ? (profit / finalPrice) * 100 : 0
    const pricePerUnit = quantity > 0 ? finalPrice / quantity : 0

    return {
      individualArea: Number(individualArea.toFixed(4)),
      totalArea: Number(totalGlassArea.toFixed(2)),
      actualCostPerM2: Number(actualCostPerM2.toFixed(2)),
      linearMetersNeeded: Number(linearMetersNeeded.toFixed(2)),
      materialCostTotal: Number(materialCostTotal.toFixed(2)),
      totalCost: Number(totalCost.toFixed(2)),
      rawSalePrice: Number(rawSalePrice.toFixed(2)),
      finalPrice: Number(finalPrice.toFixed(2)),
      profit: Number(profit.toFixed(2)),
      margin: Number(margin.toFixed(1)),
      pricePerUnit: Number(pricePerUnit.toFixed(2)),
    }
  }, [width, height, quantity, rollWidth, costPerLinearMeter, wasteMarginPercent, salePricePerM2, laborCost, discount])

  const handleApply = () => {
    if (onApplyCalculation) {
      const filmName = pricingConfig[selectedFilmKey]?.name || 'PelÃ­cula'
      onApplyCalculation({
        description: `${filmName} - ${description} (${quantity} vidros â€¢ ${calc.totalArea} mÂ²)`,
        quantity: 1,
        width: width,
        height: height,
        area: calc.totalArea,
        unitPrice: calc.finalPrice,
        totalPrice: calc.finalPrice,
      })
      toast({
        title: 'CÃ¡lculo aplicado!',
        description: 'Item inserido no orÃ§amento com valor total calculado.',
        variant: 'success' as 'default',
      })
      onOpenChange(false)
    }
  }

  const handleCopySummary = () => {
    const filmName = pricingConfig[selectedFilmKey]?.name || 'PelÃ­cula'
    const text = `ðŸ“ *CÃ¡lculo de PelÃ­cula por mÂ² (Venda) & Metro Corrido (Custo)*
PelÃ­cula: *${filmName}*
Local: ${description}
Vidros: ${quantity} unidade(s) de ${width}m Ã— ${height}m
Ãrea Total do Vidro: *${calc.totalArea} mÂ²*
Consumo Estimado da Bobina (${rollWidth}m): *~${calc.linearMetersNeeded} metros corridos*
Valor Cobrado do Cliente: ${formatCurrency(salePricePerM2)}/mÂ²
Valor Total da Proposta: *${formatCurrency(calc.finalPrice)}*`

    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({ title: 'Resumo copiado para a Ã¡rea de transferÃªncia!' })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto w-full sm:max-w-2xl p-4 sm:p-6 gap-4 rounded-t-2xl sm:rounded-2xl top-auto bottom-0 sm:top-1/2 sm:bottom-auto translate-y-0 sm:-translate-y-1/2">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Calculadora Inteligente de PelÃ­culas & Metragem
          </DialogTitle>
          <DialogDescription>
            Compre por <strong>Metro Corrido</strong> de bobina e venda por <strong>Metro Quadrado (mÂ²)</strong> conforme o tamanho dos vidros.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* SeÃ§Ã£o 1: SeleÃ§Ã£o do Tipo de PelÃ­cula */}
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="calc-film" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Film className="h-4 w-4 text-primary" /> Tipo de PelÃ­cula
              </Label>
              <Badge variant="outline" className="text-[11px] font-mono">
                Venda: {pricingConfig[selectedFilmKey]?.pricePerM2 ? formatCurrency(pricingConfig[selectedFilmKey].pricePerM2) + '/mÂ²' : ''}
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {Object.entries(pricingConfig).map(([key, item]) => {
                const isSelected = selectedFilmKey === key
                const price = item.pricePerM2 || 0

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleFilmChange(key)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm ring-2 ring-primary/20'
                        : 'border-border bg-background hover:bg-muted/50 text-foreground'
                    }`}
                  >
                    <span className="text-xs font-semibold line-clamp-1">{item.name}</span>
                    <span className="text-[11px] font-mono text-muted-foreground mt-0.5">
                      {formatCurrency(price)}/mÂ²
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* SeÃ§Ã£o 2: Medidas dos Vidros */}
          <div className="rounded-xl border bg-card p-4 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" /> 1. Medidas do Local & Vidros do Cliente
            </h4>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div className="sm:col-span-4">
                <Label htmlFor="calc-desc" className="text-xs">DescriÃ§Ã£o do Local / Vidro</Label>
                <Input
                  id="calc-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Vidros da sacada / Porta de correr / Janela quarto"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="calc-qty" className="text-xs">Quantidade de Vidros</Label>
                <Input
                  id="calc-qty"
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  className="mt-1 font-mono font-bold"
                />
              </div>

              <div>
                <Label htmlFor="calc-w" className="text-xs">Largura (m)</Label>
                <Input
                  id="calc-w"
                  type="number"
                  step="0.01"
                  min={0.05}
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  className="mt-1 font-mono"
                />
              </div>

              <div>
                <Label htmlFor="calc-h" className="text-xs">Altura (m)</Label>
                <Input
                  id="calc-h"
                  type="number"
                  step="0.01"
                  min={0.05}
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="mt-1 font-mono"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-primary">Ãrea Total dos Vidros</Label>
                <div className="mt-1 flex h-9 items-center justify-center rounded-lg bg-primary/10 font-mono text-sm font-bold text-primary">
                  {calc.totalArea} mÂ²
                </div>
              </div>
            </div>
          </div>

          {/* SeÃ§Ã£o 3: Consumo da Bobina (Metro Corrido) & Venda por mÂ² */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Lado Esquerdo: Compra / Custo da Bobina */}
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Ruler className="h-4 w-4 text-primary" /> Custo por Metro Corrido da Bobina
              </h4>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="calc-rw" className="text-[11px]">Bobina (Largura)</Label>
                  <Input
                    id="calc-rw"
                    type="number"
                    step="0.01"
                    value={rollWidth}
                    onChange={(e) => setRollWidth(Number(e.target.value) || 1.52)}
                    className="font-mono text-xs h-8"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="calc-waste" className="text-[11px]">Refile / Perda (%)</Label>
                  <Input
                    id="calc-waste"
                    type="number"
                    step="5"
                    value={wasteMarginPercent}
                    onChange={(e) => setWasteMarginPercent(Number(e.target.value))}
                    className="font-mono text-xs h-8"
                  />
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <Label htmlFor="calc-linear-cost" className="text-xs font-semibold">
                  PreÃ§o Pago por Metro Corrido (R$/m)
                </Label>
                <Input
                  id="calc-linear-cost"
                  type="number"
                  step="1"
                  value={costPerLinearMeter}
                  onChange={(e) => setCostPerLinearMeter(Number(e.target.value))}
                  className="font-mono font-bold text-foreground"
                />
              </div>

              {/* InformaÃ§Ãµes de Consumo */}
              <div className="rounded-lg bg-muted/40 p-2.5 space-y-1 text-xs text-muted-foreground border">
                <div className="flex justify-between">
                  <span>Bobina gasta desenrolada:</span>
                  <strong className="text-foreground font-mono">~{calc.linearMetersNeeded} metros</strong>
                </div>
                <div className="flex justify-between">
                  <span>Custo convertido por mÂ²:</span>
                  <span className="font-mono">{formatCurrency(calc.actualCostPerM2)}/mÂ²</span>
                </div>
                <div className="flex justify-between pt-1 border-t font-semibold text-foreground">
                  <span>Custo Total do Material:</span>
                  <span className="text-foreground">{formatCurrency(calc.materialCostTotal)}</span>
                </div>
              </div>
            </div>

            {/* Lado Direito: PreÃ§o de Venda por mÂ² */}
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-emerald-500" /> PreÃ§o de Venda por mÂ²
              </h4>

              <div className="space-y-1">
                <Label htmlFor="calc-sale-m2" className="text-xs font-semibold text-primary">
                  Valor Cobrado do Cliente (R$/mÂ²)
                </Label>
                <Input
                  id="calc-sale-m2"
                  type="number"
                  step="5"
                  value={salePricePerM2}
                  onChange={(e) => setSalePricePerM2(Number(e.target.value))}
                  className="font-bold text-base text-primary font-mono"
                />
                <span className="text-[11px] text-muted-foreground block pt-0.5">
                  {calc.totalArea} mÂ² de vidro Ã— {formatCurrency(salePricePerM2)}/mÂ² = {formatCurrency(calc.totalArea * salePricePerM2)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="space-y-1">
                  <Label htmlFor="calc-labor" className="text-[11px]">MÃ£o de Obra Fixa (R$)</Label>
                  <Input
                    id="calc-labor"
                    type="number"
                    step="10"
                    value={laborCost}
                    onChange={(e) => setLaborCost(Number(e.target.value))}
                    className="font-mono text-xs h-8"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="calc-disc" className="text-[11px]">Desconto (R$)</Label>
                  <Input
                    id="calc-disc"
                    type="number"
                    step="5"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="font-mono text-xs h-8"
                  />
                </div>
              </div>

              <div className="pt-2 border-t flex justify-between items-baseline text-xs font-medium">
                <span className="font-semibold text-foreground">PreÃ§o Total da Proposta:</span>
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(calc.finalPrice)}
                </span>
              </div>
            </div>
          </div>

          {/* SeÃ§Ã£o 4: Lucro LÃ­quido Real & Margem */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20 p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 block">
                  Lucro LÃ­quido do ServiÃ§o
                </span>
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(calc.profit)}
                </span>
                <span className="text-[11px] text-muted-foreground block mt-0.5">
                  Venda ({formatCurrency(calc.finalPrice)}) âˆ’ Custo Bobina ({formatCurrency(calc.materialCostTotal)})
                </span>
              </div>

              <div className="text-right">
                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 block">
                  Margem de Lucro Real
                </span>
                <Badge
                  variant="success"
                  className="text-base font-bold px-3 py-1 mt-1"
                >
                  {calc.margin}%
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleCopySummary}
            className="gap-1.5"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copiado!' : 'Copiar Resumo'}
          </Button>

          {onApplyCalculation ? (
            <Button type="button" onClick={handleApply} className="gap-1.5 font-bold">
              <Plus className="h-4 w-4" /> Inserir no OrÃ§amento
            </Button>
          ) : (
            <Button type="button" onClick={() => onOpenChange(false)}>
              Concluir
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

