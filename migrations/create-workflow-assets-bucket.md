# Criação do Bucket workflow-assets no Supabase Storage

## Instruções

1. Acesse o Supabase Dashboard
2. Vá em **Storage** no menu lateral
3. Clique em **New bucket**
4. Configure:
   - **Name**: `workflow-assets`
   - **Public bucket**: ✅ Sim (para URLs públicas) ou ❌ Não (se usar signed URLs)
   - **File size limit**: 50 MB
   - **Allowed MIME types**: 
     - `audio/mpeg`
     - `audio/mp3`
     - `audio/wav`
     - `audio/wave`
     - `audio/ogg`
     - `audio/webm`
     - `audio/aac`
     - `application/pdf`
     - `application/msword`
     - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
     - `application/vnd.ms-excel`
     - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
     - `text/plain`
     - `text/csv`
     - `image/jpeg`
     - `image/jpg`
     - `image/png`
     - `image/webp`
     - `image/gif`

## Estrutura de Pastas

Os arquivos serão organizados automaticamente em:
```
workflow-assets/
└── {id_cliente}/
    └── workflows/
        └── {workflow_id}/
            └── {node_id}/
                └── {timestamp}-{random}.{ext}
```

## Política RLS (Row Level Security) - Opcional

Se o bucket for privado, adicione política RLS:

```sql
-- Permitir que usuários autenticados leiam apenas seus próprios arquivos
CREATE POLICY "Users can read their own workflow files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'workflow-assets' 
  AND (storage.foldername(name))[1] = (SELECT id_cliente::text FROM auth.users WHERE id = auth.uid())
);

-- Permitir que usuários autenticados façam upload apenas para suas próprias pastas
CREATE POLICY "Users can upload to their own workflow folders"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'workflow-assets' 
  AND (storage.foldername(name))[1] = (SELECT id_cliente::text FROM auth.users WHERE id = auth.uid())
);

-- Permitir que usuários autenticados deletem apenas seus próprios arquivos
CREATE POLICY "Users can delete their own workflow files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'workflow-assets' 
  AND (storage.foldername(name))[1] = (SELECT id_cliente::text FROM auth.users WHERE id = auth.uid())
);
```

**Nota**: Se o bucket for público, as políticas RLS acima não são necessárias, mas ainda é recomendado para segurança.
