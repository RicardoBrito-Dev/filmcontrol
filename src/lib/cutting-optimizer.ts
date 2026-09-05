export interface CutPiece {
  id: string
  label: string
  width: number   // em metros
  height: number  // em metros
  quantity: number
  allowRotation: boolean
}

export interface PlacedPiece {
  id: string
  label: string
  x: number       // posição X na bobina (largura), em metros
  y: number       // posição Y na bobina (comprimento), em metros
  width: number   // largura final da peça colocada
  height: number  // altura final da peça colocada
  isRotated: boolean
  originalWidth: number
  originalHeight: number
  colorIndex: number
}

export interface OptimizationResult {
  placedPieces: PlacedPiece[]
  unplacedPieces: CutPiece[]
  coilWidth: number
  totalLengthUsed: number     // metros lineares da bobina
  coilTotalArea: number       // m² totais consumidos da bobina
  piecesTotalArea: number     // m² de vidros cortados
  efficiency: number          // porcentagem de aproveitamento (0-100)
  wasteArea: number           // m² de sobra/descarte
}

// Paleta de cores vibrantes para identificar os diferentes vidros visualmente
export const PIECE_COLORS = [
  { bg: 'rgba(59, 130, 246, 0.85)', border: '#2563eb', text: '#ffffff' }, // Azul
  { bg: 'rgba(16, 185, 129, 0.85)', border: '#059669', text: '#ffffff' }, // Verde
  { bg: 'rgba(245, 158, 11, 0.85)', border: '#d97706', text: '#ffffff' }, // Âmbar
  { bg: 'rgba(139, 92, 246, 0.85)', border: '#7c3aed', text: '#ffffff' }, // Roxo
  { bg: 'rgba(236, 72, 153, 0.85)', border: '#db2777', text: '#ffffff' }, // Rosa
  { bg: 'rgba(20, 184, 166, 0.85)', border: '#0d9488', text: '#ffffff' }, // Teal
  { bg: 'rgba(249, 115, 22, 0.85)', border: '#ea580c', text: '#ffffff' }, // Laranja
  { bg: 'rgba(99, 102, 241, 0.85)', border: '#4f46e5', text: '#ffffff' }, // Índigo
]

interface RectItem {
  id: string
  label: string
  w: number
  h: number
  allowRotation: boolean
  colorIndex: number
}

interface FreeRect {
  x: number
  y: number
  w: number
  h: number
}

/**
 * Algoritmo MaxRects / Shelf 2D para nesting de película em bobina de largura fixa.
 * Avalia as orientações e posiciona com corte guilhotina para minimizar metros lineares.
 */
export function optimizeCoilCut(
  pieces: CutPiece[],
  coilWidth: number,
  spacing: number = 0.005 // 5mm de margem padrão entre peças para passagem de estilete
): OptimizationResult {
  // Desdobra itens com quantidade > 1
  const expandedItems: RectItem[] = []
  let colorCounter = 0

  pieces.forEach((piece) => {
    const qty = Math.max(1, Math.floor(piece.quantity || 1))
    const pColor = colorCounter % PIECE_COLORS.length
    colorCounter++

    for (let i = 0; i < qty; i++) {
      expandedItems.push({
        id: `${piece.id}_${i}`,
        label: qty > 1 ? `${piece.label} (#${i + 1})` : piece.label,
        w: Number(piece.width),
        h: Number(piece.height),
        allowRotation: piece.allowRotation,
        colorIndex: pColor,
      })
    }
  })

  // Testa duas estratégias de ordenação e escolhe a mais eficiente
  const result1 = runPacking(expandedItems, coilWidth, spacing, 'AREA_DESC')
  const result2 = runPacking(expandedItems, coilWidth, spacing, 'MAX_SIDE_DESC')
  const result3 = runPacking(expandedItems, coilWidth, spacing, 'HEIGHT_DESC')

  // Pega a solução com menor comprimento linear de bobina utilizada
  const candidates = [result1, result2, result3].filter((r) => r.unplacedPieces.length === 0)
  if (candidates.length > 0) {
    candidates.sort((a, b) => a.totalLengthUsed - b.totalLengthUsed)
    return candidates[0]
  }

  // Se alguma peça não couber, retorna a que teve menos não posicionadas
  const allCandidates = [result1, result2, result3]
  allCandidates.sort((a, b) => a.unplacedPieces.length - b.unplacedPieces.length || a.totalLengthUsed - b.totalLengthUsed)
  return allCandidates[0]
}

