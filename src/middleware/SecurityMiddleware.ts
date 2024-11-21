import { Context } from 'hono';
import { SecurityManager } from '../services/SecurityManager';

export async function securityMiddleware(c: Context, next: () => Promise<void>) {
    const token = c.req.header('authorization')?.split(' ')[1];
    
    if (!token) {
        return c.json({ error: 'No token provided' }, 401);
    }

    if (!SecurityManager.validateSession(token)) {
        return c.json({ error: 'Invalid or expired session' }, 401);
    }

    // Attach session info to context
    const sessionInfo = SecurityManager.getSessionInfo(token);
    if (sessionInfo) {
        c.set('session', sessionInfo);
    }

    await next();
} 