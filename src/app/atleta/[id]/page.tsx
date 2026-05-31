import { Metadata } from "next";
import AthleteProfileClient from "./AthleteProfileClient";

interface Props {
  params: Promise<{ id: string }>;
}

async function fetchProfile(id: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(`${base}/api/public/athlete/${id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const profile = await fetchProfile(id);

  if (!profile) {
    return {
      title: "Atleta | Will Treinos PRO",
      description: "Perfil de atleta não encontrado.",
    };
  }

  const tierLabel = profile.tier?.label ?? "Iniciante";
  const xpFormatted = profile.totalXP >= 1000
    ? `${(profile.totalXP / 1000).toFixed(1)}k`
    : String(profile.totalXP);

  return {
    title: `${profile.displayName} — ${tierLabel} · ${xpFormatted} XP | Will Treinos PRO`,
    description: `${profile.displayName} é ${tierLabel} no Will Treinos PRO com ${xpFormatted} XP e ${profile.totalClasses} aulas. Conheça e entre você também!`,
    openGraph: {
      title: `${profile.displayName} ${profile.tier?.emoji} ${tierLabel}`,
      description: `${xpFormatted} XP · ${profile.totalClasses} aulas · ${profile.checkinCount} check-ins`,
      type: "profile",
      images: [{ url: "/icons/icon-512.png", width: 512, height: 512 }],
    },
    twitter: {
      card: "summary",
      title: `${profile.displayName} ${profile.tier?.emoji} no Will Treinos PRO`,
      description: `${xpFormatted} XP · ${tierLabel}`,
    },
  };
}

export default async function AthleteProfilePage({ params }: Props) {
  const { id } = await params;
  const profile = await fetchProfile(id);

  return <AthleteProfileClient id={id} initialProfile={profile} />;
}
