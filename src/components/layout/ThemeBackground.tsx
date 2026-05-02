import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { Spade, Heart, Club, Diamond } from 'lucide-react';

const Sakura = () => {
  const [petals, setPetals] = useState<{ id: number; left: number; delay: number; duration: number }[]>([]);
  useEffect(() => {
    setPetals(
      Array.from({ length: 30 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 5 + Math.random() * 5,
      }))
    );
  }, []);
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      <div className="absolute inset-0 bg-gradient-to-br from-pink-900/30 to-slate-900" />
      {petals.map((petal) => (
        <motion.div
          key={petal.id}
          className="absolute top-[-10%] w-3 h-4 bg-pink-300/60 rounded-tl-full rounded-br-full"
          animate={{ y: ['0vh', '110vh'], x: [0, Math.random() * 100 - 50, Math.random() * 100 - 50], rotate: [0, 360] }}
          transition={{ duration: petal.duration, delay: petal.delay, repeat: Infinity, ease: 'linear' }}
          style={{ left: `${petal.left}%` }}
        />
      ))}
    </div>
  );
};

const Casino = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#0f3b20]">
    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #1a5732 2px, transparent 2px)', backgroundSize: '12px 12px' }} />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#0f3b20]/50 to-black" />
    <div className="absolute top-[10%] left-[10%] text-white/5"><Spade size={120} /></div>
    <div className="absolute bottom-[20%] left-[15%] text-red-500/5"><Heart size={180} /></div>
    <div className="absolute top-[20%] right-[15%] text-white/5"><Club size={150} /></div>
    <div className="absolute bottom-[10%] right-[10%] text-red-500/5"><Diamond size={100} /></div>
  </div>
);

const Temple = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-red-950">
    <div className="absolute inset-0 bg-gradient-to-b from-red-900 to-black opacity-80" />
    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-radial-gradient(circle at 0 0, transparent 0, #fbbf24 10px, transparent 11px)', backgroundSize: '100px 100px' }} />
    <motion.div className="absolute top-0 left-[20%] w-64 h-64 bg-orange-500/30 rounded-full blur-[80px]"
      animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
    <motion.div className="absolute top-0 right-[20%] w-64 h-64 bg-orange-500/30 rounded-full blur-[80px]"
      animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }} />
  </div>
);

const Party = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-slate-950">
    <div className="absolute inset-0 opacity-20" style={{
      backgroundImage: 'linear-gradient(to right, #4f46e5 1px, transparent 1px), linear-gradient(to bottom, #4f46e5 1px, transparent 1px)',
      backgroundSize: '40px 40px',
      transform: 'perspective(500px) rotateX(60deg) translateY(100px) translateZ(-200px)',
    }} />
    <motion.div className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,#c084fc33_30deg,transparent_60deg)] origin-center"
      animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} />
    <motion.div className="absolute -top-1/4 -right-1/4 w-[150%] h-[150%] bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,#22d3ee33_30deg,transparent_60deg)] origin-center"
      animate={{ rotate: -360 }} transition={{ duration: 25, repeat: Infinity, ease: 'linear' }} />
  </div>
);

// 🎄 Christmas: snow + tree silhouette
const Christmas = () => {
  const [snow, setSnow] = useState<{ id: number; left: number; size: number; delay: number; duration: number }[]>([]);
  useEffect(() => {
    setSnow(
      Array.from({ length: 60 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 4 + Math.random() * 8,
        delay: Math.random() * 8,
        duration: 6 + Math.random() * 6,
      }))
    );
  }, []);
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-950 via-slate-900 to-red-950" />
      {/* Aurora glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-400/10 rounded-full blur-[100px]" />
      {snow.map((s) => (
        <motion.div
          key={s.id}
          className="absolute top-[-5%] rounded-full bg-white/80"
          style={{ left: `${s.left}%`, width: s.size, height: s.size }}
          animate={{ y: ['0vh', '110vh'], x: [0, 30, -30, 20, 0] }}
          transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: 'linear' }}
        />
      ))}
    </div>
  );
};

// 🧧 New Year: red gold lanterns + firework bursts
const NewYear = () => {
  const [bursts, setBursts] = useState<{ id: number; left: number; top: number; delay: number; color: string }[]>([]);
  useEffect(() => {
    const colors = ['#fbbf24', '#f87171', '#fca5a5', '#fde68a'];
    setBursts(
      Array.from({ length: 8 }).map((_, i) => ({
        id: i,
        left: 10 + Math.random() * 80,
        top: 10 + Math.random() * 60,
        delay: Math.random() * 5,
        color: colors[i % colors.length],
      }))
    );
  }, []);
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      <div className="absolute inset-0 bg-gradient-to-br from-red-950 via-rose-950 to-amber-950" />
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'radial-gradient(circle at 50% 50%, #fbbf24 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }} />
      {bursts.map((b) => (
        <motion.div
          key={b.id}
          className="absolute rounded-full"
          style={{ left: `${b.left}%`, top: `${b.top}%`, width: 6, height: 6, backgroundColor: b.color }}
          animate={{ scale: [0, 8, 0], opacity: [1, 1, 0] }}
          transition={{ duration: 1.5, delay: b.delay, repeat: Infinity, repeatDelay: 4 }}
        />
      ))}
      {/* Lanterns */}
      <motion.div
        className="absolute top-10 left-10 w-12 h-16 bg-red-600 rounded-full"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{ boxShadow: '0 0 30px rgba(220, 38, 38, 0.8)' }}
      />
      <motion.div
        className="absolute top-16 right-16 w-12 h-16 bg-red-600 rounded-full"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        style={{ boxShadow: '0 0 30px rgba(220, 38, 38, 0.8)' }}
      />
    </div>
  );
};

// 🎃 Halloween: pumpkins + bats
const Halloween = () => {
  const [bats, setBats] = useState<{ id: number; top: number; delay: number; duration: number }[]>([]);
  useEffect(() => {
    setBats(
      Array.from({ length: 10 }).map((_, i) => ({
        id: i,
        top: 10 + Math.random() * 70,
        delay: Math.random() * 5,
        duration: 8 + Math.random() * 6,
      }))
    );
  }, []);
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-950 via-slate-950 to-black" />
      {/* Moon */}
      <div className="absolute top-12 right-12 w-32 h-32 bg-amber-100 rounded-full blur-sm shadow-[0_0_60px_rgba(251,191,36,0.6)]" />
      {/* Bats */}
      {bats.map((b) => (
        <motion.div
          key={b.id}
          className="absolute text-2xl"
          style={{ top: `${b.top}%`, left: '-5%' }}
          animate={{ x: ['0vw', '110vw'], y: [0, -20, 20, -10, 0] }}
          transition={{ duration: b.duration, delay: b.delay, repeat: Infinity, ease: 'linear' }}
        >
          🦇
        </motion.div>
      ))}
      {/* Pumpkin glow */}
      <div className="absolute bottom-10 left-1/4 w-48 h-48 bg-orange-500/20 rounded-full blur-[80px]" />
      <div className="absolute bottom-20 right-1/3 w-32 h-32 bg-purple-500/20 rounded-full blur-[60px]" />
    </div>
  );
};

export function ThemeBackground() {
  const theme = useAppStore((state) => state.theme);
  if (theme === 'default') return null;
  return (
    <>
      {theme === 'sakura' && <Sakura />}
      {theme === 'casino' && <Casino />}
      {theme === 'temple' && <Temple />}
      {theme === 'party' && <Party />}
      {theme === 'christmas' && <Christmas />}
      {theme === 'newyear' && <NewYear />}
      {theme === 'halloween' && <Halloween />}
    </>
  );
}
