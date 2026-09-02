import {
  ArrowDownCircle,
  ArrowUpCircle,
  CircleDollarSign,
  History,
  Star,
  Users,
  Wrench,
} from "lucide-react";

function formatNumber(value) {
  return Number(value || 0).toLocaleString("pt-BR");
}

function formatDate(value) {
  if (!value) return "Nunca";

  return new Date(value).toLocaleDateString("pt-BR");
}

export default function PointsReport({ report }) {
  const summary = report?.summary || {};
  const customers = report?.customers || [];

  const cards = [
    {
      title: "Pontos gerados",
      value: formatNumber(summary.total_earned),
      description: "Pontos acumulados pelos clientes",
      icon: ArrowUpCircle,
      iconClass: "text-emerald-600",
      bgClass: "bg-emerald-50",
    },
    {
      title: "Pontos resgatados",
      value: formatNumber(summary.total_redeemed),
      description: "Pontos utilizados em recompensas",
      icon: ArrowDownCircle,
      iconClass: "text-orange-600",
      bgClass: "bg-orange-50",
    },
    {
      title: "Ajustes de pontos",
      value: formatNumber(summary.total_adjustments),
      description: "Ajustes registrados no sistema",
      icon: Wrench,
      iconClass: "text-blue-600",
      bgClass: "bg-blue-50",
    },
    {
      title: "Transações",
      value: formatNumber(summary.total_transactions),
      description: "Movimentações de pontos",
      icon: History,
      iconClass: "text-purple-600",
      bgClass: "bg-purple-50",
    },
    {
      title: "Clientes com pontos",
      value: formatNumber(summary.customers_with_points),
      description: "Clientes com movimentação",
      icon: Users,
      iconClass: "text-indigo-600",
      bgClass: "bg-indigo-50",
    },
    {
      title: "Saldo atual",
      value: formatNumber(summary.current_balance),
      description: "Pontos disponíveis na base",
      icon: CircleDollarSign,
      iconClass: "text-slate-600",
      bgClass: "bg-slate-100",
    },
  ];

  return (
    <section className="mt-8">
      {/* Cabeçalho */}
      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-900">
          Relatório de pontos
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Acompanhe a movimentação, utilização e saldo de pontos dos clientes.
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

                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.bgClass} ${card.iconClass}`}
                >
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
            Movimentação por cliente
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Resumo dos pontos acumulados, utilizados e ajustados por cliente.
          </p>
        </div>

        {customers.length === 0 ? (
          <div className="flex min-h-[220px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Star size={22} />
              </div>

              <p className="mt-4 text-sm font-semibold text-slate-600">
                Nenhuma movimentação encontrada
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Ainda não existem transações de pontos registradas.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr className="text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-6 py-3.5 font-semibold">Cliente</th>

                    <th className="px-6 py-3.5 font-semibold">Status</th>

                    <th className="px-6 py-3.5 text-right font-semibold">
                      Saldo atual
                    </th>

                    <th className="px-6 py-3.5 text-right font-semibold">
                      Pontos ganhos
                    </th>

                    <th className="px-6 py-3.5 text-right font-semibold">
                      Resgatados
                    </th>

                    <th className="px-6 py-3.5 text-right font-semibold">
                      Ajustados
                    </th>

                    <th className="px-6 py-3.5 text-right font-semibold">
                      Última movimentação
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="transition hover:bg-slate-50"
                    >
                      {/* Cliente */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-700">
                          {customer.name}
                        </div>

                        <div className="mt-0.5 text-xs text-slate-400">
                          Cliente #{customer.id}
                        </div>
                      </td>

                      {/* Status */}
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

                      {/* Saldo */}
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center gap-1.5 font-bold text-indigo-600">
                          <Star size={14} />
                          {formatNumber(customer.points_balance)} pts
                        </span>
                      </td>

                      {/* Ganhos */}
                      <td className="px-6 py-4 text-right font-semibold text-emerald-600">
                        +{formatNumber(customer.points_earned)}
                      </td>

                      {/* Resgatados */}
                      <td className="px-6 py-4 text-right font-semibold text-orange-600">
                        -{formatNumber(customer.points_redeemed)}
                      </td>

                      {/* Ajustes */}
                      <td className="px-6 py-4 text-right font-semibold text-blue-600">
                        {formatNumber(customer.points_adjusted)}
                      </td>

                      {/* Última transação */}
                      <td className="px-6 py-4 text-right text-slate-500">
                        {formatDate(customer.last_transaction)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Rodapé */}
            <div className="flex flex-col gap-2 border-t border-slate-100 px-6 py-4 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Os dados representam as movimentações registradas no sistema.
              </span>

              <span>
                {formatNumber(customers.length)}{" "}
                {customers.length === 1
                  ? "cliente analisado"
                  : "clientes analisados"}
              </span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
