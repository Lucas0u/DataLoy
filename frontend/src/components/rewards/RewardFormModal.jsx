import { useEffect, useState } from "react";
import { X } from "lucide-react";
import api from "../../services/api";

export default function RewardFormModal({ reward, onClose, onSaved }) {
  const isEditing = Boolean(reward);

  const [form, setForm] = useState({
    name: "",
    description: "",
    points_required: "",
    valid_until: "",
    quantity_available: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (reward) {
      setForm({
        name: reward.name || "",
        description: reward.description || "",
        points_required: reward.points_required || "",
        valid_until: reward.valid_until || "",
        quantity_available:
          reward.quantity_available === null ? "" : reward.quantity_available,
      });
    }
  }, [reward]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);

    const payload = {
      reward: {
        name: form.name,
        description: form.description,
        points_required: form.points_required,
        valid_until: form.valid_until || null,
        quantity_available:
          form.quantity_available === "" ? null : form.quantity_available,
      },
    };

    try {
      if (isEditing) {
        await api.patch(`/api/v1/rewards/${reward.id}`, payload);
      } else {
        await api.post("/api/v1/rewards", payload);
      }
      onSaved();
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      setError(
        Array.isArray(apiErrors)
          ? apiErrors.join(", ")
          : err.response?.data?.error || "Não foi possível salvar a recompensa."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {isEditing ? "Editar recompensa" : "Nova recompensa"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Nome
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Descrição
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Pontos necessários
              </label>
              <input
                type="number"
                min="1"
                required
                value={form.points_required}
                onChange={(e) =>
                  handleChange("points_required", e.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Estoque (vazio = ilimitado)
              </label>
              <input
                type="number"
                min="0"
                value={form.quantity_available}
                onChange={(e) =>
                  handleChange("quantity_available", e.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Validade (opcional)
            </label>
            <input
              type="date"
              value={form.valid_until}
              onChange={(e) => handleChange("valid_until", e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
