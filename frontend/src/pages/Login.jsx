import { useState } from "react";
import { Eye, EyeOff, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (error) {
      setError(error.response?.data?.error || "Não foi possível fazer login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl min-h-[680px] bg-white rounded-3xl shadow-2xl shadow-slate-300/60 ring-1 ring-slate-200 overflow-hidden grid grid-cols-1 lg:grid-cols-2">
        {/* Lado esquerdo */}
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-violet-700 p-10 lg:p-14 flex flex-col justify-between text-white">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/10 rounded-full" />
          <div className="absolute -bottom-32 -left-20 w-80 h-80 bg-violet-400/20 rounded-full" />
          <div className="absolute top-1/2 right-10 w-20 h-20 bg-white/5 rounded-2xl rotate-12" />

          {/* Logo */}
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold">D</span>
              </div>

              <span className="text-2xl font-bold tracking-tight">DataLoy</span>
            </div>
          </div>

          <div className="relative z-10 max-w-lg py-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-sm text-blue-50 mb-6 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-300" />
              Gestão inteligente de fidelização
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
              Transforme clientes em
              <span className="text-blue-100"> relacionamentos.</span>
            </h1>

            <p className="mt-6 text-lg leading-relaxed text-blue-100 max-w-md">
              Acompanhe vendas, pontos e recompensas em um só lugar e tome
              decisões melhores para o seu negócio.
            </p>

            <div className="mt-10 grid grid-cols-3 gap-3 max-w-md">
              <div className="rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm p-4">
                <div className="text-2xl font-bold">+</div>
                <div className="text-xs text-blue-100 mt-1">Fidelização</div>
              </div>

              <div className="rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm p-4">
                <div className="text-2xl font-bold">↗</div>
                <div className="text-xs text-blue-100 mt-1">Crescimento</div>
              </div>

              <div className="rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm p-4">
                <div className="text-2xl font-bold">∞</div>
                <div className="text-xs text-blue-100 mt-1">Possibilidades</div>
              </div>
            </div>
          </div>

          <div className="relative z-10 text-sm text-blue-100/80">
            DataLoy · Gestão e fidelização inteligente
          </div>
        </section>

        {/* Lado direito */}
        <section className="p-8 sm:p-12 lg:p-16 flex items-center">
          <div className="w-full max-w-md mx-auto">
            <div className="mb-9">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Bem-vindo de volta
              </h2>

              <p className="mt-3 text-slate-500">
                Entre na sua conta para continuar.
              </p>
            </div>

            {/* ERRO */}
            {error && (
              <div
                className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm flex items-start gap-3"
                role="alert"
              >
                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  !
                </div>

                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* E-mail */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  E-mail
                </label>

                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="seu@email.com"
                    autoComplete="username"
                    autoFocus
                    required
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />

                  <Mail
                    size={20}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </div>

              {/* Senha */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  Senha
                </label>

                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Digite sua senha"
                    autoComplete="current-password"
                    required
                    className="w-full px-4 py-3.5 pr-16 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={
                      showPassword ? "Ocultar senha" : "Mostrar senha"
                    }
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Lembrar-me */}
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />

                <label
                  htmlFor="remember"
                  className="ml-2 text-sm text-slate-500 cursor-pointer"
                >
                  Lembrar-me neste dispositivo
                </label>
              </div>

              {/* Botão */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold shadow-lg shadow-blue-600/20 transition-all duration-200 hover:-translate-y-0.5 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Entrando...
                  </span>
                ) : (
                  "Entrar"
                )}
              </button>
            </form>

            {/* Rodapé */}
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-500">
                Acesso destinado aos colaboradores da empresa.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
