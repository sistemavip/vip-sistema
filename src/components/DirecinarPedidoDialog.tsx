import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Send, Loader2 } from 'lucide-react';

interface DirecinarPedidoDialogProps {
  order: any;
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

export function DirecinarPedidoDialog({ order, onSuccess, trigger }: DirecinarPedidoDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(order.cliente_email_vinculo || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Digite o email do cliente');
      return;
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Digite um email válido');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('ordens_servico')
        .update({
          cliente_email_vinculo: email.toLowerCase().trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (error) throw error;

      toast.success('Pedido direcionado com sucesso!', {
        description: `O cliente ${email} poderá ver este pedido no portal.`,
      });
      setOpen(false);
      onSuccess();
    } catch (err) {
      console.error('Erro ao direcionar pedido:', err);
      toast.error('Erro ao direcionar pedido');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from('ordens_servico')
        .update({
          cliente_email_vinculo: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (error) throw error;

      toast.success('Vínculo removido', {
        description: 'O pedido não está mais visível para o cliente.',
      });
      setEmail('');
      setOpen(false);
      onSuccess();
    } catch (err) {
      console.error('Erro ao remover vínculo:', err);
      toast.error('Erro ao remover vínculo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Send className="h-4 w-4" />
            Direcionar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Direcionar Pedido para Cliente</DialogTitle>
          <DialogDescription>
            Informe o email do cliente para que ele possa visualizar este pedido no portal.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="order-number">Pedido</Label>
            <Input
              id="order-number"
              value={order.numero_os}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-email">Email do Cliente</Label>
            <Input
              id="client-email"
              type="email"
              placeholder="cliente@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              O cliente deve criar uma conta com este email para visualizar o pedido.
            </p>
          </div>

          {order.cliente_email_vinculo && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">
                <span className="text-muted-foreground">Atualmente vinculado a:</span>{' '}
                <span className="font-medium">{order.cliente_email_vinculo}</span>
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {order.cliente_email_vinculo && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleRemove}
                disabled={loading}
              >
                Remover Vínculo
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
