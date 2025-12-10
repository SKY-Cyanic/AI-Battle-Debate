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
    <div className="bg-slate-900/50 border border-slate-700 rounded-xl h-[400px] flex flex-col overflow-hidden">
      <div className="bg-slate-800 p-3 border-b border-slate-700 flex justify-between items-center">
        <h3 className="font-semibold text-slate-200">{t.transcriptTitle}</h3>
        <span className="text-xs text-slate-500 font-mono">LIVE</span>
      </div>
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-6"
      >
        {history.length === 0 && (
          <div className="text-center text-slate-600 italic mt-10">
            ...
          </div>
        )}
        {history.map((turn, idx) => {
          const agent = getAgent(turn.agentId);
          if (!agent) return null;
          const isLeft = idx % 2 === 0;
          const displayName = agent.role === AgentRole.PRO ? t.proName : t.conName;

          // Judge Logic Color
          const scoreColor = (turn.logicScore || 0) > 70 ? 'text-green-400' : (turn.logicScore || 0) < 40 ? 'text-red-400' : 'text-yellow-400';

          return (
            <div 
              key={turn.timestamp} 
              className={`flex flex-col ${isLeft ? 'items-start' : 'items-end'}`}
            >
              <div className={`max-w-[85%] rounded-2xl p-3 shadow-md border 
                ${isLeft 
                  ? 'bg-blue-950/40 border-blue-900/50 text-blue-100 rounded-tl-none' 
                  : 'bg-red-950/40 border-red-900/50 text-red-100 rounded-tr-none'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold uppercase ${isLeft ? 'text-blue-400' : 'text-red-400'}`}>
                    {displayName}
                  </span>
                  {turn.itemUsed && turn.itemUsed !== 'NONE' && (
                    <span className="text-[9px] bg-slate-700 px-1 rounded text-white border border-slate-500">
                      {t.itemUsed}: {turn.itemUsed}
                    </span>
                  )}
                </div>
                <p className="text-sm leading-relaxed mb-2">{turn.message}</p>
                
                {/* Judge Feedback Section */}
                <div className="mt-2 pt-2 border-t border-slate-700/50 text-xs font-mono bg-black/20 p-1.5 rounded">
                  <div className="flex items-center gap-1 text-slate-400 mb-0.5">
                    <Gavel size={10} />
                    <span className="uppercase font-bold text-[9px]">{t.judge}</span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                     <span className="text-slate-300 italic">"{turn.judgeComment}"</span>
                     <span className={`font-bold whitespace-nowrap ${scoreColor}`}>
                       Score: {turn.logicScore}
                     </span>
                  </div>
                  {turn.damageDealt !== undefined && turn.damageDealt > 0 && (
                     <div className="text-right text-red-400 font-bold mt-1">
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