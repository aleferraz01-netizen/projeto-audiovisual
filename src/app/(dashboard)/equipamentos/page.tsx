"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2, Package } from "lucide-react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Card, { CardContent, CardHeader } from "@/components/ui/card";
import Table, { TableHead, TableBody, TableRow, TableCell, TableHeader } from "@/components/ui/table";
import Badge from "@/components/ui/badge";
import Modal from "@/components/ui/modal";
import { supabase } from "@/lib/supabase";
import { Equipamento } from "@/types/database";

const categorias = [
  { value: "", label: "Todas as categorias" },
  { value: "Tradução", label: "Tradução Simultânea" },
  { value: "Sonorização", label: "Sonorização" },
  { value: "Transmissão/Filmagem", label: "Transmissão/Filmagem" },
  { value: "Mídia", label: "Mídia" },
  { value: "Recurso Humano", label: "Recurso Humano" },
  { value: "Outros", label: "Outros" },
];

const categoriasForm = [
  { value: "Tradução", label: "Tradução" },
  { value: "Sonorização", label: "Sonorização" },
  { value: "Transmissão/Filmagem", label: "Transmissão/Filmagem" },
  { value: "Mídia", label: "Mídia" },
  { value: "Recurso Humano", label: "Recurso Humano" },
  { value: "Outros", label: "Outros" },
];

const categoriaColors: Record<string, "default" | "success" | "warning" | "info" | "danger"> = {
  Tradução: "info",
  Sonorização: "success",
  "Transmissão/Filmagem": "danger",
  Mídia: "warning",
  "Recurso Humano": "info",
  Outros: "default",
};

export default function EquipamentosPage() {
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Equipamento | null>(null);
  const [deleteModal, setDeleteModal] = useState<Equipamento | null>(null);
  const [form, setForm] = useState({ nome: "", categoria: "Tradução", descricao: "", valor_unitario: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadEquipamentos();
  }, []);

  async function loadEquipamentos() {
    const { data } = await supabase.from("equipamentos").select("*").order("categoria").order("nome");
    setEquipamentos((data as Equipamento[]) || []);
    setLoading(false);
  }

  function openNew() {
    setEditing(null);
    setForm({ nome: "", categoria: "Tradução", descricao: "", valor_unitario: "" });
    setModalOpen(true);
  }

  function openEdit(eq: Equipamento) {
    setEditing(eq);
    setForm({
      nome: eq.nome,
      categoria: eq.categoria,
      descricao: eq.descricao || "",
      valor_unitario: eq.valor_unitario.toString(),
    });
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      nome: form.nome,
      categoria: form.categoria,
      descricao: form.descricao || null,
      valor_unitario: parseFloat(form.valor_unitario) || 0,
    };

    if (editing) {
      await supabase.from("equipamentos").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("equipamentos").insert(payload);
    }

    setModalOpen(false);
    setSaving(false);
    loadEquipamentos();
  }

  async function handleDelete() {
    if (!deleteModal) return;
    await supabase.from("equipamentos").delete().eq("id", deleteModal.id);
    setDeleteModal(null);
    loadEquipamentos();
  }

  const filtered = equipamentos.filter((eq) => {
    const matchSearch = eq.nome.toLowerCase().includes(search.toLowerCase()) || eq.descricao?.toLowerCase().includes(search.toLowerCase());
    const matchCategoria = !filterCategoria || eq.categoria === filterCategoria;
    return matchSearch && matchCategoria;
  });

  const grouped = filtered.reduce<Record<string, Equipamento[]>>((acc, eq) => {
    if (!acc[eq.categoria]) acc[eq.categoria] = [];
    acc[eq.categoria].push(eq);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipamentos</h1>
          <p className="text-sm text-gray-500">{equipamentos.length} equipamentos cadastrados</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Equipamento
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar equipamento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 text-sm outline-none"
              />
            </div>
            <select
              value={filterCategoria}
              onChange={(e) => setFilterCategoria(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              {categorias.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-sm text-gray-500">Carregando...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Nenhum equipamento encontrado</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([categoria, items]) => (
                <div key={categoria}>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant={categoriaColors[categoria] || "default"}>{categoria}</Badge>
                    <span className="text-xs text-gray-500">({items.length} itens)</span>
                  </div>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeader>Nome</TableHeader>
                        <TableHeader>Descrição</TableHeader>
                        <TableHeader className="text-right">Valor Unitário</TableHeader>
                        <TableHeader className="text-right">Ações</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.map((eq) => (
                        <TableRow key={eq.id}>
                          <TableCell className="font-medium">{eq.nome}</TableCell>
                          <TableCell className="text-gray-500 max-w-xs truncate">{eq.descricao || "-"}</TableCell>
                          <TableCell className="text-right">
                            {eq.valor_unitario.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openEdit(eq)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setDeleteModal(eq)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Editar Equipamento" : "Novo Equipamento"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Nome *"
            value={form.nome}
            onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
            <select
              value={form.categoria}
              onChange={(e) => setForm((prev) => ({ ...prev, categoria: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              required
            >
              {categoriasForm.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <Input
            label="Descrição"
            value={form.descricao}
            onChange={(e) => setForm((prev) => ({ ...prev, descricao: e.target.value }))}
            placeholder="Informações detalhadas sobre o item..."
          />
          <Input
            label="Valor Unitário (R$) *"
            type="number"
            step="0.01"
            min="0"
            value={form.valor_unitario}
            onChange={(e) => setForm((prev) => ({ ...prev, valor_unitario: e.target.value }))}
            required
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>Salvar</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Confirmar exclusão" size="sm">
        <p className="text-sm text-gray-600 mb-4">
          Tem certeza que deseja excluir <strong>{deleteModal?.nome}</strong>?
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteModal(null)}>Cancelar</Button>
          <Button variant="danger" onClick={handleDelete}>Excluir</Button>
        </div>
      </Modal>
    </div>
  );
}
