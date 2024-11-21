import { Profile } from "../types/profilesdefs";
import { logger } from "../index";
import { GameServerConfig } from "../../config/GameServerConfig";
import { ServerClusterManager } from "./ServerClusterManager";
import { GameModeAssigner } from "./GameModeAssigner";

interface GameServerInfo {
    id: string;
    host: string;
    port: number;
    maxPlayers: number;
    currentPlayers: number;
    gameMode: GameMode;
    status: ServerStatus;
    region: string;
}

interface MatchmakingTicket {
    ticketId: string;
    playerId: string;
    gameMode: GameMode;
    createdAt: Date;
    status: MatchStatus;
    serverAssigned?: string;
}

enum GameMode {
    BR_SOLO = "br_solo",
    BR_DUOS = "br_duos",
    BR_SQUADS = "br_squads",
    LATE_GAME = "late_game",
    STW = "save_the_world"
}

enum ServerStatus {
    AVAILABLE = "available",
    FULL = "full",
    IN_GAME = "in_game",
    RESTARTING = "restarting"
}

enum MatchStatus {
    QUEUED = "queued",
    MATCHING = "matching",
    READY = "ready",
    FAILED = "failed"
}

export class GameServerManager {
    private static servers: Map<string, GameServerInfo> = new Map();
    private static matchmakingQueue: Map<string, MatchmakingTicket> = new Map();
    private static readonly MATCHMAKING_TIMEOUT = 30000; // 30 seconds

    static async registerServer(serverInfo: GameServerInfo): Promise<boolean> {
        try {
            // If no game mode specified, auto-assign one
            if (!serverInfo.gameMode) {
                serverInfo.gameMode = await GameModeAssigner.suggestGameMode(serverInfo.region);
                logger.info(`Auto-assigned game mode ${serverInfo.gameMode} to server ${serverInfo.id}`);
            }

            this.servers.set(serverInfo.id, serverInfo);
            ServerClusterManager.updateRegionStats(serverInfo.region, serverInfo);
            
            // Update game mode stats
            const modeServers = Array.from(this.servers.values())
                .filter(s => s.gameMode === serverInfo.gameMode);
            const queueLength = Array.from(this.matchmakingQueue.values())
                .filter(t => t.gameMode === serverInfo.gameMode).length;
            
            GameModeAssigner.updateStats(
                serverInfo.gameMode,
                modeServers.length,
                queueLength,
                this.calculateAverageWaitTime(serverInfo.gameMode)
            );

            logger.info(`Registered game server: ${serverInfo.id}`);
            return true;
        } catch (error) {
            logger.error(`Failed to register server: ${error}`);
            return false;
        }
    }

    static async findMatch(profile: Profile, gameMode: GameMode): Promise<MatchmakingTicket> {
        const ticket: MatchmakingTicket = {
            ticketId: `ticket_${Date.now()}_${profile.accountId}`,
            playerId: profile.accountId,
            gameMode,
            createdAt: new Date(),
            status: MatchStatus.QUEUED
        };

        this.matchmakingQueue.set(ticket.ticketId, ticket);
        
        // Find optimal server using cluster manager
        const serverId = await ServerClusterManager.findOptimalServer(
            gameMode,
            profile.settings?.preferredRegion
        );

        if (serverId) {
            ticket.serverAssigned = serverId;
            ticket.status = MatchStatus.READY;
        } else {
            ticket.status = MatchStatus.FAILED;
        }

        return ticket;
    }

    static async getServerInfo(serverId: string): Promise<GameServerInfo | null> {
        return this.servers.get(serverId) || null;
    }

    static async getMatchStatus(ticketId: string): Promise<MatchmakingTicket | null> {
        return this.matchmakingQueue.get(ticketId) || null;
    }

    static async updateServerStatus(serverId: string, status: ServerStatus): Promise<boolean> {
        const server = this.servers.get(serverId);
        if (!server) return false;

        server.status = status;
        return true;
    }

    static async getServersByTemplate(templateName: string): Promise<GameServerInfo[]> {
        const template = GameServerConfig.getTemplate(templateName);
        if (!template) return [];

        return Array.from(this.servers.values()).filter(server => 
            server.gameMode === template.gameMode && 
            server.region === template.region
        );
    }

    static async stopServer(serverId: string): Promise<boolean> {
        const server = this.servers.get(serverId);
        if (!server) return false;

        try {
            // Send shutdown signal to server
            server.status = ServerStatus.RESTARTING;
            
            // Remove from active servers
            this.servers.delete(serverId);
            
            return true;
        } catch (error) {
            logger.error(`Failed to stop server ${serverId}: ${error}`);
            return false;
        }
    }

    static async scaleServers(templateName: string, targetCount: number): Promise<boolean> {
        const currentServers = await this.getServersByTemplate(templateName);
        const template = GameServerConfig.getTemplate(templateName);
        
        if (!template) return false;

        const difference = targetCount - currentServers.length;

        if (difference > 0) {
            // Launch more servers
            for (let i = 0; i < difference; i++) {
                // Launch new server using template
                // Implementation depends on your deployment method
            }
        } else if (difference < 0) {
            // Stop excess servers
            const serversToStop = currentServers.slice(0, Math.abs(difference));
            for (const server of serversToStop) {
                await this.stopServer(server.id);
            }
        }

        return true;
    }

    private static calculateAverageWaitTime(gameMode: GameMode): number {
        const tickets = Array.from(this.matchmakingQueue.values())
            .filter(t => t.gameMode === gameMode);
        
        if (tickets.length === 0) return 0;

        const totalWaitTime = tickets.reduce((sum, ticket) => {
            return sum + (Date.now() - ticket.createdAt.getTime());
        }, 0);

        return totalWaitTime / tickets.length;
    }
} 