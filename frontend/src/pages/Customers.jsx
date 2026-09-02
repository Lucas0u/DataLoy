import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Users } from "lucide-react";
import api from "../services/api";
import CustomerFormModal from "../components/customers/CustomerFormModal";

export default function Customers() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [meta, setMeta] = useState({ page: 1, total_pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  async function loadCustomers() {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/api/v1/customers", {
        params: { q: query || undefined, status: status || undefined, page },
      });
      setCustomers(response.data.data);
      setMeta(response.data.meta);
    } catch (err) {
      setError(
        err.response?.data?.error || "Não foi possível carregar os clientes."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, [page, status]);

  function handleSearchSubmit(event) {
    event.preventDefault();
    setPage(1);
    loadCustomers();
  }

  function handleNew() {
    setEditingCustomer(null);
    setShowForm(true);
  }

  async function handleEdit(customer, event) {
    event.stopPropagation();
    try {
      const response = await api.get(`/api/v1/customers/${customer.id}`);
      setEditingCustomer(response.data);
      setShowForm(true);
    } catch {
      setError("Não foi possível carregar os dados do cliente.");
    }
  }

  async function handleDeactivate(customer, event) {
    event.stopPropagation();
    if (!confirm(`Desativar o cliente "${customer.name}"?`)) return;

    try {
      await api.patch(`/api/v1/customers/${customer.id}/deactivate`);
      loadCustomers();
    } catch {
      setError("Não foi possível desativar o cliente.");
    }
  }

  async function handleReactivate(customer, event) {
    event.stopPropagation();
    try {
      await api.put(`/api/v1/customers/${customer.id}`, {
        customer: { status: "active" },
      });
      loadCustomers();
    } catch {
      setError("Não foi possível reativar o cliente.");
    }
  }

  function handleSaved() {
    setShowForm(false);
    loadCustomers();
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearchSubmit} className="flex flex-1 gap-3">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome, CPF ou e-mail"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
            <Search
              size={17}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="">Todos os status</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </form>

        <button
          type="button"
          onClick={handleNew}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5"
        >
          <Plus size={18} />
          Novo cliente
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
          </div>
        ) : customers.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center">
            <Users size={32} className="text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-500">
              Nenhum cliente encontrado.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-6 py-3 font-semibold">Nome</th>
                <th className="px-6 py-3 font-semibold">Contato</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Pontos</th>
                <th className="px-6 py-3 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((customer) => (
                <tr
                  key={customer.id}
                  onClick={() => navigate(`/clientes/${customer.id}`)}
                  className="cursor-pointer transition hover:bg-slate-50"
                >
                  <td className="px-6 py-4 font-medium text-slate-800">
                    {customer.name}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    <div>{customer.email || "—"}</div>
                    <div className="text-xs text-slate-400">
                      {customer.phone || "—"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        customer.status === "active"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {customer.status === "active" ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-indigo-600">
                    {customer.points_balance} pts
                  </td>
                  <td className="px-6 py-4 text-right text-xs">
                    <button
                      type="button"
                      onClick={(e) => handleEdit(customer, e)}
                      className="mr-3 font-semibold text-blue-600 hover:underline"
                    >
                      Editar
                    </button>
                    {customer.status === "active" ? (
                      <button
                        type="button"
                        onClick={(e) => handleDeactivate(customer, e)}
                        className="font-semibold text-red-500 hover:underline"
                      >
                        Desativar
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handleReactivate(customer, e)}
                        className="font-semibold text-emerald-600 hover:underline"
                      >
                        Reativar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {meta.total_pages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            Página {meta.page} de {meta.total_pages} · {meta.total} cliente(s)
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={page >= meta.total_pages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40"
            >
              Próxima
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <CustomerFormModal
          customer={editingCustomer}
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
