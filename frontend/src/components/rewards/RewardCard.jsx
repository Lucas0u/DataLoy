import { Calendar, Gift, Package, Pencil, Power } from "lucide-react";

export default function RewardCard({
  reward,
  onEdit,
  onToggleActive,
  onRedeem,
}) {
  const isExpired =
    reward.valid_until && new Date(reward.valid_until) < new Date();
  const isOutOfStock =
    reward.quantity_available !== null && reward.quantity_available <= 0;
  const canRedeem = reward.active && !isExpired && !isOutOfStock;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-violet-100 text-indigo-600">
          <Gift size={21} strokeWidth={2} />
        </div>

        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            reward.active
              ? "bg-emerald-50 text-emerald-600"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {reward.active ? "Ativa" : "Inativa"}
        </span>
      </div>

      <h3 className="mt-4 text-base font-semibold text-slate-900">
        {reward.name}
      </h3>
      {reward.description && (
        <p className="mt-1 text-sm text-slate-500 line-clamp-2">
          {reward.description}
        </p>
      )}

      <div className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-indigo-600">
        {reward.points_required} pontos
      </div>

      <div className="mt-3 space-y-1.5 text-xs text-slate-400">
        {reward.valid_until && (
          <div
            className={`flex items-center gap-1.5 ${isExpired ? "text-red-500" : ""}`}
          >
            <Calendar size={14} />
            {isExpired ? "Expirada em" : "Válida até"}{" "}
            {new Date(reward.valid_until).toLocaleDateString("pt-BR")}
          </div>
        )}
        {reward.quantity_available !== null && (
          <div
            className={`flex items-center gap-1.5 ${isOutOfStock ? "text-red-500" : ""}`}
          >
            <Package size={14} />
            {isOutOfStock
              ? "Sem estoque"
              : `${reward.quantity_available} disponíveis`}
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onRedeem(reward)}
          disabled={!canRedeem}
          className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:hover:translate-y-0"
        >
          Resgatar
        </button>

        <button
          type="button"
          onClick={() => onEdit(reward)}
          className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50"
          aria-label="Editar"
        >
          <Pencil size={17} />
        </button>

        <button
          type="button"
          onClick={() => onToggleActive(reward)}
          className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50"
          aria-label={reward.active ? "Desativar" : "Ativar"}
        >
          <Power size={17} />
        </button>
      </div>
    </div>
  );
}
