import { Eye, ShoppingCart } from "lucide-react";

export default function SalesTable({ sales = [], onView }) {
  function formatCurrency(value) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value) || 0);
  }

  function formatDate(date) {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Cliente
              </th>

              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Data
              </th>

              <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                Itens
              </th>

              <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                Valor
              </th>

              <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                Pontos
              </th>

              <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                Ações
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {sales.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-16">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
                      <ShoppingCart size={24} />
                    </div>

                    <h3 className="mt-4 text-sm font-semibold text-slate-800">
                      Nenhuma venda encontrada
                    </h3>

                    <p className="mt-1 text-sm text-slate-400">
                      As vendas registradas aparecerão aqui.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              sales.map((sale) => (
                <tr
                  key={sale.id}
                  className="transition-colors hover:bg-slate-50/70"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {sale.customer?.name || "Cliente não informado"}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-400">
                        Venda #{sale.id}
                      </p>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-600">
                    {formatDate(sale.created_at)}
                  </td>

                  <td className="px-6 py-4 text-center text-sm text-slate-600">
                    {sale.sale_items?.length || 0}
                  </td>

                  <td className="px-6 py-4 text-right text-sm font-semibold text-slate-800">
                    {formatCurrency(sale.total_amount)}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <span className="font-semibold text-indigo-600">
                      +{sale.points_earned || 0}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => onView?.(sale)}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600"
                        title="Visualizar venda"
                        aria-label={`Visualizar venda ${sale.id}`}
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
