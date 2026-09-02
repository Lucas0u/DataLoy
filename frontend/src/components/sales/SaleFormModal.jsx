import { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import api from "../../services/api";

export default function SaleFormModal({ onClose, onSuccess }) {
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState("");

  const [items, setItems] = useState([
    {
      product_name: "",
      quantity: 1,
      unit_price: "",
    },
  ]);

  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCustomers() {
      try {
        const response = await api.get("/api/v1/customers");

        setCustomers(response.data?.data || response.data || []);
      } catch (error) {
        console.error("Erro ao carregar clientes:", error);

        setError(
          error.response?.data?.error ||
            "Não foi possível carregar os clientes."
        );
      } finally {
        setLoadingCustomers(false);
      }
    }

    loadCustomers();
  }, []);

  function handleItemChange(index, field, value) {
    setItems((currentItems) =>
      currentItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  }

  function addItem() {
    setItems((currentItems) => [
      ...currentItems,
      {
        product_name: "",
        quantity: 1,
        unit_price: "",
      },
    ]);
  }

  function removeItem(index) {
    setItems((currentItems) =>
      currentItems.filter((_, itemIndex) => itemIndex !== index)
    );
  }

  function calculateTotal() {
    return items.reduce((total, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unit_price) || 0;

      return total + quantity * unitPrice;
    }, 0);
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value) || 0);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!customerId) {
      setError("Selecione um cliente.");
      return;
    }

    const invalidItem = items.some(
      (item) =>
        !item.product_name.trim() ||
        Number(item.quantity) <= 0 ||
        Number(item.unit_price) < 0
    );

    if (invalidItem) {
      setError("Preencha corretamente todos os produtos da venda.");
      return;
    }

    try {
      setSaving(true);

      await api.post("/api/v1/sales", {
        sale: {
          customer_id: Number(customerId),
          sale_items: items.map((item) => ({
            product_name: item.product_name.trim(),
            quantity: Number(item.quantity),
            unit_price: Number(item.unit_price),
          })),
        },
      });

      onSuccess();
    } catch (error) {
      console.error("Erro ao registrar venda:", error);

      setError(
        error.response?.data?.error || "Não foi possível registrar a venda."
      );
    } finally {
      setSaving(false);
    }
  }

  const total = calculateTotal();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Registrar nova venda
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Registre a venda e gere os pontos automaticamente.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Conteúdo */}
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="space-y-6 overflow-y-auto p-6">
            {/* Erro */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Cliente */}
            <div>
              <label
                htmlFor="customer"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Cliente
              </label>

              <select
                id="customer"
                value={customerId}
                onChange={(event) => setCustomerId(event.target.value)}
                disabled={loadingCustomers || saving}
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">
                  {loadingCustomers
                    ? "Carregando clientes..."
                    : "Selecione um cliente"}
                </option>

                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Produtos */}
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Produtos
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Adicione os itens que fazem parte da venda.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addItem}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus size={16} />
                  Adicionar item
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="grid gap-3 sm:grid-cols-[1fr_100px_140px_auto]">
                      {/* Produto */}
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-slate-500">
                          Produto
                        </label>

                        <input
                          type="text"
                          value={item.product_name}
                          onChange={(event) =>
                            handleItemChange(
                              index,
                              "product_name",
                              event.target.value
                            )
                          }
                          placeholder="Ex.: Camiseta básica"
                          disabled={saving}
                          required
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                        />
                      </div>

                      {/* Quantidade */}
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-slate-500">
                          Quantidade
                        </label>

                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(event) =>
                            handleItemChange(
                              index,
                              "quantity",
                              event.target.value
                            )
                          }
                          disabled={saving}
                          required
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                        />
                      </div>

                      {/* Preço */}
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-slate-500">
                          Preço unitário
                        </label>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(event) =>
                            handleItemChange(
                              index,
                              "unit_price",
                              event.target.value
                            )
                          }
                          placeholder="0,00"
                          disabled={saving}
                          required
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                        />
                      </div>

                      {/* Remover */}
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1 || saving}
                          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30"
                          aria-label="Remover item"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-blue-50 to-violet-50 p-5">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total da venda
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Os pontos serão calculados automaticamente.
                </p>
              </div>

              <p className="text-2xl font-bold text-slate-900">
                {formatCurrency(total)}
              </p>
            </div>
          </div>

          {/* Rodapé */}
          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving || loadingCustomers}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {saving ? "Registrando..." : "Registrar venda"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
