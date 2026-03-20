# Edge Function: check-workflow-timeouts

Esta função verifica workflows em estado `waiting_input` que excederam o timeout configurado e executa a ação apropriada.

## Configuração

### 1. Deploy da Function

```bash
supabase functions deploy check-workflow-timeouts
```

### 2. Configurar Cron Job

No Supabase Dashboard, vá em **Database > Cron Jobs** e crie um novo job:

- **Name**: `check_workflow_timeouts`
- **Schedule**: `*/5 * * * *` (a cada 5 minutos)
- **SQL Command**:
```sql
SELECT net.http_post(
  url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-workflow-timeouts',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer YOUR_ANON_KEY'
  ),
  body := '{}'::jsonb
);
```

### 3. Variáveis de Ambiente

Certifique-se de que as seguintes variáveis estão configuradas:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Funcionamento

1. Busca todas as execuções com `status = 'waiting_input'`
2. Para cada execução:
   - Calcula o tempo desde `waiting_since`
   - Compara com `timeout_minutes` configurado no node de menu
   - Se excedeu:
     - Se `timeout_action = 'voltar_inicio'`: cria nova execução iniciando do nó inicial
     - Se `timeout_action = 'encerrar'`: marca execução como `timeout`
     - Atualiza status do lead para `fechada`
     - Envia mensagem de timeout (se configurada)

## Logs

A função registra logs detalhados para facilitar debug:
- Execuções encontradas
- Timeouts detectados
- Ações executadas
- Erros encontrados
