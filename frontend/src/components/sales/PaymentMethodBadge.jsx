import { getPaymentMethod } from "../../utils/payment";

const BADGE_STYLES = {
  pix: "bg-teal-50 text-teal-700",
  dinheiro: "bg-emerald-50 text-emerald-700",
  cartao: "bg-indigo-50 text-indigo-700",
};

export default function PaymentMethodBadge({ method }) {
  const { label, icon: Icon } = getPaymentMethod(method);
  const style = BADGE_STYLES[method] || "bg-slate-100 text-slate-500";

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}
    >
      <Icon size={13} />
      {label}
    </span>
  );
}
