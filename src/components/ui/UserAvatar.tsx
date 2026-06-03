"use client";

import React, { useState } from "react";
import Image from "next/image";

type UserAvatarProps = {
  name: string;
  photo?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeMap = {
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-14 w-14 text-base",
} as const;

function isPhotoUrl(value?: string | null): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  return trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/");
}

function initialsFromName(name: string): string {
  const parts = name
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);
  if (parts.length === 0) return "WP";
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export default function UserAvatar({ name, photo, size = "md", className = "" }: UserAvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const hasPhoto = isPhotoUrl(photo) && !imgFailed;
  const initials = initialsFromName(name);

  return (
    <div
      className={`${sizeMap[size]} ${className} relative overflow-hidden rounded-full border border-[#EAB308]/40 bg-black/80 ring-1 ring-[#EAB308]/30 shadow-[0_0_20px_rgba(234,179,8,0.25)]`}
    >
      {hasPhoto ? (
        <Image
          src={photo as string}
          alt={`Avatar de ${name}`}
          fill
          className="object-cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgba(234,179,8,0.35),rgba(5,5,5,0.95)_72%)] font-black tracking-wide text-[#FCD34D]">
          <span className="drop-shadow-[0_0_8px_rgba(234,179,8,0.75)]">{initials}</span>
        </div>
      )}
    </div>
  );
}

