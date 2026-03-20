import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, RefreshCw } from 'lucide-react';
import WhatsAppConnect from '@/components/whatsapp/WhatsAppConnect';
import WhatsAppConnectChip from '@/components/whatsapp/WhatsAppConnectChip';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';

const chips = [
  { id: 1, label: 'Chip 1' },
  { id: 2, label: 'Chip 2' },
];

export default function MeusChips() {
  const { user } = useAuth();
  const [hasProOrPlusPlan, setHasProOrPlusPlan] = useState(false);
  const [loading, setLoading] = useState(true);

  // Verificar se o usuário tem plano Pro ou Plus
  useEffect(() => {
    async function checkUserPlan() {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('clientes_info')
          .select('plano_pro, plano_plus')
          .eq('email', user.email)
          .single();

        if (error) {
          console.error('Erro ao verificar plano do usuário:', error);
          setHasProOrPlusPlan(false);
        } else {
          // Verificar se o usuário tem plano Pro ou Plus
          const hasPro = data?.plano_pro === true;
          const hasPlus = data?.plano_plus === true;
          setHasProOrPlusPlan(hasPro || hasPlus);
          
          console.log('Plano do usuário:', {
            email: user.email,
            plano_pro: data?.plano_pro,
            plano_plus: data?.plano_plus,
            hasProOrPlusPlan: hasPro || hasPlus
          });
        }
      } catch (error) {
        console.error('Erro ao verificar plano:', error);
        setHasProOrPlusPlan(false);
      } finally {
        setLoading(false);
      }
    }

    checkUserPlan();
  }, [user?.email]);

  useEffect(() => {
    async function logUserInstances() {
      const { data: userData } = await supabase.auth.getUser();
      const userEmail = userData?.user?.email || localStorage.getItem('user_email');
      if (!userEmail) {
        console.log('[CHIPS] Usuário não autenticado.');
        return;
      }
      const { data, error } = await supabase
        .from('clientes_info')
        .select('instance_id, instance_name, instance_id_2, instance_name_2')
        .eq('email', userEmail)
        .single();
      if (error) {
        console.log('[CHIPS] Erro ao buscar instâncias:', error);
        return;
      }
      const chips = [];
      if (data?.instance_id && data?.instance_name) {
        chips.push({ chip: 1, id: data.instance_id, name: data.instance_name });
      }
      if (data?.instance_id_2 && data?.instance_name_2) {
        chips.push({ chip: 2, id: data.instance_id_2, name: data.instance_name_2 });
      }
      if (chips.length === 0) {
        console.log('🟡 [CHIPS] Nenhuma instância encontrada para o usuário.');
      } else {
        console.log('==============================');
        console.log('🟢 [CHIPS] Instâncias encontradas:');
        console.table(chips);
        console.log('==============================');
      }
    }
    logUserInstances();
  }, []);

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-6 pr-2"
        style={{ maxHeight: '70vh', overflowY: 'auto' }}
      >
        <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-4 border border-primary-100">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-primary-600 bg-primary-100 rounded px-2 py-1">
              Chip 1
            </span>
          </div>
          <WhatsAppConnect />
        </div>
        
        {/* Card do Chip 2 - apenas para usuários com plano Pro ou Plus */}
        {hasProOrPlusPlan && (
          <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-4 border border-primary-100">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-primary-600 bg-primary-100 rounded px-2 py-1">
                Chip 2
              </span>
            </div>
            <WhatsAppConnectChip
              instanceIdField="instance_id_2"
              instanceNameField="instance_name_2"
              senderNumberField="sender_number_2"
              atendimentoHumanoField="atendimento_humano_2"
              atendimentoIAField="atendimento_ia_2"
              chipNumber={2}
              label="Chip 2"
            />
          </div>
        )}
      </div>
    </div>
  );
} 