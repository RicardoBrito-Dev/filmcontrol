'use client'

import { useState, useMemo } from 'react'
import {
  Scissors,
  Plus,
  Trash2,
  RotateCw,
  Sparkles,
  Layers,
  HelpCircle,
  TrendingDown,
  DollarSign,
  Printer,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CoilVisualizer } from '@/components/cutting/coil-visualizer'
import { optimizeCoilCut, type CutPiece } from '@/lib/cutting-optimizer'
import { formatCurrency } from '@/lib/utils'

const COMMON_COIL_WIDTHS = [
  { label: '1,52m (Padrão)', value: 1.52 },
  { label: '1,00m (Médio)', value: 1.0 },
  { label: '0,76m (Portas/Auto)', value: 0.76 },
  { label: '0,50m (Faixas/Retalho)', value: 0.5 },
  { label: '1,82m (Especial)', value: 1.82 },
]

export function CuttingOptimizerView() {
  // Configuração da Bobina (Totalmente Editável)
  const [coilWidth, setCoilWidth] = useState<number>(1.52)
  const [unitCostPerMeter, setUnitCostPerMeter] = useState<number>(35.0) // R$ 35,00 por metro linear padrão

  // Lista de Vidros/Peças
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

  // Remover peça
  const handleRemovePiece = (id: string) => {
    setPieces((prev) => prev.filter((p) => p.id !== id))
  }

  // Carregar exemplos práticos
  const handleLoadPreset = (type: 'SACADA' | 'AUTOMOTIVO' | 'PORTAS') => {
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
        { id: 'au1', label: 'Parabrisa (Não girar - encolhe reto)', width: 1.40, height: 0.90, quantity: 1, allowRotation: false },
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Scissors className="h-6 w-6 text-primary" /> Otimizador de Corte de Bobinas
          </h1>
          <p className="text-sm text-muted-foreground">
            Descubra a melhor forma de cortar (horizontal vs vertical) e reduza o desperdício de película.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5 text-xs font-semibold print:hidden"
          >
            <Printer className="h-4 w-4" /> Imprimir Mapa
          </Button>
        </div>
      </div>

      {/* Grid Principal: Entrada de Dados (Esquerda) + Visualizador da Bobina (Direita) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna Esquerda: Configuração da Bobina & Peças */}
        <div className="lg:col-span-5 space-y-5 print:hidden">
          {/* Card 1: Largura da Bobina Editável */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-primary" /> 1. Largura da Bobina (Editável)
                </span>
                <span className="text-xs font-mono font-bold text-primary">
                  {coilWidth} metros
                </span>
              </CardTitle>
              <CardDescription className="text-xs">
                Defina a largura do rolo de película que você vai colocar na mesa de corte.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3.5">
              {/* Input Numérico da Largura */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="coil-w-input" className="text-xs font-semibold">
                    Largura da Bobina (m) *
                  </Label>
                  <div className="relative">
                    <Input
                      id="coil-w-input"
                      type="number"
                      step="0.01"
                      min={0.1}
                      max={5.0}
                      value={coilWidth}
                      onChange={(e) => setCoilWidth(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                      className="font-mono text-sm font-bold pl-3 pr-8 h-9"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
                      m
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="cost-input" className="text-xs font-semibold">
                    Custo/Metro Linear (R$)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      R$
                    </span>
                    <Input
                      id="cost-input"
                      type="number"
                      step="1"
                      min={0}
                      value={unitCostPerMeter}
                      onChange={(e) => setUnitCostPerMeter(parseFloat(e.target.value) || 0)}
                      className="font-mono text-sm pl-8 h-9"
                    />
                  </div>
                </div>
              </div>

              {/* Botões Rápidos de Larguras Comuns do Mercado */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-medium text-muted-foreground">
                  Atalhos de Bobinas Comuns:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_COIL_WIDTHS.map((item) => (
                    <Button
                      key={item.value}
                      type="button"
                      variant={coilWidth === item.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCoilWidth(item.value)}
                      className="text-xs h-7 px-2.5 font-medium"
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Lista de Vidros / Peças */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                  <Scissors className="h-4 w-4 text-primary" /> 2. Peças & Vidros para Cortar
                </CardTitle>
                <CardDescription className="text-xs">
                  Insira as medidas em metros (ex: 1.20 = 1m20cm).
                </CardDescription>
              </div>

              <Button
                type="button"
                size="sm"
                onClick={handleAddPiece}
                className="gap-1 text-xs h-8 px-2.5"
              >
                <Plus className="h-3.5 w-3.5" /> + Vidro
              </Button>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Presets Rápidos de Exemplo */}
              <div className="flex items-center gap-1.5 bg-muted/40 p-1.5 rounded-lg text-xs overflow-x-auto">
                <span className="text-muted-foreground font-medium shrink-0">✨ Exemplos:</span>
                <button
                  type="button"
                  onClick={() => handleLoadPreset('SACADA')}
                  className="px-2 py-1 rounded bg-background hover:bg-card border text-foreground font-medium shrink-0 transition-all text-[11px]"
                >
                  Sacada Completa
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadPreset('AUTOMOTIVO')}
                  className="px-2 py-1 rounded bg-background hover:bg-card border text-foreground font-medium shrink-0 transition-all text-[11px]"
                >
                  Carro Completo
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadPreset('PORTAS')}
                  className="px-2 py-1 rounded bg-background hover:bg-card border text-foreground font-medium shrink-0 transition-all text-[11px]"
                >
                  Portas 1,00m
                </button>
              </div>

              {/* Lista de Peças */}
              <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                {pieces.map((piece, index) => (
                  <div
                    key={piece.id}
                    className="rounded-xl border bg-muted/20 p-3 space-y-2 relative transition-all hover:border-primary/40"
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
                          className="text-destructive hover:bg-destructive/10 p-1 rounded transition-colors"
                          title="Remover peça"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-0.5">
                        <Label className="text-[10px] text-muted-foreground font-semibold">
                          Largura (m)
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          min={0.05}
                          value={piece.width}
                          onChange={(e) =>
                            handleUpdatePiece(piece.id, 'width', parseFloat(e.target.value) || 0)
                          }
                          className="h-8 text-xs font-mono font-medium text-center bg-background"
                        />
                      </div>

                      <div className="space-y-0.5">
                        <Label className="text-[10px] text-muted-foreground font-semibold">
                          Altura (m)
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          min={0.05}
                          value={piece.height}
                          onChange={(e) =>
                            handleUpdatePiece(piece.id, 'height', parseFloat(e.target.value) || 0)
                          }
                          className="h-8 text-xs font-mono font-medium text-center bg-background"
                        />
                      </div>

                      <div className="space-y-0.5">
                        <Label className="text-[10px] text-muted-foreground font-semibold">
                          Qtd (peças)
                        </Label>
                        <Input
                          type="number"
                          step="1"
                          min={1}
                          max={50}
                          value={piece.quantity}
                          onChange={(e) =>
                            handleUpdatePiece(piece.id, 'quantity', parseInt(e.target.value) || 1)
                          }
                          className="h-8 text-xs font-mono font-medium text-center bg-background"
                        />
                      </div>
                    </div>

                    {/* Checkbox de Rotação 90° */}
                    <div className="flex items-center justify-between pt-1 border-t border-muted text-xs">
                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={piece.allowRotation}
                          onChange={(e) =>
                            handleUpdatePiece(piece.id, 'allowRotation', e.target.checked)
                          }
                          className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-[11px] font-medium text-foreground">
                          Permitir girar 90° (horizontal)
                        </span>
                      </label>

                      <span className="text-[11px] font-mono text-muted-foreground">
                        {(piece.width * piece.height * piece.quantity).toFixed(2)} m²
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Direita: Otimizador & Desenho Visual da Bobina */}
        <div className="lg:col-span-7 space-y-4">
          <CoilVisualizer
            result={optimizationResult}
            unitCostPerMeter={unitCostPerMeter}
          />
        </div>
      </div>
    </div>
  )
}
