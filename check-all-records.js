// Script para verificar todos os registros na tabela, ignorando o RLS
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { resolve } from 'path';

// Configuração inicial
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '.env') });

// Obtenha as credenciais do arquivo .env
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
// Service role key seria melhor para usar, mas usaremos o anon key

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: Variáveis de ambiente VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não definidas');
  process.exit(1);
}

// Inicializa o cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllRecords() {
  try {
    console.log('Verificando todos os registros na tabela...');
    
    // Vamos tentar obter pelo menos alguns registros
    const { data, error, count } = await supabase.rpc('check_all_records');
    
    if (error) {
      console.error('Erro ao chamar função RPC:', error);
      
      // Abordagem alternativa: consulta direta
      console.log('Tentando abordagem alternativa...');
      
      // Fazer login primeiro para ter uma sessão
      const email = 'bbf.materiais@gmail.com';
      const password = '123456'; // Use a senha que você forneceu anteriormente
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (authError) {
        console.error('Erro ao autenticar:', authError);
        return;
      }
      
      console.log('Autenticado com sucesso!');
      
      // Agora vamos tentar consultar a tabela diretamente
      const { data: directData, error: directError } = await supabase
        .from('agente_conversacional_whatsapp')
        .select('id, user_id_auth, created_at')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (directError) {
        console.error('Erro ao consultar diretamente:', directError);
        return;
      }
      
      if (!directData || directData.length === 0) {
        console.log('Nenhum registro encontrado.');
        return;
      }
      
      // Contar ocorrências de cada user_id_auth
      const userIdCounts = {};
      directData.forEach(record => {
        const userId = record.user_id_auth || 'null';
        userIdCounts[userId] = (userIdCounts[userId] || 0) + 1;
      });
      
      console.log('\nDistribuição de user_id_auth:');
      Object.entries(userIdCounts).forEach(([userId, count]) => {
        console.log(`${userId}: ${count} registros`);
      });
      
      // Verificar o tipo de dados da coluna user_id_auth em alguns registros
      console.log('\nAmostra de registros:');
      directData.slice(0, 5).forEach(record => {
        console.log(`ID: ${record.id}, user_id_auth: ${record.user_id_auth} (${typeof record.user_id_auth})`);
      });
      
      // Recomendar ação com base nos resultados
      if (Object.keys(userIdCounts).length > 1) {
        console.log('\n⚠️ Há múltiplos valores diferentes para user_id_auth. Você deve normalizar para o ID correto.');
      }
      
      const correctUserId = '2694a691-d3fc-46a0-aece-eb704e549c89'; // ID correto do bbf.materiais@gmail.com
      if (userIdCounts[correctUserId]) {
        console.log(`\n✅ ${userIdCounts[correctUserId]} registros já têm o ID correto.`);
      } else {
        console.log('\n⚠️ Nenhum registro tem o ID correto! Você deve atualizar todos os registros.');
      }
      
      return;
    }
    
    // Se a função RPC retornou com sucesso (menos provável sem service role key)
    console.log('Total de registros:', count);
    
    if (!data || data.length === 0) {
      console.log('Nenhum registro retornado pela função.');
      return;
    }
    
    // Mostrar dados retornados pela função RPC
    console.log('Dados retornados pela função:');
    console.log(data);
    
  } catch (error) {
    console.error('Erro durante a verificação:', error);
  }
}

// Executa a verificação
checkAllRecords(); 