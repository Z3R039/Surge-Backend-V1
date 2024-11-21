import { GameServerInfo, GameMode, ServerStatus } from "./GameServerManager";
import { logger } from "../index";

interface RegionStats {
    activeServers: number;
    totalPlayers: number;
    availableSlots: number;
}

export class ServerClusterManager {
    private static regionStats: Map<string, RegionStats> = new Map();
    private static serverConfigs: any[] = [];

    static initialize(configs: any[]) {
        this.serverConfigs = configs;
        this.initializeRegionStats();
    }

    private static initializeRegionStats() {
        const regions = new Set(this.serverConfigs.map(config => config.region));
        regions.forEach(region => {
            this.regionStats.set(region, {
                activeServers: 0,
                totalPlayers: 0,
                availableSlots: 0
            });
        });
    }

    static async findOptimalServer(gameMode: GameMode, preferredRegion?: string): Promise<string | null> {
        // First try preferred region
        if (preferredRegion) {
            const server = this.findServerInRegion(gameMode, preferredRegion);
            if (server) return server;
        }

        // Try all regions if preferred not available
        for (const config of this.serverConfigs) {
            if (config.modes.includes(gameMode)) {
                const server = this.findServerInRegion(gameMode, config.region);
                if (server) return server;
            }
        }

        // If no server found, try to start a new one
        return await this.startNewServer(gameMode, preferredRegion);
    }

    private static findServerInRegion(gameMode: GameMode, region: string): string | null {
        const availableConfigs = this.serverConfigs.filter(config => 
            config.region === region && 
            config.modes.includes(gameMode)
        );

        for (const config of availableConfigs) {
            // Check if server has capacity
            const stats = this.regionStats.get(region);
            if (stats && stats.availableSlots > 0) {
                return config.name;
            }
        }

        return null;
    }

    private static async startNewServer(gameMode: GameMode, preferredRegion?: string): Promise<string | null> {
        const eligibleConfigs = this.serverConfigs.filter(config => 
            config.modes.includes(gameMode) &&
            (!preferredRegion || config.region === preferredRegion)
        );

        if (eligibleConfigs.length === 0) return null;

        // Select the region with least load
        const selectedConfig = eligibleConfigs.reduce((prev, curr) => {
            const prevStats = this.regionStats.get(prev.region);
            const currStats = this.regionStats.get(curr.region);
            
            if (!prevStats || !currStats) return prev;
            
            return prevStats.totalPlayers < currStats.totalPlayers ? prev : curr;
        });

        try {
            // Start new server using config
            logger.info(`Starting new server in ${selectedConfig.region} for ${gameMode}`);
            // Implementation of server startup logic here
            return selectedConfig.name;
        } catch (error) {
            logger.error(`Failed to start new server: ${error}`);
            return null;
        }
    }

    static updateRegionStats(region: string, serverInfo: GameServerInfo) {
        const stats = this.regionStats.get(region);
        if (!stats) return;

        stats.totalPlayers += serverInfo.currentPlayers;
        stats.availableSlots += (serverInfo.maxPlayers - serverInfo.currentPlayers);
        
        if (serverInfo.status === ServerStatus.AVAILABLE) {
            stats.activeServers++;
        }
    }

    static getRegionStats(): Map<string, RegionStats> {
        return this.regionStats;
    }

    static getServerConfigs(): any[] {
        return this.serverConfigs;
    }
} 