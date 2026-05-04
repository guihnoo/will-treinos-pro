"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Clock, AlertCircle, Activity, X, Users } from "lucide-react";
import type { Student, Lesson } from "@/context/types";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { sendPushToUser } from "@/lib/pushRoleBroadcast";
import {
  sendCoachMessageRemote,
  fetchCoachMessagesRemote,
  updateStudentActivityRemote,
  fetchStudentActivityRemote,
  fetchLessonSessionRemote,
  startLessonSessionRemote,
  endLessonSessionRemote,
  type CoachMessage,
  type StudentActivity,
  type LessonSession,
} from "@/lib/supabasePersistence";

interface Props {
  lesson: Lesson;
  students: Student[];
  coachId: string;
  onEndLesson: () => void;
}

export default function LiveLessonCoachPanel({ lesson, students, coachId, onEndLesson }: Props) {
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [activities, setActivities] = useState<StudentActivity[]>([]);
  const [session, setSession] = useState<LessonSession | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<CoachMessage["messageType"]>("message");
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  const supabase = getSupabaseClient();

  // Fetch initial state and create session if needed
  useEffect(() => {
    const fetchData = async () => {
      if (!supabase) return;
      try {
        let sessionData = await fetchLessonSessionRemote(supabase, lesson.id);

        // Create session if one doesn't exist
        if (!sessionData) {
          const sessionId = await startLessonSessionRemote(supabase, lesson.id, coachId);
          sessionData = {
            id: sessionId,
            lessonId: lesson.id,
            startedAt: new Date().toISOString(),
            createdBy: coachId,
          };
        }

        const [messagesData, activitiesData] = await Promise.all([
          fetchCoachMessagesRemote(supabase, lesson.id, 100),
          fetchStudentActivityRemote(supabase, lesson.id),
        ]);

        setSession(sessionData);
        setMessages(messagesData);
        setActivities(activitiesData);
      } catch (error) {
        console.error("Falha ao carregar dados da aula:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase, lesson.id, coachId]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!supabase || !session) return;

    const messagesSub = supabase
      .channel(`lesson_messages_${lesson.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "lesson_coach_messages",
          filter: `lesson_id=eq.${lesson.id}`,
        },
        (payload) => {
          const newMsg = payload.new as any;
          setMessages((prev) => [...prev, {
            id: newMsg.id,
            lessonId: newMsg.lesson_id,
            sessionId: newMsg.session_id,
            coachId: newMsg.coach_id,
            messageType: newMsg.message_type,
            content: newMsg.content,
            targetStudentId: newMsg.target_student_id,
            metadata: newMsg.metadata,
            createdAt: newMsg.created_at,
          }]);
        }
      )
      .subscribe();

    const activitiesSub = supabase
      .channel(`lesson_activity_${lesson.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lesson_student_activity",
          filter: `lesson_id=eq.${lesson.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const newActivity = payload.new as any;
            setActivities((prev) => {
              const idx = prev.findIndex((a) => a.studentId === newActivity.student_id);
              if (idx >= 0) {
                const updated = [...prev];
                updated[idx] = {
                  id: newActivity.id,
                  lessonId: newActivity.lesson_id,
                  studentId: newActivity.student_id,
                  status: newActivity.status,
                  updatedAt: newActivity.updated_at,
                  updatedBy: newActivity.updated_by,
                };
                return updated;
              }
              return [...prev, {
                id: newActivity.id,
                lessonId: newActivity.lesson_id,
                studentId: newActivity.student_id,
                status: newActivity.status,
                updatedAt: newActivity.updated_at,
                updatedBy: newActivity.updated_by,
              }];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesSub);
      supabase.removeChannel(activitiesSub);
    };
  }, [supabase, lesson.id, session]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !session || !supabase) return;

    try {
      await sendCoachMessageRemote(supabase, lesson.id, session.id, coachId, {
        messageType,
        content: messageInput,
        targetStudentId: selectedStudent || undefined,
      });

      // Send push notifications
      const icon = {
        alert: "⚠️",
        activity: "📊",
        duration_change: "⏱️",
        message: "💬",
      }[messageType];

      if (selectedStudent) {
        // Individual notification
        const targetStudent = students.find((s) => s.id === selectedStudent);
        if (targetStudent?.authUserId) {
          void sendPushToUser(targetStudent.authUserId, {
            title: `${icon} ${messageType === "alert" ? "Alerta" : messageType === "activity" ? "Atividade" : messageType === "duration_change" ? "Duração" : "Mensagem"}`,
            body: messageInput,
            url: "/dashboard",
          });
        }
      } else {
        // Group notification
        presentStudents.forEach((student) => {
          if (student.authUserId) {
            void sendPushToUser(student.authUserId, {
              title: `${icon} Mensagem do Treinador`,
              body: messageInput,
              url: "/dashboard",
            });
          }
        });
      }

      setMessageInput("");
      setSelectedStudent(null);
    } catch (error) {
      console.error("Falha ao enviar mensagem:", error);
    }
  };

  const handleSetActivity = async (studentId: string, status: StudentActivity["status"]) => {
    if (!supabase) return;
    try {
      await updateStudentActivityRemote(supabase, lesson.id, studentId, status, coachId);
    } catch (error) {
      console.error("Falha ao atualizar atividade:", error);
    }
  };

  const presentStudents = lesson.presentStudents.map((id) =>
    students.find((s) => s.id === id)
  ).filter(Boolean) as Student[];

  const getActivityStatus = (studentId: string) => {
    const activity = activities.find((a) => a.studentId === studentId);
    return activity?.status || "present";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "exercising":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "resting":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "injured":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "exercising":
        return "🏋️ Exercitando";
      case "resting":
        return "😴 Descansando";
      case "injured":
        return "🩹 Lesionado";
      default:
        return "✅ Presente";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0A0A0A]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[#EAB308] border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-zinc-400">Carregando aula ao vivo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0A0A0A] text-white overflow-hidden">
      {/* Left: Student Cards Grid */}
      <div className="flex-1 overflow-y-auto p-6 border-r border-zinc-800">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{lesson.title}</h1>
            <p className="text-xs text-zinc-500 mt-1">
              {presentStudents.length} aluno{presentStudents.length !== 1 ? "s" : ""} presente{presentStudents.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {isOnline && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}
              <span className="text-xs text-zinc-500">{isOnline ? "Online" : "Offline"}</span>
            </div>
            <button
              onClick={async () => {
                if (session && supabase) {
                  try {
                    await endLessonSessionRemote(supabase, session.id);
                  } catch (error) {
                    console.error("Falha ao encerrar aula:", error);
                  }
                }
                onEndLesson();
              }}
              className="px-3 py-1.5 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded transition-colors"
            >
              Encerrar Aula
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 auto-rows-max">
          {presentStudents.map((student) => {
            const status = getActivityStatus(student.id);
            return (
              <motion.div
                key={student.id}
                layout
                className={`p-4 rounded-lg border transition-all ${getStatusColor(status)}`}
              >
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.avatar}`}
                  alt={student.name}
                  className="w-12 h-12 rounded-full mb-2"
                />
                <p className="font-bold text-sm mb-2">{student.name.split(" ")[0]}</p>
                <p className="text-xs mb-3">{getStatusLabel(status)}</p>
                <div className="flex flex-wrap gap-1">
                  {status !== "exercising" && (
                    <button
                      onClick={() => handleSetActivity(student.id, "exercising")}
                      className="px-2 py-1 text-xs bg-green-500/20 hover:bg-green-500/40 rounded border border-green-500/30 transition-colors"
                    >
                      🏋️ Exercitar
                    </button>
                  )}
                  {status !== "resting" && (
                    <button
                      onClick={() => handleSetActivity(student.id, "resting")}
                      className="px-2 py-1 text-xs bg-yellow-500/20 hover:bg-yellow-500/40 rounded border border-yellow-500/30 transition-colors"
                    >
                      😴 Descanso
                    </button>
                  )}
                  {status !== "injured" && (
                    <button
                      onClick={() => handleSetActivity(student.id, "injured")}
                      className="px-2 py-1 text-xs bg-red-500/20 hover:bg-red-500/40 rounded border border-red-500/30 transition-colors"
                    >
                      🩹 Lesão
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Right: Messages & Controls */}
      <div className="w-80 flex flex-col bg-zinc-950 border-l border-zinc-800">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#EAB308]" />
            <span className="text-sm font-bold">Mensagens</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <AnimatePresence>
            {messages.map((msg) => {
              const sender = students.find((s) => s.id === msg.coachId);
              const icon = {
                alert: "⚠️",
                activity: "📊",
                duration_change: "⏱️",
                message: "💬",
              }[msg.messageType];

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 rounded-lg text-xs ${
                    msg.messageType === "alert"
                      ? "bg-red-500/10 border border-red-500/30 text-red-200"
                      : "bg-zinc-800/50 text-zinc-300"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-sm">{icon}</span>
                    <div className="flex-1">
                      {msg.targetStudentId && (
                        <p className="text-xs font-bold text-zinc-400 mb-1">
                          @{students.find((s) => s.id === msg.targetStudentId)?.name.split(" ")[0]}
                        </p>
                      )}
                      <p>{msg.content}</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {new Date(msg.createdAt).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Message Composer */}
        <div className="p-4 border-t border-zinc-800 space-y-3">
          <div className="flex gap-2">
            <select
              value={messageType}
              onChange={(e) => setMessageType(e.target.value as CoachMessage["messageType"])}
              className="px-2 py-2 text-xs bg-zinc-900 border border-zinc-700 rounded outline-none focus:border-[#EAB308]"
            >
              <option value="message">💬 Mensagem</option>
              <option value="alert">⚠️ Alerta</option>
              <option value="activity">📊 Atividade</option>
              <option value="duration_change">⏱️ Duração</option>
            </select>
            <select
              value={selectedStudent || ""}
              onChange={(e) => setSelectedStudent(e.target.value || null)}
              className="px-2 py-2 text-xs bg-zinc-900 border border-zinc-700 rounded outline-none focus:border-[#EAB308] flex-1"
            >
              <option value="">Todos</option>
              {presentStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  @{s.name.split(" ")[0]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Mensagem para o grupo..."
              className="flex-1 px-3 py-2 text-sm bg-zinc-900 border border-zinc-700 rounded outline-none focus:border-[#EAB308] placeholder-zinc-600"
            />
            <button
              onClick={handleSendMessage}
              disabled={!messageInput.trim()}
              className="px-3 py-2 bg-[#EAB308] text-black rounded font-bold text-sm hover:bg-[#EAB308]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
