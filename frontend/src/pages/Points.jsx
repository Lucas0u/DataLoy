import { useEffect, useState } from "react";
import { Search, Star, Users } from "lucide-react";
import api from "../services/api";
import PointsHistoryTable from "../components/points/PointsHistoryTable";

export default function Points() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [history, setHistory] = useState(null);

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadCustomers(search = "") {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/api/v1/customers", {
        params: {
          q: search || undefined,
          page: 1,
          per_page: 100,
        },
      });

      setCustomers(response.data.data || []);
    } catch (err) {
      console.error("Erro ao carregar clientes:", err);

      setError(
        err.response?.data?.error || "Não foi possível carregar os clientes."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory(customer) {
    try {
      setSelectedCustomer(customer);
      setHistoryLoading(true);
      setHistory(null);
      setError("");

      const response = await api.get(
        `/api/v1/customers/${customer.id}/points_history`
      );

      setHistory(response.data);
    } catch (err) {
      console.error("Erro ao carregar histórico:", err);

      setError(
        err.response?.data?.error ||
          "Não foi possível carregar o histórico de pontos."
      );
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  function handleSearch(event) {
    event.preventDefault();
    loadCustomers(query);
  }

  const totalBalance = customers.reduce(
    (total, customer) => total + (Number(customer.points_balance) || 0),
    0
  );

  return (
    <div className="mt-6 space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pontos</h1>

        <p className="mt-1 text-sm text-slate-500">
          Acompanhe o saldo e o histórico de pontos dos clientes.
        </p>
      </div>

      {/* Indicador */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Pontos em circulação
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {totalBalance.toLocaleString("pt-BR")}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Saldo acumulado entre os clientes
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Star size={19} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Clientes com pontos
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {
                  customers.filter(
                    (customer) => Number(customer.points_balance) > 0
                  ).length
                }
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Clientes com saldo disponível
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Users size={19} />
            </div>
          </div>
        </div>
      </div>

      {/* Busca */}
      <form onSubmit={handleSearch}>
        <div className="relative max-w-md">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar cliente por nome, CPF ou e-mail"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-11 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
          />

          <Search
            size={17}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
        </div>
      </form>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Clientes */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Saldo de pontos por cliente
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Selecione um cliente para consultar suas movimentações.
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-[250px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
          </div>
        ) : customers.length === 0 ? (
          <div className="flex min-h-[250px] flex-col items-center justify-center">
            <Users size={32} className="text-slate-300" />

            <p className="mt-3 text-sm font-medium text-slate-500">
              Nenhum cliente encontrado.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {customers.map((customer) => (
              <button
                key={customer.id}
                type="button"
                onClick={() => loadHistory(customer)}
                className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {customer.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {customer.email || "E-mail não informado"}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-indigo-600">
                    {Number(customer.points_balance || 0).toLocaleString(
                      "pt-BR"
                    )}{" "}
                    pts
                  </p>

                  <p className="mt-1 text-xs text-slate-400">Ver histórico</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Histórico selecionado */}
      {selectedCustomer && (
        <div>
          {historyLoading ? (
            <div className="flex min-h-[250px] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
            </div>
          ) : (
            <PointsHistoryTable
              customer={selectedCustomer}
              summary={history?.summary}
              transactions={history?.transactions || []}
            />
          )}
        </div>
      )}
    </div>
  );
}
