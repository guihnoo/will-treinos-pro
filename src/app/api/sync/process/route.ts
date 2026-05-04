import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { QueuedAction } from "@/lib/syncQueue";

/**
 * POST /api/sync/process
 *
 * Processa uma ação da fila offline.
 * O app envia JWT + ação, e o servidor:
 * 1. Valida JWT
 * 2. Executa a ação (ex: create check-in no Supabase)
 * 3. Retorna sucesso ou erro
 */

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  // Validar JWT
  const authHeader = req.headers.get("authorization") ?? "";
  const jwt = authHeader.replace("Bearer ", "");
  if (!jwt) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const client = createClient(supabaseUrl, anonKey);
  const { data: { user }, error: authError } = await client.auth.getUser(jwt);
  if (authError || !user) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  // Parsear ação
  let action: QueuedAction;
  try {
    action = await req.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  // Processar ação conforme tipo
  try {
    switch (action.action) {
      case "requestCheckIn": {
        return await handleRequestCheckIn(client as any, user.id, action);
      }

      case "approveCheckIn": {
        return await handleApproveCheckIn(client as any, user.id, action);
      }

      case "addPost": {
        return await handleAddPost(client as any, user.id, action);
      }

      case "togglePostLike": {
        return await handleTogglePostLike(client as any, user.id, action);
      }

      case "addPaymentProof": {
        return await handleAddPaymentProof(client as any, user.id, action);
      }

      default:
        return NextResponse.json({ error: `Ação desconhecida: ${action.action}` }, { status: 400 });
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json(
      { error: errorMsg, action: action.action },
      { status: 500 },
    );
  }
}

async function handleRequestCheckIn(
  client: any,
  userId: string,
  action: QueuedAction,
) {
  const { lessonId, studentId } = action.payload as {
    lessonId: string;
    studentId: string;
  };

  if (!lessonId || !studentId) {
    return NextResponse.json({ error: "lessonId e studentId obrigatórios" }, { status: 400 });
  }

  const arrivedAt = new Date().toISOString();

  // Buscar lição atual
  const { data: lesson, error: fetchError } = await client
    .from("lessons")
    .select("check_in_requests")
    .eq("id", lessonId)
    .single();

  if (fetchError || !lesson) {
    return NextResponse.json({ error: "Lição não encontrada" }, { status: 404 });
  }

  // Adicionar check-in request
  const checkInRequests = lesson.check_in_requests || [];
  if (checkInRequests.some((r: { studentId: string }) => r.studentId === studentId)) {
    // Já existe request pendente
    return NextResponse.json({ ok: true, message: "Check-in já solicitado" });
  }

  const updated = [
    ...checkInRequests,
    { studentId, arrivedAt, status: "pending" },
  ];

  const { error: updateError } = await client
    .from("lessons")
    .update({ check_in_requests: updated })
    .eq("id", lessonId);

  if (updateError) {
    throw new Error(`Falha ao sincronizar check-in: ${updateError.message}`);
  }

  return NextResponse.json({ ok: true, action: "requestCheckIn", lessonId });
}

async function handleApproveCheckIn(
  client: any,
  userId: string,
  action: QueuedAction,
) {
  const { lessonId, studentId } = action.payload as {
    lessonId: string;
    studentId: string;
  };

  if (!lessonId || !studentId) {
    return NextResponse.json({ error: "lessonId e studentId obrigatórios" }, { status: 400 });
  }

  // Buscar lição com check-in requests
  const { data: lesson, error: fetchError } = await client
    .from("lessons")
    .select("check_in_requests, present_students")
    .eq("id", lessonId)
    .single();

  if (fetchError || !lesson) {
    return NextResponse.json({ error: "Lição não encontrada" }, { status: 404 });
  }

  // Encontrar check-in request do aluno
  const checkInRequests = lesson.check_in_requests || [];
  const requestIndex = checkInRequests.findIndex((r: { studentId: string }) => r.studentId === studentId);

  if (requestIndex === -1) {
    return NextResponse.json({ error: "Check-in request não encontrado" }, { status: 404 });
  }

  // Atualizar request para "approved"
  const approvedRequest = {
    ...checkInRequests[requestIndex],
    status: "approved",
    approvedAt: new Date().toISOString(),
  };

  const updated = [
    ...checkInRequests.slice(0, requestIndex),
    approvedRequest,
    ...checkInRequests.slice(requestIndex + 1),
  ];

  // Adicionar à lista de presentes se ainda não estiver
  const presentStudents = lesson.present_students || [];
  if (!presentStudents.includes(studentId)) {
    presentStudents.push(studentId);
  }

  const { error: updateError } = await client
    .from("lessons")
    .update({
      check_in_requests: updated,
      present_students: presentStudents,
    })
    .eq("id", lessonId);

  if (updateError) {
    throw new Error(`Falha ao aprovar check-in: ${updateError.message}`);
  }

  return NextResponse.json({ ok: true, action: "approveCheckIn", lessonId, studentId });
}

async function handleAddPost(
  client: any,
  userId: string,
  action: QueuedAction,
) {
  const post = action.payload as {
    title?: string;
    body: string;
    authorId: string;
  };

  if (!post.body || !post.authorId) {
    return NextResponse.json({ error: "body e authorId obrigatórios" }, { status: 400 });
  }

  const { error } = await client.from("feed_posts").insert({
    title: post.title || "",
    body: post.body,
    author_id: post.authorId,
    created_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Falha ao criar post: ${error.message}`);
  }

  return NextResponse.json({ ok: true, action: "addPost" });
}

async function handleTogglePostLike(
  client: any,
  userId: string,
  action: QueuedAction,
) {
  const { postId } = action.payload as { postId: string };

  if (!postId) {
    return NextResponse.json({ error: "postId obrigatório" }, { status: 400 });
  }

  // Verificar se já deu like
  const { data: existing } = await client
    .from("feed_post_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .single();

  if (existing) {
    // Deletar like
    await client
      .from("feed_post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);
  } else {
    // Criar like
    await client.from("feed_post_likes").insert({
      post_id: postId,
      user_id: userId,
      created_at: new Date().toISOString(),
    });
  }

  return NextResponse.json({ ok: true, action: "togglePostLike", postId });
}

async function handleAddPaymentProof(
  client: any,
  userId: string,
  action: QueuedAction,
) {
  const { paymentId, note } = action.payload as {
    paymentId: string;
    note: string;
  };

  if (!paymentId) {
    return NextResponse.json({ error: "paymentId obrigatório" }, { status: 400 });
  }

  const { error } = await client
    .from("payments")
    .update({ proof_note: note, proof_submitted_at: new Date().toISOString() })
    .eq("id", paymentId);

  if (error) {
    throw new Error(`Falha ao atualizar comprovante: ${error.message}`);
  }

  return NextResponse.json({ ok: true, action: "addPaymentProof", paymentId });
}
