import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function SalesChart({ data = [] }) {
  function formatCurrency(value) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0);
  }

  function formatMonth(value) {
    if (!value) return "";

    const [year, month] = value.split("-");

    const date = new Date(Number(year), Number(month) - 1);

    return date.toLocaleDateString("pt-BR", {
      month: "short",
    });
  }

  function CustomTooltip({ active, payload, label }) {
    if (!active || !payload || !payload.length) {
      return null;
    }

    return (
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg">
        <p className="text-xs font-medium capitalize text-slate-400">
          {formatMonth(label)}
        </p>

        <p className="mt-1 text-sm font-semibold text-slate-900">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900">Vendas por mês</h2>

        <p className="mt-1 text-sm text-slate-500">
          Evolução do faturamento nos últimos meses.
        </p>
      </div>

      {data.length === 0 ? (
        <div className="flex h-72 items-center justify-center">
          <p className="text-sm text-slate-400">
            Ainda não existem dados de vendas suficientes.
          </p>
        </div>
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{
                top: 10,
                right: 10,
                left: 0,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e2e8f0"
              />

              <XAxis
                dataKey="month"
                tickFormatter={formatMonth}
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 12,
                  fill: "#94a3b8",
                }}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 12,
                  fill: "#94a3b8",
                }}
                tickFormatter={(value) =>
                  new Intl.NumberFormat("pt-BR", {
                    notation: "compact",
                    style: "currency",
                    currency: "BRL",
                  }).format(value)
                }
              />

              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: "#cbd5e1",
                  strokeDasharray: "4 4",
                }}
              />

              <Area
                type="monotone"
                dataKey="total"
                stroke="#6366f1"
                strokeWidth={2.5}
                fill="url(#salesGradient)"
                dot={false}
                activeDot={{
                  r: 5,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
