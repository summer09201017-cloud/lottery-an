import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { Spade, Heart, Club, Diamond } from 'lucide-react';

// Sakura Petal Component
const Sakura = () => {
  const [petals, setPetals] = useState<{ id: number; left: number; delay: number; duration: number }[]>([]);
  
  useEffect(() => {
    // Generate 30 petals
    const newPetals = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 5 + Math.random() * 5,
    }));
    setPetals(newPetals);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div className="absolute inset-0 bg-gradient-to-br from-pink-900/30 to-slate-900" />
      {petals.map((petal) => (
        <motion.div
          key={petal.id}
          className="absolute top-[-10%] w-3 h-4 bg-pink-300/60 rounded-tl-full rounded-br-full"
          animate={{
            y: ['0vh', '110vh'],
            x: [0, Math.random() * 100 - 50, Math.random() * 100 - 50],
            rotate: [0, 360],
          }}
          transition={{
            duration: petal.duration,
            delay: petal.delay,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{ left: `${petal.left}%` }}
        />
      ))}
    </div>
  );
};

// Casino Component
const Casino = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#0f3b20]">
      {/* Felt texture overlay */}
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #1a5732 2px, transparent 2px)', backgroundSize: '12px 12px' }} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#0f3b20]/50 to-black" />
      
      {/* Decorative Suits */}
      <div className="absolute top-[10%] left-[10%] text-white/5"><Spade size={120} /></div>
      <div className="absolute bottom-[20%] left-[15%] text-red-500/5"><Heart size={180} /></div>
      <div className="absolute top-[20%] right-[15%] text-white/5"><Club size={150} /></div>
      <div className="absolute bottom-[10%] right-[10%] text-red-500/5"><Diamond size={100} /></div>
    </div>
  );
};

// Temple Component
const Temple = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-red-950">
      <div className="absolute inset-0 bg-gradient-to-b from-red-900 to-black opacity-80" />
      
      {/* Golden clouds / smoke pattern mock */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'repeating-radial-gradient(circle at 0 0, transparent 0, #fbbf24 10px, transparent 11px)',
        backgroundSize: '100px 100px'
      }} />

      {/* Abstract Lantern Glows */}
      <motion.div 
        className="absolute top-0 left-[20%] w-64 h-64 bg-orange-500/30 rounded-full blur-[80px]"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute top-0 right-[20%] w-64 h-64 bg-orange-500/30 rounded-full blur-[80px]"
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
    </div>
  );
};

// Party / Cyberpunk Component
const Party = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-slate-950">
      {/* Grid */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: 'linear-gradient(to right, #4f46e5 1px, transparent 1px), linear-gradient(to bottom, #4f46e5 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        transform: 'perspective(500px) rotateX(60deg) translateY(100px) translateZ(-200px)'
      }} />

      {/* Spotlights */}
      <motion.div
        className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,#c084fc33_30deg,transparent_60deg)] origin-center"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute -top-1/4 -right-1/4 w-[150%] h-[150%] bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,#22d3ee33_30deg,transparent_60deg)] origin-center"
        animate={{ rotate: -360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
};

export function ThemeBackground() {
  const theme = useAppStore((state) => state.theme);

  // default theme uses body background defined in index.css (slate-950)
  if (theme === 'default') return null;

  return (
    <>
      {theme === 'sakura' && <Sakura />}
      {theme === 'casino' && <Casino />}
      {theme === 'temple' && <Temple />}
      {theme === 'party' && <Party />}
    </>
  );
}
