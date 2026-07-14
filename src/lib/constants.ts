import { Headphones, Volume2, Video, Monitor, Users, Zap } from "lucide-react";

export const CATEGORIAS = [
  { value: "Tradução", label: "Tradução Simultânea" },
  { value: "Sonorização", label: "Sonorização" },
  { value: "Transmissão/Filmagem", label: "Transmissão/Filmagem" },
  { value: "Mídia", label: "Mídia" },
  { value: "Recurso Humano", label: "Recurso Humano" },
  { value: "Outros", label: "Outros" },
] as const;

export const CATEGORIAS_FORM = CATEGORIAS.map((c) => ({
  value: c.value,
  label: c.value,
}));

export const CATEGORIAS_ORDEM = CATEGORIAS.map((c) => c.value);

export const CATEGORIA_COLORS: Record<string, "default" | "success" | "warning" | "info" | "danger"> = {
  Tradução: "info",
  Sonorização: "success",
  "Transmissão/Filmagem": "danger",
  Mídia: "warning",
  "Recurso Humano": "info",
  Outros: "default",
};

export const CATEGORIA_ICONS: Record<string, typeof Headphones> = {
  Tradução: Headphones,
  Sonorização: Volume2,
  "Transmissão/Filmagem": Video,
  Mídia: Monitor,
  "Recurso Humano": Users,
  Outros: Zap,
};
