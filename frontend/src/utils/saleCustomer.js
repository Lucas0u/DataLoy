// Nome exibido na venda: cliente cadastrado ou o nome dado na venda sem cadastro
export const DEFAULT_GUEST_NAME = "Consumidor final";

// Mesmo limite do backend (Sale::GUEST_NAME_MAX_LENGTH)
export const GUEST_NAME_MAX_LENGTH = 60;

export function isGuestSale(sale) {
  return Boolean(sale) && !sale.customer;
}

export function getSaleCustomerName(sale) {
  return sale?.customer?.name || sale?.guest_name || DEFAULT_GUEST_NAME;
}
