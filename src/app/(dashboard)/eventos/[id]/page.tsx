"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, CheckCircle, PlayCircle, XCircle } from "lucide-react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Textarea from "@/components/ui/textarea";
import Card, { CardContent, CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { Evento, Cliente, ExecucaoEvento, FornecedorEvento } from "@/types/database";

const statusColors: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  aberto: "info",
  em_andamento: "warning",
  realizado: "success",
  cancelado: "danger",
};

const statusLabels: Record<string, string> = {
  aberto: "Aberto",
  em_andamento: "Em Andamento",
  realizado: "Realizado",
  cancelado: "Cancelado",
};

export default function EventoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [evento, setEvento] = useState<(Evento & { cliente?: Cliente }) | null>(null);
  const [execucao, setExecucao] = useState<ExecucaoEvento | null>(null);
  const [fornecedores, setFornecedores] = useState<FornecedorEvento[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    equipe_escala: "",
    equipamentos_reservados: "",
    horario_montagem: "",
    horario_desmontagem: "",
    responsavel_tecnico: "",
    observacoes_operacionais: "",
  });

  const [execForm, setExecForm] = useState({
    equipe_real: "",
    equipamentos_reais: "",
    ocorrencias: "",
    observacoes_finais: "",
  });

  const [novoFornecedor, setNovoFornecedor] = useState({ nome: "", valor: "", descricao: "" });

  useEffect(() => {
    async function load() {
      const { data: ev } = await supabase.from("eventos").select("*, cliente:clientes(*)").eq("id", id).single();
      if (ev) {
        setEvento(ev as Evento & { cliente?: Cliente });
        setForm({
          equipe_escala: ev.equipe_escala || "",
          equipamentos_reservados: ev.equipamentos_reservados || "",
          horario_montagem: ev.horario_montagem || "",
          horario_desmontagem: ev.horario_desmontagem || "",
          responsavel_tecnico: ev.responsavel_tecnico || "",
          observacoes_operacionais: ev.observacoes_operacionais || "",
        });
      }

      const { data: exec } = await supabase.from("execucao_evento").select("*").eq("evento_id", id).single();
      if (exec) {
        setExecucao(exec as ExecucaoEvento);
        setExecForm({
          equipe_real: exec.equipe_real || "",
          equipamentos_reais: exec.equipamentos_reais || "",
          ocorrencias: exec.ocorrencias || "",
          observacoes_finais: exec.observacoes_finais || "",
        });

        const { data: forn } = await supabase.from("fornecedores_evento").select("*").eq("execucao_id", exec.id);
        setFornecedores((forn as FornecedorEvento[]) || []);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleSaveOperacao(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await supabase.from("eventos").update({
      equipe_escala: form.equipe_escala || null,
      equipamentos_reservados: form.equipamentos_reservados || null,
      horario_montagem: form.horario_montagem || null,
      horario_desmontagem: form.horario_desmontagem || null,
      responsavel_tecnico: form.responsavel_tecnico || null,
      observacoes_operacionais: form.observacoes_operacionais || null,
    }).eq("id", id);
    setSaving(false);
  }

  async function handleStatusChange(status: string) {
    await supabase.from("eventos").update({ status }).eq("id", id);
    setEvento((prev) => prev ? { ...prev, status: status as any } : prev);
  }

  async function handleSalvarExecucao() {
    if (!execucao) {
      const { data } = await supabase.from("execucao_evento").insert({
        evento_id: id,
        equipe_real: execForm.equipe_real || null,
        equipamentos_reais: execForm.equipamentos_reais || null,
        ocorrencias: execForm.ocorrencias || null,
        observacoes_finais: execForm.observacoes_finais || null,
      }).select().single();
      if (data) setExecucao(data as ExecucaoEvento);
    } else {
      await supabase.from("execucao_evento").update({
        equipe_real: execForm.equipe_real || null,
        equipamentos_reais: execForm.equipamentos_reais || null,
        ocorrencias: execForm.ocorrencias || null,
        observacoes_finais: execForm.observacoes_finais || null,
      }).eq("id", execucao.id);
    }
  }

  async function handleAddFornecedor() {
    if (!execucao || !novoFornecedor.nome) return;
    await supabase.from("fornecedores_evento").insert({
      execucao_id: execucao.id,
      nome: novoFornecedor.nome,
      valor: parseFloat(novoFornecedor.valor) || 0,
      descricao: novoFornecedor.descricao || null,
    });
    const { data } = await supabase.from("fornecedores_evento").select("*").eq("execucao_id", execucao.id);
    setFornecedores((data as FornecedorEvento[]) || []);
    setNovoFornecedor({ nome: "", valor: "", descricao: "" });
  }

  async function handleRemoveFornecedor(fId: string) {
    await supabase.from("fornecedores_evento").delete().eq("id", fId);
    setFornecedores(fornecedores.filter((f) => f.id !== fId));
  }

  if (loading) return <div className="py-12 text-center text-gray-500">Carregando...</div>;
  if (!evento) return <div className="py-12 text-center text-gray-500">Evento não encontrado</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href="/eventos"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{evento.nome_evento}</h1>
              <Badge variant={statusColors[evento.status]}>{statusLabels[evento.status]}</Badge>
            </div>
            <p className="text-sm text-gray-500">{evento.cliente?.nome} • {new Date(evento.data_inicio).toLocaleDateString("pt-BR")}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {evento.status === "aberto" && <Button size="sm" variant="outline" onClick={() => handleStatusChange("em_andamento")}><PlayCircle className="h-4 w-4 mr-1" />Iniciar</Button>}
          {evento.status === "em_andamento" && <Button size="sm" variant="outline" onClick={() => handleStatusChange("realizado")} className="text-green-600"><CheckCircle className="h-4 w-4 mr-1" />Concluir</Button>}
          {evento.status !== "realizado" && evento.status !== "cancelado" && <Button size="sm" variant="outline" onClick={() => handleStatusChange("cancelado")} className="text-red-600"><XCircle className="h-4 w-4 mr-1" />Cancelar</Button>}
        </div>
      </div>

      <Card>
        <CardHeader><h2 className="text-lg font-semibold">Dados Operacionais</h2></CardHeader>
        <CardContent>
          <form onSubmit={handleSaveOperacao} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Equipe Escalada" value={form.equipe_escala} onChange={(e) => setForm((p) => ({ ...p, equipe_escala: e.target.value }))} />
              <Input label="Responsável Técnico" value={form.responsavel_tecnico} onChange={(e) => setForm((p) => ({ ...p, responsavel_tecnico: e.target.value }))} />
              <Input label="Horário Montagem" value={form.horario_montagem} onChange={(e) => setForm((p) => ({ ...p, horario_montagem: e.target.value }))} />
              <Input label="Horário Desmontagem" value={form.horario_desmontagem} onChange={(e) => setForm((p) => ({ ...p, horario_desmontagem: e.target.value }))} />
            </div>
            <Textarea label="Equipamentos Reservados" value={form.equipamentos_reservados} onChange={(e) => setForm((p) => ({ ...p, equipamentos_reservados: e.target.value }))} rows={2} />
            <Textarea label="Observações Operacionais" value={form.observacoes_operacionais} onChange={(e) => setForm((p) => ({ ...p, observacoes_operacionais: e.target.value }))} rows={2} />
            <div className="flex justify-end">
              <Button type="submit" size="sm" loading={saving}><Save className="h-4 w-4 mr-2" />Salvar Operação</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h2 className="text-lg font-semibold">Registro Pós-Evento</h2></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Equipe Real" value={execForm.equipe_real} onChange={(e) => setExecForm((p) => ({ ...p, equipe_real: e.target.value }))} />
            <Input label="Equipamentos Reais" value={execForm.equipamentos_reais} onChange={(e) => setExecForm((p) => ({ ...p, equipamentos_reais: e.target.value }))} />
          </div>
          <Textarea label="Ocorrências" value={execForm.ocorrencias} onChange={(e) => setExecForm((p) => ({ ...p, ocorrencias: e.target.value }))} rows={2} />
          <Textarea label="Observações Finais" value={execForm.observacoes_finais} onChange={(e) => setExecForm((p) => ({ ...p, observacoes_finais: e.target.value }))} rows={2} />
          <Button size="sm" onClick={handleSalvarExecucao}><Save className="h-4 w-4 mr-2" />Salvar Execução</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h2 className="text-lg font-semibold">Fornecedores</h2></CardHeader>
        <CardContent className="space-y-4">
          {fornecedores.length > 0 && (
            <table className="w-full text-sm">
              <thead><tr className="border-b text-xs text-gray-500"><th className="text-left py-2">Nome</th><th className="text-left py-2">Descrição</th><th className="text-right py-2">Valor</th><th></th></tr></thead>
              <tbody>
                {fornecedores.map((f) => (
                  <tr key={f.id} className="border-b"><td className="py-2">{f.nome}</td><td className="py-2 text-gray-500">{f.descricao || "-"}</td><td className="py-2 text-right">{f.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td><td className="py-2 text-right"><Button variant="ghost" size="sm" onClick={() => handleRemoveFornecedor(f.id)}>✕</Button></td></tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="flex gap-2 items-end">
            <Input label="Fornecedor" value={novoFornecedor.nome} onChange={(e) => setNovoFornecedor((p) => ({ ...p, nome: e.target.value }))} placeholder="Nome" />
            <Input label="Valor" type="number" step="0.01" value={novoFornecedor.valor} onChange={(e) => setNovoFornecedor((p) => ({ ...p, valor: e.target.value }))} />
            <Input label="Descrição" value={novoFornecedor.descricao} onChange={(e) => setNovoFornecedor((p) => ({ ...p, descricao: e.target.value }))} />
            <Button onClick={handleAddFornecedor} size="sm">Adicionar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
