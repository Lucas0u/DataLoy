import { useState } from "react";
import { Search, X } from "lucide-react";
import api from "../../services/api";

export default function RedeemModal({ reward, onClose, onRedeemed }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searching, setSearching] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(event) {
    const value = event.target.value;
    setQuery(value);
    setSelectedCustomer(null);
    setError("");

    if (value.trim().length < 2) {
      setResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await api.get("/api/v1/customers", {
        params: { q: value, status: "active" },
      });
      setResults(response.data.data);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function handleConfirm() {
    if (!selectedCustomer) return;

    setError("");
    setRedeeming(true);
    try {
      await api.post(`/api/v1/rewards/${reward.id}/redeem`, {
        customer_id: selectedCustomer.id,
      });
      onRedeemed();
    } catch (err) {
      setError(
        err.response?.data?.error || "Não foi possível realizar o resgate."
      );
    } finally {
      setRedeeming(false);
    }
  }

  const insufficientPoints =
    selectedCustomer &&
    selectedCustomer.points_balance < reward.points_required;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Resgatar recompensa
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

        <div className="mt-3 rounded-xl bg-slate-50 p-3">
          <p className="text-sm font-semibold text-slate-800">{reward.name}</p>
          <p className="text-xs text-slate-500">
            {reward.points_required} pontos necessários
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Buscar cliente
          </label>
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={handleSearch}
              placeholder="Nome, CPF ou e-mail"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-10 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />
            <Search
              size={18}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>

          {searching && (
            <p className="mt-2 text-xs text-slate-400">Buscando...</p>
          )}

          {results.length > 0 && !selectedCustomer && (
            <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-slate-200">
              {results.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setResults([]);
                    setQuery(customer.name);
                  }}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-slate-50"
                >
                  <span>{customer.name}</span>
                  <span className="text-xs text-slate-400">
                    {customer.points_balance} pts
                  </span>
                </button>
              ))}
            </div>
          )}

          {selectedCustomer && (
            <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3">
              <p className="text-sm font-semibold text-slate-800">
                {selectedCustomer.name}
              </p>
              <p
                className={`text-xs ${
                  insufficientPoints
                    ? "text-red-500 font-semibold"
                    : "text-slate-500"
                }`}
              >
                Saldo atual: {selectedCustomer.points_balance} pontos
                {insufficientPoints && " — insuficiente para este resgate"}
              </p>
            </div>
          )}
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedCustomer || insufficientPoints || redeeming}
            className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {redeeming ? "Confirmando..." : "Confirmar resgate"}
          </button>
        </div>
      </div>
    </div>
  );
}
