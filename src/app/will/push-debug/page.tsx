"use client";

import { useState } from "react";
import { Bell, Send, AlertCircle, CheckCircle } from "lucide-react";

interface PushTestResult {
  success: boolean;
  message?: string;
  result?: { sent: number; failed: number };
  error?: string;
  debugInfo?: {
    vapidConfigured: boolean;
    targetRole: string;
    callerRole: string;
  };
}

export default function PushDebugPage() {
  const [role, setRole] = useState<"aluno" | "professor" | "admin">("aluno");
  const [title, setTitle] = useState("Teste Will Treinos");
  const [body, setBody] = useState("Esta é uma notificação de teste");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PushTestResult | null>(null);

  async function handleSendTest() {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(
        `/api/push/test?role=${role}&title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`,
        {
          method: "POST",
        }
      );

      const data = (await response.json()) as PushTestResult;
      setResult(data);
    } catch (err) {
      setResult({
        success: false,
        error: err instanceof Error ? err.message : "Erro desconhecido",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Bell className="w-6 h-6 text-yellow-400" />
            <h1 className="text-2xl font-bold text-white">Debug Push Notifications</h1>
          </div>
          <p className="text-zinc-400 text-sm">
            Dispare notificações de teste para validar a configuração end-to-end.
          </p>
        </div>

        {/* Form */}
        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 mb-6 space-y-4">
          {/* Target Role */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Enviar para (role):
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "aluno" | "professor" | "admin")}
              className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white text-sm"
            >
              <option value="aluno">Alunos</option>
              <option value="professor">Professores</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Título:
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Novo check-in"
              className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white text-sm placeholder-zinc-500"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Mensagem:
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Ex: João solicitou check-in"
              rows={3}
              className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white text-sm placeholder-zinc-500 resize-none"
            />
          </div>

          {/* Send Button */}
          <button
            onClick={handleSendTest}
            disabled={loading}
            className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-500/50 text-black font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            {loading ? "Enviando..." : "Enviar Notificação de Teste"}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div
            className={`border rounded-2xl p-6 ${
              result.success
                ? "bg-green-500/10 border-green-500/30"
                : "bg-red-500/10 border-red-500/30"
            }`}
          >
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <h3 className={`font-bold ${result.success ? "text-green-400" : "text-red-400"}`}>
                  {result.message || result.error}
                </h3>

                {result.result && (
                  <div className="mt-2 text-sm text-zinc-300 space-y-1">
                    <p>✅ Enviado: {result.result.sent}</p>
                    <p>❌ Falhou: {result.result.failed}</p>
                  </div>
                )}

                {result.debugInfo && (
                  <div className="mt-3 p-3 bg-black/30 rounded-lg text-xs text-zinc-400 space-y-1 font-mono">
                    <p>VAPID: {result.debugInfo.vapidConfigured ? "✅ Configurado" : "❌ Faltando"}</p>
                    <p>Seu role: {result.debugInfo.callerRole}</p>
                    <p>Destino: {result.debugInfo.targetRole}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Instruções */}
        <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
          <h3 className="font-bold text-blue-400 mb-3">📱 Como testar no celular:</h3>
          <ol className="text-sm text-zinc-300 space-y-2 list-decimal list-inside">
            <li>Abra o app no celular (iOS ou Android)</li>
            <li>Ative notificações quando o banner aparecer</li>
            <li>Volte para a web e teste acima</li>
            <li>
              Verifique se a notificação aparece no celular{" "}
              <strong>mesmo com o app fechado</strong>
            </li>
            <li>Clique na notificação → deve abrir o app em /dashboard</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
