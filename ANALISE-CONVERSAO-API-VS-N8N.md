# 🎵 Análise: Conversão de Áudio - API Serverless vs n8n

## 📊 Comparação de Abordagens

### 🚀 Abordagem 1: API Serverless (Vercel/Netlify)
**Conversão sob demanda no frontend**

#### ✅ Vantagens:
- Não requer modificação no n8n
- Escala automaticamente
- Funciona independente do backend
- Fácil deploy com Vercel/Netlify
- Conversão apenas quando necessário

#### ❌ Desvantagens:
- Converte TODA VEZ que alguém acessar o áudio
- Limite de timeout (10s Vercel free, 26s Pro)
- Consume recursos serverless
- Latência adicional para o usuário
- Custos podem aumentar com uso

### 🔧 Abordagem 2: Conversão no n8n
**Conversão única ao receber mensagem**

#### ✅ Vantagens:
- Converte UMA VEZ e salva MP3
- Sem latência para usuários
- Já integrado ao fluxo existente
- Sem custos adicionais
- Arquivo MP3 pronto no storage

#### ❌ Desvantagens:
- Requer FFmpeg instalado no n8n
- Usa recursos do servidor n8n
- Precisa modificar workflow existente

## 🎯 Recomendação: HÍBRIDA

### **Melhor solução: Conversão no n8n (principal) + API de fallback**

1. **Prioridade 1**: Converter no n8n ao receber
2. **Fallback**: API para áudios antigos não convertidos

## 💻 Implementação da API Serverless Otimizada

### 1. Instalar dependências:
```bash
npm install fluent-ffmpeg @ffmpeg-installer/ffmpeg node-fetch
```

### 2. Criar `/api/convert-audio.js`:
```javascript
import fetch from 'node-fetch';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import { promises as fs } from 'fs';
import path from 'path';
import { tmpdir } from 'os';
import { v4 as uuid } from 'uuid';

// Configurar FFmpeg
ffmpeg.setFfmpegPath(ffmpegPath.path);

// Cache simples em memória (para Vercel)
const conversionCache = new Map();

export default async function handler(req, res) {
  // Habilitar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  
  const { audioUrl } = req.query || req.body;

  if (!audioUrl) {
    return res.status(400).json({ error: 'audioUrl é obrigatório' });
  }

  try {
    // Verificar cache
    const cacheKey = Buffer.from(audioUrl).toString('base64');
    if (conversionCache.has(cacheKey)) {
      console.log('🎯 Retornando do cache');
      const cachedMp3 = conversionCache.get(cacheKey);
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      return res.send(cachedMp3);
    }

    // Caminhos temporários
    const tempDir = tmpdir();
    const sessionId = uuid();
    const tempOgg = path.join(tempDir, `${sessionId}.ogg`);
    const tempMp3 = path.join(tempDir, `${sessionId}.mp3`);

    console.log(`📥 Baixando áudio: ${audioUrl}`);
    
    // 1. Baixar OGG com timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout
    
    const response = await fetch(audioUrl, { 
      signal: controller.signal,
      headers: {
        'User-Agent': 'WhatsApp-Audio-Converter/1.0'
      }
    });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(tempOgg, buffer);
    console.log(`✅ OGG baixado: ${buffer.length} bytes`);

    // 2. Converter com FFmpeg otimizado
    console.log('🔄 Convertendo OGG → MP3...');
    
    await new Promise((resolve, reject) => {
      const command = ffmpeg(tempOgg)
        .audioCodec('libmp3lame')
        .audioBitrate('128k')
        .audioFrequency(44100)
        .audioChannels(1) // Mono para economizar
        .format('mp3')
        .on('start', cmd => console.log('FFmpeg:', cmd))
        .on('progress', progress => {
          console.log(`Progresso: ${progress.percent?.toFixed(1)}%`);
        })
        .on('end', () => {
          console.log('✅ Conversão concluída');
          resolve();
        })
        .on('error', err => {
          console.error('❌ Erro FFmpeg:', err);
          reject(err);
        });

      // Timeout de segurança
      const ffmpegTimeout = setTimeout(() => {
        command.kill();
        reject(new Error('Timeout na conversão'));
      }, 9000); // 9s para conversão

      command.save(tempMp3);
      command.on('end', () => clearTimeout(ffmpegTimeout));
    });

    // 3. Ler MP3 e enviar
    const mp3Buffer = await fs.readFile(tempMp3);
    console.log(`✅ MP3 criado: ${mp3Buffer.length} bytes`);

    // Adicionar ao cache (máximo 10 itens)
    if (conversionCache.size > 10) {
      const firstKey = conversionCache.keys().next().value;
      conversionCache.delete(firstKey);
    }
    conversionCache.set(cacheKey, mp3Buffer);

    // 4. Retornar MP3
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', mp3Buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache 1 ano
    res.setHeader('Content-Disposition', `inline; filename="audio_${Date.now()}.mp3"`);
    res.send(mp3Buffer);

    // 5. Limpeza assíncrona
    setImmediate(async () => {
      try {
        await Promise.all([
          fs.unlink(tempOgg).catch(() => {}),
          fs.unlink(tempMp3).catch(() => {})
        ]);
      } catch (err) {
        console.warn('Erro na limpeza:', err);
      }
    });

  } catch (error) {
    console.error('❌ Erro na conversão:', error);
    
    // Retornar erro apropriado
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Timeout ao baixar áudio' });
    }
    
    if (error.message.includes('Timeout')) {
      return res.status(504).json({ error: 'Timeout na conversão' });
    }
    
    res.status(500).json({ 
      error: 'Erro ao converter áudio',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Para Vercel
export const config = {
  api: {
    responseLimit: '10mb',
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};
```

