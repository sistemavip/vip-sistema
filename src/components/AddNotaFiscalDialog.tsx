import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddNotaFiscalDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

const TIPOS_NF = [
    'Serviço',
    'Produto',
    'Complementar',
    'Devolução',
    'Outro',
];

export function AddNotaFiscalDialog({
    open,
    onOpenChange,
    onSuccess,
}: AddNotaFiscalDialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        data_emissao: new Date().toISOString().split('T')[0],
        numero_nf: '',
        responsavel: '',
        tipo: '',
        valor: '',
        descricao: '',
        vencimento: '',
        valor_imposto_pct: '',
        observacao: '',
    });

    const handleSubmit = async () => {
        if (!formData.numero_nf) {
            toast.error("Informe o número da NF");
            return;
        }

        setLoading(true);

        const { error } = await supabase
            .from('notas_fiscais')
            .insert({
                data_emissao: formData.data_emissao || null,
                numero_nf: formData.numero_nf,
                responsavel: formData.responsavel || null,
                tipo: formData.tipo || null,
                valor: formData.valor ? parseFloat(formData.valor) : 0,
                descricao: formData.descricao || null,
                vencimento: formData.vencimento || null,
                valor_imposto_pct: formData.valor_imposto_pct ? parseFloat(formData.valor_imposto_pct) : 0,
                observacao: formData.observacao || null,
                status: 'EM ABERTO',
            });

        setLoading(false);

        if (error) {
            toast.error("Erro ao adicionar nota fiscal");
            console.error(error);
            return;
        }

        toast.success("Nota fiscal adicionada com sucesso");
        setFormData({
            data_emissao: new Date().toISOString().split('T')[0],
            numero_nf: '',
            responsavel: '',
            tipo: '',
            valor: '',
            descricao: '',
            vencimento: '',
            valor_imposto_pct: '',
            observacao: '',
        });
        onSuccess();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Adicionar Nota Fiscal</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Data Emissão</Label>
                            <Input
                                type="date"
                                value={formData.data_emissao}
                                onChange={(e) => setFormData({ ...formData, data_emissao: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Nº NF *</Label>
                            <Input
                                placeholder="0001"
                                value={formData.numero_nf}
                                onChange={(e) => setFormData({ ...formData, numero_nf: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Responsável</Label>
                            <Input
                                placeholder="Nome do responsável"
                                value={formData.responsavel}
                                onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Tipo</Label>
                            <Select
                                value={formData.tipo}
                                onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    {TIPOS_NF.map(tipo => (
                                        <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Valor (R$)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0,00"
                                value={formData.valor}
                                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>% Imposto</Label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0"
                                value={formData.valor_imposto_pct}
                                onChange={(e) => setFormData({ ...formData, valor_imposto_pct: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Input
                            placeholder="Descrição do serviço/produto"
                            value={formData.descricao}
                            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Vencimento</Label>
                            <Input
                                type="date"
                                value={formData.vencimento}
                                onChange={(e) => setFormData({ ...formData, vencimento: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Observação</Label>
                            <Input
                                placeholder="Observações"
                                value={formData.observacao}
                                onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? "Salvando..." : "Adicionar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
