import {
  Activity,
  CircleDollarSign,
  Crown,
  UserCheck,
  UserX,
  Users,
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

function formatDate(value) {
  if (!value) return "Nunca";

  return new Date(value).toLocaleDateString("pt-BR");
}

export default function CustomerReport({ report }) {
  const summary = report?.summary || {};
  const customers = report?.customers || [];

  const cards = [
    {
      title: "Total de clientes",
      value: formatNumber(summary.total_customers),
      description: "Clientes cadastrados",
      icon: Users,
    },
    {
      title: "Clientes ativos",
      value: formatNumber(summary.active_customers),
      description: "Base ativa",
      icon: UserCheck,
    },
    {
      title: "Clientes inativos",
      value: formatNumber(summary.inactive_customers),
      description: "Base inativa",
      icon: UserX,
    },
    {
      title: "Clientes compradores",
      value: formatNumber(summary.customers_with_sales),
      description: "Já realizaram compras",
      icon: Activity,
    },
    {
      title: "Faturamento da base",
      value: formatCurrency(summary.total_revenue),
      description: "Total das vendas",
      icon: CircleDollarSign,
    },
    {
      title: "Ticket médio",
      value: formatCurrency(summary.average_ticket),
      description: "Média por compra",
      icon: Crown,
    },
  ];

  return (
    <section className="mt-8">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-900">
          Relatório de clientes
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Visão geral do comportamento e da atividade dos clientes.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {card.title}
                  </p>

                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {card.value}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {card.description}
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <Icon size={19} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabela */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h3 className="text-lg font-semibold text-slate-900">
            Desempenho por cliente
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Clientes ordenados pelo valor total gasto.
          </p>
        </div>

        {customers.length === 0 ? (
          <div className="flex min-h-[220px] items-center justify-center">
            <p className="text-sm text-slate-400">Nenhum cliente encontrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr className="text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-6 py-3.5 font-semibold">Cliente</th>

                  <th className="px-6 py-3.5 font-semibold">Status</th>

                  <th className="px-6 py-3.5 text-right font-semibold">
                    Compras
                  </th>

                  <th className="px-6 py-3.5 text-right font-semibold">
                    Total gasto
                  </th>

                  <th className="px-6 py-3.5 text-right font-semibold">
                    Ticket médio
                  </th>

                  <th className="px-6 py-3.5 text-right font-semibold">
                    Pontos
                  </th>

                  <th className="px-6 py-3.5 text-right font-semibold">
                    Última compra
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-700">
                        {customer.name}
                      </div>

                      <div className="mt-0.5 text-xs text-slate-400">
                        {customer.email || customer.phone || "Sem contato"}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {customer.status === "active" ? (
                        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                          Inativo
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right font-medium text-slate-700">
                      {formatNumber(customer.purchase_count)}
                    </td>

                    <td className="px-6 py-4 text-right font-semibold text-slate-800">
                      {formatCurrency(customer.total_spent)}
                    </td>

                    <td className="px-6 py-4 text-right text-slate-600">
                      {formatCurrency(customer.average_ticket)}
                    </td>

                    <td className="px-6 py-4 text-right font-semibold text-indigo-600">
                      {formatNumber(customer.points_balance)} pts
                    </td>

                    <td className="px-6 py-4 text-right text-slate-500">
                      {formatDate(customer.last_purchase)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
