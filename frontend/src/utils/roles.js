// Perfis de acesso: admin (administrador) e employee (vendedor)

export const ROLE_LABELS = {
  admin: "Administrador",
  employee: "Vendedor",
};

export function isAdmin(user) {
  return user?.role === "admin";
}

export function getRoleLabel(role) {
  return ROLE_LABELS[role] || "Colaborador";
}

// Página inicial de cada perfil (o vendedor não acessa o dashboard)
export function getHomePath(user) {
  return isAdmin(user) ? "/dashboard" : "/vendas";
}
