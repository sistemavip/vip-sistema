import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

interface ImageUploadProps {
    value?: string | null
    onChange: (url: string | null) => void
    disabled?: boolean
    bucketName?: string
}

export function ImageUpload({ value, onChange, disabled, bucketName = "produtos" }: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith("image/")) {
            toast.error("Por favor, selecione apenas arquivos de imagem.")
            return
        }

        // Limit file size to 5MB
        if (file.size > 5 * 1024 * 1024) {
            toast.error("A imagem deve ter no máximo 5MB.")
            return
        }

        setIsUploading(true)

        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(filePath, file)

            if (uploadError) {
                throw uploadError
            }

            const { data } = supabase.storage
                .from(bucketName)
                .getPublicUrl(filePath)

            onChange(data.publicUrl)
            toast.success("Imagem enviada com sucesso!")
        } catch (error) {
            console.error("Erro no upload:", error)
            toast.error("Erro ao enviar imagem. Tente novamente.")
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        }
    }

    const handleRemove = () => {
        onChange(null)
    }

    return (
        <div className="space-y-4 w-full">
            <div className="flex flex-col items-center justify-center gap-4">
                {value ? (
                    <div className="relative aspect-square w-full max-w-[200px] rounded-lg overflow-hidden border border-border">
                        <img
                            src={value}
                            alt="Preview"
                            className="h-full w-full object-cover"
                        />
                        <Button
                            type="button"
                            onClick={handleRemove}
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-6 w-6"
                            disabled={disabled}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <div
                        className="flex flex-col items-center justify-center w-full max-w-[200px] aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors cursor-pointer bg-muted/50 hover:bg-muted"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground text-center px-2">
                                Clique para fazer upload
                            </p>
                            <p className="text-xs text-muted-foreground/75 mt-1">
                                PNG, JPG (max. 5MB)
                            </p>
                        </div>
                    </div>
                )}

                <div className="hidden">
                    <Input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={disabled || isUploading}
                    />
                </div>

                {isUploading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Enviando imagem...
                    </div>
                )}
            </div>
        </div>
    )
}
