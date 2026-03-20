// Script para diagnosticar o problema real das etiquetas
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ltdkdeqxcgtuncgzsowt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0ZGtkZXF4Y2d0dW5jZ3pzb3d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcwODc2MTYsImV4cCI6MjA1MjY2MzYxNn0.t3bforHO5Y1jRt5ygCkdlhvAGc1WV9TNTLV7yruQMn0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnosticarProblemaReal() {
  console.log('🔍 DIAGNÓSTICO DO PROBLEMA REAL DAS ETIQUETAS');
  console.log('==============================================\n');

  try {
    // 1. BUSCAR LEADS QUE NÃO EXIBEM ETIQUETAS
    console.log('1. 🔍 Buscando leads que podem ter problemas...');
    
    // Buscar leads com etiquetas de diferentes clientes
    const { data: leadsComEtiquetas, error: leadsError } = await supabase
      .from('leads')
      .select('id, nome, id_etiquetas, id_cliente')
      .not('id_etiquetas', 'is', null)
      .not('id_etiquetas', 'eq', '')
      .limit(50);

    if (leadsError) {
      console.error('❌ Erro ao buscar leads:', leadsError);
      return;
    }

    console.log(`📊 Analisando ${leadsComEtiquetas.length} leads com etiquetas\n`);

    // 2. ANALISAR CADA LEAD E VERIFICAR SE AS ETIQUETAS SERIAM ENCONTRADAS
    let leadsComProblemas = [];
    let leadsFuncionando = [];

    for (const lead of leadsComEtiquetas) {
      // Parsear IDs das etiquetas do lead
      const idsEtiquetasLead = lead.id_etiquetas
        .split(',')
        .map(id => id.trim())
        .filter(id => id !== '')
        .map(id => parseInt(id))
        .filter(id => !isNaN(id));

      // Buscar etiquetas disponíveis para este cliente (cliente + sistema)
      const { data: etiquetasDisponiveis, error: etiquetasError } = await supabase
        .from('etiquetas')
        .select('*')
        .or(`id_cliente.eq.${lead.id_cliente},id_cliente.is.null`);

      if (etiquetasError) {
        console.error(`❌ Erro ao buscar etiquetas para lead ${lead.id}:`, etiquetasError);
        continue;
      }

      // Verificar quais etiquetas do lead seriam encontradas
      const etiquetasEncontradas = etiquetasDisponiveis.filter(e => idsEtiquetasLead.includes(e.id));
      const idsNaoEncontrados = idsEtiquetasLead.filter(id => !etiquetasDisponiveis.find(e => e.id === id));

      if (idsNaoEncontrados.length > 0) {
        leadsComProblemas.push({
          lead,
          idsNaoEncontrados,
          etiquetasEncontradas,
          etiquetasDisponiveis
        });
      } else {
        leadsFuncionando.push({
          lead,
          etiquetasEncontradas
        });
      }
    }

    // 3. MOSTRAR RESULTADOS
    console.log(`📊 RESULTADOS:`);
    console.log(`   ✅ Leads funcionando: ${leadsFuncionando.length}`);
    console.log(`   ❌ Leads com problemas: ${leadsComProblemas.length}\n`);

    if (leadsComProblemas.length > 0) {
      console.log('❌ LEADS COM PROBLEMAS:');
      console.log('========================\n');

      for (const problema of leadsComProblemas) {
        const { lead, idsNaoEncontrados, etiquetasEncontradas, etiquetasDisponiveis } = problema;
        
        console.log(`🔍 LEAD: ${lead.nome} (ID: ${lead.id})`);
        console.log(`   Cliente: ${lead.id_cliente}`);
        console.log(`   id_etiquetas: "${lead.id_etiquetas}"`);
        console.log(`   IDs não encontrados: [${idsNaoEncontrados.join(', ')}]`);
        console.log(`   Etiquetas que seriam exibidas: ${etiquetasEncontradas.length}`);
        
        if (etiquetasEncontradas.length > 0) {
          etiquetasEncontradas.forEach(e => {
            console.log(`      - "${e.nome}" (ID: ${e.id}) [Cliente: ${e.id_cliente || 'Sistema'}]`);
          });
        }

        // Investigar onde estão os IDs não encontrados
        console.log(`   🔍 Investigando IDs não encontrados:`);
        for (const idNaoEncontrado of idsNaoEncontrados) {
          const { data: etiquetaEncontrada, error: buscaError } = await supabase
            .from('etiquetas')
            .select('*')
            .eq('id', idNaoEncontrado)
            .single();

          if (buscaError) {
            console.log(`      - ID ${idNaoEncontrado}: NÃO EXISTE no banco`);
          } else {
            console.log(`      - ID ${idNaoEncontrado}: "${etiquetaEncontrada.nome}" [Cliente: ${etiquetaEncontrada.id_cliente || 'Sistema'}]`);
            if (etiquetaEncontrada.id_cliente !== lead.id_cliente && etiquetaEncontrada.id_cliente !== null) {
              console.log(`        ⚠️ PROBLEMA: Esta etiqueta pertence ao cliente ${etiquetaEncontrada.id_cliente}, mas o lead é do cliente ${lead.id_cliente}`);
            }
          }
        }
        console.log('');
      }
    }

    // 4. ANALISAR PADRÕES DOS PROBLEMAS
    if (leadsComProblemas.length > 0) {
      console.log('📊 ANÁLISE DOS PADRÕES:');
      console.log('=======================\n');

      // Contar problemas por tipo
      let etiquetasInexistentes = 0;
      let etiquetasDeOutrosClientes = 0;
      let outrosProblemas = 0;

      for (const problema of leadsComProblemas) {
        for (const idNaoEncontrado of problema.idsNaoEncontrados) {
          const { data: etiquetaEncontrada } = await supabase
            .from('etiquetas')
            .select('*')
            .eq('id', idNaoEncontrado)
            .single();

          if (!etiquetaEncontrada) {
            etiquetasInexistentes++;
          } else if (etiquetaEncontrada.id_cliente !== problema.lead.id_cliente && etiquetaEncontrada.id_cliente !== null) {
            etiquetasDeOutrosClientes++;
          } else {
            outrosProblemas++;
          }
        }
      }

      console.log(`   Etiquetas inexistentes: ${etiquetasInexistentes}`);
      console.log(`   Etiquetas de outros clientes: ${etiquetasDeOutrosClientes}`);
      console.log(`   Outros problemas: ${outrosProblemas}\n`);

      // 5. SUGESTÕES DE CORREÇÃO
      console.log('💡 SUGESTÕES DE CORREÇÃO:');
      console.log('=========================\n');

      if (etiquetasInexistentes > 0) {
        console.log('🔧 PROBLEMA 1: Etiquetas inexistentes');
        console.log('   - Algumas etiquetas foram removidas do banco');
        console.log('   - Mas os leads ainda referenciam seus IDs');
        console.log('   - SOLUÇÃO: Limpar IDs órfãos dos leads\n');
      }

      if (etiquetasDeOutrosClientes > 0) {
        console.log('🔧 PROBLEMA 2: Etiquetas de outros clientes');
        console.log('   - Leads estão usando IDs de etiquetas de outros clientes');
        console.log('   - Isso pode acontecer por migração de dados ou erro');
        console.log('   - SOLUÇÃO: Atualizar leads para usar etiquetas do próprio cliente\n');
      }

      // 6. CRIAR SCRIPT DE CORREÇÃO ESPECÍFICO
      console.log('📝 SCRIPT DE CORREÇÃO NECESSÁRIO:');
      console.log('=================================\n');

      if (etiquetasInexistentes > 0) {
        console.log('-- Limpar IDs órfãos (etiquetas inexistentes)');
        console.log('-- Execute: limparTodasEtiquetasOrfas() para cada cliente\n');
      }

      if (etiquetasDeOutrosClientes > 0) {
        console.log('-- Corrigir leads que usam etiquetas de outros clientes');
        console.log('-- Mapear etiquetas por nome e atualizar IDs nos leads\n');
      }
    } else {
      console.log('✅ NENHUM PROBLEMA ENCONTRADO!');
      console.log('Todos os leads estão funcionando corretamente.');
      console.log('O problema pode estar em outro lugar (frontend, cache, etc.)');
    }

    // 7. TESTAR FUNÇÃO DO FRONTEND
    console.log('\n7. 🎨 Testando lógica do frontend...');
    
    // Simular a lógica do EtiquetasDisplay
    let leadsQueExibiriamEtiquetas = 0;
    let leadsQueNaoExibiriamEtiquetas = 0;

    for (const lead of leadsComEtiquetas.slice(0, 10)) { // Testar apenas os primeiros 10
      const ids = lead.id_etiquetas
        .split(',')
        .map(id => id.trim())
        .filter(id => id !== '')
        .map(id => parseInt(id))
        .filter(id => !isNaN(id));

      const { data: todasEtiquetas } = await supabase
        .from('etiquetas')
        .select('*')
        .or(`id_cliente.eq.${lead.id_cliente},id_cliente.is.null`);

      const etiquetasDoLead = todasEtiquetas.filter(etiqueta => ids.includes(etiqueta.id));

      if (etiquetasDoLead.length > 0) {
        leadsQueExibiriamEtiquetas++;
      } else {
        leadsQueNaoExibiriamEtiquetas++;
        console.log(`   ❌ ${lead.nome}: Nenhuma etiqueta seria exibida`);
      }
    }

    console.log(`\n📊 SIMULAÇÃO DO FRONTEND:`);
    console.log(`   Leads que exibiriam etiquetas: ${leadsQueExibiriamEtiquetas}`);
    console.log(`   Leads que NÃO exibiriam etiquetas: ${leadsQueNaoExibiriamEtiquetas}`);

    console.log('\n✅ Diagnóstico concluído!');

  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error);
  }
}

// Executar diagnóstico
diagnosticarProblemaReal();
