"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Plus, Eye, MapPin, Clock } from "lucide-react";
import Button from "@/components/ui/button";
import Card, { CardContent, CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import EmptyState from "@/components/ui/empty-state";
import { supabase } from "@/lib/supabase";
import { Evento, Cliente } from "@/types/database";

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

export default function EventosPage() {
  const [eventos, setEventos] = useState<(Evento & { cliente?: Cliente })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    loadEventos();
  }, []);

  async function loadEventos() {
    const { data } = await supabase
      .from("eventos")
      .select("*, cliente:clientes(*)")
      .order("data_inicio", { ascending: false });
    setEventos((data as (Evento & { cliente?: Cliente })[]) || []);
    setLoading(false);
  }

  const filtered = eventos.filter((e) => !filterStatus || e.status === filterStatus);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Eventos</h1>
          <p className="text-sm text-gray-500">{eventos.length} eventos</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
              <option value="">Todos os status</option>
              <option value="aberto">Aberto</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="realizado">Realizado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-sm text-gray-500">Carregando...</p>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Calendar} title="Nenhum evento encontrado" description="Os eventos aparecem quando um orçamento é aprovado." />
          ) : (
            <div className="space-y-3">
              {filtered.map((evento) => (
                <Link
                  key={evento.id}
                  href={`/eventos/${evento.id}`}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Calendar className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{evento.nome_evento}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(evento.data_inicio).toLocaleDateString("pt-BR")} {evento.hora_inicio}</span>
                        {evento.local && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{evento.local}</span>}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{evento.cliente?.nome}</p>
                    </div>
                  </div>
                  <Badge variant={statusColors[evento.status]}>{statusLabels[evento.status]}</Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
