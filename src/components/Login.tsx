"use client";

import { useState, useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { Shield, GraduationCap, Trophy, Zap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface RoleCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  delay: number;
  onClick: () => void;
}

function RoleCard({ icon, title, description, gradient, delay, onClick }: RoleCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      onClick={onClick}
      className="relative group cursor-pointer w-full"
    >
      {/* Card Container */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 md:p-8">
        {/* Dynamic Radial Gradient Flashlight Effect */}
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: isHovered
              ? `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, ${gradient}, transparent 40%)`
              : "none",
          }}
        />

        {/* Border Glow on Hover */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            boxShadow: `inset 0 0 30px ${gradient.replace("0.15", "0.3")}`,
          }}
        />

        <div className="relative z-10 flex items-center gap-4 md:gap-6 text-left">
          {/* Icon Container */}
          <motion.div
            className="flex h-16 w-16 md:h-20 md:w-20 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5"
            whileHover={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 0.4 }}
          >
            {icon}
          </motion.div>

          {/* Text Content */}
          <div className="flex-1">
            <h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tight text-white">
              {title}
            </h3>
            <p className="mt-1 text-sm md:text-base text-white/60">{description}</p>
          </div>

          {/* Arrow Indicator */}
          <motion.div
            className="hidden md:flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5"
            animate={{ x: isHovered ? 5 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <svg
              className="h-5 w-5 text-white/60"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function VolleyballCourtSVG() {
  return (
    <svg
      className="absolute inset-0 h-full w-full opacity-20"
      viewBox="0 0 1000 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
    >
      <rect x="50" y="50" width="900" height="500" stroke="white" strokeWidth="2" strokeOpacity="0.2" fill="none" />
      <line x1="500" y1="50" x2="500" y2="550" stroke="white" strokeWidth="2" strokeOpacity="0.2" />
      <line x1="350" y1="50" x2="350" y2="550" stroke="white" strokeWidth="1.5" strokeOpacity="0.15" strokeDasharray="10 10" />
      <line x1="650" y1="50" x2="650" y2="550" stroke="white" strokeWidth="1.5" strokeOpacity="0.15" strokeDasharray="10 10" />
      <line x1="50" y1="150" x2="200" y2="150" stroke="white" strokeWidth="1" strokeOpacity="0.1" />
      <line x1="50" y1="450" x2="200" y2="450" stroke="white" strokeWidth="1" strokeOpacity="0.1" />
      <line x1="800" y1="150" x2="950" y2="150" stroke="white" strokeWidth="1" strokeOpacity="0.1" />
      <line x1="800" y1="450" x2="950" y2="450" stroke="white" strokeWidth="1" strokeOpacity="0.1" />
      <circle cx="500" cy="300" r="80" stroke="white" strokeWidth="1.5" strokeOpacity="0.15" fill="none" />
    </svg>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  
  // Mouse position for parallax spotlights
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring animation for spotlights
  const springConfig = { damping: 25, stiffness: 150 };
  const spotlightX = useSpring(mouseX, springConfig);
  const spotlightY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse position to center of screen
      const x = (e.clientX / window.innerWidth - 0.5) * 100;
      const y = (e.clientY / window.innerHeight - 0.5) * 100;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  const roles = [
    {
      id: "admin",
      icon: <Shield className="h-8 w-8 md:h-10 md:w-10 text-yellow-400" />,
      title: "Dono / Gestor",
      description: "Administre seu clube com controle total sobre atletas e professores",
      gradient: "rgba(234, 179, 8, 0.15)",
    },
    {
      id: "coach",
      icon: <GraduationCap className="h-8 w-8 md:h-10 md:w-10 text-orange-400" />,
      title: "Professor",
      description: "Gerencie treinos, avalie desempenho e desenvolva campeões",
      gradient: "rgba(249, 115, 22, 0.15)",
    },
    {
      id: "aluno",
      icon: <Trophy className="h-8 w-8 md:h-10 md:w-10 text-yellow-300" />,
      title: "Atleta VIP",
      description: "Acompanhe sua evolução e alcance seu máximo potencial",
      gradient: "rgba(234, 179, 8, 0.15)",
    },
  ];

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-[#050505]">
      <VolleyballCourtSVG />

      {/* Parallax Gold Spotlight */}
      <motion.div
        className="pointer-events-none absolute h-[600px] w-[600px] rounded-full opacity-30 blur-[120px]"
        style={{
          background: "radial-gradient(circle, #EAB308 0%, transparent 70%)",
          left: "20%",
          top: "30%",
          x: spotlightX,
          y: spotlightY,
        }}
      />

      {/* Parallax Orange Spotlight */}
      <motion.div
        className="pointer-events-none absolute h-[500px] w-[500px] rounded-full opacity-25 blur-[100px]"
        style={{
          background: "radial-gradient(circle, #F97316 0%, transparent 70%)",
          right: "15%",
          bottom: "20%",
          x: spotlightX,
          y: spotlightY,
        }}
      />

      <div className="relative z-10 flex min-h-[100dvh] flex-col items-center justify-center px-4 py-12 md:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12 md:mb-16 text-center"
        >
          {/* Logo Container - Prepare for our image */}
          <motion.div
            animate={{
              y: [0, -8, 0],
              boxShadow: [
                "0 0 40px rgba(234, 179, 8, 0.2)",
                "0 0 60px rgba(234, 179, 8, 0.35)",
                "0 0 40px rgba(234, 179, 8, 0.2)",
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="mx-auto mb-6 md:mb-8 flex h-28 w-28 md:h-36 md:w-36 items-center justify-center rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl"
          >
            <div className="relative">
              <span className="text-5xl md:text-7xl font-black italic text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500">
                W
              </span>
              <Zap className="absolute -right-2 -top-1 md:-right-3 md:-top-2 h-6 w-6 md:h-8 md:w-8 text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl md:text-6xl lg:text-7xl font-black uppercase italic tracking-tight"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500">
              WILL TREINOS
            </span>
            <span className="ml-2 md:ml-4 text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-400 drop-shadow-[0_0_30px_rgba(234,179,8,0.5)]">
              PRO
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-4 text-base md:text-lg text-white/50 font-medium tracking-wide uppercase"
          >
            Gestão de vôlei de alto rendimento
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="w-full max-w-2xl flex flex-col items-center"
        >
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="mb-6 md:mb-8 text-center text-sm md:text-base font-semibold uppercase tracking-[0.2em] text-white/40"
          >
            Selecione seu perfil para entrar
          </motion.h2>

          <div className="flex flex-col gap-4 md:gap-5 w-full">
            {roles.map((role, index) => (
              <RoleCard
                key={role.id}
                icon={role.icon}
                title={role.title}
                description={role.description}
                gradient={role.gradient}
                delay={0.5 + index * 0.1}
                onClick={() => login(role.id as any)}
              />
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="mt-12 md:mt-16 text-center"
        >
          <p className="mt-3 text-[10px] md:text-xs text-white/20 uppercase tracking-widest">
            © 2026 Will Treinos PRO • Todos os direitos reservados
          </p>
        </motion.div>
      </div>

      {/* Decorative Corner Accents */}
      <div className="pointer-events-none absolute left-4 top-4 h-16 w-16 border-l-2 border-t-2 border-yellow-500/20" />
      <div className="pointer-events-none absolute right-4 top-4 h-16 w-16 border-r-2 border-t-2 border-orange-500/20" />
      <div className="pointer-events-none absolute bottom-4 left-4 h-16 w-16 border-b-2 border-l-2 border-orange-500/20" />
      <div className="pointer-events-none absolute bottom-4 right-4 h-16 w-16 border-b-2 border-r-2 border-yellow-500/20" />
    </div>
  );
}
