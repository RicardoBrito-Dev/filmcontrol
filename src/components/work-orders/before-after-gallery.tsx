'use client'

import { useState } from 'react'
import { Image as ImageIcon, Plus, Trash2, ZoomIn, Camera, Check, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { FileRecord } from '@/types/database.types'
import { workOrderService } from '@/services/work-order.service'
import { toast } from '@/hooks/use-toast'

interface BeforeAfterGalleryProps {
  orderId: string
  initialFiles: FileRecord[]
}

const SAMPLE_PHOTO_PRESETS = [
  {
    type: 'ANTES' as const,
    url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
    name: 'Vidros transparentes antes da aplicação',
  },
  {
    type: 'DEPOIS' as const,
    url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
    name: 'Película G5 instalada com acabamento impecável',
  },
]

export function BeforeAfterGallery({
  orderId,
  initialFiles,
}: BeforeAfterGalleryProps) {
  const [files, setFiles] = useState<FileRecord[]>(initialFiles || [])
  const [selectedPhotoType, setSelectedPhotoType] = useState<'ANTES' | 'DEPOIS'>('ANTES')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [photoUrl, setPhotoUrl] = useState('')
  const [photoName, setPhotoName] = useState('')
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const antesPhotos = files.filter((f) => f.file_type === 'ANTES')
  const depoisPhotos = files.filter((f) => f.file_type === 'DEPOIS')

  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!photoUrl) {
      toast({ title: 'Insira o link ou URL da foto', variant: 'destructive' })
      return
    }

    try {
      const added = await workOrderService.addPhoto(orderId, {
        file_type: selectedPhotoType,
        url: photoUrl,
        name: photoName || `Foto ${selectedPhotoType.toLowerCase()}`,
      })

      setFiles((prev) => [...prev, added])
      setPhotoUrl('')
      setPhotoName('')
      setIsAddModalOpen(false)
      toast({ title: 'Foto adicionada à galeria!' })
    } catch {
      toast({ title: 'Erro ao adicionar foto', variant: 'destructive' })
    }
  }

  const handleDeletePhoto = async (fileId: string) => {
    try {
      await workOrderService.deletePhoto(orderId, fileId)
      setFiles((prev) => prev.filter((f) => f.id !== fileId))
      toast({ title: 'Foto removida' })
    } catch {
      toast({ title: 'Erro ao remover foto', variant: 'destructive' })
    }
  }

  const handleAddPreset = async (preset: typeof SAMPLE_PHOTO_PRESETS[0]) => {
    try {
      const added = await workOrderService.addPhoto(orderId, {
        file_type: preset.type,
        url: preset.url,
        name: preset.name,
      })
      setFiles((prev) => [...prev, added])
      toast({ title: `Foto ${preset.type} inserida como exemplo!` })
    } catch {
      toast({ title: 'Erro ao inserir foto', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" /> Fotos Antes & Depois
          </h3>
          <p className="text-xs text-muted-foreground">
            Documente a qualidade da instalação para enviar ao cliente e comprovar o serviço.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {files.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                handleAddPreset(SAMPLE_PHOTO_PRESETS[0])
                handleAddPreset(SAMPLE_PHOTO_PRESETS[1])
              }}
              className="text-xs gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Adicionar Fotos de Exemplo
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => {
              setSelectedPhotoType('ANTES')
              setIsAddModalOpen(true)
            }}
            className="text-xs gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" /> Adicionar Foto
          </Button>
        </div>
      </div>

      {/* Side-by-Side Comparison Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Coluna ANTES */}
        <Card className="border-amber-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-3 bg-amber-50/40 dark:bg-amber-950/10 rounded-t-xl">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Badge variant="warning">ANTES</Badge> Vidros Originais
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {antesPhotos.length} foto(s) registradas
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedPhotoType('ANTES')
                setIsAddModalOpen(true)
              }}
              className="text-xs text-amber-700 dark:text-amber-300"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Antes
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            {antesPhotos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground text-xs border border-dashed rounded-lg">
                <ImageIcon className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p>Nenhuma foto do estado anterior.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {antesPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="group relative overflow-hidden rounded-lg border bg-muted/40"
                  >
                    <img
                      src={photo.url}
                      alt={photo.name}
                      className="h-40 w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 rounded-full"
                        onClick={() => setPreviewImage(photo.url)}
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8 rounded-full"
                        onClick={() => handleDeletePhoto(photo.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="p-2 text-[11px] font-medium text-foreground truncate">
                      {photo.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Coluna DEPOIS */}
        <Card className="border-emerald-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-3 bg-emerald-50/40 dark:bg-emerald-950/10 rounded-t-xl">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Badge variant="success">DEPOIS</Badge> Película Instalada
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {depoisPhotos.length} foto(s) registradas
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedPhotoType('DEPOIS')
                setIsAddModalOpen(true)
              }}
              className="text-xs text-emerald-700 dark:text-emerald-300"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Depois
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            {depoisPhotos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground text-xs border border-dashed rounded-lg">
                <ImageIcon className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p>Nenhuma foto do resultado final.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {depoisPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="group relative overflow-hidden rounded-lg border bg-muted/40"
                  >
                    <img
                      src={photo.url}
                      alt={photo.name}
                      className="h-40 w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 rounded-full"
                        onClick={() => setPreviewImage(photo.url)}
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8 rounded-full"
                        onClick={() => handleDeletePhoto(photo.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="p-2 text-[11px] font-medium text-foreground truncate">
                      {photo.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal para adicionar foto */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Foto da Instalação</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddPhoto} className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Foto</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={selectedPhotoType === 'ANTES' ? 'default' : 'outline'}
                  onClick={() => setSelectedPhotoType('ANTES')}
                  className="w-full text-xs"
                >
                  Foto ANTES
                </Button>
                <Button
                  type="button"
                  variant={selectedPhotoType === 'DEPOIS' ? 'default' : 'outline'}
                  onClick={() => setSelectedPhotoType('DEPOIS')}
                  className="w-full text-xs"
                >
                  Foto DEPOIS
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="photo-url">URL da Foto / Link da Imagem</Label>
              <Input
                id="photo-url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://exemplo.com/foto.jpg"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="photo-name">Legenda / Descrição</Label>
              <Input
                id="photo-name"
                value={photoName}
                onChange={(e) => setPhotoName(e.target.value)}
                placeholder="Ex: Visão lateral com película G5 finalizada"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Salvar Foto</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Zoom Preview */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="sm:max-w-3xl p-2 bg-black border-none">
          {previewImage && (
            <img
              src={previewImage}
              alt="Visualização"
              className="max-h-[80vh] w-full object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
