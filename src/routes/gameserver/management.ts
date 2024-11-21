import { Hono } from "hono";
import { Variables } from "../../index";
import { GameServerManager } from "../../gameserver/GameServerManager";
import { GameServerConfig } from "../../config/GameServerConfig";
import { spawn } from "child_process";
import { logger } from "../../index";

const app = new Hono<{ Variables: Variables }>();

// Add server template
app.post("/api/gameserver/templates", async (c) => {
    const template = await c.req.json();
    GameServerConfig.addTemplate(template);
    return c.json({ success: true });
});

// Get all server templates
app.get("/api/gameserver/templates", async (c) => {
    const templates = GameServerConfig.getAllTemplates();
    return c.json(templates);
});

// Launch new game server from template
app.post("/api/gameserver/launch", async (c) => {
    const { templateName } = await c.req.json();
    const template = GameServerConfig.getTemplate(templateName);
    
    if (!template) {
        return c.json({ error: "Template not found" }, 404);
    }

    try {
        // Launch the game server process
        const process = spawn(template.command, template.args);
        
        // Log process output
        process.stdout.on('data', (data) => {
            logger.info(`GameServer output: ${data}`);
        });

        process.stderr.on('data', (data) => {
            logger.error(`GameServer error: ${data}`);
        });

        // Wait for server to register itself
        const timeout = setTimeout(() => {
            process.kill();
            return c.json({ error: "Server registration timeout" }, 408);
        }, 30000);

        // Wait for server to register
        const checkInterval = setInterval(async () => {
            const servers = await GameServerManager.getServersByTemplate(templateName);
            if (servers.length > 0) {
                clearTimeout(timeout);
                clearInterval(checkInterval);
                return c.json({ success: true, serverId: servers[0].id });
            }
        }, 1000);

    } catch (error) {
        logger.error(`Failed to launch game server: ${error}`);
        return c.json({ error: "Failed to launch server" }, 500);
    }
});

// Stop game server
app.post("/api/gameserver/:serverId/stop", async (c) => {
    const { serverId } = c.req.param();
    const success = await GameServerManager.stopServer(serverId);
    return c.json({ success });
});

// Get servers by template
app.get("/api/gameserver/template/:templateName", async (c) => {
    const { templateName } = c.req.param();
    const servers = await GameServerManager.getServersByTemplate(templateName);
    return c.json(servers);
});

export default app; 