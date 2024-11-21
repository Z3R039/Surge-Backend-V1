import { Profile } from "../types/profilesdefs";

interface SurvivorSquad {
    id: string;
    name: string;
    survivors: Survivor[];
    bonusType: SquadBonus;
}

interface Survivor {
    id: string;
    name: string;
    rarity: SurvivorRarity;
    personality: SurvivorPersonality;
    level: number;
    power: number;
}

enum SquadBonus {
    HEALTH = "health",
    SHIELD = "shield",
    DAMAGE = "damage",
    TRAP_DURABILITY = "trap_durability",
    ABILITY_DAMAGE = "ability_damage"
}

enum SurvivorRarity {
    COMMON = "common",
    UNCOMMON = "uncommon",
    RARE = "rare",
    EPIC = "epic",
    LEGENDARY = "legendary",
    MYTHIC = "mythic"
}

enum SurvivorPersonality {
    COOPERATIVE = "cooperative",
    ANALYTICAL = "analytical",
    PRAGMATIC = "pragmatic",
    COMPETITIVE = "competitive",
    ADVENTUROUS = "adventurous"
}

export class SurvivorManager {
    static async assignSurvivor(profile: Profile, squadId: string, survivorId: string, slot: number): Promise<boolean> {
        if (!profile.items) return false;

        const squad = profile.items[`squad_${squadId}`] as SurvivorSquad;
        const survivor = profile.items[`survivor_${survivorId}`] as Survivor;

        if (!squad || !survivor || slot >= 8) return false;

        squad.survivors[slot] = survivor;
        await profile.save();

        return true;
    }

    static calculateSquadPower(squad: SurvivorSquad): number {
        return squad.survivors.reduce((total, survivor) => {
            if (!survivor) return total;
            return total + survivor.power;
        }, 0);
    }

    static calculateTotalPower(profile: Profile): number {
        if (!profile.items) return 0;

        let totalPower = 0;
        for (const [key, value] of Object.entries(profile.items)) {
            if (key.startsWith('squad_')) {
                totalPower += this.calculateSquadPower(value as SurvivorSquad);
            }
        }

        return totalPower;
    }
} 