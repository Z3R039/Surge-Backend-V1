import { WebSocket } from "ws";
import { GameServerManager } from "./GameServerManager";
import { logger } from "../index";
import { config } from "../index";
import { randomBytes } from 'crypto';

interface AuthToken {
    token: string;
    createdAt: Date;
    expiresAt: Date;
}

export class GameServerSync {
    private static connections: Map<string, WebSocket> = new Map();
    private static authTokens: Map<string, AuthToken> = new Map();
    private static readonly TOKEN_DURATION = 24 * 60 * 60 * 1000; // 24 hours

    static initialize(port: number) {
        const wss = new WebSocket.Server({ port });

        // Generate initial auth token
        this.generateAuthToken();

        wss.on('connection', async (ws, req) => {
            try {
                // Auto-authenticate if from configured game server IP
                const clientIP = req.socket.remoteAddress;
                if (clientIP === config.gameserverHost) {
                    const token = this.generateAuthToken();
                    ws.send(JSON.stringify({
                        type: 'auth_token',
                        token: token.token
                    }));
                    logger.info(`Auto-authenticated game server from IP: ${clientIP}`);
                }

                ws.on('message', async (message) => {
                    try {
                        const data = JSON.parse(message.toString());
                        
                        switch (data.type) {
                            case 'register':
                                if (await this.validateConnection(data.token, req.socket.remoteAddress)) {
                                    await GameServerManager.registerServer(data.server);
                                    this.connections.set(data.server.id, ws);
                                    ws.send(JSON.stringify({
                                        type: 'register_success',
                                        serverId: data.server.id
                                    }));
                                } else {
                                    ws.close(1008, 'Invalid authentication');
                                }
                                break;

                            case 'status_update':
                                await GameServerManager.updateServerStatus(data.serverId, data.status);
                                break;

                            case 'player_count':
                                await GameServerManager.updatePlayerCount(data.serverId, data.count);
                                break;

                            case 'heartbeat':
                                ws.send(JSON.stringify({ 
                                    type: 'heartbeat_ack',
                                    timestamp: Date.now()
                                }));
                                break;
                        }
                    } catch (error) {
                        logger.error(`WebSocket message error: ${error}`);
                    }
                });

                ws.on('close', () => {
                    for (const [serverId, connection] of this.connections.entries()) {
                        if (connection === ws) {
                            this.connections.delete(serverId);
                            GameServerManager.handleServerDisconnect(serverId);
                            break;
                        }
                    }
                });

            } catch (error) {
                logger.error(`WebSocket connection error: ${error}`);
                ws.close(1011, 'Internal server error');
            }
        });

        // Cleanup expired tokens periodically
        setInterval(() => this.cleanupExpiredTokens(), 3600000); // Every hour
    }

    private static generateAuthToken(): AuthToken {
        const token = {
            token: randomBytes(32).toString('hex'),
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + this.TOKEN_DURATION)
        };

        this.authTokens.set(token.token, token);
        return token;
    }

    private static async validateConnection(token: string, ip: string): Promise<boolean> {
        // Auto-approve if from configured game server IP
        if (ip === config.gameserverHost) {
            return true;
        }

        // Check token validity
        const authToken = this.authTokens.get(token);
        if (!authToken) return false;

        if (Date.now() > authToken.expiresAt.getTime()) {
            this.authTokens.delete(token);
            return false;
        }

        return true;
    }

    private static cleanupExpiredTokens() {
        const now = Date.now();
        for (const [token, auth] of this.authTokens.entries()) {
            if (now > auth.expiresAt.getTime()) {
                this.authTokens.delete(token);
            }
        }
    }

    static broadcastToServer(serverId: string, message: any) {
        const connection = this.connections.get(serverId);
        if (connection) {
            connection.send(JSON.stringify(message));
        }
    }

    static getActiveConnections(): number {
        return this.connections.size;
    }
} 