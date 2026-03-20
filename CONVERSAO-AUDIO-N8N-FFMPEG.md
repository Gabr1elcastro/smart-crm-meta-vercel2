# 🎵 Conversão Automática de Áudio OGG → MP3 no n8n

## 🎯 Objetivo
Converter automaticamente áudios OGG recebidos do WhatsApp para MP3 antes de salvar no Supabase.

## 🛠️ Pré-requisitos

### 1. FFmpeg instalado no servidor n8n
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install ffmpeg

# CentOS/RHEL
sudo yum install ffmpeg

# Docker (adicionar ao Dockerfile do n8n)
RUN apt-get update && apt-get install -y ffmpeg
```

### 2. Verificar instalação
```bash
ffmpeg -version
```

## 📋 Fluxo n8n Completo

### 🔄 Workflow de Conversão

```json
{
  "name": "WhatsApp Audio OGG to MP3 Converter",
  "nodes": [
    {
      "name": "Webhook Evolution",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300],
      "webhookId": "evolution-audio",
      "parameters": {
        "path": "evolution-audio",
        "responseMode": "onReceived",
        "options": {}
      }
    },
    {
      "name": "Filter Audio Messages",
      "type": "n8n-nodes-base.if",
      "position": [450, 300],
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{$json.message.type}}",
              "operation": "equals",
              "value2": "audio"
            }
          ]
        }
      }
    },
    {
      "name": "Download Audio OGG",
      "type": "n8n-nodes-base.httpRequest",
      "position": [650, 300],
      "parameters": {
        "url": "={{$json.message.audioUrl}}",
        "responseFormat": "file",
        "options": {
          "response": {
            "response": {
              "responseFormat": "file"
            }
          }
        }
      }
    },
    {
      "name": "Convert OGG to MP3",
      "type": "n8n-nodes-base.executeCommand",
      "position": [850, 300],
      "parameters": {
        "command": "ffmpeg -i {{$binary.data.fileName}} -acodec libmp3lame -ab 128k -ar 44100 output.mp3"
      }
    },
    {
      "name": "Upload MP3 to Supabase",
      "type": "n8n-nodes-base.httpRequest",
      "position": [1050, 300],
      "parameters": {
        "method": "POST",
        "url": "https://your-project.supabase.co/storage/v1/object/audioswpp",
        "sendBinaryData": true,
        "binaryPropertyName": "data",
        "options": {
          "bodyContentType": "multipart-form-data"
        },
        "headerParametersUi": {
          "parameter": [
            {
              "name": "Authorization",
              "value": "Bearer YOUR_SUPABASE_ANON_KEY"
            }
          ]
        }
      }
    }
  ]
}
```

## 🔧 Nó de Conversão FFmpeg Detalhado

### Opção 1: Execute Command Node
```javascript
// No nó "Execute Command"
{
  "name": "Convert Audio to MP3",
  "type": "n8n-nodes-base.executeCommand",
  "parameters": {
    "command": "ffmpeg",
    "arguments": "-i {{$binary.data.fileName}} -acodec libmp3lame -ab 128k -ar 44100 -y /tmp/{{$json.messageId}}.mp3"
  }
}
```

### Opção 2: Function Node com Child Process
```javascript
// No nó "Function"
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

// Gerar nomes únicos
const inputFile = `/tmp/input_${Date.now()}.ogg`;
const outputFile = `/tmp/output_${Date.now()}.mp3`;

// Salvar arquivo OGG temporariamente
await fs.writeFile(inputFile, Buffer.from($binary.data.data, 'base64'));

// Executar conversão FFmpeg
await new Promise((resolve, reject) => {
  const ffmpegCommand = `ffmpeg -i "${inputFile}" -acodec libmp3lame -ab 128k -ar 44100 -y "${outputFile}"`;
  
  exec(ffmpegCommand, (error, stdout, stderr) => {
    if (error) {
      console.error('FFmpeg error:', stderr);
      reject(error);
      return;
    }
    console.log('FFmpeg output:', stdout);
    resolve();
  });
});

// Ler arquivo MP3 convertido
const mp3Buffer = await fs.readFile(outputFile);

// Limpar arquivos temporários
await fs.unlink(inputFile);
await fs.unlink(outputFile);

// Retornar MP3 como binary data
return {
  binary: {
    data: {
      data: mp3Buffer.toString('base64'),
      mimeType: 'audio/mpeg',
      fileName: `audio_${Date.now()}.mp3`
    }
  },
  json: {
    originalFormat: 'ogg',
    convertedFormat: 'mp3',
    fileSize: mp3Buffer.length
  }
};
```

## 📝 Parâmetros FFmpeg Recomendados

### Conversão Básica
```bash
ffmpeg -i input.ogg -acodec libmp3lame output.mp3
```

### Conversão Otimizada para WhatsApp
```bash
ffmpeg -i input.ogg \
  -acodec libmp3lame \    # Codec MP3
  -ab 128k \              # Bitrate 128 kbps (boa qualidade)
  -ar 44100 \             # Sample rate 44.1 kHz
  -ac 1 \                 # Mono (economiza espaço)
  -f mp3 \                # Formato MP3
  output.mp3
