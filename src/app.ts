import dotenv from 'dotenv'

import express from 'express'
import cors from 'cors'

import { game_parser } from './game_parser/game_parser'

const res = dotenv.config();
if (res.error) {
    throw res.error;
}

const host: string = process.env.MORDHAU_RCON_HOST ?? "";
const port: number = parseInt(process.env.MORDHAU_RCON_PORT ?? "");
const password: string = process.env.MORDHAU_RCON_PASSWORD ?? "";

const red_team: string = process.env.MORDHAU_RED_TEAM_NAME ?? "";
const blue_team: string = process.env.MORDHAU_BLUE_TEAM_NAME ?? "";

const app = express().use(cors());
app.use(cors());
app.get("/data", (_, res) => {
    res.json({
        show_hud: true,
        hud: game_p.cur_state
    });
});

const rcon_options = {
    host: host,
    port: port,
    password: password,
    timeout: 30000
};
const game_p: game_parser = game_parser.make_game_parser(rcon_options).setup();
game_p.cur_state.red_team = red_team;
game_p.cur_state.blue_team = blue_team;

app.listen(8000);

// TODO: logging setup
// TODO: try to export all rcon messages to log file
// TODO: mock rcon class for testing with real data logs
// TODO: set starting score with env vars
// TODO: teardown method for all classes
