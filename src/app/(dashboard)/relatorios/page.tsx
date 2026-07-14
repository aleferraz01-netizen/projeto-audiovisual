"use client";

import { useEffect, useState } from "react";
import { BarChart3, FileText, Calendar, DollarSign, Users, Package } from "lucide-react";
import Card, { CardContent, CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";

interface RelatorioData {
  totalOrcamentos: number;
  orcamentosAprovados: number;
  orcamentosCancelados: number;
  totalEventos: number;
  eventosRealizados: number;
  faturamentoTotal: number;
  clientesTotal: number;
  equipamentosTotal: number;
  receitaPorMes: { mes: string; valor: number }[];
  statusDistribuicao: { status: string; count: number }[];
}

const statusLabels: Record<string, string> = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  em_negociacao: "Em Negociação",
  aprovado: "Aprovado",
  cancelado: "Cancelado",
};

const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default function RelatoriosPage() {
  const [data, setData] = useState<RelatorioData>({
    totalOrcamentos: 0,
    orcamentosAprovados: 0,
    orcamentosCancelados: 0,
    totalEventos: 0,
    eventosRealizados: 0,
    faturamentoTotal: 0,
    clientesTotal: 0,
    equipamentosTotal: 0,
    receitaPorMes: [],
    statusDistribuicao: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [orcRes, evRes, cliRes, eqRes, transRes] = await Promise.all([
        supabase.from("orcamentos").select("id, status, total, criado_em"),
        supabase.from("eventos").select("id, status"),
        supabase.from("clientes").select("id", { count: "exact", head: true }),
        supabase.from("equipamentos").select("id", { count: "exact", head: true }),
        supabase.from("transacoes_financeiras").select("tipo, valor, data"),
      ]);

      const orcamentos = orcRes.data || [];
      const eventos = evRes.data || [];
      const transacoes = transRes.data || [];

      const faturamento = transacoes
        .filter((t: any) => t.tipo === "entrada")
        .reduce((s: number, t: any) => s + t.valor, 0);

      const receitaPorMes = meses.map((mes, i) => {
        const mesStr = String(i + 1).padStart(2, "0");
        const valor = orcamentos
          .filter((o: any) => o.status === "aprovado" && new Date(o.criado_em).getMonth() === i)
          .reduce((s: number, o: any) => s + (o.total || 0), 0);
        return { mes, valor };
      });

      const statusCount: Record<string, number> = {};
      orcamentos.forEach((o: any) => {
        statusCount[o.status] = (statusCount[o.status] || 0) + 1;
      });

      const statusDistribuicao = Object.entries(statusCount).map(([status, count]) => ({
        status,
        count,
      }));

      setData({
        totalOrcamentos: orcamentos.length,
        orcamentosAprovados: orcamentos.filter((o: any) => o.status === "aprovado").length,
        orcamentosCancelados: orcamentos.filter((o: any) => o.status === "cancelado").length,
        totalEventos: eventos.length,
        eventosRealizados: eventos.filter((e: any) => e.status === "realizado").length,
        faturamentoTotal: faturamento,
        clientesTotal: cliRes.count || 0,
        equipamentosTotal: eqRes.count || 0,
        receitaPorMes,
        statusDistribuicao,
      });
      setLoading(false);
    }
    load();
  }, []);

  const maxReceita = Math.max(...data.receitaPorMes.map((r) => r.valor), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
        <p className="text-sm text-gray-500">Visão geral do desempenho do negócio</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="flex items-center gap-4"><div className="p-3 bg-blue-100 rounded-lg"><FileText className="h-6 w-6 text-blue-600" /></div><div><p className="text-sm text-gray-500">Orçamentos</p><p className="text-2xl font-bold">{data.totalOrcamentos}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4"><div className="p-3 bg-green-100 rounded-lg"><Calendar className="h-6 w-6 text-green-600" /></div><div><p className="text-sm text-gray-500">Eventos Realizados</p><p className="text-2xl font-bold">{data.eventosRealizados}/{data.totalEventos}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4"><div className="p-3 bg-purple-100 rounded-lg"><DollarSign className="h-6 w-6 text-purple-600" /></div><div><p className="text-sm text-gray-500">Faturamento</p><p className="text-xl font-bold">{data.faturamentoTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4"><div className="p-3 bg-orange-100 rounded-lg"><Users className="h-6 w-6 text-orange-600" /></div><div><p className="text-sm text-gray-500">Clientes</p><p className="text-2xl font-bold">{data.clientesTotal}</p></div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><h2 className="text-lg font-semibold">Receita por Mês (Orçamentos Aprovados)</h2></CardHeader>
          <CardContent>
            {loading ? <p className="text-center py-4 text-gray-500">Carregando...</p> : (
              <div className="flex items-end gap-1 h-48">
                {data.receitaPorMes.map((r) => (
                  <div key={r.mes} className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-blue-500 rounded-t" style={{ height: `${(r.valor / maxReceita) * 100}%`, minHeight: r.valor > 0 ? "4px" : "0" }} />
                    <span className="text-xs mt-1">{r.mes}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h2 className="text-lg font-semibold">Distribuição por Status</h2></CardHeader>
          <CardContent>
            {loading ? <p className="text-center py-4 text-gray-500">Carregando...</p> : (
              <div className="space-y-3">
                {data.statusDistribuicao.map((s) => {
                  const pct = data.totalOrcamentos > 0 ? (s.count / data.totalOrcamentos) * 100 : 0;
                  return (
                    <div key={s.status}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{statusLabels[s.status] || s.status}</span>
                        <span className="font-medium">{s.count} ({Math.round(pct)}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><h2 className="text-lg font-semibold">Resumo Geral</h2></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            <div><p className="text-3xl font-bold text-blue-600">{data.totalOrcamentos}</p><p className="text-sm text-gray-500">Total Orçamentos</p></div>
            <div><p className="text-3xl font-bold text-green-600">{data.orcamentosAprovados}</p><p className="text-sm text-gray-500">Aprovados</p></div>
            <div><p className="text-3xl font-bold text-red-600">{data.orcamentosCancelados}</p><p className="text-sm text-gray-500">Cancelados</p></div>
            <div><p className="text-3xl font-bold text-purple-600">{data.totalEventos}</p><p className="text-sm text-gray-500">Total Eventos</p></div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-6 text-center">
            <div><p className="text-2xl font-bold text-orange-600">{data.clientesTotal}</p><p className="text-sm text-gray-500">Clientes Cadastrados</p></div>
            <div><p className="text-2xl font-bold text-blue-600">{data.equipamentosTotal}</p><p className="text-sm text-gray-500">Equipamentos</p></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
