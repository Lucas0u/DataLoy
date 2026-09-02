import { ArrowDownLeft, ArrowUpRight, SlidersHorizontal } from "lucide-react";

function formatDate(value) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getTransactionInfo(type) {
  if (type === "earned") {
    return {
      label: "Ganhos",
      icon: ArrowUpRight,
      className: "bg-emerald-50 text-emerald-600",
    };
  }

  if (type === "redeemed") {
    return {
      label: "Resgate",
      icon: ArrowDownLeft,
      className: "bg-violet-50 text-violet-600",
    };
  }

  return {
    label: "Ajuste",
    icon: SlidersHorizontal,
    className: "bg-slate-100 text-slate-600",
  };
}

export default function PointsHistoryTable({ transactions = [] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-5">
        <h2 className="text-lg font-semibold text-slate-900">
          Histórico de pontos
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Movimentações recentes de pontos dos clientes.
        </p>
      </div>

      {transactions.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center px-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <SlidersHorizontal size={20} />
          </div>

          <p className="mt-3 text-sm font-medium text-slate-600">
            Nenhuma movimentação encontrada
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Ainda não existem movimentações de pontos.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Tipo
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Cliente
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Pontos
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Saldo após
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Descrição
                </th>

                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Data
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {transactions.map((transaction) => {
                const info = getTransactionInfo(transaction.transaction_type);

                const Icon = info.icon;

                return (
                  <tr
                    key={transaction.id}
                    className="transition hover:bg-slate-50/70"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-lg ${info.className}`}
                        >
                          <Icon size={17} />
                        </div>

                        <span className="text-sm font-medium text-slate-700">
                          {info.label}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-slate-800">
                        {transaction.customer?.name || "-"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`text-sm font-semibold ${
                          transaction.points >= 0
                            ? "text-emerald-600"
                            : "text-violet-600"
                        }`}
                      >
                        {transaction.points > 0 ? "+" : ""}
                        {transaction.points}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-700">
                        {transaction.balance_after}
                      </span>
                    </td>

                    <td className="max-w-[240px] px-6 py-4">
                      <span className="block truncate text-sm text-slate-500">
                        {transaction.description || "-"}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <span className="text-sm text-slate-500">
                        {formatDate(transaction.created_at)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
