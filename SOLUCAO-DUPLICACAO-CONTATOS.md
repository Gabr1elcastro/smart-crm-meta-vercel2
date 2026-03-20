# Solução para Duplicação de Contatos

## Problema Identificado
Na seção de contatos, era possível criar o mesmo contato infinitas vezes, pois não havia validação para verificar se já existia um contato com o mesmo par `id_cliente` e `telefone`.

## Solução Implementada

### 1. Validação no Serviço de Leads (`src/services/leadsService.ts`)

#### Método `checkLeadExists`
- Novo método para verificar se um lead já existe baseado em `id_cliente` e `telefone`
- Retorna o lead existente ou `null` se não existir

#### Método `createLead` Atualizado
- Adicionada verificação de duplicatas antes de criar um novo lead
- Se um lead com o mesmo `id_cliente` e `telefone` já existir, retorna `null`
- O erro específico é tratado no componente que chama este método

### 2. Validação na Página de Contatos (`src/pages/contatos/Contatos.tsx`)

#### Criação Individual de Contatos
- Antes de criar um contato, verifica se já existe usando `leadsService.checkLeadExists`
- Se existir, mostra mensagem de erro informando o nome e telefone do contato existente
- Impede a criação do contato duplicado

#### Importação em Massa
- Melhorada a lógica de verificação de duplicatas
- Conta quantos contatos foram criados e quantos foram ignorados
- Mostra mensagem detalhada do resultado da importação
- Exemplo: "Importação concluída! 5 novos contatos adicionados. 3 contatos ignorados (já existiam)."

### 3. Validação na Página de Conversas (`src/pages/conversations/Conversations.tsx`)

#### Criação de Contatos via Nova Conversa
- Adicionada verificação de duplicatas antes de criar contato via modal de nova conversa
- Se o contato já existir, mostra erro e impede a criação

### 4. Constraint no Banco de Dados (`SOLUCAO-DUPLICACAO-CONTATOS.sql`)

#### Script SQL
- Adiciona constraint UNIQUE na tabela `leads` para os campos `id_cliente` e `telefone`
- Garante que mesmo se o código falhar, o banco de dados impedirá duplicatas
- Inclui comandos para verificar duplicatas existentes e removê-las se necessário

## Comportamento Esperado

### Criação Individual
- Se tentar criar um contato que já existe: mostra erro "Contato já existe! Nome: [nome], Telefone: [telefone]"
- Se o contato não existir: cria normalmente

### Importação em Massa
- Contatos que já existem são ignorados silenciosamente
- Apenas contatos novos são criados
- Relatório detalhado do resultado da importação

### Outras Funcionalidades
- Funções como `handleHumanAttendance` e `handleAlternarChip` já verificavam duplicatas
- Não foram necessárias alterações nestas funções

## Arquivos Modificados

1. `src/services/leadsService.ts` - Adicionado método `checkLeadExists` e validação no `createLead`
2. `src/pages/contatos/Contatos.tsx` - Validação na criação individual e importação em massa
3. `src/pages/conversations/Conversations.tsx` - Validação na criação via nova conversa
4. `SOLUCAO-DUPLICACAO-CONTATOS.sql` - Script para constraint no banco de dados
5. `SOLUCAO-DUPLICACAO-CONTATOS.md` - Esta documentação

## Como Testar

1. **Criação Individual**: Tente criar um contato com telefone que já existe
2. **Importação em Massa**: Importe uma planilha com contatos que já existem
3. **Nova Conversa**: Tente criar um contato via modal de nova conversa com telefone existente
4. **Banco de Dados**: Execute o script SQL para adicionar a constraint

## Benefícios

- Previne criação acidental de contatos duplicados
- Melhora a integridade dos dados
- Fornece feedback claro ao usuário
- Mantém a performance do sistema
- Garantia dupla: validação no código + constraint no banco 