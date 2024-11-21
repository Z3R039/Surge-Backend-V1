import { ShopRotation } from "../types/shopdefs";
import { CatalogConfig } from "../config/catalog";

export class AutoShop {
    private static readonly ROTATION_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

    private static currentRotation: ShopRotation;

    static async initialize() {
        // Initial shop setup
        await this.rotateShop();
        
        // Set up daily rotation
        setInterval(() => this.rotateShop(), this.ROTATION_INTERVAL);
    }

    static async rotateShop() {
        const catalog = CatalogConfig.getRandomCatalog();
        this.currentRotation = {
            items: catalog.items,
            lastUpdate: new Date(),
            expiresAt: new Date(Date.now() + this.ROTATION_INTERVAL)
        };
    }

    static getCurrentShop(): ShopRotation {
        return this.currentRotation;
    }
} 