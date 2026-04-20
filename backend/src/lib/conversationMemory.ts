import { insertRows } from './supabase';
import { secondMeJsonRequest } from './secondmeHttp';

type ChatRow = {
  id?: string;
  userId: string;
  targetUserId: string;
  message?: string | null;
  reply?: string | null;
  createdAt?: string | null;
  source?: string | null;
  aiReasoning?: string | null;
};

type SummaryMetadata = {
  coveredChatPairs: number;
  windowStartAt?: string | null;
  windowEndAt?: string | null;
};

export const MEMORY_SUMMARY_SOURCE = 'memory-summary';
export const MEMORY_SUMMARY_PAIR_SIZE = 5;

function parseMetadata(row: ChatRow): SummaryMetadata | null {
  if (!row.aiReasoning) {
    return null;
  }

  try {
    return JSON.parse(row.aiReasoning) as SummaryMetadata;
  } catch {
    return null;
  }
}

export function splitChatRows(rows: ChatRow[]) {
  const summaries = rows.filter((row) => row.source === MEMORY_SUMMARY_SOURCE);
  const conversations = rows.filter((row) => row.source !== MEMORY_SUMMARY_SOURCE);
  return { summaries, conversations };
}

export function extractMemorySummaries(rows: ChatRow[]) {
  return rows
    .filter((row) => row.source === MEMORY_SUMMARY_SOURCE)
    .map((row) => row.reply || row.message || '')
    .map((value) => String(value).trim())
    .filter(Boolean);
}

function summarizeConversationPairs(rows: ChatRow[]) {
  const lines: string[] = [];
  const facts = new Set<string>();

  rows.forEach((row) => {
    const userText = String(row.message || '').trim();
    const npcText = String(row.reply || '').trim();

    if (userText) {
      lines.push(`玩家：${userText}`);
      const fact = userText.match(/(我叫|我是|我在|我想|我喜欢|我不喜欢|我需要|我正在)[^，。！？\n]{1,24}/);
      if (fact) facts.add(fact[0]);
    }

    if (npcText) {
      lines.push(`NPC：${npcText}`);
      const fact = npcText.match(/(可以|建议|记得|下次|你可以|我们可以)[^，。！？\n]{1,24}/);
      if (fact) facts.add(fact[0]);
    }
  });

  const recentThreads = lines.slice(-6).join('；');
  const factText = [...facts].slice(0, 4).join('；');

  return [
    '阶段记忆摘要：',
    factText ? `关键信息：${factText}` : null,
    recentThreads ? `最近脉络：${recentThreads}` : null,
  ]
    .filter(Boolean)
    .join('\n');
}

function getCoveredPairCount(summaryRows: ChatRow[]) {
  return summaryRows.reduce((count, row) => {
    const metadata = parseMetadata(row);
    return count + (metadata?.coveredChatPairs || MEMORY_SUMMARY_PAIR_SIZE);
  }, 0);
}

export async function persistConversationMemorySummary(rows: ChatRow[]) {
  const { summaries, conversations } = splitChatRows(rows);
  const coveredPairs = getCoveredPairCount(summaries);

  if (conversations.length < coveredPairs + MEMORY_SUMMARY_PAIR_SIZE) {
    return null;
  }

  const nextWindow = conversations.slice(coveredPairs, coveredPairs + MEMORY_SUMMARY_PAIR_SIZE);
  if (nextWindow.length < MEMORY_SUMMARY_PAIR_SIZE) {
    return null;
  }

  const summary = summarizeConversationPairs(nextWindow);
  const metadata: SummaryMetadata = {
    coveredChatPairs: nextWindow.length,
    windowStartAt: nextWindow[0]?.createdAt || null,
    windowEndAt: nextWindow[nextWindow.length - 1]?.createdAt || null,
  };

  const [savedSummary] = await insertRows<ChatRow>('ChatMessage', {
    userId: nextWindow[0].userId,
    targetUserId: nextWindow[0].targetUserId,
    message: '[阶段记忆]',
    reply: summary,
    source: MEMORY_SUMMARY_SOURCE,
    aiReasoning: JSON.stringify(metadata),
  });

  return savedSummary || null;
}

function env(name: string) {
  return process.env[name]?.trim() || '';
}

export async function syncConversationMemoryToSecondMeNote(
  accessToken: string | null | undefined,
  npcName: string,
  summary: string,
) {
  const noteEndpoint = env('SECONDME_NOTE_API_URL');
  if (!accessToken || !noteEndpoint || !summary.trim()) {
    return false;
  }

  const response = await secondMeJsonRequest<unknown>({
    url: noteEndpoint,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: `${npcName} 对话记忆`,
      content: summary,
      tags: ['sales-simulator', 'npc-memory'],
    }),
    timeoutMs: 30000,
  });

  if (!response.ok) {
    throw new Error(response.bodyText || 'SecondMe note sync failed');
  }

  return true;
}
