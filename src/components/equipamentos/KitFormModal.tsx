"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Modal from "@/components/ui/modal";
import { supabase } from "@/lib/supabase";
import { Equipamento, KitComItens } from "@/types/database";
import { CATEGORIAS_FORM } from "@/lib/constants";

interface KitFormItem {
  equipamento_id: string;
  descricao: string;
  quantidade: number;
  categoria: string;
}

interface KitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  kit: KitComItens | null;
  equipamentos: Equipamento[];
  onSaved: () => void;
}

const EMPTY_ITEM: KitFormItem = {
  equipamento_id: "",
  descricao: "",
  quantidade: 1,
  categoria: "Tradução",
};

function buildInitialItens(kit: KitComItens | null): KitFormItem[] {
  if (!kit) return [{ ...EMPTY_ITEM }];
  return (
    kit.kit_itens?.map((ki) => ({
      equipamento_id: ki.equipamento_id || "",
      descricao: ki.descricao || ki.equipamento?.nome || "",
      quantidade: ki.quantidade_padrao,
      categoria: ki.categoria || ki.equipamento?.categoria || "Outros",
    })) || [{ ...EMPTY_ITEM }]
  );
}

export default function KitFormModal({
  isOpen,
  onClose,
  kit,
  equipamentos,
  onSaved,
}: KitFormModalProps) {
  const [nome, setNome] = useState(kit?.nome || "");
  const [descricao, setDescricao] = useState(kit?.descricao || "");
  const [itens, setItens] = useState<KitFormItem[]>(() => buildInitialItens(kit));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addItem() {
    setItens((prev) => [...prev, { ...EMPTY_ITEM }]);
  }

  function removeItem(idx: number) {
    setItens((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: keyof KitFormItem, value: string | number) {
    setItens((prev) => {
      const novos = [...prev];
      novos[idx] = { ...novos[idx], [field]: value };

      if (field === "equipamento_id" && typeof value === "string") {
        const eq = equipamentos.find((e) => e.id === value);
        if (eq) {
          novos[idx].descricao = eq.nome;
          novos[idx].categoria = eq.categoria;
        }
      }
      return novos;
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const kitPayload: any = {
        nome,
        descricao: descricao || null,
        ativo: true,
      };
      if (kit?.id) {
        kitPayload.id = kit.id;
      }

      const { data: savedKit, error: kitError } = await supabase
        .from("kits")
        .upsert(kitPayload)
        .select()
        .single();

      if (kitError) throw kitError;
      if (!savedKit) throw new Error("Erro ao salvar kit");

      if (kit?.id) {
        await supabase.from("kit_itens").delete().eq("kit_id", savedKit.id);
      }

      const kitItens = itens
        .filter((i) => i.descricao || i.equipamento_id)
        .map((i) => ({
          kit_id: savedKit.id,
          equipamento_id: i.equipamento_id || null,
          descricao: i.descricao || null,
          categoria: i.categoria || null,
          quantidade_padrao: i.quantidade,
        }));

      if (kitItens.length > 0) {
        const { error: itensError } = await supabase
          .from("kit_itens")
          .insert(kitItens);
        if (itensError) throw itensError;
      }

      onSaved();
      onClose();
    } catch (err: any) {
      const message = err?.message || (typeof err === "string" ? err : "Erro desconhecido ao salvar kit");
      setError(message);
      console.error("Erro ao salvar kit:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={kit ? "Editar Kit" : "Novo Kit"}
    >
      <form onSubmit={handleSave} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <Input
          label="Nome do Kit *"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />
        <Input
          label="Descrição"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Ex: Kit para eventos com tradução simultânea"
        />

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Itens do Kit
            </label>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-3 w-3 mr-1" /> Adicionar Item
            </Button>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {itens.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 gap-2 items-end p-2 bg-gray-50 rounded-lg"
              >
                <div className="col-span-5">
                  <label className="block text-xs text-gray-500 mb-1">
                    Equipamento
                  </label>
                  <select
                    value={item.equipamento_id}
                    onChange={(e) =>
                      updateItem(idx, "equipamento_id", e.target.value)
                    }
                    className="w-full px-2 py-1.5 border rounded text-sm"
                  >
                    <option value="">Selecionar...</option>
                    {CATEGORIAS_FORM.map((c) => {
                      const eqs = equipamentos.filter(
                        (e) => e.categoria === c.value && e.ativo
                      );
                      if (eqs.length === 0) return null;
                      return (
                        <optgroup key={c.value} label={c.label}>
                          {eqs.map((e) => (
                            <option key={e.id} value={e.id}>
                              {e.nome}
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                </div>
                <div className="col-span-3">
                  <label className="block text-xs text-gray-500 mb-1">
                    Categoria
                  </label>
                  <select
                    value={item.categoria}
                    onChange={(e) =>
                      updateItem(idx, "categoria", e.target.value)
                    }
                    className="w-full px-2 py-1.5 border rounded text-sm"
                  >
                    {CATEGORIAS_FORM.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">
                    Qtd
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantidade}
                    onChange={(e) =>
                      updateItem(
                        idx,
                        "quantidade",
                        parseInt(e.target.value) || 1
                      )
                    }
                  />
                </div>
                <div className="col-span-2 flex justify-end">
                  {itens.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(idx)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={saving}>
            Salvar Kit
          </Button>
        </div>
      </form>
    </Modal>
  );
}
