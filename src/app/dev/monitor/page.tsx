"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { DevEventType } from "@/lib/devEventsLogger";

interface DevEvent {
  id: number;
  event_type: string;
  entity_type?: string;
  entity_id?: string;
  details?: Record<string, unknown>;
  created_at: string;
  created_by?: string;
}

export default function DevMonitorPage() {
  const { user, students } = useApp();
  const [events, setEvents] = useState<DevEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      return;
    }
    loadEvents();
    const interval = setInterval(() => {
      if (autoRefresh) loadEvents();
    }, 3000);
    return () => clearInterval(interval);
  }, [user, autoRefresh]);

  async function loadEvents() {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from("dev_events")
        .select("*")
        .order("id", { ascending: false })
        .limit(50);
      if (error) throw error;
      setEvents(data || []);
    } catch (e) {
      console.error("Failed to load events:", e);
    } finally {
      setLoading(false);
    }
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <p className="text-zinc-500">Acesso restrito a admin</p>
      </div>
    );
  }

  const eventCounts = events.reduce(
    (acc, e) => {
      acc[e.event_type] = (acc[e.event_type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const activeStudents = students.filter((s) => s.status === "active").length;
  const pendingStudents = students.filter((s) => s.status === "pending").length;
  const totalRevenue = students.reduce((sum, s) => sum + (s.monthlyValue || 0), 0);

  return (
    <div className="min-h-screen bg-black p-6 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">📊 Dev Monitor</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => loadEvents()}
              className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-400"
            >
              Recarregar
            </button>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm">Auto-refresh 3s</span>
            </label>
          </div>
        </div>

        {/* KPIs */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <p className="text-sm text-zinc-500">Alunos Ativos</p>
            <p className="text-3xl font-bold">{activeStudents}</p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <p className="text-sm text-zinc-500">Pendentes</p>
            <p className="text-3xl font-bold text-yellow-500">{pendingStudents}</p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <p className="text-sm text-zinc-500">Total Alunos</p>
            <p className="text-3xl font-bold">{students.length}</p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <p className="text-sm text-zinc-500">Receita Mês</p>
            <p className="text-2xl font-bold text-green-400">R$ {totalRevenue.toFixed(0)}</p>
          </div>
        </div>

        {/* Event Types Distribution */}
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-bold">🔥 Tipos de Evento</h2>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {Object.entries(eventCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => (
                <div key={type} className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-2">
                  <span className="text-sm text-zinc-400">{type}</span>
                  <span className="float-right text-lg font-bold text-yellow-500">{count}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Event Feed */}
        <div>
          <h2 className="mb-4 text-xl font-bold">📜 Feed de Eventos (últimos 50)</h2>
          {loading ? (
            <p className="text-zinc-500">Carregando...</p>
          ) : events.length === 0 ? (
            <p className="text-zinc-500">Nenhum evento registrado ainda</p>
          ) : (
            <div className="space-y-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-semibold">
                        <span className="text-yellow-500">{event.event_type}</span>
                        {event.entity_type && <span className="text-zinc-600"> · {event.entity_type}</span>}
                        {event.entity_id && <span className="text-zinc-600"> #{event.entity_id}</span>}
                      </p>
                      {event.details && (
                        <p className="mt-1 text-xs text-zinc-500">
                          {JSON.stringify(event.details).substring(0, 80)}...
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 whitespace-nowrap">
                      <span className="text-xs text-zinc-600">
                        {new Date(event.created_at).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                      {event.created_by && <span className="text-[10px] text-zinc-700">{event.created_by}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
