import {
  DollarSign,
  ShoppingCart,
  Star,
  Users,
  TrendingUp,
  Trophy,
} from "lucide-react";

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value) || 0);
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("pt-BR");
}

export default function ReportSummary({ summary = {} }) {
  const cards = [
    {
      title: "Total de vendas",
      value: formatNumber(summary.total_sales),
      description: "Vendas no período selecionado",
      icon: ShoppingCart,
      iconClass: "bg-blue-50 text-blue-600",
    },
    {
      title: "Faturamento",
      value: formatCurrency(summary.total_revenue),
      description: "Receita total das vendas",
      icon: DollarSign,
      iconClass: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Ticket médio",
      value: formatCurrency(summary.average_ticket),
      description: "Valor médio por venda",
      icon: TrendingUp,
      iconClass: "bg-indigo-50 text-indigo-600",
    },
    {
      title: "Clientes atendidos",
      value: formatNumber(summary.customers_count),
      description: "Clientes com compras no período",
      icon: Users,
      iconClass: "bg-violet-50 text-violet-600",
    },
    {
      title: "Pontos gerados",
      value: `${formatNumber(summary.total_points_generated)} pts`,
      description: "Pontos concedidos nas vendas",
      icon: Star,
      iconClass: "bg-amber-50 text-amber-600",
    },
    {
      title: "Maior venda",
      value: formatCurrency(summary.highest_sale),
      description: "Maior valor registrado no período",
      icon: Trophy,
      iconClass: "bg-rose-50 text-rose-600",
    },
  ];

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500">
                  {card.title}
                </p>

                <p className="mt-2 truncate text-2xl font-bold text-slate-900">
                  {card.value}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {card.description}
                </p>
              </div>

              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.iconClass}`}
              >
                <Icon size={19} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
