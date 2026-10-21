import { useEffect, useState } from "react";
import { Calculator, Plus, Ticket, Trash2, X } from "lucide-react";
import api from "../../services/api";
import {
  DEFAULT_GUEST_NAME,
  GUEST_NAME_MAX_LENGTH,
} from "../../utils/saleCustomer";
import {
  calculateCouponDiscount,
  formatDate,
  formatDiscount,
} from "../../utils/coupon";
import { MAX_AMOUNT, PAYMENT_METHODS, limitAmount } from "../../utils/payment";

// Mesmo limite do backend (SaleItem::PRODUCT_NAME_MAX_LENGTH)
const PRODUCT_NAME_MAX_LENGTH = 60;

// Item preenchido = nome, quantidade e preço informados
function isItemFilled(item) {
  return (
    item.product_name.trim() !== "" &&
    Number(item.quantity) > 0 &&
    item.unit_price !== "" &&
    Number(item.unit_price) >= 0
  );
}

export default function SaleFormModal({ onClose, onSuccess }) {
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState("");

  // Venda sem cadastro: sem cliente, com nome livre e sem pontos
  const [isGuest, setIsGuest] = useState(false);
  const [guestName, setGuestName] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("");
  const [cardFeePercentage, setCardFeePercentage] = useState("");
  const [finalAmount, setFinalAmount] = useState("");
  const [showFeeCalculator, setShowFeeCalculator] = useState(false);

  // Cupons de recompensa disponíveis do cliente selecionado
  const [coupons, setCoupons] = useState([]);
  const [couponId, setCouponId] = useState("");
  const [loadingCoupons, setLoadingCoupons] = useState(false);

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

  // Sempre que o cliente muda, busca os cupons que ele pode usar
  useEffect(() => {
    setCouponId("");
    setCoupons([]);

    if (!customerId) return;

    let ignore = false;

    async function loadCoupons() {
      try {
        setLoadingCoupons(true);

        const response = await api.get(
          `/api/v1/customers/${customerId}/coupons`,
          { params: { status: "available" } }
        );

        if (!ignore) setCoupons(response.data || []);
      } catch (error) {
        console.error("Erro ao carregar cupons:", error);
        if (!ignore) setCoupons([]);
      } finally {
        if (!ignore) setLoadingCoupons(false);
      }
    }

    loadCoupons();

    return () => {
      ignore = true;
    };
  }, [customerId]);

  function handleItemChange(index, field, value) {
    if (field === "quantity" || field === "unit_price") {
      value = limitAmount(value);
    }

    setItems((currentItems) =>
      currentItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  }

  function addItem() {
    // Só adiciona um novo item quando os anteriores estão preenchidos
    if (!items.every(isItemFilled)) return;

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

  function handleGuestChange(guest) {
    setIsGuest(guest);
    setError("");

    // Venda sem cadastro não tem cliente nem cupom
    if (guest) {
      setCustomerId("");
      setCouponId("");
    } else {
      setGuestName("");
    }
  }

  function getSelectedCoupon() {
    return coupons.find((coupon) => String(coupon.id) === String(couponId));
  }

  // Valor a pagar = produtos − desconto do cupom
  function calculateAmountDue() {
    const subtotal = calculateTotal();

    return subtotal - calculateCouponDiscount(getSelectedCoupon(), subtotal);
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value) || 0);
  }

  function handlePaymentMethodChange(method) {
    setPaymentMethod(method);

    // Os campos de taxa e valor final só existem para cartão
    if (method !== "cartao") {
      setCardFeePercentage("");
      setFinalAmount("");
      setShowFeeCalculator(false);
    }
  }

  function hideFeeCalculator() {
    setShowFeeCalculator(false);
    setCardFeePercentage("");
  }

  // Valor final = valor antes - (valor antes × taxa / 100)
  function calculateFinalAmount() {
    setError("");

    const fee = Number(cardFeePercentage);

    if (cardFeePercentage === "" || fee < 0 || fee > 100) {
      setError("Informe uma taxa do cartão entre 0% e 100%.");
      return;
    }

    // Valor antes da taxa = produtos menos o desconto do cupom
    const valueBefore = calculateAmountDue();
    const result = valueBefore - (valueBefore * fee) / 100;

    setFinalAmount((Math.round(result * 100) / 100).toFixed(2));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!isGuest && !customerId) {
      setError("Selecione um cliente ou marque venda sem cadastro.");
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

    const limitFormatted = MAX_AMOUNT.toLocaleString("pt-BR");

    const overLimitItem = items.some(
      (item) =>
        Number(item.quantity) > MAX_AMOUNT ||
        Number(item.unit_price) > MAX_AMOUNT
    );

    if (overLimitItem) {
      setError(`Quantidade e preço não podem passar de ${limitFormatted}.`);
      return;
    }

    if (calculateTotal() > MAX_AMOUNT) {
      setError(`O total da venda não pode passar de R$ ${limitFormatted},00.`);
      return;
    }

    if (!paymentMethod) {
      setError("Selecione a forma de pagamento.");
      return;
    }

    const isCard = paymentMethod === "cartao";

    if (isCard && (finalAmount === "" || Number(finalAmount) < 0)) {
      setError("Informe o valor cobrado na maquininha.");
      return;
    }

    if (isCard && Number(finalAmount) > calculateAmountDue() + 0.001) {
      setError(
        `O valor cobrado na maquininha não pode ser maior que o total da compra (${formatCurrency(
          calculateAmountDue()
        )}).`
      );
      return;
    }

    if (isCard && Number(finalAmount) > MAX_AMOUNT) {
      setError(`O valor cobrado não pode passar de R$ ${limitFormatted},00.`);
      return;
    }

    try {
      setSaving(true);

      const response = await api.post("/api/v1/sales", {
        sale: {
          customer_id: isGuest ? null : Number(customerId),
          guest_name: isGuest ? guestName.trim() : null,
          payment_method: paymentMethod,
          card_fee_percentage:
            isCard && showFeeCalculator && cardFeePercentage !== ""
              ? Number(cardFeePercentage)
              : null,
          final_amount: isCard ? Number(finalAmount) : null,
          coupon_id: couponId ? Number(couponId) : null,
          sale_items: items.map((item) => ({
            product_name: item.product_name.trim(),
            quantity: Number(item.quantity),
            unit_price: Number(item.unit_price),
          })),
        },
      });

      // A resposta traz a venda e o resultado da impressão do recibo
      onSuccess(response.data);
    } catch (error) {
      console.error("Erro ao registrar venda:", error);

      setError(
        error.response?.data?.error || "Não foi possível registrar a venda."
      );
    } finally {
      setSaving(false);
    }
  }

  const itemsTotal = calculateTotal();
  const canAddItem = items.every(isItemFilled);
  const selectedCoupon = getSelectedCoupon();
  const couponDiscount = calculateCouponDiscount(selectedCoupon, itemsTotal);
  const amountDue = itemsTotal - couponDiscount;

  // No cartão, o total da compra passa a ser o valor cobrado na maquininha
  const usesChargedAmount = paymentMethod === "cartao" && finalAmount !== "";
  const total = usesChargedAmount ? Number(finalAmount) : amountDue;
  const chargedAboveTotal =
    usesChargedAmount && Number(finalAmount) > amountDue + 0.001;

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
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-slate-700">
                  Cliente
                </span>

                <div
                  className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold"
                  role="group"
                  aria-label="Tipo de venda"
                >
                  <button
                    type="button"
                    onClick={() => handleGuestChange(false)}
                    disabled={saving}
                    aria-pressed={!isGuest}
                    className={`rounded-md px-3 py-1.5 transition ${
                      !isGuest
                        ? "bg-white text-indigo-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Cliente cadastrado
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGuestChange(true)}
                    disabled={saving}
                    aria-pressed={isGuest}
                    className={`rounded-md px-3 py-1.5 transition ${
                      isGuest
                        ? "bg-white text-indigo-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Venda sem cadastro
                  </button>
                </div>
              </div>

              {isGuest ? (
                <>
                  <label htmlFor="guest-name" className="sr-only">
                    Nome do cliente
                  </label>
                  <input
                    id="guest-name"
                    type="text"
                    value={guestName}
                    onChange={(event) => setGuestName(event.target.value)}
                    maxLength={GUEST_NAME_MAX_LENGTH}
                    placeholder={`Nome do cliente (vazio = ${DEFAULT_GUEST_NAME})`}
                    disabled={saving}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  />
                  <p className="mt-1.5 text-xs text-amber-700">
                    Venda sem cadastro não gera pontos nem permite usar cupom.
                  </p>
                </>
              ) : (
                <>
                  <label htmlFor="customer" className="sr-only">
                    Cliente cadastrado
                  </label>

                  <select
                    id="customer"
                    value={customerId}
                    onChange={(event) => setCustomerId(event.target.value)}
                    disabled={loadingCustomers || saving}
                    required={!isGuest}
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
                </>
              )}
            </div>

            {/* Produtos */}
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Produtos
                  </h3>

                  <p
                    className={`mt-1 text-xs ${
                      canAddItem ? "text-slate-500" : "text-amber-600"
                    }`}
                  >
                    {canAddItem
                      ? "Adicione os itens que fazem parte da venda."
                      : "Preencha produto, quantidade e preço para adicionar outro item."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addItem}
                  disabled={saving || !canAddItem}
                  title={
                    canAddItem
                      ? undefined
                      : "Preencha o item atual para adicionar outro"
                  }
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
                          maxLength={PRODUCT_NAME_MAX_LENGTH}
                          disabled={saving}
                          required
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                        />

                        <p
                          className={`mt-1 text-right text-[11px] ${
                            item.product_name.length >= PRODUCT_NAME_MAX_LENGTH
                              ? "font-semibold text-amber-600"
                              : "text-slate-400"
                          }`}
                        >
                          {item.product_name.length}/{PRODUCT_NAME_MAX_LENGTH}
                        </p>
                      </div>

                      {/* Quantidade */}
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-slate-500">
                          Quantidade
                        </label>

                        <input
                          type="number"
                          min="1"
                          max={MAX_AMOUNT}
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
                          max={MAX_AMOUNT}
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

            {/* Cupom de recompensa */}
            {!isGuest && customerId && (
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-2">
                  <Ticket size={18} className="text-indigo-500" />
                  <h3 className="text-sm font-semibold text-slate-900">
                    Cupom de recompensa
                  </h3>
                </div>

                {loadingCoupons ? (
                  <p className="mt-2 text-xs text-slate-400">
                    Buscando cupons do cliente...
                  </p>
                ) : coupons.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-500">
                    Este cliente não tem cupons disponíveis. Os cupons são
                    gerados ao resgatar uma recompensa com pontos.
                  </p>
                ) : (
                  <>
                    <p className="mt-1 text-xs text-slate-500">
                      {coupons.length === 1
                        ? "O cliente tem 1 cupom disponível."
                        : `O cliente tem ${coupons.length} cupons disponíveis.`}{" "}
                      Apenas um pode ser usado por venda.
                    </p>

                    <select
                      id="coupon"
                      value={couponId}
                      onChange={(event) => setCouponId(event.target.value)}
                      disabled={saving}
                      className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    >
                      <option value="">Não usar cupom</option>

                      {coupons.map((coupon) => (
                        <option key={coupon.id} value={coupon.id}>
                          {coupon.code} · {coupon.reward?.name} ·{" "}
                          {formatDiscount(
                            coupon.discount_type,
                            coupon.discount_value
                          )}
                          {coupon.expires_at
                            ? ` · vence ${formatDate(coupon.expires_at)}`
                            : ""}
                        </option>
                      ))}
                    </select>

                    {selectedCoupon && (
                      <p className="mt-2 text-xs font-semibold text-emerald-700">
                        Desconto aplicado: −{formatCurrency(couponDiscount)}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Forma de pagamento */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Forma de pagamento
              </h3>

              <div className="mt-3 grid grid-cols-3 gap-3">
                {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => {
                  const selected = paymentMethod === value;

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handlePaymentMethodChange(value)}
                      disabled={saving}
                      aria-pressed={selected}
                      className={`flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        selected
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-4 ring-indigo-500/10"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white"
                      }`}
                    >
                      <Icon size={20} />
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Campos exclusivos do cartão */}
              {paymentMethod === "cartao" && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  {/* Opção principal: valor retornado pela maquininha */}
                  <label
                    htmlFor="final-amount"
                    className="mb-1.5 block text-xs font-medium text-slate-500"
                  >
                    Valor cobrado (maquininha)
                  </label>

                  <input
                    id="final-amount"
                    type="number"
                    min="0"
                    max={amountDue}
                    step="0.01"
                    value={finalAmount}
                    onChange={(event) =>
                      setFinalAmount(limitAmount(event.target.value))
                    }
                    placeholder="Digite o valor que a maquininha retornou"
                    disabled={saving}
                    required
                    aria-invalid={chargedAboveTotal}
                    className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:ring-4 ${
                      chargedAboveTotal
                        ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                        : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10"
                    }`}
                  />

                  {chargedAboveTotal && (
                    <p className="mt-1.5 text-xs font-medium text-red-600">
                      O valor cobrado não pode ser maior que o total da compra (
                      {formatCurrency(amountDue)}).
                    </p>
                  )}

                  {/* Opção secundária: calcular pela taxa */}
                  {!showFeeCalculator ? (
                    <button
                      type="button"
                      onClick={() => setShowFeeCalculator(true)}
                      disabled={saving}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 transition hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Calculator size={14} />
                      Calcular pela taxa
                    </button>
                  ) : (
                    <div className="mt-4 border-t border-slate-200 pt-4">
                      <div className="grid gap-3 sm:grid-cols-[160px_auto_auto] sm:items-end">
                        <div>
                          <label
                            htmlFor="card-fee"
                            className="mb-1.5 block text-xs font-medium text-slate-500"
                          >
                            Taxa do cartão (%)
                          </label>

                          <input
                            id="card-fee"
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={cardFeePercentage}
                            onChange={(event) =>
                              setCardFeePercentage(
                                Number(event.target.value) > 100
                                  ? "100"
                                  : event.target.value
                              )
                            }
                            placeholder="Ex.: 3,5"
                            disabled={saving}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={calculateFinalAmount}
                          disabled={saving}
                          className="inline-flex h-[42px] items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Calculator size={16} />
                          Calcular
                        </button>

                        <button
                          type="button"
                          onClick={hideFeeCalculator}
                          disabled={saving}
                          className="inline-flex h-[42px] items-center justify-center rounded-lg px-3 text-sm font-medium text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Ocultar
                        </button>
                      </div>

                      <p className="mt-3 text-xs text-slate-500">
                        {formatCurrency(amountDue)} − taxa% = valor cobrado. O
                        resultado vai para o campo acima.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Total */}
            <div className="rounded-xl bg-gradient-to-r from-blue-50 to-violet-50 p-5">
              {selectedCoupon && (
                <div className="mb-3 space-y-1 border-b border-indigo-100 pb-3 text-sm">
                  <div className="flex justify-between text-slate-500">
                    <span>Produtos</span>
                    <span>{formatCurrency(itemsTotal)}</span>
                  </div>
                  <div className="flex justify-between font-medium text-emerald-700">
                    <span>Cupom {selectedCoupon.code}</span>
                    <span>−{formatCurrency(couponDiscount)}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Total da venda
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {usesChargedAmount
                      ? `Valor cobrado no cartão · a pagar: ${formatCurrency(
                          amountDue
                        )}`
                      : isGuest
                        ? "Venda sem cadastro: não gera pontos."
                        : "Os pontos serão calculados sobre o valor a pagar."}
                  </p>
                </div>

                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(total)}
                </p>
              </div>
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
              disabled={saving || loadingCustomers || chargedAboveTotal}
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
