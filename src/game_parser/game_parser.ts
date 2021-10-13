import { rcon_parser, match_state } from '../rcon_parser/rcon_parser'

export enum gamemode {
    skirmish,
    hardpoint,
    other
}

export interface game_state {
    red_team: string;
    blue_team: string;
    red_score: number;
    blue_score: number;
    gamemode: gamemode;
}

const points_win_game = {
    [gamemode.skirmish]: 7,
    [gamemode.hardpoint]: 150,
    [gamemode.other]: 0
};

export class game_parser {
    rcon: rcon_parser;

    cur_state: game_state = {
        red_team: "",
        blue_team: "",
        red_score: 0,
        blue_score: 0,
        gamemode: gamemode.other
    };

    score_win_set: number = 3;

    constructor(rcon_parser: rcon_parser) {
        this.rcon = rcon_parser;
    }

    public async register() {
        this.rcon.on("scorefeed", (team: number, score: number) => this.handle_scorefeed(team, score));
        this.rcon.on("matchstate",
            (map_name: string, gamemode: string) => this.handle_matchstate(map_name, gamemode));

        this.rcon.getGameInfo()
            .then((state: match_state) => this.handle_matchstate(state.Map, state.GameMode));
    }

    public deregsiter() {
        // TODO
    }

    private handle_scorefeed(team: number, score: number) {
        if (this.cur_state.gamemode != gamemode.other) {
            const points = points_win_game[this.cur_state.gamemode];
            if (score >= points) {
                const team_score = team == 0 ? "red_score" : "blue_score";
                ++this.cur_state[team_score];
            }
        }
    }

    private handle_matchstate(map_name: string, gamemode_string: string) {
        // determine gamemode
        if (gamemode_string == "Skirmish") {
            this.cur_state.gamemode = gamemode.skirmish;
        } else {
            if (gamemode_string == "Team Deathmatch" && map_name != "Moshpit") {
                this.cur_state.gamemode = gamemode.hardpoint;
            } else {
                this.cur_state.gamemode = gamemode.other;
            }
        }
    }
}
