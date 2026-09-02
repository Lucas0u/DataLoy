import { Gift, Trophy } from "lucide-react";

export default function TopRewards({ data = [] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Recompensas mais resgatadas
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Recompensas com maior número de resgates.
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Gift size={20} />
        </div>
      </div>

      {/* Lista */}
      <div className="mt-6">
        {data.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Gift size={21} />
            </div>

            <p className="mt-3 text-sm font-medium text-slate-600">
              Nenhum resgate registrado
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Ainda não existem recompensas resgatadas.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.slice(0, 5).map((reward, index) => (
              <div
                key={reward.id}
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
                    <Trophy size={18} />
                  ) : (
                    <span className="text-sm font-semibold">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  )}
                </div>

                {/* Recompensa */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {reward.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">Recompensa</p>
                </div>

                {/* Resgates */}
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">
                    {reward.redemptions_count}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {reward.redemptions_count === 1 ? "resgate" : "resgates"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
