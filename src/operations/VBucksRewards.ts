import { Profile } from "../types/profilesdefs";

export class VBucksRewards {
    static async grantVbucksForKill(profile: Profile, amount: number = 5) {
        if (!profile.items) return;
        
        // Add vbucks to profile
        profile.items.currency_mtx = (profile.items.currency_mtx || 0) + amount;
        
        // Save changes
        await profile.save();
    }

    static async grantVbucksForWin(profile: Profile, amount: number = 50) {
        if (!profile.items) return;
        
        // Add victory vbucks
        profile.items.currency_mtx = (profile.items.currency_mtx || 0) + amount;
        
        await profile.save();
    }
} 