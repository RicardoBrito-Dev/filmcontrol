'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Scissors,
  Plus,
  Trash2,
  RotateCw,
  Layers,
  Printer,
  FileText,
  Search,
  CheckCircle2,
  ArrowRight,
  Edit3,
  Download,
  AlertCircle,
  FolderOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CoilVisualizer } from '@/components/cutting/coil-visualizer'
import { optimizeCoilCut, type CutPiece } from '@/lib/cutting-optimizer'
import { quoteService, type QuoteWithRelations } from '@/services/quote.service'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

const COMMON_COIL_WIDTHS = [
  { label: '1,52m (Padrão)', value: 1.52 },
  { label: '1,00m (Médio)', value: 1.0 },
  { label: '0,76m (Portas/Auto)', value: 0.76 },
  { label: '0,50m (Retalho)', value: 0.5 },
  { label: '1,82m (Especial)', value: 1.82 },
]

export function CuttingOptimizerView() {
  const searchParams = useSearchParams()
  const quoteIdParam = searchParams.get('quoteId')

  // Aba ativa no celular: 'INPUTS' (Medidas) | 'MAP' (Mapa de Corte)
  const [mobileTab, setMobileTab] = useState<'INPUTS' | 'MAP'>('INPUTS')

  // Configuração da Bobina
  const [coilWidth, setCoilWidth] = useState<number>(1.52)
  const [unitCostPerMeter, setUnitCostPerMeter] = useState<number>(35.0)

  // Orçamento importado atualmente (se houver)
  const [activeQuote, setActiveQuote] = useState<QuoteWithRelations | null>(null)

  // Modal de Seleção de Orçamento
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false)
  const [quotesList, setQuotesList] = useState<QuoteWithRelations[]>([])
  const [loadingQuotes, setLoadingQuotes] = useState(false)
  const [quoteSearchTerm, setQuoteSearchTerm] = useState('')

  // Lista de Vidros/Peças para Corte
  const [pieces, setPieces] = useState<CutPiece[]>([
    {
      id: 'p1',
      label: 'Vidro Grande Sala',
      width: 1.2,
      height: 0.8,
      quantity: 2,
      allowRotation: true,
    },
    {
      id: 'p2',
      label: 'Janela Quarto',
      width: 0.7,
      height: 0.5,
      quantity: 4,
      allowRotation: true,
    },
    {
      id: 'p3',
      label: 'Basculante',
      width: 0.6,
      height: 0.4,
      quantity: 2,
      allowRotation: true,
    },
  ])

  // Se vier quoteId na URL, busca e carrega automaticamente
  useEffect(() => {
    async function loadQuoteFromUrl() {
      if (!quoteIdParam) return
      try {
        const q = await quoteService.getById(quoteIdParam)
        if (q) {
          applyQuoteToOptimizer(q)
        }
      } catch (e) {
        console.error('Erro ao carregar orçamento por URL:', e)
      }
    }
    loadQuoteFromUrl()
  }, [quoteIdParam])

  // Carrega lista de orçamentos ao abrir o modal
  const handleOpenQuoteModal = async () => {
    setIsQuoteModalOpen(true)
    setLoadingQuotes(true)
    try {
      const data = await quoteService.list()
      setQuotesList(data)
    } catch (e) {
      console.error(e)
      toast({ title: 'Erro ao carregar orçamentos', variant: 'destructive' })
    } finally {
      setLoadingQuotes(false)
    }
  }

  // Aplica as medidas de um orçamento na lista de corte
  const applyQuoteToOptimizer = (quote: QuoteWithRelations) => {
    setActiveQuote(quote)

    if (!quote.items || quote.items.length === 0) {
      toast({
        title: `Orçamento #${quote.number} sem itens cadastrados`,
        variant: 'destructive',
      })
      return
    }

    const convertedPieces: CutPiece[] = []

    quote.items.forEach((item, index) => {
      const w = Number(item.width) || 0
      const h = Number(item.height) || 0
      const qty = Number(item.quantity) || 1

      if (w > 0 && h > 0) {
        convertedPieces.push({
          id: `qi_${item.id || index}`,
          label: item.description || `Peça ${index + 1}`,
          width: w,
          height: h,
          quantity: qty,
          allowRotation: true,
        })
      } else {
        // Se for pacote ou serviço sem medida explícita (ex: automotivo padrão)
        convertedPieces.push({
          id: `qi_${item.id || index}`,
          label: item.description || `Serviço ${index + 1}`,
          width: 0.85,
          height: 0.55,
          quantity: qty,
          allowRotation: true,
        })
      }
    })

    if (convertedPieces.length > 0) {
      setPieces(convertedPieces)
      setIsQuoteModalOpen(false)
      toast({
        title: `Medidas do Orçamento #${quote.number} importadas!`,
        description: `${convertedPieces.length} peça(s) prontas para corte.`,
        variant: 'success' as 'default',
      })
      // No mobile, após importar, já pode mostrar o mapa ou as medidas
      setMobileTab('MAP')
    }
  }

  // Filtragem da lista de orçamentos no modal
  const filteredQuotes = useMemo(() => {
    if (!quoteSearchTerm.trim()) return quotesList
    const term = quoteSearchTerm.toLowerCase().trim()
    return quotesList.filter(
      (q) =>
        q.number.toLowerCase().includes(term) ||
        q.customer?.name?.toLowerCase().includes(term) ||
        (q.vehicle && `${q.vehicle.brand} ${q.vehicle.model}`.toLowerCase().includes(term))
    )
  }, [quotesList, quoteSearchTerm])

  // Cálculo de Otimização Reativo
  const optimizationResult = useMemo(() => {
    const validPieces = pieces.filter((p) => p.width > 0 && p.height > 0 && p.quantity > 0)
    return optimizeCoilCut(validPieces, coilWidth > 0 ? coilWidth : 1.52)
  }, [pieces, coilWidth])

  // Adicionar nova peça
  const handleAddPiece = () => {
    const nextNum = pieces.length + 1
    setPieces((prev) => [
      ...prev,
      {
        id: `p_${Date.now()}`,
        label: `Vidro ${nextNum}`,
        width: 1.0,
        height: 0.6,
        quantity: 1,
        allowRotation: true,
      },
    ])
  }

  // Atualizar campo de uma peça
  const handleUpdatePiece = (id: string, field: keyof CutPiece, val: any) => {
    setPieces((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: val } : p))
    )
  }

  // Ajustar quantidade rápida (+ / -)
  const handleAdjustQuantity = (id: string, delta: number) => {
    setPieces((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, quantity: Math.max(1, (p.quantity || 1) + delta) } : p
      )
    )
  }

  // Remover peça
  const handleRemovePiece = (id: string) => {
    setPieces((prev) => prev.filter((p) => p.id !== id))
  }

  // Carregar exemplos práticos
  const handleLoadPreset = (type: 'SACADA' | 'AUTOMOTIVO' | 'PORTAS') => {
    setActiveQuote(null)
    if (type === 'SACADA') {
      setCoilWidth(1.52)
      setPieces([
        { id: 'sc1', label: 'Folha Sacada 1', width: 0.72, height: 1.45, quantity: 4, allowRotation: true },
        { id: 'sc2', label: 'Folha Fixa', width: 0.55, height: 1.45, quantity: 2, allowRotation: true },
        { id: 'sc3', label: 'Bandeira Superior', width: 0.72, height: 0.40, quantity: 4, allowRotation: true },
      ])
    } else if (type === 'AUTOMOTIVO') {
      setCoilWidth(1.52)
      setPieces([
        { id: 'au1', label: 'Parabrisa (Não girar)', width: 1.40, height: 0.90, quantity: 1, allowRotation: false },
        { id: 'au2', label: 'Traseiro (Não girar)', width: 1.25, height: 0.75, quantity: 1, allowRotation: false },
        { id: 'au3', label: 'Laterais Dianteiras', width: 0.75, height: 0.48, quantity: 2, allowRotation: true },
        { id: 'au4', label: 'Laterais Traseiras', width: 0.70, height: 0.45, quantity: 2, allowRotation: true },
        { id: 'au5', label: 'Quebra-ventos', width: 0.30, height: 0.25, quantity: 2, allowRotation: true },
      ])
    } else if (type === 'PORTAS') {
      setCoilWidth(1.0)
      setPieces([
        { id: 'pt1', label: 'Porta de Correr', width: 0.95, height: 2.10, quantity: 2, allowRotation: false },
        { id: 'pt2', label: 'Faixa Jateada', width: 0.95, height: 0.40, quantity: 2, allowRotation: true },
      ])
    }
  }

  return (
    <div className="space-y-4 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Scissors className="h-5 w-5 text-primary" /> Otimizador de Bobinas
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Encaixe automático horizontal vs vertical para não perder material.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Botão Principal: Puxar de um Orçamento */}
          <Button
            onClick={handleOpenQuoteModal}
            className="gap-1.5 text-xs font-bold h-8.5 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            <FolderOpen className="h-4 w-4" /> Puxar de um Orçamento
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5 text-xs font-semibold print:hidden h-8.5"
          >
            <Printer className="h-3.5 w-3.5" /> Imprimir
          </Button>
        </div>
      </div>

      {/* Banner de Orçamento Ativo Importado */}
      {activeQuote && (
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-2.5 sm:p-3 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-4 w-4 text-primary shrink-0" />
            <div className="truncate">
              <span className="font-bold text-primary">Orçamento #{activeQuote.number}</span>
              <span className="text-muted-foreground ml-1.5 hidden sm:inline">
                • Cliente: {activeQuote.customer?.name || 'Cliente'} (Total: {formatCurrency(activeQuote.total)})
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveQuote(null)}
            className="text-xs text-muted-foreground hover:text-foreground underline shrink-0 font-medium ml-2"
          >
            Desvincular
          </button>
        </div>
      )}

      {/* Alternador de Abas Exclusivo para Celular */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-muted/60 rounded-xl lg:hidden print:hidden">
        <button
          type="button"
          onClick={() => setMobileTab('INPUTS')}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
            mobileTab === 'INPUTS'
              ? 'bg-card text-primary shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Layers className="h-4 w-4" />
          Medidas ({pieces.length})
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('MAP')}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
            mobileTab === 'MAP'
              ? 'bg-card text-primary shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Scissors className="h-4 w-4" />
          Ver Mapa ({optimizationResult.totalLengthUsed.toFixed(2)}m)
        </button>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Coluna Esquerda: Configurações & Peças */}
        <div
          className={`lg:col-span-5 space-y-4 print:hidden ${
            mobileTab === 'MAP' ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* Card 1: Largura da Bobina Editável */}
          <Card className="border shadow-sm">
            <CardHeader className="p-3.5 sm:p-5 pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-semibold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-primary" /> 1. Largura da Bobina
                </span>
                <span className="font-mono text-primary font-bold text-xs bg-primary/10 px-2 py-0.5 rounded">
                  {coilWidth}m
                </span>
              </CardTitle>
              <CardDescription className="text-[11px] sm:text-xs">
                Digite qualquer largura de rolo em metros.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-3.5 sm:p-5 pt-0 space-y-3">
              {/* Inputs da Bobina */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label htmlFor="coil-w-input" className="text-[11px] font-semibold">
                    Largura da Bobina (m) *
                  </Label>
                  <div className="relative">
                    <Input
                      id="coil-w-input"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min={0.1}
                      max={5.0}
                      value={coilWidth}
                      onChange={(e) =>
                        setCoilWidth(Math.max(0.1, parseFloat(e.target.value) || 0.1))
                      }
                      className="font-mono text-sm font-bold pl-3 pr-7 h-9 bg-background"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
                      m
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="cost-input" className="text-[11px] font-semibold">
                    Custo/Metro Linear (R$)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
                      R$
                    </span>
                    <Input
                      id="cost-input"
                      type="number"
                      inputMode="decimal"
                      step="1"
                      min={0}
                      value={unitCostPerMeter}
                      onChange={(e) => setUnitCostPerMeter(parseFloat(e.target.value) || 0)}
                      className="font-mono text-sm pl-8 h-9 bg-background"
                    />
                  </div>
                </div>
              </div>

              {/* Botões Rápidos de Larguras do Mercado */}
              <div className="space-y-1 pt-0.5">
                <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground">
                  Atalhos de Bobinas:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_COIL_WIDTHS.map((item) => (
                    <Button
                      key={item.value}
                      type="button"
                      variant={coilWidth === item.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCoilWidth(item.value)}
                      className="text-[11px] h-7 px-2 font-medium"
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Lista de Vidros */}
          <Card className="border shadow-sm">
            <CardHeader className="p-3.5 sm:p-5 pb-2 sm:pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xs sm:text-sm font-semibold flex items-center gap-1.5">
                  <Scissors className="h-4 w-4 text-primary" /> 2. Peças & Vidros
                </CardTitle>
                <CardDescription className="text-[11px] sm:text-xs">
                  Medidas em metros (ex: 1.20 = 1m20cm).
                </CardDescription>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddPiece}
                  className="gap-1 text-xs h-8 px-2.5 font-bold"
                >
                  <Plus className="h-3.5 w-3.5" /> + Vidro
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-3.5 sm:p-5 pt-0 space-y-3">
              {/* Barra com Botão Puxar Orçamento e Exemplos */}
              <div className="flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleOpenQuoteModal}
                  className="gap-1.5 text-[11px] h-7 px-2 border-primary/30 text-primary font-semibold hover:bg-primary/10"
                >
                  <FolderOpen className="h-3.5 w-3.5" /> Puxar de Orçamento
                </Button>

                <div className="flex items-center gap-1 text-xs overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => handleLoadPreset('SACADA')}
                    className="px-2 py-0.5 rounded bg-muted/50 hover:bg-muted border text-foreground font-medium text-[10px]"
                  >
                    Sacada
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadPreset('AUTOMOTIVO')}
                    className="px-2 py-0.5 rounded bg-muted/50 hover:bg-muted border text-foreground font-medium text-[10px]"
                  >
                    Auto
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadPreset('PORTAS')}
                    className="px-2 py-0.5 rounded bg-muted/50 hover:bg-muted border text-foreground font-medium text-[10px]"
                  >
                    Portas
                  </button>
                </div>
              </div>

              {/* Lista de Peças */}
              <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-0.5">
                {pieces.map((piece, index) => (
                  <div
                    key={piece.id}
                    className="rounded-xl border bg-muted/15 p-2.5 sm:p-3 space-y-2 relative hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Input
                        value={piece.label}
                        onChange={(e) => handleUpdatePiece(piece.id, 'label', e.target.value)}
                        placeholder={`Vidro ${index + 1}`}
                        className="h-7 text-xs font-semibold bg-background"
                      />

                      {pieces.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePiece(piece.id)}
                          className="text-destructive hover:bg-destructive/10 p-1.5 rounded transition-colors"
                          title="Remover peça"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 items-end">
                      <div className="space-y-0.5">
                        <Label className="text-[10px] text-muted-foreground font-semibold">
                          Largura (m)
                        </Label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          min={0.05}
                          value={piece.width}
                          onChange={(e) =>
                            handleUpdatePiece(piece.id, 'width', parseFloat(e.target.value) || 0)
                          }
                          className="h-8 text-xs font-mono font-bold text-center bg-background"
                        />
                      </div>

                      <div className="space-y-0.5">
                        <Label className="text-[10px] text-muted-foreground font-semibold">
                          Altura (m)
                        </Label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          min={0.05}
                          value={piece.height}
                          onChange={(e) =>
                            handleUpdatePiece(piece.id, 'height', parseFloat(e.target.value) || 0)
                          }
                          className="h-8 text-xs font-mono font-bold text-center bg-background"
                        />
                      </div>

                      <div className="space-y-0.5">
                        <Label className="text-[10px] text-muted-foreground font-semibold">
                          Qtd
                        </Label>
                        <div className="flex items-center border rounded-lg bg-background h-8 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => handleAdjustQuantity(piece.id, -1)}
                            className="px-2 h-full hover:bg-muted font-bold text-xs text-muted-foreground"
                          >
                            -
                          </button>
                          <span className="flex-1 text-center font-mono text-xs font-bold">
                            {piece.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAdjustQuantity(piece.id, 1)}
                            className="px-2 h-full hover:bg-muted font-bold text-xs text-muted-foreground"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Checkbox de Rotação */}
                    <div className="flex items-center justify-between pt-1 border-t border-muted/80 text-xs">
                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={piece.allowRotation}
                          onChange={(e) =>
                            handleUpdatePiece(piece.id, 'allowRotation', e.target.checked)
                          }
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-[11px] font-medium text-foreground">
                          Girar 90° (horizontal)
                        </span>
                      </label>

                      <span className="text-[10px] font-mono text-muted-foreground">
                        {(piece.width * piece.height * piece.quantity).toFixed(2)} m²
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Botão no fim da lista no mobile para ir pro mapa */}
              <div className="pt-2 lg:hidden">
                <Button
                  type="button"
                  onClick={() => setMobileTab('MAP')}
                  className="w-full gap-2 font-bold h-10 shadow-sm"
                >
                  Ver Mapa de Corte da Bobina <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Direita: Otimizador & Desenho Visual da Bobina */}
        <div
          className={`lg:col-span-7 space-y-4 ${
            mobileTab === 'INPUTS' ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* Botão no topo do mapa no celular para voltar para as medidas */}
          <div className="lg:hidden pb-1 flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMobileTab('INPUTS')}
              className="gap-1.5 text-xs font-semibold h-8"
            >
              <Edit3 className="h-3.5 w-3.5" /> Editar Medidas
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleOpenQuoteModal}
              className="gap-1.5 text-xs font-semibold h-8 text-primary"
            >
              <FolderOpen className="h-3.5 w-3.5" /> Puxar Orçamento
            </Button>
          </div>

          <CoilVisualizer
            result={optimizationResult}
            unitCostPerMeter={unitCostPerMeter}
          />
        </div>
      </div>

      {/* Modal para Selecionar e Puxar Orçamento */}
      <Dialog open={isQuoteModalOpen} onOpenChange={setIsQuoteModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col p-4 sm:p-6 gap-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <FolderOpen className="h-5 w-5 text-primary" /> Puxar Medidas de um Orçamento
            </DialogTitle>
            <DialogDescription className="text-xs">
              Escolha um orçamento para carregar automaticamente as medidas dos vidros na bancada de corte.
            </DialogDescription>
          </DialogHeader>

          {/* Campo de Busca Rápida */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, número (#ORC) ou carro..."
              value={quoteSearchTerm}
              onChange={(e) => setQuoteSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs sm:text-sm"
            />
          </div>

          {/* Lista de Orçamentos */}
          <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[380px] pr-1">
            {loadingQuotes ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                Carregando orçamentos cadastrados...
              </div>
            ) : filteredQuotes.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                Nenhum orçamento encontrado.
              </div>
            ) : (
              filteredQuotes.map((q) => {
                const itemsCount = q.items?.length || 0
                return (
                  <div
                    key={q.id}
                    onClick={() => applyQuoteToOptimizer(q)}
                    className="rounded-xl border bg-card p-3 shadow-sm hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 group"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-primary group-hover:underline">
                          #{q.number}
                        </span>
                        <span className="font-semibold text-xs text-foreground truncate">
                          {q.customer?.name || 'Cliente'}
                        </span>
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal">
                          {q.status}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        {q.vehicle && (
                          <span>🚗 {q.vehicle.brand} {q.vehicle.model}</span>
                        )}
                        <span>•</span>
                        <span>{itemsCount} peça(s)/serviço(s)</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0">
                      <span className="font-bold text-xs text-foreground font-mono">
                        {formatCurrency(q.total)}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-primary group-hover:bg-primary group-hover:text-primary-foreground font-bold px-2.5"
                      >
                        Usar <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <DialogFooter className="border-t pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsQuoteModalOpen(false)}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sticky Bottom Bar Flutuante para Celular */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t p-3 shadow-lg flex items-center justify-between gap-3 lg:hidden">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1 text-xs">
            <span className="font-semibold text-foreground truncate">
              Puxar: <strong className="text-primary font-mono text-sm">{optimizationResult.totalLengthUsed.toFixed(2)}m</strong>
            </span>
            <span>•</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
              {optimizationResult.efficiency}%
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground truncate">
            Bobina de {coilWidth}m • {optimizationResult.placedPieces.length} vidros
          </span>
        </div>

        {mobileTab === 'INPUTS' ? (
          <Button
            size="sm"
            onClick={() => setMobileTab('MAP')}
            className="gap-1.5 font-bold h-9 px-3.5 shrink-0 shadow-sm"
          >
            Ver Mapa ✂️
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setMobileTab('INPUTS')}
            className="gap-1.5 font-bold h-9 px-3.5 shrink-0 shadow-sm"
          >
            Medidas 📏
          </Button>
        )}
      </div>
    </div>
  )
}
