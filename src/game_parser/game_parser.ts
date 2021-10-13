import { rcon_parser } from '../rcon_parser/rcon_parser'

export enum gamemode {
    skirmish,
    hardpoint
}

export interface game_state {
    red_team: string;
    blue_team: string;
    red_score: number;
    blue_score: number;
}

const points_to_win: Record<gamemode, number> = {
    [gamemode.skirmish]: 7,
    [gamemode.hardpoint]: 150
};

export class game_parser {
    rcon: rcon_parser;

    red_team: string = "";
    blue_team: string = "";
    red_score: number = 0;
    blue_score: number = 0;

    constructor(rcon_parser: rcon_parser) {
        this.rcon = rcon_parser;
    }
}
