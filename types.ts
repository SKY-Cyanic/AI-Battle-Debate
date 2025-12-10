export enum AgentRole {
  PRO = 'PRO',
  CON = 'CON'
}

export type Language = 'KO' | 'EN';

export type ActionType = 'idle' | 'move' | 'attack' | 'defend' | 'wait';
export type EmotionType = 'neutral' | 'angry' | 'confident' | 'confused' | 'happy' | 'injured' | 'triumphant';
export type ItemType = 'HEAL_MODULE' | 'LOGIC_AMPLIFIER' | 'FACT_CHECKER' | 'NONE';

export interface AgentState {
  id: string;
  role: AgentRole;
  name: string;
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  hp: number; // 0-100
  emotion: EmotionType;
  lastAction: ActionType;
  color: string;
  inventory: ItemType[];
}

export interface DebateTurn {
  agentId: string;
  message: string;
  timestamp: number;
  logicScore?: number;
  judgeComment?: string;
  damageDealt?: number;
  itemUsed?: ItemType;
}

export interface AIResponse {
  message: string;
  action: ActionType;
  targetX?: number;
  targetY?: number;
  emotion: EmotionType;
  itemUsed: ItemType;
  logicScore: number; // 0-100, determines damage
  judgeComment: string; // Brief reason for the score
}