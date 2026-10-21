import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Printer, X } from "lucide-react";
import api from "../../services/api";

// Prévia do recibo (igual ao papel) e botão para imprimir/reimprimir
export default function ReceiptModal({ saleId, onClose }) {
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function loadReceipt() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(`/api/v1/sales/${saleId}/receipt`);

        if (!ignore) setReceipt(response.data);
      } catch (err) {
        if (!ignore) {
          setError(
            err.response?.data?.error || "Não foi possível carregar o recibo."
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadReceipt();

    return () => {
      ignore = true;
    };
  }, [saleId]);

  async function handlePrint() {
    try {
      setPrinting(true);
      setResult(null);

      const response = await api.post(`/api/v1/sales/${saleId}/print`);

      setResult({ ok: true, message: response.data.message });
    } catch (err) {
      setResult({
        ok: false,
        message:
          err.response?.data?.error || "Não foi possível imprimir o recibo.",
      });
    } finally {
      setPrinting(false);
    }
  }

  const printerConfigured = receipt?.printer?.configured;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Recibo da venda #{saleId}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Prévia de como o recibo sai na impressora.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-100 p-6">
          {loading && (
            <div className="flex justify-center py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {receipt && (
            <div className="mx-auto w-fit max-w-full overflow-x-auto bg-white px-4 py-5 shadow-md">
              <pre
                className="whitespace-pre font-mono text-[11px] leading-[1.45] text-slate-900"
                style={{ width: `${receipt.columns}ch` }}
              >
                {receipt.text}
              </pre>
            </div>
          )}
        </div>

        <div className="space-y-3 border-t border-slate-200 px-6 py-4">
          {result && (
            <div
              className={`flex items-start gap-2 rounded-xl p-3 text-sm ${
                result.ok
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-800"
              }`}
            >
              {result.ok ? (
                <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle size={17} className="mt-0.5 shrink-0" />
              )}
              {result.message}
            </div>
          )}

          {receipt && !printerConfigured && !result && (
            <p className="text-xs text-slate-500">
              Nenhuma impressora configurada para esta loja. Peça ao responsável
              técnico para configurar em{" "}
              <code className="rounded bg-slate-100 px-1">
                config/store_profiles.yml
              </code>{" "}
              ou no <code className="rounded bg-slate-100 px-1">.env</code>.
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Fechar
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={!receipt || printing}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Printer size={17} />
              {printing ? "Imprimindo..." : "Imprimir recibo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
