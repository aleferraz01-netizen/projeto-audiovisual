"use client";

import { useEffect, useState } from "react";
import { DollarSign, Plus, TrendingUp, TrendingDown, Calendar, Trash2 } from "lucide-react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Textarea from "@/components/ui/textarea";
import Card, { CardContent, CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Modal from "@/components/ui/modal";
import { supabase } from "@/lib/supabase";
import { TransacaoFinanceira, DespesaMensal } from "@/types/database";

const tipoDespesas = [
  { value: "salario", label: "Salário" },
  { value: "prolabore", label: "Pró-labore" },
  { value: "luz", label: "Luz" },
  { value: "aluguel", label: "Aluguel" },
  { value: "equipamento", label: "Equipamento" },
  { value: "transporte", label: "Transporte" },
  { value: "alimentacao", label: "Alimentação" },
  { value: "outros", label: "Outros" },
];

const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export default function FinanceiroPage() {
  const [transacoes, setTransacoes] = useState<TransacaoFinanceira[]>([]);
  const [despesas, setDespesas] = useState<DespesaMensal[]>([]);
  const [loading, setLoading] = useState(true);
  const [mesAtual, setMesAtual] = useState(new Date().getMonth());
  const [anoAtual, setAnoAtual] = useState(new Date().getFullYear());
  const [modalTransacao, setModalTransacao] = useState(false);
  const [modalDespesa, setModalDespesa] = useState(false);
  const [formTransacao, setFormTransacao] = useState({ tipo: "entrada", descricao: "", valor: "", data: new Date().toISOString().split("T")[0], categoria: "", observacoes: "" });
  const [formDespesa, setFormDespesa] = useState({ descricao: "", tipo: "outros", valor: "", data: new Date().toISOString().split("T")[0], observacoes: "" });

  useEffect(() => { loadData(); }, [mesAtual, anoAtual]);

  async function loadData() {
    const startDate = `${anoAtual}-${String(mesAtual + 1).padStart(2, "0")}-01`;
    const endDate = `${anoAtual}-${String(mesAtual + 1).padStart(2, "0")}-31`;

    const [transRes, despRes] = await Promise.all([
      supabase.from("transacoes_financeiras").select("*").gte("data", startDate).lte("data", endDate).order("data", { ascending: false }),
      supabase.from("despesas_mensais").select("*").gte("data", startDate).lte("data", endDate).order("data", { ascending: false }),
    ]);
    setTransacoes((transRes.data as TransacaoFinanceira[]) || []);
    setDespesas((despRes.data as DespesaMensal[]) || []);
    setLoading(false);
  }

  async function handleAddTransacao(e: React.FormEvent) {
    e.preventDefault();
    await supabase.from("transacoes_financeiras").insert({
      tipo: formTransacao.tipo,
      descricao: formTransacao.descricao,
      valor: parseFloat(formTransacao.valor) || 0,
      data: formTransacao.data,
      categoria: formTransacao.categoria || null,
      observacoes: formTransacao.observacoes || null,
    });
    setModalTransacao(false);
    setFormTransacao({ tipo: "entrada", descricao: "", valor: "", data: new Date().toISOString().split("T")[0], categoria: "", observacoes: "" });
    loadData();
  }

  async function handleAddDespesa(e: React.FormEvent) {
    e.preventDefault();
    await supabase.from("despesas_mensais").insert({
      descricao: formDespesa.descricao,
      tipo: formDespesa.tipo,
      valor: parseFloat(formDespesa.valor) || 0,
      data: formDespesa.data,
      observacoes: formDespesa.observacoes || null,
    });
    setModalDespesa(false);
    setFormDespesa({ descricao: "", tipo: "outros", valor: "", data: new Date().toISOString().split("T")[0], observacoes: "" });
    loadData();
  }

  async function handleDeleteTransacao(id: string) {
    await supabase.from("transacoes_financeiras").delete().eq("id", id);
    loadData();
  }

  async function handleDeleteDespesa(id: string) {
    await supabase.from("despesas_mensais").delete().eq("id", id);
    loadData();
  }

  const totalEntradas = transacoes.filter((t) => t.tipo === "entrada").reduce((s, t) => s + t.valor, 0);
  const totalSaidas = transacoes.filter((t) => t.tipo === "saida").reduce((s, t) => s + t.valor, 0);
  const totalDespesasFixas = despesas.reduce((s, d) => s + d.valor, 0);
  const saldo = totalEntradas - totalSaidas - totalDespesasFixas;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
          <p className="text-sm text-gray-500">Controle de entradas, saídas e despesas mensais</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setModalTransacao(true)}><Plus className="h-4 w-4 mr-2" />Nova Transação</Button>
          <Button onClick={() => setModalDespesa(true)} variant="outline"><Plus className="h-4 w-4 mr-2" />Despesa Mensal</Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <select value={mesAtual} onChange={(e) => setMesAtual(parseInt(e.target.value))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
          {meses.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
        <select value={anoAtual} onChange={(e) => setAnoAtual(parseInt(e.target.value))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
          {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card><CardContent className="flex items-center gap-4"><div className="p-3 bg-green-100 rounded-lg"><TrendingUp className="h-6 w-6 text-green-600" /></div><div><p className="text-sm text-gray-500">Entradas</p><p className="text-xl font-bold text-green-600">{totalEntradas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4"><div className="p-3 bg-red-100 rounded-lg"><TrendingDown className="h-6 w-6 text-red-600" /></div><div><p className="text-sm text-gray-500">Saídas</p><p className="text-xl font-bold text-red-600">{totalSaidas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4"><div className="p-3 bg-orange-100 rounded-lg"><DollarSign className="h-6 w-6 text-orange-600" /></div><div><p className="text-sm text-gray-500">Despesas Fixas</p><p className="text-xl font-bold text-orange-600">{totalDespesasFixas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4"><div className={`p-3 rounded-lg ${saldo >= 0 ? "bg-blue-100" : "bg-red-100"}`}><DollarSign className={`h-6 w-6 ${saldo >= 0 ? "text-blue-600" : "text-red-600"}`} /></div><div><p className="text-sm text-gray-500">Saldo</p><p className={`text-xl font-bold ${saldo >= 0 ? "text-blue-600" : "text-red-600"}`}>{saldo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p></div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><h2 className="text-lg font-semibold">Transações</h2></CardHeader>
          <CardContent>
            {transacoes.length === 0 ? (
              <p className="text-center py-4 text-sm text-gray-500">Nenhuma transação este mês</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {transacoes.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${t.tipo === "entrada" ? "bg-green-100" : "bg-red-100"}`}>
                        {t.tipo === "entrada" ? <TrendingUp className="h-4 w-4 text-green-600" /> : <TrendingDown className="h-4 w-4 text-red-600" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{t.descricao}</p>
                        <p className="text-xs text-gray-500">{new Date(t.data).toLocaleDateString("pt-BR")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${t.tipo === "entrada" ? "text-green-600" : "text-red-600"}`}>
                        {t.tipo === "entrada" ? "+" : "-"}{t.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </span>
                      <button onClick={() => handleDeleteTransacao(t.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h2 className="text-lg font-semibold">Despesas Mensais</h2></CardHeader>
          <CardContent>
            {despesas.length === 0 ? (
              <p className="text-center py-4 text-sm text-gray-500">Nenhuma despesa este mês</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {despesas.map((d) => (
                  <div key={d.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium">{d.descricao}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="default">{tipoDespesas.find((t) => t.value === d.tipo)?.label || d.tipo}</Badge>
                        <span className="text-xs text-gray-500">{new Date(d.data).toLocaleDateString("pt-BR")}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-orange-600">{d.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                      <button onClick={() => handleDeleteDespesa(d.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal isOpen={modalTransacao} onClose={() => setModalTransacao(false)} title="Nova Transação">
        <form onSubmit={handleAddTransacao} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <div className="flex gap-2">
              <Button type="button" variant={formTransacao.tipo === "entrada" ? "primary" : "outline"} size="sm" onClick={() => setFormTransacao((p) => ({ ...p, tipo: "entrada" }))}>Entrada</Button>
              <Button type="button" variant={formTransacao.tipo === "saida" ? "danger" : "outline"} size="sm" onClick={() => setFormTransacao((p) => ({ ...p, tipo: "saida" }))}>Saída</Button>
            </div>
          </div>
          <Input label="Descrição *" value={formTransacao.descricao} onChange={(e) => setFormTransacao((p) => ({ ...p, descricao: e.target.value }))} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Valor *" type="number" step="0.01" value={formTransacao.valor} onChange={(e) => setFormTransacao((p) => ({ ...p, valor: e.target.value }))} required />
            <Input label="Data *" type="date" value={formTransacao.data} onChange={(e) => setFormTransacao((p) => ({ ...p, data: e.target.value }))} required />
          </div>
          <Input label="Categoria" value={formTransacao.categoria} onChange={(e) => setFormTransacao((p) => ({ ...p, categoria: e.target.value }))} />
          <Textarea label="Observações" value={formTransacao.observacoes} onChange={(e) => setFormTransacao((p) => ({ ...p, observacoes: e.target.value }))} rows={2} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalTransacao(false)}>Cancelar</Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={modalDespesa} onClose={() => setModalDespesa(false)} title="Nova Despesa Mensal">
        <form onSubmit={handleAddDespesa} className="space-y-4">
          <Input label="Descrição *" value={formDespesa.descricao} onChange={(e) => setFormDespesa((p) => ({ ...p, descricao: e.target.value }))} required />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
            <select value={formDespesa.tipo} onChange={(e) => setFormDespesa((p) => ({ ...p, tipo: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
              {tipoDespesas.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Valor *" type="number" step="0.01" value={formDespesa.valor} onChange={(e) => setFormDespesa((p) => ({ ...p, valor: e.target.value }))} required />
            <Input label="Data *" type="date" value={formDespesa.data} onChange={(e) => setFormDespesa((p) => ({ ...p, data: e.target.value }))} required />
          </div>
          <Textarea label="Observações" value={formDespesa.observacoes} onChange={(e) => setFormDespesa((p) => ({ ...p, observacoes: e.target.value }))} rows={2} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalDespesa(false)}>Cancelar</Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
