import { Profile } from "../types/profilesdefs";
import { randomUUID } from "crypto";

interface StoryQuest {
    id: string;
    name: string;
    description: string;
    dialogue: DialogueEntry[];
    requirements: QuestRequirement[];
    rewards: StoryRewards;
    nextQuestId?: string;
    zone: StoryZone;
}

interface DialogueEntry {
    character: string;
    text: string;
    order: number;
    voicelineUrl?: string;
}

interface QuestRequirement {
    type: QuestRequirementType;
    target: string;
    amount: number;
    progress: number;
}

interface StoryRewards {
    xp: number;
    gold: number;
    vbucks?: number;
    heroes?: string[];
    items?: string[];
}

enum QuestRequirementType {
    COLLECT = "collect",
    ELIMINATE = "eliminate",
    EXPLORE = "explore",
    COMPLETE_MISSION = "complete_mission",
    DEFEND = "defend",
    BUILD = "build"
}

enum StoryZone {
    STONEWOOD = "stonewood",
    PLANKERTON = "plankerton",
    CANNY_VALLEY = "canny_valley",
    TWINE_PEAKS = "twine_peaks"
}

export class StorylineManager {
    private static quests: Map<string, StoryQuest> = new Map();
    private static readonly STORYLINES_PATH = "./data/storylines";

    static async initialize() {
        await this.loadStorylines();
    }

    private static async loadStorylines() {
        // In a real implementation, load from files or database
        this.quests.set("tutorial_1", {
            id: "tutorial_1",
            name: "Welcome to Homebase",
            description: "Meet your first survivors and learn about the storm.",
            dialogue: [
                {
                    character: "Ray",
                    text: "Commander! We need your help. The storm is everywhere!",
                    order: 1,
                    voicelineUrl: "audio/ray/welcome_1.mp3"
                },
                {
                    character: "Director",
                    text: "Welcome to Homebase. You're our last hope against the storm.",
                    order: 2
                }
            ],
            requirements: [
                {
                    type: QuestRequirementType.COMPLETE_MISSION,
                    target: "tutorial_mission",
                    amount: 1,
                    progress: 0
                }
            ],
            rewards: {
                xp: 1000,
                gold: 100,
                heroes: ["hero_starter_soldier"]
            },
            nextQuestId: "tutorial_2",
            zone: StoryZone.STONEWOOD
        });
    }

    static async getPlayerProgress(profile: Profile): Promise<string[]> {
        if (!profile.stats) profile.stats = {};
        if (!profile.stats.completed_quests) profile.stats.completed_quests = [];
        
        return profile.stats.completed_quests;
    }

    static async getCurrentQuest(profile: Profile): Promise<StoryQuest | null> {
        const completedQuests = await this.getPlayerProgress(profile);
        
        // Find the last completed quest
        const lastCompleted = completedQuests[completedQuests.length - 1];
        if (!lastCompleted) {
            // Return first quest if player hasn't started
            return this.quests.get("tutorial_1") || null;
        }

        // Get the next quest based on the last completed
        const lastQuest = this.quests.get(lastCompleted);
        if (lastQuest?.nextQuestId) {
            return this.quests.get(lastQuest.nextQuestId) || null;
        }

        return null;
    }

    static async updateQuestProgress(
        profile: Profile, 
        questId: string, 
        requirementType: QuestRequirementType, 
        target: string, 
        amount: number
    ): Promise<boolean> {
        const currentQuest = await this.getCurrentQuest(profile);
        if (!currentQuest || currentQuest.id !== questId) return false;

        const requirement = currentQuest.requirements.find(
            r => r.type === requirementType && r.target === target
        );

        if (!requirement) return false;

        requirement.progress += amount;
        
        // Check if quest is completed
        const isCompleted = currentQuest.requirements.every(
            r => r.progress >= r.amount
        );

        if (isCompleted) {
            await this.completeQuest(profile, currentQuest);
        }

        await profile.save();
        return isCompleted;
    }

    private static async completeQuest(profile: Profile, quest: StoryQuest) {
        if (!profile.stats) profile.stats = {};
        if (!profile.stats.completed_quests) profile.stats.completed_quests = [];
        if (!profile.items) profile.items = {};

        // Add to completed quests
        profile.stats.completed_quests.push(quest.id);

        // Grant rewards
        profile.items.currency_gold = (profile.items.currency_gold || 0) + quest.rewards.gold;
        profile.stats.stw_xp = (profile.stats.stw_xp || 0) + quest.rewards.xp;

        if (quest.rewards.vbucks) {
            profile.items.currency_mtx = (profile.items.currency_mtx || 0) + quest.rewards.vbucks;
        }

        if (quest.rewards.heroes) {
            for (const heroId of quest.rewards.heroes) {
                profile.items[`hero_${heroId}`] = {
                    id: heroId,
                    level: 1,
                    xp: 0,
                    rarity: "rare"
                };
            }
        }

        if (quest.rewards.items) {
            for (const itemId of quest.rewards.items) {
                profile.items[`item_${itemId}`] = (profile.items[`item_${itemId}`] || 0) + 1;
            }
        }
    }

    static getZoneProgress(profile: Profile): Map<StoryZone, number> {
        const progress = new Map<StoryZone, number>();
        const completedQuests = profile.stats?.completed_quests || [];

        // Initialize all zones to 0%
        Object.values(StoryZone).forEach(zone => progress.set(zone, 0));

        // Calculate progress for each zone
        completedQuests.forEach(questId => {
            const quest = this.quests.get(questId);
            if (quest) {
                const currentProgress = progress.get(quest.zone) || 0;
                progress.set(quest.zone, currentProgress + 1);
            }
        });

        // Convert to percentages
        progress.forEach((value, zone) => {
            const totalQuestsInZone = Array.from(this.quests.values())
                .filter(q => q.zone === zone).length;
            progress.set(zone, (value / totalQuestsInZone) * 100);
        });

        return progress;
    }
} 