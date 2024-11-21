import { Profile } from "../types/profilesdefs";

interface Hero {
    id: string;
    name: string;
    rarity: HeroRarity;
    level: number;
    xp: number;
    perks: string[];
}

enum HeroRarity {
    COMMON = "common",
    UNCOMMON = "uncommon",
    RARE = "rare",
    EPIC = "epic",
    LEGENDARY = "legendary",
    MYTHIC = "mythic"
}

export class HeroManager {
    static async levelUpHero(profile: Profile, heroId: string, xpAmount: number) {
        if (!profile.items || !profile.items[`hero_${heroId}`]) return null;

        const hero = profile.items[`hero_${heroId}`] as Hero;
        hero.xp += xpAmount;

        // Calculate new level based on XP
        const newLevel = Math.floor(hero.xp / 1000) + 1;
        if (newLevel > hero.level) {
            hero.level = newLevel;
            // Unlock new perks based on level
            this.updateHeroPerks(hero);
        }

        await profile.save();
        return hero;
    }

    static async evolveHero(profile: Profile, heroId: string): Promise<boolean> {
        if (!profile.items || !profile.items[`hero_${heroId}`]) return false;

        const hero = profile.items[`hero_${heroId}`] as Hero;
        const currentRarityIndex = Object.values(HeroRarity).indexOf(hero.rarity);
        
        if (currentRarityIndex < Object.values(HeroRarity).length - 1) {
            hero.rarity = Object.values(HeroRarity)[currentRarityIndex + 1];
            await profile.save();
            return true;
        }

        return false;
    }

    private static updateHeroPerks(hero: Hero) {
        // Add new perks based on level
        const availablePerks = [
            "increased_damage",
            "health_boost",
            "shield_regen",
            "ability_damage",
            "movement_speed"
        ];

        const perksCount = Math.min(Math.floor(hero.level / 10), availablePerks.length);
        hero.perks = availablePerks.slice(0, perksCount);
    }
} 