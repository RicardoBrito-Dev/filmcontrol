'use client'

import { useState, useEffect } from 'react'
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
  Car,
  MapPin,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, formatPhone } from '@/lib/utils'
import { workOrderService, type WorkOrderWithRelations } from '@/services/work-order.service'
import { quoteService, type QuoteWithRelations } from '@/services/quote.service'
import { customerService, type CustomerWithRelations } from '@/services/customer.service'
import { toast } from '@/hooks/use-toast'

interface AggregatedService {
  name: string
  category: string
  count: number
  revenue: number
}

interface CompletedClientFollowUp {
  id: string
  customerName: string
  customerPhone?: string
  vehicleOrAddress: string
  serviceDescription: string
  completedDate: string
  total: number
}

export default function RelatoriosPage() {
  const [loading, setLoading] = useState(true)
  const [workOrders, setWorkOrders] = useState<WorkOrderWithRelations[]>([])
  const [quotes, setQuotes] = useState<QuoteWithRelations[]>([])
  const [customers, setCustomers] = useState<CustomerWithRelations[]>([])
  const [dateFilter, setDateFilter] = useState<'TODOS' | 'ESTE_MES' | 'ULTIMOS_30'>('ESTE_MES')

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const [wo, q, c] = await Promise.all([
          workOrderService.list(),
          quoteService.list(),
          customerService.list(),
        ])
        setWorkOrders(wo)
        setQuotes(q)
        setCustomers(c)
      } catch (err) {
        console.error('Erro ao carregar dados de relatórios:', err)
        toast({ title: 'Erro ao carregar relatórios', variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  // Filtrar ordens conforme o período selecionado
  const filteredOrders = workOrders.filter((w) => {
    if (w.status === 'CANCELADO') return false
    const date = new Date(w.completed_at || w.scheduled_at || w.created_at || now)

    if (dateFilter === 'ESTE_MES') {
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    }
    if (dateFilter === 'ULTIMOS_30') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000)
      return date >= thirtyDaysAgo
    }
    return true
  })

  // 1. Agregação real de serviços mais vendidos
  const serviceMap = new Map<string, { count: number; revenue: number; category: string }>()

  filteredOrders.forEach((w) => {
    const isAuto = !!w.vehicle
    const categoryName = isAuto ? 'Automotivo' : 'Residencial / Comercial'

    if (w.items && w.items.length > 0) {
      w.items.forEach((item) => {
        const name = item.description?.trim() || 'Serviço de Película'
        const existing = serviceMap.get(name) || { count: 0, revenue: 0, category: categoryName }
        existing.count += Number(item.quantity || 1)
        existing.revenue += Number(item.subtotal || item.unit_price || 0)
        serviceMap.set(name, existing)
      })
    } else {
      const name = w.notes?.includes('Orçamento') ? 'Instalação de Película' : 'Serviço Geral'
      const existing = serviceMap.get(name) || { count: 0, revenue: 0, category: categoryName }
      existing.count += 1
      existing.revenue += Number(w.total || 0)
      serviceMap.set(name, existing)
    }
  })

  const topServices: AggregatedService[] = Array.from(serviceMap.entries())
    .map(([name, data]) => ({
      name,
      category: data.category,
      count: data.count,
      revenue: data.revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue)

  // 2. Métricas Reais do Banco
  const totalRevenue = filteredOrders.reduce((acc, w) => acc + Number(w.total || 0), 0)
  const totalInstallations = filteredOrders.length
  const averageTicket = totalInstallations > 0 ? totalRevenue / totalInstallations : 0

  // 3. Clientes Concluídos para Pós-Venda Real
  const completedFollowUps: CompletedClientFollowUp[] = workOrders
    .filter((w) => w.status === 'CONCLUIDO' || w.payment_status === 'PAGO')
    .slice(0, 6)
    .map((w) => {
      const vehicleOrAddress = w.vehicle
        ? `${w.vehicle.brand} ${w.vehicle.model} (${w.vehicle.plate || 'S/ placa'})`
        : w.customer?.address || 'Atendimento Residencial'

      const serviceDesc =
        w.items?.[0]?.description ||
        (w.vehicle ? 'Instalação Película Automotiva' : 'Aplicação de Película Arquitetura')

      return {
        id: w.id,
        customerName: w.customer?.name || 'Cliente',
        customerPhone: w.customer?.whatsapp || w.customer?.phone || undefined,
        vehicleOrAddress,
        serviceDescription: serviceDesc,
        completedDate: w.completed_at || w.created_at,
        total: Number(w.total || 0),
      }
    })

  const handleExportCSV = () => {
    if (topServices.length === 0) {
      toast({ title: 'Nenhum dado disponível para exportar no período selecionado.' })
      return
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Servico,Categoria,Qtd Instalada,Faturamento Total\n' +
      topServices
        .map((s) => `"${s.name}","${s.category}",${s.count},${s.revenue}`)
        .join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `relatorio_vendas_filmcontrol_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: 'Relatório exportado!',
      description: 'Download do arquivo CSV com dados reais concluído.',
      variant: 'success' as 'default',
    })
  }

  const handleSendFollowUp = (phone: string | undefined, customer: string, serviceName: string) => {
    if (!phone) {
      toast({ title: 'Cliente sem WhatsApp cadastrado.', variant: 'destructive' })
      return
    }
    const cleanPhone = phone.replace(/\D/g, '')
    const text = `Olá *${customer}*! Tudo bem? Aqui é da *FILMCONTROL*.\n\nGostaríamos de saber como ficou a instalação da sua película (*${serviceName}*) e se está tudo 100% com o acabamento e a sua garantia. Qualquer dúvida ou assistência, estamos à disposição!\n\nMuito obrigado pela preferência!`
    window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Relatórios & Pós-Venda
          </h1>
          <p className="text-sm text-muted-foreground">
            Métricas 100% integradas ao banco de dados sobre vendas, películas mais lucrativas e pós-venda.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filtros de Período */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg">
            {[
              { key: 'ESTE_MES', label: 'Este Mês' },
              { key: 'ULTIMOS_30', label: 'Últimos 30 dias' },
              { key: 'TODOS', label: 'Todo o Período' },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setDateFilter(key as typeof dateFilter)}
                className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-all ${
                  dateFilter === key
                    ? 'bg-card text-primary shadow-sm font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <Button variant="outline" onClick={handleExportCSV} className="gap-1.5 h-8 text-xs font-semibold">
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Total Faturado Real
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {dateFilter === 'ESTE_MES'
                ? 'Neste mês corrente'
                : dateFilter === 'ULTIMOS_30'
                ? 'Últimos 30 dias'
                : 'Histórico total'}
            </p>
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
            <p className="text-xs text-muted-foreground mt-1">Ordens de serviço no banco</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Ticket Médio
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(averageTicket)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Média por atendimento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Clientes Atendidos
            </CardTitle>
            <Users className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {customers.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Base total de clientes</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Services Ranking Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Películas e Serviços Vendidos
          </CardTitle>
          <CardDescription>
            Relatório gerado a partir dos itens reais das suas Ordens de Serviço.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topServices.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center border rounded-xl border-dashed">
              <BarChart3 className="h-8 w-8 text-muted-foreground mb-2" />
              <h4 className="text-sm font-semibold text-foreground">Nenhuma venda registrada no período</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Conclua ordens de serviço ou aprove orçamentos para visualizar o ranking de películas.
              </p>
            </div>
          ) : (
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
                    const share = totalRevenue > 0 ? ((service.revenue / totalRevenue) * 100).toFixed(1) : '0'
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
          )}
        </CardContent>
      </Card>

      {/* Pós-Venda e Acompanhamento de Clientes Reais */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Pós-Venda & Garantia de Clientes Atendidos
            </CardTitle>
            <CardDescription>
              Envie mensagem de acompanhamento via WhatsApp para os clientes com serviços concluídos.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {completedFollowUps.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center border rounded-xl border-dashed">
              <CheckCircle2 className="h-8 w-8 text-muted-foreground mb-2" />
              <h4 className="text-sm font-semibold text-foreground">Nenhum serviço concluído recentemente</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Quando você concluir uma Ordem de Serviço, o cliente aparecerá aqui automaticamente para pós-venda.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {completedFollowUps.map((followUp) => (
                <div
                  key={followUp.id}
                  className="rounded-xl border bg-card p-4 space-y-3 flex flex-col justify-between shadow-xs hover:border-primary/40 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-sm text-foreground">
                        {followUp.customerName}
                      </span>
                      <Badge variant="success" className="text-[10px]">
                        Concluído
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Car className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="truncate">{followUp.vehicleOrAddress}</span>
                    </p>

                    <div className="text-xs bg-muted/40 p-2.5 rounded-lg border space-y-1">
                      <span className="font-semibold text-foreground block">
                        {followUp.serviceDescription}
                      </span>
                      <div className="flex justify-between text-muted-foreground text-[11px]">
                        <span>Data: {formatDate(followUp.completedDate)}</span>
                        <span className="font-bold text-foreground">{formatCurrency(followUp.total)}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleSendFollowUp(
                        followUp.customerPhone,
                        followUp.customerName,
                        followUp.serviceDescription
                      )
                    }
                    className="w-full text-xs gap-1.5 border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 mt-2 font-semibold"
                  >
                    <MessageCircle className="h-3.5 w-3.5" /> Mensagem no WhatsApp
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
