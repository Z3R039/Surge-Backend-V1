import { Hono } from "hono";
import { Variables } from "../../index";
import { GameServerManager } from "../../gameserver/GameServerManager";

const app = new Hono<{ Variables: Variables }>();

// Register game server
app.post("/api/gameserver/register", async (c) => {
    const serverInfo = await c.req.json();
    const success = await GameServerManager.registerServer(serverInfo);
    
    return c.json({ success });
});

// Get server status
app.get("/api/gameserver/:serverId", async (c) => {
    const { serverId } = c.req.param();
    const serverInfo = await GameServerManager.getServerInfo(serverId);
    
    if (!serverInfo) {
        return c.json({ error: "Server not found" }, 404);
    }
    
    return c.json(serverInfo);
});

// Update server status
app.put("/api/gameserver/:serverId/status", async (c) => {
    const { serverId } = c.req.param();
    const { status } = await c.req.json();
    
    const success = await GameServerManager.updateServerStatus(serverId, status);
    return c.json({ success });
});

// Find match
app.post("/api/gameserver/match", async (c) => {
    const profile = c.get('profile');
    const { gameMode } = await c.req.json();
    
    const ticket = await GameServerManager.findMatch(profile, gameMode);
    return c.json(ticket);
});

// Check match status
app.get("/api/gameserver/match/:ticketId", async (c) => {
    const { ticketId } = c.req.param();
    const status = await GameServerManager.getMatchStatus(ticketId);
    
    if (!status) {
        return c.json({ error: "Ticket not found" }, 404);
    }
    
    return c.json(status);
});

export default app; 