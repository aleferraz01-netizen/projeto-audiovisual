"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Users,
  Calendar,
  Plus,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Card, { CardContent, CardHeader } from "@/components/ui/card";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";

interface Stats {
  orcamentosAbertos: number;
  orcamentosAprovados: number;
  eventosSemana: number;
  totalClientes: number;
}

interface OrcamentoRecente {
  id: string;
  numero_orcamento: string;
  nome_evento: string;
  status: string;
  total: number;
  cliente: { nome: string } | null;
  criado_em: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    orcamentosAbertos: 0,
    orcamentosAprovados: 0,
    eventosSemana: 0,
    totalClientes: 0,
  });
  const [orcamentosRecentes, setOrcamentosRecentes] = useState<OrcamentoRecente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      const [orcAbertos, orcAprovados, eventos, clientes, recentes] = await Promise.all([
        supabase.from("orcamentos").select("id", { count: "exact", head: true }).in("status", ["rascunho", "enviado", "em_negociacao"]),
        supabase.from("orcamentos").select("id", { count: "exact", head: true }).eq("status", "aprovado"),
        supabase.from("eventos").select("id", { count: "exact", head: true }).gte("data_inicio", new Date().toISOString().split("T")[0]).lte("data_inicio", new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]),
        supabase.from("clientes").select("id", { count: "exact", head: true }),
        supabase.from("orcamentos").select("id, numero_orcamento, nome_evento, status, total, criado_em, cliente:clientes(nome)").order("criado_em", { ascending: false }).limit(5),
      ]);

      setStats({
        orcamentosAbertos: orcAbertos.count || 0,
        orcamentosAprovados: orcAprovados.count || 0,
        eventosSemana: eventos.count || 0,
        totalClientes: clientes.count || 0,
      });
      setOrcamentosRecentes((recentes.data as unknown as OrcamentoRecente[]) || []);
      setLoading(false);
    }

    loadDashboard();
  }, []);

  const statusColors: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
    rascunho: "default",
    enviado: "info",
    em_negociacao: "warning",
    aprovado: "success",
    cancelado: "danger",
  };

  const statusLabels: Record<string, string> = {
    rascunho: "Rascunho",
    enviado: "Enviado",
    em_negociacao: "Em Negociação",
    aprovado: "Aprovado",
    cancelado: "Cancelado",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Visão geral do seu negócio</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/orcamentos?status=abertos">
          <Card className="hover:shadow-md hover:border-blue-300 transition-all cursor-pointer h-full">
            <CardContent className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Orçamentos em aberto</p>
                <p className="text-2xl font-bold text-gray-900">{stats.orcamentosAbertos}</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/orcamentos?status=aprovado">
          <Card className="hover:shadow-md hover:border-green-300 transition-all cursor-pointer h-full">
            <CardContent className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Aprovados</p>
                <p className="text-2xl font-bold text-gray-900">{stats.orcamentosAprovados}</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/eventos">
          <Card className="hover:shadow-md hover:border-purple-300 transition-all cursor-pointer h-full">
            <CardContent className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Eventos esta semana</p>
                <p className="text-2xl font-bold text-gray-900">{stats.eventosSemana}</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/clientes">
          <Card className="hover:shadow-md hover:border-orange-300 transition-all cursor-pointer h-full">
            <CardContent className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total de clientes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalClientes}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="text-lg font-semibold">Ações Rápidas</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link href="/orcamentos/novo">
                <Button className="w-full" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Orçamento
                </Button>
              </Link>
              <Link href="/clientes/novo">
                <Button className="w-full" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Cliente
                </Button>
              </Link>
              <Link href="/equipamentos">
                <Button className="w-full" variant="outline">
                  <Package className="h-4 w-4 mr-2" />
                  Equipamentos
                </Button>
              </Link>
              <Link href="/eventos">
                <Button className="w-full" variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Agenda
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Resumo</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Orçamentos este mês</span>
              <span className="font-semibold">{stats.orcamentosAbertos + stats.orcamentosAprovados}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Taxa de aprovação</span>
              <span className="font-semibold">
                {stats.orcamentosAbertos + stats.orcamentosAprovados > 0
                  ? Math.round((stats.orcamentosAprovados / (stats.orcamentosAbertos + stats.orcamentosAprovados)) * 100)
                  : 0}
                %
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Orçamentos Recentes</h2>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-500 text-center py-4">Carregando...</p>
          ) : orcamentosRecentes.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Nenhum orçamento encontrado</p>
              <Link href="/orcamentos/novo">
                <Button className="mt-4" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar primeiro orçamento
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orcamentosRecentes.map((orc) => (
                <Link
                  key={orc.id}
                  href={`/orcamentos/${orc.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium text-sm">{orc.numero_orcamento}</p>
                      <p className="text-xs text-gray-500">{orc.nome_evento}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={statusColors[orc.status]}>{statusLabels[orc.status]}</Badge>
                    <span className="text-sm font-semibold">
                      {orc.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
