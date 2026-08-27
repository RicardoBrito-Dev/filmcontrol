'use client'

import { useState } from 'react'
import {
  Calendar as CalendarIcon,
  Clock,
  Car,
  MapPin,
  MessageCircle,
  MoreVertical,
  CheckCircle2,
  Trash2,
  Plus,
  Edit3,
  FileCheck,
  Play,
  Check,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDateTime } from '@/lib/utils'
import type { AppointmentWithRelations } from '@/services/appointment.service'
import { appointmentService } from '@/services/appointment.service'
import { toast } from '@/hooks/use-toast'

interface CalendarViewProps {
  appointments: AppointmentWithRelations[]
  onAddNew: () => void
  onUpdateStatus: (id: string, status: AppointmentWithRelations['status']) => void
  onDelete: (id: string) => void
  onAppointmentUpdated?: (updated: AppointmentWithRelations) => void
}

const statusBadgeConfig = {
  AGENDADO: { label: 'Agendado', variant: 'outline' as const },
  CONFIRMADO: { label: 'Confirmado', variant: 'info' as const },
  EM_ANDAMENTO: { label: 'Em Andamento', variant: 'warning' as const },
  CONCLUIDO: { label: 'Concluído', variant: 'success' as const },
  CANCELADO: { label: 'Cancelado', variant: 'destructive' as const },
  FALTOU: { label: 'Faltou', variant: 'secondary' as const },
}

