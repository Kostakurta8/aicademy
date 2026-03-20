import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface LeaderboardEntry {
  id: string;
  name: string;
  xp: number;
  level: number;
  streak: number;
  avatar: string;
  isCurrentUser: boolean;
}

// Simulated competitors — gives the feeling of a live community
const BOT_NAMES = [
  "PromptQueen",
  "NeuralNinja",
  "TokenTitan",
  "AIExplorer",
  "DataDreamer",
  "ByteWizard",
  "ModelMaster",
  "ChatSensei",
  "DeepLearner",
  "SyntaxStar",
  "PixelPilot",
  "LogicLlama",
  "CodeCrusader",
  "TensorTribe",
  "EpochElite",
  "GradientGuru",
  "LayerLion",
  "BotBuilder",
  "VectorVibes",
  "WeightWolf",
  "BiasBreaker",
  "LossLegend",
  "BatchBoss",
  "KernelKid",
  "AttentionAce",
  "TransformerTim",
  "EmbedEmma",
  "FineTuneFox",
  "RAGRanger",
  "AgentAlpha",
];

const AVATARS = [
  "🧑‍💻",
  "👩‍🔬",
  "🧙‍♂️",
  "🦊",
  "🐱",
  "🤖",
  "👾",
  "🧠",
  "🎮",
  "⚡",
  "🔥",
  "💎",
  "🚀",
  "🌟",
  "🎯",
  "👑",
  "🦄",
  "🐲",
  "🎪",
  "🌈",
  "🦅",
  "🐺",
  "🎭",
  "🏆",
  "💡",
  "🔮",
  "🎲",
  "🌊",
  "🍀",
  "⭐",
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function getWeekSeed(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.floor(
    ((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7,
  );
  return now.getFullYear() * 100 + weekNum;
}

function getDaySeed(): number {
  const now = new Date();
  return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
}

function generateBots(
  seed: number,
  count: number,
  xpRange: [number, number],
): LeaderboardEntry[] {
  const rng = seededRandom(seed);
  const usedNames = new Set<string>();
  const bots: LeaderboardEntry[] = [];

  for (let i = 0; i < count; i++) {
    let name: string;
    do {
      name = BOT_NAMES[Math.floor(rng() * BOT_NAMES.length)];
    } while (usedNames.has(name));
    usedNames.add(name);

    const xp = Math.round(xpRange[0] + rng() * (xpRange[1] - xpRange[0]));
    const level = Math.min(30, Math.max(1, Math.floor(xp / 250) + 1));
    const streak = Math.floor(rng() * 30);
    const avatar = AVATARS[Math.floor(rng() * AVATARS.length)];

    bots.push({
      id: `bot-${name}`,
      name,
      xp,
      level,
      streak,
      avatar,
      isCurrentUser: false,
    });
  }

  return bots;
}

interface LeaderboardStore {
  lastRefreshed: string;

  getGlobalLeaderboard: (
    userXP: number,
    userName: string,
    userLevel: number,
    userStreak: number,
  ) => LeaderboardEntry[];
  getWeeklyLeaderboard: (
    userXP: number,
    userName: string,
    userLevel: number,
    userStreak: number,
  ) => LeaderboardEntry[];
}

export const useLeaderboardStore = create<LeaderboardStore>()(
  persist(
    (set, get) => ({
      lastRefreshed: "",

      getGlobalLeaderboard: (userXP, userName, userLevel, userStreak) => {
        const bots = generateBots(2026, 20, [100, 12000]);
        const user: LeaderboardEntry = {
          id: "current-user",
          name: userName || "You",
          xp: userXP,
          level: userLevel,
          streak: userStreak,
          avatar: "🎓",
          isCurrentUser: true,
        };
        return [...bots, user].sort((a, b) => b.xp - a.xp).slice(0, 20);
      },

      getWeeklyLeaderboard: (userXP, userName, userLevel, userStreak) => {
        const seed = getWeekSeed();
        const bots = generateBots(seed, 15, [50, 2000]);
        // Weekly XP is simulated as a fraction of total
        const weeklyUserXP = Math.min(userXP, Math.round(userXP * 0.3));
        const user: LeaderboardEntry = {
          id: "current-user",
          name: userName || "You",
          xp: weeklyUserXP,
          level: userLevel,
          streak: userStreak,
          avatar: "🎓",
          isCurrentUser: true,
        };
        return [...bots, user].sort((a, b) => b.xp - a.xp).slice(0, 15);
      },
    }),
    { name: "aicademy-leaderboard" },
  ),
);
