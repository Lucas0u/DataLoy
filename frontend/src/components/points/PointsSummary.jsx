import { ArrowDownLeft, ArrowUpRight, CircleDollarSign } from "lucide-react";

function SummaryCard({ title, value, description, icon: Icon, iconClass }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {value.toLocaleString("pt-BR")}
          </p>

          <p className="mt-1 text-xs text-slate-400">{description}</p>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={19} />
        </div>
      </div>
    </div>
  );
}

export default function PointsSummary({
  totalEarned = 0,
  totalRedeemed = 0,
  currentBalance = 0,
}) {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      <SummaryCard
        title="Pontos gerados"
        value={totalEarned}
        description="Pontos acumulados pelos clientes"
        icon={ArrowUpRight}
        iconClass="bg-emerald-50 text-emerald-600"
      />

      <SummaryCard
        title="Pontos resgatados"
        value={totalRedeemed}
        description="Pontos utilizados em recompensas"
        icon={ArrowDownLeft}
        iconClass="bg-violet-50 text-violet-600"
      />

      <SummaryCard
        title="Pontos em circulação"
        value={currentBalance}
        description="Saldo atual dos clientes"
        icon={CircleDollarSign}
        iconClass="bg-indigo-50 text-indigo-600"
      />
    </div>
  );
}
