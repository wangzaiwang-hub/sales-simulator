// NPC情绪和性格类型定义

export type PersonalityTraits = {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
};

export type Mood =
  | "happy"
  | "sad"
  | "angry"
  | "excited"
  | "tired"
  | "focused"
  | "confused"
  | "calm"
  | "anxious"
  | "neutral";

export type ActivityStatus =
  | "idle"
  | "thinking"
  | "busy"
  | "chatting"
  | "working"
  | "resting"
  | "arguing"
  | "laughing"
  | "pondering";

// 获取状态显示文本
export function getStatusDisplayText(status: ActivityStatus, mood: Mood): string {
  const statusTexts: Record<ActivityStatus, string> = {
    idle: "闲逛中",
    thinking: "思考中",
    busy: "忙碌中",
    chatting: "交流中",
    working: "工作中",
    resting: "休息中",
    arguing: "争吵中",
    laughing: "开心聊天",
    pondering: "沉思中",
  };

  const moodEmojis: Record<Mood, string> = {
    happy: "😊",
    sad: "😢",
    angry: "😠",
    excited: "🤩",
    tired: "😴",
    focused: "🤔",
    confused: "😕",
    calm: "😌",
    anxious: "😰",
    neutral: "😐",
  };

  return `${moodEmojis[mood]} ${statusTexts[status]}`;
}

// 获取状态颜色
export function getStatusColor(status: ActivityStatus): string {
  const colors: Record<ActivityStatus, string> = {
    idle: "#94a3b8", // slate-400
    thinking: "#60a5fa", // blue-400
    busy: "#f59e0b", // amber-500
    chatting: "#10b981", // emerald-500
    working: "#8b5cf6", // violet-500
    resting: "#06b6d4", // cyan-500
    arguing: "#ef4444", // red-500
    laughing: "#f59e0b", // amber-500
    pondering: "#6366f1", // indigo-500
  };

  return colors[status] || "#94a3b8";
}
