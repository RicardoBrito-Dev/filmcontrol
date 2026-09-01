'use client'

import { useState, useEffect } from 'react'
import {
  Printer,
  MessageCircle,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Film,
  MapPin,
  Car,
  Phone,
  Calendar,
  Edit2,
  Building2,
  CreditCard,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, formatPhone } from '@/lib/utils'
import type { QuoteWithRelations } from '@/services/quote.service'
import { quoteService } from '@/services/quote.service'
import {
  storeSettingsService,
  type StoreSettings,
  DEFAULT_STORE_SETTINGS,
} from '@/services/store-settings.service'
import { QuoteFormModal } from '@/components/quotes/quote-form-modal'
import { toast } from '@/hooks/use-toast'

interface QuotePdfViewProps {
  quote: QuoteWithRelations
}

const statusConfig = {
  RASCUNHO: { label: 'Rascunho', variant: 'outline' as const },
  ENVIADO: { label: 'Enviado', variant: 'info' as const },
  AGUARDANDO_APROVACAO: { label: 'Aguardando Aprovação', variant: 'warning' as const },
  APROVADO: { label: 'Aprovado', variant: 'success' as const },
  RECUSADO: { label: 'Recusado', variant: 'destructive' as const },
  EXPIRADO: { label: 'Expirado', variant: 'secondary' as const },
}

