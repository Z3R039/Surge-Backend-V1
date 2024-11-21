import { Hono } from "hono";
import { Variables } from "../../index";
import { MissionManager } from "../../stw/MissionManager";

const app = new Hono<{ Variables: Variables }>();

app.get("/api/stw/missions/current", async (c) => {
    const missions = MissionManager.getCurrentMissions();
    return c.json(missions);
});

app.post("/api/stw/missions/:missionId/complete", async (c) => {
    const { missionId } = c.req.param();
    const profile = c.get('profile');
    
    const rewards = await MissionManager.completeMission(profile, missionId);
    if (!rewards) {
        return c.json({ error: "Mission not found" }, 404);
    }
    
    return c.json({ success: true, rewards });
});

export default app; 