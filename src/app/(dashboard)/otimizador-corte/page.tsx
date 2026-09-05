import { Suspense } from 'react'
import { Metadata } from 'next'
import { CuttingOptimizerView } from '@/components/cutting/cutting-optimizer-view'

export const metadata: Metadata = {
  title: 'Otimizador de Corte de Bobinas | FilmControl',
  description: 'Calculador visual de corte e aproveitamento de bobinas de películas',
}

export default function OtimizadorCortePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Carregando otimizador de corte...</div>}>
      <CuttingOptimizerView />
    </Suspense>
  )
}
