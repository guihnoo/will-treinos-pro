"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings, MapPin, Clock, Tag, Plus, X, Trash2, Edit3,
  ExternalLink, Save, ChevronRight, Globe, QrCode
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/components/Toast";
import UserAvatar from "@/components/ui/UserAvatar";
import type { AppConfig } from "@/context/types";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";

type Tab = "categorias" | "locais" | "jornada" | "recebimentos";

export default function ConfigPage() {
  const {
    user,
    categories, venues, workHours,
    addCategory, updateCategory, deleteCategory,
    addVenue, updateVenue, deleteVenue, setWorkHours,
    getVenueMapsUrl,
    appConfig,
    updateAppConfig,
  } = useApp();
  const { toast } = useToast();

  const [tab, setTab] = useState<Tab>("categorias");
  const [pixDraft, setPixDraft] = useState<AppConfig>(appConfig);

  useEffect(() => {
    setPixDraft(appConfig);
  }, [appConfig]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash === "#recebimentos" && user?.role !== "aluno") {
      setTab("recebimentos");
    }
  }, [user]);
  const [showAddCat, setShowAddCat] = useState(false);
  const [showAddVenue, setShowAddVenue] = useState(false);
  useBodyScrollLock(showAddCat || showAddVenue);
  const [newCat, setNewCat] = useState({ name: "", color: "#EAB308", emoji: "🏐", maxStudents: 10, defaultPrice: 100, isCustom: true });
  const [newVenue, setNewVenue] = useState({ name: "", photo: "", address: "", lat: -22.9, lng: -43.2 });
  const [wh, setWh] = useState(workHours);

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    ...(user?.role !== "aluno" ? [{ key: "recebimentos" as const, label: "Recebimentos PIX", icon: QrCode }] : []),
    { key: "categorias", label: "Categorias", icon: Tag },
    { key: "locais", label: "Locais", icon: MapPin },
    { key: "jornada", label: "Jornada", icon: Clock },
  ];

  const handleAddCat = () => {
    if (!newCat.name) return;
    addCategory(newCat);
    setNewCat({ name: "", color: "#EAB308", emoji: "🏐", maxStudents: 10, defaultPrice: 100, isCustom: true });
    setShowAddCat(false);
  };

  const handleAddVenue = () => {
    if (!newVenue.name) return;
    addVenue(newVenue);
    setNewVenue({ name: "", photo: "", address: "", lat: -22.9, lng: -43.2 });
    setShowAddVenue(false);
  };

  const handleSaveWH = () => { setWorkHours(wh); };

  const EMOJIS = ["🏐","⚡","🚀","✨","💪","🏆","⭐","🎯","👶","👫","👥","🎓","🧘","🏃","💎","🌊"];

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-28">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Settings className="w-8 h-8 text-[#EAB308]" /> Configurações
          </h1>
          {user ? (
            <div onClick={() => window.location.href = '/perfil'} className="flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-black/35 px-3 py-2 cursor-pointer hover:bg-zinc-900 transition-colors">
              <UserAvatar name={user.name} photo={user.avatar} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-white">{user.name}</p>
                <p className="text-[10px] uppercase tracking-wide text-zinc-500">Editar Perfil</p>
              </div>
            </div>
          ) : null}
        </div>
        <p className="text-zinc-500 mt-1">Categorias, locais, jornada e — na área do staff — chave PIX que o aluno usa para pagar.</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map(t => (
          <motion.button key={t.key} whileTap={{ scale: 0.95 }}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all border ${
              tab === t.key
                ? "bg-[#EAB308] text-black border-[#EAB308] shadow-[0_0_15px_rgba(234,179,8,0.2)]"
                : "bg-[#0A0A0A] text-zinc-400 border-zinc-800 hover:border-zinc-600"
            }`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </motion.button>
        ))}
      </div>

      {/* ─── RECEBIMENTOS (staff): PIX exibido ao aluno — comprovante só na área do aluno ─── */}
      {tab === "recebimentos" && user?.role !== "aluno" && (
        <motion.div id="recebimentos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="bg-[#0A0A0A] border border-zinc-800/60 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-[#EAB308]" /> Dados de recebimento PIX
            </h2>
            <p className="text-sm text-zinc-500 mb-6">
              Você recebe nesta chave. O aluno vê estes dados em <strong className="text-zinc-400">Financeiro</strong> e registra o comprovante por lá — você confirma o pagamento no painel financeiro admin.
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Nome no PIX (recebedor)</label>
                <input
                  value={pixDraft.pixOwnerName}
                  onChange={(e) => setPixDraft((p) => ({ ...p, pixOwnerName: e.target.value }))}
                  className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-[#EAB308]/50"
                  placeholder="Ex.: Will Treinos / CNPJ fantasia"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Tipo de chave</label>
                <select
                  value={pixDraft.pixKeyType}
                  onChange={(e) => setPixDraft((p) => ({ ...p, pixKeyType: e.target.value as AppConfig["pixKeyType"] }))}
                  className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-[#EAB308]/50"
                >
                  <option value="email">E-mail</option>
                  <option value="cpf">CPF</option>
                  <option value="telefone">Telefone</option>
                  <option value="aleatoria">Chave aleatória</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Chave PIX</label>
                <input
                  value={pixDraft.pixKey}
                  onChange={(e) => setPixDraft((p) => ({ ...p, pixKey: e.target.value }))}
                  className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white text-sm font-mono outline-none focus:border-[#EAB308]/50"
                  placeholder="E-mail, CPF, telefone ou chave copia e cola"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">WhatsApp para cobrança / comprovante</label>
                <input
                  value={pixDraft.whatsappNumber}
                  onChange={(e) => setPixDraft((p) => ({ ...p, whatsappNumber: e.target.value }))}
                  className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-[#EAB308]/50"
                  placeholder="5511999999999 (com DDD)"
                />
                <p className="text-[11px] text-zinc-600 mt-1.5">Usado nos templates do cockpit e no botão de comprovante do aluno.</p>
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() => {
                  updateAppConfig(pixDraft);
                  toast("Dados de recebimento salvos.");
                }}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#EAB308] text-black font-bold text-sm"
              >
                <Save className="w-4 h-4" /> Salvar recebimentos
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── CATEGORIAS ─── */}
      {tab === "categorias" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold text-white">Categorias de Aula</h2>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowAddCat(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#EAB308] text-black rounded-xl text-sm font-bold">
              <Plus className="w-4 h-4" /> Nova Categoria
            </motion.button>
          </div>

          {categories.map((cat, i) => (
            <motion.div key={cat.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center justify-between p-4 bg-[#0A0A0A] border border-zinc-800/50 rounded-xl hover:border-zinc-700 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: `${cat.color}20` }}>
                  {cat.emoji}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{cat.name}</span>
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: cat.color }} />
                    {cat.isCustom && <span className="text-[9px] font-bold text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">CUSTOM</span>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5">
                    <span>Máx: {cat.maxStudents} alunos</span>
                    <span>R$ {cat.defaultPrice}</span>
                  </div>
                </div>
              </div>

              {cat.isCustom && (
                <motion.button whileTap={{ scale: 0.9 }}
                  onClick={() => deleteCategory(cat.id)}
                  className="p-2 rounded-lg text-zinc-600 hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors opacity-0 group-hover:opacity-100">
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              )}
            </motion.div>
          ))}

          {/* Add Category Modal */}
          <AnimatePresence>
            {showAddCat && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                role="dialog"
                aria-modal="true"
                data-modal-overlay
                aria-label="Nova categoria"
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                onClick={() => setShowAddCat(false)}>
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                  onClick={e => e.stopPropagation()}
                  className="bg-[#0A0A0A] border border-zinc-800 rounded-2xl p-6 max-w-md w-full">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-bold text-white">Nova Categoria</h3>
                    <button onClick={() => setShowAddCat(false)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Emoji</label>
                      <div className="flex flex-wrap gap-2">
                        {EMOJIS.map(e => (
                          <motion.button key={e} whileTap={{ scale: 0.9 }}
                            onClick={() => setNewCat(p => ({ ...p, emoji: e }))}
                            className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg border transition-all ${
                              newCat.emoji === e ? "border-[#EAB308] bg-[#EAB308]/10" : "border-zinc-800 bg-black/50 hover:border-zinc-600"
                            }`}>{e}</motion.button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Nome</label>
                      <input value={newCat.name} onChange={e => setNewCat(p => ({ ...p, name: e.target.value }))}
                        placeholder="Ex: Beach Vôlei" className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-[#EAB308]/50 placeholder-zinc-600" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Cor</label>
                        <input type="color" value={newCat.color} onChange={e => setNewCat(p => ({ ...p, color: e.target.value }))}
                          className="w-full h-10 rounded-xl border border-zinc-800 bg-black cursor-pointer" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Máx Alunos</label>
                        <input type="number" value={newCat.maxStudents} onChange={e => setNewCat(p => ({ ...p, maxStudents: parseInt(e.target.value) || 1 }))}
                          className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-[#EAB308]/50" />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Preço Padrão (R$)</label>
                      <input type="number" value={newCat.defaultPrice} onChange={e => setNewCat(p => ({ ...p, defaultPrice: parseInt(e.target.value) || 0 }))}
                        className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-[#EAB308]/50" />
                    </div>

                    <motion.button whileTap={{ scale: 0.97 }} onClick={handleAddCat}
                      className="w-full py-3 rounded-xl bg-[#EAB308] text-black font-bold text-sm shadow-[0_0_20px_rgba(234,179,8,0.15)]">
                      Criar Categoria
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ─── LOCAIS ─── */}
      {tab === "locais" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold text-white">Locais de Treino</h2>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowAddVenue(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#EAB308] text-black rounded-xl text-sm font-bold">
              <Plus className="w-4 h-4" /> Novo Local
            </motion.button>
          </div>

          {venues.map((v, i) => (
            <motion.div key={v.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 bg-[#0A0A0A] border border-zinc-800/50 rounded-xl hover:border-zinc-700 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EAB308]/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-[#EAB308]" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-sm">{v.name}</span>
                    <p className="text-xs text-zinc-500 mt-0.5">{v.address}</p>
                    <p className="text-[10px] text-zinc-600 mt-1 font-mono">{v.lat.toFixed(4)}, {v.lng.toFixed(4)}</p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <a href={getVenueMapsUrl(v.id)} target="_blank" rel="noopener"
                    className="p-2 rounded-lg text-zinc-600 hover:text-[#EAB308] hover:bg-[#EAB308]/10 transition-colors">
                    <Globe className="w-4 h-4" />
                  </a>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => deleteVenue(v.id)}
                    className="p-2 rounded-lg text-zinc-600 hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Add Venue Modal */}
          <AnimatePresence>
            {showAddVenue && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                role="dialog"
                aria-modal="true"
                data-modal-overlay
                aria-label="Novo local de treino"
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                onClick={() => setShowAddVenue(false)}>
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                  onClick={e => e.stopPropagation()}
                  className="bg-[#0A0A0A] border border-zinc-800 rounded-2xl p-6 max-w-md w-full">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-bold text-white">Novo Local</h3>
                    <button onClick={() => setShowAddVenue(false)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Nome</label>
                      <input value={newVenue.name} onChange={e => setNewVenue(p => ({ ...p, name: e.target.value }))}
                        placeholder="Ex: Ginásio Olímpico" className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-[#EAB308]/50 placeholder-zinc-600" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Endereço</label>
                      <input value={newVenue.address} onChange={e => setNewVenue(p => ({ ...p, address: e.target.value }))}
                        placeholder="Rua, número — Bairro, Cidade" className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-[#EAB308]/50 placeholder-zinc-600" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Latitude</label>
                        <input type="number" step="0.0001" value={newVenue.lat} onChange={e => setNewVenue(p => ({ ...p, lat: parseFloat(e.target.value) || 0 }))}
                          className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-[#EAB308]/50" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Longitude</label>
                        <input type="number" step="0.0001" value={newVenue.lng} onChange={e => setNewVenue(p => ({ ...p, lng: parseFloat(e.target.value) || 0 }))}
                          className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-[#EAB308]/50" />
                      </div>
                    </div>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={handleAddVenue}
                      className="w-full py-3 rounded-xl bg-[#EAB308] text-black font-bold text-sm shadow-[0_0_20px_rgba(234,179,8,0.15)]">
                      Adicionar Local
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ─── JORNADA ─── */}
      {tab === "jornada" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="bg-[#0A0A0A] border border-zinc-800/60 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#EAB308]" /> Jornada de Trabalho
            </h2>
            <p className="text-sm text-zinc-500 mb-6">Defina o horário de funcionamento padrão. A agenda respeitará esses limites.</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Início</label>
                <input type="time" value={wh.start} onChange={e => setWh(p => ({ ...p, start: e.target.value }))}
                  className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white text-lg font-mono outline-none focus:border-[#EAB308]/50" />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Fim</label>
                <input type="time" value={wh.end} onChange={e => setWh(p => ({ ...p, end: e.target.value }))}
                  className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white text-lg font-mono outline-none focus:border-[#EAB308]/50" />
              </div>
            </div>

            {/* Visual timeline */}
            <div className="bg-black rounded-xl p-4 border border-zinc-900 mb-6">
              <div className="flex items-center justify-between text-xs text-zinc-600 mb-2">
                <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
              </div>
              <div className="h-6 bg-zinc-900 rounded-full relative overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    left: `${(parseInt(wh.start) / 24) * 100}%`,
                    width: `${((parseInt(wh.end) - parseInt(wh.start)) / 24) * 100}%`,
                  }}
                  transition={{ duration: 0.5 }}
                  className="absolute h-full bg-gradient-to-r from-[#EAB308] to-[#F97316] rounded-full"
                />
              </div>
              <p className="text-center text-sm text-zinc-400 mt-3">
                {parseInt(wh.end) - parseInt(wh.start)}h de operação diária
              </p>
            </div>

            <motion.button whileTap={{ scale: 0.97 }} onClick={handleSaveWH}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#EAB308] text-black font-bold text-sm">
              <Save className="w-4 h-4" /> Salvar Jornada
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
