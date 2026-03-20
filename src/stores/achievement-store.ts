import { celebrate } from "@/lib/celebrate";
import { hapticCelebrate } from "@/lib/sounds";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  category: "learning" | "streak" | "social" | "mastery" | "explorer";
  xpReward: number;
  condition: string; // human-readable
}

const ACHIEVEMENTS: Achievement[] = [
  // Learning milestones
  {
    id: "first-lesson",
    title: "First Steps",
    description: "Complete your first lesson",
    emoji: "🎓",
    category: "learning",
    xpReward: 25,
    condition: "lessons >= 1",
  },
  {
    id: "five-lessons",
    title: "Quick Learner",
    description: "Complete 5 lessons",
    emoji: "📚",
    category: "learning",
    xpReward: 50,
    condition: "lessons >= 5",
  },
  {
    id: "ten-lessons",
    title: "Knowledge Seeker",
    description: "Complete 10 lessons",
    emoji: "🧠",
    category: "learning",
    xpReward: 100,
    condition: "lessons >= 10",
  },
  {
    id: "all-lessons",
    title: "AI Scholar",
    description: "Complete all lessons",
    emoji: "🏆",
    category: "learning",
    xpReward: 500,
    condition: "lessons >= 26",
  },
  {
    id: "first-module",
    title: "Module Master",
    description: "Complete an entire module",
    emoji: "⭐",
    category: "learning",
    xpReward: 75,
    condition: "modules >= 1",
  },
  {
    id: "half-modules",
    title: "Halfway Hero",
    description: "Complete 4 modules",
    emoji: "🌟",
    category: "learning",
    xpReward: 200,
    condition: "modules >= 4",
  },

  // Streak achievements
  {
    id: "streak-3",
    title: "Getting Started",
    description: "Maintain a 3-day streak",
    emoji: "🔥",
    category: "streak",
    xpReward: 30,
    condition: "streak >= 3",
  },
  {
    id: "streak-7",
    title: "Week Warrior",
    description: "Maintain a 7-day streak",
    emoji: "💪",
    category: "streak",
    xpReward: 75,
    condition: "streak >= 7",
  },
  {
    id: "streak-14",
    title: "Two Week Titan",
    description: "Maintain a 14-day streak",
    emoji: "⚡",
    category: "streak",
    xpReward: 150,
    condition: "streak >= 14",
  },
  {
    id: "streak-30",
    title: "Monthly Master",
    description: "Maintain a 30-day streak",
    emoji: "👑",
    category: "streak",
    xpReward: 300,
    condition: "streak >= 30",
  },

  // XP milestones
  {
    id: "xp-100",
    title: "Century Club",
    description: "Earn 100 XP total",
    emoji: "💯",
    category: "mastery",
    xpReward: 0,
    condition: "xp >= 100",
  },
  {
    id: "xp-500",
    title: "XP Hunter",
    description: "Earn 500 XP total",
    emoji: "🎯",
    category: "mastery",
    xpReward: 25,
    condition: "xp >= 500",
  },
  {
    id: "xp-1000",
    title: "Kilobyte Club",
    description: "Earn 1,000 XP total",
    emoji: "🚀",
    category: "mastery",
    xpReward: 50,
    condition: "xp >= 1000",
  },
  {
    id: "xp-5000",
    title: "XP Legend",
    description: "Earn 5,000 XP total",
    emoji: "💎",
    category: "mastery",
    xpReward: 100,
    condition: "xp >= 5000",
  },

  // Explorer achievements
  {
    id: "first-game",
    title: "Player One",
    description: "Play your first game",
    emoji: "🎮",
    category: "explorer",
    xpReward: 20,
    condition: "games >= 1",
  },
  {
    id: "five-games",
    title: "Game Master",
    description: "Play 5 different games",
    emoji: "🕹️",
    category: "explorer",
    xpReward: 75,
    condition: "games >= 5",
  },
  {
    id: "first-challenge",
    title: "Challenger",
    description: "Complete your first challenge",
    emoji: "🏅",
    category: "explorer",
    xpReward: 30,
    condition: "challenges >= 1",
  },
  {
    id: "daily-goal-5",
    title: "Goal Getter",
    description: "Complete the daily XP goal 5 times",
    emoji: "🎯",
    category: "mastery",
    xpReward: 100,
    condition: "dailyGoals >= 5",
  },
  {
    id: "comeback",
    title: "Welcome Back",
    description: "Return after 3+ days away",
    emoji: "🫡",
    category: "social",
    xpReward: 50,
    condition: "comeback",
  },
  {
    id: "night-owl",
    title: "Night Owl",
    description: "Study after 11 PM",
    emoji: "🦉",
    category: "explorer",
    xpReward: 15,
    condition: "hour >= 23",
  },
  {
    id: "early-bird",
    title: "Early Bird",
    description: "Study before 7 AM",
    emoji: "🐦",
    category: "explorer",
    xpReward: 15,
    condition: "hour < 7",
  },
];

