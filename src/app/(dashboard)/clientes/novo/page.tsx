"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Textarea from "@/components/ui/textarea";
import Card, { CardContent, CardHeader } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

export default function NovoClientePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nome: "",
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

  function formatCpfCnpj(value: string, tipo: "cpf" | "cnpj") {
    const digits = value.replace(/\D/g, "");
    if (tipo === "cpf") {
      return digits
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
        .slice(0, 14);
    }
    return digits
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})$/, "$1-$2")
      .slice(0, 18);
  }

  function formatCep(value: string) {
    const digits = value.replace(/\D/g, "");
    return digits.replace(/(\d{5})(\d{1,3})$/, "$1-$2").slice(0, 9);
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
          setForm((prev) => ({
            ...prev,
            endereco: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            estado: data.uf,
          }));
        }
      } catch (err) {
        console.error("Erro ao buscar CEP");
      }
    }
  }

  async function handleCnpj(cnpj: string) {
    const digits = cnpj.replace(/\D/g, "");
    if (digits.length === 14) {
      try {
        const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
        if (res.ok) {
          const data = await res.json();
          setForm((prev) => ({
            ...prev,
            nome: data.razao_social || prev.nome,
            telefone: data.telefone || prev.telefone,
            email: data.email || prev.email,
            cep: data.cep ? formatCep(data.cep) : prev.cep,
            endereco: data.logradouro || prev.endereco,
            numero: data.numero || prev.numero,
            bairro: data.bairro || prev.bairro,
            cidade: data.municipio || prev.cidade,
            estado: data.uf || prev.estado,
          }));
        }
      } catch (err) {
        console.error("Erro ao buscar CNPJ");
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("clientes").insert({
      nome: form.nome,
      empresa: null,
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
    });

    if (!error) {
      router.push("/clientes");
    }
    setLoading(false);
  }

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/clientes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo Cliente</h1>
          <p className="text-sm text-gray-500">Preencha os dados do cliente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Dados Pessoais</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Nome / Razão Social *"
              value={form.nome}
              onChange={(e) => updateField("nome", e.target.value)}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Documento</label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={form.tipo_documento === "cpf" ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setForm((prev) => ({ ...prev, tipo_documento: "cpf", cpf_cnpj: "" }))}
                  >
                    CPF
                  </Button>
                  <Button
                    type="button"
                    variant={form.tipo_documento === "cnpj" ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setForm((prev) => ({ ...prev, tipo_documento: "cnpj", cpf_cnpj: "" }))}
                  >
                    CNPJ
                  </Button>
                </div>
              </div>
              <Input
                label={form.tipo_documento === "cpf" ? "CPF" : form.tipo_documento === "cnpj" ? "CNPJ" : "CPF/CNPJ"}
                value={form.cpf_cnpj}
                onChange={(e) => {
                  const formatted = formatCpfCnpj(e.target.value, form.tipo_documento as "cpf" | "cnpj" || "cpf");
                  updateField("cpf_cnpj", formatted);
                  if (form.tipo_documento === "cnpj") handleCnpj(formatted);
                }}
                placeholder={form.tipo_documento === "cpf" ? "000.000.000-00" : "00.000.000/0000-00"}
              />
            </div>

            <Input
              label="Nome do Contato"
              value={form.contato}
              onChange={(e) => updateField("contato", e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Celular"
                value={form.celular}
                onChange={(e) => updateField("celular", formatTelefone(e.target.value))}
                placeholder="(00) 00000-0000"
              />
              <Input
                label="Telefone"
                value={form.telefone}
                onChange={(e) => updateField("telefone", formatTelefone(e.target.value))}
                placeholder="(00) 0000-0000"
              />
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <h2 className="text-lg font-semibold">Endereço</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="CEP"
                value={form.cep}
                onChange={(e) => {
                  const formatted = formatCep(e.target.value);
                  updateField("cep", formatted);
                  handleCep(formatted);
                }}
                placeholder="00000-000"
              />
              <div className="sm:col-span-2">
                <Input
                  label="Endereço"
                  value={form.endereco}
                  onChange={(e) => updateField("endereco", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Input
                label="Número"
                value={form.numero}
                onChange={(e) => updateField("numero", e.target.value)}
              />
              <Input
                label="Bairro"
                value={form.bairro}
                onChange={(e) => updateField("bairro", e.target.value)}
              />
              <Input
                label="Cidade"
                value={form.cidade}
                onChange={(e) => updateField("cidade", e.target.value)}
              />
              <Input
                label="Estado"
                value={form.estado}
                onChange={(e) => updateField("estado", e.target.value)}
                maxLength={2}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <h2 className="text-lg font-semibold">Observações</h2>
          </CardHeader>
          <CardContent>
            <Textarea
              value={form.observacoes}
              onChange={(e) => updateField("observacoes", e.target.value)}
              rows={3}
              placeholder="Observações sobre o cliente..."
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Link href="/clientes">
            <Button type="button" variant="outline">Cancelar</Button>
          </Link>
          <Button type="submit" loading={loading}>
            <Save className="h-4 w-4 mr-2" />
            Salvar Cliente
          </Button>
        </div>
      </form>
    </div>
  );
}
