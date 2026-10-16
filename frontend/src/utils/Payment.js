import { Banknote, CircleHelp, CreditCard, QrCode } from "lucide-react";

// Limite para qualquer valor digitado nos formulários de venda
export const MAX_AMOUNT = 1000000;

export const PAYMENT_METHODS = [
  { value: "pix", label: "Pix", icon: QrCode },
  { value: "dinheiro", label: "Dinheiro", icon: Banknote },
  { value: "cartao", label: "Cartão", icon: CreditCard },
];

const UNKNOWN_METHOD = {
  value: "",
  label: "Não informado",
  icon: CircleHelp,
};

export function getPaymentMethod(value) {
  return (
    PAYMENT_METHODS.find((method) => method.value === value) || UNKNOWN_METHOD
  );
}

// Valor efetivamente cobrado: no cartão é o valor da maquininha,
// nos demais (e em vendas antigas) é o total dos produtos.
export function getChargedAmount(sale) {
  if (!sale) return 0;

  const finalAmount = sale.final_amount;

  if (finalAmount !== null && finalAmount !== undefined && finalAmount !== "") {
    return Number(finalAmount) || 0;
  }

  return Number(sale.total_amount) || 0;
}

// Impede que o valor digitado passe do limite
export function limitAmount(value) {
  if (value === "") return value;

  return Number(value) > MAX_AMOUNT ? String(MAX_AMOUNT) : value;
}

// Agrupa as vendas por forma de pagamento (quantidade e valor cobrado)
export function summarizeByPaymentMethod(sales = []) {
  const groups = new Map();

  sales.forEach((sale) => {
    const key = sale.payment_method || "";
    const current = groups.get(key) || {
      payment_method: key,
      sales_count: 0,
      total: 0,
    };

    current.sales_count += 1;
    current.total += getChargedAmount(sale);

    groups.set(key, current);
  });

  return Array.from(groups.values()).sort((a, b) => b.total - a.total);
}
