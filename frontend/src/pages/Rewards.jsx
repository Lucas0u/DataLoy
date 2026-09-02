import { useEffect, useState } from "react";
import { Gift, Plus } from "lucide-react";
import api from "../services/api";
import RewardCard from "../components/rewards/RewardCard";
import RewardFormModal from "../components/rewards/RewardFormModal";
import RedeemModal from "../components/rewards/RedeemModal";

export default function Rewards() {
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingReward, setEditingReward] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [redeemingReward, setRedeemingReward] = useState(null);

  async function loadRewards() {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/api/v1/rewards");
      setRewards(response.data);
    } catch (err) {
      setError(
        err.response?.data?.error || "Não foi possível carregar as recompensas."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRewards();
  }, []);

  function handleNew() {
    setEditingReward(null);
    setShowForm(true);
  }

  function handleEdit(reward) {
    setEditingReward(reward);
    setShowForm(true);
  }

  async function handleToggleActive(reward) {
    try {
      await api.patch(`/api/v1/rewards/${reward.id}`, {
        reward: { active: !reward.active },
      });
      loadRewards();
    } catch {
      setError("Não foi possível atualizar o status da recompensa.");
    }
  }

  function handleSaved() {
    setShowForm(false);
    loadRewards();
  }

  function handleRedeemed() {
    setRedeemingReward(null);
    loadRewards();
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
          <p className="text-sm text-slate-500">Carregando recompensas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {rewards.length} recompensa(s) cadastrada(s)
        </p>

        <button
          type="button"
          onClick={handleNew}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5"
        >
          <Plus size={18} />
          Nova recompensa
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {rewards.length === 0 && !error ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white">
          <Gift size={32} className="text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-500">
            Nenhuma recompensa cadastrada ainda.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {rewards.map((reward) => (
            <RewardCard
              key={reward.id}
              reward={reward}
              onEdit={handleEdit}
              onToggleActive={handleToggleActive}
              onRedeem={setRedeemingReward}
            />
          ))}
        </div>
      )}

      {showForm && (
        <RewardFormModal
          reward={editingReward}
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
        />
      )}

      {redeemingReward && (
        <RedeemModal
          reward={redeemingReward}
          onClose={() => setRedeemingReward(null)}
          onRedeemed={handleRedeemed}
        />
      )}
    </div>
  );
}