```

### Conversão com Metadados
```bash
ffmpeg -i input.ogg \
  -acodec libmp3lame \
  -ab 128k \
  -metadata title="Audio WhatsApp" \
  -metadata artist="Cliente" \
  -metadata date="2024" \
  output.mp3
```

## 🚀 Workflow Completo n8n

```javascript
// 1. Webhook recebe mensagem
// 2. Verifica se é áudio
// 3. Baixa OGG da Evolution API
// 4. Converte OGG → MP3
// 5. Upload MP3 para Supabase
// 6. Salva URL no banco

// Function Node Completo
const { exec } = require('child_process');
const fs = require('fs').promises;
const crypto = require('crypto');

async function convertAudioToMp3() {
  try {
    // Gerar ID único
    const uniqueId = crypto.randomBytes(16).toString('hex');
    const inputPath = `/tmp/${uniqueId}_input.ogg`;
    const outputPath = `/tmp/${uniqueId}_output.mp3`;
    
    // Salvar OGG recebido
    const binaryData = $binary.data;
    await fs.writeFile(inputPath, Buffer.from(binaryData.data, 'base64'));
    
    // Comando FFmpeg
    const ffmpegCmd = [
      'ffmpeg',
      '-i', inputPath,
      '-acodec', 'libmp3lame',
      '-ab', '128k',
      '-ar', '44100',
      '-y',
      outputPath
    ].join(' ');
    
    // Executar conversão
    await new Promise((resolve, reject) => {
      exec(ffmpegCmd, (error, stdout, stderr) => {
        if (error) {
          console.error('FFmpeg stderr:', stderr);
          reject(new Error(`FFmpeg failed: ${error.message}`));
        } else {
          console.log('Conversão concluída com sucesso');
          resolve();
        }
      });
    });
    
    // Ler MP3 convertido
    const mp3Buffer = await fs.readFile(outputPath);
    
    // Limpar arquivos temporários
    await Promise.all([
      fs.unlink(inputPath).catch(() => {}),
      fs.unlink(outputPath).catch(() => {})
    ]);
    
    // Retornar dados para próximo nó
    return {
      binary: {
        data: {
          data: mp3Buffer.toString('base64'),
          mimeType: 'audio/mpeg',
          fileName: `audio_${Date.now()}.mp3`,
          fileExtension: 'mp3'
        }
      },
      json: {
        success: true,
        originalSize: binaryData.fileSize,
        convertedSize: mp3Buffer.length,
        compressionRatio: ((1 - mp3Buffer.length / binaryData.fileSize) * 100).toFixed(2) + '%'
      }
    };
    
  } catch (error) {
    throw new Error(`Erro na conversão: ${error.message}`);
  }
}

return await convertAudioToMp3();
```

## 🔍 Debugging e Logs

### Adicionar logs detalhados
```javascript
// No Function Node
console.log('Iniciando conversão de áudio...');
console.log('Arquivo original:', $binary.data.fileName);
console.log('Tamanho original:', $binary.data.fileSize);

// Após conversão
console.log('Conversão concluída!');
console.log('Tamanho MP3:', mp3Buffer.length);
console.log('Taxa de compressão:', compressionRatio);
```

## ⚡ Otimizações

### 1. Conversão em Batch
```bash
# Converter múltiplos arquivos
for file in *.ogg; do
  ffmpeg -i "$file" -acodec libmp3lame "${file%.ogg}.mp3"
done
```

### 2. Conversão Paralela
```javascript
// Usar Promise.all para converter múltiplos arquivos
const conversions = audioFiles.map(file => convertToMp3(file));
await Promise.all(conversions);
```

### 3. Cache de Conversões
```javascript
// Verificar se já foi convertido antes
const cacheKey = crypto.createHash('md5').update(audioUrl).digest('hex');
const cachedMp3 = await checkCache(cacheKey);
if (cachedMp3) return cachedMp3;
```

## 🎯 Resultado Final

1. **Áudios OGG** do WhatsApp são automaticamente convertidos para **MP3**
2. **MP3** é salvo no Supabase
3. **URL do MP3** é salva no banco de dados
4. **Frontend** reproduz MP3 sem problemas
5. **Zero erros** de formato não suportado

## 📱 Teste no Frontend

Após implementar, o AudioPlayer.tsx funcionará perfeitamente:
- Detectará formato MP3
- Reproduzirá sem erros
- Mostrará duração correta
- Funcionará em todos os navegadores

## 🆘 Troubleshooting

### FFmpeg não encontrado
```bash
# Verificar PATH
which ffmpeg

# Adicionar ao PATH se necessário
export PATH=$PATH:/usr/local/bin
```

### Erro de permissão
```bash
# Dar permissão de execução
chmod +x /usr/bin/ffmpeg

# Verificar permissões do diretório tmp
chmod 777 /tmp
```

### Memória insuficiente
```javascript
// Limitar uso de memória do FFmpeg
const ffmpegCmd = 'ffmpeg -i input.ogg -threads 1 -preset fast output.mp3';
``` 