### 3. Configurar `vercel.json`:
```json
{
  "functions": {
    "api/convert-audio.js": {
      "maxDuration": 10
    }
  },
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ]
}
```

## 🎭 Implementação no Frontend (AudioPlayer.tsx)

```typescript
// Adicionar no AudioPlayer.tsx
const getAudioUrl = async (originalUrl: string): Promise<string> => {
  const format = getAudioFormat(originalUrl);
  
  // Se já é MP3, usar direto
  if (format === 'mp3') {
    return originalUrl;
  }
  
  // Se é OGG, tentar converter via API
  if (format === 'ogg') {
    try {
      // Verificar se existe MP3 no storage primeiro
      const mp3Url = originalUrl.replace('.ogg', '.mp3');
      const checkResponse = await fetch(mp3Url, { method: 'HEAD' });
      
      if (checkResponse.ok) {
        console.log('✅ MP3 já existe no storage');
        return mp3Url;
      }
      
      // Se não existe, converter via API
      console.log('🔄 Convertendo via API...');
      const apiUrl = `/api/convert-audio?audioUrl=${encodeURIComponent(originalUrl)}`;
      
      // Criar blob URL da conversão
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('Conversão falhou');
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      // Cleanup quando componente desmontar
      setTimeout(() => URL.revokeObjectURL(blobUrl), 300000); // 5 min
      
      return blobUrl;
      
    } catch (error) {
      console.error('❌ Erro na conversão:', error);
      throw error;
    }
  }
  
  return originalUrl;
};
```

## 🚀 Deploy

### Vercel:
```bash
vercel --prod
```

### Netlify:
```bash
netlify deploy --prod
```

## 📊 Análise de Custos

### Vercel (Free):
- 100GB bandwidth/mês
- 100k requests/mês
- Timeout: 10s

### Cálculo estimado:
- Áudio médio: 100KB OGG → 80KB MP3
- 1000 conversões = ~180MB bandwidth
- Custo: **GRÁTIS** até 100GB

## 🎯 Conclusão

### Recomendo implementar AMBAS:

1. **n8n (Principal)**: Converter ao receber do WhatsApp
   - ✅ Eficiente
   - ✅ Uma conversão só
   - ✅ MP3 salvo permanentemente

2. **API (Fallback)**: Para áudios antigos
   - ✅ Converte sob demanda
   - ✅ Não sobrecarrega n8n
   - ✅ Funciona para arquivos legados

### Fluxo ideal:
```
WhatsApp → n8n → Converte OGG→MP3 → Salva MP3 no Supabase
                ↓
         Frontend tenta MP3
                ↓
         Se não existe → API converte
```

Isso garante máxima compatibilidade com mínimo custo! 