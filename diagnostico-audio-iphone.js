// Script de Diagnóstico - Erro de Áudio no iPhone APÓS implementação M4A
// Execute no console do navegador

console.log('🔍 Diagnóstico: Erro de áudio no iPhone após implementação M4A...');

// Função para verificar se o AudioRecorderM4A está ativo
function verificarAudioRecorderM4A() {
  console.log('📱 Verificando se AudioRecorderM4A está ativo...');
  
  // Verificar se o componente está sendo usado
  const audioRecorder = document.querySelector('[data-testid="audio-recorder-m4a"]');
  if (audioRecorder) {
    console.log('✅ AudioRecorderM4A encontrado na página');
  } else {
    console.log('❌ AudioRecorderM4A NÃO encontrado na página');
    console.log('⚠️ Pode estar usando o componente antigo');
  }
  
  // Verificar se há botão "Gravar M4A"
  const botaoM4A = Array.from(document.querySelectorAll('button')).find(btn => 
    btn.textContent?.includes('Gravar M4A')
  );
  
  if (botaoM4A) {
    console.log('✅ Botão "Gravar M4A" encontrado');
  } else {
    console.log('❌ Botão "Gravar M4A" NÃO encontrado');
    console.log('🔍 Botões de áudio disponíveis:');
    Array.from(document.querySelectorAll('button')).forEach(btn => {
      if (btn.textContent?.includes('Gravar') || btn.textContent?.includes('Mic')) {
        console.log(`  - ${btn.textContent}`);
      }
    });
  }
}

// Função para verificar áudios recentes
function verificarAudiosRecentes() {
  console.log('🎵 Verificando áudios recentes...');
  
  // Verificar se há elementos de áudio na página
  const audios = document.querySelectorAll('audio');
  console.log(`📊 Áudios encontrados na página: ${audios.length}`);
  
  audios.forEach((audio, index) => {
    console.log(`🎵 Áudio ${index + 1}:`);
    console.log(`  - Src: ${audio.src}`);
    console.log(`  - Type: ${audio.type || 'Não especificado'}`);
    console.log(`  - Duration: ${audio.duration || 'Não carregado'}`);
    
    // Verificar se é um áudio M4A
    if (audio.src.includes('.m4a') || audio.src.includes('audio/mp4')) {
      console.log(`  ✅ Formato M4A detectado`);
    } else {
      console.log(`  ⚠️ Formato não-M4A: ${audio.src}`);
    }
  });
}

// Função para verificar logs de áudio
function verificarLogsAudio() {
  console.log('📋 Verificando logs de áudio...');
  
  // Verificar se há logs relacionados ao M4A
  const logs = console.log;
  console.log('🔍 Para verificar logs M4A, grave um áudio e observe:');
  console.log('  - "🎤 Iniciando gravação de áudio otimizada para iPhone (M4A)"');
  console.log('  - "✅ Formato selecionado: audio/mp4"');
  console.log('  - "📱 Compatibilidade iPhone: ✅ NATIVO"');
  console.log('  - "✅ Conversão para M4A concluída"');
}

// Função para verificar formato de áudio sendo enviado
function verificarFormatoEnvio() {
  console.log('📤 Verificando formato de áudio sendo enviado...');
  
  // Verificar se há função handleSendAudio
  if (typeof window.handleSendAudio === 'function') {
    console.log('✅ Função handleSendAudio encontrada');
  } else {
    console.log('⚠️ Função handleSendAudio não encontrada');
  }
  
  // Verificar se há áudios sendo processados
  const audioElements = document.querySelectorAll('[data-audio-format]');
  if (audioElements.length > 0) {
    console.log('📊 Áudios com formato especificado:');
    audioElements.forEach(el => {
      console.log(`  - Formato: ${el.dataset.audioFormat}`);
    });
  } else {
    console.log('⚠️ Nenhum áudio com formato especificado encontrado');
  }
}

