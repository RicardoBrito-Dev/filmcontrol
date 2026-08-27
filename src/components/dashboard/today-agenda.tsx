'use client'

import { Calendar, Clock, MessageCircle, MapPin, Car, CheckCircle2, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { TodayAgendaItem } from '@/services/dashboard.service'

interface TodayAgendaProps {
  items: TodayAgendaItem[]
}

const statusConfig = {
  AGENDADO: { label: 'Agendado', variant: 'outline' as const, color: 'text-muted-foreground' },
  CONFIRMADO: { label: 'Confirmado', variant: 'info' as const, color: 'text-blue-500' },
  EM_ANDAMENTO: { label: 'Em Instalação', variant: 'warning' as const, color: 'text-amber-500' },
  CONCLUIDO: { label: 'Concluído', variant: 'success' as const, color: 'text-emerald-500' },
  CANCELADO: { label: 'Cancelado', variant: 'destructive' as const, color: 'text-rose-500' },
}

export function TodayAgenda({ items }: TodayAgendaProps) {
  const todayFormatted = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" /> Agenda de Hoje
          </CardTitle>
          <CardDescription className="capitalize mt-0.5">
            {todayFormatted} • {items.length} atendimento(s) programado(s)
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground text-sm">
            <Calendar className="h-10 w-10 text-muted-foreground/30 mb-2" />
            <p>Nenhum agendamento para hoje.</p>
          </div>
        ) : (
          <div className="divide-y">
            {items.map((item) => {
              const status = statusConfig[item.status] || statusConfig.AGENDADO
              const cleanPhone = item.customerPhone?.replace(/\D/g, '')
              const isAddress = item.vehicleOrAddress.includes('Rua') || item.vehicleOrAddress.includes('Alameda') || item.vehicleOrAddress.includes('Av.')

              return (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0"
                >
                  <div className="flex items-start gap-3">
                    {/* Time pill */}
                    <div className="flex h-10 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 font-mono text-xs font-bold text-primary">
                      <Clock className="h-3 w-3 mb-0.5" />
                      {item.time}
                    </div>

                    {/* Service & Client details */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-sm">
                          {item.customerName}
                        </span>
                        <span className="text-xs text-muted-foreground font-normal">
                          • {item.serviceTitle}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          {isAddress ? (
                            <MapPin className="h-3.5 w-3.5 text-primary" />
                          ) : (
                            <Car className="h-3.5 w-3.5 text-primary" />
                          )}
                          <span>{item.vehicleOrAddress}</span>
                        </div>
                        <span>|</span>
                        <span className="font-medium text-foreground">{item.filmType}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Badge variant={status.variant} className="text-xs">
                      {status.label}
                    </Badge>

                    {cleanPhone && (
                      <Button
                        asChild
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                      >
                        <a
                          href={`https://wa.me/55${cleanPhone}?text=Olá%20${encodeURIComponent(
                            item.customerName
                          )},%20confirmando%20nosso%20agendamento%20de%20hoje%20às%20${item.time}.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Confirmar via WhatsApp"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
