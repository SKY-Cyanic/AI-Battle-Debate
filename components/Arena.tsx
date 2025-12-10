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
    case 'HEAL_MODULE': return <Pill className="text-green-400" size={20} />;
    case 'LOGIC_AMPLIFIER': return <Cpu className="text-purple-400" size={20} />;
    case 'FACT_CHECKER': return <FileCheck className="text-yellow-400" size={20} />;
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
    <div className="relative w-full h-[400px] bg-slate-900 border-2 border-slate-700 rounded-xl overflow-hidden shadow-2xl shadow-blue-900/20 select-none">
      {/* Dynamic Background Grid */}
      <div className="absolute inset-0 opacity-20" 
           style={{ 
             backgroundImage: 'linear-gradient(rgba(71, 85, 105, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(71, 85, 105, 0.5) 1px, transparent 1px)', 
             backgroundSize: '40px 40px',
             perspective: '500px'
           }}>
      </div>
      
      {/* Floor reflection effect */}
      <div className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-slate-950 to-transparent opacity-60"></div>

      {/* Judge Overlay (Top Center) */}
      {lastTurnInfo && lastTurnInfo.damage > 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 animate-[bounce_0.5s_ease-out] bg-slate-800/90 border-2 border-yellow-600 px-6 py-3 rounded-xl flex items-center gap-3 shadow-[0_0_20px_rgba(234,179,8,0.3)]">
           <Gavel size={24} className="text-yellow-500" />
           <div className="text-center">
             <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{t.logicVerdict}</div>
             <div className="text-lg font-black text-white italic">{t.criticalHit}</div>
             <div className="text-xs text-yellow-400 font-mono">{lastTurnInfo.logicScore}/100 PTS</div>
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
        
        return (
        <div
          key={agent.id}
          className={`absolute transition-all duration-700 ease-out flex flex-col items-center justify-center
            ${isAttacking ? 'z-30' : 'z-20'}
          `}
          style={{
            left: `${agent.x}%`,
            top: `${agent.y}%`,
            transform: `translate(-50%, -50%)`, // Base centering
          }}
        >
          {/* Inner Container for Animations (Shake/Lunge) */}
          <div className={`
             relative
             ${isHit ? 'animate-[shake_0.4s_cubic-bezier(.36,.07,.19,.97)_both]' : ''}
             ${isAttacking ? (isFacingRight ? 'animate-[pulse_0.2s_ease-in-out] translate-x-8' : 'animate-[pulse_0.2s_ease-in-out] -translate-x-8') : ''}
          `}>

              {/* Floating Damage Text */}
              {isHit && (
                <div className="absolute -top-24 left-1/2 -translate-x-1/2 text-4xl font-black text-red-500 animate-[bounce_1s_infinite] drop-shadow-[0_4px_4px_rgba(0,0,0,1)] z-50 whitespace-nowrap">
                  -{lastTurnInfo?.damage}
                </div>
              )}

              {/* Item Usage Popup */}
              {lastTurnInfo?.agentId === agent.id && lastTurnInfo?.itemUsed !== 'NONE' && (
                <div className="absolute -top-28 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-3 py-1.5 rounded-lg border border-white/20 flex items-center gap-2 animate-[pulse_0.5s_ease-in-out] whitespace-nowrap z-40 shadow-xl">
                  {getItemIcon(lastTurnInfo.itemUsed)}
                  <span className="text-xs font-bold">{lastTurnInfo.itemUsed.replace('_', ' ')}</span>
                </div>
              )}

              {/* Speech Bubble */}
              {currentSpeakerId === agent.id && (
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white text-slate-900 px-4 py-1.5 rounded-full text-xs font-bold shadow-lg animate-pulse border-2 border-slate-300 z-50">
                  <span className="flex items-center gap-1">
                    <MessageSquare size={12} /> {t.thinking}
                  </span>
                </div>
              )}

              {/* Attack / Defend Visuals */}
              {agent.lastAction === 'attack' && (
                <div className={`absolute text-yellow-400 -top-8 animate-ping ${isFacingRight ? '-right-12' : '-left-12'}`}>
                  <Sword size={40} fill="currentColor" className={isFacingRight ? '' : 'scale-x-[-1]'} />
                </div>
              )}
              {agent.lastAction === 'defend' && (
                <div className="absolute text-blue-400 opacity-60 scale-150 top-0 left-0 right-0 bottom-0 flex justify-center items-center">
                  <Shield size={80} />
                </div>
              )}

              {/* Avatar Character */}
              <div className={`
                relative p-4 rounded-full border-4 shadow-[0_0_30px_rgba(0,0,0,0.6)] transition-colors duration-300
                ${agent.role === AgentRole.PRO ? 'border-blue-500 bg-blue-900' : 'border-red-500 bg-red-900'}
                ${agent.emotion === 'angry' ? 'shadow-red-500/80 ring-2 ring-red-400' : ''}
                ${agent.emotion === 'confident' ? 'shadow-yellow-500/80 ring-2 ring-yellow-400' : ''}
                ${isHit ? 'bg-red-500 brightness-150' : ''}
              `}>
                <Bot 
                  size={56} 
                  className={`text-white transition-all duration-300
                    ${agent.hp <= 0 ? 'opacity-50 grayscale' : ''}
                    ${!isFacingRight ? 'scale-x-[-1]' : ''}
                  `} 
                />
                
                {/* Health Bar (Floating above head) */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-20 h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-600 shadow-md">
                  <div 
                    className={`h-full transition-all duration-500 ${agent.hp > 50 ? 'bg-green-500' : agent.hp > 20 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.max(0, agent.hp)}%` }}
                  />
                </div>
              </div>

            </div> {/* End Inner Container */}

          {/* Name Label */}
          <div className={`mt-8 px-3 py-1 rounded bg-black/60 backdrop-blur-sm text-xs font-mono text-white border border-white/10
            ${agent.id === currentSpeakerId ? 'ring-1 ring-white shadow-lg' : ''}
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
               <div className="absolute animate-[ping_0.3s_ease-out] w-32 h-32 bg-yellow-400/30 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
               <Sparkles size={64} className="text-yellow-200 animate-[spin_0.5s_linear]" />
            </div>
         </div>
      )}

    </div>
  );
};

export default Arena;