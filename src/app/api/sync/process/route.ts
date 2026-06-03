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
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  // Validar JWT
  const authHeader = req.headers.get("authorization") ?? "";
  const jwt = authHeader.replace("Bearer ", "");
  if (!jwt) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  // Security C3: criar client com JWT injetado para que RLS de 'authenticated' aplique
  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data: { user }, error: authError } = await client.auth.getUser(jwt);
  if (authError || !user) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  // Client de service-role para operações de staff (approveCheckIn)
  const serviceClient = serviceKey ? createClient(supabaseUrl, serviceKey) : null;

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
        return await handleApproveCheckIn(client as any, serviceClient as any, user.id, action);
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
  serviceClient: any,
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

  // Security C3: verificar que o chamador é staff antes de aprovar presença
  if (serviceClient) {
    const { data: staffRow } = await serviceClient
      .from("staff_access")
      .select("role")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (!staffRow) {
      return NextResponse.json({ error: "Acesso negado: apenas staff pode aprovar check-in" }, { status: 403 });
    }
  }

  // Usar serviceClient para a operação de staff, ou client autenticado como fallback
  const execClient = serviceClient ?? client;

  // Buscar lição com check-in requests
  const { data: lesson, error: fetchError } = await execClient
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

  const { error: updateError } = await execClient
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

  if (!post.body) {
    return NextResponse.json({ error: "body obrigatório" }, { status: 400 });
  }

  const { error } = await client.from("feed_posts").insert({
    title: post.title || "",
    body: post.body,
    author_id: userId, // Security C3: sempre usar userId do JWT, nunca do payload
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

  // Security C3: restringir update ao student_id do usuário autenticado (ownership check via RLS)
  // O client já tem o JWT injetado, então a RLS de 'authenticated' se aplica.
  // Adicionalmente, filtrar por student_id resolvido do auth_user_id para garantia dupla.
  const { data: student } = await client
    .from("students")
    .select("id")
    .eq("auth_user_id", userId)
    .maybeSingle();

  const studentId = student?.id;

  const baseQuery = client
    .from("payments")
    .update({
      student_proof_note: note,
      student_proof_submitted_at: new Date().toISOString(),
    })
    .eq("id", paymentId);

  // Security C3: filtro extra de ownership se student_id foi resolvido
  const { error } = studentId
    ? await baseQuery.eq("student_id", studentId)
    : await baseQuery;

  if (error) {
    throw new Error(`Falha ao atualizar comprovante: ${error.message}`);
  }

  return NextResponse.json({ ok: true, action: "addPaymentProof", paymentId });
}
