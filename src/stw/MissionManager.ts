import { Profile } from "../types/profilesdefs";
import { randomUUID } from "crypto";

interface STWMission {
    id: string;
    name: string;
    level: number;
    rewards: STWRewards;
    modifiers: string[];
    type: STWMissionType;
    expiresAt: Date;
}

interface STWRewards {
    xp: number;
    gold: number;
    vbucks?: number;
    items?: STWItem[];
}

interface STWItem {
    id: string;
    quantity: number;
    tier: number;
}

enum STWMissionType {
    FIGHT_STORM = "fight_the_storm",
    RETRIEVE_DATA = "retrieve_the_data",
    RESCUE_SURVIVORS = "rescue_the_survivors",
    ELIMINATE_HUSKS = "eliminate_and_collect",
    DEFEND_ATLAS = "atlas",
    RIDE_LIGHTNING = "ride_the_lightning"
}

export class MissionManager {
    private static missions: Map<string, STWMission> = new Map();
    private static readonly MISSION_ROTATION = 24 * 60 * 60 * 1000; // 24 hours

    static initialize() {
        this.generateMissions();
        setInterval(() => this.generateMissions(), this.MISSION_ROTATION);
    }

    static async generateMissions() {
        this.missions.clear();
        
        // Generate regular missions
        for (let i = 0; i < 10; i++) {
            const mission = this.createRandomMission();
            this.missions.set(mission.id, mission);
        }

        // Generate special vbucks mission (20% chance)
        if (Math.random() < 0.2) {
            const vbucksMission = this.createVBucksMission();
            this.missions.set(vbucksMission.id, vbucksMission);
        }
    }

    private static createRandomMission(): STWMission {
        return {
            id: randomUUID(),
            name: `Mission ${Math.floor(Math.random() * 1000)}`,
            level: Math.floor(Math.random() * 140) + 1,
            rewards: {
                xp: Math.floor(Math.random() * 10000),
                gold: Math.floor(Math.random() * 200),
                items: this.generateRandomItems()
            },
            modifiers: this.getRandomModifiers(),
            type: this.getRandomMissionType(),
            expiresAt: new Date(Date.now() + this.MISSION_ROTATION)
        };
    }

    private static createVBucksMission(): STWMission {
        const mission = this.createRandomMission();
        mission.rewards.vbucks = Math.floor(Math.random() * 4) * 25 + 25; // 25-100 vbucks
        return mission;
    }

    static async completeMission(profile: Profile, missionId: string): Promise<STWRewards | null> {
        const mission = this.missions.get(missionId);
        if (!mission) return null;

        // Grant rewards
        if (!profile.items) profile.items = {};
        if (!profile.stats) profile.stats = {};

        // Add XP
        profile.stats.stw_xp = (profile.stats.stw_xp || 0) + mission.rewards.xp;

        // Add gold
        profile.items.stw_gold = (profile.items.stw_gold || 0) + mission.rewards.gold;

        // Add vbucks if any
        if (mission.rewards.vbucks) {
            profile.items.currency_mtx = (profile.items.currency_mtx || 0) + mission.rewards.vbucks;
        }

        // Add items
        if (mission.rewards.items) {
            for (const item of mission.rewards.items) {
                const itemKey = `stw_item_${item.id}`;
                profile.items[itemKey] = (profile.items[itemKey] || 0) + item.quantity;
            }
        }

        await profile.save();
        return mission.rewards;
    }

    private static generateRandomItems(): STWItem[] {
        const items = [];
        const numItems = Math.floor(Math.random() * 3) + 1;
        
        for (let i = 0; i < numItems; i++) {
            items.push({
                id: `item_${Math.floor(Math.random() * 1000)}`,
                quantity: Math.floor(Math.random() * 10) + 1,
                tier: Math.floor(Math.random() * 5) + 1
            });
        }
        
        return items;
    }

    private static getRandomModifiers(): string[] {
        const allModifiers = [
            "healing_deathburst",
            "trap_vulnerable",
            "metal_corrosion",
            "wall_weakening",
            "slowing_pools",
            "exploding_deathbomb"
        ];
        
        return allModifiers
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.floor(Math.random() * 3) + 1);
    }

    private static getRandomMissionType(): STWMissionType {
        const types = Object.values(STWMissionType);
        return types[Math.floor(Math.random() * types.length)];
    }

    static getCurrentMissions(): STWMission[] {
        return Array.from(this.missions.values());
    }
} 