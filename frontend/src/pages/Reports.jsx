import { useEffect, useState } from "react";
import { FileText, RefreshCw } from "lucide-react";
import api from "../services/api";
import ReportFilters from "../components/reports/ReportFilters";
import ReportSummary from "../components/reports/ReportSummary";
import ReportsTable from "../components/reports/ReportsTable";
import CustomerReport from "../components/reports/CustomerReport";
import PointsReport from "../components/reports/PointsReport";
import MovementsReport from "../components/reports/MovementsReport";

const REPORT_TABS = [
  { id: "sales", label: "Vendas" },
  { id: "customers", label: "Clientes" },
  { id: "points", label: "Pontos" },
  { id: "movements", label: "Movimentações" },
];

const initialFilters = {
  start_date: "",
  end_date: "",
  customer_id: "",
  status: "",
  transaction_type: "",
};

function formatDate(value) {
  if (!value) return null;

  const [year, month, day] = value.split("-");

  return `${day}/${month}/${year}`;
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState("sales");

  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);

  const [customers, setCustomers] = useState([]);

  const [salesReport, setSalesReport] = useState({
    summary: {
      total_sales: 0,
      total_revenue: 0,
      average_ticket: 0,
      customers_count: 0,
      total_points_generated: 0,
      highest_sale: 0,
    },
    sales: [],
  });

  const [customerReport, setCustomerReport] = useState({
    summary: {
      total_customers: 0,
      active_customers: 0,
      inactive_customers: 0,
      customers_with_sales: 0,
      total_revenue: 0,
      average_ticket: 0,
    },
    customers: [],
  });

  const [pointsReport, setPointsReport] = useState({
    summary: {
      total_earned: 0,
      total_redeemed: 0,
      total_adjustments: 0,
      total_transactions: 0,
      customers_with_points: 0,
      current_balance: 0,
    },
    customers: [],
  });

  const [movementsReport, setMovementsReport] = useState({
    summary: {
      total_movements: 0,
      total_earned: 0,
      total_redeemed: 0,
      total_adjustments: 0,
    },
    movements: [],
  });

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  async function loadCustomers() {
    try {
      const response = await api.get("/api/v1/customers", {
        params: {
          page: 1,
          per_page: 100,
        },
      });

      setCustomers(response.data.data || []);
    } catch (err) {
      console.error("Erro ao carregar clientes:", err);
    }
  }

  function buildParams(customFilters) {
    return {
      start_date: customFilters.start_date || undefined,
      end_date: customFilters.end_date || undefined,
      customer_id: customFilters.customer_id || undefined,
      status: customFilters.status || undefined,
      transaction_type: customFilters.transaction_type || undefined,
    };
  }

  async function loadActiveReport(customFilters = filters) {
    try {
      setLoading(true);
      setError("");

      const params = buildParams(customFilters);

      if (activeTab === "sales") {
        const response = await api.get("/api/v1/reports", {
          params,
        });

        setSalesReport({
          summary: response.data.summary || {},
          sales: response.data.sales || [],
        });
      }

      if (activeTab === "customers") {
        const response = await api.get("/api/v1/reports/customers", {
          params,
        });

        setCustomerReport({
          summary: response.data.summary || {},
          customers: response.data.customers || [],
        });
      }

      if (activeTab === "points") {
        const response = await api.get("/api/v1/reports/points", {
          params,
        });

        setPointsReport({
          summary: response.data.summary || {},
          customers: response.data.customers || [],
        });
      }

      if (activeTab === "movements") {
        const response = await api.get("/api/v1/reports/movements", {
          params,
        });

        setMovementsReport({
          summary: response.data.summary || {},
          movements: response.data.movements || [],
        });
      }

      setAppliedFilters({ ...customFilters });
    } catch (err) {
      console.error("Erro ao carregar relatório:", err);

      setError(
        err.response?.data?.error || "Não foi possível carregar o relatório."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    loadActiveReport(appliedFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  function handleFilterChange(field, value) {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleApply() {
    if (
      filters.start_date &&
      filters.end_date &&
      filters.start_date > filters.end_date
    ) {
      setError("A data inicial não pode ser posterior à data final.");
      return;
    }

    loadActiveReport(filters);
  }

  function handleClear() {
    const clearedFilters = {
      ...initialFilters,
    };

    setFilters(clearedFilters);
    loadActiveReport(clearedFilters);
  }

  function getFilterConfig() {
    switch (activeTab) {
      case "customers":
        return {
          showStatus: true,
          showTransactionType: false,
        };

      case "points":
        return {
          showStatus: false,
          showTransactionType: true,
        };

      case "movements":
        return {
          showStatus: false,
          showTransactionType: true,
        };

      case "sales":
      default:
        return {
          showStatus: false,
          showTransactionType: false,
        };
    }
  }

  const filterConfig = getFilterConfig();

  const selectedCustomer = customers.find(
    (customer) => String(customer.id) === String(appliedFilters.customer_id)
  );

  const hasActiveFilters =
    appliedFilters.start_date ||
    appliedFilters.end_date ||
    appliedFilters.customer_id ||
    appliedFilters.status ||
    appliedFilters.transaction_type;

  function getPeriodLabel() {
    if (appliedFilters.start_date && appliedFilters.end_date) {
      return `${formatDate(appliedFilters.start_date)} até ${formatDate(
        appliedFilters.end_date
      )}`;
    }

    if (appliedFilters.start_date) {
      return `A partir de ${formatDate(appliedFilters.start_date)}`;
    }

    if (appliedFilters.end_date) {
      return `Até ${formatDate(appliedFilters.end_date)}`;
    }

    return "Todo o período";
  }

  function getExportEndpoint() {
    switch (activeTab) {
      case "customers":
        return "/api/v1/reports/export_customers";

      case "points":
        return "/api/v1/reports/export_points";

      case "movements":
        return "/api/v1/reports/export_movements";

      case "sales":
      default:
        return "/api/v1/reports/export";
    }
  }

  function getExportFilename() {
    const date = new Date().toISOString().slice(0, 10);

    switch (activeTab) {
      case "customers":
        return `relatorio_clientes_${date}.xlsx`;

      case "points":
        return `relatorio_pontos_${date}.xlsx`;

      case "movements":
        return `relatorio_movimentacoes_${date}.xlsx`;

      case "sales":
      default:
        return `relatorio_vendas_${date}.xlsx`;
    }
  }

  async function handleExport() {
    try {
      setExporting(true);
      setError("");

      const response = await api.get("/api/v1/reports/export", {
        params: buildParams(appliedFilters),
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `relatorio_vendas_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erro ao exportar relatório:", err);
      setError(
        err.response?.data?.error || "Não foi possível exportar o relatório."
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <FileText size={21} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">Relatórios</h1>

            <p className="mt-1 text-sm text-slate-500">
              Analise vendas, clientes, pontos e movimentações para apoiar a
              tomada de decisões.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadActiveReport(appliedFilters)}
          disabled={loading || exporting}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
          Atualizar
        </button>
      </div>

      <div className="flex w-fit gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        {REPORT_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab.id
                ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <ReportFilters
        filters={filters}
        appliedFilters={appliedFilters}
        customers={customers}
        onChange={handleFilterChange}
        onApply={handleApply}
        onClear={handleClear}
        onExport={handleExport}
        loading={loading || exporting}
        showStatus={filterConfig.showStatus}
        showTransactionType={filterConfig.showTransactionType}
      />

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Período analisado
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-700">
              {getPeriodLabel()}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedCustomer && (
              <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600">
                Cliente: {selectedCustomer.name}
              </span>
            )}

            {appliedFilters.status && (
              <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600">
                Status:{" "}
                {appliedFilters.status === "active" ? "Ativos" : "Inativos"}
              </span>
            )}

            {appliedFilters.transaction_type && (
              <span className="inline-flex items-center rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-600">
                Tipo:{" "}
                {appliedFilters.transaction_type === "earned"
                  ? "Ganhos"
                  : appliedFilters.transaction_type === "redeemed"
                    ? "Resgates"
                    : "Ajustes"}
              </span>
            )}

            {!hasActiveFilters && (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">
                Sem filtros adicionais
              </span>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
        </div>
      ) : (
        <>
          {activeTab === "sales" && (
            <>
              <ReportSummary summary={salesReport.summary} />
              <ReportsTable sales={salesReport.sales} />
            </>
          )}

          {activeTab === "customers" && (
            <CustomerReport report={customerReport} />
          )}

          {activeTab === "points" && <PointsReport report={pointsReport} />}

          {activeTab === "movements" && (
            <MovementsReport report={movementsReport} />
          )}
        </>
      )}
    </div>
  );
}
