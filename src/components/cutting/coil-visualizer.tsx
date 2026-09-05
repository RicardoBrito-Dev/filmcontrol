'use client'

import { useRef } from 'react'
import {
  Maximize2,
  RotateCw,
  Scissors,
  CheckCircle,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { OptimizationResult } from '@/lib/cutting-optimizer'
import { PIECE_COLORS } from '@/lib/cutting-optimizer'

interface CoilVisualizerProps {
  result: OptimizationResult
  unitCostPerMeter?: number // Custo por metro linear da película (opcional)
}

export function CoilVisualizer({ result, unitCostPerMeter }: CoilVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const {
    placedPieces,
    unplacedPieces,
    coilWidth,
    totalLengthUsed,
    coilTotalArea,
    piecesTotalArea,
    efficiency,
    wasteArea,
  } = result

  // Escala visual do desenho
  // Largura máxima do canvas no container = 600px
  const canvasWidthPx = 640
  const pxPerMeter = canvasWidthPx / (coilWidth || 1.52)
  const canvasHeightPx = Math.max(200, totalLengthUsed * pxPerMeter)

  return (
    <div className="space-y-4">
      {/* Resumo de Eficiência e Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-card p-3 shadow-sm">
          <span className="text-[11px] font-medium text-muted-foreground uppercase">
            Aproveitamento
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span
              className={`text-2xl font-bold font-mono ${
                efficiency >= 85
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : efficiency >= 70
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {efficiency}%
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            {wasteArea > 0 ? `${wasteArea} m² de sobra` : 'Sem perdas'}
          </span>
        </div>

        <div className="rounded-xl border bg-card p-3 shadow-sm">
          <span className="text-[11px] font-medium text-muted-foreground uppercase">
            Comprimento da Bobina
          </span>
          <div className="text-2xl font-bold font-mono text-primary mt-1">
            {totalLengthUsed.toFixed(2)} m
          </div>
          <span className="text-[11px] text-muted-foreground">
            puxar da bobina de {coilWidth}m
          </span>
        </div>

        <div className="rounded-xl border bg-card p-3 shadow-sm">
          <span className="text-[11px] font-medium text-muted-foreground uppercase">
            Área dos Vidros
          </span>
          <div className="text-2xl font-bold font-mono text-foreground mt-1">
            {piecesTotalArea} m²
          </div>
          <span className="text-[11px] text-muted-foreground">
            {placedPieces.length} peça(s) cortada(s)
          </span>
        </div>

        <div className="rounded-xl border bg-card p-3 shadow-sm">
          <span className="text-[11px] font-medium text-muted-foreground uppercase">
            {unitCostPerMeter ? 'Custo de Película' : 'Área Total Gasta'}
          </span>
          <div className="text-2xl font-bold font-mono text-foreground mt-1">
            {unitCostPerMeter
              ? `R$ ${(totalLengthUsed * unitCostPerMeter).toFixed(2)}`
              : `${coilTotalArea} m²`}
          </div>
          <span className="text-[11px] text-muted-foreground">
            {unitCostPerMeter
              ? `R$ ${((totalLengthUsed * unitCostPerMeter) / (piecesTotalArea || 1)).toFixed(2)}/m² útil`
              : `consumo total da bobina`}
          </span>
        </div>
      </div>

      {/* Alerta caso alguma peça não caiba na bobina */}
      {unplacedPieces.length > 0 && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 flex items-start gap-2.5 text-destructive text-xs">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Atenção: {unplacedPieces.length} peça(s) não couberam na bobina de {coilWidth}m!</span>
            <p className="mt-0.5 text-destructive/90">
              As medidas ultrapassam a largura útil da bobina mesmo após tentar rotacionar. Aumente a largura da bobina ou corte essa peça emendada.
            </p>
          </div>
        </div>
      )}

      {/* Bancada Visual de Corte (Bobina Aberta) */}
      <div className="rounded-2xl border bg-card p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
          <div className="flex items-center gap-2">
            <Scissors className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">
              Plano de Corte na Bancada (Bobina de {coilWidth}m)
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 font-mono">
              <span className="h-2 w-2 rounded-full bg-primary" /> 1 metro = {pxPerMeter.toFixed(0)}px
            </span>
          </div>
        </div>

        {/* Régua Superior (Largura da Bobina) */}
        <div className="relative overflow-x-auto pb-4">
          <div className="min-w-[320px] max-w-full mx-auto" style={{ width: `${canvasWidthPx}px` }}>
            {/* Medidor de Largura do Rolo */}
            <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground border-b-2 border-primary pb-1 mb-2 px-1">
              <span>0,00 m (Borda Esq.)</span>
              <span className="font-bold text-primary">↔ Largura da Bobina: {coilWidth}m ↔</span>
              <span>{coilWidth.toFixed(2)} m (Borda Dir.)</span>
            </div>

            {/* Container da Bobina Aberta */}
            <div
              ref={containerRef}
              className="relative rounded-lg border-2 border-dashed border-primary/40 bg-muted/20 overflow-hidden shadow-inner select-none transition-all"
              style={{
                width: `${canvasWidthPx}px`,
                height: `${canvasHeightPx}px`,
                backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.05) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            >
              {/* Linhas guilhotina pontilhadas a cada 1 metro de comprimento */}
              {Array.from({ length: Math.ceil(totalLengthUsed) }).map((_, idx) => {
                const yPos = (idx + 1) * pxPerMeter
                if (yPos >= canvasHeightPx) return null
                return (
                  <div
                    key={`line_${idx}`}
                    className="absolute left-0 right-0 border-b border-primary/20 flex items-center justify-end pr-2 text-[10px] font-mono text-muted-foreground/60 pointer-events-none"
                    style={{ top: `${yPos}px` }}
                  >
                    <span>{idx + 1},00 m</span>
                  </div>
                )
              })}

              {/* Peças Posicionadas */}
              {placedPieces.map((piece, index) => {
                const left = piece.x * pxPerMeter
                const top = piece.y * pxPerMeter
                const width = piece.width * pxPerMeter
                const height = piece.height * pxPerMeter
                const color = PIECE_COLORS[piece.colorIndex % PIECE_COLORS.length]

                return (
                  <div
                    key={piece.id}
                    className="absolute rounded-md p-1.5 flex flex-col justify-between transition-all hover:scale-[1.01] hover:z-20 cursor-pointer shadow-sm group border"
                    style={{
                      left: `${left}px`,
                      top: `${top}px`,
                      width: `${width}px`,
                      height: `${height}px`,
                      backgroundColor: color.bg,
                      borderColor: color.border,
                      color: color.text,
                    }}
                    title={`${piece.label} — ${piece.width.toFixed(2)}m × ${piece.height.toFixed(2)}m ${
                      piece.isRotated ? '(Giro 90°)' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 overflow-hidden leading-tight">
                      <span className="font-bold text-xs truncate drop-shadow-sm">
                        {piece.label}
                      </span>
                      {piece.isRotated && (
                        <span
                          className="shrink-0 text-[9px] bg-black/40 px-1 py-0.5 rounded font-mono flex items-center gap-0.5"
                          title="Peça cortada na horizontal (Giro de 90°)"
                        >
                          <RotateCw className="h-2.5 w-2.5" /> 90°
                        </span>
                      )}
                    </div>

                    <div className="font-mono text-[11px] font-semibold tracking-tight text-white/95 drop-shadow-sm flex items-center justify-between">
                      <span>{piece.width.toFixed(2)}m × {piece.height.toFixed(2)}m</span>
                      <span className="text-[10px] opacity-80">
                        {(piece.width * piece.height).toFixed(2)}m²
                      </span>
                    </div>
                  </div>
                )
              })}

              {/* Indicador de término do rolo */}
              <div
                className="absolute left-0 right-0 border-b-2 border-red-500 bg-red-500/10 flex items-center justify-between px-3 py-1 font-mono text-xs font-bold text-red-600 dark:text-red-400"
                style={{ top: `${canvasHeightPx - 24}px` }}
              >
                <span>✂ CORTE FINAL DA BOBINA</span>
                <span>Puxar {totalLengthUsed.toFixed(2)} m</span>
              </div>
            </div>

            {/* Marcador inferior de metros puxados */}
            <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground pt-2 px-1">
              <span>Início da Bobina (0,00m)</span>
              <span className="font-bold text-foreground">
                Total a desenrolar: {totalLengthUsed.toFixed(2)} metros
              </span>
            </div>
          </div>
        </div>

        {/* Guia / Legenda do Cortador */}
        <div className="border-t pt-3 space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-primary" /> Roteiro de Corte na Bancada:
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {placedPieces.map((p, i) => {
              const color = PIECE_COLORS[p.colorIndex % PIECE_COLORS.length]
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2 rounded-lg border bg-muted/30"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: color.border }}
                    />
                    <span className="font-semibold text-foreground">{p.label}</span>
                    {p.isRotated && (
                      <Badge variant="outline" className="text-[10px] py-0 px-1 font-mono">
                        Rotacionado 90°
                      </Badge>
                    )}
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">
                    {p.width.toFixed(2)}m × {p.height.toFixed(2)}m ({(p.width * p.height).toFixed(2)}m²)
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
