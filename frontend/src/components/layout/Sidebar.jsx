import {
  BarChart3,
  CircleDollarSign,
  Gift,
  LayoutDashboard,
  LogOut,
  Medal,
  Users,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const menuItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Clientes",
    path: "/clientes",
    icon: Users,
  },
  {
    label: "Vendas",
    path: "/vendas",
    icon: CircleDollarSign,
  },
  {
    label: "Pontos",
    path: "/pontos",
    icon: Medal,
  },
  {
    label: "Recompensas",
    path: "/recompensas",
    icon: Gift,
  },
  {
    label: "Relatórios",
    path: "/relatorios",
    icon: BarChart3,
  },
];

export default function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-gradient-to-b from-slate-950 via-slate-950 to-indigo-950 text-white">
      <div className="flex h-20 items-center border-b border-white/10 px-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Data<span className="text-indigo-400">Loy</span>
          </h1>

          <p className="mt-0.5 text-xs text-slate-500">Gestão de fidelidade</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-6">
        <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
          Menu principal
        </p>

        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-950/30"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={19}
                      strokeWidth={isActive ? 2.2 : 1.8}
                      className="shrink-0"
                    />

                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-white/10 p-4">
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-400 transition-all duration-200 hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut size={19} strokeWidth={1.8} />

          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
