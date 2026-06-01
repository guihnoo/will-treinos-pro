"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { STUDENT_TAGS, type StudentTag } from "@/lib/studentTags";
import { useToast } from "@/components/Toast";

interface Props {
  studentId: string;
  currentTags: string[];
  onSave: (tags: string[]) => void;
}

const ALL_TAGS = Object.entries(STUDENT_TAGS) as [StudentTag, (typeof STUDENT_TAGS)[StudentTag]][];

export default function StudentTagsEditor({ studentId, currentTags, onSave }: Props) {
  const { toast } = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set(currentTags));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggle = (tag: StudentTag) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { getSupabaseClient } = await import("@/lib/supabaseClient");
      const sb = getSupabaseClient();
      const tagsArray = Array.from(selected);
      const { error } = await sb
        .from("students")
        .update({ tags: tagsArray })
        .eq("id", studentId);
      if (error) throw error;
      onSave(tagsArray);
      setSaved(true);
      toast("Tags salvas!");
      setTimeout(() => setSaved(false), 3000);
    } catch {
      toast("Erro ao salvar tags.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-800/70 bg-zinc-950/60 p-3">
      <p className="mb-2.5 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
        Etiquetas do coach
      </p>
      <div className="flex flex-wrap gap-2">
        {ALL_TAGS.map(([key, tag]) => {
          const active = selected.has(key);
          return (
            <motion.button
              key={key}
              whileTap={{ scale: 0.92 }}
              type="button"
              data-testid={`tag-chip-${key}`}
              onClick={() => toggle(key)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold transition-all ${
                active
                  ? `${tag.bg} ${tag.border}`
                  : "border-zinc-700/50 bg-zinc-900/60 text-zinc-500 hover:border-zinc-600"
              }`}
              style={active ? { color: tag.color } : {}}
            >
              <span>{tag.icon}</span>
              {tag.label}
            </motion.button>
          );
        })}
      </div>

      <motion.button
        whileTap={{ scale: 0.96 }}
        type="button"
        data-testid="btn-save-tags"
        onClick={() => void handleSave()}
        disabled={saving}
        className="mt-3 flex items-center gap-1.5 rounded-xl border border-[#EAB308]/35 bg-[#EAB308]/10 px-4 py-2 text-[11px] font-black text-amber-200 transition-all hover:bg-[#EAB308]/20 disabled:opacity-50"
      >
        {saving ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : saved ? (
          <Check className="h-3.5 w-3.5 text-emerald-400" />
        ) : null}
        {saved ? "Tags salvas!" : "Salvar tags"}
      </motion.button>
    </div>
  );
}
