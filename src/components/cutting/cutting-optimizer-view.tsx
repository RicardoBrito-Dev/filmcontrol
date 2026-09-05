'use client'

import { useState, useMemo } from 'react'
import {
  Scissors,
  Plus,
  Trash2,
  RotateCw,
  Layers,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  ArrowRight,
  Edit3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CoilVisualizer } from '@/components/cutting/coil-visualizer'
import { optimizeCoilCut, type CutPiece } from '@/lib/cutting-optimizer'

const COMMON_COIL_WIDTHS = [
  { label: '1,52m (Padrão)', value: 1.52 },
  { label: '1,00m (Médio)', value: 1.0 },
  { label: '0,76m (Portas/Auto)', value: 0.76 },
  { label: '0,50m (Retalho)', value: 0.5 },
  { label: '1,82m (Especial)', value: 1.82 },
]

export function CuttingOptimizerView() {
  // Aba ativa no celular: 'INPUTS' (Medidas) | 'MAP' (Mapa de Corte)
  const [mobileTab, setMobileTab] = useState<'INPUTS' | 'MAP'>('INPUTS')

  // Configuração da Bobina
  const [coilWidth, setCoilWidth] = useState<number>(1.52)
  const [unitCostPerMeter, setUnitCostPerMeter] = useState<number>(35.0)

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

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5 text-xs font-semibold print:hidden h-8"
          >
            <Printer className="h-3.5 w-3.5" /> Imprimir
          </Button>
        </div>
      </div>

      {/* Alternador de Abas Exclusivo para Telas Pequenas (Celular) */}
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
        {/* Coluna Esquerda: Configurações & Peças (escondida no celular se a aba ativa for MAP) */}
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
                Digite qualquer medida de bobina em metros.
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

              <Button
                type="button"
                size="sm"
                onClick={handleAddPiece}
                className="gap-1 text-xs h-8 px-2.5 font-bold"
              >
                <Plus className="h-3.5 w-3.5" /> + Vidro
              </Button>
            </CardHeader>

            <CardContent className="p-3.5 sm:p-5 pt-0 space-y-3">
              {/* Presets Rápidos */}
              <div className="flex items-center gap-1.5 bg-muted/40 p-1.5 rounded-lg text-xs overflow-x-auto">
                <span className="text-muted-foreground font-semibold text-[10px] shrink-0">
                  ✨ Exemplos:
                </span>
                <button
                  type="button"
                  onClick={() => handleLoadPreset('SACADA')}
                  className="px-2 py-0.5 rounded bg-background hover:bg-card border text-foreground font-medium shrink-0 text-[10px] sm:text-[11px]"
                >
                  Sacada
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadPreset('AUTOMOTIVO')}
                  className="px-2 py-0.5 rounded bg-background hover:bg-card border text-foreground font-medium shrink-0 text-[10px] sm:text-[11px]"
                >
                  Automotivo
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadPreset('PORTAS')}
                  className="px-2 py-0.5 rounded bg-background hover:bg-card border text-foreground font-medium shrink-0 text-[10px] sm:text-[11px]"
                >
                  Portas 1m
                </button>
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

        {/* Coluna Direita: Otimizador & Desenho Visual da Bobina (escondida no celular se a aba ativa for INPUTS) */}
        <div
          className={`lg:col-span-7 space-y-4 ${
            mobileTab === 'INPUTS' ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* Botão no topo do mapa no celular para voltar para as medidas */}
          <div className="lg:hidden pb-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMobileTab('INPUTS')}
              className="gap-1.5 text-xs font-semibold h-8"
            >
              <Edit3 className="h-3.5 w-3.5" /> Voltar e Alterar Medidas
            </Button>
          </div>

          <CoilVisualizer
            result={optimizationResult}
            unitCostPerMeter={unitCostPerMeter}
          />
        </div>
      </div>

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
