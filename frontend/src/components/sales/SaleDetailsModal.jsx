import { X } from "lucide-react";

export default function SaleDetailsModal({ sale, onClose }) {
  if (!sale) return null;

  function formatCurrency(value) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value) || 0);
  }

  function formatDate(value) {
    if (!value) return "-";

    return new Date(value).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Detalhes da venda
            </h2>

            <p className="mt-1 text-sm text-slate-500">Venda #{sale.id}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Informações */}
        <div className="space-y-6 p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Cliente
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-800">
                {sale.customer?.name || "Cliente não informado"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Data
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-800">
                {formatDate(sale.created_at)}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Registrada por
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-800">
                {sale.user?.name || "-"}
              </p>
            </div>
          </div>

          {/* Itens */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Itens da venda
            </h3>

            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
              {sale.sale_items?.length ? (
                <div className="divide-y divide-slate-100">
                  {sale.sale_items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {item.product_name}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {item.quantity} × {formatCurrency(item.unit_price)}
                        </p>
                      </div>

                      <p className="shrink-0 text-sm font-semibold text-slate-900">
                        {formatCurrency(
                          Number(item.quantity) * Number(item.unit_price)
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="px-4 py-6 text-center text-sm text-slate-400">
                  Nenhum item encontrado.
                </p>
              )}
            </div>
          </div>

          {/* Resumo */}
          <div className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Pontos gerados
              </p>

              <p className="mt-1 text-lg font-bold text-indigo-600">
                {sale.points_earned || 0} pontos
              </p>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Total da venda
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                {formatCurrency(sale.total_amount)}
              </p>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="flex justify-end border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
