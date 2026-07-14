import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { readFileSync } from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  const { orcamentoId } = await request.json();

  const { data: orcamento } = await supabase
    .from("orcamentos")
    .select("*, cliente:clientes(*)")
    .eq("id", orcamentoId)
    .single();

  if (!orcamento) {
    return NextResponse.json({ error: "Orçamento não encontrado" }, { status: 404 });
  }

  const { data: itens } = await supabase
    .from("orcamento_itens")
    .select("*")
    .eq("orcamento_id", orcamentoId)
    .order("ordem");

  const logoPath = path.join(process.cwd(), "public", "images", "logo.png");
  let logoBase64 = "";
  try {
    const logoBuffer = readFileSync(logoPath);
    logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
  } catch {
    logoBase64 = "";
  }

  const categorias: Record<string, any[]> = {};
  (itens || []).forEach((item: any) => {
    if (!categorias[item.categoria]) categorias[item.categoria] = [];
    categorias[item.categoria].push(item);
  });

  const formatCurrency = (val: number) =>
    val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const categoriasOrdem = ["Tradução", "Sonorização", "Transmissão/Filmagem", "Mídia", "Recurso Humano", "Outros"];

  let itensHtml = "";
  categoriasOrdem.forEach((cat) => {
    if (!categorias[cat] || categorias[cat].length === 0) return;
    itensHtml += `<h3 class="section-title">${cat}</h3>`;

    const blocosMap: Record<string, any[]> = {};
    categorias[cat].forEach((item: any) => {
      const bloco = item.bloco || cat;
      if (!blocosMap[bloco]) blocosMap[bloco] = [];
      blocosMap[bloco].push(item);
    });
    const blocos = Object.keys(blocosMap);

    blocos.forEach((bloco) => {
      if (blocos.length > 1) {
        itensHtml += `<p style="font-size:11px;font-weight:bold;color:#2563eb;margin:8px 0 4px;">${bloco}</p>`;
      }
      itensHtml += `<table class="items-table"><thead><tr>`;
      if (orcamento.modo_pdf === "detalhado") {
        itensHtml += `<th>Qtd</th><th>Item</th><th>Descrição</th><th>Valor Unit.</th><th>Dias</th><th>Subtotal</th>`;
      } else {
        itensHtml += `<th>Item</th><th>Qtd</th><th>Subtotal</th>`;
      }
      itensHtml += `</tr></thead><tbody>`;
      blocosMap[bloco].forEach((item: any) => {
        itensHtml += `<tr>`;
        if (orcamento.modo_pdf === "detalhado") {
          itensHtml += `<td>${item.quantidade}</td><td>${item.descricao}</td><td>-</td><td>${formatCurrency(item.valor_unitario)}</td><td>${item.dias}</td><td>${formatCurrency(item.subtotal)}</td>`;
        } else {
          itensHtml += `<td>${item.descricao}</td><td>${item.quantidade}</td><td>${formatCurrency(item.subtotal)}</td>`;
        }
        itensHtml += `</tr>`;
      });
      itensHtml += `</tbody></table>`;
    });
  });

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #333; }
  .header { display: flex; align-items: center; justify-content: space-between; padding: 20px 30px; border-bottom: 3px solid #2563eb; }
  .logo { max-height: 60px; }
  .header-info { text-align: right; }
  .header-info h1 { font-size: 18px; color: #1e40af; }
  .header-info p { font-size: 11px; color: #666; }
  .content { padding: 20px 30px; }
  .event-info { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 20px; }
  .event-info h2 { font-size: 16px; color: #1e40af; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
  .event-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .event-grid .item { display: flex; gap: 8px; }
  .event-grid .label { font-weight: bold; color: #555; min-width: 100px; }
  .section-title { font-size: 13px; font-weight: bold; color: #1e40af; margin: 15px 0 8px; padding: 5px 0; border-bottom: 1px solid #e2e8f0; }
  .items-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
  .items-table th { background: #f1f5f9; text-align: left; padding: 6px 8px; font-size: 11px; color: #555; border-bottom: 2px solid #e2e8f0; }
  .items-table td { padding: 5px 8px; border-bottom: 1px solid #f1f5f9; font-size: 11px; }
  .items-table td:last-child, .items-table th:last-child { text-align: right; }
  .totals { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-top: 20px; }
  .totals .row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 12px; }
  .totals .row.total { font-size: 16px; font-weight: bold; color: #1e40af; border-top: 2px solid #2563eb; padding-top: 8px; margin-top: 5px; }
  .totals .row.discount { color: #16a34a; }
  .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 10px; color: #999; }
  @page { size: A4; margin: 15mm; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .header { page-break-after: avoid; }
    .items-table { page-break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="header">
  ${logoBase64 ? `<img src="${logoBase64}" class="logo" />` : '<div><h2>SAID Audio</h2></div>'}
  <div class="header-info">
    <h1>Proposta Comercial</h1>
    <p><strong>${orcamento.numero_orcamento}</strong></p>
    <p>Data: ${new Date().toLocaleDateString("pt-BR")}</p>
    <p>Validade: ${orcamento.validade_dias} dias</p>
  </div>
</div>

<div class="content">
  <div class="event-info">
    <h2>${orcamento.nome_evento}</h2>
    <div class="event-grid">
      <div class="item"><span class="label">Nº Orçamento:</span> ${orcamento.numero_orcamento}</div>
      <div class="item"><span class="label">Data:</span> ${new Date().toLocaleDateString("pt-BR")}</div>
      <div class="item"><span class="label">Razão Social:</span> ${orcamento.cliente?.nome || "-"}</div>
      <div class="item"><span class="label">CNPJ/CPF:</span> ${orcamento.cliente?.cpf_cnpj || "-"}</div>
      <div class="item"><span class="label">Contato:</span> ${orcamento.cliente?.contato || "-"}</div>
      <div class="item"><span class="label">Telefone:</span> ${orcamento.cliente?.telefone || "-"}</div>
      <div class="item"><span class="label">Local:</span> ${orcamento.local || "-"}</div>
      <div class="item"><span class="label">Horário:</span> ${orcamento.hora_inicio} às ${orcamento.hora_fim}</div>
      <div class="item"><span class="label">Participantes:</span> ${orcamento.participantes || "-"}</div>
    </div>
  </div>

  ${itensHtml}

  <div class="totals">
    ${categoriasOrdem.map((cat) => {
      const subtotal = (itens || []).filter((i: any) => i.categoria === cat).reduce((s: number, i: any) => s + i.subtotal, 0);
      if (!subtotal) return "";
      return `<div class="row"><span>Subtotal ${cat}</span><span>${formatCurrency(subtotal)}</span></div>`;
    }).join("")}
    <div class="row"><span>Subtotal Geral</span><span>${formatCurrency(orcamento.subtotal_geral || 0)}</span></div>
    ${orcamento.transporte > 0 ? `<div class="row"><span>Transporte</span><span>${formatCurrency(orcamento.transporte)}</span></div>` : ""}
    ${orcamento.desconto > 0 ? `<div class="row discount"><span>Desconto</span><span>-${formatCurrency(orcamento.desconto)}</span></div>` : ""}
    ${orcamento.impostos > 0 ? `<div class="row"><span>Impostos/Taxa</span><span>${formatCurrency(orcamento.impostos)}</span></div>` : ""}
    <div class="row total"><span>TOTAL</span><span>${formatCurrency(orcamento.total || 0)}</span></div>
  </div>


  <div class="footer">
    <p>SAID Audio - Locação de Equipamentos Audiovisual e Tradução Simultânea</p>
    <p>Este orçamento tem validade de ${orcamento.validade_dias} dias a partir da data de emissão.</p>
  </div>
</div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="${orcamento.numero_orcamento}.html"`,
    },
  });
}