interface AchievementStore {
  unlockedIds: string[];
  dailyGoalCount: number;
  gamesPlayed: string[];
  lastChecked: string;

  unlock: (id: string) => void;
  isUnlocked: (id: string) => boolean;
  checkAchievements: (stats: AchievementStats) => void;
  recordGamePlayed: (gameId: string) => void;
  incrementDailyGoalCount: () => void;
  getAll: () => (Achievement & { unlocked: boolean })[];
  getProgress: () => { unlocked: number; total: number; percent: number };
}

export interface AchievementStats {
  totalLessons: number;
  completedModules: number;
  currentStreak: number;
  totalXP: number;
  completedChallenges: number;
  comebackBonusAvailable: boolean;
}

export const useAchievementStore = create<AchievementStore>()(
  persist(
    (set, get) => ({
      unlockedIds: [],
      dailyGoalCount: 0,
      gamesPlayed: [],
      lastChecked: "",

      unlock: (id) => {
        if (get().unlockedIds.includes(id)) return;
        const achievement = ACHIEVEMENTS.find((a) => a.id === id);
        if (!achievement) return;
        set((s) => ({ unlockedIds: [...s.unlockedIds, id] }));
        celebrate({
          type: "achievement",
          title: `${achievement.emoji} ${achievement.title}`,
          subtitle: achievement.description,
          value:
            achievement.xpReward > 0
              ? `+${achievement.xpReward} XP`
              : "Unlocked!",
        });
        hapticCelebrate();
      },

      isUnlocked: (id) => get().unlockedIds.includes(id),

      recordGamePlayed: (gameId) => {
        set((s) => {
          if (s.gamesPlayed.includes(gameId)) return s;
          return { gamesPlayed: [...s.gamesPlayed, gameId] };
        });
      },

      incrementDailyGoalCount: () => {
        set((s) => ({ dailyGoalCount: s.dailyGoalCount + 1 }));
      },

      checkAchievements: (stats) => {
        const { unlockedIds, gamesPlayed, dailyGoalCount } = get();
        const unlock = get().unlock;
        const hour = new Date().getHours();

        const checks: [string, boolean][] = [
          ["first-lesson", stats.totalLessons >= 1],
          ["five-lessons", stats.totalLessons >= 5],
          ["ten-lessons", stats.totalLessons >= 10],
          ["all-lessons", stats.totalLessons >= 26],
          ["first-module", stats.completedModules >= 1],
          ["half-modules", stats.completedModules >= 4],
          ["streak-3", stats.currentStreak >= 3],
          ["streak-7", stats.currentStreak >= 7],
          ["streak-14", stats.currentStreak >= 14],
          ["streak-30", stats.currentStreak >= 30],
          ["xp-100", stats.totalXP >= 100],
          ["xp-500", stats.totalXP >= 500],
          ["xp-1000", stats.totalXP >= 1000],
          ["xp-5000", stats.totalXP >= 5000],
          ["first-game", gamesPlayed.length >= 1],
          ["five-games", gamesPlayed.length >= 5],
          ["first-challenge", stats.completedChallenges >= 1],
          ["daily-goal-5", dailyGoalCount >= 5],
          ["comeback", stats.comebackBonusAvailable],
          ["night-owl", hour >= 23],
          ["early-bird", hour < 7],
        ];

        for (const [id, met] of checks) {
          if (met && !unlockedIds.includes(id)) {
            unlock(id);
          }
        }
      },

      getAll: () => {
        const { unlockedIds } = get();
        return ACHIEVEMENTS.map((a) => ({
          ...a,
          unlocked: unlockedIds.includes(a.id),
        }));
      },

      getProgress: () => {
        const total = ACHIEVEMENTS.length;
        const unlocked = get().unlockedIds.length;
        return {
          unlocked,
          total,
          percent: Math.round((unlocked / total) * 100),
        };
      },
    }),
    { name: "aicademy-achievements", skipHydration: true },
  ),
);

export { ACHIEVEMENTS };
