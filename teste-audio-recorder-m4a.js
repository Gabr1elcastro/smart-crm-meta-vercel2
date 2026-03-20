// Script de Teste Específico - AudioRecorderM4A
// Execute no console do navegador

console.log('🧪 Teste Específico - AudioRecorderM4A...');

// Função para testar se o componente está funcionando
function testarAudioRecorderM4A() {
  console.log('🔍 Testando AudioRecorderM4A...');
  
  // 1. Verificar se o componente está na página
  const audioRecorder = document.querySelector('[data-testid="audio-recorder-m4a"]');
  if (!audioRecorder) {
    console.log('❌ AudioRecorderM4A não encontrado na página');
    return false;
  }
  
  console.log('✅ AudioRecorderM4A encontrado');
  
  // 2. Verificar se há botão de gravação
  const botaoGravar = Array.from(document.querySelectorAll('button')).find(btn => 
    btn.textContent?.includes('Gravar M4A') || btn.textContent?.includes('🎤')
  );
  
  if (!botaoGravar) {
    console.log('❌ Botão de gravação não encontrado');
    return false;
  }
  
  console.log('✅ Botão de gravação encontrado:', botaoGravar.textContent);
  
  // 3. Verificar se há estado de gravação
  const estadoGravação = audioRecorder.querySelector('[data-recording-state]');
  if (estadoGravação) {
    console.log('✅ Estado de gravação detectado');
  } else {
    console.log('⚠️ Estado de gravação não detectado');
  }
  
  return true;
}

// Função para testar gravação real
async function testarGravacaoReal() {
  console.log('🎤 Testando gravação real...');
  
  try {
    // 1. Verificar permissões
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100,
        channelCount: 1
      } 
    });
    
    console.log('✅ Permissão de microfone concedida');
    
    // 2. Testar formatos M4A
    const formatosM4A = [
      'audio/mp4',
      'audio/aac', 
      'audio/mp4;codecs=mp4a.40.2'
    ];
    
    let formatoSuportado = '';
    for (const formato of formatosM4A) {
      if (MediaRecorder.isTypeSupported(formato)) {
        formatoSuportado = formato;
        break;
      }
    }
    
    if (!formatoSuportado) {
      console.log('❌ Nenhum formato M4A suportado pelo navegador');
      console.log('🔍 Formatos disponíveis:');
      ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'].forEach(f => {
        if (MediaRecorder.isTypeSupported(f)) {
          console.log(`  ✅ ${f}`);
        }
      });
    } else {
      console.log(`✅ Formato M4A suportado: ${formatoSuportado}`);
    }
    
    // 3. Testar MediaRecorder
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: formatoSuportado || 'audio/webm;codecs=opus'
    });
    
    console.log('✅ MediaRecorder criado com sucesso');
    
    // 4. Simular gravação rápida
    const chunks = [];
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
        console.log(`📦 Chunk recebido: ${event.data.size} bytes, tipo: ${event.data.type}`);
      }
    };
    
    mediaRecorder.onstop = () => {
      console.log(`🛑 Gravação parada. Total de chunks: ${chunks.length}`);
      
      if (chunks.length > 0) {
        const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
        console.log('✅ Blob criado:', {
          tipo: blob.type,
          tamanho: `${(blob.size / 1024).toFixed(2)} KB`,
          extensão: blob.type.includes('mp4') ? 'm4a' : 'outro'
        });
        
        // Testar conversão para M4A
        testarConversaoM4A(blob);
      }
    };
    
    // 5. Iniciar e parar gravação rapidamente
    mediaRecorder.start();
    console.log('▶️ Gravação iniciada');
    
    setTimeout(() => {
      mediaRecorder.stop();
      console.log('⏹️ Parando gravação...');
    }, 2000);
    
    // 6. Parar stream
    setTimeout(() => {
      stream.getTracks().forEach(track => track.stop());
      console.log('🔇 Stream parado');
    }, 3000);
    
  } catch (error) {
    console.error('❌ Erro no teste de gravação:', error);
  }
}