export function QuotePdfView({ quote: initialQuote }: QuotePdfViewProps) {
  const router = useRouter()
  const [quote, setQuote] = useState<QuoteWithRelations>(initialQuote)
  const [currentStatus, setCurrentStatus] = useState(initialQuote.status)
  const [isApproving, setIsApproving] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS)

  const statusInfo = statusConfig[currentStatus] || statusConfig.AGUARDANDO_APROVACAO

  useEffect(() => {
    const s = storeSettingsService.getSettings()
    setStoreSettings(s)
  }, [])

  const handlePrint = () => {
    window.print()
  }

  const handleApprove = async () => {
    setIsApproving(true)
    try {
      await quoteService.updateStatus(quote.id, 'APROVADO', quote)
      setCurrentStatus('APROVADO')
      setQuote((prev) => ({ ...prev, status: 'APROVADO' }))
      toast({
        title: 'Orçamento Aprovado com Sucesso!',
        description: 'O serviço foi adicionado à sua Agenda. Clique no botão da Agenda para definir data e horário.',
        variant: 'success' as 'default',
      })
    } catch {
      toast({ title: 'Erro ao aprovar orçamento', variant: 'destructive' })
    } finally {
      setIsApproving(false)
    }
  }

  const handleQuoteUpdated = (updated: QuoteWithRelations) => {
    setQuote(updated)
    setCurrentStatus(updated.status)
  }

  const storeName = storeSettings.name || 'Nossa Loja de Películas'

  // Generate WhatsApp formatted text
  const cleanPhone = (quote.customer?.whatsapp || quote.customer?.phone || '').replace(/\D/g, '')
  const itemsText = (quote.items || [])
    .map((item, i) => `  ${i + 1}. *${item.description}* - ${formatCurrency(Number(item.subtotal))}`)
    .join('\n')

  const whatsAppMessage = `Olá *${quote.customer?.name || 'Cliente'}*, segue o orçamento solicitado na *${storeName}*:

📄 *Orçamento:* #${quote.number}
📅 *Data:* ${formatDate(quote.created_at)}
${quote.vehicle ? `🚗 *Veículo:* ${quote.vehicle.brand} ${quote.vehicle.model} (${quote.vehicle.plate || ''})` : ''}
${quote.customer?.address ? `📍 *Endereço:* ${quote.customer.address}, ${quote.customer.address_number || ''}` : ''}

*Serviços / Películas:*
${itemsText}

💰 *Subtotal:* ${formatCurrency(Number(quote.subtotal))}
${quote.discount ? `🏷️ *Desconto:* ${formatCurrency(Number(quote.discount))}` : ''}
⭐ *VALOR TOTAL:* ${formatCurrency(Number(quote.total))}
${storeSettings.pixKey ? `🔑 *Chave PIX:* ${storeSettings.pixKey}` : ''}

${quote.valid_until ? `⏳ *Válido até:* ${formatDate(quote.valid_until)}` : ''}
${quote.notes ? `📝 *Observações:* ${quote.notes}` : ''}

Ficamos à disposição para agendar a sua instalação!`

  const whatsappUrl = cleanPhone
    ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(whatsAppMessage)}`
    : null

  return (
    <div className="space-y-6">
      {/* Top action bar - Hidden when printing */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="icon">
            <Link href="/orcamentos">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                Orçamento #{quote.number}
              </h1>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Emitido em {formatDate(quote.created_at)}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsEditModalOpen(true)}
            className="gap-2 font-semibold justify-center"
          >
            <Edit2 className="h-4 w-4 text-amber-500" /> Editar Orçamento
          </Button>

          {whatsappUrl && (
            <Button
              asChild
              variant="outline"
              className="gap-2 border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 justify-center"
            >
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" /> Enviar no WhatsApp
              </a>
            </Button>
          )}

          <Button variant="outline" onClick={handlePrint} className="gap-2 justify-center">
            <Printer className="h-4 w-4" /> Imprimir / PDF
          </Button>

          {currentStatus !== 'APROVADO' ? (
            <Button
              onClick={handleApprove}
              disabled={isApproving}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 font-bold justify-center"
            >
              <CheckCircle2 className="h-4 w-4" />
              {isApproving ? 'Aprovando...' : 'Aprovar & Agendar na Agenda'}
            </Button>
          ) : (
            <Button asChild className="gap-2 bg-primary font-bold justify-center">
              <Link href="/agenda">
                <Calendar className="h-4 w-4" /> Ver na Agenda
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Printable Document Sheet */}
      <div className="rounded-xl border bg-card p-4 sm:p-8 shadow-sm print:border-none print:shadow-none print:p-0 max-w-4xl mx-auto space-y-6 sm:space-y-8">
        {/* Document Header with Shop Owner's Store Branding */}
        <div className="flex justify-between items-start border-b pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-xs">
                <Film className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  {storeName}
                </span>
                <span className="text-[11px] text-muted-foreground uppercase tracking-widest font-semibold">
                  Aplicação Profissional de Películas & Proteção Solar
                </span>
              </div>
            </div>

            {/* Dados de Contato e Endereço da Loja do Usuário */}
            <div className="text-xs text-muted-foreground space-y-0.5 pt-1 pl-1">
              {storeSettings.document && (
                <p>CNPJ/CPF: <strong className="text-foreground font-mono">{storeSettings.document}</strong></p>
              )}
              {storeSettings.phone && (
                <p>Telefone / WhatsApp: <strong className="text-foreground">{storeSettings.phone}</strong></p>
              )}
              {storeSettings.address && (
                <p>Endereço: {storeSettings.address}</p>
              )}
              {storeSettings.pixKey && (
                <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  Chave PIX: <span className="font-mono">{storeSettings.pixKey}</span>
                </p>
              )}
            </div>
          </div>

          <div className="text-right space-y-1">
            <h3 className="text-lg font-bold font-mono text-primary">
              ORÇAMENTO #{quote.number}
            </h3>
            <p className="text-xs text-muted-foreground">
              Data de Emissão: <strong>{formatDate(quote.created_at)}</strong>
            </p>
            {quote.valid_until && (
              <p className="text-xs text-muted-foreground">
                Validade: <strong>{formatDate(quote.valid_until)}</strong>
              </p>
            )}
          </div>
        </div>

        {/* Client & Target Information */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 bg-muted/20 p-4 rounded-xl">
          {/* Dados do Cliente */}
          <div className="space-y-1.5 text-xs">
            <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b pb-1">
              Dados do Cliente
            </h4>
            <p className="text-sm font-semibold text-foreground">
              {quote.customer?.name || 'Cliente Não Identificado'}
            </p>
            {quote.customer?.document && (
              <p className="text-muted-foreground">CPF/CNPJ: {quote.customer.document}</p>
            )}
            <p className="text-muted-foreground">
              WhatsApp: {quote.customer?.whatsapp ? formatPhone(quote.customer.whatsapp) : '-'}
            </p>
            {quote.customer?.email && (
              <p className="text-muted-foreground">E-mail: {quote.customer.email}</p>
            )}
          </div>

          {/* Dados do Atendimento (Veículo ou Residência) */}
          <div className="space-y-1.5 text-xs">
            <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b pb-1">
              Local / Veículo de Aplicação
            </h4>
            {quote.vehicle ? (
              <>
                <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Car className="h-4 w-4 text-primary" /> {quote.vehicle.brand} {quote.vehicle.model}
                </p>
                {quote.vehicle.plate && (
                  <p className="text-muted-foreground font-mono">
                    Placa: <strong>{quote.vehicle.plate}</strong> {quote.vehicle.year ? `• Ano: ${quote.vehicle.year}` : ''}
                  </p>
                )}
                {quote.vehicle.color && (
                  <p className="text-muted-foreground">Cor: {quote.vehicle.color}</p>
                )}
              </>
            ) : quote.customer?.address ? (
              <>
                <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-primary" /> Aplicação no Local
                </p>
                <p className="text-muted-foreground">
                  {quote.customer.address}, {quote.customer.address_number || ''} {quote.customer.address_complement || ''}
                </p>
                <p className="text-muted-foreground">
                  {quote.customer.neighborhood} - {quote.customer.city}/{quote.customer.state}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground italic">Atendimento na loja</p>
            )}
          </div>
        </div>

        {/* Table of Items */}
        <div className="space-y-2">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b bg-muted/40 font-semibold text-muted-foreground uppercase text-[10px]">
                  <th className="py-2.5 px-3">Item / Descrição</th>
                  <th className="py-2.5 px-3 text-center">Medidas / Área</th>
                  <th className="py-2.5 px-3 text-center">Qtd</th>
                  <th className="py-2.5 px-3 text-right">Unitário</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(quote.items || []).map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-foreground text-sm block">
                        {item.description}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-muted-foreground">
                      {item.width && item.height ? (
                        <span>
                          {item.width}m × {item.height}m {item.area ? `(${item.area} m²)` : ''}
                        </span>
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-semibold">
                      {item.quantity}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-muted-foreground">
                      {formatCurrency(Number(item.unit_price))}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-foreground">
                      {formatCurrency(Number(item.subtotal))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals & Notes */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 pt-4 border-t">
          <div className="space-y-2 text-xs text-muted-foreground">
            <h5 className="font-bold text-foreground uppercase tracking-wider text-[11px]">
              Garantia e Condições da {storeName}
            </h5>
            <p className="leading-relaxed whitespace-pre-line">
              {quote.notes ||
                storeSettings.warrantyTerms ||
                'Garantia de 3 a 5 anos contra desbotamento, bolhas e perda de tonalidade. Pagamento facilitado em até 3x sem juros ou desconto especial no PIX.'}
            </p>
          </div>

          <div className="space-y-2 text-xs self-end">
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-semibold">{formatCurrency(Number(quote.subtotal))}</span>
            </div>

            {quote.discount > 0 && (
              <div className="flex justify-between py-1 border-b text-rose-600">
                <span>Desconto Especial:</span>
                <span className="font-semibold">- {formatCurrency(Number(quote.discount))}</span>
              </div>
            )}

            <div className="flex justify-between items-baseline pt-2 text-base">
              <span className="font-bold text-foreground">VALOR TOTAL:</span>
              <span className="text-2xl font-bold text-primary">
                {formatCurrency(Number(quote.total))}
              </span>
            </div>
          </div>
        </div>

        {/* Signature Area */}
        <div className="pt-12 grid grid-cols-2 gap-8 text-center text-xs text-muted-foreground">
          <div>
            <div className="border-t border-muted-foreground/40 pt-2 font-medium">
              {storeName} — Responsável Técnico
            </div>
          </div>
          <div>
            <div className="border-t border-muted-foreground/40 pt-2 font-medium">
              {quote.customer?.name || 'Cliente (De acordo)'}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Edição de Orçamento */}
      <QuoteFormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        quoteToEdit={quote}
        onSuccess={handleQuoteUpdated}
      />
    </div>
  )
}