export function CalendarView({
  appointments,
  onAddNew,
  onUpdateStatus,
  onDelete,
  onAppointmentUpdated,
}: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<'TODOS' | 'HOJE' | 'SEMANA'>('TODOS')

  // Quick Date/Time Edit Modal
  const [isEditDateModalOpen, setIsEditDateModalOpen] = useState(false)
  const [selectedApt, setSelectedApt] = useState<AppointmentWithRelations | null>(null)
  const [newStartTime, setNewStartTime] = useState('')
  const [newEndTime, setNewEndTime] = useState('')
  const [savingDateTime, setSavingDateTime] = useState(false)

  // Filter appointments
  const filtered = appointments.filter((apt) => {
    const aptDate = new Date(apt.start_time)
    if (viewMode === 'HOJE') {
      const today = new Date()
      return (
        aptDate.getDate() === today.getDate() &&
        aptDate.getMonth() === today.getMonth() &&
        aptDate.getFullYear() === today.getFullYear()
      )
    }
    if (viewMode === 'SEMANA') {
      const startOfWeek = new Date()
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(endOfWeek.getDate() + 6)
      return aptDate >= startOfWeek && aptDate <= endOfWeek
    }
    return true
  })

  const formatToLocalInput = (dateInput: string | Date) => {
    const d = new Date(dateInput)
    if (isNaN(d.getTime())) {
      const now = new Date()
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    }
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const handleOpenEditDateTime = (apt: AppointmentWithRelations) => {
    setSelectedApt(apt)
    const startVal = formatToLocalInput(apt.start_time)
    const endVal = apt.end_time
      ? formatToLocalInput(apt.end_time)
      : formatToLocalInput(new Date(new Date(apt.start_time).getTime() + 7200000))

    setNewStartTime(startVal)
    setNewEndTime(endVal)
    setIsEditDateModalOpen(true)
  }

  const handleSaveDateTime = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedApt || !newStartTime) return

    setSavingDateTime(true)
    try {
      const parsedStart = new Date(newStartTime).toISOString()
      const parsedEnd = newEndTime ? new Date(newEndTime).toISOString() : null

      const updated = await appointmentService.updateDateTime(
        selectedApt.id,
        parsedStart,
        parsedEnd,
        selectedApt
      )

      toast({
        title: 'Horário atualizado com sucesso!',
        description: `Serviço agendado para ${formatDateTime(updated.start_time)}.`,
        variant: 'success' as 'default',
      })

      if (onAppointmentUpdated) {
        onAppointmentUpdated(updated)
      }
      setIsEditDateModalOpen(false)
    } catch (err) {
      console.error('Error updating appointment date:', err)
      toast({ title: 'Erro ao salvar novo horário', variant: 'destructive' })
    } finally {
      setSavingDateTime(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Top Filter Toolbar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { mode: 'TODOS', label: 'Todos os Agendamentos' },
          { mode: 'HOJE', label: 'Hoje' },
          { mode: 'SEMANA', label: 'Esta Semana' },
        ].map(({ mode, label }) => (
          <Button
            key={mode}
            variant={viewMode === mode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode(mode as typeof viewMode)}
            className="text-xs h-8 px-3 shrink-0 font-medium"
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Appointment Cards Timeline */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-10 sm:p-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
            <CalendarIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold">Nenhum agendamento para este período</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 mb-4">
            Orçamentos aprovados entram automaticamente aqui para agendamento.
          </p>
          <Button onClick={onAddNew} size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Agendar Atendimento
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((apt) => {
            const statusInfo = statusBadgeConfig[apt.status] || statusBadgeConfig.AGENDADO
            const aptDate = new Date(apt.start_time)
            const cleanPhone = (apt.customer?.whatsapp || apt.customer?.phone || '').replace(/\D/g, '')

            const timeStr = isNaN(aptDate.getTime())
              ? '--:--'
              : aptDate.toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
            const dateStr = isNaN(aptDate.getTime())
              ? 'Data'
              : aptDate.toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  weekday: 'short',
                })

            const isAddress =
              apt.address &&
              apt.address.toLowerCase() !== 'na loja' &&
              apt.address.toLowerCase() !== 'loja'

            const isFromQuote =
              apt.title.includes('Orç.') ||
              apt.title.includes('ORC-') ||
              apt.notes?.includes('Orçamento #')

            return (
              <div
                key={apt.id}
                className="rounded-xl border bg-card p-3.5 sm:p-4 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
              >
                {/* Left: Date Box + Information */}
                <div className="flex items-start gap-3">
                  {/* Clickable Date/Time badge */}
                  <button
                    type="button"
                    onClick={() => handleOpenEditDateTime(apt)}
                    title="Clique para alterar data e horário"
                    className="flex h-15 w-18 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/10 hover:bg-primary/20 font-mono text-primary font-bold transition-colors border border-primary/20 group"
                  >
                    <span className="text-[10px] uppercase font-sans text-muted-foreground group-hover:text-primary">
                      {dateStr}
                    </span>
                    <span className="text-sm mt-0.5">{timeStr}</span>
                    <span className="text-[9px] font-sans text-primary/70 font-normal">
                      Editar
                    </span>
                  </button>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h4 className="font-semibold text-foreground text-sm sm:text-base">
                        {apt.title}
                      </h4>
                      <Badge variant={statusInfo.variant} className="text-[11px]">
                        {statusInfo.label}
                      </Badge>
                      {isFromQuote && (
                        <Badge variant="success" className="gap-1 text-[10px] font-mono">
                          <FileCheck className="h-3 w-3" /> Orçamento Aprovado
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        👤 {apt.customer?.name || 'Cliente'}
                      </span>

                      {apt.vehicle ? (
                        <span className="flex items-center gap-1">
                          <Car className="h-3.5 w-3.5 text-primary" />
                          {apt.vehicle.brand} {apt.vehicle.model} ({apt.vehicle.plate || 'S/ placa'})
                        </span>
                      ) : isAddress ? (
                        <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                          <MapPin className="h-3.5 w-3.5" />
                          {apt.address}
                        </span>
                      ) : (
                        <span>📍 Na Loja</span>
                      )}
                    </div>

                    {apt.notes && (
                      <p className="text-xs text-muted-foreground italic line-clamp-1">
                        Obs: {apt.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Clean, Non-Duplicated Action Bar */}
                <div className="flex items-center gap-2 self-end sm:self-center border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto justify-between sm:justify-end">
                  {/* Primary Status Action Button */}
                  {(apt.status === 'AGENDADO' || apt.status === 'CONFIRMADO') && (
                    <Button
                      size="sm"
                      onClick={() => onUpdateStatus(apt.id, 'EM_ANDAMENTO')}
                      className="text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold h-8 px-3"
                    >
                      <Play className="h-3.5 w-3.5" /> Iniciar Serviço
                    </Button>
                  )}

                  {apt.status === 'EM_ANDAMENTO' && (
                    <Button
                      size="sm"
                      onClick={() => onUpdateStatus(apt.id, 'CONCLUIDO')}
                      className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 px-3 shadow-sm"
                    >
                      <Check className="h-3.5 w-3.5" /> Concluir Instalação
                    </Button>
                  )}

                  {apt.status === 'CONCLUIDO' && (
                    <Badge variant="success" className="gap-1 py-1 px-2.5 text-xs font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Concluído
                    </Badge>
                  )}

                  {cleanPhone && (
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="gap-1 border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-xs h-8 px-2.5"
                    >
                      <a
                        href={`https://wa.me/55${cleanPhone}?text=Olá%20${encodeURIComponent(
                          apt.customer?.name || ''
                        )},%20confirmando%20nosso%20agendamento%20para%20${dateStr}%20às%20${timeStr}.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Enviar mensagem no WhatsApp"
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                      </a>
                    </Button>
                  )}

                  {/* 3-Dots Dropdown with Secondary / Destructive Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={() => handleOpenEditDateTime(apt)}
                        className="cursor-pointer gap-2"
                      >
                        <Edit3 className="h-4 w-4 text-primary" /> Alterar Data / Horário
                      </DropdownMenuItem>

                      {apt.status !== 'CANCELADO' && (
                        <DropdownMenuItem
                          onClick={() => onUpdateStatus(apt.id, 'CANCELADO')}
                          className="cursor-pointer gap-2 text-rose-600 focus:text-rose-600"
                        >
                          <XCircle className="h-4 w-4" /> Cancelar Agendamento
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onClick={() => {
                          if (confirm('Deseja excluir este agendamento?')) {
                            onDelete(apt.id)
                          }
                        }}
                        className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Rápido de Edição de Data e Horário */}
      <Dialog open={isEditDateModalOpen} onOpenChange={setIsEditDateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" /> Definir Data & Horário do Serviço
            </DialogTitle>
            <DialogDescription>
              {selectedApt?.title} — {selectedApt?.customer?.name}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveDateTime} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-start">Data e Horário de Início *</Label>
              <Input
                id="edit-start"
                type="datetime-local"
                value={newStartTime}
                onChange={(e) => setNewStartTime(e.target.value)}
                required
                className="font-mono text-sm font-semibold"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-end">Horário Previsto de Término</Label>
              <Input
                id="edit-end"
                type="datetime-local"
                value={newEndTime}
                onChange={(e) => setNewEndTime(e.target.value)}
                className="font-mono text-sm"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDateModalOpen(false)}
                disabled={savingDateTime}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={savingDateTime}>
                {savingDateTime ? 'Salvando...' : 'Salvar Horário'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
