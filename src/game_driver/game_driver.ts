import { rcon_parser, match_state } from '../rcon_parser/rcon_parser'
import { Rcon, RconOptions } from '../rcon/rcon'

export enum gamemode {
    skirmish,
    hardpoint,
    other
}

const points_win_game = {
    [gamemode.skirmish]: 7,
    [gamemode.hardpoint]: 150,
    [gamemode.other]: 0
};

export interface game_state {
    red_team: string;
    blue_team: string;
    red_score: number;
    blue_score: number;
}

export class game_driver {
    rcon_parser: rcon_parser;

    cur_state: game_state = {
        red_team: "",
        blue_team: "",
        red_score: 0,
        blue_score: 0,
    };
    cur_gamemode: gamemode = gamemode.other;

    score_win_set: number = 3;

    constructor(rcon_parser: rcon_parser) {
        this.rcon_parser = rcon_parser;
    }

    public register() {
        this.rcon_parser.on("scorefeed", (team: number, score: number) => this.handle_scorefeed(team, score));
        this.rcon_parser.on("matchstate",
            (map_name: string, gamemode: string) => this.handle_matchstate(map_name, gamemode));

        this.rcon_parser.getGameInfo()
            .then((state: match_state) => this.handle_matchstate(state.Map, state.GameMode));
    }

    public deregister() {
        // TODO
    }

    public setup() {
        this.rcon_parser.setup().then(() => {
            this.register();
        });
        return this;
    }

    private handle_scorefeed(team: number, score: number) {
        if (this.cur_gamemode != gamemode.other) {
            const points = points_win_game[this.cur_gamemode];
            if (score >= points) {
                const team_score = team == 0 ? "red_score" : "blue_score";
                if (this.cur_state[team_score] < this.score_win_set) {
                    ++this.cur_state[team_score];
                }
            }
        }
    }

    private handle_matchstate(map_name: string, gamemode_string: string) {
        // determine gamemode
        if (gamemode_string == "Skirmish") {
            this.cur_gamemode = gamemode.skirmish;
        } else {
            if (gamemode_string == "Team Deathmatch" && map_name != "Moshpit") {
                this.cur_gamemode = gamemode.hardpoint;
            } else {
                this.cur_gamemode = gamemode.other;
            }
        }
    }

    public static make_game_driver(rcon_options: RconOptions) {
        return new game_driver(new rcon_parser(new Rcon(rcon_options)));
    }
}