function runPacking(
  items: RectItem[],
  coilWidth: number,
  spacing: number,
  sortStrategy: 'AREA_DESC' | 'MAX_SIDE_DESC' | 'HEIGHT_DESC'
): OptimizationResult {
  const sorted = [...items].sort((a, b) => {
    if (sortStrategy === 'AREA_DESC') {
      return b.w * b.h - a.w * a.h
    } else if (sortStrategy === 'MAX_SIDE_DESC') {
      return Math.max(b.w, b.h) - Math.max(a.w, a.h)
    } else {
      return Math.max(b.h, b.w) - Math.max(a.h, a.w)
    }
  })

  const placed: PlacedPiece[] = []
  const unplaced: CutPiece[] = []

  // Lista de retângulos livres (Maximal Rectangles)
  const freeRects: FreeRect[] = [{ x: 0, y: 0, w: coilWidth, h: 9999 }]

  for (const item of sorted) {
    // Possíveis orientações da peça
    const orientations: { w: number; h: number; rotated: boolean }[] = [
      { w: item.w, h: item.h, rotated: false },
    ]

    if (item.allowRotation && Math.abs(item.w - item.h) > 0.001) {
      orientations.push({ w: item.h, h: item.w, rotated: true })
    }

    let bestScore = Infinity
    let bestPlacement: { rectIndex: number; x: number; y: number; w: number; h: number; rotated: boolean } | null = null

    for (let rIdx = 0; rIdx < freeRects.length; rIdx++) {
      const free = freeRects[rIdx]

      for (const orient of orientations) {
        if (free.w >= orient.w && free.h >= orient.h) {
          const topY = free.y + orient.h
          const score = topY * 1000 + free.x

          if (score < bestScore) {
            bestScore = score
            bestPlacement = {
              rectIndex: rIdx,
              x: free.x,
              y: free.y,
              w: orient.w,
              h: orient.h,
              rotated: orient.rotated,
            }
          }
        }
      }
    }

    if (bestPlacement) {
      placed.push({
        id: item.id,
        label: item.label,
        x: Number(bestPlacement.x.toFixed(4)),
        y: Number(bestPlacement.y.toFixed(4)),
        width: Number(bestPlacement.w.toFixed(4)),
        height: Number(bestPlacement.h.toFixed(4)),
        isRotated: bestPlacement.rotated,
        originalWidth: item.w,
        originalHeight: item.h,
        colorIndex: item.colorIndex,
      })

      const placedBox: FreeRect = {
        x: bestPlacement.x,
        y: bestPlacement.y,
        w: bestPlacement.w + spacing,
        h: bestPlacement.h + spacing,
      }

      splitFreeRects(freeRects, placedBox)
    } else {
      unplaced.push({
        id: item.id,
        label: item.label,
        width: item.w,
        height: item.h,
        quantity: 1,
        allowRotation: item.allowRotation,
      })
    }
  }

  let totalLengthUsed = 0
  let piecesTotalArea = 0

  placed.forEach((p) => {
    const endY = p.y + p.height
    if (endY > totalLengthUsed) totalLengthUsed = endY
    piecesTotalArea += p.width * p.height
  })

  totalLengthUsed = Number(totalLengthUsed.toFixed(3))
  const coilTotalArea = Number((totalLengthUsed * coilWidth).toFixed(3))
  const wasteArea = Math.max(0, Number((coilTotalArea - piecesTotalArea).toFixed(3)))
  const efficiency = coilTotalArea > 0 ? Number(((piecesTotalArea / coilTotalArea) * 100).toFixed(1)) : 0

  return {
    placedPieces: placed,
    unplacedPieces: unplaced,
    coilWidth,
    totalLengthUsed,
    coilTotalArea,
    piecesTotalArea: Number(piecesTotalArea.toFixed(3)),
    efficiency,
    wasteArea,
  }
}

function splitFreeRects(freeRects: FreeRect[], used: FreeRect) {
  const newRects: FreeRect[] = []

  for (let i = freeRects.length - 1; i >= 0; i--) {
    const free = freeRects[i]

    const overlap =
      used.x < free.x + free.w &&
      used.x + used.w > free.x &&
      used.y < free.y + free.h &&
      used.y + used.h > free.y

    if (!overlap) continue

    freeRects.splice(i, 1)

    if (used.y + used.h < free.y + free.h) {
      newRects.push({
        x: free.x,
        y: used.y + used.h,
        w: free.w,
        h: free.y + free.h - (used.y + used.h),
      })
    }
    if (used.y > free.y) {
      newRects.push({
        x: free.x,
        y: free.y,
        w: free.w,
        h: used.y - free.y,
      })
    }
    if (used.x > free.x) {
      newRects.push({
        x: free.x,
        y: free.y,
        w: used.x - free.x,
        h: free.h,
      })
    }
    if (used.x + used.w < free.x + free.w) {
      newRects.push({
        x: used.x + used.w,
        y: free.y,
        w: free.x + free.w - (used.x + used.w),
        h: free.h,
      })
    }
  }

  freeRects.push(...newRects)

  for (let i = 0; i < freeRects.length; i++) {
    for (let j = freeRects.length - 1; j > i; j--) {
      const a = freeRects[i]
      const b = freeRects[j]
      if (b.x >= a.x && b.y >= a.y && b.x + b.w <= a.x + a.w && b.y + b.h <= a.y + a.h) {
        freeRects.splice(j, 1)
      }
    }
  }
}
