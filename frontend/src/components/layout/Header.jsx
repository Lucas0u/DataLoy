import { Bell } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const PAGE_TITLES = [
  { prefix: "/dashboard", title: "Dashboard", subtitle: "Visão geral" },
  { prefix: "/clientes", title: "Clientes", subtitle: "Gestão de clientes" },
  { prefix: "/vendas", title: "Vendas", subtitle: "Registro de vendas" },
  { prefix: "/pontos", title: "Pontos", subtitle: "Fidelidade" },
  {
    prefix: "/recompensas",
    title: "Recompensas",
    subtitle: "Catálogo e resgates",
  },
  {
    prefix: "/relatorios",
    title: "Relatórios",
    subtitle: "Análises e exportação",
  },
];

export default function Header() {
  const { user } = useAuth();
  const location = useLocation();

  const page = PAGE_TITLES.find((item) =>
    location.pathname.startsWith(item.prefix)
  ) || { title: "DataLoy", subtitle: "" };

  return (
    <header className="h-20 border-b border-slate-200 bg-white">
      <div className="flex h-full items-center justify-between px-8">
        <div>
          <p className="text-sm text-slate-400">{page.subtitle}</p>
          <h2 className="text-xl font-semibold text-slate-900">{page.title}</h2>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            className="relative rounded-lg p-2 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
            aria-label="Notificações"
          >
            <Bell size={20} />
          </button>

          <div className="h-8 w-px bg-slate-200" />

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-800">
                {user?.name || "Usuário"}
              </p>
              <p className="text-xs text-slate-400">
                {user?.role || "Colaborador"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
