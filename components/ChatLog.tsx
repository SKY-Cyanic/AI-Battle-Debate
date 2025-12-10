import React, { useEffect, useRef } from 'react';
import { DebateTurn, AgentState, Language, AgentRole } from '../types';
import { UI_TEXT } from '../constants';
import { Gavel } from 'lucide-react';

interface ChatLogProps {
  history: DebateTurn[];
  agents: AgentState[];
  language: Language;
}

const ChatLog: React.FC<ChatLogProps> = ({ history, agents, language }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const t = UI_TEXT[language];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const getAgent = (id: string) => agents.find(a => a.id === id);

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl h-[400px] sm:h-[450px] flex flex-col overflow-hidden backdrop-blur-sm shadow-xl shadow-black/20">
      <div className="bg-slate-900/80 p-3 px-5 border-b border-slate-800 flex justify-between items-center backdrop-blur-md">
        <h3 className="font-semibold text-slate-200 text-sm tracking-wide">{t.transcriptTitle}</h3>
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
           <span className="text-[10px] text-red-400 font-mono font-bold tracking-widest">LIVE</span>
        </div>
      </div>
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth"
      >
        {history.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2">
            <div className="text-4xl opacity-20">💬</div>
            <span className="italic text-sm">Waiting for debate to start...</span>
          </div>
        )}
        {history.map((turn, idx) => {
          const agent = getAgent(turn.agentId);
          if (!agent) return null;
          const isLeft = idx % 2 === 0;
          const displayName = agent.role === AgentRole.PRO ? t.proName : t.conName;

          // Judge Logic Color
          const scoreColor = (turn.logicScore || 0) > 70 ? 'text-green-400' : (turn.logicScore || 0) < 40 ? 'text-red-400' : 'text-yellow-400';
          const scoreBorder = (turn.logicScore || 0) > 70 ? 'border-green-500/30' : (turn.logicScore || 0) < 40 ? 'border-red-500/30' : 'border-yellow-500/30';

          return (
            <div 
              key={turn.timestamp} 
              className={`flex flex-col ${isLeft ? 'items-start' : 'items-end'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              <div className={`max-w-[90%] md:max-w-[85%] rounded-2xl p-4 shadow-lg border relative group
                ${isLeft 
                  ? 'bg-blue-950/30 border-blue-900/40 text-blue-50 rounded-tl-none hover:border-blue-700/50' 
                  : 'bg-red-950/30 border-red-900/40 text-red-50 rounded-tr-none hover:border-red-700/50'
                } transition-colors`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] font-black uppercase tracking-wider ${isLeft ? 'text-blue-400' : 'text-red-400'}`}>
                    {displayName}
                  </span>
                  {turn.itemUsed && turn.itemUsed !== 'NONE' && (
                    <span className="text-[9px] bg-slate-800/80 px-1.5 py-0.5 rounded text-slate-300 border border-slate-700">
                      Used: {turn.itemUsed.replace('_', ' ')}
                    </span>
                  )}
                </div>
                <p className="text-sm leading-relaxed mb-3 text-slate-200">{turn.message}</p>
                
                {/* Judge Feedback Section */}
                <div className={`mt-2 pt-2 border-t border-dashed ${scoreBorder} text-xs font-mono bg-black/20 p-2 rounded relative overflow-hidden`}>
                  {/* Subtle background based on score */}
                  <div className={`absolute inset-0 opacity-5 ${
                    (turn.logicScore || 0) > 70 ? 'bg-green-500' : (turn.logicScore || 0) < 40 ? 'bg-red-500' : 'bg-yellow-500'
                  }`}></div>
                  
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1 relative z-10">
                    <Gavel size={12} className={scoreColor} />
                    <span className="uppercase font-bold text-[9px] text-slate-500 tracking-wider">{t.judge}</span>
                  </div>
                  <div className="flex justify-between items-start gap-3 relative z-10">
                     <span className="text-slate-400 italic font-sans">"{turn.judgeComment}"</span>
                     <span className={`font-black whitespace-nowrap ${scoreColor}`}>
                       {turn.logicScore}
                     </span>
                  </div>
                  {turn.damageDealt !== undefined && turn.damageDealt > 0 && (
                     <div className="text-right text-red-400 font-bold mt-1 text-[10px] uppercase tracking-wide relative z-10">
                       -{turn.damageDealt} {t.hp} {t.damage}
                     </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChatLog;