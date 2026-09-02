import { useEffect, useState } from "react";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";

import TopRewards from "../components/dashboard/TopRewards";
import InactiveCustomers from "../components/dashboard/InactiveCustomers";
import TopCustomers from "../components/dashboard/TopCustomers";
import CustomersChart from "../components/dashboard/CustomersChart";
import MetricCard from "../components/dashboard/MetricCard";
import SalesChart from "../components/dashboard/SalesChart";
import api from "../services/api";

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/api/v1/dashboard");

        setDashboard(response.data);
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);

        setError(
          error.response?.data?.error ||
            "Não foi possível carregar os dados do dashboard."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  function formatCurrency(value) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0);
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />

          <p className="text-sm text-slate-500">Carregando informações...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h2 className="font-semibold text-red-800">
          Não foi possível carregar o dashboard
        </h2>

        <p className="mt-2 text-sm text-red-600">{error}</p>
      </div>
    );
  }

  const overview = dashboard?.overview || {};

  const cards = [
    {
      title: "Total de clientes",
      value: overview.total_customers || 0,
      description: "Clientes cadastrados",
      icon: Users,
    },
    {
      title: "Clientes ativos",
      value: overview.active_customers || 0,
      description: "Clientes ativos",
      icon: UserCheck,
    },
    {
      title: "Total de vendas",
      value: overview.total_sales || 0,
      description: "Vendas realizadas",
      icon: ShoppingCart,
    },
    {
      title: "Faturamento",
      value: formatCurrency(overview.total_revenue),
      description: "Receita total",
      icon: DollarSign,
    },
    {
      title: "Ticket médio",
      value: formatCurrency(overview.average_ticket),
      description: "Valor médio por venda",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="mt-6 space-y-6">
      {/* Indicadores */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <MetricCard
            key={card.title}
            title={card.title}
            value={card.value}
            description={card.description}
            icon={card.icon}
          />
        ))}
      </div>

      {/* Gráfico de vendas */}
      <div className="grid gap-5 lg:grid-cols-2">
        <SalesChart data={dashboard?.sales_by_month || []} />

        <CustomersChart data={dashboard?.customers_by_month || []} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <TopCustomers data={dashboard?.top_customers || []} />

        <InactiveCustomers data={dashboard?.inactive_customers || []} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <TopRewards data={dashboard?.most_redeemed_rewards || []} />
      </div>
    </div>
  );
}
