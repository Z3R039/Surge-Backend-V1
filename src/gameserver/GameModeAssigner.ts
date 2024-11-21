import { GameMode } from "./GameServerManager";
import { logger } from "../index";

interface GameModeStats {
    activeServers: number;
    queuedPlayers: number;
    averageWaitTime: number;
}

export class GameModeAssigner {
    private static gameModeStats: Map<GameMode, GameModeStats> = new Map();
    private static readonly TARGET_WAIT_TIME = 30000; // 30 seconds
    private static readonly MIN_SERVERS_PER_MODE = 1;

    static initialize() {
        // Initialize stats for all game modes
        Object.values(GameMode).forEach(mode => {
            this.gameModeStats.set(mode, {
                activeServers: 0,
                queuedPlayers: 0,
                averageWaitTime: 0
            });
        });

        // Start periodic optimization
        setInterval(() => this.optimizeGameModes(), 60000); // Every minute
    }

    static async suggestGameMode(region: string): Promise<GameMode> {
        // Get current stats
        const stats = Array.from(this.gameModeStats.entries());
        
        // Calculate demand score for each mode
        const scores = stats.map(([mode, stat]) => ({
            mode,
            score: this.calculateDemandScore(stat)
        }));

        // Sort by demand score
        scores.sort((a, b) => b.score - a.score);

        logger.info(`Game mode demand scores: ${JSON.stringify(scores)}`);
        
        return scores[0].mode;
    }

    private static calculateDemandScore(stats: GameModeStats): number {
        const waitTimeScore = stats.averageWaitTime / this.TARGET_WAIT_TIME;
        const queueScore = stats.queuedPlayers / (stats.activeServers || 1);
        
        return waitTimeScore + queueScore;
    }

    static updateStats(gameMode: GameMode, serverCount: number, queueLength: number, waitTime: number) {
        const stats = this.gameModeStats.get(gameMode);
        if (!stats) return;

        stats.activeServers = serverCount;
        stats.queuedPlayers = queueLength;
        stats.averageWaitTime = (stats.averageWaitTime + waitTime) / 2;
    }

    private static async optimizeGameModes() {
        const stats = Array.from(this.gameModeStats.entries());
        
        for (const [mode, stat] of stats) {
            // Ensure minimum servers per mode
            if (stat.activeServers < this.MIN_SERVERS_PER_MODE) {
                logger.info(`Mode ${mode} needs more servers. Current: ${stat.activeServers}`);
                // Signal need for more servers
                continue;
            }

            // Check if mode is overprovisioned
            if (stat.queuedPlayers === 0 && stat.activeServers > this.MIN_SERVERS_PER_MODE) {
                logger.info(`Mode ${mode} may be overprovisioned. Active servers: ${stat.activeServers}`);
                // Signal potential for server reduction
            }
        }
    }

    static getGameModeStats(): Map<GameMode, GameModeStats> {
        return this.gameModeStats;
    }
} 