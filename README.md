# SAID Audio - Sistema de Gestao Audiovisual

Sistema completo de gestao para empresa de locacao de equipamentos audiovisual e traducao simultanea. Gerenciamento de orcamentos, clientes, equipamentos, eventos, financeiro e relatorios.

## Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS 4, TypeScript
- **Backend:** Supabase (PostgreSQL, Auth, Row Level Security)
- **Icones:** Lucide React
- **Build:** Turbopack

## Funcionalidades

### Login
- Autenticacao via Supabase Auth (email/senha)

### Dashboard
- Cards com metricas (orcamentos em aberto, aprovados, eventos da semana, total de clientes)
- Links rapidos para acoes principais
- Lista de orcamentos recentes

### Clientes
- Cadastro completo com CNPJ (auto-fill via BrasilAPI) e CPF
- Telefone com formato (00) 0000-0000 e celular (00) 00000-0000
- CEP com auto-fill via ViaCEP
- Botao "Novo Orcamento" em cada cliente na lista
- Busca por nome, empresa ou CNPJ/CPF

### Equipamentos
- Cadastro com categorias: Traducao, Sonorizacao, Transmissao/Filmagem, Midia, Recurso Humano, Outros
- Filtro por categoria e busca por nome
- Visualizacao agrupada por categoria com badges coloridos

### Orcamentos
- **Sistema de Blocos:** Cada clique em uma categoria cria um bloco independente com nome editavel
  - Itens dentro de cada bloco com quantidade, valor unitario e dias independentes
  - Permite eventos com servicos de 3 dias para um item e 2 dias para outro
- **Kits Prontos:** Kits pre-configurados (Traducao 2/3 idiomas, Sonorizacao, Filmagem)
  - Todos editaveis e excluiveis
  - Selecao de equipamentos por dropdown ao criar/editar kit
  - Auto-criacao dos kits padrao no banco na primeira carga
- **Botoes de categoria:** +Traducao, +Sonorizacao, +Transmissao/Filmagem, +Midia, +Recurso Humano, +Outros
  - Categoria "Outros" aceita texto livre (passagem aerea, taxi, combustivel, etc.)
- **Status simplificados:** Rascunho, Confirmado, Cancelado (sem status = finalizado)
- **Prompt de rascunho:** Ao sair com alteracoes nao salvas, pergunta se deseja salvar como rascunho
- **PDF:** Geracao de HTML estilizado com logo, dados do evento, itens por bloco e totais
- **Envio:** WhatsApp e Email direto pela pagina de detalhes
- **Duplicar orcamento** com todos os itens
- Edicao pelo mesmo formulario de criacao (`/orcamentos/novo?id=XXX`)

### Eventos
- Lista com status (Aberto, Em Andamento, Realizado, Cancelado)
- Pagina de detalhes com dados operacionais (equipe, equipamentos, montagem/desmontagem)
- Pos-execucao com fornecedores e custos extras

### Financeiro
- Transacoes de entrada e saida
- Despesas mensais por tipo (salario, prolabore, luz, aluguel, equipamento, transporte, alimentacao, outros)
- Filtro por mes/ano

### Relatorios
- Metricas gerais e graficos de desempenho

## Estrutura do Banco (Tabelas Principais)

| Tabela | Descricao |
|--------|-----------|
| `clientes` | Cadastro de clientes com CPF/CNPJ, contato, telefone, celular, endereco |
| `equipamentos` | Equipamentos por categoria com valor unitario |
| `orcamentos` | Orcamentos com dados do evento, subtotais por categoria, totais |
| `orcamento_itens` | Itens do orcamento com bloco, categoria, quantidade, dias, subtotal |
| `kits` | Kits de equipamentos pre-configurados |
| `kit_itens` | Itens dos kits vinculados a equipamentos |
| `eventos` | Eventos com dados operacionais |
| `execucoes_evento` | Pos-execucao dos eventos |
| `fornecedores_evento` | Fornecedores vinculados a execucao |
| `despesas_mensais` | Despesas fixas mensais |
| `transacoes_financeiras` | Entradas e saidas financeiras |

## Setup

```bash
# Instalar dependencias
npm install

# Configurar variaveis de ambiente
# Copie .env.example para .env.local e preencha as credenciais do Supabase
```

### Variaveis de Ambiente (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
```

### SQL do Banco

Execute o conteudo de `supabase/schema.sql` no SQL Editor do Supabase Dashboard para criar as tabelas, triggers e RLS policies.

Apos criar as tabelas, execute:

```sql
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS celular TEXT;
ALTER TABLE orcamento_itens ADD COLUMN IF NOT EXISTS bloco TEXT DEFAULT '';
```

### Iniciar

```bash
npm run dev
```

Acesse http://localhost:3000

## Estrutura de Pastas

```
src/
  app/
    (auth)/login/           # Pagina de login
    (dashboard)/
      page.tsx              # Dashboard principal
      clientes/             # CRUD de clientes
      equipamentos/         # CRUD de equipamentos
      orcamentos/           # Criacao, edicao e listagem de orcamentos
      eventos/              # Gestao de eventos
      financeiro/           # Controle financeiro
      relatorios/           # Relatorios e metricas
    api/pdf/                # Geracao de PDF
  components/
    layout/                 # Sidebar, Header, DashboardLayout
    ui/                     # Componentes reutilizaveis (Button, Card, Input, etc.)
  lib/supabase.ts           # Cliente Supabase
  types/database.ts         # Tipos TypeScript do banco
  supabase/schema.sql         # Schema completo do banco
  AGENTS.md                 # Diretrizes e fluxo de trabalho para agentes de IA
```

## Diretrizes para Agentes de IA

Este repositório possui regras e diretrizes automatizadas para agentes de IA descritas no arquivo [AGENTS.md](file:///c:/Users/aless/Documents/projeto-audiovisual/AGENTS.md). 

Sempre que realizar novas implementações ou ajustes:
1. Execute as validações locais (`npm run lint` e `npm run build`).
2. Sincronize qualquer alteração de banco de dados em `supabase/schema.sql`.
3. Garanta que o repositório remoto seja atualizado ao final da tarefa (usando commit e push).
