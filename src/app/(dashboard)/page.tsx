'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  FileText,
  ClipboardList,
  Clock,
  Car,
  Plus,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { KPICard } from '@/components/dashboard/kpi-card'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { CategoryChart } from '@/components/dashboard/category-chart'
import { PaymentChart } from '@/components/dashboard/payment-chart'
import { TodayAgenda } from '@/components/dashboard/today-agenda'
import {
  dashboardService,
  type DashboardMetrics,
  type MonthlyRevenueData,
  type ServiceCategoryData,
  type PaymentMethodData,
  type TodayAgendaItem,
} from '@/services/dashboard.service'
import { CustomerFormModal } from '@/components/customers/customer-form-modal'
import { VehicleFormModal } from '@/components/vehicles/vehicle-form-modal'
import { formatCurrency } from '@/lib/utils'

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [revenueData, setRevenueData] = useState<MonthlyRevenueData[]>([])
  const [categoryData, setCategoryData] = useState<ServiceCategoryData[]>([])
  const [paymentData, setPaymentData] = useState<PaymentMethodData[]>([])
  const [agendaItems, setAgendaItems] = useState<TodayAgendaItem[]>([])
  const [loading, setLoading] = useState(true)

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false)
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false)

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true)
      const [m, r, c, p, a] = await Promise.all([
        dashboardService.getMetrics(),
        dashboardService.getMonthlyRevenue(),
        dashboardService.getServicesByCategory(),
        dashboardService.getPaymentMethods(),
        dashboardService.getTodayAgenda(),
      ])
      setMetrics(m)
      setRevenueData(r)
      setCategoryData(c)
      setPaymentData(p)
      setAgendaItems(a)
    } catch (err) {
      console.error('Error loading dashboard:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()

    // Reload when user navigates or window focuses
    const handleRefresh = () => {
      loadDashboard()
    }
    window.addEventListener('focus', handleRefresh)
    window.addEventListener('storage', handleRefresh)

    return () => {
      window.removeEventListener('focus', handleRefresh)
      window.removeEventListener('storage', handleRefresh)
    }
  }, [loadDashboard])

  return (
    <div className="space-y-6">
      {/* Top Header & Fast Action Buttons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Painel Geral
          </h1>
          <p className="text-sm text-muted-foreground">
            Visão consolidada em tempo real da sua loja de películas automotivas e residenciais.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsVehicleModalOpen(true)}
            className="gap-1.5"
          >
            <Car className="h-4 w-4" /> Novo Veículo
          </Button>
          <Button onClick={() => setIsCustomerModalOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Novo Cliente
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Faturamento do Mês"
          value={formatCurrency(metrics?.monthlyRevenue || 0)}
          trend={metrics && metrics.monthlyRevenue > 0 ? { value: metrics.monthlyRevenueTrend, isPositive: true } : undefined}
          description="Soma de OS e serviços no mês"
          icon={DollarSign}
          iconColor="text-emerald-600 dark:text-emerald-400"
        />

        <KPICard
          title="Faturamento de Hoje"
          value={formatCurrency(metrics?.todayRevenue || 0)}
          description="Serviços finalizados hoje"
          icon={TrendingUp}
          iconColor="text-primary"
        />

        <KPICard
          title="A Receber / Pendente"
          value={formatCurrency(metrics?.receivables || 0)}
          description="Pagamentos pendentes de OS"
          icon={Clock}
          iconColor="text-amber-500"
        />

        <KPICard
          title="Lucro Líquido Estimado"
          value={formatCurrency(metrics?.estimatedProfit || 0)}
          description="Receita menos despesas reais"
          icon={DollarSign}
          iconColor="text-blue-500"
        />

        <KPICard
          title="Serviços Realizados"
          value={metrics?.completedServicesCount || 0}
          description="Ordens de Serviço concluídas"
          icon={ClipboardList}
          iconColor="text-emerald-500"
        />

        <KPICard
          title="Serviços Agendados"
          value={metrics?.scheduledServicesCount || 0}
          description="Atendimentos na agenda"
          icon={Calendar}
          iconColor="text-primary"
        />

        <KPICard
          title="Orçamentos Pendentes"
          value={metrics?.pendingQuotesCount || 0}
          description="Aguardando aprovação"
          icon={FileText}
          iconColor="text-amber-500"
        />

        <KPICard
          title="Clientes na Base"
          value={metrics?.totalCustomersCount || 0}
          description="Clientes cadastrados"
          icon={Users}
          iconColor="text-blue-500"
        />
      </div>

      {/* Agenda de Hoje Widget */}
      <TodayAgenda items={agendaItems} />

      {/* Interactive Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <RevenueChart data={revenueData} />
        <CategoryChart data={categoryData} />
        <PaymentChart data={paymentData} />
      </div>

      {/* Modais de ação rápida */}
      <CustomerFormModal
        open={isCustomerModalOpen}
        onOpenChange={setIsCustomerModalOpen}
        onSuccess={loadDashboard}
      />

      <VehicleFormModal
        open={isVehicleModalOpen}
        onOpenChange={setIsVehicleModalOpen}
        onSuccess={loadDashboard}
      />
    </div>
  )
}
