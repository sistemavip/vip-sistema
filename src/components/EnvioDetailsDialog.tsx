import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface EnvioDetailsDialogProps {
  shipment: any;
  trigger: React.ReactNode;
}

export function EnvioDetailsDialog({ shipment, trigger }: EnvioDetailsDialogProps) {
  console.log('EnvioDetailsDialog renderizado para envio:', shipment.id);
  
  const buildTrackUrl = (codigo?: string, transportadora?: string) => {
    if (!codigo) return `https://www.google.com/search?q=rastrear+${encodeURIComponent(transportadora||'')}`;
    const t = (transportadora || '').toLowerCase();
    if (t.includes('correios')) return `https://rastreamento.correios.com.br/app/index.php?objeto=${encodeURIComponent(codigo)}`;
    if (t.includes('jadlog')) return `https://www.jadlog.com.br/tracking?cte=${encodeURIComponent(codigo)}`;
    if (t.includes('total')) return `https://portal.totalexpress.com.br/tracking?codigo=${encodeURIComponent(codigo)}`;
    return `https://www.google.com/search?q=${encodeURIComponent(`rastrear ${transportadora} ${codigo}`)}`;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Detalhes do Envio</DialogTitle>
          <DialogDescription>Informações completas sobre este envio</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Destinatário</p>
              <p className="font-medium">{shipment.destinatario_nome}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Telefone</p>
              <p className="font-medium">{shipment.destinatario_telefone || "—"}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs text-muted-foreground">Endereço Completo</p>
              <p className="font-medium">
                {shipment.destinatario_endereco}, {shipment.destinatario_numero}
                {shipment.destinatario_complemento && `, ${shipment.destinatario_complemento}`}
              </p>
              <p className="text-sm text-muted-foreground">
                {shipment.destinatario_bairro} - {shipment.destinatario_cidade}/{shipment.destinatario_estado}
              </p>
              <p className="text-sm text-muted-foreground">CEP: {shipment.cep_destino}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Transportadora</p>
              <p className="font-medium capitalize">{shipment.forma_envio || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Código Rastreio</p>
              <p className="font-mono text-sm">{shipment.codigo_rastreio || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="font-medium capitalize">{shipment.status}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Peso</p>
              <p className="font-medium">{shipment.peso ? `${shipment.peso} kg` : "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Valor Frete</p>
              <p className="font-medium">R$ {(shipment.valor_frete || 0).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Data Postagem</p>
              <p className="font-medium">{shipment.data_postagem ? new Date(shipment.data_postagem).toLocaleDateString('pt-BR') : "Pendente"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Data Entrega</p>
              <p className="font-medium">{shipment.data_entrega ? new Date(shipment.data_entrega).toLocaleDateString('pt-BR') : "—"}</p>
            </div>
            {shipment.observacoes && (
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground">Observações</p>
                <p className="text-sm">{shipment.observacoes}</p>
              </div>
            )}
          </div>
          {shipment.codigo_rastreio && (
            <Button asChild variant="link" className="p-0 h-auto"> 
              <a href={buildTrackUrl(shipment.codigo_rastreio, shipment.forma_envio)} target="_blank" rel="noreferrer">Rastrear no site da transportadora</a>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}