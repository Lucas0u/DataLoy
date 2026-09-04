import {
  CalendarDays,
  Download,
  Filter,
  RotateCcw,
  UserRound,
  Users,
  ArrowUpDown,
} from "lucide-react";

function formatDate(value) {
  if (!value) return "";

  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export default function ReportFilters({
  filters,
  appliedFilters,
  customers = [],
  onChange,
  onApply,
  onClear,
  onExport,
  loading = false,
  showStatus = false,
  showTransactionType = false,
}) {
  const hasAppliedFilters =
    appliedFilters?.start_date ||
    appliedFilters?.end_date ||
    appliedFilters?.customer_id ||
    appliedFilters?.status ||
    appliedFilters?.transaction_type;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-6">
        {/* Cabeçalho */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Filter size={19} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Filtros do relatório
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Defina os critérios que deseja utilizar na análise.
              </p>
            </div>
          </div>

          {hasAppliedFilters && (
            <span className="inline-flex w-fit items-center rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600">
              Filtros aplicados
            </span>
          )}
        </div>

        {/* Campos */}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onApply();
          }}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          {/* Data inicial */}
          <div>
            <label
              htmlFor="report-start-date"
              className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-600"
            >
              <CalendarDays size={15} />
              Data inicial
            </label>

            <input
              id="report-start-date"
              type="date"
              value={filters.start_date}
              max={filters.end_date || undefined}
              onChange={(event) => onChange("start_date", event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>

          {/* Data final */}
          <div>
            <label
              htmlFor="report-end-date"
              className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-600"
            >
              <CalendarDays size={15} />
              Data final
            </label>

            <input
              id="report-end-date"
              type="date"
              value={filters.end_date}
              min={filters.start_date || undefined}
              onChange={(event) => onChange("end_date", event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>

          {/* Cliente */}
          <div>
            <label
              htmlFor="report-customer"
              className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-600"
            >
              <UserRound size={15} />
              Cliente
            </label>

            <select
              id="report-customer"
              value={filters.customer_id}
              onChange={(event) => onChange("customer_id", event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            >
              <option value="">Todos os clientes</option>

              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status - somente Clientes */}
          {showStatus && (
            <div>
              <label
                htmlFor="report-status"
                className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-600"
              >
                <Users size={15} />
                Status
              </label>

              <select
                id="report-status"
                value={filters.status}
                onChange={(event) => onChange("status", event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              >
                <option value="">Todos os status</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
              </select>
            </div>
          )}

          {/* Tipo - Pontos e Movimentações */}
          {showTransactionType && (
            <div>
              <label
                htmlFor="report-transaction-type"
                className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-600"
              >
                <ArrowUpDown size={15} />
                Tipo
              </label>

              <select
                id="report-transaction-type"
                value={filters.transaction_type}
                onChange={(event) =>
                  onChange("transaction_type", event.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              >
                <option value="">Todos os tipos</option>
                <option value="earned">Ganhos</option>
                <option value="redeemed">Resgates</option>
                <option value="adjustment">Ajustes</option>
              </select>
            </div>
          )}

          {/* Botões */}
          <div className="flex items-end gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Filter size={17} />
              {loading ? "Processando..." : "Aplicar filtros"}
            </button>

            <button
              type="button"
              onClick={onClear}
              disabled={loading}
              title="Limpar filtros"
              aria-label="Limpar filtros"
              className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw size={17} />
            </button>
          </div>
        </form>

        {/* Critérios selecionados */}
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
          <div className="flex flex-col gap-1 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span className="font-medium text-slate-600">
              Critérios selecionados
            </span>

            <span>
              {filters.start_date && filters.end_date
                ? `${formatDate(filters.start_date)} até ${formatDate(
                    filters.end_date
                  )}`
                : filters.start_date
                  ? `A partir de ${formatDate(filters.start_date)}`
                  : filters.end_date
                    ? `Até ${formatDate(filters.end_date)}`
                    : "Todo o período"}
            </span>
          </div>
        </div>

        {/* Exportação */}
        {onExport && (
          <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">
                Exportar relatório
              </p>

              <p className="mt-0.5 text-xs text-slate-400">
                O arquivo utilizará os filtros atualmente aplicados.
              </p>
            </div>

            <button
              type="button"
              onClick={onExport}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={17} />

              {loading ? "Preparando..." : "Exportar Excel"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
