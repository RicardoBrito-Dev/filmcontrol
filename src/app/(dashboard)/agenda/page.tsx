'use client'

import { useEffect, useState, useCallback } from 'react'
import { Calendar as CalendarIcon, Plus, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { CalendarView } from '@/components/appointments/calendar-view'
import { AppointmentFormModal } from '@/components/appointments/appointment-form-modal'
import { appointmentService, type AppointmentWithRelations } from '@/services/appointment.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'

export default function AgendaPage() {
  const [appointments, setAppointments] = useState<AppointmentWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true)
      const data = await appointmentService.list()
      setAppointments(data)
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro ao carregar agenda', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAppointments()

    // Listen to window focus or storage changes to reload automatically when returning from quotes
    const handleFocus = () => {
      loadAppointments()
    }
    window.addEventListener('focus', handleFocus)
    window.addEventListener('storage', handleFocus)

    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('storage', handleFocus)
    }
  }, [loadAppointments])

  const handleUpdateStatus = async (
    id: string,
    status: AppointmentWithRelations['status']
  ) => {
    try {
      await appointmentService.updateStatus(id, status)
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      )
      toast({ title: `Agendamento marcado como ${status}` })
    } catch {
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await appointmentService.delete(id)
      setAppointments((prev) => prev.filter((a) => a.id !== id))
      toast({ title: 'Agendamento removido' })
    } catch {
      toast({ title: 'Erro ao remover', variant: 'destructive' })
    }
  }

  const handleAppointmentCreated = (saved: AppointmentWithRelations) => {
    setAppointments((prev) => [saved, ...prev])
  }

  const handleAppointmentUpdated = (updated: AppointmentWithRelations) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === updated.id ? updated : a))
    )
  }

  // Summary counts
  const confirmedCount = appointments.filter(
    (a) => a.status === 'CONFIRMADO' || a.status === 'AGENDADO'
  ).length
  const inProgressCount = appointments.filter(
    (a) => a.status === 'EM_ANDAMENTO'
  ).length
  const completedCount = appointments.filter(
    (a) => a.status === 'CONCLUIDO'
  ).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Agenda & Atendimentos
          </h1>
          <p className="text-sm text-muted-foreground">
            Orçamentos aprovados entram automaticamente aqui. Defina e ajuste as datas e horários de execução.
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Novo Agendamento
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Total na Agenda
            </CardTitle>
            <CalendarIcon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointments.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Serviços cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Aguardando Início
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{confirmedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Próximos atendimentos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Em Instalação
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {inProgressCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Executando agora</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Concluídos
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {completedCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Finalizados com sucesso</p>
          </CardContent>
        </Card>
      </div>

      {/* Main View */}
      <CalendarView
        appointments={appointments}
        onAddNew={() => setIsModalOpen(true)}
        onUpdateStatus={handleUpdateStatus}
        onDelete={handleDelete}
        onAppointmentUpdated={handleAppointmentUpdated}
      />

      {/* Modal */}
      <AppointmentFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={handleAppointmentCreated}
      />
    </div>
  )
}
