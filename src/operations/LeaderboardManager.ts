import { LeaderboardEntry } from "../tables/Leaderboard";
import { getRepository } from "typeorm";

export class LeaderboardManager {
    static async updateStats(accountId: string, stats: Partial<LeaderboardEntry>) {
        const repo = getRepository(LeaderboardEntry);
        
        let entry = await repo.findOne({ where: { accountId }});
        if (!entry) {
            entry = repo.create({ accountId });
        }

        // Update stats
        Object.assign(entry, stats);
        await repo.save(entry);
    }

    static async getTopPlayers(limit: number = 100) {
        const repo = getRepository(LeaderboardEntry);
        return repo.find({
            order: { score: "DESC" },
            take: limit
        });
    }
} 