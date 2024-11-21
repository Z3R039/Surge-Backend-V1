import { Hono } from "hono";
import { SecurityManager } from "../../services/SecurityManager";
import { Variables } from "../../index";

const app = new Hono<{ Variables: Variables }>();

app.post("/api/auth/login", async (c) => {
    const account = c.get('account');
    
    // Create security session
    const token = SecurityManager.createSession(account.id);
    
    return c.json({
        token,
        accountId: account.id,
        displayName: account.displayName,
        // Include any other account info you need
    });
});

export default app; 