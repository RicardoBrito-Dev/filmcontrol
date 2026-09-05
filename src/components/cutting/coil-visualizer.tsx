'use client'

import { useRef, useState, useEffect } from 'react'
import {
  RotateCw,
  Scissors,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Info,
  Maximize2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { OptimizationResult } from '@/lib/cutting-optimizer'
import { PIECE_COLORS } from '@/lib/cutting-optimizer'

interface CoilVisualizerProps {
  result: OptimizationResult
  unitCostPerMeter?: number
}

export function CoilVisualizer({ result, unitCostPerMeter }: CoilVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState<number>(360)
  const [zoomLevel, setZoomLevel] = useState<number>(1) // 1 = 100% (cabe na tela)

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

  // Mede a largura real do container do celular/computador
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        // Largura útil disponível com margens de segurança
        const w = containerRef.current.clientWidth || 360
        setContainerWidth(Math.max(280, Math.min(680, w - 8)))
      }
    }

    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  // Escala dinâmica: se adapta 100% à largura do celular
  const effectiveWidthPx = containerWidth * zoomLevel
  const pxPerMeter = effectiveWidthPx / (coilWidth > 0 ? coilWidth : 1.52)
  const canvasHeightPx = Math.max(220, totalLengthUsed * pxPerMeter)

  const handleZoomIn = () => setZoomLevel((z) => Math.min(2.5, +(z + 0.25).toFixed(2)))
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.75, +(z - 0.25).toFixed(2)))
  const handleResetZoom = () => setZoomLevel(1)

  return (
    <div className="space-y-4" ref={containerRef}>
      {/* Resumo de Eficiência e Métricas Mobile-First */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="rounded-xl border bg-card p-3 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-tight">
            Aproveitamento
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span
              className={`text-xl sm:text-2xl font-bold font-mono ${
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
          <span className="text-[10px] text-muted-foreground truncate">
            {wasteArea > 0 ? `${wasteArea} m² sobra` : 'Sem perdas'}
          </span>
        </div>

        <div className="rounded-xl border bg-card p-3 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-tight">
            Puxar da Bobina
          </span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-primary mt-1">
            {totalLengthUsed.toFixed(2)} m
          </div>
          <span className="text-[10px] text-muted-foreground truncate">
            bobina de {coilWidth}m
          </span>
        </div>

        <div className="rounded-xl border bg-card p-3 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-tight">
            Área dos Vidros
          </span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-foreground mt-1">
            {piecesTotalArea} m²
          </div>
          <span className="text-[10px] text-muted-foreground truncate">
            {placedPieces.length} peça(s) no plano
          </span>
        </div>

        <div className="rounded-xl border bg-card p-3 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-tight">
            {unitCostPerMeter ? 'Custo Película' : 'Área Bobina'}
          </span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-foreground mt-1 truncate">
            {unitCostPerMeter
              ? `R$ ${(totalLengthUsed * unitCostPerMeter).toFixed(2)}`
              : `${coilTotalArea} m²`}
          </div>
          <span className="text-[10px] text-muted-foreground truncate">
            {unitCostPerMeter ? 'custo estimado' : 'consumo total'}
          </span>
        </div>
      </div>

      {/* Alerta caso alguma peça não caiba na bobina */}
      {unplacedPieces.length > 0 && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 flex items-start gap-2 text-destructive text-xs">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">
              {unplacedPieces.length} peça(s) excederam a bobina de {coilWidth}m!
            </span>
            <p className="mt-0.5 text-destructive/90 text-[11px]">
              Altere a largura da bobina ou corte esta peça com emenda.
            </p>
          </div>
        </div>
      )}

      {/* Bancada Visual de Corte (Bobina Aberta) */}
      <div className="rounded-2xl border bg-card p-3 sm:p-4 shadow-sm space-y-3">
        {/* Barra superior de ferramentas do mapa com botões de zoom */}
        <div className="flex items-center justify-between gap-2 border-b pb-2.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <Scissors className="h-4 w-4 text-primary shrink-0" />
            <h3 className="font-semibold text-xs sm:text-sm truncate">
              Bancada de Corte ({coilWidth}m)
            </h3>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.75}
              className="h-7 w-7 rounded-lg"
              title="Diminuir Zoom"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>

            <button
              type="button"
              onClick={handleResetZoom}
              className="px-2 py-1 rounded text-[11px] font-mono font-semibold bg-muted hover:bg-muted/80 text-foreground transition-colors"
              title="Ajustar à tela do celular"
            >
              {(zoomLevel * 100).toFixed(0)}%
            </button>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 2.5}
              className="h-7 w-7 rounded-lg"
              title="Aumentar Zoom"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Régua e Desenho da Bobina com Auto-Scroll suave se zoom > 100% */}
        <div className="relative overflow-x-auto pb-3 -mx-1 px-1 touch-pan-x">
          <div style={{ width: `${effectiveWidthPx}px`, minWidth: '100%' }} className="mx-auto transition-all">
            {/* Régua Superior (Largura da Bobina) */}
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-muted-foreground border-b-2 border-primary pb-1 mb-2 px-1">
              <span>0,00m</span>
              <span className="font-bold text-primary">↔ Bobina: {coilWidth}m ↔</span>
              <span>{coilWidth.toFixed(2)}m</span>
            </div>

            {/* Container da Bobina Aberta */}
            <div
              className="relative rounded-xl border-2 border-dashed border-primary/40 bg-muted/15 overflow-hidden shadow-inner select-none transition-all"
              style={{
                width: `${effectiveWidthPx}px`,
                height: `${canvasHeightPx}px`,
                backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)',
                backgroundSize: '16px 16px',
              }}
            >
              {/* Linhas guilhotina pontilhadas a cada 1 metro de comprimento */}
              {Array.from({ length: Math.ceil(totalLengthUsed) }).map((_, idx) => {
                const yPos = (idx + 1) * pxPerMeter
                if (yPos >= canvasHeightPx) return null
                return (
                  <div
                    key={`line_${idx}`}
                    className="absolute left-0 right-0 border-b border-primary/20 flex items-center justify-end pr-2 text-[9px] font-mono text-muted-foreground/60 pointer-events-none"
                    style={{ top: `${yPos}px` }}
                  >
                    <span>{idx + 1},00 m</span>
                  </div>
                )
              })}

              {/* Peças Posicionadas */}
              {placedPieces.map((piece) => {
                const left = piece.x * pxPerMeter
                const top = piece.y * pxPerMeter
                const width = piece.width * pxPerMeter
                const height = piece.height * pxPerMeter
                const color = PIECE_COLORS[piece.colorIndex % PIECE_COLORS.length]

                return (
                  <div
                    key={piece.id}
                    className="absolute rounded-md p-1 sm:p-1.5 flex flex-col justify-between transition-all hover:scale-[1.01] hover:z-20 cursor-pointer shadow-sm border overflow-hidden"
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
                      piece.isRotated ? '(Rotacionado 90°)' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 leading-tight overflow-hidden">
                      <span className="font-bold text-[10px] sm:text-xs truncate drop-shadow-sm">
                        {piece.label}
                      </span>
                      {piece.isRotated && (
                        <span
                          className="shrink-0 text-[8px] sm:text-[9px] bg-black/50 px-1 py-0.2 rounded font-mono flex items-center gap-0.5"
                          title="Peça cortada na horizontal (Giro 90°)"
                        >
                          <RotateCw className="h-2 w-2" /> 90°
                        </span>
                      )}
                    </div>

                    <div className="font-mono text-[9px] sm:text-[11px] font-semibold tracking-tight text-white/95 drop-shadow-sm flex items-center justify-between">
                      <span className="truncate">{piece.width.toFixed(2)}×{piece.height.toFixed(2)}m</span>
                      {width > 70 && height > 35 && (
                        <span className="text-[8px] sm:text-[9px] opacity-80 shrink-0 ml-1">
                          {(piece.width * piece.height).toFixed(2)}m²
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Indicador de término do corte na bobina */}
              <div
                className="absolute left-0 right-0 border-b-2 border-red-500 bg-red-500/15 flex items-center justify-between px-2 sm:px-3 py-0.5 font-mono text-[10px] sm:text-xs font-bold text-red-600 dark:text-red-400"
                style={{ top: `${canvasHeightPx - 22}px` }}
              >
                <span>✂ CORTE FINAL</span>
                <span>Puxar {totalLengthUsed.toFixed(2)} m</span>
              </div>
            </div>

            {/* Marcador inferior de metros puxados */}
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-muted-foreground pt-1.5 px-1">
              <span>Início (0,00m)</span>
              <span className="font-bold text-foreground">
                Total do rolo: {totalLengthUsed.toFixed(2)}m
              </span>
            </div>
          </div>
        </div>

        {/* Roteiro de Corte Compacto para Mobile */}
        <div className="border-t pt-3 space-y-2">
          <h4 className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-primary" /> Roteiro de Corte ({placedPieces.length} peças):
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
            {placedPieces.map((p, i) => {
              const color = PIECE_COLORS[p.colorIndex % PIECE_COLORS.length]
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2 rounded-lg border bg-muted/20 text-xs"
                >
                  <div className="flex items-center gap-1.5 min-w-0 pr-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: color.border }}
                    />
                    <span className="font-semibold text-foreground truncate">{p.label}</span>
                    {p.isRotated && (
                      <Badge variant="outline" className="text-[9px] py-0 px-1 font-mono shrink-0">
                        90°
                      </Badge>
                    )}
                  </div>
                  <span className="font-mono text-[11px] text-muted-foreground shrink-0">
                    {p.width.toFixed(2)}m × {p.height.toFixed(2)}m
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
