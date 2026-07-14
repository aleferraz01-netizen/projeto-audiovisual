"use client";

import { Edit, Trash2, Layers } from "lucide-react";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import Card, { CardContent } from "@/components/ui/card";
import { KitComItens } from "@/types/database";

interface KitListProps {
  kits: KitComItens[];
  loading: boolean;
  onEdit: (kit: KitComItens) => void;
  onDelete: (kit: KitComItens) => void;
}

export default function KitList({ kits, loading, onEdit, onDelete }: KitListProps) {
  if (loading) {
    return (
      <Card>
        <CardContent>
          <p className="text-center py-8 text-sm text-gray-500">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  if (kits.length === 0) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8">
            <Layers className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Nenhum kit cadastrado</p>
            <p className="text-xs text-gray-400 mt-1">Clique em &quot;Novo Kit&quot; para criar o primeiro</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <div className="space-y-4">
          {kits.map((kit) => (
            <div
              key={kit.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-200 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900">{kit.nome}</h3>
                    <Badge variant="info">{kit.kit_itens?.length || 0} itens</Badge>
                  </div>
                  {kit.descricao && (
                    <p className="text-sm text-gray-500 mb-2">{kit.descricao}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {kit.kit_itens?.map((ki, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                      >
                        {ki.descricao || ki.equipamento?.nome || "Sem nome"} x
                        {ki.quantidade_padrao}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-4">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(kit)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(kit)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
