"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Edit, FileText } from "lucide-react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Textarea from "@/components/ui/textarea";
import Card, { CardContent, CardHeader } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Cliente } from "@/types/database";

export default function ClienteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const isEdit = searchParams.get("edit") === "true";

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    empresa: "",
    tipo_documento: "" as "cpf" | "cnpj" | "",
    cpf_cnpj: "",
    contato: "",
    telefone: "",
    celular: "",
    email: "",
    cep: "",
    endereco: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
    observacoes: "",
  });

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("clientes").select("*").eq("id", id).single();
      if (data) {
        setCliente(data as Cliente);
        setForm({
          nome: data.nome || "",
          empresa: data.empresa || "",
          tipo_documento: data.tipo_documento || "",
          cpf_cnpj: data.cpf_cnpj || "",
          contato: data.contato || "",
          telefone: data.telefone || "",
          celular: data.celular || "",
          email: data.email || "",
          cep: data.cep || "",
          endereco: data.endereco || "",
          numero: data.numero || "",
          bairro: data.bairro || "",
          cidade: data.cidade || "",
          estado: data.estado || "",
          observacoes: data.observacoes || "",
        });
      }
      setLoading(false);
    }
    load();
  }, [id]);

  function formatCpfCnpj(value: string, tipo: "cpf" | "cnpj") {
    const digits = value.replace(/\D/g, "");
    if (tipo === "cpf") {
      return digits.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2").slice(0, 14);
    }
    return digits.replace(/(\d{2})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1/$2").replace(/(\d{4})(\d{1,2})$/, "$1-$2").slice(0, 18);
  }

  function formatTelefone(value: string) {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 10) {
      return digits
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2")
        .slice(0, 14);
    }
    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .slice(0, 15);
  }

  async function handleCep(cep: string) {
    const digits = cep.replace(/\D/g, "");
    if (digits.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setForm((prev) => ({ ...prev, endereco: data.logradouro, bairro: data.bairro, cidade: data.localidade, estado: data.uf }));
        }
      } catch (err) {}
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await supabase.from("clientes").update({
      nome: form.nome,
      empresa: form.empresa || null,
      tipo_documento: form.tipo_documento || null,
      cpf_cnpj: form.cpf_cnpj || null,
      contato: form.contato || null,
      telefone: form.telefone || null,
      celular: form.celular || null,
      email: form.email || null,
      cep: form.cep || null,
      endereco: form.endereco || null,
      numero: form.numero || null,
      bairro: form.bairro || null,
      cidade: form.cidade || null,
      estado: form.estado || null,
      observacoes: form.observacoes || null,
    }).eq("id", id);
    setSaving(false);
    router.push("/clientes");
  }

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  if (loading) return <p className="text-center py-8 text-gray-500">Carregando...</p>;
  if (!cliente) return <p className="text-center py-8 text-gray-500">Cliente não encontrado</p>;

  if (isEdit) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/clientes/${id}`}>
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar Cliente</h1>
            <p className="text-sm text-gray-500">{cliente.nome}</p>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <Card>
            <CardContent className="space-y-4 pt-4">
              <Input label="Nome / Razão Social *" value={form.nome} onChange={(e) => updateField("nome", e.target.value)} required />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Documento</label>
                  <div className="flex gap-2">
                    <Button type="button" variant={form.tipo_documento === "cpf" ? "primary" : "outline"} size="sm" onClick={() => setForm((prev) => ({ ...prev, tipo_documento: "cpf", cpf_cnpj: "" }))}>CPF</Button>
                    <Button type="button" variant={form.tipo_documento === "cnpj" ? "primary" : "outline"} size="sm" onClick={() => setForm((prev) => ({ ...prev, tipo_documento: "cnpj", cpf_cnpj: "" }))}>CNPJ</Button>
                  </div>
                </div>
                <Input label="CPF/CNPJ" value={form.cpf_cnpj} onChange={(e) => updateField("cpf_cnpj", formatCpfCnpj(e.target.value, form.tipo_documento as "cpf" | "cnpj" || "cpf"))} />
              </div>
              <Input label="Empresa" value={form.empresa} onChange={(e) => updateField("empresa", e.target.value)} />
              <Input label="Contato" value={form.contato} onChange={(e) => updateField("contato", e.target.value)} />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input label="Celular" value={form.celular} onChange={(e) => updateField("celular", formatTelefone(e.target.value))} placeholder="(00) 00000-0000" />
                <Input label="Telefone" value={form.telefone} onChange={(e) => updateField("telefone", formatTelefone(e.target.value))} placeholder="(00) 0000-0000" />
                <Input label="Email" type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input label="CEP" value={form.cep} onChange={(e) => { const f = e.target.value.replace(/\D/g, "").replace(/(\d{5})(\d{1,3})$/, "$1-$2").slice(0, 9); updateField("cep", f); handleCep(f); }} />
                <div className="sm:col-span-2"><Input label="Endereço" value={form.endereco} onChange={(e) => updateField("endereco", e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Input label="Número" value={form.numero} onChange={(e) => updateField("numero", e.target.value)} />
                <Input label="Bairro" value={form.bairro} onChange={(e) => updateField("bairro", e.target.value)} />
                <Input label="Cidade" value={form.cidade} onChange={(e) => updateField("cidade", e.target.value)} />
                <Input label="Estado" value={form.estado} onChange={(e) => updateField("estado", e.target.value)} maxLength={2} />
              </div>
              <Textarea label="Observações" value={form.observacoes} onChange={(e) => updateField("observacoes", e.target.value)} rows={3} />
            </CardContent>
          </Card>
          <div className="flex justify-end gap-3 mt-6">
            <Link href={`/clientes/${id}`}><Button type="button" variant="outline">Cancelar</Button></Link>
            <Button type="submit" loading={saving}><Save className="h-4 w-4 mr-2" />Salvar</Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/clientes"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{cliente.nome}</h1>
            {cliente.empresa && <p className="text-sm text-gray-500">{cliente.empresa}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/clientes/${id}?edit=true`}><Button variant="outline" size="sm"><Edit className="h-4 w-4 mr-2" />Editar</Button></Link>
          <Link href={`/orcamentos/novo?cliente=${id}`}><Button size="sm"><FileText className="h-4 w-4 mr-2" />Novo Orçamento</Button></Link>
        </div>
      </div>

      <Card>
        <CardHeader><h2 className="text-lg font-semibold">Dados do Cliente</h2></CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><dt className="text-xs text-gray-500 uppercase">Nome</dt><dd className="text-sm font-medium">{cliente.nome}</dd></div>
            {cliente.empresa && <div><dt className="text-xs text-gray-500 uppercase">Empresa</dt><dd className="text-sm font-medium">{cliente.empresa}</dd></div>}
            {cliente.cpf_cnpj && <div><dt className="text-xs text-gray-500 uppercase">{cliente.tipo_documento === "cpf" ? "CPF" : "CNPJ"}</dt><dd className="text-sm font-medium">{cliente.cpf_cnpj}</dd></div>}
            {cliente.contato && <div><dt className="text-xs text-gray-500 uppercase">Contato</dt><dd className="text-sm font-medium">{cliente.contato}</dd></div>}
            {cliente.celular && <div><dt className="text-xs text-gray-500 uppercase">Celular</dt><dd className="text-sm font-medium">{formatTelefone(cliente.celular)}</dd></div>}
            {cliente.telefone && <div><dt className="text-xs text-gray-500 uppercase">Telefone</dt><dd className="text-sm font-medium">{formatTelefone(cliente.telefone)}</dd></div>}
            {cliente.email && <div><dt className="text-xs text-gray-500 uppercase">Email</dt><dd className="text-sm font-medium">{cliente.email}</dd></div>}
            {cliente.endereco && (
              <div className="sm:col-span-2"><dt className="text-xs text-gray-500 uppercase">Endereço</dt><dd className="text-sm font-medium">{cliente.endereco}{cliente.numero ? `, ${cliente.numero}` : ""}{cliente.bairro ? ` - ${cliente.bairro}` : ""}{cliente.cidade ? ` - ${cliente.cidade}/${cliente.estado}` : ""}</dd></div>
            )}
            {cliente.cep && <div><dt className="text-xs text-gray-500 uppercase">CEP</dt><dd className="text-sm font-medium">{cliente.cep}</dd></div>}
            {cliente.observacoes && <div className="sm:col-span-2"><dt className="text-xs text-gray-500 uppercase">Observações</dt><dd className="text-sm">{cliente.observacoes}</dd></div>}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
