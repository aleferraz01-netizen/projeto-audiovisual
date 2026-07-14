"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Edit, Eye, Trash2, FileText } from "lucide-react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Card, { CardContent, CardHeader } from "@/components/ui/card";
import Table, { TableHead, TableBody, TableRow, TableCell, TableHeader } from "@/components/ui/table";
import Badge from "@/components/ui/badge";
import EmptyState from "@/components/ui/empty-state";
import Modal from "@/components/ui/modal";
import { supabase } from "@/lib/supabase";
import { Cliente } from "@/types/database";

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteModal, setDeleteModal] = useState<Cliente | null>(null);

  useEffect(() => {
    loadClientes();
  }, []);

  async function loadClientes() {
    const { data } = await supabase.from("clientes").select("*").order("nome");
    setClientes((data as Cliente[]) || []);
    setLoading(false);
  }

  async function handleDelete() {
    if (!deleteModal) return;
    await supabase.from("clientes").delete().eq("id", deleteModal.id);
    setClientes(clientes.filter((c) => c.id !== deleteModal.id));
    setDeleteModal(null);
  }

  const filtered = clientes.filter(
    (c) =>
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      c.empresa?.toLowerCase().includes(search.toLowerCase()) ||
      c.cpf_cnpj?.includes(search)
  );

  function formatTelefone(value: string | null) {
    if (!value) return "-";
    const digits = value.replace(/\D/g, "");
    if (digits.length === 10) {
      return digits.replace(/(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
    }
    if (digits.length === 11) {
      return digits.replace(/(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
    }
    return value;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500">{clientes.length} clientes cadastrados</p>
        </div>
        <Link href="/clientes/novo">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, empresa ou CNPJ/CPF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-sm outline-none"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-sm text-gray-500">Carregando...</p>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Nenhum cliente encontrado"
              description={search ? "Tente outro termo de busca" : "Cadastre seu primeiro cliente"}
              action={
                !search && (
                  <Link href="/clientes/novo">
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Cliente
                    </Button>
                  </Link>
                )
              }
            />
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Nome</TableHeader>
                  <TableHeader>Contato</TableHeader>
                  <TableHeader>Celular</TableHeader>
                  <TableHeader>Telefone</TableHeader>
                  <TableHeader className="text-right">Ações</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{cliente.nome}</p>
                        {cliente.cpf_cnpj && (
                          <p className="text-xs text-gray-500">{cliente.cpf_cnpj}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{cliente.contato || "-"}</TableCell>
                    <TableCell>{cliente.celular ? formatTelefone(cliente.celular) : "-"}</TableCell>
                    <TableCell>{cliente.telefone ? formatTelefone(cliente.telefone) : "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/orcamentos/novo?cliente=${cliente.id}`}>
                          <Button variant="primary" size="sm">
                            <FileText className="h-4 w-4 mr-1" />
                            Novo Orçamento
                          </Button>
                        </Link>
                        <Link href={`/clientes/${cliente.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/clientes/${cliente.id}?edit=true`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteModal(cliente)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Confirmar exclusão" size="sm">
        <p className="text-sm text-gray-600 mb-4">
          Tem certeza que deseja excluir o cliente <strong>{deleteModal?.nome}</strong>?
          Esta ação não pode ser desfeita.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteModal(null)}>Cancelar</Button>
          <Button variant="danger" onClick={handleDelete}>Excluir</Button>
        </div>
      </Modal>
    </div>
  );
}
