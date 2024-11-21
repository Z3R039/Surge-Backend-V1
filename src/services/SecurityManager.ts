import { randomBytes } from 'crypto';
import { Profile } from '../types/profilesdefs';

export interface SecuritySession {
    token: string;
    accountId: string;
    createdAt: Date;
    lastActive: Date;
    expiresAt: Date;
}

export class SecurityManager {
    private static sessions: Map<string, SecuritySession> = new Map();
    private static readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
    private static readonly CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
    
    static initialize() {
        // Start cleanup routine
        setInterval(() => this.cleanupSessions(), this.CLEANUP_INTERVAL);
    }

    static createSession(accountId: string): string {
        const token = randomBytes(32).toString('hex');
        const now = new Date();
        
        const session: SecuritySession = {
            token,
            accountId,
            createdAt: now,
            lastActive: now,
            expiresAt: new Date(now.getTime() + this.SESSION_DURATION)
        };

        this.sessions.set(token, session);
        return token;
    }

    static validateSession(token: string): boolean {
        const session = this.sessions.get(token);
        if (!session) return false;

        if (new Date() > session.expiresAt) {
            this.sessions.delete(token);
            return false;
        }

        // Update last active time
        session.lastActive = new Date();
        return true;
    }

    static getSessionInfo(token: string): SecuritySession | null {
        return this.sessions.get(token) || null;
    }

    private static cleanupSessions() {
        const now = new Date();
        for (const [token, session] of this.sessions.entries()) {
            if (now > session.expiresAt) {
                this.sessions.delete(token);
            }
        }
    }

    static getActiveSessionCount(): number {
        return this.sessions.size;
    }
} 