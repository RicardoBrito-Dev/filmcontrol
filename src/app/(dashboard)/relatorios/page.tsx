'use client'

import { useState } from 'react'
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  DollarSign,
  Award,
  Users,
  MessageCircle,
  Star,
  FileSpreadsheet,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

const topServices = [
  { name: 'Película G5 Profissional', category: 'Automotivo', count: 42, revenue: 14700 },
  { name: 'Película Nano Cerâmica IR90', category: 'Automotivo', count: 28, revenue: 23800 },
  { name: 'Película Jateada Privacidade', category: 'Residencial', count: 19, revenue: 11400 },
  { name: 'Película Carbon Premium', category: 'Automotivo', count: 16, revenue: 8800 },
  { name: 'Controle Solar Residencial', category: 'Residencial', count: 12, revenue: 7680 },
  { name: 'Vitrine Comercial UV', category: 'Comercial', count: 8, revenue: 5600 },
]

const satisfactionReviews = [
  {
    id: '1',
    customer: 'João Silva',
    vehicle: 'Chevrolet Onix Plus',
    rating: 5,
    comment: 'Instalação perfeita do G5! Não ficou nenhuma bolha e o atendimento foi rápido.',
    date: 'Ontem',
    phone: '11999991111',
  },
  {
    id: '2',
    customer: 'Maria Clara Santos',
    vehicle: 'Residencial (Sacada Jardins)',
    rating: 5,
    comment: 'O jateado na sacada ficou lindo e deu toda a privacidade que precisávamos!',
    date: 'Há 3 dias',
    phone: '11977773333',
  },
  {
    id: '3',
    customer: 'Pedro Henrique Souza',
    vehicle: 'Honda Civic Touring',
    rating: 5,
    comment: 'A película nano cerâmica fez uma diferença absurda no calor do carro. Recomendo demais.',
    date: 'Há 5 dias',
    phone: '11988882222',
  },
]

export default function RelatoriosPage() {
  const [dateRange, setDateRange] = useState('ESTE_MES')

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Servico,Categoria,Qtd Instalada,Faturamento Total\n' +
      topServices
        .map((s) => `"${s.name}","${s.category}",${s.count},${s.revenue}`)
        .join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `relatorio_filmcontrol_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: 'Relatório exportado!',
      description: 'Download do arquivo CSV concluído com sucesso.',
      variant: 'success' as 'default',
    })
  }

  const handleSendFollowUp = (phone: string, customer: string) => {
    const text = `Olá *${customer}*! Tudo bem? Aqui é da *FILMCONTROL*. Gostaríamos de saber como está a sua experiência com a película instalada e se precisa de alguma assistência com a sua garantia. Muito obrigado pela preferência!`
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(text)}`, '_blank')
  }

  const totalRevenue = topServices.reduce((acc, s) => acc + s.revenue, 0)
  const totalInstallations = topServices.reduce((acc, s) => acc + s.count, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Relatórios & Pós-Venda
          </h1>
          <p className="text-sm text-muted-foreground">
            Análise detalhada de vendas, serviços mais lucrativos e acompanhamento de pós-venda.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportCSV} className="gap-1.5">
            <Download className="h-4 w-4" /> Exportar Planilha (CSV)
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Total Faturado no Período
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Neste mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Total de Aplicações
            </CardTitle>
            <Award className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInstallations}</div>
            <p className="text-xs text-muted-foreground mt-1">Serviços executados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Ticket Médio por Serviço
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalRevenue / totalInstallations)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Média geral</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Satisfação dos Clientes
            </CardTitle>
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">5.0 / 5.0</div>
            <p className="text-xs text-muted-foreground mt-1">100% avaliações 5 estrelas</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Services Ranking Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Películas e Serviços Mais Vendidos
          </CardTitle>
          <CardDescription>
            Ranking de faturamento e volume de aplicação por tipo de película.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b bg-muted/40 font-semibold text-muted-foreground uppercase text-[10px]">
                  <th className="py-2.5 px-3">Posição / Serviço</th>
                  <th className="py-2.5 px-3">Categoria</th>
                  <th className="py-2.5 px-3 text-center">Instalações</th>
                  <th className="py-2.5 px-3 text-right">Faturamento Total</th>
                  <th className="py-2.5 px-3 text-right">Participação</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {topServices.map((service, index) => {
                  const share = ((service.revenue / totalRevenue) * 100).toFixed(1)
                  return (
                    <tr key={index} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-3 font-semibold text-foreground text-sm flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                          {index + 1}
                        </span>
                        {service.name}
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant="outline" className="text-xs">
                          {service.category}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold">
                        {service.count}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-foreground">
                        {formatCurrency(service.revenue)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-xs text-muted-foreground">
                        {share}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pós-Venda e Pesquisa de Satisfação */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Módulo de Pós-Venda & Garantia
            </CardTitle>
            <CardDescription>
              Acompanhe feedbacks de clientes e envie mensagens de pós-venda via WhatsApp.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {satisfactionReviews.map((review) => (
              <div
                key={review.id}
                className="rounded-xl border bg-muted/20 p-4 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground">
                      {review.customer}
                    </span>
                    <div className="flex items-center text-amber-400">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">
                    {review.vehicle} • {review.date}
                  </p>
                  <p className="text-xs text-foreground italic bg-background/50 p-2.5 rounded-lg border">
                    "{review.comment}"
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSendFollowUp(review.phone, review.customer)}
                  className="w-full text-xs gap-1.5 border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 mt-2"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> Mensagem Pós-Venda
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
