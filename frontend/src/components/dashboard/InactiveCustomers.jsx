import { Clock3, UserRound } from "lucide-react";

export default function InactiveCustomers({ data = [] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Clientes inativos
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Clientes ativos sem compras recentes.
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
          <Clock3 size={20} />
        </div>
      </div>

      {/* Lista */}
      <div className="mt-6">
        {data.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <UserRound size={21} />
            </div>

            <p className="mt-3 text-sm font-medium text-slate-600">
              Nenhum cliente inativo
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Todos os clientes estão ativos recentemente.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.slice(0, 10).map((customer) => (
              <div
                key={customer.id}
                className="flex items-center gap-4 rounded-xl border border-slate-100 p-3 transition hover:bg-slate-50"
              >
                {/* Avatar */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-50 text-sm font-semibold text-violet-600">
                  {customer.name?.charAt(0)?.toUpperCase() || "?"}
                </div>

                {/* Cliente */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {customer.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Sem compras nos últimos 30 dias
                  </p>
                </div>

                {/* Status */}
                <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-600">
                  Inativo
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
