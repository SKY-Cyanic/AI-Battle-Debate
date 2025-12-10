import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AIResponse, AgentRole, AgentState, DebateTurn, Language } from "../types";
import { MODEL_NAME } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    message: {
      type: Type.STRING,
      description: "The argument or counter-argument text. Keep it concise (under 30 words).",
    },
    action: {
      type: Type.STRING,
      enum: ["idle", "move", "attack", "defend"],
      description: "Physical action. ATTACK if argument is strong (damage dealt). MOVE to pace around.",
    },
    targetX: {
      type: Type.NUMBER,
      description: "Target X coordinate (0-100). Keep distance dynamic.",
    },
    targetY: {
      type: Type.NUMBER,
      description: "Target Y coordinate (0-100).",
    },
    emotion: {
      type: Type.STRING,
      enum: ["neutral", "angry", "confident", "confused", "happy", "triumphant"],
      description: "Emotional state.",
    },
    itemUsed: {
      type: Type.STRING,
      enum: ["HEAL_MODULE", "LOGIC_AMPLIFIER", "FACT_CHECKER", "NONE"],
      description: "Item to use from inventory. HEAL_MODULE restores HP. LOGIC_AMPLIFIER boosts this turn's damage. FACT_CHECKER ensures a high logic score.",
    },
    logicScore: {
      type: Type.NUMBER,
      description: "0-100 Score representing the logical strength of this argument. 0-40: Fallacy/Weak. 41-70: Sound. 71-100: Irrefutable/Fact-based.",
    },
    judgeComment: {
      type: Type.STRING,
      description: "A short verdict from the Hidden Judge about why this score was given.",
    },
  },
  required: ["message", "action", "emotion", "itemUsed", "logicScore", "judgeComment"],
};

export const generateAgentTurn = async (
  currentAgent: AgentState,
  opponent: AgentState,
  topic: string,
  history: DebateTurn[],
  language: Language
): Promise<AIResponse> => {
  
  const historyText = history.map(h => 
    `${h.agentId === currentAgent.id ? 'ME' : 'OPPONENT'} [Logic:${h.logicScore}]: ${h.message}`
  ).join('\n');

  const langInstruction = language === 'KO' 
    ? "YOU MUST SPEAK IN KOREAN ONLY." 
    : "YOU MUST SPEAK IN ENGLISH ONLY.";

  const systemInstruction = `
    You are controlling an AI agent in a 2D physical debate arena (fighting game style).
    
    **LANGUAGE RULE**: 
    ${langInstruction}
    The topic is: "${topic}".
    
    Role: ${currentAgent.role === AgentRole.PRO ? "PROPONENT (Argue FOR)" : "OPPONENT (Argue AGAINST)"}.
    Name: ${currentAgent.name}.
    HP: ${currentAgent.hp} (Max 100).
    Inventory: ${currentAgent.inventory.join(', ')}.
    
    **THE HIDDEN JUDGE MECHANIC**:
    You must also act as an impartial Hidden Judge.
    - If the argument is a logical fallacy, ad hominem, or weak: assign a LOW logicScore (0-40).
    - If the argument is sound and relevant: assign a MEDIUM logicScore (41-75).
    - If the argument is a brilliant counter, uses facts, or exposes a contradiction: assign a HIGH logicScore (76-100).
    - DAMAGE IS CALCULATED BASED ON LOGIC SCORE. Weak arguments do 0 damage.
    
    **MOVEMENT & ACTION**:
    - Act like a fighting game character. 
    - If your logic is strong, choose 'attack' to lunge at the opponent.
    - If you are losing, 'defend' or 'move' away.
    - Don't just stand still. Move x/y coordinates to simulate pacing or dodging.
    
    **ITEMS**:
    - Use 'HEAL_MODULE' if HP < 40 to recover health.
    - Use 'LOGIC_AMPLIFIER' if you are about to deliver a crushing argument (boosts damage).
    - Use 'FACT_CHECKER' to guarantee a logicScore > 80 (simulated).
    - ONLY use an item if you have it in your Inventory. Otherwise use 'NONE'.
    
    Context:
    ${historyText}
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: "Your turn. Make your argument, choose action, and Judge yourself honestly.",
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.9, 
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AIResponse;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      message: "Processing error...",
      action: "idle",
      emotion: "confused",
      targetX: currentAgent.x,
      targetY: currentAgent.y,
      itemUsed: "NONE",
      logicScore: 10,
      judgeComment: "System Error"
    };
  }
};

export const generateDebateSummary = async (history: DebateTurn[], topic: string, language: Language): Promise<string> => {
  const transcript = history.map(h => `${h.agentId}: ${h.message}`).join('\n');
  const langInstruction = language === 'KO' 
    ? "Write the summary in KOREAN." 
    : "Write the summary in ENGLISH.";

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `
        Analyze this debate transcript on the topic: "${topic}".
        ${langInstruction}
        
        Transcript:
        ${transcript}
        
        Please provide a structured summary in Markdown format:
        1. **Winner**: Declare who won based on logical consistency.
        2. **Key Arguments**: Bullet points of the best points made.
        3. **Critical Failures**: Point out any major logical fallacies used.
        4. **Conclusion**: A brief wrap-up of the discussion.
      `,
    });
    return response.text || "Could not generate summary.";
  } catch (e) {
    return "Summary generation failed.";
  }
}