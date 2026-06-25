export default function GlobalLoading() {
  return (
    <div className="min-h-[100dvh] bg-black flex flex-col items-center justify-center gap-4">
      {/* Spinner dourado */}
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-[#EAB308]/10" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#EAB308] animate-spin" />
      </div>

      {/* Logo */}
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-600 animate-pulse">
        Will Treinos PRO
      </p>
    </div>
  );
}
