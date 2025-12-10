import React, { useEffect, useState } from 'react';
import { AgentState, AgentRole, ItemType, Language } from '../types';
import { UI_TEXT } from '../constants';
import { Bot, Shield, MessageSquare, Gavel, Pill, Cpu, FileCheck, Sword, Sparkles } from 'lucide-react';

interface ArenaProps {
  agents: AgentState[];
  currentSpeakerId: string | null;
  lastTurnInfo?: {
    agentId: string;
    damage: number;
    logicScore: number;
    judgeComment: string;
    itemUsed: ItemType;
  } | null;
  language: Language;
}

const getItemIcon = (item: ItemType) => {
  switch (item) {
    case 'HEAL_MODULE': return <Pill className="text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.8)]" size={20} />;
    case 'LOGIC_AMPLIFIER': return <Cpu className="text-purple-400 drop-shadow-[0_0_5px_rgba(192,132,252,0.8)]" size={20} />;
    case 'FACT_CHECKER': return <FileCheck className="text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]" size={20} />;
    default: return null;
  }
};

const Arena: React.FC<ArenaProps> = ({ agents, currentSpeakerId, lastTurnInfo, language }) => {
  const [hitEffect, setHitEffect] = useState<{x: number, y: number} | null>(null);
  const t = UI_TEXT[language];

  // Trigger hit effect when damage is dealt
  useEffect(() => {
    if (lastTurnInfo && lastTurnInfo.damage > 0) {
      const victim = agents.find(a => a.id !== lastTurnInfo.agentId);
      if (victim) {
        setHitEffect({ x: victim.x, y: victim.y });
        const timer = setTimeout(() => setHitEffect(null), 500);
        return () => clearTimeout(timer);
      }
    }
  }, [lastTurnInfo, agents]);

  return (
    <div className="relative w-full h-[400px] sm:h-[450px] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl shadow-black/50 select-none ring-1 ring-white/5 group">
      
      {/* Dynamic Background Grid (Cyberpunk Style) */}
      <div className="absolute inset-0 opacity-30" 
           style={{ 
             backgroundImage: `
               linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px), 
               linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
             `, 
             backgroundSize: '40px 40px',
             perspective: '1000px',
             transformStyle: 'preserve-3d'
           }}>
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-transparent to-slate-900/80 pointer-events-none"></div>
      
      {/* Floor reflection effect */}
      <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-blue-900/10 to-transparent blur-xl"></div>

      {/* Judge Overlay (Top Center) */}
      {lastTurnInfo && lastTurnInfo.damage > 0 && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 animate-[bounce_0.5s_ease-out] bg-slate-900/95 border-2 border-yellow-500/80 px-6 py-3 rounded-xl flex items-center gap-3 shadow-[0_0_30px_rgba(234,179,8,0.25)] backdrop-blur-md">
           <Gavel size={24} className="text-yellow-500" />
           <div className="text-center">
             <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{t.logicVerdict}</div>
             <div className="text-xl font-black text-white italic tracking-tighter">{t.criticalHit}</div>
             <div className="text-xs text-yellow-400 font-mono font-bold">{lastTurnInfo.logicScore}/100 PTS</div>
           </div>
        </div>
      )}

      {/* Agents */}
      {agents.map((agent) => {
        const opponent = agents.find(a => a.id !== agent.id);
        const isFacingRight = opponent ? agent.x < opponent.x : true;
        const isAttacking = agent.lastAction === 'attack';
        const isHit = lastTurnInfo?.damage && lastTurnInfo.damage > 0 && lastTurnInfo.agentId !== agent.id;
        const displayName = agent.role === AgentRole.PRO ? t.proName : t.conName;
        const isActiveSpeaker = agent.id === currentSpeakerId;
        
        return (
        <div
          key={agent.id}
          className={`absolute transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex flex-col items-center justify-center
            ${isAttacking ? 'z-30' : 'z-20'}
            ${isActiveSpeaker ? 'scale-105' : 'scale-100 opacity-90'}
          `}
          style={{
            left: `${agent.x}%`,
            top: `${agent.y}%`,
            transform: `translate(-50%, -50%)`, // Base centering
          }}
        >
          {/* Spotlight Effect for Speaker */}
          {isActiveSpeaker && (
             <div className="absolute top-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -translate-y-1/2 animate-pulse pointer-events-none"></div>
          )}

          {/* Inner Container for Animations (Shake/Lunge) */}
          <div className={`
             relative
             ${isHit ? 'animate-[shake_0.4s_cubic-bezier(.36,.07,.19,.97)_both]' : ''}
             ${isAttacking ? (isFacingRight ? 'animate-[pulse_0.2s_ease-in-out] translate-x-12' : 'animate-[pulse_0.2s_ease-in-out] -translate-x-12') : ''}
          `}>

              {/* Floating Damage Text */}
              {isHit && (
                <div className="absolute -top-32 left-1/2 -translate-x-1/2 text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-400 to-red-600 animate-[bounce_1s_infinite] drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] z-50 whitespace-nowrap">
                  -{lastTurnInfo?.damage}
                </div>
              )}

              {/* Item Usage Popup */}
              {lastTurnInfo?.agentId === agent.id && lastTurnInfo?.itemUsed !== 'NONE' && (
                <div className="absolute -top-32 left-1/2 -translate-x-1/2 bg-slate-800/90 backdrop-blur text-white px-4 py-2 rounded-lg border border-white/20 flex items-center gap-2 animate-[pulse_0.5s_ease-in-out] whitespace-nowrap z-40 shadow-xl">
                  {getItemIcon(lastTurnInfo.itemUsed)}
                  <span className="text-xs font-bold">{lastTurnInfo.itemUsed.replace('_', ' ')}</span>
                </div>
              )}

              {/* Speech Bubble */}
              {currentSpeakerId === agent.id && (
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white text-slate-900 px-4 py-2 rounded-2xl rounded-bl-none text-xs font-bold shadow-xl animate-bounce border-2 border-blue-200 z-50">
                  <span className="flex items-center gap-1.5">
                    <MessageSquare size={14} className="text-blue-600" /> {t.thinking}
                  </span>
                </div>
              )}

              {/* Attack / Defend Visuals */}
              {agent.lastAction === 'attack' && (
                <div className={`absolute text-yellow-400 -top-10 animate-ping ${isFacingRight ? '-right-16' : '-left-16'}`}>
                  <Sword size={48} fill="currentColor" className={isFacingRight ? '' : 'scale-x-[-1]'} />
                </div>
              )}
              {agent.lastAction === 'defend' && (
                <div className="absolute text-blue-400 opacity-60 scale-150 top-0 left-0 right-0 bottom-0 flex justify-center items-center animate-pulse">
                  <Shield size={90} fill="currentColor" className="opacity-30" />
                </div>
              )}

              {/* Avatar Character */}
              <div className={`
                relative p-4 md:p-5 rounded-full border-[6px] shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-all duration-300
                ${agent.role === AgentRole.PRO 
                  ? 'border-blue-500 bg-gradient-to-br from-blue-800 to-slate-900' 
                  : 'border-red-500 bg-gradient-to-br from-red-800 to-slate-900'}
                ${agent.emotion === 'angry' ? 'shadow-red-500/50 ring-4 ring-red-500/30' : ''}
                ${agent.emotion === 'confident' ? 'shadow-green-500/50 ring-4 ring-green-500/30' : ''}
                ${isHit ? 'bg-red-600 brightness-125 scale-95' : ''}
              `}>
                <Bot 
                  size={56} 
                  className={`text-white transition-all duration-300 md:w-16 md:h-16
                    ${agent.hp <= 0 ? 'opacity-50 grayscale' : ''}
                    ${!isFacingRight ? 'scale-x-[-1]' : ''}
                  `} 
                />
                
                {/* Health Bar (Floating above head) */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-24 h-3 bg-slate-900/80 rounded-full overflow-hidden border border-slate-700 shadow-lg backdrop-blur-sm">
                  <div 
                    className={`h-full transition-all duration-500 ${agent.hp > 50 ? 'bg-green-500' : agent.hp > 20 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.max(0, agent.hp)}%` }}
                  />
                </div>
              </div>

            </div> {/* End Inner Container */}

          {/* Name Label */}
          <div className={`mt-10 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] md:text-xs font-mono font-bold text-white border border-white/10 tracking-wider shadow-xl
            ${agent.id === currentSpeakerId ? 'ring-2 ring-blue-400/50 scale-110' : ''}
          `}>
            {displayName}
          </div>
        </div>
      )})}

      {/* Global Hit Particle Effect (Explosion) */}
      {hitEffect && (
         <div 
           className="absolute z-50 pointer-events-none"
           style={{ left: `${hitEffect.x}%`, top: `${hitEffect.y}%`, transform: 'translate(-50%, -50%)' }}
         >
            <div className="relative">
               <div className="absolute animate-[ping_0.3s_ease-out] w-48 h-48 bg-yellow-400/20 rounded-full -translate-x-1/2 -translate-y-1/2 mix-blend-screen"></div>
               <Sparkles size={80} className="text-yellow-200 animate-[spin_0.5s_linear] drop-shadow-[0_0_10px_white]" />
            </div>
         </div>
      )}

    </div>
  );
};

export default Arena;