import { SecuritySession } from '../services/SecurityManager';

declare module 'hono' {
    interface ContextVariableMap {
        session: SecuritySession;
    }
} 