// Função para simular gravação e verificar formato
async function simularGravacaoM4A() {
  console.log('🎤 Simulando gravação para verificar formato...');
  
  try {
    // Verificar permissões
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100,
        channelCount: 1
      } 
    });
    
    console.log('✅ Permissão de microfone concedida');
    
    // Testar formatos disponíveis
    const formatos = ['audio/mp4', 'audio/aac', 'audio/webm;codecs=opus'];
    let formatoSelecionado = '';
    
    for (const formato of formatos) {
      if (MediaRecorder.isTypeSupported(formato)) {
        formatoSelecionado = formato;
        break;
      }
    }
    
    if (!formatoSelecionado) {
      throw new Error('Nenhum formato suportado');
    }
    
    console.log(`✅ Formato selecionado: ${formatoSelecionado}`);
    console.log(`📱 Compatibilidade iPhone: ${formatoSelecionado.includes('mp4') || formatoSelecionado.includes('aac') ? '✅ NATIVO' : '⚠️ FALLBACK'}`);
    
    // Parar stream
    stream.getTracks().forEach(track => track.stop());
    console.log('🔇 Stream parado');
    
    return formatoSelecionado;
    
  } catch (error) {
    console.error('❌ Erro na simulação:', error);
    return null;
  }
}

// Função para verificar se há áudios antigos sendo enviados
function verificarAudiosAntigos() {
  console.log('🔍 Verificando se há áudios antigos sendo enviados...');
  
  // Verificar se há áudios com formato antigo
  const audiosAntigos = Array.from(document.querySelectorAll('audio')).filter(audio => {
    const src = audio.src.toLowerCase();
    return src.includes('.ogg') || src.includes('.webm') || src.includes('audio/ogg') || src.includes('audio/webm');
  });
  
  if (audiosAntigos.length > 0) {
    console.log('⚠️ ÁUDIOS ANTIGOS DETECTADOS (formato não-M4A):');
    audiosAntigos.forEach((audio, index) => {
      console.log(`  ${index + 1}. Src: ${audio.src}`);
      console.log(`     Formato: ${audio.type || 'Não especificado'}`);
    });
    console.log('💡 Estes áudios podem estar causando o erro no iPhone!');
  } else {
    console.log('✅ Nenhum áudio antigo detectado');
  }
}

// Função principal de diagnóstico
async function executarDiagnosticoCompleto() {
  console.log('🚀 Iniciando diagnóstico completo...');
  
  // 1. Verificar se o componente M4A está ativo
  verificarAudioRecorderM4A();
  
  // 2. Verificar áudios recentes
  verificarAudiosRecentes();
  
  // 3. Verificar logs
  verificarLogsAudio();
  
  // 4. Verificar formato de envio
  verificarFormatoEnvio();
  
  // 5. Simular gravação
  const formato = await simularGravacaoM4A();
  
  // 6. Verificar áudios antigos
  verificarAudiosAntigos();
  
  // 7. Análise final
  console.log('\n🔍 ANÁLISE FINAL:');
  
  if (formato && (formato.includes('mp4') || formato.includes('aac'))) {
    console.log('✅ Formato M4A/AAC suportado pelo navegador');
  } else {
    console.log('⚠️ Formato M4A/AAC NÃO suportado - usando fallback');
  }
  
  console.log('\n💡 POSSÍVEIS CAUSAS DO ERRO:');
  console.log('1. Componente M4A não está sendo usado');
  console.log('2. Áudios antigos ainda estão sendo enviados');
  console.log('3. Conversão para M4A não está funcionando');
  console.log('4. Cache de áudios antigos');
  console.log('5. Problema na integração do componente');
  
  console.log('\n🎯 PRÓXIMOS PASSOS:');
  console.log('1. Verificar se o botão "Gravar M4A" aparece');
  console.log('2. Gravar um novo áudio e verificar logs');
  console.log('3. Verificar se o formato final é M4A');
  console.log('4. Testar no iPhone com áudio novo');
}

// Expor funções
window.verificarAudioRecorderM4A = verificarAudioRecorderM4A;
window.verificarAudiosRecentes = verificarAudiosRecentes;
window.verificarLogsAudio = verificarLogsAudio;
window.verificarFormatoEnvio = verificarFormatoEnvio;
window.simularGravacaoM4A = simularGravacaoM4A;
window.verificarAudiosAntigos = verificarAudiosAntigos;
window.executarDiagnosticoCompleto = executarDiagnosticoCompleto;

console.log('📚 Funções disponíveis:');
console.log('- verificarAudioRecorderM4A()');
console.log('- verificarAudiosRecentes()');
console.log('- verificarLogsAudio()');
console.log('- verificarFormatoEnvio()');
console.log('- simularGravacaoM4A()');
console.log('- verificarAudiosAntigos()');
console.log('- executarDiagnosticoCompleto()');

console.log('🎯 Para diagnóstico completo, execute: executarDiagnosticoCompleto()');

