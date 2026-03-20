// Script de teste atualizado para verificar a funcionalidade de transcrição de áudio
// Execute este script no console do navegador na página de Conversas

console.log('🎵 Iniciando teste de transcrição de áudio (versão atualizada)...');

// Função para verificar se há mensagens duplicadas
function verificarDuplicatas() {
  try {
    console.log('🔍 Verificando mensagens duplicadas...');

    // 1. Verificar se há mensagens de áudio na página
    const mensagensAudio = document.querySelectorAll('[data-message-type="audio"]');
    console.log(`📊 Encontradas ${mensagensAudio.length} mensagens de áudio`);

    // 2. Verificar se há elementos de transcrição
    const elementosTranscricao = document.querySelectorAll('.text-sm.bg-gray-50.rounded-lg');
    console.log(`📝 Encontrados ${elementosTranscricao.length} elementos de transcrição`);

    // 3. Verificar se há texto de transcrição
    const textosTranscricao = document.querySelectorAll('.text-sm.bg-gray-50.rounded-lg p:last-child');
    console.log(`📄 Encontrados ${textosTranscricao.length} textos de transcrição`);

    // 4. Verificar estrutura das mensagens de áudio
    const playersAudio = document.querySelectorAll('audio');
    console.log(`🎤 Encontrados ${playersAudio.length} players de áudio`);

    // 5. Verificar se a interface está correta
    const containersAudio = document.querySelectorAll('.space-y-2');
    console.log(`📦 Encontrados ${containersAudio.length} containers de áudio`);

    // 6. Verificar se há ícones de transcrição
    const iconesTranscricao = document.querySelectorAll('.text-sm.bg-gray-50.rounded-lg span:first-child');
    const iconesComEmoji = Array.from(iconesTranscricao).filter(span => 
      span.textContent.includes('📝')
    );
    console.log(`📝 Encontrados ${iconesComEmoji.length} ícones de transcrição`);

    // 7. Verificar se há labels "Transcrição:"
    const labelsTranscricao = document.querySelectorAll('.text-sm.bg-gray-50.rounded-lg .font-medium');
    const labelsCorretos = Array.from(labelsTranscricao).filter(label => 
      label.textContent === 'Transcrição:'
    );
    console.log(`🏷️ Encontrados ${labelsCorretos.length} labels "Transcrição:"`);

    // 8. Verificar cores das bordas
    const bordasAzuis = document.querySelectorAll('.border-blue-400');
    const bordasCinzas = document.querySelectorAll('.border-gray-300');
    console.log(`🔵 Bordas azuis (mensagens enviadas): ${bordasAzuis.length}`);
    console.log(`⚫ Bordas cinzas (mensagens recebidas): ${bordasCinzas.length}`);

    // 9. Verificar se há duplicatas visuais
    const mensagensComTranscricao = document.querySelectorAll('.space-y-2');
    const mensagensSemTranscricao = document.querySelectorAll('audio:not(.space-y-2 audio)');
    
    console.log(`📦 Mensagens com container (áudio + transcrição): ${mensagensComTranscricao.length}`);
    console.log(`🎤 Players de áudio soltos: ${mensagensSemTranscricao.length}`);

    // 10. Verificar se há mensagens duplicadas pelo ID
    const mensagensIds = Array.from(document.querySelectorAll('[data-message-id]')).map(el => 
      el.getAttribute('data-message-id')
    );
    const idsUnicos = [...new Set(mensagensIds)];
    console.log(`🆔 IDs únicos de mensagens: ${idsUnicos.length}`);
    console.log(`🔄 Total de mensagens: ${mensagensIds.length}`);
    
    if (mensagensIds.length !== idsUnicos.length) {
      console.warn('⚠️ ATENÇÃO: Há mensagens duplicadas detectadas!');
    } else {
      console.log('✅ Não foram detectadas mensagens duplicadas');
    }

    console.log('✅ Teste de transcrição de áudio concluído!');

    // 11. Instruções para teste manual
    console.log('\n📋 INSTRUÇÕES PARA TESTE MANUAL:');
    console.log('1. Verifique se há mensagens de áudio nas conversas');
    console.log('2. Procure por mensagens que tenham transcrição abaixo do player');
    console.log('3. Verifique se a transcrição aparece em uma caixa cinza com borda');
    console.log('4. Verifique se há o ícone 📝 e o label "Transcrição:"');
    console.log('5. Verifique se as cores das bordas correspondem ao tipo de mensagem');
    console.log('6. Teste se a transcrição é legível e faz sentido');
    console.log('7. Verifique se NÃO há players de áudio duplicados');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Função para verificar dados no banco
function verificarDadosBanco() {
  console.log('🗄️ Para verificar dados no banco, execute no Supabase SQL Editor:');
  console.log(`
    -- Verificar mensagens de áudio com transcrição
    SELECT 
      id,
      mensagem,
      tipo_mensagem,
      url_arquivo,
      transcricao_audio,
      timestamp
    FROM agente_conversacional_whatsapp 
    WHERE tipo_mensagem = 'audio' 
    AND transcricao_audio IS NOT NULL
    ORDER BY created_at DESC
    LIMIT 5;
  `);
  
  console.log(`
    -- Verificar se há duplicatas
    SELECT 
      id,
      COUNT(*) as quantidade
    FROM agente_conversacional_whatsapp 
    WHERE tipo_mensagem = 'audio'
    GROUP BY id
    HAVING COUNT(*) > 1
    ORDER BY quantidade DESC;
  `);
}

// Função para limpar dados de teste
function limparDadosTeste() {
  console.log('🧹 Para limpar dados de teste, execute no Supabase SQL Editor:');
  console.log(`
    DELETE FROM agente_conversacional_whatsapp 
    WHERE conversa_id LIKE 'TESTE%' 
    AND tipo_mensagem = 'audio';
  `);
}

// Executar testes
console.log('🚀 Executando testes de transcrição de áudio (versão atualizada)...');
verificarDuplicatas();
verificarDadosBanco();
limparDadosTeste();

// Para testar inserção manual, use:
// verificarDuplicatas(); 