import { Profile } from "../types/profilesdefs";
import { logger } from "../index";

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
            this.servers.set(serverInfo.id, serverInfo);
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
        
        // Start matchmaking process
        await this.processMatchmaking(ticket);
        
        return ticket;
    }

    private static async processMatchmaking(ticket: MatchmakingTicket) {
        ticket.status = MatchStatus.MATCHING;

        // Find available server
        const server = this.findAvailableServer(ticket.gameMode);
        if (!server) {
            ticket.status = MatchStatus.FAILED;
            return;
        }

        // Assign server
        ticket.serverAssigned = server.id;
        ticket.status = MatchStatus.READY;

        // Update server status
        server.currentPlayers++;
        if (server.currentPlayers >= server.maxPlayers) {
            server.status = ServerStatus.FULL;
        }

        // Clean up ticket after timeout
        setTimeout(() => {
            this.matchmakingQueue.delete(ticket.ticketId);
        }, this.MATCHMAKING_TIMEOUT);
    }

    private static findAvailableServer(gameMode: GameMode): GameServerInfo | null {
        for (const server of this.servers.values()) {
            if (server.gameMode === gameMode && 
                server.status === ServerStatus.AVAILABLE && 
                server.currentPlayers < server.maxPlayers) {
                return server;
            }
        }
        return null;
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
} 