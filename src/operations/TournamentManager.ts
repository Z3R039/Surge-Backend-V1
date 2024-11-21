import { Entity, Column } from "typeorm";

@Entity()
export class Tournament {
    @Column({ primary: true })
    id: string;

    @Column()
    name: string;

    @Column()
    startTime: Date;

    @Column()
    endTime: Date;

    @Column("json")
    rules: any;

    @Column("json")
    scoring: any;

    @Column("json")
    prizes: any;
}

export class TournamentManager {
    static async createTournament(tournamentData: Partial<Tournament>) {
        const repo = getRepository(Tournament);
        const tournament = repo.create(tournamentData);
        return await repo.save(tournament);
    }

    static async getActiveTournaments() {
        const repo = getRepository(Tournament);
        const now = new Date();
        
        return await repo.find({
            where: {
                startTime: LessThan(now),
                endTime: MoreThan(now)
            }
        });
    }
} 