import { Hono } from "hono";
import { Variables } from "../../index";
import { StorylineManager } from "../../stw/StorylineManager";
import { QuestRequirementType } from "../../stw/StorylineManager";

const app = new Hono<{ Variables: Variables }>();

// Get current quest
app.get("/api/stw/storyline/current", async (c) => {
    const profile = c.get('profile');
    const currentQuest = await StorylineManager.getCurrentQuest(profile);
    
    return c.json(currentQuest || { error: "No active quest" });
});

// Get zone progress
app.get("/api/stw/storyline/progress", async (c) => {
    const profile = c.get('profile');
    const progress = StorylineManager.getZoneProgress(profile);
    
    return c.json(Object.fromEntries(progress));
});

// Update quest progress
app.post("/api/stw/storyline/progress", async (c) => {
    const profile = c.get('profile');
    const { questId, type, target, amount } = await c.req.json();
    
    const updated = await StorylineManager.updateQuestProgress(
        profile,
        questId,
        type as QuestRequirementType,
        target,
        amount
    );
    
    return c.json({ success: updated });
});

export default app; 