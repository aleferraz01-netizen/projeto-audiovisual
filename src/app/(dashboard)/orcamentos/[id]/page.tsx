"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Edit,
  FileText,
  Send,
  Copy,
  CheckCircle,
  XCircle,
  MessageSquare,
  Headphones,
  Volume2,
  Video,
  Users,
  Monitor,
  Zap,
  Calendar,
  MapPin,
  Clock,
} from "lucide-react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Textarea from "@/components/ui/textarea";
import Card, { CardContent, CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { Orcamento, OrcamentoItem, Cliente, Evento } from "@/types/database";

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

const categoriaIcons: Record<string, any> = {
  Tradução: Headphones,
  Sonorização: Volume2,
  "Transmissão/Filmagem": Video,
  Mídia: Monitor,
  "Recurso Humano": Users,
  Outros: Zap,
};

function OrcamentoDetailPageContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const isEdit = searchParams.get("edit") === "true";

  const [orcamento, setOrcamento] = useState<(Orcamento & { cliente?: Cliente }) | null>(null);
  const [itens, setItens] = useState<OrcamentoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);

  const [form, setForm] = useState({
    cliente_id: "",
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
    status: "rascunho",
  });

  useEffect(() => {
    async function load() {
      const [orcRes, itensRes, cliRes] = await Promise.all([
        supabase.from("orcamentos").select("*, cliente:clientes(*)").eq("id", id).single(),
        supabase.from("orcamento_itens").select("*").eq("orcamento_id", id).order("ordem"),
        supabase.from("clientes").select("*").order("nome"),
      ]);

      if (orcRes.data) {
        const orc = orcRes.data as Orcamento & { cliente?: Cliente };
        setOrcamento(orc);
        setForm({
          cliente_id: orc.cliente_id || "",
          nome_evento: orc.nome_evento,
          data_inicio: orc.data_inicio,
          hora_inicio: orc.hora_inicio,
          data_fim: orc.data_fim,
          hora_fim: orc.hora_fim,
          local: orc.local || "",
          participantes: orc.participantes?.toString() || "",
          observacoes: orc.observacoes || "",
          transporte: orc.transporte?.toString() || "",
          desconto: orc.desconto?.toString() || "",
          impostos: orc.impostos?.toString() || "",
          validade_dias: orc.validade_dias?.toString() || "30",
          modo_pdf: orc.modo_pdf || "simplificado",
          status: orc.status,
        });
      }
      setItens((itensRes.data as OrcamentoItem[]) || []);
      setClientes((cliRes.data as Cliente[]) || []);
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    await supabase.from("orcamentos").update({
      cliente_id: form.cliente_id || null,
      nome_evento: form.nome_evento,
      data_inicio: form.data_inicio,
      hora_inicio: form.hora_inicio,
      data_fim: form.data_fim,
      hora_fim: form.hora_fim,
      local: form.local || null,
      participantes: form.participantes ? parseInt(form.participantes) : null,
      observacoes: form.observacoes || null,
      transporte: parseFloat(form.transporte) || 0,
      desconto: parseFloat(form.desconto) || 0,
      impostos: parseFloat(form.impostos) || 0,
      validade_dias: parseInt(form.validade_dias) || 30,
      modo_pdf: form.modo_pdf,
      status: form.status,
    }).eq("id", id);

    await supabase.from("orcamento_itens").delete().eq("orcamento_id", id);
    const itensToSave = itens.map((item, idx) => ({
      orcamento_id: id,
      categoria: item.categoria,
      equipamento_id: item.equipamento_id,
      descricao: item.descricao,
      quantidade: item.quantidade,
      valor_unitario: item.valor_unitario,
      dias: item.dias,
      subtotal: item.subtotal,
      ordem: idx,
    }));
    if (itensToSave.length > 0) {
      await supabase.from("orcamento_itens").insert(itensToSave);
    }

    setSaving(false);
    router.push(`/orcamentos/${id}`);
  }

  async function handleStatusChange(newStatus: string) {
    await supabase.from("orcamentos").update({ status: newStatus }).eq("id", id);

    if (newStatus === "aprovado") {
      const { data: evento } = await supabase
        .from("eventos")
        .insert({
          cliente_id: orcamento?.cliente_id,
          nome_evento: orcamento?.nome_evento || "",
          data_inicio: orcamento?.data_inicio,
          hora_inicio: orcamento?.hora_inicio,
          data_fim: orcamento?.data_fim,
          hora_fim: orcamento?.hora_fim,
          local: orcamento?.local,
          participantes: orcamento?.participantes,
          status: "aberto",
        })
        .select()
        .single();

      if (evento) {
        await supabase.from("orcamentos").update({ evento_id: evento.id }).eq("id", id);
      }
    }

    setForm((prev) => ({ ...prev, status: newStatus }));
    setOrcamento((prev) => (prev ? { ...prev, status: newStatus as any } : prev));
  }

  async function handleGeneratePdf() {
    setGeneratingPdf(true);
    try {
      const response = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orcamentoId: id }),
      });
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${orcamento?.numero_orcamento || "orcamento"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erro ao gerar PDF");
    }
    setGeneratingPdf(false);
  }

  function handleSendWhatsApp() {
    const phone = orcamento?.cliente?.telefone?.replace(/\D/g, "");
    if (!phone) return;
    const text = encodeURIComponent(
      `Olá! segue proposta do orçamento ${orcamento?.numero_orcamento} - ${orcamento?.nome_evento}\nTotal: ${orcamento?.total?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`
    );
    window.open(`https://wa.me/55${phone}?text=${text}`, "_blank");
  }

  function handleSendEmail() {
    const email = orcamento?.cliente?.email;
    if (!email) return;
    const subject = encodeURIComponent(`Proposta - ${orcamento?.numero_orcamento} - ${orcamento?.nome_evento}`);
    const body = encodeURIComponent(`Segue proposta do orçamento ${orcamento?.numero_orcamento}.\nTotal: ${orcamento?.total?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, "_blank");
  }

  const categoriasOrdem = ["Tradução", "Sonorização", "Transmissão/Filmagem", "Mídia", "Recurso Humano", "Outros"];

  const subtotais = categoriasOrdem.reduce<Record<string, number>>((acc, cat) => {
    acc[cat] = itens.filter((i) => i.categoria === cat).reduce((sum, i) => sum + i.subtotal, 0);
    return acc;
  }, {});

  const subtotalGeral = Object.values(subtotais).reduce((a, b) => a + b, 0);
  const transporte = orcamento?.transporte || 0;
  const desconto = orcamento?.desconto || 0;
  const impostos = orcamento?.impostos || 0;
  const total = orcamento?.total || 0;

  if (loading) return <div className="py-12 text-center text-gray-500">Carregando...</div>;
  if (!orcamento) return <div className="py-12 text-center text-gray-500">Orçamento não encontrado</div>;

  if (isEdit && (!orcamento.status || orcamento.status === "rascunho")) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/orcamentos/${id}`}><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Editar {orcamento.numero_orcamento}</h1>
          </div>
        </div>
        <form onSubmit={handleSave} className="space-y-6">
          <Card>
            <CardContent className="space-y-4 pt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                <select value={form.cliente_id} onChange={(e) => setForm((p) => ({ ...p, cliente_id: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                  <option value="">Selecione</option>
                  {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <Input label="Nome do Evento *" value={form.nome_evento} onChange={(e) => setForm((p) => ({ ...p, nome_evento: e.target.value }))} required />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Input label="Data Início" type="date" value={form.data_inicio} onChange={(e) => setForm((p) => ({ ...p, data_inicio: e.target.value }))} required />
                <Input label="Hora Início" type="time" value={form.hora_inicio} onChange={(e) => setForm((p) => ({ ...p, hora_inicio: e.target.value }))} required />
                <Input label="Data Fim" type="date" value={form.data_fim} onChange={(e) => setForm((p) => ({ ...p, data_fim: e.target.value }))} required />
                <Input label="Hora Fim" type="time" value={form.hora_fim} onChange={(e) => setForm((p) => ({ ...p, hora_fim: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Local" value={form.local} onChange={(e) => setForm((p) => ({ ...p, local: e.target.value }))} />
                <Input label="Participantes" type="number" value={form.participantes} onChange={(e) => setForm((p) => ({ ...p, participantes: e.target.value }))} />
              </div>
              <Textarea label="Observações" value={form.observacoes} onChange={(e) => setForm((p) => ({ ...p, observacoes: e.target.value }))} rows={2} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><h2 className="text-lg font-semibold">Itens ({itens.length})</h2></CardHeader>
            <CardContent className="space-y-4">
              {categoriasOrdem.map((cat) => {
                const catItens = itens.filter((i) => i.categoria === cat);
                if (catItens.length === 0) return null;
                const Icon = categoriaIcons[cat] || Zap;
                return (
                  <div key={cat} className="border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-4 w-4" />
                      <span className="font-medium text-sm">{cat}</span>
                      <span className="text-xs text-gray-500">({catItens.length})</span>
                    </div>
                    {catItens.map((item) => {
                      const idx = itens.indexOf(item);
                      return (
                        <div key={item.id} className="grid grid-cols-12 gap-2 items-end mb-2">
                          <div className="col-span-5">
                            <input type="text" value={item.descricao} onChange={(e) => { const u = [...itens]; u[idx] = { ...u[idx], descricao: e.target.value }; setItens(u); }} className="w-full px-2 py-1.5 border rounded text-sm" />
                          </div>
                          <div className="col-span-2">
                            <input type="number" min="1" value={item.quantidade} onChange={(e) => { const u = [...itens]; u[idx] = { ...u[idx], quantidade: parseInt(e.target.value) || 1, subtotal: (parseInt(e.target.value) || 1) * u[idx].valor_unitario * u[idx].dias }; setItens(u); }} className="w-full px-2 py-1.5 border rounded text-sm" />
                          </div>
                          <div className="col-span-2">
                            <input type="number" step="0.01" value={item.valor_unitario} onChange={(e) => { const u = [...itens]; u[idx] = { ...u[idx], valor_unitario: parseFloat(e.target.value) || 0, subtotal: u[idx].quantidade * (parseFloat(e.target.value) || 0) * u[idx].dias }; setItens(u); }} className="w-full px-2 py-1.5 border rounded text-sm" />
                          </div>
                          <div className="col-span-2">
                            <input type="number" min="1" value={item.dias} onChange={(e) => { const u = [...itens]; u[idx] = { ...u[idx], dias: parseInt(e.target.value) || 1, subtotal: u[idx].quantidade * u[idx].valor_unitario * (parseInt(e.target.value) || 1) }; setItens(u); }} className="w-full px-2 py-1.5 border rounded text-sm" />
                          </div>
                          <div className="col-span-1 text-center text-sm font-medium">{item.subtotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-2 pt-4">
              <div className="grid grid-cols-3 gap-4">
                <Input label="Transporte" type="number" step="0.01" value={form.transporte} onChange={(e) => setForm((p) => ({ ...p, transporte: e.target.value }))} />
                <Input label="Desconto" type="number" step="0.01" value={form.desconto} onChange={(e) => setForm((p) => ({ ...p, desconto: e.target.value }))} />
                <Input label="Impostos" type="number" step="0.01" value={form.impostos} onChange={(e) => setForm((p) => ({ ...p, impostos: e.target.value }))} />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Link href={`/orcamentos/${id}`}><Button type="button" variant="outline">Cancelar</Button></Link>
            <Button type="submit" loading={saving}><Save className="h-4 w-4 mr-2" />Salvar</Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href="/orcamentos"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{orcamento.numero_orcamento}</h1>
              {orcamento.status && <Badge variant={statusColors[orcamento.status]}>{statusLabels[orcamento.status]}</Badge>}
            </div>
            <p className="text-sm text-gray-500">{orcamento.nome_evento}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!orcamento.status && (
            <>
              <Link href={`/orcamentos/novo?id=${id}`}><Button variant="outline" size="sm"><Edit className="h-4 w-4 mr-1" />Editar</Button></Link>
              <Button variant="outline" size="sm" onClick={handleGeneratePdf} loading={generatingPdf}><FileText className="h-4 w-4 mr-1" />PDF</Button>
              <Button variant="outline" size="sm" onClick={handleSendWhatsApp}><Send className="h-4 w-4 mr-1" />WhatsApp</Button>
              <Button variant="outline" size="sm" onClick={handleSendEmail}><Send className="h-4 w-4 mr-1" />Email</Button>
            </>
          )}
          {orcamento.status === "rascunho" && (
            <>
              <Link href={`/orcamentos/novo?id=${id}`}><Button variant="outline" size="sm"><Edit className="h-4 w-4 mr-1" />Editar</Button></Link>
              <Button variant="outline" size="sm" onClick={handleGeneratePdf} loading={generatingPdf}><FileText className="h-4 w-4 mr-1" />PDF</Button>
              <Button variant="outline" size="sm" onClick={handleSendWhatsApp}><Send className="h-4 w-4 mr-1" />WhatsApp</Button>
              <Button variant="outline" size="sm" onClick={handleSendEmail}><Send className="h-4 w-4 mr-1" />Email</Button>
            </>
          )}
          {orcamento.status && orcamento.status !== "confirmado" && orcamento.status !== "cancelado" && (
            <Button variant="outline" size="sm" onClick={() => handleStatusChange("")} className="text-gray-600"><CheckCircle className="h-4 w-4 mr-1" />Finalizar</Button>
          )}
          {!orcamento.status && (
            <>
              <Button variant="outline" size="sm" onClick={() => handleStatusChange("confirmado")} className="text-green-600"><CheckCircle className="h-4 w-4 mr-1" />Confirmar</Button>
              <Button variant="outline" size="sm" onClick={() => handleStatusChange("cancelado")} className="text-red-600"><XCircle className="h-4 w-4 mr-1" />Cancelar</Button>
            </>
          )}
          {orcamento.status === "rascunho" && (
            <>
              <Button variant="outline" size="sm" onClick={() => handleStatusChange("confirmado")} className="text-green-600"><CheckCircle className="h-4 w-4 mr-1" />Confirmar</Button>
              <Button variant="outline" size="sm" onClick={() => handleStatusChange("cancelado")} className="text-red-600"><XCircle className="h-4 w-4 mr-1" />Cancelar</Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><h2 className="text-lg font-semibold">Dados do Evento</h2></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2"><Users className="h-4 w-4 text-gray-400" /><div><dt className="text-gray-500">Cliente</dt><dd className="font-medium">{orcamento.cliente?.nome || "-"}</dd></div></div>
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gray-400" /><div><dt className="text-gray-500">Local</dt><dd className="font-medium">{orcamento.local || "-"}</dd></div></div>
                <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-gray-400" /><div><dt className="text-gray-500">Início</dt><dd className="font-medium">{new Date(orcamento.data_inicio).toLocaleDateString("pt-BR")} {orcamento.hora_inicio}</dd></div></div>
                <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-gray-400" /><div><dt className="text-gray-500">Fim</dt><dd className="font-medium">{new Date(orcamento.data_fim).toLocaleDateString("pt-BR")} {orcamento.hora_fim}</dd></div></div>
                {orcamento.participantes && <div><dt className="text-gray-500">Participantes</dt><dd className="font-medium">{orcamento.participantes}</dd></div>}
                {orcamento.observacoes && <div className="col-span-2"><dt className="text-gray-500">Observações</dt><dd className="font-medium">{orcamento.observacoes}</dd></div>}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><h2 className="text-lg font-semibold">Itens do Orçamento</h2></CardHeader>
            <CardContent className="space-y-4">
              {categoriasOrdem.map((cat) => {
                const catItens = itens.filter((i) => i.categoria === cat);
                if (catItens.length === 0) return null;
                const Icon = categoriaIcons[cat] || Zap;
                const blocos = [...new Set(catItens.map((i) => i.bloco || i.categoria))];
                return (
                  <div key={cat}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-sm">{cat}</span>
                    </div>
                    {blocos.map((bloco) => {
                      const blocoItens = catItens.filter((i) => (i.bloco || i.categoria) === bloco);
                      return (
                        <div key={bloco} className="mb-3 ml-4">
                          {blocos.length > 1 && (
                            <p className="text-xs font-semibold text-blue-600 mb-1">{bloco}</p>
                          )}
                          <table className="w-full text-sm">
                            <thead><tr className="text-xs text-gray-500 border-b"><th className="text-left py-1">Item</th><th className="text-center py-1 w-16">Qtd</th><th className="text-right py-1 w-24">Valor Unit.</th><th className="text-center py-1 w-12">Dias</th><th className="text-right py-1 w-24">Subtotal</th></tr></thead>
                            <tbody>
                              {blocoItens.map((item) => (
                                <tr key={item.id} className="border-b border-gray-50">
                                  <td className="py-1.5">{item.descricao}</td>
                                  <td className="text-center py-1.5">{item.quantidade}</td>
                                  <td className="text-right py-1.5">{item.valor_unitario.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                                  <td className="text-center py-1.5">{item.dias}</td>
                                  <td className="text-right py-1.5 font-medium">{item.subtotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><h2 className="text-lg font-semibold">Valores</h2></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {categoriasOrdem.map((cat) => {
                if (!subtotais[cat]) return null;
                return (
                  <div key={cat} className="flex justify-between">
                    <span className="text-gray-600">{cat}</span>
                    <span>{subtotais[cat].toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                  </div>
                );
              })}
              <div className="border-t pt-2 flex justify-between"><span className="text-gray-600">Subtotal</span><span>{subtotalGeral.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span></div>
              {transporte > 0 && <div className="flex justify-between"><span className="text-gray-600">Transporte</span><span>{transporte.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span></div>}
              {desconto > 0 && <div className="flex justify-between text-green-600"><span>Desconto</span><span>-{desconto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span></div>}
              {impostos > 0 && <div className="flex justify-between"><span className="text-gray-600">Impostos/Taxa</span><span>{impostos.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span></div>}
              <div className="border-t pt-2 flex justify-between text-lg font-bold"><span>Total</span><span className="text-blue-600">{total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span></div>
              <div className="text-xs text-gray-500 text-right">Validade: {orcamento.validade_dias} dias</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><h2 className="text-lg font-semibold">Status</h2></CardHeader>
            <CardContent className="space-y-2">
              <div className="text-xs text-gray-500">Criado em: {new Date(orcamento.criado_em).toLocaleString("pt-BR")}</div>
              <div className="text-xs text-gray-500">Atualizado: {new Date(orcamento.atualizado_em).toLocaleString("pt-BR")}</div>
              {orcamento.evento_id && (
                <Link href={`/eventos/${orcamento.evento_id}`} className="block">
                  <Button variant="outline" size="sm" className="w-full mt-2"><Calendar className="h-4 w-4 mr-2" />Ver Evento</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function OrcamentoDetailPage() {
  return (
    <Suspense>
      <OrcamentoDetailPageContent />
    </Suspense>
  );
}
