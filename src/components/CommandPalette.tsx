"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Users, CalendarRange, Wallet, Rss, Trophy, Settings,
  UserPlus, CalendarPlus, Zap, LayoutDashboard, User, ChevronRight,
  Star, LogOut,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import { useAuth } from "@/context/AuthContext";
import { useStudents } from "@/context/StudentsContext";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import { avatarSrc } from "@/lib/avatarSrc";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreateLesson?: () => void;
}

export default function CommandPalette({ open, onClose, onCreateLesson }: Props) {
  const { user, logout } = useAuth();
  const { students } = useStudents();
  const router = useRouter();
  const [query, setQuery] = useState("");

  useBodyScrollLock(open);

  // Reset query when closing
  useEffect(() => {
    if (!open) setTimeout(() => setQuery(""), 200);
  }, [open]);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        // Toggle handled by parent
      }
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Fuse.js fuzzy search over active students
  const fuse = useMemo(() =>
    new Fuse(students.filter(s => s.status !== "suspended"), {
      keys: ["name", "email", "phone"],
      threshold: 0.35,
      minMatchCharLength: 2,
    }), [students]);

  const matchedStudents = useMemo(() => {
    if (!query || query.length < 2) return students.filter(s => s.status === "active").slice(0, 5);
    return fuse.search(query).slice(0, 6).map(r => r.item);
  }, [query, fuse, students]);

  const go = useCallback((href: string) => {
    onClose();
    router.push(href);
  }, [onClose, router]);

  const isAdmin = user?.role === "admin";
  const isCoach = user?.role === "coach" || isAdmin;
  const isAluno = user?.role === "aluno";

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Palette */}
          <motion.div
            key="palette"
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ type: "spring", stiffness: 400, damping: 32, mass: 0.7 }}
            className="fixed top-[10vh] left-1/2 -translate-x-1/2 z-[210] w-[min(92vw,560px)]"
            role="dialog"
            aria-modal="true"
            aria-label="Busca global"
          >
            <Command
              className="rounded-2xl border border-white/[0.1] bg-[#0D0D0D] shadow-[0_32px_100px_rgba(0,0,0,0.9)] overflow-hidden"
              shouldFilter={false}
            >
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06]">
                <Search className="h-4 w-4 text-zinc-500 flex-shrink-0" />
                <Command.Input
                  value={query}
                  onValueChange={setQuery}
                  placeholder="Buscar aluno, navegar, ação rápida…"
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-600 outline-none"
                  autoFocus
                />
                <kbd className="hidden sm:flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-[10px] font-mono text-zinc-500">
                  ESC
                </kbd>
              </div>

              <Command.List className="max-h-[60vh] overflow-y-auto p-2">
                <Command.Empty className="py-10 text-center text-sm text-zinc-600">
                  Nenhum resultado para &ldquo;{query}&rdquo;
                </Command.Empty>

                {/* Alunos */}
                {isCoach && matchedStudents.length > 0 && (
                  <Command.Group heading="Atletas">
                    {matchedStudents.map(s => (
                      <Command.Item
                        key={s.id}
                        value={s.name}
                        onSelect={() => go(`/atleta/${s.id}`)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-200 cursor-pointer data-[selected=true]:bg-white/[0.07] data-[selected=true]:text-white transition-colors"
                      >
                        <img
                          src={avatarSrc(s.avatar, s.name)}
                          alt=""
                          className="h-7 w-7 rounded-full object-cover flex-shrink-0 border border-white/10"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{s.name}</p>
                          {s.plan && <p className="text-[10px] text-zinc-600 truncate">{s.plan}</p>}
                        </div>
                        <span className={`ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                          s.status === "active" ? "bg-emerald-500/15 text-emerald-400" :
                          s.status === "pending" ? "bg-amber-500/15 text-amber-400" :
                          "bg-zinc-800 text-zinc-500"
                        }`}>
                          {s.status === "active" ? "Ativo" : s.status === "pending" ? "Pendente" : s.status}
                        </span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {/* Ações rápidas */}
                {(!query || query.length < 2) && (
                  <Command.Group heading="Ações rápidas">
                    {isCoach && (
                      <Command.Item
                        value="nova aula criar aula"
                        onSelect={() => { onClose(); onCreateLesson?.(); }}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-200 cursor-pointer data-[selected=true]:bg-[#EAB308]/10 data-[selected=true]:text-[#EAB308] transition-colors"
                      >
                        <CalendarPlus className="h-4 w-4 text-[#EAB308]" />
                        <span className="font-semibold">Nova Aula</span>
                        <kbd className="ml-auto text-[9px] text-zinc-600 border border-zinc-800 rounded px-1.5 py-0.5">N</kbd>
                      </Command.Item>
                    )}
                    {isAdmin && (
                      <Command.Item
                        value="novo aluno cadastrar aluno"
                        onSelect={() => go("/cadastro?invite=1")}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-200 cursor-pointer data-[selected=true]:bg-white/[0.07] transition-colors"
                      >
                        <UserPlus className="h-4 w-4 text-zinc-400" />
                        <span className="font-semibold">Novo Aluno</span>
                      </Command.Item>
                    )}
                  </Command.Group>
                )}

                {/* Navegação */}
                {(!query || query.length < 2) && (
                  <Command.Group heading="Navegar">
                    <Command.Item value="início dashboard hoje" onSelect={() => go("/dashboard")}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-200 cursor-pointer data-[selected=true]:bg-white/[0.07] transition-colors">
                      <LayoutDashboard className="h-4 w-4 text-zinc-400" /> Início
                    </Command.Item>
                    <Command.Item value="agenda calendário aulas" onSelect={() => go("/agenda")}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-200 cursor-pointer data-[selected=true]:bg-white/[0.07] transition-colors">
                      <CalendarRange className="h-4 w-4 text-zinc-400" /> Agenda
                    </Command.Item>
                    {isCoach && (
                      <Command.Item value="turma alunos lista" onSelect={() => go("/alunos")}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-200 cursor-pointer data-[selected=true]:bg-white/[0.07] transition-colors">
                        <Users className="h-4 w-4 text-zinc-400" /> Turma
                      </Command.Item>
                    )}
                    {isAdmin && (
                      <Command.Item value="financeiro pagamentos" onSelect={() => go("/financeiro")}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-200 cursor-pointer data-[selected=true]:bg-white/[0.07] transition-colors">
                        <Wallet className="h-4 w-4 text-zinc-400" /> Financeiro
                      </Command.Item>
                    )}
                    <Command.Item value="feed rede social" onSelect={() => go("/feed")}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-200 cursor-pointer data-[selected=true]:bg-white/[0.07] transition-colors">
                      <Rss className="h-4 w-4 text-zinc-400" /> A Rede
                    </Command.Item>
                    {isAluno && (
                      <Command.Item value="ranking placar xp" onSelect={() => go("/ranking")}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-200 cursor-pointer data-[selected=true]:bg-white/[0.07] transition-colors">
                        <Trophy className="h-4 w-4 text-zinc-400" /> Ranking
                      </Command.Item>
                    )}
                    {isAdmin && (
                      <Command.Item value="configurações admin settings" onSelect={() => go("/configuracoes")}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-200 cursor-pointer data-[selected=true]:bg-white/[0.07] transition-colors">
                        <Settings className="h-4 w-4 text-zinc-400" /> Configurações
                      </Command.Item>
                    )}
                  </Command.Group>
                )}

                {/* Conta */}
                {(!query || query.length < 2) && (
                  <Command.Group heading="Conta">
                    <Command.Item value="perfil minha conta" onSelect={() => go("/perfil")}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-200 cursor-pointer data-[selected=true]:bg-white/[0.07] transition-colors">
                      <User className="h-4 w-4 text-zinc-400" /> Meu Perfil
                    </Command.Item>
                    <Command.Item value="sair logout" onSelect={() => { onClose(); logout(); router.push("/login"); }}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-400 cursor-pointer data-[selected=true]:bg-red-500/8 transition-colors">
                      <LogOut className="h-4 w-4" /> Sair da conta
                    </Command.Item>
                  </Command.Group>
                )}
              </Command.List>

              {/* Footer hint */}
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/[0.05] text-[10px] text-zinc-700">
                <span>↑↓ navegar</span>
                <span>↵ selecionar</span>
                <span>ESC fechar</span>
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
