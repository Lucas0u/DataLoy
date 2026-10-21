import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { getSaleCustomerName } from "./saleCustomer";
import {
  getChargedAmount,
  getPaymentMethod,
  summarizeByPaymentMethod,
} from "./payment";

// O jsPDF não lida bem com o espaço especial que o Intl coloca após "R$"
function clean(text) {
  return String(text ?? "").replace(/ | /g, " ");
}

function formatCurrency(value) {
  return clean(
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value) || 0)
  );
}

function formatNumber(value) {
  return clean(Number(value || 0).toLocaleString("pt-BR"));
}

function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);

  return `${date.toLocaleDateString("pt-BR")} ${date.toLocaleTimeString(
    "pt-BR",
    { hour: "2-digit", minute: "2-digit" }
  )}`;
}

// Alinha o título da coluna igual aos valores dela
function alignHeaders(alignments) {
  return (data) => {
    if (data.section === "head" && alignments[data.column.index]) {
      data.cell.styles.halign = alignments[data.column.index];
    }
  };
}

const COLORS = {
  text: [15, 23, 42],
  muted: [100, 116, 139],
  border: [226, 232, 240],
  header: [79, 70, 229],
  stripe: [248, 250, 252],
};

/**
 * Monta o PDF do relatório de vendas.
 *
 * @param {Object} options
 * @param {Array}  options.sales        vendas do período (já filtradas pela API)
 * @param {Object} options.summary      resumo retornado pela API
 * @param {string} options.periodLabel  ex.: "01/10/2026 até 16/10/2026"
 * @param {string} [options.customerName] cliente filtrado, se houver
 * @param {string} [options.generatedBy]  usuário que gerou o relatório
 * @returns {jsPDF}
 */
