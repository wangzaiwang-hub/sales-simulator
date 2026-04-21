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
function getMoodEmoji(mood?: string) {
  const value = (mood || "").trim().toLowerCase();

  if (/angry|生气|火大|烦|恼|不爽/.test(value)) return "😠";
  if (/sad|难过|低落|委屈|伤心/.test(value)) return "😢";
  if (/anxious|焦虑|慌|不安|紧张/.test(value)) return "😰";
  if (/tired|累|困|疲/.test(value)) return "😴";
  if (/excited|兴奋|期待|激动|灵感/.test(value)) return "🤩";
  if (/focused|专注|认真|投入|沉浸/.test(value)) return "🤔";
  if (/happy|开心|高兴|愉快|轻松|松快/.test(value)) return "😊";
  if (/calm|平静|稳定|踏实/.test(value)) return "😌";
  if (/confused|困惑|懵|乱/.test(value)) return "😕";
  return "😐";
}

function getReadableStatus(status?: string) {
  const value = (status || "").trim().toLowerCase();

  if (/working|工作|写|做|改|处理|创作|备课|调试|编/.test(value)) return "工作中";
  if (/resting|休息|缓|歇|喝水|发呆/.test(value)) return "休息中";
  if (/busy|忙|赶|排期/.test(value)) return "忙碌中";
  if (/chatting|聊天|交流|说话|继续聊天/.test(value)) return "在聊天";
  if (/thinking|思考|想|琢磨/.test(value)) return "思考中";
  if (/laughing|笑|开心聊/.test(value)) return "聊得挺开心";
  if (/arguing|争吵|对线/.test(value)) return "情绪有点冲";
  if (/pondering|沉思/.test(value)) return "沉思中";
  if (/idle|闲逛|晃/.test(value)) return "闲逛中";
  return status?.trim() || "在附近活动";
}

export function getStatusDisplayText(status?: string, mood?: string, activityDetail?: string): string {
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
  const detail = activityDetail?.trim();
  const readableStatus =
    detail && detail.length <= 14
      ? detail
      : status && status in statusTexts
        ? statusTexts[status as ActivityStatus]
        : getReadableStatus(status);

  return `${getMoodEmoji(mood)} ${readableStatus}`;
}

// 获取状态颜色
export function getStatusColor(status?: string): string {
  const value = (status || "").trim().toLowerCase();
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

  if (/busy|工作|写|做|处理|创作/.test(value)) return colors.working;
  if (/rest|休/.test(value)) return colors.resting;
  if (/chat|聊|交流/.test(value)) return colors.chatting;
  if (/think|思|想|琢磨/.test(value)) return colors.thinking;
  if (/argu|吵|火大/.test(value)) return colors.arguing;
  if (/laugh|开心/.test(value)) return colors.laughing;
  return colors[(status as ActivityStatus) || "idle"] || "#94a3b8";
}
