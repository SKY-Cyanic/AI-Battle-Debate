import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, RefreshCw, Swords, Archive, Dice5, Globe } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans selection:bg-blue-500/30">
      {summary && <DebateSummary summary={summary} onClose={() => setSummary(null)} language={language} />}
      
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
             <div className="bg-gradient-to-tr from-blue-600 to-purple-600 p-3 rounded-lg shadow-lg shadow-blue-900/20">
               <Swords size={32} className="text-white" />
             </div>
             <div>
               <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                 {t.title}
               </h1>
               <p className="text-slate-500 text-sm">{t.subtitle}</p>
             </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
             {/* Language Switcher */}
            <button 
              onClick={toggleLanguage}
              disabled={isDebating}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-bold transition-all ${
                language === 'KO' 
                ? 'bg-blue-900/50 border-blue-500 text-blue-200' 
                : 'bg-purple-900/50 border-purple-500 text-purple-200'
              } ${isDebating ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
            >
               <Globe size={16} />
               <span>{language === 'KO' ? '한국어 (KO)' : 'ENGLISH (EN)'}</span>
            </button>

            <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2">
              <div className="flex w-full">
                <input 
                  type="text" 
                  placeholder={t.placeholder}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={isDebating}
                  className="flex-1 min-w-[200px] bg-slate-900 border border-slate-700 rounded-l-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                />
                <button
                  onClick={suggestTopic}
                  disabled={isDebating}
                  className="bg-slate-800 border border-l-0 border-slate-700 hover:bg-slate-700 px-3 rounded-r-lg text-slate-400 hover:text-white transition-colors"
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
                    className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-semibold flex justify-center items-center gap-2 transition-all shadow-lg shadow-blue-900/30 whitespace-nowrap"
                  >
                    <Play size={18} fill="currentColor" /> {t.start}
                  </button>
                ) : (
                  <button 
                    onClick={stopDebate}
                    className="flex-1 sm:flex-none bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-lg font-semibold flex justify-center items-center gap-2 transition-all shadow-lg shadow-red-900/30"
                  >
                    <Square size={18} fill="currentColor" /> {t.stop}
                  </button>
                )}
                <button 
                  onClick={resetDebate}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 rounded-lg transition-all"
                  title={t.reset}
                >
                  <RefreshCw size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Winner Banner */}
        {winner && (
          <div className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-200 p-4 rounded-xl text-center animate-pulse flex flex-col items-center gap-2">
            <h2 className="text-2xl font-bold">🏆 {winner === AgentRole.PRO ? t.proName : t.conName} {t.winner} 🏆</h2>
            <p className="text-yellow-200/60">{t.winnerDesc}</p>
            {!summary && !isGeneratingSummary && (
               <button onClick={handleGenerateSummary} className="text-sm bg-yellow-600/50 hover:bg-yellow-600 px-4 py-1 rounded text-white border border-yellow-500/50">
                  {t.analysis}
               </button>
            )}
            {isGeneratingSummary && <p className="text-xs text-yellow-500 animate-pulse">{t.analyzing}</p>}
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Column: Visual Arena */}
          <div className="space-y-4">
             <div className="flex justify-between items-center text-sm font-semibold text-slate-400 px-1">
               <span>{t.arenaTitle}</span>
               {isLoading && <span className="text-blue-400 animate-pulse">{t.judgeActive}</span>}
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
                 <div key={agent.id} className={`p-4 rounded-xl border transition-colors duration-500 ${agent.hp < 30 ? 'bg-red-950/20 border-red-900/50' : 'bg-slate-900 border-slate-800'}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-mono text-sm font-bold text-slate-300">
                        {agent.role === AgentRole.PRO ? t.proName : t.conName}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 ${
                        agent.emotion === 'angry' ? 'text-red-400' : 
                        agent.emotion === 'confident' ? 'text-green-400' : 'text-slate-400'
                      }`}>
                        {agent.emotion}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                       <div 
                         className={`h-full transition-all duration-300 ${agent.hp > 50 ? 'bg-green-500' : agent.hp > 20 ? 'bg-yellow-500' : 'bg-red-500'}`}
                         style={{ width: `${agent.hp}%`}} 
                       />
                    </div>
                    <div className="mt-2 text-xs text-slate-500 flex justify-between">
                      <span>{t.hp}: {Math.max(0, agent.hp)}%</span>
                      <span className="capitalize">{agent.lastAction === 'attack' ? t.attack : (agent.lastAction === 'defend' ? t.defend : agent.lastAction)}</span>
                    </div>
                    
                    {/* Inventory Display */}
                    <div className="mt-3 pt-3 border-t border-slate-800">
                      <div className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider">{t.inventory}</div>
                      <div className="flex gap-1 flex-wrap h-6">
                        {agent.inventory.length === 0 && <span className="text-[10px] text-slate-600 italic">{t.empty}</span>}
                        {agent.inventory.map((item, idx) => (
                          <div key={idx} className="w-2 h-2 rounded-full bg-slate-600 hover:scale-150 transition-transform" title={item}>
                             {item === 'HEAL_MODULE' && <div className="w-full h-full bg-green-500 rounded-full shadow-[0_0_5px_rgba(34,197,94,0.5)]"></div>}
                             {item === 'LOGIC_AMPLIFIER' && <div className="w-full h-full bg-purple-500 rounded-full shadow-[0_0_5px_rgba(168,85,247,0.5)]"></div>}
                             {item === 'FACT_CHECKER' && <div className="w-full h-full bg-yellow-500 rounded-full shadow-[0_0_5px_rgba(234,179,8,0.5)]"></div>}
                          </div>
                        ))}
                      </div>
                    </div>
                 </div>
               ))}
             </div>
          </div>

          {/* Right Column: Transcript */}
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm font-semibold text-slate-400 px-1">
               <span>{t.transcriptTitle}</span>
               {summary && (
                 <button onClick={() => setSummary(summary)} className="flex items-center gap-1 text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded hover:bg-blue-600/30">
                   <Archive size={12}/> {t.viewSummary}
                 </button>
               )}
             </div>
            <ChatLog history={history} agents={agents} language={language} />
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;