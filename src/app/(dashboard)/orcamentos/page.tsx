"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Eye, Edit, Trash2, Copy, FileText, Send } from "lucide-react";
import Button from "@/components/ui/button";
import Card, { CardContent, CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import EmptyState from "@/components/ui/empty-state";
import Modal from "@/components/ui/modal";
import { supabase } from "@/lib/supabase";
import { Orcamento, Cliente } from "@/types/database";

  const statusColors: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
    rascunho: "default",
    confirmado: "success",
    cancelado: "danger",
  };

  const statusLabels: Record<string, string> = {
    rascunho: "Rascunho",
    confirmado: "Confirmado",
    cancelado: "Cancelado",
  };

function OrcamentosPageContent() {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");

  const [orcamentos, setOrcamentos] = useState<(Orcamento & { cliente?: Cliente })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState(() => {
    if (statusParam === "abertos") return "__abertos__";
    if (statusParam === "aprovado") return "aprovado";
    return "";
  });
  const [deleteModal, setDeleteModal] = useState<Orcamento | null>(null);

  useEffect(() => {
    loadOrcamentos();
  }, []);

  async function loadOrcamentos() {
    const { data } = await supabase
      .from("orcamentos")
      .select("*, cliente:clientes(*)")
      .order("criado_em", { ascending: false });
    setOrcamentos((data as (Orcamento & { cliente?: Cliente })[]) || []);
    setLoading(false);
  }

  async function handleDelete() {
    if (!deleteModal) return;
    await supabase.from("orcamento_itens").delete().eq("orcamento_id", deleteModal.id);
    await supabase.from("orcamentos").delete().eq("id", deleteModal.id);
    setDeleteModal(null);
    loadOrcamentos();
  }

  async function handleDuplicate(orc: Orcamento) {
    const { data: itens } = await supabase.from("orcamento_itens").select("*").eq("orcamento_id", orc.id);

    const { data: novoOrc } = await supabase
      .from("orcamentos")
      .insert({
        cliente_id: orc.cliente_id,
        nome_evento: orc.nome_evento + " (Cópia)",
        data_inicio: orc.data_inicio,
        hora_inicio: orc.hora_inicio,
        data_fim: orc.data_fim,
        hora_fim: orc.hora_fim,
        local: orc.local,
        participantes: orc.participantes,
        observacoes: orc.observacoes,
        subtotal_traducao: orc.subtotal_traducao,
        subtotal_sonorizacao: orc.subtotal_sonorizacao,
        subtotal_filmagem: orc.subtotal_filmagem,
        subtotal_recursos_humanos: orc.subtotal_recursos_humanos,
        subtotal_projetores: orc.subtotal_projetores,
        subtotal_geral: orc.subtotal_geral,
        transporte: orc.transporte,
        desconto: orc.desconto,
        impostos: orc.impostos,
        total: orc.total,
        validade_dias: orc.validade_dias,
        modo_pdf: orc.modo_pdf,
        status: "",
      })
      .select()
      .single();

    if (novoOrc && itens) {
      const novosItens = itens.map((item) => ({
        orcamento_id: novoOrc.id,
        categoria: item.categoria,
        bloco: item.bloco || item.categoria,
        equipamento_id: item.equipamento_id,
        descricao: item.descricao,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
        dias: item.dias,
        subtotal: item.subtotal,
        ordem: item.ordem,
      }));
      await supabase.from("orcamento_itens").insert(novosItens);
    }

    loadOrcamentos();
  }

  const filtered = orcamentos.filter((orc) => {
    const matchSearch =
      orc.numero_orcamento.toLowerCase().includes(search.toLowerCase()) ||
      orc.nome_evento.toLowerCase().includes(search.toLowerCase()) ||
      orc.cliente?.nome.toLowerCase().includes(search.toLowerCase());
    let matchStatus = true;
    if (filterStatus === "__abertos__") {
      matchStatus = ["rascunho", ""].includes(orc.status);
    } else if (filterStatus) {
      matchStatus = orc.status === filterStatus;
    }
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orçamentos</h1>
          <p className="text-sm text-gray-500">{orcamentos.length} orçamentos</p>
        </div>
        <Link href="/orcamentos/novo">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Orçamento
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por número, evento ou cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 text-sm outline-none"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="">Todos os status</option>
              <option value="__abertos__">Em aberto</option>
              <option value="rascunho">Rascunho</option>
              <option value="confirmado">Confirmado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-sm text-gray-500">Carregando...</p>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Nenhum orçamento encontrado"
              description={search || filterStatus ? "Tente outros filtros" : "Crie seu primeiro orçamento"}
              action={
                !search && !filterStatus && (
                  <Link href="/orcamentos/novo">
                    <Button size="sm"><Plus className="h-4 w-4 mr-2" />Novo Orçamento</Button>
                  </Link>
                )
              }
            />
          ) : (
            <div className="space-y-3">
              {filtered.map((orc) => (
                <div
                  key={orc.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-sm font-semibold text-blue-600">{orc.numero_orcamento}</span>
                      <Badge variant={statusColors[orc.status]}>{statusLabels[orc.status]}</Badge>
                    </div>
                    <p className="font-medium text-sm truncate">{orc.nome_evento}</p>
                    <p className="text-xs text-gray-500">
                      {orc.cliente?.nome} • {new Date(orc.data_inicio).toLocaleDateString("pt-BR")} • {new Date(orc.criado_em).toLocaleDateString("pt-BR")}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-gray-900">
                      {orc.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                    <div className="flex items-center gap-1">
                      <Link href={`/orcamentos/${orc.id}`}>
                        <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                      </Link>
                      {(!orc.status || orc.status === "rascunho") && (
                        <Link href={`/orcamentos/novo?id=${orc.id}`}>
                          <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                        </Link>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleDuplicate(orc)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteModal(orc)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Excluir orçamento" size="sm">
        <p className="text-sm text-gray-600 mb-4">
          Excluir <strong>{deleteModal?.numero_orcamento}</strong> - {deleteModal?.nome_evento}?
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteModal(null)}>Cancelar</Button>
          <Button variant="danger" onClick={handleDelete}>Excluir</Button>
        </div>
      </Modal>
    </div>
  );
}

export default function OrcamentosPage() {
  return (
    <Suspense>
      <OrcamentosPageContent />
    </Suspense>
  );
}
