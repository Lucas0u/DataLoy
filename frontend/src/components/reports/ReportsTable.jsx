import { FileText, Star, Users } from "lucide-react";

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
  if (!value) return "-";

  const date = new Date(value);

  return {
    date: date.toLocaleDateString("pt-BR"),
    time: date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

export default function ReportsTable({ sales = [] }) {
  const totalRevenue = sales.reduce(
    (total, sale) => total + (Number(sale.total_amount) || 0),
    0
  );

  const totalPoints = sales.reduce(
    (total, sale) => total + (Number(sale.points_earned) || 0),
    0
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <FileText size={19} />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Detalhamento das vendas
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Vendas consideradas no relatório atual.
            </p>
          </div>
        </div>

        {sales.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Users size={16} />
            <span>
              {formatNumber(sales.length)}{" "}
              {sales.length === 1 ? "venda encontrada" : "vendas encontradas"}
            </span>
          </div>
        )}
      </div>

      {/* Estado vazio */}
      {sales.length === 0 ? (
        <div className="flex min-h-[280px] flex-col items-center justify-center px-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <FileText size={22} />
          </div>

          <p className="mt-4 text-sm font-semibold text-slate-600">
            Nenhuma venda encontrada
          </p>

          <p className="mt-1 text-center text-sm text-slate-400">
            Tente ajustar o período ou os filtros utilizados no relatório.
          </p>
        </div>
      ) : (
        <>
          {/* Tabela */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr className="text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-6 py-3.5 font-semibold">Venda</th>
                  <th className="px-6 py-3.5 font-semibold">Data</th>
                  <th className="px-6 py-3.5 font-semibold">Cliente</th>
                  <th className="px-6 py-3.5 font-semibold">Colaborador</th>
                  <th className="px-6 py-3.5 text-right font-semibold">
                    Valor
                  </th>
                  <th className="px-6 py-3.5 text-right font-semibold">
                    Pontos
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {sales.map((sale) => {
                  const date = formatDate(sale.created_at);

                  return (
                    <tr key={sale.id} className="transition hover:bg-slate-50">
                      {/* Venda */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                          #{sale.id}
                        </span>
                      </td>

                      {/* Data */}
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-700">
                          {date.date}
                        </div>

                        <div className="mt-0.5 text-xs text-slate-400">
                          {date.time}
                        </div>
                      </td>

                      {/* Cliente */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-700">
                          {sale.customer?.name || "Cliente não informado"}
                        </div>
                      </td>

                      {/* Colaborador */}
                      <td className="px-6 py-4 text-slate-500">
                        {sale.user?.name || "Não informado"}
                      </td>

                      {/* Valor */}
                      <td className="px-6 py-4 text-right">
                        <span className="font-semibold text-slate-800">
                          {formatCurrency(sale.total_amount)}
                        </span>
                      </td>

                      {/* Pontos */}
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-indigo-600">
                          <Star size={14} />
                          {formatNumber(sale.points_earned)} pts
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Totalizadores */}
              <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-4 text-right text-sm font-semibold text-slate-600"
                  >
                    Total do período
                  </td>

                  <td className="px-6 py-4 text-right text-sm font-bold text-slate-900">
                    {formatCurrency(totalRevenue)}
                  </td>

                  <td className="px-6 py-4 text-right text-sm font-bold text-indigo-600">
                    {formatNumber(totalPoints)} pts
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Rodapé */}
          <div className="flex flex-col gap-2 border-t border-slate-100 px-6 py-4 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Os valores apresentados correspondem aos filtros aplicados.
            </span>

            <span>
              {formatNumber(sales.length)}{" "}
              {sales.length === 1 ? "registro" : "registros"}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
