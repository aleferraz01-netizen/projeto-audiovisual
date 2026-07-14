<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Instruções de Desenvolvimento para Agentes

Bem-vindo ao projeto **SAID Audio - Sistema de Gestão Audiovisual**. Como um agente de IA operando neste repositório, você deve seguir estritamente as diretrizes, padrões e fluxos de trabalho descritos abaixo.

---

## 1. Visão Geral da Stack Tecnológica
- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS 4, TypeScript
- **Backend/Banco de Dados:** Supabase (PostgreSQL, Supabase Auth, Row Level Security)
- **Biblioteca de Ícones:** Lucide React
- **Compilador/Build:** Turbopack

---

## 2. Estrutura de Pastas e Convenções
- As rotas estão organizadas em `src/app/` utilizando Route Groups:
  - `(auth)/login/` - Autenticação
  - `(dashboard)/` - Área administrativa logada (clientes, equipamentos, orçamentos, eventos, financeiro, relatórios)
- Componentes de interface compartilhados e de UI básica (Design System) ficam em `src/components/ui/` e `src/components/layout/`.
- Regras de conexão com Supabase e Hooks personalizados ficam em `src/lib/` e tipos TypeScript definidos em `src/types/`.

---

## 3. Diretrizes de Codificação e Boas Práticas
- **TypeScript estrito:** Sempre declare tipos e evite usar `any`.
- **Estilização com Tailwind CSS v4:** Utilize apenas classes utilitárias do Tailwind CSS 4. Evite CSS inline arbitrário.
- **Componentes Declarativos e Limpos:** Divida componentes grandes em arquivos menores e funcionais.
- **Componentes do Servidor vs. Cliente:** Lembre-se de usar a diretiva `"use client"` apenas onde for necessário interagir com estados do React ou eventos do navegador.

---

## 4. Gerenciamento do Banco de Dados (Supabase)
- O schema do banco de dados está centralizado em [schema.sql](file:///c:/Users/aless/Documents/projeto-audiovisual/supabase/schema.sql).
- **Importante:** Sempre que realizar uma alteração ou ajuste estrutural no banco de dados (novas tabelas, colunas, triggers ou políticas de RLS), você **deve** atualizar o arquivo `supabase/schema.sql` para manter o histórico e permitir que outros agentes ou desenvolvedores recriem o ambiente local/homologação de forma idêntica.

---

## 5. Fluxo de Trabalho Obrigatório Pós-Implementação/Ajuste
Após concluir qualquer alteração de código, bugfix ou implementação de funcionalidade, você deve executar **obrigatoriamente** as seguintes etapas antes de finalizar a tarefa:

### Passo A: Validação e Testes
1. **Executar Linter:** Garanta que não existam erros de estilização ou formatação de código executando:
   ```bash
   npm run lint
   ```
2. **Executar Build Local:** Garanta que a aplicação compila sem erros executando:
   ```bash
   npm run build
   ```
   *Qualquer erro de build ou lint deve ser corrigido imediatamente.*

### Passo B: Documentação
1. Sempre documente as mudanças realizadas.
2. Se uma nova funcionalidade foi implementada, nova tabela criada ou nova rota adicionada, atualize o arquivo [README.md](file:///c:/Users/aless/Documents/projeto-audiovisual/README.md) com as instruções e descrições apropriadas.

### Passo C: Atualização do Repositório Remoto (Git)
Para manter o repositório remoto sempre atualizado e sincronizado:
1. Verifique as alterações locais com `git status`.
2. Adicione os arquivos modificados:
   ```bash
   git add .
   ```
3. Realize o commit utilizando mensagens claras e semânticas em português (seguindo o padrão Conventional Commits se aplicável):
   ```bash
   git commit -m "feat(agents): atualiza instrucoes para agentes no AGENTS.md"
   ```
4. Envie as alterações para o repositório remoto:
   ```bash
   git push origin main
   ```
   *(Ou envie para a branch de trabalho atual).*

---

## 6. Comunicação e Transparência
- Mantenha suas mensagens concisas e em português.
- Se houver ambiguidades nas instruções do usuário, peça esclarecimentos antes de realizar alterações drásticas.
