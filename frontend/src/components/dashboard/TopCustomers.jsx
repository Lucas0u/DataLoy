import { Medal, ShoppingCart, Trophy } from "lucide-react";

export default function TopCustomers({ data = [] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Top clientes</h2>

          <p className="mt-1 text-sm text-slate-500">
            Clientes com maior volume de compras.
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Trophy size={20} />
        </div>
      </div>

      {/* Lista */}
      <div className="mt-6">
        {data.length === 0 ? (
          <div className="flex h-48 items-center justify-center">
            <p className="text-sm text-slate-400">Nenhuma compra registrada.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.slice(0, 5).map((customer, index) => (
              <div
                key={customer.id}
                className="flex items-center gap-4 rounded-xl border border-slate-100 p-3 transition hover:bg-slate-50"
              >
                {/* Posição */}
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    index === 0
                      ? "bg-indigo-50 text-indigo-600"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {index === 0 ? (
                    <Medal size={19} />
                  ) : (
                    <span className="text-sm font-semibold">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  )}
                </div>

                {/* Cliente */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {customer.name}
                  </p>

                  <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                    <ShoppingCart size={13} />

                    <span>
                      {customer.sales_count}{" "}
                      {customer.sales_count === 1 ? "venda" : "vendas"}
                    </span>
                  </div>
                </div>

                {/* Total gasto */}
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(customer.total_spent || 0)}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">Total gasto</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