export function buildSalesReportPdf({
  sales = [],
  summary = {},
  periodLabel,
  customerName,
  generatedBy,
}) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  // Cabeçalho
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.text);
  doc.text("Relatório de Vendas", margin, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.muted);

  const infoLines = [`Período: ${periodLabel || "Todo o período"}`];

  if (customerName) infoLines.push(`Cliente: ${customerName}`);

  infoLines.push(
    `Gerado em ${formatDateTime(new Date())}${
      generatedBy ? ` por ${generatedBy}` : ""
    }`
  );

  doc.text(infoLines, margin, 25);

  let cursorY = 25 + infoLines.length * 5 + 3;

  // Totais calculados a partir das vendas (valor cobrado)
  const totalCharged = sales.reduce(
    (total, sale) => total + getChargedAmount(sale),
    0
  );
  const totalDiscounts = sales.reduce(
    (total, sale) => total + (Number(sale.discount_amount) || 0),
    0
  );
  const totalPoints = sales.reduce(
    (total, sale) => total + (Number(sale.points_earned) || 0),
    0
  );
  const totalSales = summary.total_sales ?? sales.length;
  const averageTicket = totalSales > 0 ? totalCharged / totalSales : 0;

  // Resumo
  autoTable(doc, {
    startY: cursorY,
    margin: { left: margin, right: margin },
    theme: "grid",
    head: [
      [
        "Vendas",
        "Faturamento",
        "Ticket médio",
        "Clientes atendidos",
        "Pontos gerados",
      ],
    ],
    body: [
      [
        formatNumber(totalSales),
        formatCurrency(summary.total_revenue ?? totalCharged),
        formatCurrency(summary.average_ticket ?? averageTicket),
        formatNumber(summary.customers_count),
        `${formatNumber(summary.total_points_generated ?? totalPoints)} pts`,
      ],
    ],
    styles: {
      fontSize: 10,
      halign: "center",
      textColor: COLORS.text,
      lineColor: COLORS.border,
    },
    headStyles: { fillColor: COLORS.header, textColor: 255, fontStyle: "bold" },
    bodyStyles: { fontStyle: "bold" },
  });

  cursorY = doc.lastAutoTable.finalY + 8;

  // Por forma de pagamento
  const byMethod =
    summary.by_payment_method && summary.by_payment_method.length
      ? summary.by_payment_method
      : summarizeByPaymentMethod(sales);

  if (byMethod.length) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...COLORS.text);
    doc.text("Vendas por forma de pagamento", margin, cursorY);

    const grandTotal = byMethod.reduce(
      (sum, item) => sum + (Number(item.total) || 0),
      0
    );

    autoTable(doc, {
      startY: cursorY + 3,
      margin: { left: margin, right: margin },
      tableWidth: 150,
      theme: "striped",
      head: [["Forma de pagamento", "Vendas", "Valor cobrado", "Participação"]],
      body: byMethod.map((item) => {
        const total = Number(item.total) || 0;
        const share = grandTotal > 0 ? (total / grandTotal) * 100 : 0;

        return [
          getPaymentMethod(item.payment_method).label,
          formatNumber(item.sales_count),
          formatCurrency(total),
          `${clean(share.toLocaleString("pt-BR", { maximumFractionDigits: 1 }))}%`,
        ];
      }),
      styles: { fontSize: 9, textColor: COLORS.text },
      headStyles: { fillColor: COLORS.header, textColor: 255 },
      alternateRowStyles: { fillColor: COLORS.stripe },
      columnStyles: {
        1: { halign: "center" },
        2: { halign: "right" },
        3: { halign: "right" },
      },
      didParseCell: alignHeaders({ 1: "center", 2: "right", 3: "right" }),
    });

    cursorY = doc.lastAutoTable.finalY + 8;
  }

  // Detalhamento das vendas
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.text);
  doc.text("Detalhamento das vendas", margin, cursorY);

  autoTable(doc, {
    startY: cursorY + 3,
    margin: { left: margin, right: margin, bottom: 16 },
    theme: "striped",
    head: [
      [
        "Venda",
        "Data",
        "Cliente",
        "Colaborador",
        "Pagamento",
        "Desconto",
        "Valor cobrado",
        "Pontos",
      ],
    ],
    body: sales.length
      ? sales.map((sale) => [
          `#${sale.id}`,
          formatDateTime(sale.created_at),
          getSaleCustomerName(sale),
          sale.user?.name || "Não informado",
          getPaymentMethod(sale.payment_method).label,
          Number(sale.discount_amount) > 0
            ? `-${formatCurrency(sale.discount_amount)}`
            : "-",
          formatCurrency(getChargedAmount(sale)),
          `${formatNumber(sale.points_earned)} pts`,
        ])
      : [
          [
            {
              content: "Nenhuma venda encontrada no período.",
              colSpan: 8,
              styles: { halign: "center", textColor: COLORS.muted },
            },
          ],
        ],
    foot: sales.length
      ? [
          [
            {
              content: "Total do período",
              colSpan: 5,
              styles: { halign: "right" },
            },
            totalDiscounts > 0 ? `-${formatCurrency(totalDiscounts)}` : "-",
            formatCurrency(totalCharged),
            `${formatNumber(totalPoints)} pts`,
          ],
        ]
      : undefined,
    showFoot: "lastPage",
    styles: { fontSize: 9, textColor: COLORS.text, cellPadding: 2.2 },
    headStyles: { fillColor: COLORS.header, textColor: 255 },
    footStyles: {
      fillColor: [238, 242, 255],
      textColor: COLORS.text,
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: COLORS.stripe },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 34 },
      4: { cellWidth: 26 },
      5: { halign: "right", cellWidth: 28 },
      6: { halign: "right", cellWidth: 32 },
      7: { halign: "right", cellWidth: 24 },
    },
    didParseCell: alignHeaders({ 5: "right", 6: "right", 7: "right" }),
  });

  // Rodapé com numeração em todas as páginas
  const pageCount = doc.getNumberOfPages();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text("DataLoy · Relatório de Vendas", margin, pageHeight - 8);
    doc.text(
      `Página ${page} de ${pageCount}`,
      pageWidth - margin,
      pageHeight - 8,
      {
        align: "right",
      }
    );
  }

  return doc;
}
