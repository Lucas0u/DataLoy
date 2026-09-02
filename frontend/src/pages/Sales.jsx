import { useEffect, useState } from "react";
import { CircleDollarSign, Plus, ShoppingCart, Star } from "lucide-react";

import SalesTable from "../components/sales/SalesTable";
import SaleFormModal from "../components/sales/SaleFormModal";
import SaleDetailsModal from "../components/sales/SaleDetailsModal";
import api from "../services/api";

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);

  async function loadSales() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/api/v1/sales");

      setSales(response.data?.data || []);
    } catch (error) {
      console.error("Erro ao carregar vendas:", error);

      setError(
        error.response?.data?.error || "Não foi possível carregar as vendas."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSales();
  }, []);

  function formatCurrency(value) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value) || 0);
  }

  const totalSales = sales.length;

  const totalRevenue = sales.reduce(
    (total, sale) => total + Number(sale.total_amount || 0),
    0
  );

  const totalPoints = sales.reduce(
    (total, sale) => total + Number(sale.points_earned || 0),
    0
  );

  const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

  function handleViewSale(sale) {
    setSelectedSale(sale);
  }

  function handleSaleCreated() {
    setShowFormModal(false);
    loadSales();
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />

          <p className="text-sm text-slate-500">Carregando vendas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6">
        <h2 className="font-semibold text-red-800">
          Não foi possível carregar as vendas
        </h2>

        <p className="mt-2 text-sm text-red-600">{error}</p>

        <button
          type="button"
          onClick={loadSales}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Vendas
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Acompanhe e registre as vendas realizadas.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowFormModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
        >
          <Plus size={18} />
          Nova venda
        </button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total de vendas
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {totalSales}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <ShoppingCart size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Faturamento</p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {formatCurrency(totalRevenue)}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CircleDollarSign size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Ticket médio</p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {formatCurrency(averageTicket)}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <CircleDollarSign size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Pontos gerados
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {totalPoints}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Star size={21} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Histórico de vendas
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Todas as vendas registradas no sistema.
          </p>
        </div>

        <SalesTable sales={sales} onView={handleViewSale} />
      </div>

      {showFormModal && (
        <SaleFormModal
          onClose={() => setShowFormModal(false)}
          onSuccess={handleSaleCreated}
        />
      )}

      {/* Modal de detalhes */}
      {selectedSale && (
        <SaleDetailsModal
          sale={selectedSale}
          onClose={() => setSelectedSale(null)}
        />
      )}
    </div>
  );
}
