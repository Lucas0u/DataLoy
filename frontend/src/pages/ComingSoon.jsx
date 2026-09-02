import { Construction } from "lucide-react";

export default function ComingSoon({ title }) {
  return (
    <div className="mt-6 flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white">
      <Construction size={32} className="text-slate-300" />
      <p className="mt-3 text-sm font-medium text-slate-500">
        A tela de {title} está em construção.
      </p>
    </div>
  );
}
