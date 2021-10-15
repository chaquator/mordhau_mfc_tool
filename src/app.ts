import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import { game_driver } from './game_driver/game_driver'

const res = dotenv.config();
if (res.error) {
    throw res.error;
}

const rcon_host: string = process.env.MORDHAU_RCON_HOST ?? "";
const rcon_port: number = parseInt(process.env.MORDHAU_RCON_PORT ?? "");
const rcon_password: string = process.env.MORDHAU_RCON_PASSWORD ?? "";

const red_team: string = process.env.MORDHAU_RED_TEAM_NAME ?? "";
const blue_team: string = process.env.MORDHAU_BLUE_TEAM_NAME ?? "";

const express_port: number = parseInt(process.env.EXPRESS_PORT ?? "8080");

const game = game_driver.make_game_driver({
    host: rcon_host,
    port: rcon_port,
    password: rcon_password,
    timeout: 30000
}).setup();
game.cur_state.red_team = red_team;
game.cur_state.blue_team = blue_team;

const app = express().use(cors());
app.use(cors());
app.get("/data", (_, res) => {
    res.json({
        show_hud: true,
        hud: game.cur_state
    });
});

app.listen(express_port);

// TODO: logging setup
// TODO: try to export all rcon messages to log file
// TODO: mock rcon class for testing with real data logs
// TODO: set starting score with env vars
// TODO: teardown method for all classes
