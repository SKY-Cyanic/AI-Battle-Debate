import { AgentRole, AgentState, Language } from "./types";

export const INITIAL_AGENTS: AgentState[] = [
  {
    id: 'agent-pro',
    role: AgentRole.PRO,
    name: 'Proponent Bot',
    x: 20,
    y: 50,
    hp: 100,
    emotion: 'neutral',
    lastAction: 'idle',
    color: 'bg-blue-500',
    inventory: ['HEAL_MODULE', 'LOGIC_AMPLIFIER', 'FACT_CHECKER']
  },
  {
    id: 'agent-con',
    role: AgentRole.CON,
    name: 'Opponent Bot',
    x: 80,
    y: 50,
    hp: 100,
    emotion: 'neutral',
    lastAction: 'idle',
    color: 'bg-red-500',
    inventory: ['HEAL_MODULE', 'LOGIC_AMPLIFIER', 'FACT_CHECKER']
  }
];

export const MODEL_NAME = 'gemini-2.5-flash';

export const TOPICS_BY_LANG: Record<Language, string[]> = {
  KO: [
    "AI는 인류에게 위험한가?",
    "하와이안 피자는 범죄인가?",
    "고양이가 개보다 더 나은 반려동물이다.",
    "비디오 게임은 폭력을 유발하는가?",
    "보편적 기본소득은 필요한가?",
    "학교 내 스마트폰 사용을 금지해야 한다.",
    "마블 영화가 DC보다 낫다.",
    "인류는 화성을 식민지화해야 한다.",
    "재택근무가 사무실 근무보다 낫다.",
    "SNS는 득보다 실이 많다."
  ],
  EN: [
    "Is AI dangerous for humanity?",
    "Pineapple on pizza is a crime.",
    "Cats are better pets than dogs.",
    "Video games cause violence.",
    "Universal Basic Income is necessary.",
    "Mobile phones should be banned in schools.",
    "Marvel movies are better than DC.",
    "Humanity should colonize Mars.",
    "Remote work is better than office work.",
    "Social media does more harm than good."
  ]
};

export const UI_TEXT = {
  KO: {
    title: "AI 배틀 토론",
    subtitle: "논리 기반 데미지 시스템 • 2D 아레나",
    placeholder: "주제를 입력하세요...",
    randomTopic: "주제 추천",
    start: "전투 시작",
    stop: "중지",
    reset: "리셋",
    winner: "승리!",
    winnerDesc: "논리가 승리했습니다. 상대방은 더 이상 반박할 수 없습니다.",
    analysis: "결과 분석",
    analyzing: "최종 분석 중...",
    arenaTitle: "가상 경기장",
    judgeActive: "심판이 논리를 분석 중입니다...",
    transcriptTitle: "대화 기록",
    viewSummary: "요약 보기",
    inventory: "아이템 인벤토리",
    empty: "비어있음",
    thinking: "생각 중...",
    logicVerdict: "논리 판정",
    criticalHit: "치명타!",
    judge: "히든 심판",
    damage: "데미지",
    hp: "체력",
    attack: "공격",
    defend: "방어",
    itemUsed: "사용됨",
    summaryTitle: "토론 결과 분석",
    close: "닫기",
    proName: "찬성 봇",
    conName: "반대 봇"
  },
  EN: {
    title: "AI Battle Debate",
    subtitle: "Logic-Based Damage System • 2D Arena",
    placeholder: "Enter a topic...",
    randomTopic: "Suggest Topic",
    start: "Start Battle",
    stop: "Stop",
    reset: "Reset",
    winner: "WINS!",
    winnerDesc: "Logic prevailed. The opponent could not sustain the argument.",
    analysis: "Analysis",
    analyzing: "Computing Final Analysis...",
    arenaTitle: "VIRTUAL ARENA",
    judgeActive: "Judge Analyzing Logic...",
    transcriptTitle: "TRANSCRIPT",
    viewSummary: "View Summary",
    inventory: "INVENTORY",
    empty: "Empty",
    thinking: "Thinking...",
    logicVerdict: "Logic Verdict",
    criticalHit: "CRITICAL HIT!",
    judge: "Hidden Judge",
    damage: "Damage",
    hp: "HP",
    attack: "Attack",
    defend: "Defend",
    itemUsed: "USED",
    summaryTitle: "Post-Match Analysis",
    close: "Close",
    proName: "Proponent Bot",
    conName: "Opponent Bot"
  }
};