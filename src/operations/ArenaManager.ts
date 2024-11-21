import { Profile } from "../types/profilesdefs";

export class ArenaManager {
    static readonly DIVISION_THRESHOLDS = {
        OPEN: 0,
        CONTENDER: 1500,
        CHAMPION: 3000
    };

    static async updateArenaPoints(profile: Profile, pointsEarned: number) {
        if (!profile.stats) {
            profile.stats = {};
        }

        profile.stats.arena_points = (profile.stats.arena_points || 0) + pointsEarned;
        
        // Update division if needed
        profile.stats.arena_division = this.calculateDivision(profile.stats.arena_points);
        
        await profile.save();
    }

    private static calculateDivision(points: number): string {
        if (points >= this.DIVISION_THRESHOLDS.CHAMPION) return "CHAMPION";
        if (points >= this.DIVISION_THRESHOLDS.CONTENDER) return "CONTENDER";
        return "OPEN";
    }
} 