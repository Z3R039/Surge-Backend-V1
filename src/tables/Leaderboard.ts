import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class LeaderboardEntry {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    accountId: string;

    @Column()
    displayName: string;

    @Column({ default: 0 })
    wins: number;

    @Column({ default: 0 })
    kills: number;

    @Column({ default: 0 })
    matches: number;

    @Column({ default: 0 })
    score: number;
} 