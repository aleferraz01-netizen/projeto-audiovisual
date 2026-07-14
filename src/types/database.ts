export interface Cliente {
  id: string;
  nome: string;
  empresa: string | null;
  cpf_cnpj: string | null;
  tipo_documento: "cpf" | "cnpj" | null;
  contato: string | null;
  telefone: string | null;
  celular: string | null;
  email: string | null;
  cep: string | null;
  endereco: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  observacoes: string | null;
  criado_em: string;
}

export interface Equipamento {
  id: string;
  nome: string;
  categoria: string;
  descricao: string | null;
  valor_unitario: number;
  foto_url: string | null;
  ativo: boolean;
  criado_em: string;
}

export interface Evento {
  id: string;
  cliente_id: string;
  cliente?: Cliente;
  nome_evento: string;
  data_inicio: string;
  hora_inicio: string;
  data_fim: string;
  hora_fim: string;
  local: string | null;
  participantes: number | null;
  status: "aberto" | "em_andamento" | "realizado" | "cancelado";
  observacoes: string | null;
  equipe_escala: string | null;
  equipamentos_reservados: string | null;
  horario_montagem: string | null;
  horario_desmontagem: string | null;
  responsavel_tecnico: string | null;
  observacoes_operacionais: string | null;
  criado_em: string;
}

export type StatusOrcamento =
  | ""
  | "rascunho"
  | "confirmado"
  | "cancelado";

export interface Orcamento {
  id: string;
  cliente_id: string;
  cliente?: Cliente;
  evento_id: string | null;
  evento?: Evento;
  numero_orcamento: string;
  status: StatusOrcamento;
  nome_evento: string;
  data_inicio: string;
  hora_inicio: string;
  data_fim: string;
  hora_fim: string;
  local: string | null;
  participantes: number | null;
  observacoes: string | null;
  subtotal_traducao: number;
  subtotal_sonorizacao: number;
  subtotal_filmagem: number;
  subtotal_recursos_humanos: number;
  subtotal_projetores: number;
  subtotal_geral: number;
  transporte: number;
  desconto: number;
  impostos: number;
  total: number;
  validade_dias: number;
  modo_pdf: "simplificado" | "detalhado";
  criado_em: string;
  atualizado_em: string;
}

export interface OrcamentoItem {
  id: string;
  orcamento_id: string;
  categoria: string;
  bloco: string;
  equipamento_id: string | null;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  dias: number;
  subtotal: number;
  ordem: number;
}

export interface Kit {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  criado_em: string;
}

export interface KitItem {
  id: string;
  kit_id: string;
  equipamento_id: string;
  equipamento?: Equipamento;
  quantidade_padrao: number;
}

export interface ExecucaoEvento {
  id: string;
  evento_id: string;
  evento?: Evento;
  equipe_real: string | null;
  equipamentos_reais: string | null;
  ocorrencias: string | null;
  custo_extra: number;
  observacoes_finais: string | null;
  encerrado_em: string | null;
  criado_em: string;
}

export interface FornecedorEvento {
  id: string;
  execucao_id: string;
  nome: string;
  valor: number;
  descricao: string | null;
  criado_em: string;
}

export type TipoDespesa =
  | "salario"
  | "prolabore"
  | "luz"
  | "aluguel"
  | "equipamento"
  | "transporte"
  | "alimentacao"
  | "outros";

export interface DespesaMensal {
  id: string;
  descricao: string;
  tipo: TipoDespesa;
  valor: number;
  data: string;
  observacoes: string | null;
  criado_em: string;
}

export interface TransacaoFinanceira {
  id: string;
  evento_id: string | null;
  tipo: "entrada" | "saida";
  descricao: string;
  valor: number;
  data: string;
  categoria: string | null;
  observacoes: string | null;
  criado_em: string;
}
