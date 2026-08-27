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

  // Inputs
  const [description, setDescription] = useState('Vidros / Janelas Sacada')
  const [quantity, setQuantity] = useState<number>(4)
  const [width, setWidth] = useState<number>(1.9)
  const [height, setHeight] = useState<number>(0.5)

  // Preço e custo por m²
  const [salePricePerM2, setSalePricePerM2] = useState<number>(120.0)
  const [costPerM2, setCostPerM2] = useState<number>(35.0)
  const [laborCost, setLaborCost] = useState<number>(200.0) // Mão de obra fixa adicional se houver
  const [discount, setDiscount] = useState<number>(0)
  const [copied, setCopied] = useState(false)

  // Load configured prices from service
  useEffect(() => {
    if (open) {
      const config = filmPricingService.getPricing()
      setPricingConfig(config)
      const current = config[selectedFilmKey] || config.poliester
      if (current) {
        setSalePricePerM2(current.pricePerM2)
        setCostPerM2(current.costPerM2)
      }
    }
  }, [open, selectedFilmKey])

  // Handle film type change
  const handleFilmChange = (key: string) => {
    setSelectedFilmKey(key)
    const film = pricingConfig[key]
    if (film) {
      setSalePricePerM2(film.pricePerM2)
      setCostPerM2(film.costPerM2)
    }
  }

  // Calculations
  const calc = useMemo(() => {
    const individualArea = (width || 0) * (height || 0)
    const totalArea = individualArea * (quantity || 1)

    // Custo do material = Área total × Custo por m²
    const materialCostTotal = totalArea * (costPerM2 || 0)
    const totalCost = materialCostTotal + (laborCost || 0)

    // Preço bruto de venda = (Área total × Preço de venda por m²) + Mão de obra se destacada
    const rawSalePrice = totalArea * (salePricePerM2 || 0) + (laborCost || 0)
    const finalPrice = Math.max(0, rawSalePrice - (discount || 0))
    const profit = finalPrice - totalCost
    const margin = finalPrice > 0 ? (profit / finalPrice) * 100 : 0
    const pricePerUnit = quantity > 0 ? finalPrice / quantity : 0

    return {
      individualArea: Number(individualArea.toFixed(4)),
      totalArea: Number(totalArea.toFixed(2)),
      materialCostTotal: Number(materialCostTotal.toFixed(2)),
      totalCost: Number(totalCost.toFixed(2)),
      rawSalePrice: Number(rawSalePrice.toFixed(2)),
      finalPrice: Number(finalPrice.toFixed(2)),
      profit: Number(profit.toFixed(2)),
      margin: Number(margin.toFixed(1)),
      pricePerUnit: Number(pricePerUnit.toFixed(2)),
    }
  }, [width, height, quantity, salePricePerM2, costPerM2, laborCost, discount])

  const handleApply = () => {
    if (onApplyCalculation) {
      const filmName = pricingConfig[selectedFilmKey]?.name || 'Película'
      onApplyCalculation({
        description: `${filmName} - ${description} (${quantity} un de ${width}m x ${height}m = ${calc.totalArea}m²)`,
        quantity: quantity,
        width: width,
        height: height,
        area: calc.totalArea,
        unitPrice: calc.pricePerUnit,
        totalPrice: calc.finalPrice,
      })
      toast({
        title: 'Cálculo aplicado!',
        description: 'Item inserido no orçamento.',
        variant: 'success' as 'default',
      })
      onOpenChange(false)
    }
  }

  const handleCopySummary = () => {
    const filmName = pricingConfig[selectedFilmKey]?.name || 'Película'
    const text = `📐 *Cálculo de Orçamento por m²*
Película: *${filmName}*
Local: ${description}
Medidas: ${quantity} vidros (${width}m x ${height}m)
Área Total: *${calc.totalArea} m²*
Valor por m²: ${formatCurrency(salePricePerM2)}/m²
Valor Final: *${formatCurrency(calc.finalPrice)}*`

    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({ title: 'Resumo copiado para a área de transferência!' })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Calculadora Inteligente de Películas & Metragem (m²)
          </DialogTitle>
          <DialogDescription>
            Selecione o tipo de película, informe as medidas dos vidros e obtenha o cálculo exato de m², custo e venda.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Seção 1: Seleção do Tipo de Película */}
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="calc-film" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Film className="h-4 w-4 text-primary" /> Tipo de Película
              </Label>
              <Badge variant="outline" className="text-[11px] font-mono">
                {pricingConfig[selectedFilmKey]?.pricePerM2 ? formatCurrency(pricingConfig[selectedFilmKey].pricePerM2) + '/m²' : ''}
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { key: 'comum', label: 'Comum (Tintada)' },
                { key: 'poliester', label: 'Poliéster' },
                { key: 'nano_ceramica', label: 'Nano Cerâmica' },
                { key: 'jateado', label: 'Jateado' },
                { key: 'blackout', label: 'Blackout' },
              ].map((item) => {
                const isSelected = selectedFilmKey === item.key
                const price = pricingConfig[item.key]?.pricePerM2 || 0

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleFilmChange(item.key)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm ring-2 ring-primary/20'
                        : 'border-border bg-background hover:bg-muted/50 text-foreground'
                    }`}
                  >
                    <span className="text-xs font-semibold">{item.label}</span>
                    <span className="text-[11px] font-mono text-muted-foreground mt-0.5">
                      {formatCurrency(price)}/m²
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Seção 2: Medidas dos Vidros */}
          <div className="rounded-xl border bg-card p-4 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" /> Medidas do Local / Vidros
            </h4>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div className="sm:col-span-4">
                <Label htmlFor="calc-desc" className="text-xs">Descrição do Local / Vidro</Label>
                <Input
                  id="calc-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Vidros da sacada / Porta de correr / Janela quarto"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="calc-qty" className="text-xs">Quantidade</Label>
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
                <Label className="text-xs">Área Total</Label>
                <div className="mt-1 flex h-9 items-center justify-center rounded-lg bg-primary/10 font-mono text-sm font-bold text-primary">
                  {calc.totalArea} m²
                </div>
              </div>
            </div>
          </div>

          {/* Seção 3: Valores por m² & Margem */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Custos por m² */}
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Custos por m² e Mão de Obra
              </h4>

              <div className="space-y-2">
                <Label htmlFor="calc-cost-m2" className="text-xs">
                  Custo Material Película (R$/m²)
                </Label>
                <Input
                  id="calc-cost-m2"
                  type="number"
                  step="1"
                  value={costPerM2}
                  onChange={(e) => setCostPerM2(Number(e.target.value))}
                  className="font-mono"
                />
                <span className="text-[11px] text-muted-foreground block">
                  Custo Total Material: <strong>{formatCurrency(calc.materialCostTotal)}</strong>
                </span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="calc-labor" className="text-xs">
                  Taxa Mão de Obra / Instalação (R$)
                </Label>
                <Input
                  id="calc-labor"
                  type="number"
                  step="10"
                  value={laborCost}
                  onChange={(e) => setLaborCost(Number(e.target.value))}
                  className="font-mono"
                />
              </div>

              <div className="pt-2 border-t flex justify-between text-xs font-medium">
                <span>Custo Total de Execução:</span>
                <span className="font-bold text-foreground">{formatCurrency(calc.totalCost)}</span>
              </div>
            </div>

            {/* Venda por m² */}
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Preço de Venda por m²
              </h4>

              <div className="space-y-2">
                <Label htmlFor="calc-sale-m2" className="text-xs">
                  Valor Cobrado (R$/m²)
                </Label>
                <Input
                  id="calc-sale-m2"
                  type="number"
                  step="5"
                  value={salePricePerM2}
                  onChange={(e) => setSalePricePerM2(Number(e.target.value))}
                  className="font-bold text-base text-primary font-mono"
                />
                <span className="text-[11px] text-muted-foreground block">
                  {calc.totalArea} m² × {formatCurrency(salePricePerM2)} = {formatCurrency(calc.totalArea * salePricePerM2)}
                </span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="calc-disc" className="text-xs">
                  Desconto Concedido (R$)
                </Label>
                <Input
                  id="calc-disc"
                  type="number"
                  step="5"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="font-mono"
                />
              </div>

              <div className="pt-2 border-t flex justify-between items-baseline text-xs font-medium">
                <span>Preço Final a Cobrar:</span>
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(calc.finalPrice)}
                </span>
              </div>
            </div>
          </div>

          {/* Seção 4: Card de Lucro e Margem */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20 p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 block">
                  Lucro Líquido Estimado
                </span>
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(calc.profit)}
                </span>
              </div>

              <div className="text-right">
                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 block">
                  Margem de Lucro
                </span>
                <Badge
                  variant="success"
                  className="text-sm font-bold px-2.5 py-1"
                >
                  {calc.margin}%
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
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
            <Button type="button" onClick={handleApply} className="gap-1.5">
              <Plus className="h-4 w-4" /> Inserir no Orçamento
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
