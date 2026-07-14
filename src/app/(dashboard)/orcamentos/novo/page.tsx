"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  FileText,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Textarea from "@/components/ui/textarea";
import Card, { CardContent, CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { Cliente, Equipamento, Orcamento, OrcamentoItem, KitComItens } from "@/types/database";
import { CATEGORIAS_ORDEM, CATEGORIA_ICONS } from "@/lib/constants";

const statusOptions = [
  { value: "", label: "Finalizado (sem status)" },
  { value: "rascunho", label: "Rascunho" },
  { value: "confirmado", label: "Confirmado" },
  { value: "cancelado", label: "Cancelado" },
];

function NovoOrcamentoPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id") || "";
  const preselectedCliente = searchParams.get("cliente") || "";
  const [editingOrcamento, setEditingOrcamento] = useState<Orcamento | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [itens, setItens] = useState<OrcamentoItem[]>([]);
  const [categoriasExpandidas, setCategoriasExpandidas] = useState<Record<string, boolean>>({
    Tradução: true,
    Sonorização: true,
    "Transmissão/Filmagem": true,
    Mídia: true,
    "Recurso Humano": true,
    Outros: false,
  });

  const [form, setForm] = useState({
    cliente_id: preselectedCliente,
    nome_evento: "",
    data_inicio: "",
    hora_inicio: "",
    data_fim: "",
    hora_fim: "",
    local: "",
    participantes: "",
    observacoes: "",
    transporte: "",
    desconto: "",
    impostos: "",
    validade_dias: "30",
    modo_pdf: "simplificado" as "simplificado" | "detalhado",
    status: "",
  });

  const [kits, setKits] = useState<KitComItens[]>([]);

  useEffect(() => {
    async function loadData() {
      const [cliRes, eqRes, kitRes] = await Promise.all([
        supabase.from("clientes").select("*").order("nome"),
        supabase.from("equipamentos").select("*").eq("ativo", true).order("categoria"),
        supabase.from("kits").select("*, kit_itens(*, equipamento:equipamentos(*))").eq("ativo", true),
      ]);
      setClientes((cliRes.data as Cliente[]) || []);
      setEquipamentos((eqRes.data as Equipamento[]) || []);

      setKits((kitRes.data as KitComItens[]) || []);

      if (editId) {
        const { data: orc } = await supabase.from("orcamentos").select("*").eq("id", editId).single();
        if (orc) {
          setEditingOrcamento(orc);
          setForm({
            cliente_id: orc.cliente_id || "",
            nome_evento: orc.nome_evento || "",
            data_inicio: orc.data_inicio || "",
            hora_inicio: orc.hora_inicio || "",
            data_fim: orc.data_fim || "",
            hora_fim: orc.hora_fim || "",
            local: orc.local || "",
            participantes: orc.participantes?.toString() || "",
            observacoes: orc.observacoes || "",
            transporte: orc.transporte?.toString() || "",
            desconto: orc.desconto?.toString() || "",
            impostos: orc.impostos?.toString() || "",
            validade_dias: orc.validade_dias?.toString() || "30",
            modo_pdf: orc.modo_pdf || "simplificado",
            status: orc.status || "rascunho",
          });

          const { data: itensData } = await supabase.from("orcamento_itens").select("*").eq("orcamento_id", editId).order("ordem");
          if (itensData) {
            setItens(itensData.map((item: OrcamentoItem, idx: number) => ({
              ...item,
              bloco: item.bloco || item.categoria,
              id: `temp-${Date.now()}-${idx}`,
            })));
          }
        }
      }

      setLoading(false);
    }
    loadData();
  }, [editId]);

  function addKit(kit: KitComItens) {
    const blocoNome = kit.nome;
    const novosItens: OrcamentoItem[] = kit.kit_itens.map((ki, idx) => {
      const eq = ki.equipamento_id
        ? equipamentos.find((e) => e.id === ki.equipamento_id)
        : null;

      return {
        id: `temp-${Date.now()}-${idx}`,
        orcamento_id: "",
        categoria: ki.categoria || eq?.categoria || "Outros",
        bloco: blocoNome,
        equipamento_id: ki.equipamento_id || null,
        descricao: ki.descricao || eq?.nome || "",
        quantidade: ki.quantidade_padrao,
        valor_unitario: eq?.valor_unitario || 0,
        dias: 1,
        subtotal: 0,
        ordem: itens.length + idx,
      };
    });

    novosItens.forEach((ni) => {
      ni.subtotal = ni.quantidade * ni.valor_unitario * ni.dias;
    });

    setItens((prev) => [...prev, ...novosItens]);
  }

  function addBloco(categoria: string) {
    const blocoExistente = itens.filter((i) => i.categoria === categoria);
    const nomesExistentes = blocoExistente.map((i) => i.bloco);
    let nomeBloco = categoria;
    let counter = 2;
    while (nomesExistentes.includes(nomeBloco)) {
      nomeBloco = `${categoria} ${counter}`;
      counter++;
    }

    setCategoriasExpandidas((prev) => ({ ...prev, [categoria]: true }));

    const newItem: OrcamentoItem = {
      id: `temp-${Date.now()}`,
      orcamento_id: "",
      categoria,
      bloco: nomeBloco,
      equipamento_id: null,
      descricao: "",
      quantidade: 1,
      valor_unitario: 0,
      dias: 1,
      subtotal: 0,
      ordem: itens.length,
    };
    setItens((prev) => [...prev, newItem]);
  }

  function addItemBloco(categoria: string, bloco: string) {
    const newItem: OrcamentoItem = {
      id: `temp-${Date.now()}`,
      orcamento_id: "",
      categoria,
      bloco,
      equipamento_id: null,
      descricao: "",
      quantidade: 1,
      valor_unitario: 0,
      dias: 1,
      subtotal: 0,
      ordem: itens.length,
    };
    setItens((prev) => [...prev, newItem]);
  }

  function removeBloco(categoria: string, bloco: string) {
    setItens((prev) => prev.filter((i) => !(i.categoria === categoria && i.bloco === bloco)));
  }

  function renameBloco(categoria: string, blocoAntigo: string, blocoNovo: string) {
    setItens((prev) =>
      prev.map((i) =>
        i.categoria === categoria && i.bloco === blocoAntigo
          ? { ...i, bloco: blocoNovo }
          : i
      )
    );
  }

  function updateItem(index: number, field: string, value: string | number | null) {
    setItens((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      if (field === "equipamento_id" && value) {
        const eq = equipamentos.find((e) => e.id === value);
        if (eq) {
          updated[index].descricao = eq.nome;
          updated[index].valor_unitario = eq.valor_unitario;
        }
      }

      updated[index].subtotal =
        updated[index].quantidade * updated[index].valor_unitario * updated[index].dias;

      return updated;
    });
  }

  function removeItem(index: number) {
    setItens((prev) => prev.filter((_, i) => i !== index));
  }

  const subtotais = CATEGORIAS_ORDEM.reduce<Record<string, number>>((acc, cat) => {
    acc[cat] = itens
      .filter((i) => i.categoria === cat)
      .reduce((sum, i) => sum + i.subtotal, 0);
    return acc;
  }, {});

  const subtotalGeral = Object.values(subtotais).reduce((a, b) => a + b, 0);
  const transporte = parseFloat(form.transporte) || 0;
  const desconto = parseFloat(form.desconto) || 0;
  const impostos = parseFloat(form.impostos) || 0;
  const total = subtotalGeral + transporte - desconto + impostos;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    let orcamento: { id: string } | null = null;
    let error: { message: string } | null = null;

    const payload = {
      cliente_id: form.cliente_id || null,
      nome_evento: form.nome_evento,
      data_inicio: form.data_inicio,
      hora_inicio: form.hora_inicio,
      data_fim: form.data_fim,
      hora_fim: form.hora_fim,
      local: form.local || null,
      participantes: form.participantes ? parseInt(form.participantes) : null,
      observacoes: form.observacoes || null,
      subtotal_traducao: subtotais["Tradução"] || 0,
      subtotal_sonorizacao: subtotais["Sonorização"] || 0,
      subtotal_filmagem: (subtotais["Transmissão/Filmagem"] || 0) + (subtotais["Mídia"] || 0),
      subtotal_recursos_humanos: subtotais["Recurso Humano"] || 0,
      subtotal_projetores: 0,
      subtotal_geral: subtotalGeral,
      transporte,
      desconto,
      impostos,
      total,
      validade_dias: parseInt(form.validade_dias) || 30,
      modo_pdf: form.modo_pdf,
      status: form.status,
    };

    if (editId) {
      const result = await supabase.from("orcamentos").update(payload).eq("id", editId).select().single();
      orcamento = result.data;
      error = result.error;
    } else {
      const result = await supabase.from("orcamentos").insert(payload).select().single();
      orcamento = result.data;
      error = result.error;
    }

    if (error) {
      alert("Erro ao salvar orçamento: " + error.message);
      setSaving(false);
      return;
    }

    if (orcamento) {
      if (editId) {
        await supabase.from("orcamento_itens").delete().eq("orcamento_id", editId);
      }

      const itensValidos = itens.filter(item => item.descricao && item.descricao.trim() !== "");
      const itensToSave = itensValidos.map((item, idx) => ({
        orcamento_id: orcamento.id,
        categoria: item.categoria,
        bloco: item.bloco || item.categoria,
        equipamento_id: item.equipamento_id,
        descricao: item.descricao,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
        dias: item.dias,
        subtotal: item.subtotal,
        ordem: idx,
      }));
      if (itensToSave.length > 0) {
        const { error: itensError } = await supabase.from("orcamento_itens").insert(itensToSave);
        if (itensError) {
          alert("Erro ao salvar itens: " + itensError.message);
          setSaving(false);
          return;
        }
      }
      router.push(`/orcamentos/${orcamento.id}`);
    }

    setSaving(false);
  }

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  }

  const itensChanged = !loading && itens.length > 0;
  if (itensChanged && !hasChanges) {
    setHasChanges(true);
  }

  useEffect(() => {
    if (!hasChanges || loading) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasChanges, loading]);

  function handleBackNavigation(href: string) {
    if (hasChanges && itens.length > 0) {
      setPendingNavigation(href);
      setShowDraftModal(true);
    } else {
      router.push(href);
    }
  }

  async function saveDraftAndNavigate() {
    setSaving(true);
    const payload = {
      cliente_id: form.cliente_id || null,
      nome_evento: form.nome_evento || "Sem nome",
      data_inicio: form.data_inicio || new Date().toISOString().split("T")[0],
      hora_inicio: form.hora_inicio || "",
      data_fim: form.data_fim || "",
      hora_fim: form.hora_fim || "",
      local: form.local || null,
      participantes: form.participantes ? parseInt(form.participantes) : null,
      observacoes: form.observacoes || null,
      subtotal_traducao: subtotais["Tradução"] || 0,
      subtotal_sonorizacao: subtotais["Sonorização"] || 0,
      subtotal_filmagem: (subtotais["Transmissão/Filmagem"] || 0) + (subtotais["Mídia"] || 0),
      subtotal_recursos_humanos: subtotais["Recurso Humano"] || 0,
      subtotal_projetores: 0,
      subtotal_geral: subtotalGeral,
      transporte,
      desconto,
      impostos,
      total,
      validade_dias: parseInt(form.validade_dias) || 30,
      modo_pdf: form.modo_pdf,
      status: "rascunho",
    };

    let result;
    if (editId) {
      result = await supabase.from("orcamentos").update(payload).eq("id", editId).select().single();
    } else {
      result = await supabase.from("orcamentos").insert(payload).select().single();
    }

    if (result.data) {
      const orcId = result.data.id;
      if (editId) {
        await supabase.from("orcamento_itens").delete().eq("orcamento_id", editId);
      }
      const itensValidos = itens.filter(item => item.descricao && item.descricao.trim() !== "");
      if (itensValidos.length > 0) {
        await supabase.from("orcamento_itens").insert(itensValidos.map((item, idx) => ({
          orcamento_id: orcId,
          categoria: item.categoria,
          bloco: item.bloco || item.categoria,
          equipamento_id: item.equipamento_id,
          descricao: item.descricao,
          quantidade: item.quantidade,
          valor_unitario: item.valor_unitario,
          dias: item.dias,
          subtotal: item.subtotal,
          ordem: idx,
        })));
      }
    }

    setSaving(false);
    setHasChanges(false);
    setShowDraftModal(false);
    if (pendingNavigation) {
      router.push(pendingNavigation);
    }
  }

  function discardAndNavigate() {
    setHasChanges(false);
    setShowDraftModal(false);
    if (pendingNavigation) {
      router.push(pendingNavigation);
    }
  }

  function toggleCategoria(cat: string) {
    setCategoriasExpandidas((prev) => ({ ...prev, [cat]: !prev[cat] }));
  }

  if (loading) return <div className="py-12 text-center text-gray-500">Carregando...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => handleBackNavigation("/orcamentos")} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{editId ? "Editar Orçamento" : "Novo Orçamento"}</h1>
          <p className="text-sm text-gray-500">{editingOrcamento ? `${editingOrcamento.numero_orcamento} - ${editingOrcamento.nome_evento}` : "Preencha os dados para criar o orçamento"}</p>
        </div>
        <div className="flex gap-2">
          <select
            value={form.status}
            onChange={(e) => updateField("status", e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          >
            {statusOptions.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Dados do Evento</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <select
                value={form.cliente_id}
                onChange={(e) => updateField("cliente_id", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="">Selecione o cliente</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}{c.empresa ? ` - ${c.empresa}` : ""}</option>
                ))}
              </select>
            </div>

            <Input
              label="Nome do Evento *"
              value={form.nome_evento}
              onChange={(e) => updateField("nome_evento", e.target.value)}
              placeholder="Nome do evento (60-100 caracteres)"
              maxLength={100}
              required
            />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Input label="Data Início *" type="date" value={form.data_inicio} onChange={(e) => updateField("data_inicio", e.target.value)} required />
              <Input label="Hora Início *" type="time" value={form.hora_inicio} onChange={(e) => updateField("hora_inicio", e.target.value)} required />
              <Input label="Data Fim *" type="date" value={form.data_fim} onChange={(e) => updateField("data_fim", e.target.value)} required />
              <Input label="Hora Fim *" type="time" value={form.hora_fim} onChange={(e) => updateField("hora_fim", e.target.value)} required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="sm:col-span-3">
                <Input label="Local" value={form.local} onChange={(e) => updateField("local", e.target.value)} placeholder="Local do evento" />
              </div>
              <Input label="Participantes" type="number" value={form.participantes} onChange={(e) => updateField("participantes", e.target.value)} placeholder="Qtd" />
            </div>

            <Textarea label="Observações" value={form.observacoes} onChange={(e) => updateField("observacoes", e.target.value)} rows={2} placeholder="Observações gerais do evento" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <h2 className="text-lg font-semibold">Kits Prontos</h2>
              <p className="text-sm text-gray-500">Clique para adicionar itens pré-configurados</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {kits.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Nenhum kit cadastrado. Crie kits na página de Equipamentos.</p>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {kits.map((kit) => (
                <button
                  key={kit.id}
                  type="button"
                  onClick={() => addKit(kit)}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
                >
                  <p className="text-sm font-medium">{kit.nome}</p>
                  <p className="text-xs text-gray-500">{kit.kit_itens?.length || 0} itens</p>
                </button>
              ))}
            </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Itens do Orçamento</h2>
                <p className="text-sm text-gray-500">{itens.length} itens adicionados</p>
              </div>
              <div className="flex gap-2">
                <select
                  value={form.modo_pdf}
                  onChange={(e) => updateField("modo_pdf", e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white"
                >
                  <option value="simplificado">PDF Simplificado</option>
                  <option value="detalhado">PDF Detalhado</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {itens.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Nenhum item adicionado. Use os kits prontos ou clique nos botões abaixo para criar blocos de serviço.</p>
              </div>
            ) : (
              CATEGORIAS_ORDEM.map((cat) => {
                const catItens = itens.filter((i) => i.categoria === cat);
                if (catItens.length === 0) return null;
                const Icon = CATEGORIA_ICONS[cat];
                const isExpanded = categoriasExpandidas[cat] !== false;
                const blocos = [...new Set(catItens.map((i) => i.bloco))];
                const totalCat = catItens.reduce((sum, i) => sum + i.subtotal, 0);

                return (
                  <div key={cat} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleCategoria(cat)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-gray-600" />
                        <span className="font-medium text-sm">{cat}</span>
                        <Badge variant="default">{blocos.length} {blocos.length === 1 ? "bloco" : "blocos"}</Badge>
                        <Badge variant="default">{catItens.length} {catItens.length === 1 ? "item" : "itens"}</Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold">
                          {totalCat.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </span>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-4 space-y-4">
                        {blocos.map((bloco) => {
                          const blocoItens = catItens.filter((i) => i.bloco === bloco);
                          const blocoTotal = blocoItens.reduce((sum, i) => sum + i.subtotal, 0);
                          return (
                            <div key={bloco} className="border border-blue-200 rounded-lg bg-blue-50/30 overflow-hidden">
                              <div className="flex items-center justify-between px-4 py-2 bg-blue-100/50 border-b border-blue-200">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <input
                                    type="text"
                                    value={bloco}
                                    onChange={(e) => renameBloco(cat, bloco, e.target.value)}
                                    className="flex-1 min-w-0 px-2 py-1 text-sm font-semibold bg-transparent border-b border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none"
                                  />
                                  <span className="text-xs text-gray-500 whitespace-nowrap">
                                    {blocoItens.length} {blocoItens.length === 1 ? "item" : "itens"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 ml-2">
                                  <span className="text-xs font-semibold text-gray-600">
                                    {blocoTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => removeBloco(cat, bloco)}
                                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                                    title="Remover bloco"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                              <div className="p-3 space-y-2">
                                {blocoItens.map((item) => {
                                  const globalIdx = itens.indexOf(item);
                                  return (
                                    <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                                      {cat === "Outros" ? (
                                        <div className="col-span-12 sm:col-span-6">
                                          <label className="text-xs text-gray-500">Descrição</label>
                                          <input
                                            type="text"
                                            value={item.descricao}
                                            onChange={(e) => updateItem(globalIdx, "descricao", e.target.value)}
                                            placeholder="Ex: Passagem aérea, Taxi, Combustível..."
                                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                          />
                                        </div>
                                      ) : (
                                        <>
                                          <div className="col-span-12 sm:col-span-3">
                                            <label className="text-xs text-gray-500">Item</label>
                                            <select
                                              value={item.equipamento_id || ""}
                                              onChange={(e) => updateItem(globalIdx, "equipamento_id", e.target.value || null)}
                                              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                            >
                                              <option value="">Selecionar...</option>
                                              {equipamentos
                                                .filter((e) => e.categoria === cat)
                                                .map((e) => (
                                                  <option key={e.id} value={e.id}>{e.nome}</option>
                                                ))}
                                            </select>
                                          </div>
                                          <div className="col-span-6 sm:col-span-3">
                                            <label className="text-xs text-gray-500">Descrição</label>
                                            <input
                                              type="text"
                                              value={item.descricao}
                                              onChange={(e) => updateItem(globalIdx, "descricao", e.target.value)}
                                              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                            />
                                          </div>
                                        </>
                                      )}
                                      <div className="col-span-2 sm:col-span-1">
                                        <label className="text-xs text-gray-500">Qtd</label>
                                        <input
                                          type="number"
                                          min="1"
                                          value={item.quantidade}
                                          onChange={(e) => updateItem(globalIdx, "quantidade", parseInt(e.target.value) || 1)}
                                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                        />
                                      </div>
                                      <div className="col-span-3 sm:col-span-2">
                                        <label className="text-xs text-gray-500">Valor Unit.</label>
                                        <input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          value={item.valor_unitario}
                                          onChange={(e) => updateItem(globalIdx, "valor_unitario", parseFloat(e.target.value) || 0)}
                                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                        />
                                      </div>
                                      <div className="col-span-2 sm:col-span-1">
                                        <label className="text-xs text-gray-500">Dias</label>
                                        <input
                                          type="number"
                                          min="1"
                                          value={item.dias}
                                          onChange={(e) => updateItem(globalIdx, "dias", parseInt(e.target.value) || 1)}
                                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                        />
                                      </div>
                                      <div className="col-span-3 sm:col-span-2">
                                        <label className="text-xs text-gray-500">Subtotal</label>
                                        <div className="px-2 py-1.5 bg-white border border-gray-200 rounded text-sm font-semibold">
                                          {item.subtotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                        </div>
                                      </div>
                                      <div className="col-span-1 flex justify-center">
                                        <button
                                          type="button"
                                          onClick={() => removeItem(globalIdx)}
                                          className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                                <Button type="button" variant="ghost" size="sm" onClick={() => addItemBloco(cat, bloco)}>
                                  <Plus className="h-4 w-4 mr-1" /> Adicionar item
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                        <Button type="button" variant="outline" size="sm" onClick={() => addBloco(cat)}>
                          <Plus className="h-4 w-4 mr-1" /> Novo bloco {cat}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-xs text-gray-500 self-center mr-1">Adicionar bloco:</span>
              {CATEGORIAS_ORDEM.map((cat) => (
                <Button
                  key={cat}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addBloco(cat)}
                >
                  <Plus className="h-3 w-3 mr-1" /> {cat}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Resumo de Valores</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {CATEGORIAS_ORDEM.map((cat) => {
                if (!subtotais[cat] || subtotais[cat] === 0) return null;
                return (
                  <div key={cat} className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal {cat}</span>
                    <span className="font-medium">{subtotais[cat].toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                  </div>
                );
              })}
              <div className="border-t pt-2 flex justify-between text-sm">
                <span className="text-gray-600">Subtotal Geral</span>
                <span className="font-medium">{subtotalGeral.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="text-xs text-gray-500">Transporte (R$)</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-gray-400">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.transporte}
                      onChange={(e) => updateField("transporte", e.target.value)}
                      className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Desconto (R$)</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-gray-400">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.desconto}
                      onChange={(e) => updateField("desconto", e.target.value)}
                      className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Impostos/Taxa (R$)</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-gray-400">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.impostos}
                      onChange={(e) => updateField("impostos", e.target.value)}
                      className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="text-lg font-bold">TOTAL</span>
                <span className="text-lg font-bold text-blue-600">
                  {total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => handleBackNavigation("/orcamentos")} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
            Cancelar
          </button>
          <Button type="button" variant="outline" onClick={() => {
            setForm((prev) => ({ ...prev, status: "rascunho" }));
            setTimeout(() => {
              const formEl = document.querySelector("form");
              if (formEl) formEl.requestSubmit();
            }, 50);
          }} loading={saving}>
            Salvar Rascunho
          </Button>
          <Button type="submit" loading={saving}>
            <Save className="h-4 w-4 mr-2" />
            {editId ? "Salvar Alterações" : "Finalizar Orçamento"}
          </Button>
        </div>
      </form>

      {showDraftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Salvar como rascunho?</h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-600">Você tem alterações não salvas. Deseja salvar como rascunho antes de sair?</p>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t">
              <Button variant="outline" onClick={discardAndNavigate}>Descartar</Button>
              <Button onClick={saveDraftAndNavigate} loading={saving}>Salvar Rascunho</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NovoOrcamentoPage() {
  return (
    <Suspense>
      <NovoOrcamentoPageContent />
    </Suspense>
  );
}
