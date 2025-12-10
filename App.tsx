import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, RefreshCw, Swords, Archive, Dice5, Globe, Zap } from 'lucide-react';
import Arena from './components/Arena';
import ChatLog from './components/ChatLog';
import DebateSummary from './components/DebateSummary';
import { generateAgentTurn, generateDebateSummary } from './services/geminiService';
import { INITIAL_AGENTS, TOPICS_BY_LANG, UI_TEXT } from './constants';
import { AgentState, DebateTurn, AgentRole, ItemType, Language } from './types';

function App() {
  const [topic, setTopic] = useState('');
  const [isDebating, setIsDebating] = useState(false);
  const [agents, setAgents] = useState<AgentState[]>(INITIAL_AGENTS);
  const [history, setHistory] = useState<DebateTurn[]>([]);
  const [turnIndex, setTurnIndex] = useState(0); 
  const [isLoading, setIsLoading] = useState(false);
  const [winner, setWinner] = useState<AgentRole | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [language, setLanguage] = useState<Language>('KO');
  
  const t = UI_TEXT[language];

  // State to track the last event for the UI overlay
  const [lastTurnInfo, setLastTurnInfo] = useState<{
    agentId: string;
    damage: number;
    logicScore: number;
    judgeComment: string;
    itemUsed: ItemType;
  } | null>(null);

  const processingRef = useRef(false);

  // Reset function
  const resetDebate = () => {
    setIsDebating(false);
    setAgents(INITIAL_AGENTS);
    setHistory([]);
    setTurnIndex(0);
    setWinner(null);
    setSummary(null);
    setLastTurnInfo(null);
    processingRef.current = false;
  };

  const startDebate = () => {
    if (!topic.trim()) return;
    resetDebate();
    // RANDOMIZE START: 50/50 chance for either bot to start
    setTurnIndex(Math.random() > 0.5 ? 0 : 1);
    setIsDebating(true);
  };

  const stopDebate = async () => {
    setIsDebating(false);
    processingRef.current = false;
    await handleGenerateSummary();
  };

  const suggestTopic = () => {
    const topics = TOPICS_BY_LANG[language];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    setTopic(randomTopic);
  };

  const toggleLanguage = () => {
    if (isDebating) return; // Prevent switching mid-debate for consistency
    setLanguage(prev => prev === 'KO' ? 'EN' : 'KO');
    setTopic(''); // Clear topic when language changes
  };

  const handleGenerateSummary = async () => {
    if (history.length < 2) return;
    setIsGeneratingSummary(true);
    const summaryText = await generateDebateSummary(history, topic, language);
    setSummary(summaryText);
    setIsGeneratingSummary(false);
  };

  // Main Debate Loop
  useEffect(() => {
    if (!isDebating || winner || processingRef.current) return;

    const executeTurn = async () => {
      processingRef.current = true;
      setIsLoading(true);

      const currentAgentIdx = turnIndex % 2;
      const opponentIdx = (turnIndex + 1) % 2;
      
      const currentAgent = agents[currentAgentIdx];
      const opponent = agents[opponentIdx];

      // Check for KO
      if (currentAgent.hp <= 0) {
        setWinner(opponent.role);
        setIsDebating(false);
        setIsLoading(false);
        processingRef.current = false;
        await handleGenerateSummary();
        return;
      }

      // Delay for pacing (Game feel)
      await new Promise(resolve => setTimeout(resolve, 2500));

      const response = await generateAgentTurn(currentAgent, opponent, topic, history, language);

      // --- CALCULATE GAME LOGIC ---
      let damage = 0;
      let finalLogicScore = response.logicScore;

      // 1. Process Item Usage
      let activeInventory = [...currentAgent.inventory];
      if (response.itemUsed !== 'NONE') {
         const itemIndex = activeInventory.indexOf(response.itemUsed);
         if (itemIndex > -1) {
           activeInventory.splice(itemIndex, 1); // Remove item
           
           // Item Effects
           if (response.itemUsed === 'HEAL_MODULE') {
             currentAgent.hp = Math.min(100, currentAgent.hp + 25);
           }
           if (response.itemUsed === 'FACT_CHECKER') {
             finalLogicScore = Math.max(finalLogicScore, 85); // Guarantee high score
           }
         } else {
           response.itemUsed = 'NONE';
         }
      }

      // 2. Calculate Damage based on Logic Score
      if (finalLogicScore > 45) {
        damage = Math.floor((finalLogicScore / 100) * 20); // Base damage
        
        // Critical Logic Bonus
        if (finalLogicScore > 80) damage += 10;

        // Item Effect: Amplifier
        if (response.itemUsed === 'LOGIC_AMPLIFIER') {
           damage = Math.floor(damage * 1.5);
        }
      } else {
        damage = 0; // Penalty for bad logic
      }

      // 3. Update State
      setAgents(prev => {
        const newAgents = [...prev];
        const active = { ...newAgents[currentAgentIdx] };
        const enemy = { ...newAgents[opponentIdx] };

        // Update Active
        active.lastAction = response.action;
        active.emotion = response.emotion;
        active.inventory = activeInventory;
        
        // Ensure they stay within bounds but move dynamically
        if (response.targetX !== undefined) active.x = Math.max(10, Math.min(90, response.targetX));
        if (response.targetY !== undefined) active.y = Math.max(20, Math.min(80, response.targetY));

        // Deal Damage to Enemy
        if (response.action === 'attack' && damage > 0) {
            enemy.hp = Math.max(0, enemy.hp - damage);
            enemy.lastAction = 'defend';
            enemy.emotion = 'injured';
        }

        newAgents[currentAgentIdx] = active;
        newAgents[opponentIdx] = enemy;
        return newAgents;
      });

      // 4. Update UI Overlay
      setLastTurnInfo({
        agentId: currentAgent.id,
        damage,
        logicScore: finalLogicScore,
        judgeComment: response.judgeComment,
        itemUsed: response.itemUsed
      });

      // 5. Add to History
      const newTurn: DebateTurn = {
        agentId: currentAgent.id,
        message: response.message,
        timestamp: Date.now(),
        logicScore: finalLogicScore,
        judgeComment: response.judgeComment,
        damageDealt: damage,
        itemUsed: response.itemUsed
      };
      setHistory(prev => [...prev, newTurn]);

      setTurnIndex(prev => prev + 1);
      setIsLoading(false);
      processingRef.current = false;
    };

    executeTurn();

  }, [isDebating, turnIndex, agents, topic, history, winner, language]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30 flex flex-col">
      {summary && <DebateSummary summary={summary} onClose={() => setSummary(null)} language={language} />}
      
      <main className="flex-grow p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        
        {/* Header */}
        <header className="flex flex-col lg:flex-row justify-between items-center gap-6 border-b border-slate-800 pb-6 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-10 pt-2">
          <div className="flex items-center gap-3 self-start lg:self-center">
             <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-3 rounded-xl shadow-lg shadow-blue-900/20 ring-1 ring-white/10">
               <Swords size={32} className="text-white" />
             </div>
             <div>
               <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300">
                 {t.title}
               </h1>
               <p className="text-slate-500 text-xs md:text-sm font-medium tracking-wide">{t.subtitle}</p>
             </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
             {/* Language Switcher */}
            <button 
              onClick={toggleLanguage}
              disabled={isDebating}
              className={`w-full sm:w-auto flex justify-center items-center gap-2 px-4 py-2 rounded-lg border text-sm font-bold transition-all ${
                language === 'KO' 
                ? 'bg-blue-950/40 border-blue-500/30 text-blue-300 hover:bg-blue-900/60' 
                : 'bg-indigo-950/40 border-indigo-500/30 text-indigo-300 hover:bg-indigo-900/60'
              } ${isDebating ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
            >
               <Globe size={16} />
               <span>{language === 'KO' ? 'KO' : 'EN'}</span>
            </button>

            <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-2">
              <div className="flex w-full shadow-sm">
                <input 
                  type="text" 
                  placeholder={t.placeholder}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={isDebating}
                  className="flex-1 min-w-0 bg-slate-900 border border-slate-700 rounded-l-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder:text-slate-600 text-sm md:text-base"
                />
                <button
                  onClick={suggestTopic}
                  disabled={isDebating}
                  className="bg-slate-800 border-y border-r border-slate-700 hover:bg-slate-700 px-4 rounded-r-lg text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                  title={t.randomTopic}
                >
                  <Dice5 size={20} />
                </button>
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                {!isDebating ? (
                   <button 
                    onClick={startDebate}
                    disabled={!topic.trim()}
                    className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-semibold flex justify-center items-center gap-2 transition-all shadow-lg shadow-blue-900/30 whitespace-nowrap active:translate-y-0.5"
                  >
                    <Play size={18} fill="currentColor" /> {t.start}
                  </button>
                ) : (
                  <button 
                    onClick={stopDebate}
                    className="flex-1 sm:flex-none bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-lg font-semibold flex justify-center items-center gap-2 transition-all shadow-lg shadow-red-900/30 active:translate-y-0.5"
                  >
                    <Square size={18} fill="currentColor" /> {t.stop}
                  </button>
                )}
                <button 
                  onClick={resetDebate}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 rounded-lg transition-all border border-slate-700 active:bg-slate-600"
                  title={t.reset}
                >
                  <RefreshCw size={18} />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Winner Banner */}
        {winner && (
          <div className="bg-gradient-to-r from-yellow-900/20 to-amber-900/20 border border-yellow-500/50 text-yellow-100 p-6 rounded-2xl text-center flex flex-col items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
            <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
               <span>🏆</span> 
               <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-amber-400">
                 {winner === AgentRole.PRO ? t.proName : t.conName} {t.winner}
               </span>
               <span>🏆</span>
            </h2>
            <p className="text-yellow-200/70 max-w-xl mx-auto">{t.winnerDesc}</p>
            {!summary && !isGeneratingSummary && (
               <button onClick={handleGenerateSummary} className="mt-2 text-sm bg-yellow-600 hover:bg-yellow-500 px-6 py-2 rounded-full text-white shadow-lg shadow-yellow-900/40 font-semibold transition-all hover:scale-105">
                  {t.analysis}
               </button>
            )}
            {isGeneratingSummary && <p className="text-sm text-yellow-500 animate-pulse font-mono">{t.analyzing}</p>}
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 min-h-[500px]">
          
          {/* Left Column: Visual Arena */}
          <section className="space-y-4 flex flex-col">
             <div className="flex justify-between items-center text-sm font-semibold text-slate-400 px-1">
               <span className="flex items-center gap-2"><Zap size={14} className="text-blue-400"/> {t.arenaTitle}</span>
               {isLoading && <span className="text-blue-400 animate-pulse text-xs font-mono uppercase tracking-wider">{t.judgeActive}</span>}
             </div>
             
             <Arena 
               agents={agents} 
               currentSpeakerId={isLoading ? agents[turnIndex % 2].id : null}
               lastTurnInfo={lastTurnInfo}
               language={language}
             />
             
             {/* Stats Panel */}
             <div className="grid grid-cols-2 gap-4">
               {agents.map(agent => (
                 <div key={agent.id} className={`p-4 rounded-xl border transition-all duration-500 ${agent.hp < 30 ? 'bg-red-950/20 border-red-900/50 shadow-[inset_0_0_20px_rgba(220,38,38,0.1)]' : 'bg-slate-900/50 border-slate-800'}`}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
                      <span className="font-mono text-sm font-bold text-slate-200 truncate">
                        {agent.role === AgentRole.PRO ? t.proName : t.conName}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider border ${
                        agent.emotion === 'angry' ? 'bg-red-900/30 border-red-800 text-red-400' : 
                        agent.emotion === 'confident' ? 'bg-green-900/30 border-green-800 text-green-400' : 
                        'bg-slate-800 border-slate-700 text-slate-400'
                      }`}>
                        {agent.emotion}
                      </span>
                    </div>
                    
                    {/* HP Bar */}
                    <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden shadow-inner ring-1 ring-white/5">
                       <div 
                         className={`h-full transition-all duration-500 ease-out ${agent.hp > 50 ? 'bg-gradient-to-r from-green-600 to-emerald-400' : agent.hp > 20 ? 'bg-gradient-to-r from-yellow-600 to-amber-400' : 'bg-gradient-to-r from-red-600 to-rose-500'}`}
                         style={{ width: `${agent.hp}%`}} 
                       />
                    </div>
                    <div className="mt-2 text-xs text-slate-500 flex justify-between font-mono">
                      <span>{t.hp}: {Math.max(0, agent.hp)}%</span>
                      <span className="capitalize text-slate-400">{agent.lastAction === 'attack' ? t.attack : (agent.lastAction === 'defend' ? t.defend : agent.lastAction)}</span>
                    </div>
                    
                    {/* Inventory Display */}
                    <div className="mt-4 pt-3 border-t border-slate-800/50">
                      <div className="text-[10px] text-slate-600 mb-2 uppercase tracking-widest font-bold">{t.inventory}</div>
                      <div className="flex gap-1.5 flex-wrap min-h-[1.5rem]">
                        {agent.inventory.length === 0 && <span className="text-[10px] text-slate-700 italic">{t.empty}</span>}
                        {agent.inventory.map((item, idx) => (
                          <div key={idx} className="group relative w-3 h-3 cursor-help">
                             <div className={`w-full h-full rounded-full transition-transform hover:scale-150 ${
                                item === 'HEAL_MODULE' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' :
                                item === 'LOGIC_AMPLIFIER' ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]' :
                                'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]'
                             }`}></div>
                          </div>
                        ))}
                      </div>
                    </div>
                 </div>
               ))}
             </div>
          </section>

          {/* Right Column: Transcript */}
          <section className="space-y-4 flex flex-col h-full">
            <div className="flex justify-between items-center text-sm font-semibold text-slate-400 px-1">
               <span>{t.transcriptTitle}</span>
               {summary && (
                 <button onClick={() => setSummary(summary)} className="flex items-center gap-1.5 text-xs bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-full hover:bg-blue-500/20 border border-blue-500/20 transition-colors">
                   <Archive size={12}/> {t.viewSummary}
                 </button>
               )}
             </div>
            <ChatLog history={history} agents={agents} language={language} />
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-900 bg-slate-950 text-center">
        <p className="text-slate-600 text-xs font-mono">
          Powered by <span className="text-slate-400 font-bold">Google Gemini 2.5 Flash</span> • Cloudflare Ready
        </p>
      </footer>
    </div>
  );
}

export default App;