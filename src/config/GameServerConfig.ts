import { GameMode } from "../gameserver/GameServerManager";

interface GameServerTemplate {
    name: string;
    gameMode: GameMode;
    maxPlayers: number;
    region: string;
    command: string;
    args: string[];
}

export class GameServerConfig {
    private static templates: Map<string, GameServerTemplate> = new Map();

    static initialize() {
        // Default templates
        this.addTemplate({
            name: "BR_Solo_EU",
            gameMode: GameMode.BR_SOLO,
            maxPlayers: 100,
            region: "EU",
            command: "gameserver",
            args: ["--mode", "br_solo", "--region", "eu"]
        });

        this.addTemplate({
            name: "STW_EU",
            gameMode: GameMode.STW,
            maxPlayers: 4,
            region: "EU",
            command: "gameserver",
            args: ["--mode", "stw", "--region", "eu"]
        });

        // Add more default templates as needed
    }

    static addTemplate(template: GameServerTemplate) {
        this.templates.set(template.name, template);
    }

    static getTemplate(name: string): GameServerTemplate | undefined {
        return this.templates.get(name);
    }

    static getAllTemplates(): GameServerTemplate[] {
        return Array.from(this.templates.values());
    }
} 