import { Wallet } from "lucide-react";
import { getPaymentMethod } from "../../utils/payment";

const BAR_COLORS = {
  pix: "bg-teal-500",
  dinheiro: "bg-emerald-500",
  cartao: "bg-indigo-500",
};

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value) || 0);
}

// data: [{ payment_method, sales_count, total }]
// total = soma dos valores efetivamente cobrados
export default function PaymentMethodsSummary({
  data = [],
  title = "Vendas por forma de pagamento",
  description = "Valor cobrado em cada meio de pagamento.",
}) {
  const grandTotal = data.reduce(
    (sum, item) => sum + (Number(item.total) || 0),
    0
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Wallet size={19} />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
      </div>

      {data.length === 0 ? (
        <p className="mt-6 text-center text-sm text-slate-400">
          Nenhuma venda com forma de pagamento registrada.
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {data.map((item) => {
            const { label, icon: Icon } = getPaymentMethod(item.payment_method);
            const total = Number(item.total) || 0;
            const share = grandTotal > 0 ? (total / grandTotal) * 100 : 0;
            const count = Number(item.sales_count) || 0;

            return (
              <li key={item.payment_method || "nao-informado"}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 font-semibold text-slate-700">
                    <Icon size={16} className="text-slate-400" />
                    {label}
                    <span className="font-normal text-slate-400">
                      · {count} {count === 1 ? "venda" : "vendas"}
                    </span>
                  </span>

                  <span className="font-semibold text-slate-900">
                    {formatCurrency(total)}
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${
                        BAR_COLORS[item.payment_method] || "bg-slate-400"
                      }`}
                      style={{ width: `${share}%` }}
                    />
                  </div>

                  <span className="w-12 text-right text-xs text-slate-400">
                    {share.toLocaleString("pt-BR", {
                      maximumFractionDigits: 1,
                    })}
                    %
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
