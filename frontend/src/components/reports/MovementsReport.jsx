import { ArrowDownCircle, ArrowUpCircle, History, Wrench } from "lucide-react";

const TYPE_CONFIG = {
  earned: {
    label: "Pontos ganhos",
    icon: ArrowUpCircle,
    color: "text-emerald-600 bg-emerald-50",
  },
  redeemed: {
    label: "Resgate de pontos",
    icon: ArrowDownCircle,
    color: "text-red-500 bg-red-50",
  },
  adjustment: {
    label: "Ajuste",
    icon: Wrench,
    color: "text-amber-600 bg-amber-50",
  },
};

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value) || 0);
}

function formatDateTime(value) {
  return new Date(value).toLocaleString("pt-BR");
}

export default function MovementsReport({ report }) {
  const summary = report?.summary || {};
  const movements = report?.movements || [];

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Total de movimentações
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {summary.total_movements ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Pontos ganhos</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            +{summary.total_earned ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Pontos resgatados
          </p>
          <p className="mt-2 text-2xl font-bold text-red-500">
            -{summary.total_redeemed ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Ajustes manuais</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">
            {summary.total_adjustments ?? 0}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {movements.length === 0 ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center">
            <History size={30} className="text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-500">
              Nenhuma movimentação encontrada para o período selecionado.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-6 py-3 font-semibold">Data</th>
                <th className="px-6 py-3 font-semibold">Tipo</th>
                <th className="px-6 py-3 font-semibold">Cliente</th>
                <th className="px-6 py-3 font-semibold">Descrição</th>
                <th className="px-6 py-3 font-semibold">Colaborador</th>
                <th className="px-6 py-3 text-right font-semibold">Pontos</th>
                <th className="px-6 py-3 text-right font-semibold">
                  Saldo após
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movements.map((mv) => {
                const config = TYPE_CONFIG[mv.type] || TYPE_CONFIG.adjustment;
                const Icon = config.icon;

                return (
                  <tr key={mv.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-6 py-3.5 text-slate-500">
                      {formatDateTime(mv.date)}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${config.color}`}
                      >
                        <Icon size={13} />
                        {config.label}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-medium text-slate-800">
                      {mv.customer || "—"}
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">
                      {mv.description}
                      {mv.sale_amount != null && (
                        <span className="ml-1 text-xs text-slate-400">
                          ({formatCurrency(mv.sale_amount)})
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">
                      {mv.user || "—"}
                    </td>
                    <td
                      className={`px-6 py-3.5 text-right font-semibold ${
                        mv.points >= 0 ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {mv.points >= 0 ? `+${mv.points}` : mv.points}
                    </td>
                    <td className="px-6 py-3.5 text-right text-slate-500">
                      {mv.balance_after}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
