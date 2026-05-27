"use client";

// /cadastro unificado em /signup (fluxo com seleção Atleta/Observador).
// Redireciona preservando ?invite= se presente.

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function Spinner() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-black">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-800 border-t-[#EAB308]" aria-hidden />
    </div>
  );
}

function CadastroRedirect() {
  const router = useRouter();
  const params = useSearchParams();
  useEffect(() => {
    const invite = params.get("invite");
    router.replace(invite ? `/signup?invite=${invite}` : "/signup");
  }, [router, params]);
  return <Spinner />;
}

export default function CadastroPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <CadastroRedirect />
    </Suspense>
  );
}
