"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  FileText,
  Send,
  Plus,
  Trash2,
  Copy,
  Headphones,
  Volume2,
  Video,
  Users,
  Monitor,
  ChevronDown,
  ChevronUp,
  Zap,
} from "lucide-react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Textarea from "@/components/ui/textarea";
import Card, { CardContent, CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { Cliente, Equipamento, OrcamentoItem } from "@/types/database";

interface KitDef {
  id: string;
  nome: string;
  icon: any;
  itens: { descricao: string; quantidade: number; categoria: string; equipamento_id?: string }[];
}

const kitsDisponiveis: KitDef[] = [
  {
    id: "traducao-2-50",
    nome: "Tradução 2 idiomas - 50 pessoas",
    icon: Headphones,
    itens: [
      { descricao: "Sistema de tradução para 2 canais", quantidade: 1, categoria: "Tradução" },
      { descricao: "Cabine com isolamento acústico", quantidade: 1, categoria: "Tradução" },
      { descricao: "Receptor com fone", quantidade: 50, categoria: "Tradução" },
      { descricao: "Recepcionista", quantidade: 1, categoria: "Recurso Humano" },
      { descricao: "Técnico", quantidade: 1, categoria: "Recurso Humano" },
    ],
  },
  {
    id: "traducao-3-100",
    nome: "Tradução 3 idiomas - 100 pessoas",
    icon: Headphones,
    itens: [
      { descricao: "Sistema de tradução para 3 canais", quantidade: 1, categoria: "Tradução" },
      { descricao: "Cabine com isolamento acústico", quantidade: 2, categoria: "Tradução" },
      { descricao: "Receptor com fone", quantidade: 100, categoria: "Tradução" },
      { descricao: "Recepcionista", quantidade: 1, categoria: "Recurso Humano" },
      { descricao: "Técnico", quantidade: 1, categoria: "Recurso Humano" },
    ],
  },
  {
    id: "sonorizacao-50",
    nome: "Sonorização - 50 pessoas",
    icon: Volume2,
    itens: [
      { descricao: "Sistema de sonorização ambiente", quantidade: 1, categoria: "Sonorização" },
      { descricao: "Microfone de mão s/ fio UHF", quantidade: 2, categoria: "Sonorização" },
      { descricao: "Mesa de som", quantidade: 1, categoria: "Sonorização" },
      { descricao: "Caixa de som de 200 watts", quantidade: 2, categoria: "Sonorização" },
      { descricao: "Técnico", quantidade: 1, categoria: "Recurso Humano" },
    ],
  },
  {
    id: "filmagem-transmissao",
    nome: "Filmagem e Transmissão",
    icon: Video,
    itens: [
      { descricao: "Câmeras PTZ 4k", quantidade: 2, categoria: "Filmagem" },
      { descricao: "Mesa de corte SDI/HDMI", quantidade: 1, categoria: "Filmagem" },
      { descricao: "Controladora PTZ", quantidade: 1, categoria: "Filmagem" },
      { descricao: "Servidor nível II", quantidade: 1, categoria: "Filmagem" },
      { descricao: "Técnico de transmissão", quantidade: 1, categoria: "Recurso Humano" },
    ],
  },
];

const categoriasOrdem = ["Tradução", "Sonorização", "Transmissão/Filmagem", "Mídia", "Recurso Humano", "Outros"];

const categoriaIcons: Record<string, any> = {
  Tradução: Headphones,
  Sonorização: Volume2,
  "Transmissão/Filmagem": Video,
  Mídia: Monitor,
  "Recurso Humano": Users,
  Outros: Zap,
};

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
  const [editingOrcamento, setEditingOrcamento] = useState<any>(null);

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

  const [kits, setKits] = useState<any[]>([]);
  const [modalKitOpen, setModalKitOpen] = useState(false);
  const [editingKit, setEditingKit] = useState<any>(null);
  const [kitForm, setKitForm] = useState<{ nome: string; descricao: string; itens: { equipamento_id: string; descricao: string; quantidade: number; categoria: string }[] }>({ nome: "", descricao: "", itens: [{ equipamento_id: "", descricao: "", quantidade: 1, categoria: "Tradução" }] });

  useEffect(() => {
    async function loadData() {
      const [cliRes, eqRes, kitRes] = await Promise.all([
        supabase.from("clientes").select("*").order("nome"),
        supabase.from("equipamentos").select("*").eq("ativo", true).order("categoria"),
        supabase.from("kits").select("*, kit_itens(*, equipamento:equipamentos(*))").eq("ativo", true),
      ]);
      setClientes((cliRes.data as Cliente[]) || []);
      setEquipamentos((eqRes.data as Equipamento[]) || []);

      let kitsData = kitRes.data || [];

      const defaultKits = [
        {
          nome: "Tradução 2 idiomas - 50 pessoas",
          itens: [
            { descricao: "Sistema de tradução para 2 canais", quantidade: 1, categoria: "Tradução" },
            { descricao: "Cabine com isolamento acústico", quantidade: 1, categoria: "Tradução" },
            { descricao: "Receptor com fone", quantidade: 50, categoria: "Tradução" },
            { descricao: "Recepcionista", quantidade: 1, categoria: "Recurso Humano" },
            { descricao: "Técnico", quantidade: 1, categoria: "Recurso Humano" },
          ],
        },
        {
          nome: "Tradução 3 idiomas - 100 pessoas",
          itens: [
            { descricao: "Sistema de tradução para 3 canais", quantidade: 1, categoria: "Tradução" },
            { descricao: "Cabine com isolamento acústico", quantidade: 2, categoria: "Tradução" },
            { descricao: "Receptor com fone", quantidade: 100, categoria: "Tradução" },
            { descricao: "Recepcionista", quantidade: 1, categoria: "Recurso Humano" },
            { descricao: "Técnico", quantidade: 1, categoria: "Recurso Humano" },
          ],
        },
        {
          nome: "Sonorização - 50 pessoas",
          itens: [
            { descricao: "Sistema de sonorização ambiente", quantidade: 1, categoria: "Sonorização" },
            { descricao: "Microfone de mão s/ fio UHF", quantidade: 2, categoria: "Sonorização" },
            { descricao: "Mesa de som", quantidade: 1, categoria: "Sonorização" },
            { descricao: "Caixa de som de 200 watts", quantidade: 2, categoria: "Sonorização" },
            { descricao: "Técnico", quantidade: 1, categoria: "Recurso Humano" },
          ],
        },
        {
          nome: "Filmagem e Transmissão",
          itens: [
            { descricao: "Câmeras PTZ 4k", quantidade: 2, categoria: "Transmissão/Filmagem" },
            { descricao: "Mesa de corte SDI/HDMI", quantidade: 1, categoria: "Transmissão/Filmagem" },
            { descricao: "Controladora PTZ", quantidade: 1, categoria: "Transmissão/Filmagem" },
            { descricao: "Servidor nível II", quantidade: 1, categoria: "Transmissão/Filmagem" },
            { descricao: "Técnico de transmissão", quantidade: 1, categoria: "Recurso Humano" },
          ],
        },
      ];

      const nomesExistentes = kitsData.map((k: any) => k.nome);
      const kitsParaCriar = defaultKits.filter((dk) => !nomesExistentes.includes(dk.nome));

      if (kitsParaCriar.length > 0) {
        for (const kit of kitsParaCriar) {
          const { data: newKit } = await supabase.from("kits").insert({
            nome: kit.nome,
            descricao: null,
            ativo: true,
          }).select().single();

          if (newKit) {
            const kitItens = kit.itens.map((ki) => {
              const eq = equipamentos.find((e) => e.nome.toLowerCase() === ki.descricao.toLowerCase());
              return {
                kit_id: newKit.id,
                equipamento_id: eq?.id || null,
                quantidade_padrao: ki.quantidade,
              };
            });
            await supabase.from("kit_itens").insert(kitItens);
          }
        }
        const { data: refreshed } = await supabase.from("kits").select("*, kit_itens(*, equipamento:equipamentos(*))").eq("ativo", true);
        kitsData = refreshed || [];
      }

      setKits(kitsData);

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
            setItens(itensData.map((item: any, idx: number) => ({
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

  function addKit(kit: KitDef) {
    const blocoNome = kit.nome;
    const novosItens: OrcamentoItem[] = kit.itens.map((kitItem, idx) => {
      const eq = kitItem.equipamento_id
        ? equipamentos.find((e) => e.id === kitItem.equipamento_id)
        : equipamentos.find((e) => e.nome.toLowerCase() === kitItem.descricao.toLowerCase());

      return {
        id: `temp-${Date.now()}-${idx}`,
        orcamento_id: "",
        categoria: kitItem.categoria,
        bloco: blocoNome,
        equipamento_id: eq?.id || kitItem.equipamento_id || null,
        descricao: kitItem.descricao || eq?.nome || "",
        quantidade: kitItem.quantidade,
        valor_unitario: eq?.valor_unitario || 0,
        dias: 1,
        subtotal: 0,
        ordem: itens.length + idx,
      };
    });

    novosItens.forEach((ni) => {
      if (ni.equipamento_id) {
        const eq = equipamentos.find((e) => e.id === ni.equipamento_id);
        if (eq) {
          ni.descricao = eq.nome;
          ni.valor_unitario = eq.valor_unitario;
        }
      }
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

  function updateItem(index: number, field: string, value: any) {
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

  const subtotais = categoriasOrdem.reduce<Record<string, number>>((acc, cat) => {
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

    let orcamento: any = null;
    let error: any = null;

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

  useEffect(() => {
    if (!loading && itens.length > 0) {
      setHasChanges(true);
    }
  }, [itens, loading]);

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

  async function saveKit() {
    const { data: kit } = await supabase.from("kits").upsert({
      id: editingKit?.id || undefined,
      nome: kitForm.nome,
      descricao: kitForm.descricao || null,
      ativo: true,
    }).select().single();

    if (kit) {
      if (editingKit?.id) {
        await supabase.from("kit_itens").delete().eq("kit_id", kit.id);
      }
      const kitItens = kitForm.itens
        .filter((i) => i.equipamento_id)
        .map((i) => ({
          kit_id: kit.id,
          equipamento_id: i.equipamento_id || null,
          quantidade_padrao: i.quantidade,
        }));
      if (kitItens.length > 0) {
        await supabase.from("kit_itens").insert(kitItens);
      }
    }

    const { data: novosKits } = await supabase.from("kits").select("*, kit_itens(*, equipamento:equipamentos(*))").eq("ativo", true);
    setKits(novosKits || []);
    setModalKitOpen(false);
    setEditingKit(null);
    setKitForm({ nome: "", descricao: "", itens: [{ equipamento_id: "", descricao: "", quantidade: 1, categoria: "Tradução" }] });
  }

  async function deleteKit(kitId: string) {
    if (!confirm("Excluir este kit?")) return;
    await supabase.from("kits").delete().eq("id", kitId);
    setKits((prev) => prev.filter((k) => k.id !== kitId));
  }

  function openEditKit(kit: any) {
    setEditingKit(kit);
    setKitForm({
      nome: kit.nome,
      descricao: kit.descricao || "",
      itens: kit.kit_itens?.map((ki: any) => ({
        equipamento_id: ki.equipamento_id || "",
        descricao: ki.equipamento?.nome || "",
        quantidade: ki.quantidade_padrao,
        categoria: ki.equipamento?.categoria || "Outros",
      })) || [{ equipamento_id: "", descricao: "", quantidade: 1, categoria: "Tradução" }],
    });
    setModalKitOpen(true);
  }

  function openNewKit() {
    setEditingKit(null);
    setKitForm({ nome: "", descricao: "", itens: [{ equipamento_id: "", descricao: "", quantidade: 1, categoria: "Tradução" }] });
    setModalKitOpen(true);
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
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Kits Prontos</h2>
                <p className="text-sm text-gray-500">Clique para adicionar itens pré-configurados</p>
              </div>
              <Button variant="outline" size="sm" onClick={openNewKit}>
                <Plus className="h-4 w-4 mr-1" /> Novo Kit
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {kits.map((kit) => (
                <div key={kit.id} className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors">
                  <button
                    type="button"
                    onClick={() => {
                      const kitConverted: KitDef = {
                        id: kit.id,
                        nome: kit.nome,
                        icon: Headphones,
                        itens: kit.kit_itens?.map((ki: any) => ({
                          descricao: ki.equipamento?.nome || "",
                          quantidade: ki.quantidade_padrao,
                          categoria: ki.equipamento?.categoria || "Outros",
                          equipamento_id: ki.equipamento_id || undefined,
                        })) || [],
                      };
                      addKit(kitConverted);
                    }}
                    className="flex-1 text-left"
                  >
                    <p className="text-sm font-medium">{kit.nome}</p>
                    <p className="text-xs text-gray-500">{kit.kit_itens?.length || 0} itens</p>
                  </button>
                  <button type="button" onClick={() => openEditKit(kit)} className="p-1 hover:bg-gray-200 rounded text-sm" title="Editar">✏️</button>
                  <button type="button" onClick={() => deleteKit(kit.id)} className="p-1 hover:bg-red-100 rounded text-sm" title="Excluir">🗑️</button>
                </div>
              ))}
            </div>

            {modalKitOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
                  <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold">{editingKit ? "Editar Kit" : "Novo Kit"}</h3>
                    <button onClick={() => setModalKitOpen(false)} className="p-1 rounded hover:bg-gray-100">✕</button>
                  </div>
                  <div className="overflow-y-auto px-6 py-4 space-y-4">
                    <Input label="Nome do Kit *" value={kitForm.nome} onChange={(e) => setKitForm((p) => ({ ...p, nome: e.target.value }))} required />
                    <Input label="Descrição" value={kitForm.descricao} onChange={(e) => setKitForm((p) => ({ ...p, descricao: e.target.value }))} />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Itens do Kit</label>
                      {kitForm.itens.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 items-end mb-2">
                          <div className="col-span-5">
                            <select value={item.equipamento_id} onChange={(e) => {
                              const eq = equipamentos.find((eq) => eq.id === e.target.value);
                              const novos = [...kitForm.itens];
                              novos[idx].equipamento_id = e.target.value;
                              novos[idx].descricao = eq?.nome || "";
                              novos[idx].categoria = eq?.categoria || novos[idx].categoria;
                              setKitForm((p) => ({ ...p, itens: novos }));
                            }} className="w-full px-2 py-1.5 border rounded text-sm">
                              <option value="">Selecionar equipamento...</option>
                              {categoriasOrdem.map((c) => {
                                const eqs = equipamentos.filter((e) => e.categoria === c && e.ativo);
                                if (eqs.length === 0) return null;
                                return (
                                  <optgroup key={c} label={c}>
                                    {eqs.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
                                  </optgroup>
                                );
                              })}
                            </select>
                          </div>
                          <div className="col-span-3">
                            <select value={item.categoria} onChange={(e) => {
                              const novos = [...kitForm.itens];
                              novos[idx].categoria = e.target.value;
                              setKitForm((p) => ({ ...p, itens: novos }));
                            }} className="w-full px-2 py-1.5 border rounded text-sm">
                              {categoriasOrdem.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                          <div className="col-span-2">
                            <input type="number" min="1" value={item.quantidade} onChange={(e) => {
                              const novos = [...kitForm.itens];
                              novos[idx].quantidade = parseInt(e.target.value) || 1;
                              setKitForm((p) => ({ ...p, itens: novos }));
                            }} className="w-full px-2 py-1.5 border rounded text-sm" />
                          </div>
                          <div className="col-span-2">
                            <button type="button" onClick={() => {
                              setKitForm((p) => ({ ...p, itens: p.itens.filter((_, i) => i !== idx) }));
                            }} className="p-1.5 text-red-500 hover:bg-red-50 rounded">✕</button>
                          </div>
                        </div>
                      ))}
                      <Button type="button" variant="ghost" size="sm" onClick={() => setKitForm((p) => ({ ...p, itens: [...p.itens, { equipamento_id: "", descricao: "", quantidade: 1, categoria: "Tradução" }] }))}>
                        <Plus className="h-3 w-3 mr-1" /> Adicionar item
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 px-6 py-4 border-t">
                    <Button variant="outline" onClick={() => setModalKitOpen(false)}>Cancelar</Button>
                    <Button onClick={saveKit} disabled={!kitForm.nome.trim()}>Salvar Kit</Button>
                  </div>
                </div>
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
              categoriasOrdem.map((cat) => {
                const catItens = itens.filter((i) => i.categoria === cat);
                if (catItens.length === 0) return null;
                const Icon = categoriaIcons[cat] || Zap;
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
              {categoriasOrdem.map((cat) => (
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
              {categoriasOrdem.map((cat) => {
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
