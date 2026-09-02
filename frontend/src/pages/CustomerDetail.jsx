import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Mail, Phone, ShoppingBag, Sparkles } from "lucide-react";
import api from "../services/api";

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [pointsHistory, setPointsHistory] = useState(null);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function formatCurrency(value) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0);
  }

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [customerRes, historyRes, salesRes] = await Promise.all([
          api.get(`/api/v1/customers/${id}`),
          api.get(`/api/v1/customers/${id}/points_history`),
          api.get("/api/v1/sales", { params: { customer_id: id } }),
        ]);

        setCustomer(customerRes.data);
        setPointsHistory(historyRes.data);
        setSales(salesRes.data.data);
      } catch (err) {
        setError(
          err.response?.data?.error || "Não foi possível carregar o cliente."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      <button
        type="button"
        onClick={() => navigate("/clientes")}
        className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={16} />
        Voltar para clientes
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {customer.name}
            </h1>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
              {customer.email && (
                <span className="flex items-center gap-1.5">
                  <Mail size={15} /> {customer.email}
                </span>
              )}
              {customer.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone size={15} /> {customer.phone}
                </span>
              )}
            </div>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              customer.status === "active"
                ? "bg-emerald-50 text-emerald-600"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {customer.status === "active" ? "Ativo" : "Inativo"}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-400">Saldo de pontos</p>
            <p className="mt-1 text-xl font-bold text-indigo-600">
              {pointsHistory?.summary.current_balance ?? 0}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-400">Total ganho</p>
            <p className="mt-1 text-xl font-bold text-slate-800">
              {pointsHistory?.summary.total_earned ?? 0}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-400">Total resgatado</p>
            <p className="mt-1 text-xl font-bold text-slate-800">
              {pointsHistory?.summary.total_redeemed ?? 0}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-400">Compras realizadas</p>
            <p className="mt-1 text-xl font-bold text-slate-800">
              {sales.length}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <ShoppingBag size={18} className="text-indigo-500" />
            Histórico de compras
          </h2>

          {sales.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">
              Nenhuma compra registrada.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {sales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-slate-800">
                      {new Date(sale.created_at).toLocaleDateString("pt-BR")}
                    </p>
                    <p className="text-xs text-slate-400">Venda #{sale.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-800">
                      {formatCurrency(sale.total_amount)}
                    </p>
                    <p className="text-xs text-indigo-500">
                      +{sale.points_earned} pts
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Sparkles size={18} className="text-indigo-500" />
            Histórico de pontos
          </h2>

          {!pointsHistory || pointsHistory.transactions.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">
              Nenhuma movimentação de pontos.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {pointsHistory.transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-slate-800">
                      {tx.description}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(tx.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <p
                    className={`font-semibold ${
                      tx.points >= 0 ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {tx.points >= 0 ? `+${tx.points}` : tx.points}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
