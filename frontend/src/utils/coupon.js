// Funções compartilhadas sobre recompensas e cupons de desconto

export const DISCOUNT_TYPES = [
  { value: "fixed", label: "Valor fixo (R$)" },
  { value: "percentage", label: "Porcentagem (%)" },
];

export const COUPON_STATUS = {
  available: {
    label: "Disponível",
    className: "bg-emerald-50 text-emerald-700",
  },
  used: { label: "Utilizado", className: "bg-slate-100 text-slate-500" },
  expired: { label: "Vencido", className: "bg-red-50 text-red-600" },
};

export function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value) || 0);
}

export function formatDate(value) {
  if (!value) return "";

  return new Date(value).toLocaleDateString("pt-BR");
}

// "R$ 20,00 de desconto" ou "10% de desconto"
export function formatDiscount(
  discountType,
  discountValue,
  { suffix = true } = {}
) {
  if (
    discountValue === null ||
    discountValue === undefined ||
    discountValue === ""
  ) {
    return "Desconto não definido";
  }

  const text =
    discountType === "percentage"
      ? `${Number(discountValue).toLocaleString("pt-BR", {
          maximumFractionDigits: 2,
        })}%`
      : formatCurrency(discountValue);

  return suffix ? `${text} de desconto` : text;
}

// Desconto em reais que o cupom dá sobre um subtotal (nunca maior que o subtotal)
export function calculateCouponDiscount(coupon, subtotal) {
  if (!coupon) return 0;

  const base = Number(subtotal) || 0;
  const value = Number(coupon.discount_value) || 0;

  const discount =
    coupon.discount_type === "percentage"
      ? Math.round(base * value) / 100
      : value;

  return Math.min(discount, base);
}

export function getCouponStatus(status) {
  return COUPON_STATUS[status] || COUPON_STATUS.available;
}
