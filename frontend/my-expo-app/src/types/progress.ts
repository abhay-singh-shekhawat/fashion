export interface Progress {
  userId: string;
  points: number;
  level: number;
  totalScans: number;
  totalOutfitsRated: number;
  achievements: string[];
  currentStreak: number;
  joinedDate: string;
}

export interface Achievement {
  _id: string;
  userId: string;
  title: string;
  description: string;
  icon: string;
  pointsReward: number;
  unlockedAt: string;
}