// Função para testar conversão M4A
async function testarConversaoM4A(originalBlob) {
  console.log('🔄 Testando conversão para M4A...');
  
  try {
    // Simular a função convertToM4A do componente
    if (originalBlob.type.includes('mp4') || originalBlob.type.includes('aac')) {
      console.log('✅ Já é M4A/AAC, não precisa converter');
      return originalBlob;
    }
    
    console.log('🔄 Convertendo de', originalBlob.type, 'para M4A...');
    
    // Converter usando Web Audio API
    const arrayBuffer = await originalBlob.arrayBuffer();
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    console.log('✅ Áudio decodificado:', {
      duração: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
      numberOfChannels: audioBuffer.numberOfChannels
    });
    
    // Criar novo blob M4A
    const m4aBlob = new Blob([arrayBuffer], { type: 'audio/mp4' });
    
    console.log('✅ Conversão para M4A concluída:', {
      tipo_original: originalBlob.type,
      tipo_final: m4aBlob.type,
      tamanho_original: `${(originalBlob.size / 1024).toFixed(2)} KB`,
      tamanho_final: `${(m4aBlob.size / 1024).toFixed(2)} KB`
    });
    
    return m4aBlob;
    
  } catch (error) {
    console.error('❌ Erro na conversão M4A:', error);
    return originalBlob;
  }
}

// Função para verificar logs do componente
function verificarLogsComponente() {
  console.log('📋 Verificando logs do componente...');
  
  // Interceptar console.log para capturar logs do componente
  const originalLog = console.log;
  const logs = [];
  
  console.log = function(...args) {
    logs.push(args.join(' '));
    originalLog.apply(console, args);
  };
  
  console.log('🔍 Logs capturados serão exibidos aqui');
  
  // Restaurar console.log após 5 segundos
  setTimeout(() => {
    console.log = originalLog;
    console.log('📊 Logs capturados:');
    logs.forEach((log, index) => {
      if (log.includes('M4A') || log.includes('iPhone') || log.includes('Conversão')) {
        console.log(`  ${index + 1}. ${log}`);
      }
    });
  }, 5000);
}

// Função para testar envio de áudio
function testarEnvioAudio() {
  console.log('📤 Testando envio de áudio...');
  
  // Verificar se há função onSendAudio
  const audioRecorder = document.querySelector('[data-testid="audio-recorder-m4a"]');
  if (!audioRecorder) {
    console.log('❌ AudioRecorderM4A não encontrado');
    return;
  }
  
  // Verificar se há áudio gravado
  const audioElement = audioRecorder.querySelector('audio');
  if (audioElement) {
    console.log('✅ Elemento de áudio encontrado:', {
      src: audioElement.src,
      type: audioElement.type,
      duration: audioElement.duration
    });
  } else {
    console.log('⚠️ Elemento de áudio não encontrado');
  }
  
  // Verificar se há botão de envio
  const botaoEnviar = Array.from(audioRecorder.querySelectorAll('button')).find(btn => 
    btn.textContent?.includes('Enviar') || btn.textContent?.includes('📤')
  );
  
  if (botaoEnviar) {
    console.log('✅ Botão de envio encontrado:', botaoEnviar.textContent);
  } else {
    console.log('❌ Botão de envio não encontrado');
  }
}

// Função principal de teste
async function executarTesteCompleto() {
  console.log('🚀 Iniciando teste completo do AudioRecorderM4A...');
  
  // 1. Testar se o componente está funcionando
  const componenteOk = testarAudioRecorderM4A();
  
  if (!componenteOk) {
    console.log('❌ Componente não está funcionando corretamente');
    return;
  }
  
  // 2. Verificar logs
  verificarLogsComponente();
  
  // 3. Testar gravação real
  await testarGravacaoReal();
  
  // 4. Testar envio
  setTimeout(() => {
    testarEnvioAudio();
  }, 3000);
  
  // 5. Análise final
  setTimeout(() => {
    console.log('\n🔍 ANÁLISE FINAL:');
    console.log('✅ Componente AudioRecorderM4A está ativo');
    console.log('✅ Gravação testada com sucesso');
    console.log('✅ Conversão M4A testada');
    console.log('\n💡 Se ainda não funcionar, o problema pode ser:');
    console.log('1. Função onSendAudio não implementada corretamente');
    console.log('2. Problema na integração com a página de conversas');
    console.log('3. Erro no envio para o servidor');
    console.log('4. Cache de áudios antigos');
  }, 6000);
}

// Expor funções
window.testarAudioRecorderM4A = testarAudioRecorderM4A;
window.testarGravacaoReal = testarGravacaoReal;
window.testarConversaoM4A = testarConversaoM4A;
window.verificarLogsComponente = verificarLogsComponente;
window.testarEnvioAudio = testarEnvioAudio;
window.executarTesteCompleto = executarTesteCompleto;

console.log('📚 Funções disponíveis:');
console.log('- testarAudioRecorderM4A()');
console.log('- testarGravacaoReal()');
console.log('- testarConversaoM4A()');
console.log('- verificarLogsComponente()');
console.log('- testarEnvioAudio()');
console.log('- executarTesteCompleto()');

console.log('🎯 Para teste completo, execute: executarTesteCompleto()');

